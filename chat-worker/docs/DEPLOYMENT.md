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

## Automatic release after founder merge

The founder-approved first manual release has succeeded:
[run 37079825108](https://github.com/mantoshkumar1/mantoshkumar1.github.io/actions/runs/37079825108)
recorded an unedited GitHub Actions receipt on
[issue #77](https://github.com/mantoshkumar1/mantoshkumar1.github.io/issues/77#issuecomment-5963376265)
for production version `8feaaf72-ba35-408b-a37f-20719c37a596`.
That is the baseline for the prepared
[merge-triggered workflow](../../.github/workflows/release-ask-mantosh-on-merge.yml).
Automatic release is the target operating path; the manual workflow is a
temporary fallback and an emergency recovery tool.

A founder merge of Worker source, `wrangler.toml`, or Worker package files to
`main` triggers the exact-commit verify and release jobs. The verify job checks
the founder merge, source, fixed bindings, tests, evaluation, browser checks,
audit, and Wrangler dry run. The release job reads the latest successful,
unedited issue #77 release receipt and checks that its version is still serving
100% before deploying. It then correlates the new version, checks health,
profile and SSE responses, rechecks the live version, and posts a receipt.
Drift, uncertain deployment, or smoke failure requires inspection; there is
no automatic retry or rollback. Static Pages, knowledge Markdown, tests, and
documentation changes do not trigger this release.

### One routine writer: pre-activation inventory

[The founder's operating decision](https://github.com/mantoshkumar1/mantoshkumar1.github.io/issues/77#issuecomment-5968430413)
is GitHub Actions as the only **routine** production writer. Founder emergency
access outside GitHub remains break-glass. This narrows the operating boundary:
it does not claim a provider compare-and-swap, and emergency access can still
race if used without first pausing and draining the automatic workflow.
[F-88-1](https://github.com/mantoshkumar1/mantoshkumar1.github.io/issues/77#issuecomment-5862232109)
therefore remains an activation block until the following access evidence and
exception procedure have been reviewed. Keep `ask-mantosh-auto-production`
tokenless while the inventory is incomplete.

Record the following on issue #77 without token values, account keys, or
sensitive settings:

1. The live `ask-mantosh` deployment writer inventory: account members and
   user groups (including product-wide/inherited roles), account and user API
   tokens, Wrangler sessions, other CI, Cloudflare native Git integration,
   and the manual GitHub workflow. Identify each routine writer and each
   retained emergency identity.
2. Evidence that all other **routine** deployment identities and integrations
   for this Worker were removed, disabled, or reduced to non-deploying access.
   Test with a non-authorized routine identity that a production deployment is
   denied. Do not reveal credentials or make a real production deployment just
   to perform the negative test; use permission readback or a non-production
   isolated Worker with equivalent policy when needed.
3. The automatic token's effective **Editor** scope for only the existing
   `ask-mantosh` Worker and account. Verify that the automatic environment is
   restricted to `main`, has no required reviewer, contains the two named
   environment secrets only, and has no same-named repository/organization
   fallback. The manual environment must not retain an independently usable
   **routine** deployment token after cutover.
4. The current 100% production version, exact `main` SHA, last successful
   unedited issue #77 receipt, fixed bindings, and absence of any active or
   pending release run. Confirm that no Worker source/config changes are merged
   during the cutover. A mismatch blocks activation.
5. Deterministic race evidence: inject a simulated external deployment after
   the final version read but before the deploy in an isolated fixture. The
   existing read-then-write workflow would overwrite it, so that test cannot
   be marked safe merely because the later receipt detects some races. The
   accepted boundary must demonstrate that the simulated outside identity
   lacks deploy permission during normal operation; if it can deploy, activation
   remains blocked. Review the complete evidence and exact workflow head
   independently before the founder enables the automatic environment token.

The two GitHub workflows share `ask-mantosh-production-release` concurrency
without in-progress cancellation. This serializes those workflows only; it
does not constrain Cloudflare dashboard, CLI or other CI writers. The
Cloudflare deployment API's published parameters do not provide an
expected-prior-version conditional write. The accepted break-glass exception
and its coordination are part of the release contract, not an atomic lock.

### Emergency deployment and recovery

Before using founder break-glass access, disable the automatic workflow or
remove its production environment credential and wait until every active and
pending automatic release is finished or cancelled **before** an external
production write. Record the reason, actor, starting version, and resulting
version on issue #77. Never use break-glass during an active automatic
deployment. If the automatic workflow has already started writing or its
outcome is ambiguous, inspect production first; do not infer that cancelling
the run undid a write.

After an emergency deployment, keep automation paused. Its last successful
receipt may refer to an older production version and must not be silently
treated as a new baseline. Inspect production, test the resulting version,
and perform a separately founder-approved recovery/baseline release or
reviewed reconciliation procedure. Recheck the writer inventory and live
version before re-enabling automatic credentials. An external write without
this pause is a release incident: stop automation and investigate.

### Activation

Only after the inventory, access boundary, race evidence, exact-head review
and separate founder cutover decision may the founder configure the
`ask-mantosh-auto-production` environment with
`ASK_MANTOSH_CLOUDFLARE_API_TOKEN` and
`ASK_MANTOSH_CLOUDFLARE_ACCOUNT_ID`, restricted to `main` and with no
required reviewer. The founder's merge is then the ordinary production
decision. No token belongs in repository files or comments. D1 migrations
and binding changes require their own reviewed release plan.

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
