# Deployment and rollback

## Environment standard

Production is the only environment declared in this repository. If staging is
introduced, use separate Cloudflare Workers, D1 databases, Vectorize indexes, rate-limit
namespaces, and secrets for `staging` and `production`. Never point staging at
production knowledge storage. Set production origins explicitly.

## Worker release sequence

The production path is [Release Ask Mantosh Worker](../../.github/workflows/release-ask-mantosh.yml).
It is started manually from `main`; a push, schedule, or Pages deployment does
not release the Worker. Before its first use, the founder must create the
`ask-mantosh-production` GitHub environment with `mantoshkumar1` as a required
reviewer and set **environment secrets** `ASK_MANTOSH_CLOUDFLARE_API_TOKEN`
(a token scoped to the required Worker/account operations) and
`ASK_MANTOSH_CLOUDFLARE_ACCOUNT_ID`. If the founder initiates and approves the
same run, leave GitHub's optional **Prevent self-review** setting off. Do not
put these values in repository secrets, files, issue comments, or workflow
inputs. The workflow fails if the credentials are absent.

After the workflow has passed protected-path review and merged:

1. Confirm the intended full 40-character `main` SHA and the current Cloudflare
   production Worker version serving 100% of traffic. Enter both exact values
   as the workflow's `expected_sha` and `expected_prior_version` inputs.
2. Dispatch the workflow from `main` as `mantoshkumar1`. It checks the exact
   source, runs Worker tests and the offline evaluation, runs browser tests,
   and validates the bundle with Wrangler's dry run. Review the pending
   `ask-mantosh-production` deployment and approve it deliberately.
3. After approval, the workflow rechecks `main` and the active production
   version. Any move or traffic split stops the release before deployment.
   It deploys only the existing `ask-mantosh` configuration, verifies the new
   immutable version, and smokes health, the exact public-profile question,
   and SSE. The run summary and issue #77 record the source and prior/new
   versions. If a check after deployment fails, inspect production and decide
   rollback explicitly; the workflow does not roll back automatically.
4. Update [`../../docs/SYSTEM_STATE.md`](../../docs/SYSTEM_STATE.md) and the
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
