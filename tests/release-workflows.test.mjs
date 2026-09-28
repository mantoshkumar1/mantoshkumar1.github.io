import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const file = (name) => readFileSync(path.join(root, '.github/workflows', name), 'utf8');
const pages = file('deploy-pages.yml');
const knowledge = file('sync-knowledge.yml');
const manual = file('release-ask-mantosh.yml');
const automatic = file('release-ask-mantosh-on-merge.yml');

function topLevelBlock(source, key) {
  const match = source.match(new RegExp(`^${key}:\\n([\\s\\S]*?)(?=^[^\\s#][^\\n]*:|(?![\\s\\S]))`, 'm'));
  assert.ok(match, `Missing ${key} block`);
  return match[1];
}

function job(source, name) {
  const jobs = topLevelBlock(source, 'jobs');
  const match = jobs.match(new RegExp(`^  ${name}:\\n([\\s\\S]*?)(?=^  [a-z][a-z0-9-]*:|(?![\\s\\S]))`, 'm'));
  assert.ok(match, `Missing named job: ${name}`);
  return match[1];
}

function globMatches(pattern, filename) {
  const segments = pattern.split('/');
  let expression = '^';
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    if (segment === '**') {
      expression += index === segments.length - 1 ? '.*' : '(?:[^/]+/)*';
    } else {
      expression += segment
        .replace(/[|\\{}()[\]^$+?.]/g, '\\$&')
        .replaceAll('*', '[^/]*');
      if (index !== segments.length - 1) expression += '/';
    }
  }
  return new RegExp(expression + '$').test(filename);
}

function runsOnMainPush(source, changedPaths) {
  const events = topLevelBlock(source, 'on');
  const push = events.match(/^  push:\n([\s\S]*?)(?=^  [a-z][a-z0-9_-]*:|(?![\s\S]))/m);
  if (!push) return false;
  assert.match(push[1], /^    branches: \[main\]$/m, 'Main-only push expected');
  const paths = push[1].match(/^    paths:\n((?:^      - .+\n?)+)/m);
  if (!paths) return true;
  const patterns = [...paths[1].matchAll(/^      - (.+)$/gm)]
    .map((match) => match[1].trim().replace(/^['"]|['"]$/g, ''));
  return changedPaths.some((filename) => patterns.some((pattern) => globMatches(pattern, filename)));
}

test('separate main-merge triggers route each changed surface to its own workflow', () => {
  const cases = [
    { change: ['index.html'], expected: [true, false, false] },
    { change: ['knowledge/faq/about-mantosh.md'], expected: [true, true, false] },
    { change: ['chat-worker/src/profile-overview.js'], expected: [true, false, true] },
    { change: ['chat-worker/package-lock.json'], expected: [true, false, true] },
    { change: ['chat-worker/src/indexer.js'], expected: [true, true, true] },
    { change: ['knowledge/faq/about-mantosh.md', 'chat-worker/src/profile-overview.js'], expected: [true, true, true] },
    { change: ['tests/release-workflows.test.mjs'], expected: [true, false, false] },
  ];
  for (const { change, expected } of cases) {
    assert.deepEqual(
      [pages, knowledge, automatic].map((workflow) => runsOnMainPush(workflow, change)),
      expected,
      `Wrong workflow routing for ${change.join(', ')}`,
    );
  }
  assert.equal(runsOnMainPush(manual, ['chat-worker/src/profile-overview.js']), false);
});

test('Pages has separately named build, deploy and live smoke failure boundaries', () => {
  job(pages, 'build');
  assert.match(job(pages, 'deploy'), /needs: build/);
  assert.match(job(pages, 'smoke'), /needs: deploy/);
  assert.match(job(pages, 'smoke'), /EXPECTED_REVISION: \$\{\{ github\.sha \}\}/);
  assert.doesNotMatch(pages, /wrangler\s+(?:versions\s+)?deploy\b/);
});

test('knowledge sync uses its own OIDC-protected indexer and never deploys Worker code', () => {
  const sync = job(knowledge, 'sync');
  assert.match(knowledge, /^  id-token: write$/m);
  assert.match(sync, /audience=ask-mantosh-indexer/);
  assert.match(sync, /sync-knowledge\.mjs --base/);
  assert.doesNotMatch(sync, /wrangler\s+(?:versions\s+)?deploy\b/);
});

test('manual Worker release stays dispatch-only with a protected production boundary', () => {
  const on = topLevelBlock(manual, 'on');
  assert.match(on, /^  workflow_dispatch:/m);
  assert.doesNotMatch(on, /^  push:/m);
  const verify = job(manual, 'verify');
  const release = job(manual, 'release');
  assert.doesNotMatch(verify, /CLOUDFLARE_API_TOKEN|wrangler deploy(?! --dry-run)/);
  assert.match(verify, /npm audit --prefix chat-worker --audit-level=high/);
  assert.match(release, /needs: verify/);
  assert.match(release, /environment: ask-mantosh-production/);
  assert.match(release, /npm audit --prefix chat-worker --audit-level=high/);
  assert.match(release, /EXPECTED_PRIOR_VERSION/);
  assert.match(release, /Smoke production/);
  assert.match(release, /issue comment 77/);
});

test('automatic Worker release stays scoped to founder merge and exact current main', () => {
  const verify = job(automatic, 'verify');
  const release = job(automatic, 'release');
  assert.match(verify, /merged_by/);
  assert.match(verify, /GITHUB_SHA/);
  assert.match(verify, /npm audit --prefix chat-worker --audit-level=high/);
  assert.doesNotMatch(verify, /CLOUDFLARE_API_TOKEN|wrangler deploy(?! --dry-run)/);
  assert.match(release, /needs: verify/);
  assert.match(release, /environment: ask-mantosh-auto-production/);
  assert.match(release, /npm audit --prefix chat-worker --audit-level=high/);
  assert.match(release, /latest successful|last issue 77 release receipt/i);
  assert.match(release, /Observe and correlate production after every deploy attempt/);
  assert.match(release, /Smoke production health, profile answer, and stream/);
  assert.match(release, /if: always\(\)/);
  assert.match(job(automatic, 'report-verification-failure'), /needs\.verify\.result != 'success'/);
  for (const workflow of [manual, automatic]) {
    assert.match(workflow, /group: ask-mantosh-production-release/);
    assert.match(workflow, /cancel-in-progress: false/);
  }
});

test('a Worker verification failure is visible before any production job begins', () => {
  const autoReport = job(automatic, 'report-verification-failure');
  assert.match(autoReport, /Record blocked automatic candidate/);
  assert.match(autoReport, /No production job started/);
  assert.match(autoReport, /GITHUB_RUN_ID/);
});

// An external dashboard or CLI writer is outside GitHub's concurrency group.
// This remains an activation blocker and needs a separate enforceable control.
test.todo('external deployment between prior-version read and write is rejected without overwriting it');
