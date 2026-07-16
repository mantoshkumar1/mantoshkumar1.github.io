# mantoshkumar1.github.io — Vision

## Goal
Create a permanent home for Mantosh Kumar's engineering work that demonstrates how he thinks, what he builds, and the impact of that work.

The primary commercial objective is to attract Staff Engineer and Principal Engineer opportunities from companies and recruiters. Staff Software Engineer remains Mantosh's documented current title; Principal Engineer is a target level. Engineering contracts remain a secondary path. Public positioning should remain location-neutral beyond Mantosh's current Toronto, Canada location and verified work authorization.

Optimize for credible commercial conversion: help a recruiter or client assess fit, remove practical hiring uncertainty, and start a valuable conversation. Do not frame Mantosh as a superhero, inflate titles, or publish claims that cannot survive verification. Earnings are an intended outcome of trusted positioning, not a visitor-facing boast.

## Success Criteria
A visitor should be able to understand within two minutes:
- Who Mantosh is.
- What kinds of engineering problems he solves.
- What systems he has built.
- How he thinks.
- How to contact him.
- That he is open to Staff or Principal Engineer opportunities and engineering contracts.

## Core Principles
- Keep the platform intentionally simple.
- Prefer content over decoration.
- Treat the website as a long-term engineering publication.
- Do not redesign for trend-driven reasons.
- Add new work as content, not as new platform engineering.

## Core Pages
- Home
- Projects
- Insights
- Experience
- Resume
- Contact

## Maintenance Philosophy
The site should remain stable, documentation-like, and low-maintenance. Future growth should come from publishing new projects, articles, and notes.

## Current implementation boundary

The presentation remains static and progressively enhanced. Searchable answers are a separate Cloudflare Worker so the public site keeps no provider credential and remains useful if the AI service is unavailable. Git-tracked public Markdown is the retrieval source of truth; the model is never a source of evidence.

## Ask Mantosh product boundary

Ask Mantosh is an intelligent navigation and explanation layer for Mantosh's published engineering work. It is not a general-purpose AI assistant, and adding general-purpose capability is not a product goal.

It may handle greetings, jokes, clarification, and light conversation when that makes the portfolio experience feel natural. Those interactions must support the visitor's journey rather than compete with general assistants. Clearly unrelated requests should receive one brief, natural redirect with no sources, evidence footer, related reading, generated follow-up, or unexplained dead end.

Every proposed Ask Mantosh enhancement must pass this vision check before implementation:

- Does it help a visitor understand Mantosh's work, judgment, experience, or fit—or find relevant published evidence?
- Does it preserve the public-evidence boundary and reduce rather than increase unsupported inference?
- Does it keep the experience focused, concise, private, and credible?
- Is it more useful here than in a general-purpose assistant?

If the answer is no, unclear, or depends mainly on novelty, engagement, imitation of ChatGPT, or capability breadth, stop before implementation and challenge the proposal. Prefer rejecting a feature over weakening Ask Mantosh's identity.

The implemented production state is documented in [`docs/SYSTEM_STATE.md`](docs/SYSTEM_STATE.md). Vision describes intent; that document describes what is deployed now.
