# Backlog

Planned work that is **not yet built**. Nothing here is published, claimed, or
referenced from a public page. An item leaves this file only when working
evidence exists — then it becomes an insight (`PUBLISHING_INSIGHTS.md`) or a
project (`PUBLISHING_PROJECTS.md`).

Keep this file out of `SYSTEM_STATE.md`. That document records verified
production state; this one records intent.

---

## BL-1 — Agent guardrails, then the follow-up article

**Status:** built on this repo 2026-08-21; awaiting a real pull request, then PingStep
**Created:** 2026-08-21

> **Update 2026-08-21.** Layers 1–3 are implemented here rather than in
> PingStep, because this repo already runs agent-authored changes that are not
> read line by line. Shipped: `.github/workflows/protected-paths.yml`,
> `scripts/audit-test-floor.mjs`, `.test-count` (baseline 89),
> `.claude/settings.json`, and wiring into `npm run verify` plus
> `deploy-pages.yml`.
>
> Negative test passed locally: removing one Worker test dropped the count to
> 88 and the floor exited 1 with a clear message; restoring returned it to 89
> and exit 0.
>
> Still outstanding before writing the article: observe the guard on a genuine
> pull request (it only runs on `pull_request`, so pushes straight to `main`
> never exercise it), create the `approved-test-change` label, and decide the
> bot-identity question below. Porting to PingStep remains worthwhile — that is
> where the least-read changes happen.
**Blocks:** the technical article "Stop the agent editing its own tests"
**Related published work:** [A river can't be deterministic. Its banks can be.](../insights/make-the-banks-deterministic.html)

### Why

The published note argues that a coding agent must not be able to edit the
tests that judge its work. It states the principle and gives five rules, but
its evidence boundary has to say: *"the commands and thresholds shown are
illustrative examples, not a published configuration."*

That disclaimer is the weakness. The note scored well on insight and poorly on
evidence for exactly this reason. Implementing the guardrails on a real repo
removes the disclaimer and converts a plausible idea into a demonstrated one.

PingStep is the right repo: it is where an agent makes changes that are not
read line by line, and it already has a coverage gate on the Worker core.

### What to build

Three layers. Layers 2 and 3 are the ones that work unattended; layer 1 is
convenience.

**Layer 1 — deny writes locally.** `.claude/settings.json` in the PingStep repo:

```json
{
  "permissions": {
    "deny": [
      "Edit(tests/**)",
      "Edit(.github/workflows/**)",
      "Edit(wrangler.toml)",
      "Edit(package.json)"
    ]
  }
}
```

Bypassable. A guardrail, not a gate.

**Layer 2 — fail the build when protected paths move.** A `pull_request`
workflow that diffs against the base branch and fails unless a review label is
present:

```yaml
name: Protected paths
on: pull_request
jobs:
  guard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
        with: { fetch-depth: 0 }
      - name: Block unapproved test or CI changes
        run: |
          CHANGED=$(git diff --name-only origin/${{ github.base_ref }}...HEAD \
            -- 'tests/**' '.github/workflows/**' 'wrangler.toml')
          [ -z "$CHANGED" ] && exit 0
          echo "Protected files changed:"; echo "$CHANGED"
          echo "${{ join(github.event.pull_request.labels.*.name, ',') }}" \
            | grep -q 'approved-test-change' \
            || { echo "::error::Review the diff, then add the approved-test-change label."; exit 1; }
```

**Layer 3 — floors that only rise.** Coverage is already enforced on the
Worker core; add a test-count floor with a committed baseline:

```bash
COUNT=$(<collect test count for the runner in use>)
BASE=$(cat .test-count 2>/dev/null || echo 0)
if [ "$COUNT" -lt "$BASE" ]; then
  echo "::error::Test count fell from $BASE to $COUNT"; exit 1
fi
[ "$COUNT" -gt "$BASE" ] && echo "$COUNT" > .test-count
```

### Known constraint

CODEOWNERS plus required review is the textbook answer and **does not work for
a solo maintainer** — GitHub will not accept a self-approval. It only becomes a
real gate if the agent commits under a separate identity (bot token or GitHub
App) so the human is a genuine second party. Until then, layer 2 is the gate.

Worth deciding during implementation: is moving the agent to a bot identity
worth the setup cost, or is the label gate sufficient?

### Acceptance criteria

- [ ] Layers 2 and 3 committed to PingStep and passing on a real pull request.
- [ ] One deliberate negative test: delete a test locally, open a PR, confirm
      the build goes red without human attention.
- [ ] Baseline `.test-count` committed and observed to ratchet upward at least once.
- [ ] Two weeks of running time, so the article can report what happened rather
      than what should happen.

### Then write

**"Stop the agent editing its own tests"** — a technical article, not a note.
It needs code blocks, alternatives, and the CODEOWNERS constraint, which is
more than the note form carries.

Publish only with real evidence: a link to the committed workflow, the observed
ratchet, and an honest account of what tripped or did not trip. If nothing
tripped in two weeks, say so — that is a finding, not a failure.

On publication:

- Follow `PUBLISHING_INSIGHTS.md` in full, including the paired knowledge note.
- Add a forward link from the banks note to the new article, and a back link
  from the new article to the banks note.
- Remove or narrow the "illustrative examples" sentence in the banks note's
  evidence boundary, since a published configuration will then exist.

---

## BL-2 — Clean up stale `.bak_*` files

**Status:** not started
**Created:** 2026-08-21

Six untracked `insights/*.html.bak_*` files from an earlier editing session sit
in the working tree. They are not committed and serve no purpose. Confirm
nothing references them, then delete.

---

## BL-3 — Lead with what is live

**Status:** done 2026-08-22 (branch `projects/lead-with-live`)
**Created:** 2026-08-22

> **Done.** Live projects now take the three homepage slots and lead
> `projects/index.html`. GTT gained a `card` and `homepageOrder` 3; the
> validation-platform case study gave up its slot and stays on the projects
> page. CTA wording aligned to the site's existing convention (`Try the live
> system` / `Try the live product`) and moved to first position. A `.project-live`
> dot pulses on a 3.2s breathe, staggered per card, and stops under
> `prefers-reduced-motion`. `docs/PUBLISHING_PROJECTS.md` records the new
> ordering rule and the trade it makes.
>
> Not done, deliberately: the dot is a config flag, not a health check.

