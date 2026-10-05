# DigiGuru Content OS Setup

## 1. GitHub secret

On the content OS branch, add repository secret:

OPENAI_API_KEY

Optionally add:

OPENAI_MODEL

The research job defaults to gpt-5-mini.

## 2. Test manually

Open GitHub Actions and run:

DigiGuru Content Research → Run workflow

The first run should create:

content-os/data/research/YYYY-MM-DD.json

## 3. What this first workflow does

It gathers current public business and marketing signals from configured feeds, sends them with the DigiGuru strategy to the Scout + Strategist agent, and saves ranked opportunities.

It does not publish anything.

## 4. Next integration credentials

Later we will add credentials for:
- social scheduling
- analytics
- video rendering
- media storage

These will be stored as GitHub Actions secrets, never in the repository.

## 5. Production rule

Do not merge this branch into main until the content system is moved to a repository that is not connected to the DigiGuru Netlify deployment.
