# DigiGuru Content OS

A self improving content pipeline for DigiGuru. It researches current business signals, generates ideas, writes platform native video briefs, renders short videos, creates Buffer drafts or queue entries, then learns from measured performance.

## Pipeline

1. Scout: collect research signals from configured public RSS feeds.
2. Strategist: rank opportunities by customer pain and business fit.
3. Writer: produce platform specific hooks, scripts, captions, on screen text and CTAs.
4. Creative Director: specify formats, scenes and visual direction.
5. Producer: render vertical DigiGuru videos with Creatomate; optional ElevenLabs narration can be stored in Cloudflare R2.
6. Publisher: create Buffer drafts by default, or queue posts after explicit configuration.
7. Analyst: collect available post metrics from Buffer.
8. Learner: report repeatable patterns and update the creative memory only when the sample is large enough.

## Safety defaults

- Publishing defaults to drafts. Nothing is published automatically unless `ENABLE_AUTO_PUBLISH=true` and `CONTENT_PUBLISH_MODE=queue`.
- Client stories, customer quotes, stats and results need approved evidence.
- Ideas with a score below 70 or requiring verification cannot be published by the automated workflow.
- If a connector is not configured, the job records the missing dependency and skips that stage.
- This code must live in a repository that is not linked to the DigiGuru Netlify website.

## Install

Use Node.js 20 or newer.

```sh
cd content-os
npm install
npm run validate
```

## GitHub Actions secrets

Required for research and writing:
- `OPENAI_API_KEY`
- Optional `OPENAI_MODEL` (defaults to `gpt-5-mini`)
- Optional `TAVILY_API_KEY` for three rotating fresh web searches per research run. If omitted, the Scout uses the configured RSS feeds only.

For video rendering:
- `CREATOMATE_API_KEY`
- Optional `MAX_RENDERS_PER_RUN` (default 3 master videos per week)
- Optional `RENDER_ALL_PLATFORMS` (default false; true creates all four platform specific videos per idea unless a render cap is set)

For social distribution and analytics:
- `BUFFER_API_KEY`
- `BUFFER_ORGANIZATION_ID`
- `BUFFER_CHANNELS_JSON`, e.g. `{"instagram":"channel-id","facebook":"channel-id","linkedin":"channel-id","tiktok":"channel-id"}`
- Optional `ENABLE_AUTO_PUBLISH` (default false)
- Optional `CONTENT_PUBLISH_MODE` (set to `queue` only when you want automatic queueing)
- Optional `MAX_SOCIAL_POSTS_PER_RUN` (default 12)

Optional AI voiceover:
- `ENABLE_VOICEOVER=true`
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_VOICE_ID`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_PUBLIC_BASE_URL`

All secrets are optional by stage and must be added in GitHub repository settings. Never write credentials into files.

## Workflows

- `content-research.yml`: daily research snapshot.
- `content-pipeline.yml`: weekly idea generation, video rendering and distribution queue.
- `content-analytics.yml`: daily analytics collection and learning report.

GitHub scheduled workflows only run from the repository's default branch. Move this folder and the workflows into a dedicated `digiguru-content-os` repository and set its default branch to `main` before enabling schedule based automation.

## Operating costs

Research and writing use OpenAI API tokens. Rendering and voice generation can incur separate fees or credits. Start with a small render cap, inspect the first output, then increase volume only after reviewing quality and cost. Buffer queueing still depends on the channels and features available in the connected Buffer account.

## Folders

- `config`: brand and positioning
- `knowledge`: approved facts and claims boundaries
- `data/research`: dated source and idea snapshots
- `data/content`: master ideas and platform variations
- `data/distribution`: queue plan and Buffer results
- `data/analytics`: daily measured performance
- `data/learning`: accumulating creative memory
- `data/reports`: human readable learning reports
- `prompts`: agent responsibilities and platform style rules
