import { spawnSync } from "node:child_process";

const day = new Date().getUTCDay();
const actions = ["research"];
if (day === 1) actions.push("pipeline");
actions.push("analytics");

for (const action of actions) {
  console.log("\n========== DigiGuru Content OS: " + action + " ==========");
  const result = spawnSync(process.execPath, ["src/run-job.mjs", action, "", "render-scheduler"], {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
    timeout: 12 * 60 * 60 * 1000
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error("Scheduled action " + action + " failed with exit status " + result.status);
  }
}
console.log("Scheduled Content OS cycle completed.");
