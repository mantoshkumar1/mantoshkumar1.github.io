# Review packet: AI-assisted change and production release

Status: shortened at the founder's request on 21 October 2026. Independent review of this shorter revision and founder editorial approval remain pending. The earlier CLEAN applies only to head 987154332f723ea7b20c11ea54eef3751ccd1349.

## Deliverables and scope

- [Complete article draft](../drafts/ai-can-write-the-change-who-controls-the-release.md).
- [Draft retrieval companion](../../knowledge/articles/ai-can-write-the-change-who-controls-the-release.md), excluded from the public knowledge index by `visibility: draft`.
- Existing [deployment runbook](../../chat-worker/docs/DEPLOYMENT.md) remains the operational reference. The article links it rather than duplicating dispatch or credential instructions.

This is the founder-requested Ask Mantosh-focused slice of [#99](https://github.com/mantoshkumar1/mantoshkumar1.github.io/issues/99). It does not complete the broader DogBuild/PingStep workflow article. No public HTML route, SEO entry, feed/sitemap/card registration, protected test/audit change, workflow change, merge or publication is included. Website board #98 retains the separate #105 audit diagnosis lane.

The existing #99 body contains setup-era operational statements. The pinned source, run and receipt below support the article's dated 18 October state; they do not establish present private environment or provider access settings.

## Factual claims for independent review

All code references below use source e506385c9fa08d11f19d73cfb697ab9782331545.

| Claim | Primary evidence | Limit / review question |
| --- | --- | --- |
| Only specified Worker paths trigger automatic release on main | [Automatic workflow](https://github.com/mantoshkumar1/mantoshkumar1.github.io/blob/e506385c9fa08d11f19d73cfb697ab9782331545/.github/workflows/release-ask-mantosh-on-merge.yml), push paths | Docs/tests/knowledge/static files alone are excluded; do not imply every merge deploys the Worker |
| Workflow checks founder merge, exact source and first attempt | Same workflow, provenance and repeated source steps | These checks do not validate the substance of independent review |
| Codex produced the canary change; a separate Claude AI review preceded the founder merge | [Codex producer](https://github.com/mantoshkumar1/mantoshkumar1.github.io/issues/77#issuecomment-6241372275), [Claude AI review CLEAN](https://github.com/mantoshkumar1/mantoshkumar1.github.io/issues/77#issuecomment-6242511814), [Strategy acceptance](https://github.com/mantoshkumar1/mantoshkumar1.github.io/issues/77#issuecomment-6242729948), [PR106](https://github.com/mantoshkumar1/mantoshkumar1.github.io/pull/106) | Do not claim the release YAML itself enforces every review rule |
| Verification includes tests/evaluation, browser suite, audit and dry run | Automatic workflow verify job; [run39169924619](https://github.com/mantoshkumar1/mantoshkumar1.github.io/actions/runs/39169924619) | No new test-count claim or claim that complete site verification passed |
| Latest matching receipt must be successful; failed latest receipt is not bypassed | Automatic workflow baseline selection code | A pre-production blocked comment has a different prefix; avoid treating it as a release receipt |
| Zero exit, version correlation, smoke and final sole-100% observation succeeded | [Bot receipt6255657485](https://github.com/mantoshkumar1/mantoshkumar1.github.io/issues/77#issuecomment-6255657485), automatic workflow predicates and run | Release-time observation only; no independent later Cloudflare observation |
| Profile smoke is deterministic and has bounded coverage | Automatic workflow smoke code; [profile handler](https://github.com/mantoshkumar1/mantoshkumar1.github.io/blob/e506385c9fa08d11f19d73cfb697ab9782331545/chat-worker/src/index.js) | Does not prove all retrieval/generation or UI behaviour |
| Founder-gated manual recovery and one-routine-writer procedure remain | [Deployment runbook](../../chat-worker/docs/DEPLOYMENT.md), [manual workflow](https://github.com/mantoshkumar1/mantoshkumar1.github.io/blob/e506385c9fa08d11f19d73cfb697ab9782331545/.github/workflows/release-ask-mantosh.yml) | Procedure, not provider race prevention; manual workflow deploys current main, not an arbitrary older version |
| No automatic rollback/release retry and no lossless concurrency queue | Automatic workflow and runbook concurrency/recovery sections | Bounded retries of a smoke observation are different from repeating the deployment |
| Ask Mantosh link opens chat | Existing [widget](../../assets/js/ask-mantosh-widget.js) hash-loading path and [client](../../assets/js/main.js) `#ask-mantosh` open handler | Draft links use the absolute homepage URL plus fragment; no new widget behaviour |
| HTML, Worker and knowledge have separate release paths | [Pages workflow](../../.github/workflows/deploy-pages.yml), [knowledge workflow](../../.github/workflows/sync-knowledge.yml), automatic Worker workflow | Do not describe Pages approval or knowledge sync as part of Worker deploy success |

## Disclosure and voice self-review

- No secret values, account IDs, storage identifiers, private configuration screenshots, unpublished employer details or internal local paths are included in the article or knowledge companion.
- No claim of fully autonomous approval, guaranteed safety, complete permission isolation, general AI-answer correctness, measured time savings, uptime or customer impact.
- The article attributes founder decisions, AI-assisted work, GitHub Actions execution and Cloudflare deployment separately.
- The canary is described as a comment-only production-path test, not a behavioural feature, staged rollout or recovery drill.
- Source code and workflow observations are separated from private settings and release-time provider observations.
- Author self-review does not grant independent approval or merge authority.

## Validation record

Exact base: e506385c9fa08d11f19d73cfb697ab9782331545. Local preparation recovered 19 missing text objects through DogBuild exact-commit reads in an isolated copy. Every one of 203 tracked files was hashed against the exact base tree; all matched and git status was clean before drafting.

Before editing, these checks passed: documentation audit, internal link/anchor/asset audit and Ask Mantosh coverage audit. The unchanged `node scripts/audit-site.mjs` exited 1 with the eight failures tracked in #105: stylesheet cache versions; homepage chronology; homepage Staff/Toronto signal; project action order; relocation wording on home/contact/resume; résumé verified-highlights/capabilities bridge. This confirms current-main reproduction only. It does not classify those failures or establish the historical/series comparison.

Post-draft results:

- `node scripts/audit-docs.mjs` — exit 0; 21 public documents unchanged.
- `node scripts/audit-links.mjs` — exit 0 for the site's HTML links. This script does not parse the draft Markdown, so this result does not validate the article's own links.
- `node scripts/audit-ask-mantosh-coverage.mjs` — exit 0; 18 evidence routes, 7 utility routes and 9 non-evidence routes cover the same 33 HTML routes.
- `node scripts/build-pages.mjs` — exit 0.
- `npm run audit:performance-budget` — exit 0; public artifact excluding PDF is 692,911 bytes.
- `git diff --check` — exit 0, including all three new files after intent-to-add.
- `node scripts/audit-site.mjs` — exit 1; output is byte-for-byte identical to the eight-failure unchanged-base output. No check was weakened or skipped to change that result.
- Build-output inspection confirms the draft article, review packet, draft knowledge source and proposed public HTML route are absent from `dist/`. Public knowledge count and published routes are unchanged.
- Chat-link behaviour was traced through the existing widget hash-loading path and client open handler. A new browser run could not start because this environment has no installed Chromium executable; no browser download or installation was performed. Browser opening and layout review remain independent-review/publication checks.

Exact PR-head evidence is recorded in the PR description and canonical #99 comment. Full `npm run verify` and a browser-suite run are not claimed by this documentation draft. All protected files remain unchanged.

## External review and author response — 19 October 2026

[External Claude review6257408542](https://github.com/mantoshkumar1/mantoshkumar1.github.io/pull/107#issuecomment-6257408542) reviewed initial head `ef7c3a8f53b224f1502f7962c6ca5f31747796ac`. It is findings-bearing, not publication approval.

- B2 accepted: article and draft retrieval companion now explicitly identify Codex as AI producer, Claude as a separate AI reviewer, and the founder as the merge decision-maker. The canary evidence mapping names both AI roles.
- B1 is a source mismatch: the quoted “Reliability boundaries” section, automatic-recovery sentence and stopped-service restart example are absent from the reviewed head. The actual draft explicitly states no automatic rollback or release retry. No nonexistent paragraph was deleted. [Exact-head triage6257430508](https://github.com/mantoshkumar1/mantoshkumar1.github.io/pull/107#issuecomment-6257430508) records this distinction.
- The external reviewer reports manual draft-link checks and a successful browser check of the existing chat-opening fragment. These are attributed reviewer observations, not new author browser executions. The HTML link audit above does not cover the Markdown draft.
- Optional editorial suggestions remain suggestions. No fresh private-settings, token-scope or provider-state proof is inferred from a public runbook or review.
- The author remains recused from independent approval. Review of the revised exact head remains outstanding; the three files stay draft-only, with no publication integration or protected audit changes.

## Shorter article revision — 21 October 2026

The founder requested a 3–4 minute article after reading the HTML preview. The shorter text keeps the real comment-only release and three lessons: decision ownership, source identity and observed production outcome. Detailed workflow inventories, repeated caveats and recovery instructions stay in this evidence packet and the linked runbook. The knowledge companion names the roles in the specific canary rather than implying permanent model assignments.

[Claude review6280040392](https://github.com/mantoshkumar1/mantoshkumar1.github.io/pull/107#issuecomment-6280040392) was CLEAN at prior head 987154332f723ea7b20c11ea54eef3751ccd1349 and withdrew B1 as a reviewer source error. That verdict does not approve this shortened wording. Author self-review preserves the AI-reviewer disclosure, human merge decision, dated release evidence and release-time limits. Fresh independent review of the shorter revision remains pending.

## Editorial assessment required by AGENTS.md

Classification: technical article, using a bounded personal-project case study. Its depth comes from explicit authority, provenance, baseline and recovery decisions, with a real successful run for evidence.

Author's editorial score: **86/100** — engineering depth 23/25; original insight 15/20; practical value 18/20; evidence 14/15; longevity 8/10; brand alignment 8/10. Recommendation: **APPROVED WITH IMPROVEMENTS** for independent review, not for publication or merge.

Specific improvements before publication: independently verify every claim in the table; check that the authority discussion adds something beyond the existing tests article; trim any repetitive safeguards; integrate the final approved copy into the article template and keep the chat CTA working. The strongest hiring signal is the ability to explain operational limits and show evidence without overstating autonomy. A useful later follow-up is a separately evidenced recovery drill; none is claimed here.

Related work: the existing tests article and release-reports note. Reuse the central authority/evidence explanation as an interview story or concise LinkedIn introduction after editorial approval. The draft knowledge companion carries the proposed title, tags, summary, keywords through tags/related topics, canonical route and evidence limits; keep it draft until publication.

## Publication handoff after independent review

1. Resolve editorial and technical findings; founder approves the final wording.
2. Create `insights/ai-can-write-the-change-who-controls-the-release.html` from `templates/article.html`, preserving evidence boundaries. Use the existing `href="#ask-mantosh"` mechanism for on-page chat links. For the current GitHub-readable draft, the absolute homepage fragment opens the chat.
3. Set the real publication date, SEO/card metadata, Insights index and llms entry. Generate homepage teaser, feed and sitemap through the existing generator.
4. Obtain exact founder authority before the protected audit registration; do not weaken any assertion. Address the separate #105 release-verification blocker through its own reviewed work.
5. Review the paired knowledge source and set it public only with the completed publication change. Update truthful corpus counts and coverage, then run complete release gates and independent exact-head review.
6. Founder decides merge/publication. Afterwards verify the exact-main page and direct/paraphrased/unrelated Ask Mantosh questions. This PR alone publishes nothing.

## Final actions

- [ ] Publish now
- [x] Improve first — independent review and publication integration pending
- [ ] Convert into a project page
- [x] Convert into an article — complete draft supplied
- [x] Convert into documentation — release design and source/runbook references supplied
- [ ] Save for later
