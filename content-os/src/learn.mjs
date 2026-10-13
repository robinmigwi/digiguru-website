import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL(".", import.meta.url).pathname, "..");
const ANALYTICS_DIR = path.join(ROOT, "data", "analytics");
const MEMORY_PATH = path.join(ROOT, "data", "learning", "creative-memory.json");
const REPORT_DIR = path.join(ROOT, "data", "reports");

function parseJson(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Model did not return a JSON object.");
  return JSON.parse(text.slice(start, end + 1));
}

const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
const files = (await fs.readdir(ANALYTICS_DIR).catch(() => []))
  .filter((name) => name.endsWith(".json"))
  .sort();
const byId = new Map();

for (const file of files) {
  const date = file.slice(0, 10);
  if (new Date(date).getTime() < cutoff) continue;
  const snapshot = JSON.parse(await fs.readFile(path.join(ANALYTICS_DIR, file), "utf8"));
  for (const post of snapshot.posts || []) {
    const previous = byId.get(post.id);
    if (!previous || String(post.metrics_updated_at || "") >= String(previous.metrics_updated_at || "")) byId.set(post.id, post);
  }
}

const posts = [...byId.values()];
const memory = JSON.parse(await fs.readFile(MEMORY_PATH, "utf8"));
const date = new Date().toISOString().slice(0, 10);
let learning = {
  summary: posts.length < 10
    ? "Not enough published post records to update creative preferences confidently yet."
    : "Performance evidence collected. Awaiting a stable pattern across multiple posts.",
  sample_size: posts.length,
  patterns: [],
  experiments: [],
  winning_topics: [],
  winning_hooks: [],
  winning_formats: [],
  update_memory: false
};

if (posts.length >= 10 && process.env.OPENAI_API_KEY) {
  const compactPosts = posts.map((post) => ({
    id: post.id,
    platform: post.platform,
    text: String(post.text || "").slice(0, 1200),
    metrics_updated_at: post.metrics_updated_at,
    metrics: post.metrics
  }));
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer " + process.env.OPENAI_API_KEY },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      input: [
        {
          role: "system",
          content: [{
            type: "input_text",
            text: "You are the DigiGuru Learner. Analyze only the supplied published content and observed platform metrics. Never invent missing metrics or imply causation from correlation. Prefer repeated patterns over one-off outliers. Keep each recommendation concrete and testable. Return JSON only."
          }]
        },
        {
          role: "user",
          content: [{
            type: "input_text",
            text: JSON.stringify({
              available_posts: compactPosts,
              previous_memory: memory,
              guidance: "Identify repeated winners and losers by hook style, topic, platform, format, and available metrics. Recommend 2 to 4 experiments for the next month. If sample sizes are uneven across platforms, say so."
            })
          }]
        }
      ],
      instructions: "Return object with summary, patterns (array), experiments (array), winning_topics (array), winning_hooks (array), winning_formats (array), and update_memory (boolean).",
      text: { format: { type: "json_object" } }
    })
  });
  if (!response.ok) throw new Error("OpenAI learner request failed: " + response.status + " " + await response.text());
  const result = await response.json();
  learning = parseJson(result.output_text || "");
  learning.sample_size = posts.length;
  learning.update_memory = Boolean(learning.update_memory);
}

if (learning.update_memory && posts.length >= 10) {
  memory.last_updated = new Date().toISOString();
  memory.observations = (memory.observations || []).concat({
    date,
    sample_size: posts.length,
    summary: learning.summary,
    patterns: learning.patterns || []
  }).slice(-30);
  memory.winning_topics = learning.winning_topics || memory.winning_topics || [];
  memory.winning_hooks = learning.winning_hooks || memory.winning_hooks || [];
  memory.winning_formats = learning.winning_formats || memory.winning_formats || [];
  await fs.writeFile(MEMORY_PATH, JSON.stringify(memory, null, 2) + "\n", "utf8");
}

await fs.mkdir(REPORT_DIR, { recursive: true });
const report = [
  "# DigiGuru Content Performance Learnings — " + date,
  "",
  "**Published posts assessed:** " + posts.length,
  "",
  "## Summary",
  learning.summary || "No summary available.",
  "",
  "## Patterns",
  ...(learning.patterns || []).map((item) => "- " + (typeof item === "string" ? item : JSON.stringify(item))),
  "",
  "## Experiments to try",
  ...(learning.experiments || []).map((item) => "- " + (typeof item === "string" ? item : JSON.stringify(item))),
  "",
  "## Winning topics",
  ...(learning.winning_topics || []).map((item) => "- " + item),
  "",
  "## Winning hooks",
  ...(learning.winning_hooks || []).map((item) => "- " + item),
  "",
  "## Winning formats",
  ...(learning.winning_formats || []).map((item) => "- " + item),
  "",
  "## Guardrail",
  posts.length < 10
    ? "Early stage: no long term preferences were updated because the sample is still too small."
    : (learning.update_memory ? "The creative memory was updated from the observed data." : "The analysis was saved. The system did not update durable preferences.")
].join("\n");

await fs.writeFile(path.join(REPORT_DIR, date + ".md"), report + "\n", "utf8");
console.log("Saved learning report for " + posts.length + " unique posts.");
