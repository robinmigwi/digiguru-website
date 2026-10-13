import http from "node:http";
import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import {
  initDatabase,
  getPool,
  createJob,
  updateJob,
  dashboardStats,
  listJobs,
  getJob,
  listArtifacts,
  listSocialPosts,
  latestArtifact
} from "./db.mjs";

const ROOT = path.resolve(new URL(".", import.meta.url).pathname, "..");
const PORT = Number(process.env.PORT || 10000);
const DASHBOARD_USER = process.env.DASHBOARD_USER || "robin";
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || "";
const PUBLIC_DIR = path.join(ROOT, "public");

if (process.env.NODE_ENV === "production" && !DASHBOARD_PASSWORD) {
  throw new Error("DASHBOARD_PASSWORD must be set before running Content OS in production.");
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function authorized(req) {
  if (!DASHBOARD_PASSWORD) return process.env.NODE_ENV !== "production";
  const header = req.headers.authorization || "";
  if (!header.startsWith("Basic ")) return false;
  let decoded;
  try { decoded = Buffer.from(header.slice(6), "base64").toString("utf8"); } catch { return false; }
  const colon = decoded.indexOf(":");
  if (colon < 0) return false;
  return safeEqual(decoded.slice(0, colon), DASHBOARD_USER) && safeEqual(decoded.slice(colon + 1), DASHBOARD_PASSWORD);
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff"
  });
  res.end(JSON.stringify(payload));
}

async function bodyJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 16_384) throw new Error("Request body is too large.");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function simplifyArtifact(record, kind) {
  if (!record) return null;
  const payload = record.payload || {};
  if (kind === "research") {
    const opportunities = payload.opportunities;
    return {
      key: record.artifact_key,
      created_at: record.created_at,
      signal_count: payload.signal_count || 0,
      signals: (payload.signals || []).slice(0, 8),
      opportunities: Array.isArray(opportunities) ? opportunities : (opportunities?.items || [])
    };
  }
  if (kind === "content") {
    return {
      key: record.artifact_key,
      created_at: record.created_at,
      items: (payload.items || []).map((item) => ({
        id: item.id,
        title: item.title || item.idea,
        franchise: item.franchise,
        angle: item.angle,
        score: item.score,
        hook: item.hook,
        status: item.status,
        verification_required: Boolean(item.verification_required),
        publish_eligible: Boolean(item.publish_eligible),
        visual_format: item.visual_format,
        platform_variants: item.platform_variants || {},
        video_assets: item.video_assets || [],
        quality_notes: item.quality_notes || []
      }))
    };
  }
  if (kind === "report") {
    return { key: record.artifact_key, created_at: record.created_at, markdown: payload.markdown || "" };
  }
  return { key: record.artifact_key, created_at: record.created_at, payload };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", "http://localhost");

  if (url.pathname === "/healthz") {
    try {
      await getPool().query("SELECT 1");
      return sendJson(res, 200, { ok: true, service: "digiguru-content-os" });
    } catch (error) {
      return sendJson(res, 503, { ok: false, error: error.message });
    }
  }

  if (!authorized(req)) {
    res.writeHead(401, {
      "www-authenticate": 'Basic realm="DigiGuru Content OS", charset="UTF-8"',
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store"
    });
    return res.end("Authentication required.");
  }

  try {
    if (req.method === "GET" && url.pathname === "/") {
      const html = await fs.readFile(path.join(PUBLIC_DIR, "index.html"));
      res.writeHead(200, {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        "content-security-policy": "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data: https:; media-src https:; base-uri 'none'; frame-ancestors 'none'",
        "x-content-type-options": "nosniff",
        "referrer-policy": "same-origin"
      });
      return res.end(html);
    }

    if (req.method === "GET" && url.pathname === "/api/dashboard") {
      const [stats, jobs, research, content, posts, report] = await Promise.all([
        dashboardStats(),
        listJobs(12),
        latestArtifact("research"),
        latestArtifact("content"),
        listSocialPosts(40),
        latestArtifact("report")
      ]);
      return sendJson(res, 200, {
        service: "DigiGuru Content OS",
        now: new Date().toISOString(),
        stats,
        jobs,
        research: simplifyArtifact(research, "research"),
        content: simplifyArtifact(content, "content"),
        posts: posts.map((post) => ({
          id: post.post_key,
          idea_id: post.idea_id,
          platform: post.platform,
          status: post.status,
          scheduled_at: post.scheduled_at,
          updated_at: post.updated_at,
          payload: post.payload
        })),
        report: simplifyArtifact(report, "report")
      });
    }

    if (req.method === "GET" && url.pathname === "/api/jobs") {
      return sendJson(res, 200, { jobs: await listJobs(Number(url.searchParams.get("limit")) || 30) });
    }

    const jobMatch = url.pathname.match(/^\/api\/jobs\/(\d+)$/);
    if (req.method === "GET" && jobMatch) {
      const job = await getJob(Number(jobMatch[1]));
      return job ? sendJson(res, 200, { job }) : sendJson(res, 404, { error: "Job not found." });
    }

    if (req.method === "POST" && url.pathname === "/api/jobs") {
      const body = await bodyJson(req);
      const action = String(body.type || "");
      if (!["research", "pipeline", "analytics"].includes(action)) {
        return sendJson(res, 400, { error: "Choose research, pipeline or analytics." });
      }
      const recent = (await listJobs(20)).find((job) => job.job_type === action && job.status === "running");
      if (recent) return sendJson(res, 409, { error: action + " is already running.", job: recent });

      const job = await createJob(action, "dashboard");
      const child = spawn(process.execPath, [path.join(ROOT, "src", "run-job.mjs"), action, String(job.id), "dashboard"], {
        cwd: ROOT,
        env: process.env,
        detached: true,
        stdio: "ignore"
      });
      child.on("error", (error) => {
        updateJob(job.id, { status: "failed", summary: "Could not start job.", errorText: error.message }).catch(() => {});
      });
      child.unref();
      return sendJson(res, 202, {
        accepted: true,
        job_id: job.id,
        message: action + " job started. Refresh this dashboard for progress.",
        pid: child.pid || null
      });
    }

    if (req.method === "GET" && url.pathname === "/api/ready") {
      await getPool().query("SELECT 1");
      return sendJson(res, 200, { ready: true });
    }

    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    return res.end("Not found.");
  } catch (error) {
    console.error("Request failed:", error);
    return sendJson(res, 500, { error: "The request could not be completed.", detail: process.env.NODE_ENV === "production" ? undefined : error.message });
  }
});

await initDatabase();
server.listen(PORT, "0.0.0.0", () => {
  console.log("DigiGuru Content OS dashboard listening on " + PORT);
});

async function shutdown() {
  server.close(async () => {
    try { await getPool().end(); } finally { process.exit(0); }
  });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
