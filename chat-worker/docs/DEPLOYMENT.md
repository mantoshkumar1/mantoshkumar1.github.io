# Deployment and rollback

## Environment standard

Production is the only environment declared in this repository. If staging is
introduced, use separate Cloudflare Workers, D1 databases, Vectorize indexes, rate-limit
namespaces, and secrets for `staging` and `production`. Never point staging at
production knowledge storage. Set production origins explicitly.

## Worker release sequence

The production path is [Release Ask Mantosh Worker](../../.github/workflows/release-ask-mantosh.yml).
It is started manually from `main`; a push, schedule, or Pages deployment does
not release the Worker. The release workflow checks the original actor and
the current triggering actor, including on re-runs.

Before its first use, the founder must create the `ask-mantosh-production`
GitHub environment with `mantoshkumar1` as a required reviewer and set
**environment secrets** `ASK_MANTOSH_CLOUDFLARE_API_TOKEN` and
`ASK_MANTOSH_CLOUDFLARE_ACCOUNT_ID`. The token should have Cloudflare Workers
**Editor** for only the existing `ask-mantosh` Worker in the intended account;
the current `wrangler.toml` does not change routes or domains and does not
require D1/Vectorize data permissions for deployment. Verify the actual token
scope in Cloudflare ([Workers roles and permissions](https://developers.cloudflare.com/workers/authorization/workers/)). If the founder initiates and approves the same run, leave
GitHub's optional **Prevent self-review** setting off. Confirm the two secret
names exist **only** at the environment level, with no same-named repository or
organization fallback. Do not put the token in files, issue comments, or
workflow inputs. The account ID is recorded separately as a non-secret release
identity; the workflow compares it with the environment value before any
Cloudflare write.

The YAML cannot prove that GitHub's environment has a required reviewer or
that a resolved secret came from that environment. Before **each dispatch**,
the founder must read back the environment protection, environment-only secret
names and absence of fallbacks, Cloudflare token scope, current account and
Worker bindings/configuration, and the active 100% version. Confirm that no
other dashboard, CI or CLI writer will deploy this Worker during the release.
Publish a new, unedited JSON comment on [issue #77](https://github.com/mantoshkumar1/mantoshkumar1.github.io/issues/77)
with these asserted facts (no token value):

The `wrangler_blob` is the `sha` returned by the [GitHub main-branch file API](https://api.github.com/repos/mantoshkumar1/mantoshkumar1.github.io/contents/chat-worker/wrangler.toml?ref=main); it is also `git hash-object chat-worker/wrangler.toml`. The comment body must be the JSON object itself, without Markdown fencing.

```json
{
  "schema": "ask-mantosh-release-conformance-v1",
  "expected_sha": "FULL_CURRENT_MAIN_SHA",
  "expected_prior_version": "CURRENT_100_PERCENT_VERSION_UUID",
  "environment": "ask-mantosh-production",
  "founder_required_reviewer": "mantoshkumar1",
  "prevent_self_review": false,
  "environment_only_secrets": true,
  "no_repository_or_organization_fallback": true,
  "token_worker_editor_scope_verified": true,
  "live_bindings_verified": true,
  "exclusive_production_writer_window": true,
  "worker": "ask-mantosh",
  "account_id": "32_LOWERCASE_HEX_ACCOUNT_ID",
  "wrangler_blob": "GIT_BLOB_SHA_OF_CHAT_WORKER_WRANGLER_TOML"
}
```

The workflow checks the comment author, issue, edit state and exact identities
both before testing and after environment approval. The comment is a founder
attestation, **not** automatic proof of Cloudflare or GitHub settings. If any
item cannot be confirmed, do not dispatch; never mark an unknown fact `true`.

After the workflow has passed protected-path review and merged:

1. Confirm the intended full 40-character `main` SHA and the current Cloudflare
   production Worker version serving 100% of traffic. Enter both exact values
   and the new conformance comment's numeric ID as the workflow inputs.
2. Dispatch the workflow from `main` as `mantoshkumar1`. It checks the exact
   source, runs Worker tests and the offline evaluation, runs browser tests,
   and validates the bundle with Wrangler's dry run. Review the pending
   `ask-mantosh-production` deployment and approve it deliberately.
3. After approval, the workflow rechecks `main` and the conformance record,
   installs locked Worker dependencies, compares the Cloudflare account ID,
   then queries the active production version immediately before deploy. A
   version mismatch or traffic split stops it before the write. This is a read
   followed by a write, **not** Cloudflare compare-and-swap: another writer can
   still race between them. The founder's exclusive-writer window is therefore
   required. The workflow deploys only the existing `ask-mantosh` configuration.
4. It queries production after **every** deploy attempt, including a Wrangler
   error, and compares the observed 100% version to the version reported by
   that attempt. Success requires a zero Wrangler exit, exact correlation and
   passing health, public-profile and SSE smokes. Those probes retry up to
   12 times at five-second intervals. If live public-profile facts are missing,
   the fail-closed answer may cause smoke failure; inspect the D1 evidence.
   The run summary and issue #77 record the prior version, Wrangler exit,
   reported version, observed version and correlation. An uncertain or
   post-write failure requires production inspection and an explicit rollback
   decision. There is no automatic rollback.
5. Update [`../../docs/SYSTEM_STATE.md`](../../docs/SYSTEM_STATE.md) and the
   DogBuild control board from the actual successful release receipt.

For each Worker change, also follow these application steps:

1. When prompts, formatting, or answer policy change, increment
   `ANSWER_POLICY_VERSION` so eligible cached responses cannot retain the old
   behavior.
2. Apply additive D1 migrations required by the release; the manual release
   workflow deliberately does not change the database schema.
3. If a separate staging environment exists, promote the tested immutable
   version rather than rebuilding it.
4. Run a full knowledge sync only when schema or indexing behavior requires it;
   normal Markdown changes use the automatic changed-file workflow.

The Worker must expose `GET /health` with no sensitive configuration detail.
Deploy a changed knowledge document, then verify its answer becomes visible.
The optional KV cache-version binding is not enabled in the committed
production configuration, so the current correctness boundary is TTL expiry.

## Future automatic release after founder merge

The first release still follows the manual sequence above. It establishes a successful,
GitHub Actions-authored release receipt on issue #77. The separate
[merge-triggered release](../../.github/workflows/release-ask-mantosh-on-merge.yml)
is prepared for later Worker changes. It has no schedule and does not run for
static Pages, knowledge Markdown, tests or documentation changes.

After a reviewed exact-head PR is founder-merged into `main`, a change to
`chat-worker/src/**`, `wrangler.toml`, or the Worker package files starts a
release of that exact merge commit. The workflow requires the push actor and
associated merged PR to be the founder, rechecks current `main`, rejects a
migration in that merge, pins the existing Worker and storage identities, then
runs Worker tests, evaluation, browser tests and a Wrangler dry run. It reads
the latest unedited successful GitHub Actions release receipt on #77 as the
expected prior version; if no successful manual baseline exists, or the latest
receipt records a failure, it stops. The production job compares that version
to the authenticated 100%-traffic Cloudflare version before writing. It
deploys, correlates the version, checks health/profile/stream, checks the
100%-traffic version again, and posts a receipt on #77. A changed `main`,
split traffic, missing secret, drift, uncertain deploy or smoke failure
fails closed and requires a human decision. No automatic rollback occurs.

This path uses a separate `ask-mantosh-auto-production` GitHub environment,
so the existing required-reviewer `ask-mantosh-production` environment and
manual release remain intact. **Do not configure the automatic environment
before the first manual release and protected-path review of its workflow.**
One-time activation then requires the founder to restrict that environment
to `main`, set only its two environment secrets
`ASK_MANTOSH_CLOUDFLARE_API_TOKEN` (Workers Editor limited to the existing
`ask-mantosh`) and `ASK_MANTOSH_CLOUDFLARE_ACCOUNT_ID`, confirm no same-name
repository or organization secret fallback, and deliberately leave the
automatic environment without a required reviewer. Its lack of a second
approval means the founder's PR merge is the production decision.

The two GitHub release workflows share one concurrency group with no
in-progress cancellation; pending merge releases are queued. This excludes
overlapping deployments **from these two workflows**. The Cloudflare version
comparison and post-deploy checks detect many external writes but do not
provide a Cloudflare compare-and-swap or lock out dashboard, CLI, other CI,
and secret writers. Only activate automatic release after confirming the
ordinary operating rule that nobody else deploys `ask-mantosh` while a
release is in flight. If that cannot be maintained, keep the automatic
environment without a token and use the manual founder-gated path. D1
migrations and binding identity changes need a separate reviewed release
plan.

## Rollback and recovery

Use `wrangler rollback` (or promote the prior Worker version) for code rollback.
Do not roll back D1 migrations destructively: use additive migrations, restore
with D1 time-travel only after confirming the target time, then reindex from
Git. Git-tracked Markdown plus a deterministic sync job is the recovery source
of truth for D1 and Vectorize.

When staging exists, maintain a quarterly recovery drill: recreate an empty
staging index and D1 database, apply migrations, run a full knowledge sync, and
execute smoke tests. Until then, this remains an operating standard rather than
a completed production control.
