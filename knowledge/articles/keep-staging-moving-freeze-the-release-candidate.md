---
title: "Keep Staging Moving. Freeze the Release Candidate."
slug: "keep-staging-moving-freeze-the-release-candidate"
category: "article"
tags: ["release-engineering", "ci-cd", "ai-assisted-engineering", "staging", "release-candidate"]
summary: "A release-pipeline design that keeps staging moving for integration while a separate immutable release candidate receives the expensive full qualification."
last_updated: "2026-09-13"
related_topics: ["make-the-banks-deterministic", "tests-are-the-cheapest-check", "release-reports-as-operational-history", "pingstep"]
visibility: "public"
url: "/insights/keep-staging-moving-freeze-the-release-candidate.html"
---

# Keep Staging Moving. Freeze the Release Candidate.

I learned a simple release-engineering lesson while preparing the Free release of PingStep: a moving integration branch and a release candidate want opposite things.

Integration wants movement. Qualification wants immutability.

When permanent `staging` does both jobs, every new staging merge invalidates the exact evidence being collected for release. That is safe for a first release, but it serializes work that does not need to be serialized.

## Target topology

The cleaner model is:

```text
feature/fix branches
→ focused PR qualification
→ continuously moving staging
→ deterministic affected/integration tests
→ deliberately cut immutable RC-N
→ full release qualification
→ human GO / NO-GO
→ production
```

After `RC-N` is cut, staging should keep accepting independently admissible work. Those new commits belong to a later candidate and do not change `RC-N`.

## Candidate failure rule

A failed release candidate should remain failed and immutable:

```text
RC-17 fails
→ preserve RC-17 and its evidence
→ fix through a normal branch
→ integrate the fix into staging
→ cut RC-18
→ qualify RC-18
```

Do not patch a failed candidate in place.

The related test-integrity rule is: when the product is wrong, preserve the test and repair the product. A test contract changes only when there is separate evidence that the test itself is wrong or the authoritative product intent changed.

## Tier the test cost

Not every commit should run the complete release suite.

- **Feature branch:** focused unit/integration tests, affected browser/system tests, and mandatory protection gates.
- **Staging:** integration smoke plus deterministic change- and dependency-aware tests. Ambiguous impact should expand testing, not reduce it.
- **Release candidate:** the complete qualification — browser journeys, real system boundaries, security, migrations, accessibility, cleanup, and release evidence.

Agents should not decide ad hoc that a test is unnecessary. Pre-RC selection should be deterministic and governed.

## Human authority boundary

The desired operating model is broad AI execution freedom through implementation, review, staging, repairs, and creation of a qualified candidate, while production remains human-authorized.

The human interface becomes:

> Show me one immutable candidate that has passed the complete qualification. Then ask me whether to release it.

## Evidence boundary

This is a first-person release-engineering lesson from preparing the Free release of PingStep, a product I am building. It describes a post-release pipeline design motivated by the cost of using one staging branch as both the moving integration surface and the release candidate. It does not claim measured throughput improvement, production-scale adoption, or that the full post-release design is already deployed.
