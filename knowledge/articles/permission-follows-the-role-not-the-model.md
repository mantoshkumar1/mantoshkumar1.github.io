---
title: "Permission Should Follow the Role, Not the AI Model"
slug: "permission-follows-the-role-not-the-model"
category: "article"
tags: ["ai-governance", "github-apps", "multi-agent-systems", "least-privilege", "dogbuild"]
summary: "A least-privilege GitHub App design for fluid AI teams: fixed Strategy, Implementor, and Reviewer identities with replaceable AI providers."
published: "2026-08-30"
updated: "2026-08-30"
status: "proposed"
---

# Permission should follow the role, not the AI model

I do not want twenty GitHub accounts just because I use several AI systems. I want a small number of durable work identities, each with a narrow job, while Strategy decides which available AI fills that job.

That separates two things we often mix together: **who is acting in the workflow** and **which model happens to do the reasoning today**.

## One owner account is enough

One GitHub account can own several GitHub Apps. Each App receives its own bot identity, installation, permissions, and credentials. The repository can therefore see Strategy, Implementor, and Reviewer as separate actors without three human profile accounts.

For a private App, ownership matters: GitHub allows installation only on the account that owns the App. If the repository belongs to my main account, the simplest private setup is to create the Apps there and install them only on the selected repository. A separate AI account may still be useful as a managed human collaborator, but it should not accidentally become the security architecture.

## Three fixed identities, fluid workers

- **Strategy / gateway:** read repository truth, receive events, update issues and pull-request conversation, and choose the next eligible worker. It cannot write code.
- **Implementor:** read the task, write code on task branches, open or update pull requests, and report evidence. It cannot deploy, manage secrets, change repository administration, or bypass the protected production branch.
- **Reviewer:** read code and CI evidence, post reviews and findings, and record a verdict against an exact commit. It cannot write product code.

Codex may implement one task and review another. Claude may do the reverse. ChatGPT may act as Strategy or Reviewer when its connection supports the needed operation. The provider is replaceable; the role boundary is not.

## Recommended repository permissions

- **Strategy / gateway:** Metadata read; Contents read; Issues read/write; Pull requests read/write; Actions, Checks, and Commit statuses read.
- **Implementor:** Metadata read; Contents read/write; Issues read/write; Pull requests read/write; Actions, Checks, and Commit statuses read.
- **Reviewer:** Metadata read; Contents read; Issues read/write; Pull requests read/write; Actions, Checks, and Commit statuses read.

Everything else starts at no access. Administration, environments, secrets, deployments, and workflow modification are separate capabilities and should be added only after a concrete task proves they are required.

Permissions are only the outer limit. Branch protection, rulesets, the task state, and deterministic checks still decide whether a particular operation is allowed. “Pull requests: write” must not silently mean “may merge to production.”

## Do not wake every AI

A repository event should wake the reconciler or Strategy identity. Strategy rereads current GitHub truth, evaluates the required role and capabilities, and wakes only the minimum eligible worker or workers.

Broadcasting every comment to every model wastes tokens and creates conflicting ownership. The event is an attention signal, not an instruction to act blindly.

## Leave a trace before and after

The App identity shows which role credential was used. The work marker should also record the provider, task, and immutable commit SHA:

- **Before:** REVIEW_STARTED role=reviewer provider=codex head=<sha>
- **After:** REVIEW_COMPLETE verdict=approved head=<same-sha>

The exact SHA matters because a review of yesterday's code must not look like approval of today's changed branch. These markers provide semantic traceability. Strong identity proof requires separate key custody and trustworthy broker records; one shared credential cannot prove which model actually used it.

## Prove one pipe before creating three Apps

The first experiment should use one private gateway App on one selected repository. It should accept one allowlisted founder command, verify the signed webhook, deduplicate the delivery, reread the canonical task, wake one worker, and publish start and completion markers.

Once that path works end to end, split the credentials into the three durable role identities above. The manual setup becomes the evidence for a DogBuild onboarding flow that can later generate App manifests, recommend permissions, and verify the installation without taking secret custody away from the founder.

## Evidence boundary

This is the permission model I am taking into the first PingStep/DogBuild experiment. It is a design recommendation, not a claim that the complete multi-provider wake bridge is already shipped.

GitHub's documentation defines the private-App ownership boundary and installation model. Native AI integrations may provide their own wake paths, but the provider-neutral routing, separation of duties, and durable trace remain the responsibility of the surrounding system.

## References

- [GitHub: Making a GitHub App public or private](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/making-a-github-app-public-or-private)
- [GitHub: Installing your own GitHub App](https://docs.github.com/en/apps/using-github-apps/installing-your-own-github-app)
- [DogBuild](https://github.com/mantoshkumar1/dogbuild)
