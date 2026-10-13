import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL(".", import.meta.url).pathname, "..");
const BRAND = JSON.parse(await fs.readFile(path.join(ROOT, "config/brand.json"), "utf8"));
const STRATEGY = JSON.parse(await fs.readFile(path.join(ROOT, "data/content-pillars.json"), "utf8"));

const FEEDS = [
  "https://news.google.com/rss/search?q=WhatsApp+business+sales+Kenya&hl=en&gl=KE&ceid=KE:en",
  "https://news.google.com/rss/search?q=small+business+marketing+Kenya&hl=en&gl=KE&ceid=KE:en",
  "https://news.google.com/rss/search?q=Kenya+ecommerce+social+media+customer+experience&hl=en&gl=KE&ceid=KE:en",
  "https://news.google.com/rss/search?q=WhatsApp+sales+customer+service&hl=en&gl=US&ceid=US:en",
  "https://news.google.com/rss/search?q=small+business+marketing+lead+generation&hl=en&gl=US&ceid=US:en",
  "https://news.google.com/rss/search?q=TikTok+marketing+social+video&hl=en&gl=US&ceid=US:en",
  "https://news.google.com/rss/search?q=Meta+ads+Instagram+Facebook+business&hl=en&gl=US&ceid=US:en",
  "https://news.google.com/rss/search?q=CRM+follow+up+customer+experience&hl=en&gl=US&ceid=US:en"
];

const WEB_QUERIES = [
  "current TikTok Creative Center trends that can be adapted to small business marketing and customer journeys",
  "Meta Ads Library examples of WhatsApp lead generation ads and creative approaches for small businesses",
  "Kenyan business owners customer WhatsApp enquiry response follow up ordering and booking challenges",
  "short form video ideas about lead generation customer experience and sales follow up",
  "conversational commerce examples where WhatsApp connects customer questions to orders bookings or quotes",
  "LinkedIn B2B video storytelling ideas for explaining business problems through a founder point of view"
];

function decodeXml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function parseItems(xml) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((match) => {
    const block = match[1];
    const get = (tag) => {
      const found = block.match(new RegExp("<" + tag + "[^>]*>([\\s\\S]*?)<\\/" + tag + ">"));
      return found ? decodeXml(found[1].replace(/<[^>]+>/g, "").trim()) : "";
    };
    return {
      title: get("title"),
      link: get("link"),
      published: get("pubDate"),
      source: get("source"),
      description: get("description")
    };
  }).filter((item) => item.title);
}

async function collectWebSignals() {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return [];

  // Three searches per run keeps research spend predictable. The query set rotates daily.
  const day = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
  const queries = [0, 1, 2].map((offset) => WEB_QUERIES[(day + offset) % WEB_QUERIES.length]);
  const collected = [];

  for (const query of queries) {
    try {
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          search_depth: "basic",
          topic: "general",
          max_results: 5,
          time_range: "month",
          country: "Kenya",
          include_answer: false,
          include_raw_content: false
        })
      });
      if (!response.ok) {
        console.warn("Tavily search skipped:", response.status);
        continue;
      }
      const data = await response.json();
      for (const result of data.results || []) {
        collected.push({
          title: result.title || "",
          link: result.url || "",
          published: result.published_date || "",
          source: result.url ? new URL(result.url).hostname : "web search",
          source_type: "web_search",
          description: String(result.content || "").slice(0, 900),
          relevance_score: result.score ?? null
        });
      }
    } catch (error) {
      console.warn("Tavily search failed:", String(error.message || error));
    }
  }
  return collected;
}

async function collectSignals() {
  const collected = [];
  for (const url of FEEDS) {
    try {
      const response = await fetch(url, {
        headers: { "user-agent": "DigiGuru-Content-OS/0.1" }
      });
      if (!response.ok) continue;
      collected.push(...parseItems(await response.text()).slice(0, 8));
    } catch {
      // One failed source should not stop the research cycle.
    }
  }
  collected.push(...await collectWebSignals());

  const seen = new Set();
  return collected.filter((item) => {
    const key = item.link || item.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 80);
}

function extractJson(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Model did not return JSON.");
  return JSON.parse(text.slice(start, end + 1));
}

async function callModel(signals) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is required.");

  const model = process.env.OPENAI_MODEL || "gpt-5-mini";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer " + apiKey
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: "You are Scout + Strategist for DigiGuru. DigiGuru turns marketing attention into business action by improving what happens after a lead arrives. Use the supplied brand strategy. Never invent facts, client results, quotes or statistics. Return JSON only."
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify({ brand: BRAND, strategy: STRATEGY, signals })
            }
          ]
        }
      ],
      instructions: "Return 8 to 15 ranked content opportunities. Each must contain id, idea, franchise, angle, hook, score, evidence, platforms, verification_required and status. Score 0 to 100 using the supplied weights. Set verification_required=true for any claim, statistic, quote or fact not directly supported by the supplied evidence. Prefer original DigiGuru points of view and strong short form video potential.",
      text: { format: { type: "json_object" } }
    })
  });

  if (!response.ok) {
    throw new Error("OpenAI request failed: " + response.status + " " + await response.text());
  }

  const data = await response.json();
  const outputText = data.output_text || (data.output || [])
    .filter((item) => item.type === "message")
    .flatMap((item) => item.content || [])
    .filter((part) => part.type === "output_text")
    .map((part) => part.text || "")
    .join("\n");
  return extractJson(outputText);
}

const signals = await collectSignals();
const opportunities = await callModel(signals);
const date = new Date().toISOString().slice(0, 10);
const outputDir = path.join(ROOT, "data", "research");

await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(
  path.join(outputDir, date + ".json"),
  JSON.stringify({
    generated_at: new Date().toISOString(),
    signal_count: signals.length,
    signals,
    opportunities
  }, null, 2) + "\n",
  "utf8"
);

console.log("Collected " + signals.length + " signals and wrote " + date + ".json");
