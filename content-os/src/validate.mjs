import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL(".", import.meta.url).pathname, "..");
const brand = JSON.parse(await fs.readFile(path.join(ROOT, "config", "brand.json"), "utf8"));
const strategy = JSON.parse(await fs.readFile(path.join(ROOT, "data", "content-pillars.json"), "utf8"));
const facts = JSON.parse(await fs.readFile(path.join(ROOT, "knowledge", "approved-facts.json"), "utf8"));

if (!brand.platforms || brand.platforms.length !== 4) throw new Error("Brand config must contain all four platforms.");
if (!strategy.idea_score || strategy.publish_threshold == null) throw new Error("Content strategy scoring configuration is incomplete.");
if (!Array.isArray(facts.approved) || facts.approved.length === 0) throw new Error("Approved facts library is empty.");

const contentDir = path.join(ROOT, "data", "content");
const files = (await fs.readdir(contentDir).catch(() => [])).filter((name) => name.endsWith(".json")).sort().reverse();
if (!files.length) {
  console.log("Configuration validation passed. No content package exists yet.");
  process.exit(0);
}

const content = JSON.parse(await fs.readFile(path.join(contentDir, files[0]), "utf8"));
const issues = [];
for (const [index, item] of (content.items || []).entries()) {
  if (!item.id || !item.title || !item.franchise) issues.push("Item " + index + " is missing its identity fields.");
  if (Number(item.score) < 0 || Number(item.score) > 100) issues.push("Item " + item.id + " has an invalid score.");
  for (const platform of brand.platforms) {
    const variant = item.platform_variants && item.platform_variants[platform];
    if (!variant) {
      issues.push("Item " + item.id + " is missing " + platform + " variant.");
      continue;
    }
    if (!variant.hook || !variant.script || !variant.caption || !variant.cta) {
      issues.push("Item " + item.id + " has incomplete copy for " + platform + ".");
    }
  }
  if (item.verification_required && item.publish_eligible) {
    issues.push("Item " + item.id + " is marked publish eligible despite requiring verification.");
  }
}
if (issues.length) {
  console.error(issues.join("\n"));
  process.exit(1);
}
console.log("Validation passed for " + content.items.length + " content ideas across " + brand.platforms.length + " platforms.");
