import pg from "pg";

const { Pool } = pg;
let pool;

export function getPool() {
  if (pool) return pool;
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for the Render Content OS.");
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    max: Number(process.env.PG_POOL_MAX || 5),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  });
  pool.on("error", (error) => console.error("Postgres pool error:", error.message));
  return pool;
}

export async function initDatabase() {
  const db = getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS content_os_artifacts (
      id BIGSERIAL PRIMARY KEY,
      kind TEXT NOT NULL,
      artifact_key TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      payload JSONB NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_content_os_artifacts_kind_date
      ON content_os_artifacts (kind, created_at DESC);

    CREATE TABLE IF NOT EXISTS content_os_jobs (
      id BIGSERIAL PRIMARY KEY,
      job_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued',
      trigger_source TEXT NOT NULL DEFAULT 'system',
      started_at TIMESTAMPTZ,
      finished_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      summary TEXT,
      log_text TEXT NOT NULL DEFAULT '',
      error_text TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_content_os_jobs_created
      ON content_os_jobs (created_at DESC);

    CREATE TABLE IF NOT EXISTS content_os_posts (
      id BIGSERIAL PRIMARY KEY,
      post_key TEXT NOT NULL UNIQUE,
      idea_id TEXT,
      platform TEXT NOT NULL,
      status TEXT NOT NULL,
      scheduled_at TIMESTAMPTZ,
      published_at TIMESTAMPTZ,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_content_os_posts_platform_status
      ON content_os_posts (platform, status);
  `);
}

export async function recordArtifact(kind, artifactKey, payload) {
  const db = getPool();
  const result = await db.query(
    `INSERT INTO content_os_artifacts (kind, artifact_key, payload)
     VALUES ($1, $2, $3::jsonb)
     ON CONFLICT (artifact_key) DO UPDATE
       SET kind = EXCLUDED.kind, payload = EXCLUDED.payload, created_at = NOW()
     RETURNING id, kind, artifact_key, created_at`,
    [kind, artifactKey, JSON.stringify(payload)]
  );
  return result.rows[0];
}

export async function latestArtifact(kind) {
  const db = getPool();
  const result = await db.query(
    "SELECT id, kind, artifact_key, created_at, payload FROM content_os_artifacts WHERE kind = $1 ORDER BY created_at DESC LIMIT 1",
    [kind]
  );
  return result.rows[0] || null;
}

export async function listArtifacts(kind, limit = 20) {
  const db = getPool();
  const result = await db.query(
    "SELECT id, kind, artifact_key, created_at, payload FROM content_os_artifacts WHERE ($1::text IS NULL OR kind = $1) ORDER BY created_at DESC LIMIT $2",
    [kind || null, Math.min(100, Math.max(1, limit))]
  );
  return result.rows;
}

export async function createJob(jobType, triggerSource = "system") {
  const db = getPool();
  const result = await db.query(
    "INSERT INTO content_os_jobs (job_type, status, trigger_source, started_at) VALUES ($1, 'running', $2, NOW()) RETURNING *",
    [jobType, triggerSource]
  );
  return result.rows[0];
}

export async function updateJob(id, { status, summary, logText, errorText }) {
  const db = getPool();
  const final = ["succeeded", "failed", "cancelled"].includes(status);
  const result = await db.query(
    `UPDATE content_os_jobs
       SET status = COALESCE($2, status),
           summary = COALESCE($3, summary),
           log_text = COALESCE($4, log_text),
           error_text = COALESCE($5, error_text),
           finished_at = CASE WHEN $6 THEN NOW() ELSE finished_at END
     WHERE id = $1 RETURNING *`,
    [id, status || null, summary || null, logText ?? null, errorText || null, final]
  );
  return result.rows[0] || null;
}

export async function listJobs(limit = 20) {
  const db = getPool();
  const result = await db.query(
    "SELECT * FROM content_os_jobs ORDER BY created_at DESC LIMIT $1",
    [Math.min(100, Math.max(1, limit))]
  );
  return result.rows;
}

export async function getJob(id) {
  const db = getPool();
  const result = await db.query("SELECT * FROM content_os_jobs WHERE id = $1", [id]);
  return result.rows[0] || null;
}

export async function saveSocialPosts(queueSnapshot) {
  const db = getPool();
  for (const post of queueSnapshot.posts || []) {
    await db.query(
      `INSERT INTO content_os_posts
         (post_key, idea_id, platform, status, scheduled_at, published_at, payload, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, NOW())
       ON CONFLICT (post_key) DO UPDATE SET
         idea_id = EXCLUDED.idea_id,
         platform = EXCLUDED.platform,
         status = EXCLUDED.status,
         scheduled_at = EXCLUDED.scheduled_at,
         published_at = EXCLUDED.published_at,
         payload = EXCLUDED.payload,
         updated_at = NOW()`,
      [
        post.id,
        post.idea_id || null,
        post.platform,
        post.status || "draft_ready",
        post.scheduled_at || null,
        post.published_at || null,
        JSON.stringify(post)
      ]
    );
  }
}

export async function listSocialPosts(limit = 60) {
  const db = getPool();
  const result = await db.query(
    "SELECT post_key, idea_id, platform, status, scheduled_at, published_at, payload, updated_at FROM content_os_posts ORDER BY updated_at DESC LIMIT $1",
    [Math.min(200, Math.max(1, limit))]
  );
  return result.rows;
}

export async function dashboardStats() {
  const db = getPool();
  const [artifacts, jobs, posts] = await Promise.all([
    db.query("SELECT kind, COUNT(*)::int AS count FROM content_os_artifacts GROUP BY kind"),
    db.query("SELECT status, COUNT(*)::int AS count FROM content_os_jobs WHERE created_at >= NOW() - INTERVAL '30 days' GROUP BY status"),
    db.query("SELECT status, COUNT(*)::int AS count FROM content_os_posts GROUP BY status")
  ]);
  return {
    artifacts: Object.fromEntries(artifacts.rows.map((row) => [row.kind, row.count])),
    jobs_30d: Object.fromEntries(jobs.rows.map((row) => [row.status, row.count])),
    posts: Object.fromEntries(posts.rows.map((row) => [row.status, row.count]))
  };
}
