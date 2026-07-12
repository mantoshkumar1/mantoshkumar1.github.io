# mantoshkumar1.github.io — Vision

## Goal
Create a permanent home for Mantosh Kumar's engineering work that demonstrates how he thinks, what he builds, and the impact of that work.

## Success Criteria
A visitor should be able to understand within two minutes:
- Who Mantosh is.
- What kinds of engineering problems he solves.
- What systems he has built.
- How he thinks.
- How to contact him.

## Core Principles
- Keep the platform intentionally simple.
- Prefer content over decoration.
- Treat the website as a long-term engineering publication.
- Do not redesign for trend-driven reasons.
- Add new work as content, not as new platform engineering.

## Core Pages
- Home
- Systems
- Insights
- Experience
- Resume
- Contact

## Maintenance Philosophy
The site should remain stable, documentation-like, and low-maintenance. Future growth should come from publishing new projects, articles, and notes.

## Current implementation boundary

The presentation remains static and progressively enhanced. Searchable answers are a separate Cloudflare Worker so the public site keeps no provider credential and remains useful if the AI service is unavailable. Git-tracked public Markdown is the retrieval source of truth; the model is never a source of evidence.

The implemented production state is documented in [`docs/SYSTEM_STATE.md`](docs/SYSTEM_STATE.md). Vision describes intent; that document describes what is deployed now.
