import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL(".", import.meta.url).pathname, "..");
const CONTENT_DIR = path.join(ROOT, "data", "content");
const QUEUE_DIR = path.join(ROOT, "data", "distribution");
const BRAND = JSON.parse(await fs.readFile(path.join(ROOT, "config", "brand.json"), "utf8"));
const files = (await fs.readdir(CONTENT_DIR)).filter((name) => name.endsWith(".json")).sort().reverse();
if (!files.length) throw new Error("No generated content found.");
const contentPath = path.join(CONTENT_DIR, files[0]);
const packageData = JSON.parse(await fs.readFile(contentPath, "utf8"));

const apiKey = process.env.BUFFER_API_KEY;
const channelMap = process.env.BUFFER_CHANNELS_JSON ? JSON.parse(process.env.BUFFER_CHANNELS_JSON) : {};
const enabled = process.env.ENABLE_AUTO_PUBLISH === "true";
const mode = enabled && process.env.CONTENT_PUBLISH_MODE === "queue" ? "queue" : "draft";
const safeLimit = Math.max(1, Number(process.env.MAX_SOCIAL_POSTS_PER_RUN) || 12);

function pickVideo(item, platform) {
  const assets = item.video_assets || [];
  return assets.find((asset) => asset.platform === platform && asset.url)
    || assets.find((asset) => asset.platform === "master" && asset.url)
    || assets.find((asset) => asset.url)
    || null;
}

function buildPlan() {
  const posts = [];
  for (const item of packageData.items) {
    if (!item.publish_eligible || item.verification_required || item.score < 70) continue;
    const variants = item.platform_variants || {};
    for (const platform of BRAND.platforms) {
      const variant = variants[platform];
      if (!variant) continue;
      const video = pickVideo(item, platform);
      posts.push({
        id: item.id + "-" + platform,
        idea_id: item.id,
        platform,
        channel_id: channelMap[platform] || null,
        text: [variant.caption || "", (variant.hashtags || []).join(" ")].filter(Boolean).join("\n\n"),
        hook: variant.hook || item.hook || item.title,
        cta: variant.cta || "",
        video_url: video ? video.url : null,
        status: video ? (mode === "queue" ? "ready_to_schedule" : "draft_ready") : "waiting_for_video",
        verification_required: Boolean(item.verification_required)
      });
    }
  }
  return posts.slice(0, safeLimit);
}

async function bufferGraphQL(query, variables) {
  const response = await fetch("https://api.buffer.com", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer " + apiKey
    },
    body: JSON.stringify({ query, variables })
  });
  if (!response.ok) throw new Error("Buffer API failed: " + response.status + " " + await response.text());
  const data = await response.json();
  if (data.errors && data.errors.length) throw new Error("Buffer GraphQL error: " + data.errors.map((e) => e.message).join("; "));
  return data.data;
}

async function sendToBuffer(post) {
  const mutation = "mutation CreatePost($input: CreatePostInput!) { createPost(input: $input) { ... on PostActionSuccess { post { id text channelId dueAt status } } ... on MutationError { message } } }";
  const input = {
    channelId: post.channel_id,
    text: post.text,
    schedulingType: "automatic",
    mode: "addToQueue",
    saveToDraft: mode !== "queue",
    aiAssisted: true,
    assets: [{ video: { url: post.video_url } }]
  };
  const response = await bufferGraphQL(mutation, { input });
  const result = response.createPost;
  if (result && result.message) throw new Error(result.message);
  if (!result || !result.post) throw new Error("Buffer did not return a created post for " + post.id);
  return result.post;
}

const date = new Date().toISOString().slice(0, 10);
await fs.mkdir(QUEUE_DIR, { recursive: true });
const posts = buildPlan();
const log = {
  generated_at: new Date().toISOString(),
  source_package: files[0],
  publishing_mode: mode,
  auto_publish_enabled: enabled,
  posts
};

if (!apiKey) {
  for (const post of posts) {
    if (post.video_url) post.status = "plan_only";
  }
  log.note = "BUFFER_API_KEY missing; queue plan saved to the Content OS database. No social posts were created.";
} else {
  for (const post of posts) {
    if (!post.video_url) continue;
    if (!post.channel_id) {
      post.status = "missing_channel_id";
      continue;
    }
    try {
      const result = await sendToBuffer(post);
      post.status = mode === "queue" ? "queued" : "draft_created";
      post.buffer_post_id = result.id;
      post.scheduled_at = result.dueAt || null;
    } catch (error) {
      post.status = "failed";
      post.error = String(error.message || error);
    }
  }
  if (mode !== "queue") {
    log.note = "Safe mode: video posts were saved as drafts. Set ENABLE_AUTO_PUBLISH=true and CONTENT_PUBLISH_MODE=queue to queue automatically.";
  }
}

await fs.writeFile(path.join(QUEUE_DIR, date + ".json"), JSON.stringify(log, null, 2) + "\n", "utf8");
console.log("Saved distribution queue with " + posts.length + " platform posts in " + mode + " mode.");
