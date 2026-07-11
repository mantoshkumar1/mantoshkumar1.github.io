# Deployment and rollback

## Environments

Use separate Cloudflare Workers, D1 databases, Vectorize indexes, rate-limit
namespaces, and secrets for `staging` and `production`. Never point staging at
production knowledge storage. Set production origins explicitly.

## CI/CD sequence

1. Run unit tests and prompt-injection fixtures.
2. Apply D1 migrations to staging.
3. Deploy the Worker to staging and run `/health`, a grounded-answer smoke test,
   an unrelated-question test, and an SSE stream test.
4. Deploy the same immutable version to production.
5. Run the knowledge-sync workflow only after deployment succeeds.

The Worker must expose `GET /health` with no sensitive configuration detail.
Deploy a changed knowledge document, then verify that the cache-version bump
makes its answer visible within the configured cache TTL.

## Rollback and recovery

Use `wrangler rollback` (or promote the prior Worker version) for code rollback.
Do not roll back D1 migrations destructively: use additive migrations, restore
with D1 time-travel only after confirming the target time, then reindex from
Git. Git-tracked Markdown plus a deterministic sync job is the recovery source
of truth for D1 and Vectorize.

Maintain a quarterly recovery drill: recreate an empty staging index and D1
database, apply migrations, run a full knowledge sync, and execute smoke tests.
