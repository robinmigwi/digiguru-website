# DigiGuru Content OS

DigiGuru Content OS is the automation foundation for a self improving content engine.

## Loop

Research → Insight Library → Idea scoring → Platform adaptation → Production → Distribution → Analytics → Learning → Research

## First release

This foundation ships the research layer only. It:
1. collects current public signals from configured RSS sources
2. asks an LLM to extract DigiGuru relevant opportunities
3. scores ideas against the DigiGuru content strategy
4. stores dated research snapshots in GitHub

It does not publish content.

## Agent roles

Scout → finds signals and language.
Strategist → turns signals into strong DigiGuru angles.
Writer → writes platform native scripts and copy.
Creative Director → chooses format, visual treatment and pacing.
Producer → renders the approved video.
Publisher → schedules platform versions.
Analyst → explains performance.
Learner → updates the system's creative preferences.

## Safety

Never invent client results, customer quotes, statistics, partnerships, claims or capabilities. Verified facts must live in approved knowledge files.

## Required secret

OPENAI_API_KEY

Optional:
OPENAI_MODEL

The first workflow is intentionally research only. Keep the branch separate from the production website until the content system is moved to its own repository.
