# Public disclosure checklist (draft for founder adoption)

**Status:** proposed on 2026-10-26; not adopted, not an enforced publication gate, and not permission to publish any particular project or experience. This is an editorial checklist, not legal, employer, IP, licensing, or confidentiality clearance. A public repository, launch, or prior publication does not by itself establish permission for a new claim.

This proposal is intended for each new Insight or Project candidate. It does not replace the existing evidence and publication rules in [AGENTS.md](../AGENTS.md), [VISION.md](../VISION.md), [PUBLISHING_INSIGHTS.md](PUBLISHING_INSIGHTS.md), or [PUBLISHING_PROJECTS.md](PUBLISHING_PROJECTS.md). Those existing rules remain in force; the checks below still need founder adoption before being described as an implemented process.

## 1. Classify every material claim

For each claim about a system, project, outcome, responsibility, market, or comparison:

- Label its state accurately: **shipped/current**, **completed as of a date**, **in progress**, **roadmap**, or **aspiration**.
- Support shipped/current claims with a relevant public source or dated verification. State the scope and “as of” date; a source tree, configuration, or intended design alone does not prove a live deployment or current behavior.
- Keep roadmap and aspiration statements visibly separate from shipped behavior. Do not use present tense or launch language for work that is planned, partial, or unverified.
- Support measurements with the value, unit, time window, population/scope, method, and a source that can be published. If any element is missing or confidential, omit the number rather than imply a result.
- Check that the claim says only what its evidence establishes. Do not infer adoption, reliability, customer use, employer impact, or business results.

## 2. Active open-source work

- Link to a repository, commit, release, issue, or source file only when it is actually public, relevant to the claim, and appropriate to expose.
- Check the specific content being linked, not only the repository visibility. Do not include secrets, private configuration, unpublished vulnerabilities, restricted customer material, or details whose ownership or permission is unresolved.
- Public availability is evidence of access, not proof of authorship, licensing rights, employer permission, or permission to make a new claim. If any of those boundaries are unclear, hold the material for the actual owner decision.

## 3. Commercial or private products

**Before launch:** use only high-level wording that the responsible owner has explicitly cleared for public use. Do not expose nonpublic product strategy, unreleased features, customer or contract details, pricing plans, market targets, internal architecture, or operational controls.

**After launch:** verify the feature or behavior against a dated public product source or other approved evidence. A launch does not make every internal detail public or prove current availability, usage, uptime, or customer adoption.

Choose the link that matches the evidence: use a stable public product URL for product behavior; use a repository link only if source is intentionally public and appropriate. Do not imply that private source or internal systems are available to inspect.

## 4. Employer-derived experience

- Describe only the individual's substantiated contribution and the evidence that may be disclosed.
- Exclude nonpublic employer or customer source, architecture, security details, incidents, metrics, names, and internal processes unless the appropriate owner has explicitly cleared the specific material.
- Generalize only when the result is both accurate and safe; removing names does not automatically remove confidentiality or ownership concerns.
- If ownership, confidentiality, or permission is uncertain, mark **HOLD** and seek the actual responsible decision-maker. An AI review is not employer or legal clearance.

## 5. Market and competitor claims

- Use a dated, attributable source for every market-size, adoption, ranking, pricing, or competitor-comparison claim. Record the source’s publication date, the date checked, geography, time period, and definition of the measure.
- Compare like with like and retain enough context for a reader to interpret the comparison.
- Exclude claims with no suitable public source, stale evidence, mismatched definitions, or unresolved permission. Do not present estimates or marketing language as verified facts.

## 6. Source-link choice

- Link to source when it is public, relevant, and the claim is about code or an inspectable implementation.
- Link to the public product when the claim is about visitor-visible behavior and the product URL is stable.
- Use a public article, release note, or approved evidence page when that is the strongest permitted source.
- Do not link to private systems, account identifiers, deployment settings, secret storage, or internal material. Never imply a link proves more than the linked evidence shows.

## 7. Proposed review record

For a future adoption of this checklist, retain a short record with:

| Field | Record |
|---|---|
| Candidate | Insight/Project title, draft version or commit, intended publication date |
| Claims | Material claim, state label, exact scope and supporting source |
| Evidence dates | Source publication/update date and date checked |
| Disclosure boundary | Open-source, commercial/private, employer-derived, or market claim |
| Link choice | Public source, product, article, or no link, with reason |
| Owner decision | Actual responsible owner and specific permission decision, if needed |
| Outcome | Include, hold, or exclude; date and unresolved items |

**Default for unresolved items:** hold or exclude the claim. This record does not certify legal compliance, transfer ownership, or authorize publication. The proposal itself creates no approval, release, or merge workflow.

## Adoption boundary

The existing evidence-first rules are settled repository guidance. The category checks and review-record process in this document are a proposal for founder adoption. Do not describe the proposal as adopted, automated, legally sufficient, or applied to all recent content until those separate decisions and reviews actually occur. Issue #51's review of recent DogBuild/PingStep content remains a separate open criterion; this document does not claim that review is complete.
