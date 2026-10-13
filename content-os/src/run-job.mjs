import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  initDatabase,
  createJob,
  updateJob,
  recordArtifact,
  latestArtifact,
  listArtifacts,
  saveSocialPosts
} from "./db.mjs";

const ROOT = path.resolve(new URL(".", import.meta.url).pathname, "..");
const [action, jobIdArg, triggerArg] = process.argv.slice(2);
const SUPPORTED = new Set(["research", "pipeline", "analytics"]);

if (!SUPPORTED.has(action)) {
  console.error("Usage: node src/run-job.mjs <research|pipeline|analytics> [existingJobId] [triggerSource]");
  process.exit(2);
}

const outputDirs = {
  research: path.join(ROOT, "data", "research"),
  content: path.join(ROOT, "data", "content"),
  distribution: path.join(ROOT, "data", "distribution"),
  analytics: path.join(ROOT, "data", "analytics"),
  reports: path.join(ROOT, "data", "reports")
};

async function filesByDate(dir) {
  await fs.mkdir(dir, { recursive: true });
  return (await fs.readdir(dir)).filter((name) => name.endsWith(".json")).sort();
}

async function latestFile(dir) {
  const files = await filesByDate(dir);
  if (!files.length) return null;
  const name = files[files.length - 1];
  return { name, path: path.join(dir, name), payload: JSON.parse(await fs.readFile(path.join(dir, name), "utf8")) };
}

async function persistLatest(kind, dir) {
  const latest = await latestFile(dir);
  if (!latest) return null;
  await recordArtifact(kind, kind + ":" + latest.name, latest.payload);
  if (kind === "distribution") await saveSocialPosts(latest.payload);
  return latest;
}

async function hydrateLatest(kind, destinationDir) {
  const saved = await latestArtifact(kind);
  if (!saved) return null;
  await fs.mkdir(destinationDir, { recursive: true });
  const name = saved.artifact_key.includes(":") ? saved.artifact_key.split(":").slice(1).join(":") : "latest.json";
  await fs.writeFile(path.join(destinationDir, name), JSON.stringify(saved.payload, null, 2) + "\n", "utf8");
  return saved;
}

async function hydrateHistory(kind, destinationDir, limit = 60) {
  const records = await listArtifacts(kind, limit);
  await fs.mkdir(destinationDir, { recursive: true });
  for (const record of records.reverse()) {
    const name = record.artifact_key.includes(":") ? record.artifact_key.split(":").slice(1).join(":") : record.artifact_key + ".json";
    await fs.writeFile(path.join(destinationDir, name), JSON.stringify(record.payload, null, 2) + "\n", "utf8");
  }
}

function runScript(script) {
  console.log("\n--- " + script + " ---");
  const proc = spawnSync(process.execPath, [path.join(ROOT, "src", script)], {
    cwd: ROOT,
    env: process.env,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
    timeout: 40 * 60 * 1000
  });
  if (proc.stdout) { fullLog += proc.stdout; process.stdout.write(proc.stdout); }
  if (proc.stderr) { fullLog += proc.stderr; process.stderr.write(proc.stderr); }
  if (proc.error) throw proc.error;
  if (proc.status !== 0) throw new Error(script + " exited with status " + proc.status);
}

async function persistReport() {
  const files = (await fs.readdir(outputDirs.reports).catch(() => [])).filter((name) => name.endsWith(".md")).sort();
  if (!files.length) return;
  const name = files[files.length - 1];
  const markdown = await fs.readFile(path.join(outputDirs.reports, name), "utf8");
  await recordArtifact("report", "report:" + name, { markdown });
}

await initDatabase();
let job;
if (jobIdArg && /^\d+$/.test(jobIdArg)) {
  job = { id: Number(jobIdArg) };
  await updateJob(job.id, { status: "running", summary: "Started " + action + " job." });
} else {
  job = await createJob(action, triggerArg || "scheduled");
}

let fullLog = "";
const originalLog = console.log;
const originalError = console.error;
console.log = (...args) => {
  const line = args.map(String).join(" ");
  fullLog += line + "\n";
  originalLog(...args);
};
console.error = (...args) => {
  const line = args.map(String).join(" ");
  fullLog += "ERROR: " + line + "\n";
  originalError(...args);
};

try {
  if (action === "research") {
    runScript("research.mjs");
    const latest = await persistLatest("research", outputDirs.research);
    await updateJob(job.id, { status: "succeeded", summary: "Research saved: " + (latest?.name || "snapshot"), logText: fullLog });
  }

  if (action === "pipeline") {
    await hydrateLatest("research", outputDirs.research);
    if (!(await latestFile(outputDirs.research))) {
      runScript("research.mjs");
      await persistLatest("research", outputDirs.research);
    }

    runScript("generate-content.mjs");
    await persistLatest("content", outputDirs.content);

    runScript("validate.mjs");

    runScript("render-video.mjs");
    await persistLatest("content", outputDirs.content);

    runScript("publish.mjs");
    await persistLatest("distribution", outputDirs.distribution);
    const latestContent = await latestArtifact("content");
    const count = latestContent?.payload?.items?.length || 0;
    await updateJob(job.id, {
      status: "succeeded",
      summary: "Generated " + count + " core ideas, rendered available video assets and refreshed the distribution queue.",
      logText: fullLog
    });
  }

  if (action === "analytics") {
    await hydrateHistory("analytics", outputDirs.analytics, 60);
    await hydrateLatest("learning-state", path.join(ROOT, "data", "learning"));
    const analyticsConfigured = Boolean(
      process.env.BUFFER_API_KEY
      && process.env.BUFFER_ORGANIZATION_ID
      && process.env.BUFFER_CHANNELS_JSON
    );
    if (analyticsConfigured) {
      runScript("analytics.mjs");
      await persistLatest("analytics", outputDirs.analytics);
    } else {
      console.log("Buffer analytics credentials are not configured. Skipping metric collection; existing history will remain unchanged.");
    }

    runScript("learn.mjs");
    const memPath = path.join(ROOT, "data", "learning", "creative-memory.json");
    const memory = JSON.parse(await fs.readFile(memPath, "utf8"));
    await recordArtifact("learning-state", "learning-state:creative-memory.json", memory);
    await persistReport();

    const summary = analyticsConfigured
      ? "Analytics snapshots and creative learning report updated."
      : "Metrics collection skipped because Buffer is not configured; the learning report was refreshed from existing history.";
    await updateJob(job.id, { status: "succeeded", summary, logText: fullLog });
  }
} catch (error) {
  fullLog += "\nFAILED: " + (error.stack || error.message || String(error)) + "\n";
  await updateJob(job.id, {
    status: "failed",
    summary: action + " failed.",
    logText: fullLog,
    errorText: String(error.message || error)
  }).catch(() => {});
  process.exitCode = 1;
} finally {
  await (await import("./db.mjs")).getPool().end().catch(() => {});
}
