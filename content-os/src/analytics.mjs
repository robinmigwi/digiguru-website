import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL(".", import.meta.url).pathname, "..");
const OUT_DIR = path.join(ROOT, "data", "analytics");
const apiKey = process.env.BUFFER_API_KEY;
const organizationId = process.env.BUFFER_ORGANIZATION_ID;
const channelMap = process.env.BUFFER_CHANNELS_JSON ? JSON.parse(process.env.BUFFER_CHANNELS_JSON) : {};
if (!apiKey || !organizationId) {
  console.log("BUFFER_API_KEY or BUFFER_ORGANIZATION_ID missing. Analytics skipped.");
  process.exit(0);
}

const channelIds = [...new Set(Object.values(channelMap).filter(Boolean))];
if (!channelIds.length) {
  console.log("No channel IDs configured. Analytics skipped.");
  process.exit(0);
}

const gqlString = (value) => JSON.stringify(String(value));
const query = [
  "query GetPostsWithMetrics {",
  "  posts(first: 50, input: { organizationId: " + gqlString(organizationId) + ", filter: { status: [sent], channelIds: [" + channelIds.map(gqlString).join(", ") + "] } }) {",
  "    edges { node { id text dueAt channelId metrics { type name value unit } metricsUpdatedAt } }",
  "    pageInfo { endCursor hasNextPage }",
  "  }",
  "}"
].join("\n");

const response = await fetch("https://api.buffer.com", {
  method: "POST",
  headers: { "content-type": "application/json", authorization: "Bearer " + apiKey },
  body: JSON.stringify({ query })
});
if (!response.ok) throw new Error("Buffer analytics query failed: " + response.status + " " + await response.text());
const data = await response.json();
if (data.errors && data.errors.length) throw new Error("Buffer GraphQL error: " + data.errors.map((e) => e.message).join("; "));

const posts = (data.data.posts.edges || []).map((edge) => {
  const node = edge.node;
  const metrics = {};
  for (const metric of node.metrics || []) {
    metrics[metric.name || metric.type] = {
      value: metric.value,
      unit: metric.unit,
      type: metric.type
    };
  }
  const platform = Object.entries(channelMap).find(([, id]) => id === node.channelId)?.[0] || "unknown";
  return {
    id: node.id,
    channel_id: node.channelId,
    platform,
    text: node.text,
    due_at: node.dueAt,
    metrics_updated_at: node.metricsUpdatedAt,
    metrics
  };
});

const date = new Date().toISOString().slice(0, 10);
await fs.mkdir(OUT_DIR, { recursive: true });
await fs.writeFile(
  path.join(OUT_DIR, date + ".json"),
  JSON.stringify({ collected_at: new Date().toISOString(), post_count: posts.length, posts }, null, 2) + "\n",
  "utf8"
);
console.log("Saved metrics for " + posts.length + " published posts.");
