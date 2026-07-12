# Documentation map

Use documents in this order when statements overlap:

1. Executable code and committed configuration define behavior.
2. [`SYSTEM_STATE.md`](SYSTEM_STATE.md) records the verified production inventory, endpoints, controls, and known limits.
3. [`../chat-worker/docs/`](../chat-worker/docs/) explains subsystem architecture, policy, deployment, security, cost, maintenance, and troubleshooting.
4. [`ai-discoverability.md`](ai-discoverability.md) explains crawler, structured-data, sitemap, submission, and AI-referral practices.
5. [`../VISION.md`](../VISION.md) describes durable product intent rather than deployed state.

Documentation changes run through `scripts/audit-docs.mjs`, which checks deployed endpoint references, production configuration values, public knowledge and Worker-test counts, prohibited stale wording, workflow enforcement, and local Markdown links.

When behavior changes, update executable tests and `SYSTEM_STATE.md` in the same commit. When only a future standard changes, keep it out of `SYSTEM_STATE.md` until production evidence exists.
