---
title: "The Gateway Is Not the Authority"
slug: "gateway-is-not-the-authority"
category: "article"
tags: ["mcp", "cloudflare", "github", "security-boundaries", "ai-assisted-engineering", "platform-engineering"]
summary: "A field-tested model for separating MCP client authentication, capability routing, upstream GitHub identity, and execution authority."
last_updated: "2026-09-07"
related_topics: ["dogbuild", "message-bus-between-ai-agents", "least-privilege", "agent-orchestration", "operational-security"]
visibility: "public"
url: "/insights/gateway-is-not-the-authority.html"
---

# The Gateway Is Not the Authority

I put one MCP endpoint in front of three GitHub capability planes. It worked — and it exposed the mental model I had wrong.

A gateway can authenticate the caller and route a tool call. It does not, by itself, decide which GitHub identity executes that call, which operations the identity can perform, or whether an agent is authorized to perform them.

## Four separate boundaries

1. **Client authentication:** who may establish a session with the MCP portal.
2. **Capability routing:** which upstream receives the selected named tool call.
3. **Upstream identity:** which GitHub credential and scopes execute the request.
4. **Execution authority:** which operations the workflow permits, independent of technical capability.

The controls cooperate, but none substitutes for the others.

## One endpoint, three capability planes

The portal fronts three upstream tool planes:

- Core for repository, issue, pull-request, branch, and commit operations.
- Projects for GitHub Project v2 items and fields.
- Actions read-only for workflow-run and job inspection.

The client invokes a specific advertised tool. The portal retains the upstream that published that tool and routes the invocation back to it. There is no semantic guess about which server should handle “GitHub.”

Separating Actions reads from write-capable Core operations makes the capability boundary visible and testable.

## Portal policy is not upstream authentication

The portal policy protects the client-facing entrance. It decides whether a person or approved runtime may connect.

The encrypted upstream header authenticates the outgoing request to GitHub. GitHub bearer authentication uses `Authorization: Bearer <token>`. The token value belongs only in encrypted configuration.

Repeating a human access policy on every upstream does not grant GitHub access. A per-server policy is an additional client-facing gate only when that server is independently exposed or the platform explicitly evaluates that policy. The upstream still needs its own GitHub authentication.

## Canary evidence

On September 7, 2026, a disposable public DogBuild issue exercised:

- Core issue create, read, comment, update, and close;
- Projects item creation, full pagination, field discovery, and Ready → Review → Done transitions;
- Actions workflow-run and job reads;
- webhook delivery to the local listener;
- control-schema parsing and idempotent `NO_ACTION` decisions;
- read-back after every mutation.

The first listener event exposed a repository-context assumption: it looked for control markers where they did not exist. The corrected path read the intended control board and failed closed when no new wake was authorized.

This proves transport and the tested capabilities. It is not a security certification.

## Hardening sequence

1. Inventory every exposed tool and classify dangerous operations.
2. Remove capabilities the runtime does not need.
3. Replace the personal credential with a dedicated least-privilege identity.
4. Re-run required and forbidden-operation canaries.
5. Retire old credentials and local settings only after replacement proof.
6. Store recovery details in restricted operational documentation, separate from public architecture.

## Reusable principle

“It is behind a gateway” is not a security model. Name the caller, route, execution identity, allowed capability, and irreversible authority separately.

One endpoint can simplify the client experience. It should not collapse the control model.

## Evidence boundary

This article documents a real DogBuild dogfood setup and the exact classes of capability exercised on September 7, 2026. It does not claim production readiness, formal threat-model completeness, independent security review, or completed least-privilege migration. Secret values and private recovery details are intentionally excluded.
