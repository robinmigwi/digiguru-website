# Render setup and launch checklist

## 1. Select the correct Git branch

The Blueprint is at the repository root in render.yaml on branch content-os-foundation. Create a Render Blueprint from that repository and branch, not from the website's main branch.

All runtime services use rootDir: content-os. They do not serve the DigiGuru marketing website.

## 2. Render billing prerequisite

A dedicated persistent Postgres database is included. Render rejected its creation from the connected account because billing information is not currently available. The workspace already has a free Postgres instance, so Render will not create another free one. A free Postgres database expires after 30 days; sharing the existing database would couple two systems, so this Blueprint provisions its own database instead.

The Blueprint uses a Starter web service, one Cron service and Basic 256 MB Postgres. Verify current prices at https://render.com/pricing before provisioning.

## 3. Create the Blueprint

In the Render Dashboard, create a new Blueprint and choose this GitHub repository plus the content-os-foundation branch. Review render.yaml, then create the resources.

The environment prompts should include:
- DASHBOARD_PASSWORD
- OPENAI_API_KEY for the web service
- OPENAI_API_KEY for the scheduler

Use a unique strong password for the dashboard. Do not put API keys in GitHub files or source code.

## 4. First test

Open the Render web service URL after its health check passes. Authenticate with username robin and the password you set.

Click Run research. When it finishes, check:
- signal count and source links
- ranked opportunities
- job status and logs

Then click Build content. It should create platform native scripts and captions for all four platforms. Without a Creatomate API key, video rendering is skipped gracefully; without Buffer credentials, a distribution queue plan is stored but posts are not sent.

## 5. Add creative and distribution providers

After the first generated scripts look right, add:
- CREATOMATE_API_KEY to the web service and scheduler.
- BUFFER_API_KEY, BUFFER_ORGANIZATION_ID, and BUFFER_CHANNELS_JSON to both services.
- TAVILY_API_KEY to both services if you want fresh web search added to RSS discovery.

To keep generated MP4 URLs persistent, add Cloudflare R2 credentials as listed in the README. Add ElevenLabs only if you want generated voiceover.

## 6. Enable automatic publishing only after review

The Blueprint defaults to ENABLE_AUTO_PUBLISH=false and CONTENT_PUBLISH_MODE=draft.

The initial video cap is one render per weekly pipeline, to control production spend. Increase MAX_RENDERS_PER_RUN after reviewing video quality and cost. To render each idea as four platform specific videos, set RENDER_ALL_PLATFORMS=true and choose a render cap.

Once the generated scripts, video, captions, and connected channels have been reviewed, you can switch the web service and scheduler to ENABLE_AUTO_PUBLISH=true and CONTENT_PUBLISH_MODE=queue.

## 7. Schedules

The Render Cron job runs at 04:00 UTC every day, which is 07:00 in Nairobi:
- Daily: research, then analytics.
- Mondays: research, weekly content generation, video production, distribution, and analytics.

## No Netlify deployment

Do not connect this Blueprint to the DigiGuru Netlify project. The application is intended to run on Render. GitHub commits in this feature branch may deploy to Render once the Blueprint has been created and auto deploy is enabled, but they do not require or trigger a Netlify production deploy.
