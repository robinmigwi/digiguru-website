# DigiGuru Content OS

DigiGuru Content OS is a Render hosted content system that researches business signals, generates video first content for Instagram, Facebook, LinkedIn and TikTok, prepares platform specific assets, distributes through Buffer when connected, and learns from post performance.

## Architecture

- Render Web Service: password protected dashboard and API.
- Render Postgres: durable storage for research snapshots, content packages, jobs, queue items, analytics and creative memory.
- Render Cron Job: one daily scheduled run. The cycle runs research every day, the content pipeline on Mondays, and analytics every day.
- OpenAI Responses API: Scout, Strategist, Writer and Learner.
- Optional Tavily: supplemental fresh web research.
- Optional Creatomate: render branded vertical videos.
- Optional ElevenLabs + Cloudflare R2: voiceover and permanent media storage.
- Optional Buffer: create drafts or schedule posts across connected channels.

The Render scheduler runs daily at 04:00 UTC (07:00 in Nairobi). On Mondays it runs the weekly production pipeline after research.

## Agent loop

Scout → Strategist → Writer → Creative Director → Producer → Publisher → Analyst → Learner → Scout

## Safety defaults

- Dashboard protected with HTTP Basic authentication over HTTPS.
- Research and generation may run unattended after secrets are configured.
- Publishing starts in draft mode. Automatic queueing requires ENABLE_AUTO_PUBLISH=true and CONTENT_PUBLISH_MODE=queue in both the web and scheduler services.
- Ideas under the scoring threshold or requiring verification are not marked publish eligible.
- Client results, customer quotes, statistics and capability claims require approved evidence.
- Video rendering is capped at one video per pipeline run initially; increase after reviewing quality and provider costs.
- API keys belong in Render secret environment variables, never in Git.

## Deploy to Render

The Blueprint is in the repository root at render.yaml. It only builds and runs the content-os folder, leaving the existing DigiGuru website files outside the service root.

The Blueprint provisions:
- digiguru-content-os: authenticated dashboard and API
- digiguru-content-os-scheduler: scheduled job
- digiguru-content-os-db: dedicated Postgres database

### Baseline Render infrastructure costs

The chosen configuration uses a Starter web service, one scheduled Cron service and a Basic 256 MB Postgres database. Render currently lists these at approximately US$7/month, US$1/month minimum, and US$6/month respectively, before provider usage, bandwidth or storage changes. Check current prices before provisioning: https://render.com/pricing.

## Required secrets

For the first research and content generation run, set these in both the web service and scheduler:
- OPENAI_API_KEY
- Optional OPENAI_MODEL (defaults to gpt-5-mini)

For the dashboard, set:
- DASHBOARD_PASSWORD (unique, strong password)

## Optional integrations

Add these to both the web service and scheduler when you are ready to use the corresponding stage:

- TAVILY_API_KEY: additional current web research.
- CREATOMATE_API_KEY: render video assets.
- BUFFER_API_KEY: create social post drafts and retrieve supported metrics.
- BUFFER_ORGANIZATION_ID: scope Buffer analytics.
- BUFFER_CHANNELS_JSON: map platform names to connected Buffer channel IDs, e.g. {"instagram":"channel-id","facebook":"channel-id","linkedin":"channel-id","tiktok":"channel-id"}.

Optional voiceover and persistent video hosting:
- ENABLE_VOICEOVER=true
- ELEVENLABS_API_KEY
- ELEVENLABS_VOICE_ID
- R2_ACCOUNT_ID
- R2_ACCESS_KEY_ID
- R2_SECRET_ACCESS_KEY
- R2_BUCKET
- R2_PUBLIC_BASE_URL

For automatic publishing, explicitly set both ENABLE_AUTO_PUBLISH=true and CONTENT_PUBLISH_MODE=queue; leave the default off until drafts, videos, captions and account connections have been tested.

## Run locally

Use Node.js 20 or newer.

\`\`\`sh
cd content-os
npm install
npm run validate
npm start
\`\`\`

Required environment variables locally are DATABASE_URL, DASHBOARD_PASSWORD and OPENAI_API_KEY for research jobs.

## Data locations

The database is the source of truth. The data/ folder is used as short lived job workspace and may be empty at service start.

- data/research: research work files
- data/content: master content and platform variants
- data/distribution: outgoing post plan / Buffer outcomes
- data/analytics: metric snapshots
- data/learning: creative memory
- data/reports: learning reports

## Before going fully unattended

1. Deploy the Render Blueprint from the content-os-foundation branch.
2. Enter the OpenAI API key and a strong dashboard password.
3. Trigger the research job from the dashboard and review the ranked ideas.
4. Add Creatomate and Buffer credentials when ready.
5. Review the first rendered video and Buffer drafts.
6. Enable automatic queueing only after validating the four platform versions.

GitHub remains the source of truth, but routine content execution and scheduling happen on Render. Netlify is not used for this system.
