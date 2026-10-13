import fs from "node:fs/promises";
import path from "node:path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const ROOT = path.resolve(new URL(".", import.meta.url).pathname, "..");
const CONTENT_DIR = path.join(ROOT, "data", "content");
const BRAND = JSON.parse(await fs.readFile(path.join(ROOT, "config", "brand.json"), "utf8"));
const contentFiles = (await fs.readdir(CONTENT_DIR)).filter((name) => name.endsWith(".json")).sort().reverse();
if (!contentFiles.length) throw new Error("No content packages found. Run generate-content.mjs first.");
const contentPath = path.join(CONTENT_DIR, contentFiles[0]);
const packageData = JSON.parse(await fs.readFile(contentPath, "utf8"));

const apiKey = process.env.CREATOMATE_API_KEY;
if (!apiKey) {
  console.log("CREATOMATE_API_KEY is not set. Video rendering skipped; content briefs remain saved.");
  process.exit(0);
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const storageAvailable = Boolean(
  process.env.R2_ACCOUNT_ID
  && process.env.R2_ACCESS_KEY_ID
  && process.env.R2_SECRET_ACCESS_KEY
  && process.env.R2_BUCKET
  && process.env.R2_PUBLIC_BASE_URL
);
const enabledVoice = process.env.ENABLE_VOICEOVER === "true"
  && Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID)
  && storageAvailable;

let s3;
if (storageAvailable) {
  s3 = new S3Client({
    region: "auto",
    endpoint: "https://" + process.env.R2_ACCOUNT_ID + ".r2.cloudflarestorage.com",
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
    }
  });
}

function safeSlug(value) {
  return String(value || "digiguru-content").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64);
}

async function createVoiceover(text, key) {
  const url = "https://api.elevenlabs.io/v1/text-to-speech/" + process.env.ELEVENLABS_VOICE_ID + "?output_format=mp3_44100_128";
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY,
      "content-type": "application/json",
      accept: "audio/mpeg"
    },
    body: JSON.stringify({
      text,
      model_id: process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2"
    })
  });
  if (!response.ok) throw new Error("ElevenLabs request failed: " + response.status + " " + await response.text());
  const bytes = Buffer.from(await response.arrayBuffer());
  await s3.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
    Body: bytes,
    ContentType: "audio/mpeg"
  }));
  return process.env.R2_PUBLIC_BASE_URL.replace(/\/$/, "") + "/" + key;
}

async function storeVideoPermanently(renderUrl, key) {
  if (!storageAvailable) return null;
  const response = await fetch(renderUrl);
  if (!response.ok) throw new Error("Could not download completed render: " + response.status);
  const bytes = Buffer.from(await response.arrayBuffer());
  await s3.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
    Body: bytes,
    ContentType: "video/mp4"
  }));
  return process.env.R2_PUBLIC_BASE_URL.replace(/\/$/, "") + "/" + key;
}

function sceneText(text, name, time, duration, opts = {}) {
  return {
    type: "text",
    name,
    text: String(text || "").slice(0, 150),
    time,
    duration,
    x: "9%",
    y: opts.y || "45%",
    width: "82%",
    height: opts.height || "30%",
    x_anchor: "0%",
    y_anchor: "50%",
    x_alignment: "0%",
    y_alignment: "50%",
    fill_color: opts.color || "#FBFAF5",
    font_family: "Aileron",
    font_weight: opts.weight || "800",
    font_size: opts.size || "7.2 vmin",
    line_height: "112%",
    text_wrap: true,
    animations: [{ time: 0, duration: 0.65, easing: "quadratic-out", type: "text-slide", direction: "up" }]
  };
}

