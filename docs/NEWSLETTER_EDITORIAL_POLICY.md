# Newsletter editorial policy — proposal for founder adoption

> **Status: PROPOSAL ONLY.** This document is not adopted or effective policy. It does not authorize publishing content, choosing recipients, sending email, or changing a newsletter provider.

## What the repository promises

The tracked [newsletter page source](../newsletter/index.html) promises concise, evidence-backed engineering notes about platform engineering, automation, backend systems, operational intelligence, and reusable systems. It says readers may receive:

- engineering decisions explained through constraints and trade-offs;
- practical patterns for reducing repeated work and improving developer workflows;
- lessons from documented projects, systems, and operational investigations; and
- no fixed-frequency filler, only notes with a useful, evidence-backed idea.

That is the promise represented in this repository. The file does **not** establish what a hosted page currently displays, what Buttondown is configured to do, whether an archive exists or is complete, how delivery behaves, or what subscribers have received. Those facts were not inspected for this proposal.

The existing [Insights publishing guide](PUBLISHING_INSIGHTS.md) and [Projects publishing guide](PUBLISHING_PROJECTS.md) explain website content, retrieval sources, and build behavior. They do not establish newsletter send behavior.

## Proposed default: choose each send individually

If adopted, a human editor would make and record an explicit decision for each proposed send. Publishing or merging an Insight, Project, or note would **not** automatically send email. There would be no minimum cadence, scheduled filler, or obligation to send. If no candidate meets the criteria below, skip the send.

This is a proposed editorial rule, not a claim about current delivery or provider configuration.

## Proposed eligibility

| Candidate | Eligible for consideration when | Default treatment |
|---|---|---|
| New Insight | It is published, contains a concrete engineering decision, constraint, pattern, or lesson, and its substantive claims have durable public evidence. | Consider once after the normal content review. Do not send automatically on publication. |
| New Project | Its published case study documents a system or project and explains a useful engineering trade-off, decision, or operational lesson supported by public evidence. | Consider the lesson, not the mere existence of a new project page or homepage card. |
| Engineering note | It is a self-contained, reusable engineering insight with enough context and evidence to make sense outside the website. | Consider once if it adds a distinct useful idea; a short note is not automatically newsletter material. |
| Substantive update | It materially changes a published item’s evidence, technical conclusion, constraints, observed outcome, or reader takeaway. The update can be described precisely and linked to the revised source. | Consider an update notice only when readers gain a meaningful new lesson. State what changed; do not resend for cosmetic or administrative changes. |

A candidate is not eligible merely because it is recent, public, prominent, or easy to email. A public URL does not by itself establish permission to disclose employer, customer, personal, or proprietary information.

## Proposed exclusions

Do not email:

- typo, formatting, navigation, SEO, metadata, or routine maintenance changes;
- security or administrative-only updates;
- an unpublished draft, speculative claim, unverified metric, or roadmap item presented as an achieved result;
- material that depends on private, employer-derived, customer, or otherwise confidential information without an explicit owner decision allowing its use;
- a repeated article or project update that offers no distinct, substantive value;
- generic announcements or promotional material that does not explain a useful engineering idea; or
- any item that cannot meet the evidence and confidentiality checklist below.

When permission, evidence, or the significance of an update is unclear, hold or skip it. Do not infer clearance from repository visibility.

## Proposed per-send checklist

Before deciding **SEND**, the human editor would record and verify:

1. **Candidate and source:** content category, canonical published URL, and exact repository commit or source revision reviewed. For a paired article or project, inspect both the page and its public knowledge source where one exists.
2. **Engineering value:** the specific decision, constraint, trade-off, practical pattern, or reusable lesson a reader gains. “New” or “popular” is not sufficient.
3. **Evidence:** each material factual claim is traceable to an appropriate public source. Separate observed results from interpretation, hypothesis, and planned work; retain dates and scope where they affect meaning.
4. **Confidentiality and permission:** no secret, private record, customer detail, or employer-derived material is included without an explicit owner decision. Public availability alone is not proof of disclosure permission.
5. **Distinct value:** compare with the available record of prior editorial selections. Identify what is new; do not claim a complete send-history or archive comparison unless that record was actually checked.
6. **Promise fit:** the item fits the repository’s evidence-backed engineering scope and does not create a fixed-frequency commitment or imply a service guarantee.
7. **Decision record:** record SEND or SKIP, the rationale, editor, date, candidate URL, and reviewed source revision in the owner-approved location. Keep this record limited to editorial evidence; do not include subscriber details.

If any required item cannot be verified, choose **HOLD** or **SKIP** rather than filling the gap with an assumption.

## Proposed workflow and source of truth

If the founder adopts this proposal:

1. Publish and review the website content using the applicable existing publishing guide.
2. Evaluate it against the eligibility rules and checklist above.
3. Record one human editorial decision—SEND, HOLD, or SKIP—against the exact source revision. An eligible result is still not a send authorization unless the responsible human explicitly chooses SEND.
4. If SEND is chosen, the authorized human handles any actual delivery through the separately approved process. This proposal does not specify or change a provider, configuration, recipient list, or delivery mechanism.

The adopted version of this document would be the repository source of truth for **editorial eligibility**. The tracked newsletter page remains the source of the repository’s public promise; published HTML and paired public knowledge files remain the sources for website claims. An actual-send record, if the owner adopts one, would be the evidence for what was selected and sent. None of those records alone proves current hosted configuration, archive completeness, subscriber lifecycle, or delivery.

## Public-copy alignment question for the founder

The tracked page already communicates topic scope, evidence-backed content, and no fixed-frequency filler. It does not say that a human chooses each send individually. That human-per-send rule is only a proposal here. If adopted, the founder can decide separately whether the public description should say so. This proposal intentionally makes no public-copy or publishing-guide change.

## Decisions reserved for adoption

The founder may adopt, revise, or reject this proposal, including:

- whether human selection per send is the default and whether any exception is wanted;
- whether the proposed Insight, Project, note, and substantive-update categories fit the newsletter;
- which role may make the final editorial choice; and
- where the minimal decision record should live.

Until those decisions are made and recorded, this document remains a draft proposal and creates no send policy.
