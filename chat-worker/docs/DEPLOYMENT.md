# Deployment and rollback

## Environment standard

Production is the only environment declared in this repository. If staging is
introduced, use separate Cloudflare Workers, D1 databases, Vectorize indexes, rate-limit
namespaces, and secrets for `staging` and `production`. Never point staging at
production knowledge storage. Set production origins explicitly.

## Worker release sequence

The production path is [Release Ask Mantosh Worker](../../.github/workflows/release-ask-mantosh.yml).
This founder-gated manual workflow is started from `main`; a push, schedule,
or Pages deployment does not start **this manual workflow**. The separate
merge-triggered workflow described below will release Worker changes after
its access boundary is reviewed and activated. Both workflows check their
respective actor/source conditions.

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

The manual environment **keeps** this scoped credential for as long as the
manual workflow is meant to stay usable as the founder-gated break-glass path.
Placing the same saved token and account ID in the separate automatic
environment (see [Automatic release after founder merge](#automatic-release-after-founder-merge))
does not remove, rotate or replace the manual environment's credential.

The YAML cannot prove that GitHub's environment has a required reviewer or
that a resolved secret came from that environment. Before **each dispatch**,
the founder must read back the environment protection, environment-only secret
names and absence of fallbacks, Cloudflare token scope, current account and
Worker bindings/configuration, and the active 100% version. Confirm that no
other dashboard, CI or CLI writer will deploy this Worker during the release.
**The automatic release workflow is such a writer.** Once automatic release has
been enabled, do not dispatch the manual workflow until the automatic workflow
has been disabled and every active and pending automatic run has finished or
been cancelled (see [Emergency deployment and recovery](#emergency-deployment-and-recovery)).
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

`exclusive_production_writer_window` asserts that no other process can write
the production Worker for the duration of the release. With the automatic
workflow enabled, that is **not** true: the automatic workflow can start on a
qualifying founder merge and write with the same Cloudflare identity. The
founder may mark it `true` only after the automatic workflow has been disabled
and drained (no active or pending automatic run) and no dashboard, CLI or other
CI writer will deploy during the window. If the automatic workflow is live or
its queue is unknown, do not attest `true` and do not dispatch.

After the workflow has passed protected-path review and merged:

1. Confirm the intended full 40-character `main` SHA and the current Cloudflare
   production Worker version serving 100% of traffic. Enter both exact values
   and the new conformance comment's numeric ID as the workflow inputs.
2. Dispatch the workflow from `main` as `mantoshkumar1`. It checks the exact
   source, runs Worker tests and the offline evaluation, runs browser tests,
   and validates the bundle with Wrangler's dry run. Review the pending
   `ask-mantosh-production` deployment and approve or reject it promptly and
   deliberately. A run left waiting for environment approval still occupies
   the shared release concurrency group (see
   [Concurrency and skipped merges](#concurrency-and-skipped-merges)).
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
Automatic release is the target operating path. The founder-gated manual
workflow remains available for a reviewed current-`main` release or a new
successful baseline after an incident; it cannot select an arbitrary earlier
Worker version. An older-version restore needs a separate, explicit emergency
action and a live compatibility check.

A founder merge of Worker source, `wrangler.toml`, or Worker package files to
`main` triggers the exact-commit verify and release jobs. The verify job checks
the founder merge, source, fixed bindings, tests, evaluation, browser checks,
audit, and Wrangler dry run. The release job selects the **latest matching**
manual or automatic issue #77 release receipt by comment ID. That single
receipt must itself be unedited, successful, and correlated to its run; the
job does not skip a failed receipt to find an older success. It checks that
receipt's version is still serving 100% before deploying, then correlates the
new version, checks health, profile and SSE responses, rechecks the live
version, and posts a receipt even when the release job fails. A failed latest
release receipt blocks later automatic releases until a separately authorized
successful baseline release or reviewed reconciliation. A verification-job
comment headed "blocked before production" has a different prefix and does
not become this baseline. Static Pages, knowledge Markdown, tests, and
documentation changes do not trigger this release.

The [founder selected a simple release path](https://github.com/mantoshkumar1/mantoshkumar1.github.io/issues/77#issuecomment-5986017191)
for this personal portfolio. The current workflow has no automatic retry or
rollback. On a failed or uncertain release, inspect the actual production
version and the latest run/receipt, then make a separately reviewed manual
recovery decision before another automatic release. No unattended monitoring
service is part of this cutover; the Action records its own result. Successful
ordinary Worker merges do not require a second founder approval after cutover.

### One routine writer: pre-activation inventory

[The founder's operating decision](https://github.com/mantoshkumar1/mantoshkumar1.github.io/issues/77#issuecomment-5968430413)
is GitHub Actions as the only **routine** production writer. Founder emergency
access outside GitHub remains break-glass. The
[dual-path configuration](https://github.com/mantoshkumar1/mantoshkumar1.github.io/issues/77#issuecomment-6046181901)
keeps the founder-gated manual workflow ready as a second, **non-routine**
break-glass path: the same scoped Cloudflare credential is held by both the
automatic and the manual GitHub environment. The automatic workflow is the one
routine writer; the manual workflow is used only after a failure or incident,
and never alongside a live automatic workflow. This narrows the operating
boundary: it does not claim a provider compare-and-swap, and emergency access
can still race if used without first pausing and draining the automatic
workflow.
[F-88-1](https://github.com/mantoshkumar1/mantoshkumar1.github.io/issues/77#issuecomment-5862232109)
therefore remains an activation block until the following access evidence and
exception procedure have been reviewed. Keep `ask-mantosh-auto-production`
tokenless **only until credential placement**, and do not place its credential
while the inventory is incomplete.

Record the following on issue #77 without token values, account keys, or
sensitive settings:

1. The live `ask-mantosh` deployment writer inventory: account members and
   user groups (including product-wide/inherited roles), account and user API
   tokens, Wrangler sessions, other CI, Cloudflare native Git integration,
   and the manual GitHub workflow. Identify each routine writer and each
   retained emergency identity.
2. Effective account- and Worker-level permission policies for **each**
   routine member, group, token, Wrangler session and integration, including
   inherited/product-wide access. Record evidence that every alternative
   routine writer was removed, disabled or reduced to non-deploying access
   for the actual production Worker. A denied operation against an isolated
   Worker can test equivalent policy mechanics but cannot prove production
   denial by itself. Do not make an unauthorized production write merely to
   test access. If effective production access cannot be determined, block
   activation instead of inferring exclusion from a proxy test.
3. Before credential placement, verify the intended automatic token's
   effective **Editor** scope for only the existing `ask-mantosh` Worker and
   account, and read back the automatic environment's `main` restriction and
   no-required-reviewer policy. Check for same-named repository/organization
   secret fallbacks. Pause and drain all release runs before placing the
   automatic environment-only credentials. Copy the **same saved token value**
   and account ID into the automatic environment; do not create a second
   token and do not revoke the existing one. The manual environment
   **keeps** its credential and required reviewer unchanged, as the
   founder-gated break-glass path. After placement, read back that exactly the
   two intended environment secret names exist in **each** of the two
   environments and that no repository or organization fallback has appeared;
   never expose their values. The same token in two GitHub environments is
   still one Cloudflare identity, but it is now reachable through two GitHub
   write paths; record both in the writer inventory.
4. The current 100% production version, exact `main` SHA, and **latest
   matching** manual/automatic issue #77 release receipt, which must itself be
   successful, unedited and correlated; also verify fixed bindings and the
   absence of active or pending release runs. A failed latest receipt or
   version mismatch requires a separately authorized successful baseline or
   reviewed reconciliation before activation. Confirm no Worker source/config
   changes are merged during cutover.
5. Isolated permission-denial evidence can show that the intended policy
   rejects an outside routine identity in a fixture, but it neither injects a
   deployment race nor proves exclusion from the actual production Worker.
   There is **no workflow protection** against an identity that can deploy
   between the final read and write: the run could overwrite that deployment
   and report success. Activation depends on the effective production access
   inventory in item 2 and coordinated founder break-glass procedure. If any
   other routine identity can deploy, or its access is unknown, activation
   remains blocked. Review the complete evidence and exact workflow head
   independently before the founder enables the automatic environment token.

### Shared credential exposure

The automatic environment has **no required reviewer**, and the same token sits
in the manual environment behind one. Once the token is placed in the
automatic environment, it is available to every qualifying job on `main` that
targets that environment. The manual environment's required reviewer therefore
gates only **manual** jobs; it does not protect the credential from the
automatic path. The credential's effective protection is the weaker of the
two environments, not the stronger.

The controls that bound this exposure are: the automatic environment's
`main`-only deployment-branch policy, founder-only write access to `main`
(including branch protection), the protected-path check on
`.github/workflows/**` and tests, the exact-founder-merge and exact-`main`
checks inside the workflow, and the absence of any repository or organization
fallback secret. These are access-control and review measures, not a
provider-side guarantee. Consider also giving `ask-mantosh-production` a
`main`-only deployment-branch policy; its reviewer approval remains the
primary gate for manual jobs. The workflow YAML cannot prove that any of these
GitHub settings is in place, so read each back privately before enabling the
automatic workflow.

### Concurrency and skipped merges

The two GitHub workflows share `ask-mantosh-production-release` concurrency
without in-progress cancellation. This serializes their running deployments,
but GitHub Actions allows one running and at most one pending run in a group,
and a newer pending run replaces an older pending one. It is not a lossless
release queue. A manual run left waiting for environment approval holds the
group while later qualifying Worker merges queue behind it, and a second queued
merge can replace the first. Any qualifying Worker merge whose automatic run
was replaced, skipped or cancelled is **unreleased**; reconcile it explicitly
before treating a later run as a successful baseline. Approve or reject a
pending manual deployment promptly rather than leaving it waiting. This
concurrency setting does not constrain Cloudflare dashboard, CLI or other CI
writers. The Cloudflare deployment API's published parameters do not provide an
expected-prior-version conditional write. The accepted break-glass exception
and its coordination are part of the release contract, not an atomic lock.

### Emergency deployment and recovery

Before using founder break-glass access, **disable the automatic workflow**
and wait until every active and pending automatic release has finished or been
cancelled **before** an external production write. Removing its environment
credential alone is not an equivalent pause: a Worker-path merge can still
start the release job, fail on missing credentials, and post a failed latest
receipt that blocks future automatic baselines. Disabling the workflow
produces no release receipt, but any Worker-path merge during that pause is
**unreleased** and must be explicitly reconciled before resumption. Record
the reason, actor, starting version, and resulting version on issue #77.
Never use break-glass during an active automatic deployment. If the automatic
workflow has already started writing or its outcome is ambiguous, inspect
production first; cancelling the run does not undo a write.

The same rule governs the manual GitHub workflow: **never dispatch it while the
automatic workflow is enabled.** Disable the automatic workflow, wait for active
and pending runs to drain, inspect the live version and latest receipt, and
only then dispatch, approve or reject promptly, and complete the release
before resuming. A failed or uncertain manual run also posts a failed latest
receipt, which blocks automatic releases until a reviewed successful baseline
exists, so dispatch it deliberately and not as a casual retry.

After an emergency deployment, keep automation paused. The latest matching
receipt may be a failure, or it may be a success for an older production
version; neither can silently become the new baseline. The same recovery
rule applies after a tokenless release-job failure or an out-of-band version
drift, even when no emergency deployment was intended. Inspect production,
test the resulting version, reconcile any Worker-path merge skipped while the
workflow was disabled, and perform a separately founder-approved successful
current-`main` baseline release or reviewed reconciliation procedure. If the
manual workflow is used to establish a new receipt, keep automation paused and
drained, then complete the manual release and receipt under the founder gate
using the credential its environment retains. No credential is removed
afterwards. Before resuming the one-routine-writer automatic path, recheck the
writer inventory and live version, and confirm the latest matching receipt is a
successful, correlated baseline for the version now serving 100% of traffic.
An external write without this pause is a release incident: stop automation
and investigate.

### Activation

Only after the inventory, access boundary, race evidence, exact-head review
and separate founder cutover decision may the founder perform the paused,
drained credential placement described above: configure the
`ask-mantosh-auto-production` environment with
`ASK_MANTOSH_CLOUDFLARE_API_TOKEN` and
`ASK_MANTOSH_CLOUDFLARE_ACCOUNT_ID` (the same saved scoped token and the same
account ID the manual environment holds), restricted to `main` and with no
required reviewer, and leave `ask-mantosh-production` and its credential and
reviewer unchanged. Verify the post-placement secret names in both environments
and the absence of repository/organization fallbacks before allowing new
merges. The founder's merge is then the ordinary production decision. No token
belongs in repository files or comments. D1 migrations
and binding changes require their own reviewed release plan.

## Rollback and recovery

For an emergency code restore, first identify an explicitly selected known-good
Worker version, confirm that its code can safely read the current D1 and
Vectorize data, and inspect the actual live deployment. The founder may then
use `wrangler rollback` with the chosen version (or promote that exact version)
after pausing and draining automatic releases. Verify the restored live version
and health/profile/SSE behavior, record the incident on #77, and keep
rerunning releases blocked until the baseline is reconciled. The manual GitHub
workflow deploys current `main`; it is not the historical-version restore.
Do not roll back D1 migrations destructively: use additive migrations, restore
with D1 time-travel only after confirming the target time, then reindex from
Git. Git-tracked Markdown plus a deterministic sync job is the recovery source
of truth for D1 and Vectorize.

When staging exists, maintain a quarterly recovery drill: recreate an empty
staging index and D1 database, apply migrations, run a full knowledge sync, and
execute smoke tests. Until then, this remains an operating standard rather than
a completed production control.
