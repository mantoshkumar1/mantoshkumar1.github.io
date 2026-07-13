# Deployment and rollback

## Environment standard

Production is the only environment declared in this repository. If staging is
introduced, use separate Cloudflare Workers, D1 databases, Vectorize indexes, rate-limit
namespaces, and secrets for `staging` and `production`. Never point staging at
production knowledge storage. Set production origins explicitly.

## Worker release sequence

1. Run unit tests and prompt-injection fixtures.
2. When prompts, formatting, or answer policy change, increment
   `ANSWER_POLICY_VERSION` so eligible cached responses cannot retain the old
   behavior.
3. Apply additive D1 migrations required by the release.
4. Validate the bundle with `npx wrangler deploy --dry-run`, deploy with Wrangler,
   and run `/health`, a grounded-answer smoke test, an
   unrelated-question test, and an SSE stream test.
5. Record the immutable production Worker version in
   [`../../docs/SYSTEM_STATE.md`](../../docs/SYSTEM_STATE.md).
6. If a separate staging environment exists, promote the tested immutable
   version rather than rebuilding it.
7. Run a full knowledge sync only when schema or indexing behavior requires it;
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
