# Setup checklist

## Step 1: Move into a separate repository

The website repository deploys through Netlify. Keep the Content OS away from its `main` branch. Create a dedicated private repository named `digiguru-content-os` and copy the contents of this folder plus the `.github/workflows` folder into its root. Use `main` as the default branch. This is required for scheduled GitHub Actions to run.

## Step 2: Add secrets

Start with `OPENAI_API_KEY` and optional `OPENAI_MODEL`. Add `TAVILY_API_KEY` if you want the Scout to supplement the RSS feeds with three rotating web searches per run. Without Tavily, RSS research still runs. Confirm that research and content generation work first.

Then add `CREATOMATE_API_KEY` for video. Start with `MAX_RENDERS_PER_RUN=1` while testing. Increase to 3 master videos once the output looks good. Later, set `RENDER_ALL_PLATFORMS=true` to create distinct video variants for each social network; set `MAX_RENDERS_PER_RUN=12` to cap that at three ideas across all four platforms.

Then add `BUFFER_API_KEY`, `BUFFER_ORGANIZATION_ID` and `BUFFER_CHANNELS_JSON`. The first runs create drafts by default. Review the text and video quality before allowing auto queueing.

For true unattended distribution, explicitly set `ENABLE_AUTO_PUBLISH=true` and `CONTENT_PUBLISH_MODE=queue`.

Voiceover is optional. Only enable it after testing a voice and adding all ElevenLabs and Cloudflare R2 credentials.

## Step 3: Test in order

1. Run DigiGuru Content Research manually.
2. Run DigiGuru Weekly Content Pipeline manually and inspect `data/content`.
3. Test one Creatomate render.
4. Confirm one Buffer draft on each connected platform.
5. Confirm the analytics workflow can retrieve metrics.
6. Only then enable the weekly schedule and unattended queue mode.

## No deployment

This is a standalone automation repository. It must not be connected to the Netlify website project.
