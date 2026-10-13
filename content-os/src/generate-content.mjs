import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL(".", import.meta.url).pathname, "..");
const RESEARCH_DIR = path.join(ROOT, "data", "research");
const OUTPUT_DIR = path.join(ROOT, "data", "content");
const BRAND = JSON.parse(await fs.readFile(path.join(ROOT, "config", "brand.json"), "utf8"));
const STRATEGY = JSON.parse(await fs.readFile(path.join(ROOT, "data", "content-pillars.json"), "utf8"));
const FACTS = JSON.parse(await fs.readFile(path.join(ROOT, "knowledge", "approved-facts.json"), "utf8"));

async function latestJson(dir) {
  const files = (await fs.readdir(dir)).filter((name) => name.endsWith(".json")).sort().reverse();
  if (!files.length) throw new Error("No research snapshots found. Run the research workflow first.");
  return JSON.parse(await fs.readFile(path.join(dir, files[0]), "utf8"));
}

function parseJson(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("The model did not return a JSON object.");
  return JSON.parse(text.slice(start, end + 1));
}

async function generate(research) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is required.");
  const model = process.env.OPENAI_MODEL || "gpt-5-mini";

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer " + apiKey },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [{
            type: "input_text",
            text: "You are the DigiGuru Strategist, Writer and Creative Director. Create distinctive, useful business video content. DigiGuru turns marketing attention into business action by connecting ads, websites, WhatsApp and the conversation layer. Keep the voice clear, warm, direct and commercially grounded. Do not invent client results, client quotes, figures, product features, news or sources. Separate verified facts from ideas. Make each social platform feel native. Return valid JSON only."
          }]
        },
        {
          role: "user",
          content: [{
            type: "input_text",
            text: JSON.stringify({
              brand: BRAND,
              strategy: STRATEGY,
              approved_facts: FACTS.approved,
              research_signals: research.signals || [],
              ranked_opportunities: research.opportunities
            })
          }]
        }
      ],
      instructions: [
        "Select the best THREE distinct core ideas from the opportunities for this week's content.",
        "Avoid three ideas that make the same point.",
        "For each idea produce platform variants for instagram, facebook, linkedin and tiktok.",
        "Each platform variant must contain hook, script, on_screen_text (array of 3 to 6 short strings), caption, cta, hashtags (array), visual_direction and video_seconds.",
        "For each core idea include id, title, franchise, business_problem, angle, score (0 to 100), funnel_stage, evidence (array of source URLs or approved fact IDs), verification_required (boolean), narration, scenes (array of 3 to 5 strings), visual_format and platform_variants.",
        "Keep scripts between 45 and 75 spoken words for a roughly 20 to 35 second video.",
        "Do not write fake founder quotations or imply Robin said something unless it is clearly framed as a draft point of view for approval.",
        "Do not create client case studies unless the exact claim is present in approved_facts or the evidence.",
        "No fabricated statistics. If the concept needs external verification, set verification_required=true and explain the need in evidence.",
        "Use local examples that a Kenyan business owner can recognize without claiming a specific local statistic.",
        "Instagram: visual, polished, direct. Facebook: practical, relatable, explanatory. LinkedIn: thoughtful founder or business perspective. TikTok: quick hook, conversational, pattern interrupt.",
        "Return an object shaped like {items:[...]} with exactly three items."
      ].join(" "),
      text: { format: { type: "json_object" } }
    })
  });

  if (!response.ok) {
    throw new Error("OpenAI request failed: " + response.status + " " + await response.text());
  }
  const data = await response.json();
  return parseJson(data.output_text || "");
}

const research = await latestJson(RESEARCH_DIR);
const draft = await generate(research);
if (!Array.isArray(draft.items) || draft.items.length < 1) {
  throw new Error("Content generation returned no items.");
}

const publishThreshold = STRATEGY.publish_threshold || 70;
const items = draft.items.map((item, index) => {
  if (!item.id) item.id = "dg-" + new Date().toISOString().slice(0, 10) + "-" + (index + 1);
  item.score = Math.max(0, Math.min(100, Number(item.score) || 0));
  item.verification_required = Boolean(item.verification_required);
  item.status = "briefed";
  item.publish_eligible = item.score >= publishThreshold && !item.verification_required;
  item.platform_variants = item.platform_variants || {};
  for (const platform of BRAND.platforms) {
    if (!item.platform_variants[platform]) {
      item.publish_eligible = false;
      item.verification_required = true;
      item.quality_notes = (item.quality_notes || []).concat("Missing platform variant: " + platform);
    }
  }
  return item;
});

const date = new Date().toISOString().slice(0, 10);
await fs.mkdir(OUTPUT_DIR, { recursive: true });
const output = {
  generated_at: new Date().toISOString(),
  research_snapshot_date: research.generated_at || null,
  brand: BRAND.brand,
  items
};
await fs.writeFile(path.join(OUTPUT_DIR, date + ".json"), JSON.stringify(output, null, 2) + "\n", "utf8");
console.log("Created " + items.length + " master ideas with platform specific versions in " + date + ".json");