function buildRenderScript(item, platform, voiceUrl) {
  const variant = item.platform_variants[platform] || item.platform_variants.instagram || {};
  const texts = (variant.on_screen_text || item.scenes || []).slice(0, 4);
  while (texts.length < 4) texts.push(item.title || "DigiGuru");
  const duration = Math.max(20, Math.min(32, Number(variant.video_seconds) || 24));
  const slot = duration / 4;
  const elements = [
    {
      type: "shape",
      name: "brand-stripe",
      time: 0,
      duration,
      x: 0,
      y: 0,
      width: 1080,
      height: 16,
      path: "M 0 0 L 100 0 L 100 100 L 0 100 Z",
      fill_color: "#D6B66A"
    },
    {
      type: "text",
      name: "brand-name",
      time: 0,
      duration,
      text: "DIGIGURU  /  ATTENTION → ACTION",
      x: "9%",
      y: "9%",
      width: "82%",
      height: "5%",
      x_anchor: "0%",
      y_anchor: "0%",
      x_alignment: "0%",
      y_alignment: "0%",
      fill_color: "#8FD7C8",
      font_family: "Aileron",
      font_weight: "700",
      font_size: "2.7 vmin",
      letter_spacing: "80%"
    },
    sceneText(variant.hook || item.hook || item.title, "scene-1", 0, slot, { color: "#D6B66A", size: "8.2 vmin", y: "34%", height: "34%" }),
    sceneText(texts[1], "scene-2", slot, slot, { size: "7 vmin", y: "40%" }),
    sceneText(texts[2], "scene-3", slot * 2, slot, { size: "7 vmin", y: "40%" }),
    sceneText(texts[3] || variant.cta || "Talk to DigiGuru", "scene-4", slot * 3, slot, { color: "#8FD7C8", size: "6.8 vmin", y: "40%" }),
    {
      type: "text",
      name: "footer",
      time: Math.max(0, duration - 3.8),
      duration: 3.8,
      text: "Your marketing gets attention. We turn it into action.",
      x: "9%",
      y: "86%",
      width: "82%",
      height: "7%",
      x_anchor: "0%",
      y_anchor: "50%",
      x_alignment: "0%",
      y_alignment: "50%",
      fill_color: "#FBFAF5",
      font_family: "Aileron",
      font_weight: "600",
      font_size: "3.1 vmin",
      animations: [{ time: 0, duration: 0.55, easing: "quadratic-out", type: "fade" }]
    }
  ];
  if (voiceUrl) {
    elements.push({
      type: "audio",
      name: "voiceover",
      time: 0,
      duration: "media",
      source: voiceUrl,
      volume: "100%"
    });
  }
  return {
    output_format: "mp4",
    width: 1080,
    height: 1920,
    frame_rate: 30,
    duration,
    fill_color: "#0D2A21",
    snapshot_time: Math.min(2, duration - 1),
    elements
  };
}

async function requestRender(source, metadata) {
  const response = await fetch("https://api.creatomate.com/v2/renders", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer " + apiKey },
    body: JSON.stringify({ ...source, metadata })
  });
  if (!response.ok) throw new Error("Creatomate render request failed: " + response.status + " " + await response.text());
  const render = await response.json();
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (render.status === "succeeded") return render;
    if (render.status === "failed") throw new Error("Creatomate render failed: " + (render.error_message || render.id));
    await delay(8000);
    const poll = await fetch("https://api.creatomate.com/v2/renders/" + render.id, {
      headers: { authorization: "Bearer " + apiKey }
    });
    if (!poll.ok) throw new Error("Creatomate status request failed: " + poll.status);
    Object.assign(render, await poll.json());
  }
  throw new Error("Timed out waiting for render " + render.id);
}

const eligible = packageData.items.filter((item) => item.score >= 70 && !item.verification_required);
const renderAllPlatforms = process.env.RENDER_ALL_PLATFORMS === "true";
const configuredRenderLimit = Number(process.env.MAX_RENDERS_PER_RUN);
const maxRenders = Number.isFinite(configuredRenderLimit) && configuredRenderLimit > 0
  ? configuredRenderLimit
  : (renderAllPlatforms ? eligible.length * BRAND.platforms.length : 3);
let rendered = 0;
for (const item of eligible) {
  const platforms = renderAllPlatforms ? BRAND.platforms : ["master"];
  for (const platform of platforms) {
    if (rendered >= maxRenders) break;
    const variantKey = platform === "master" ? "instagram" : platform;
    const variant = item.platform_variants[variantKey] || item.platform_variants.instagram || {};
    let voiceUrl = null;
    if (enabledVoice && variant.script) {
      const key = "content-os/voiceovers/" + safeSlug(item.id + "-" + variantKey) + ".mp3";
      voiceUrl = await createVoiceover(variant.script, key);
    }
    const source = buildRenderScript(item, variantKey, voiceUrl);
    const result = await requestRender(source, item.id + "-" + platform);
    const permanentKey = "content-os/renders/" + safeSlug(item.id + "-" + platform) + "-" + result.id + ".mp4";
    const permanentUrl = await storeVideoPermanently(result.url, permanentKey);
    item.video_assets = item.video_assets || [];
    item.video_assets.push({
      platform,
      render_id: result.id,
      url: permanentUrl || result.url,
      render_url: result.url,
      storage_persistent: Boolean(permanentUrl),
      snapshot_url: result.snapshot_url || null,
      rendered_at: new Date().toISOString()
    });
    rendered += 1;
    console.log("Rendered " + item.id + " (" + platform + "): " + result.url);
  }
  if (rendered >= maxRenders) break;
}

await fs.writeFile(contentPath, JSON.stringify(packageData, null, 2) + "\n", "utf8");
console.log("Completed " + rendered + " video render(s).");
