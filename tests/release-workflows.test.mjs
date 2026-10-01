import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const file = (name) => readFileSync(path.join(root, '.github/workflows', name), 'utf8');
const pages = file('deploy-pages.yml');
const knowledge = file('sync-knowledge.yml');
const manual = file('release-ask-mantosh.yml');
const automaticPath = path.join(root, '.github/workflows/release-ask-mantosh-on-merge.yml');
const automatic = existsSync(automaticPath) ? file('release-ask-mantosh-on-merge.yml') : null;
const technicalSeo = file('technical-seo.yml');
const secretReference = /\$\{\{[^}]*\bsecrets\s*(?:\.|\[)/i;

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

function mutateJob(source, name, find, replacement) {
  const original = job(source, name);
  const changed = original.replace(find, replacement);
  assert.notEqual(changed, original, `Mutation for ${name} must change the job`);
  return source.replace(original, changed);
}

function jobSteps(source) {
  const boundaries = [...source.matchAll(/^      - (?:name|uses):/gm)].map((match) => match.index);
  assert.ok(boundaries.length > 0, 'Missing job steps');
  return boundaries.map((start, index) => source.slice(start, boundaries[index + 1]));
}

function stepIndex(steps, expression, label) {
  const index = steps.findIndex((step) => expression.test(step));
  assert.notEqual(index, -1, `Missing ${label} step`);
  return index;
}

function auditStep(steps, index, label) {
  const step = steps[index];
  assert.match(step, /^        run: npm audit --prefix chat-worker --audit-level=high$/m, `${label} must run the high audit`);
  assert.doesNotMatch(step, /^        (?:continue-on-error|if):/m, `${label} must not skip or ignore the audit`);
}

function assertNoWorkflowSecret(source) {
  assert.doesNotMatch(source.replace(topLevelBlock(source, 'jobs'), ''), secretReference, 'Workflow-level configuration must not expose a secret');
}

function assertToolchainGate(source) {
  assertNoWorkflowSecret(source);
  const toolchain = job(source, 'worker-toolchain');
  const steps = jobSteps(toolchain);
  assert.doesNotMatch(toolchain, secretReference);
  const install = stepIndex(steps, /npm ci --prefix chat-worker/, 'locked Worker install');
  const audit = stepIndex(steps, /npm audit --prefix chat-worker --audit-level=high/, 'high-severity audit');
  const dryRun = stepIndex(steps, /wrangler deploy --dry-run/, 'Worker dry run');
  auditStep(steps, audit, 'Worker toolchain');
  assert.ok(install < audit && audit < dryRun, 'Audit must follow install and precede dry run');
}

function assertVerifyGate(source) {
  assertNoWorkflowSecret(source);
  const verify = job(source, 'verify');
  const steps = jobSteps(verify);
  assert.doesNotMatch(verify, secretReference);
  assert.doesNotMatch(verify, /wrangler deploy(?! --dry-run)/);
  const install = stepIndex(steps, /npm ci --prefix chat-worker/, 'verify locked Worker install');
  const audit = stepIndex(steps, /npm audit --prefix chat-worker --audit-level=high/, 'verify high-severity audit');
  auditStep(steps, audit, 'Verify');
  assert.ok(install < audit, 'Verify audit must follow locked install');
  for (const [expression, label] of [
    [/npm test --prefix chat-worker/, 'Worker tests'],
    [/npm run test:browser/, 'browser tests'],
    [/wrangler deploy --dry-run/, 'Worker dry run'],
  ]) {
    assert.ok(audit < stepIndex(steps, expression, label), `Verify audit must precede ${label}`);
  }
}

function assertReleaseGate(source) {
  assertNoWorkflowSecret(source);
  const release = job(source, 'release');
  const steps = jobSteps(release);
  assert.doesNotMatch(release.slice(0, release.indexOf(steps[0])), secretReference, 'Release job preamble must not expose a secret');
  const install = stepIndex(steps, /npm ci --prefix chat-worker/, 'release locked Worker install');
  const audit = stepIndex(steps, /npm audit --prefix chat-worker --audit-level=high/, 'release high-severity audit');
  const firstCredential = stepIndex(steps, secretReference, 'first credential');
  auditStep(steps, audit, 'Release');
  assert.ok(install < audit, 'Release audit must follow locked install');
  assert.ok(audit < firstCredential, 'Release audit must precede the first credential');
}

function assertDeployFailureCapture(source) {
  const steps = jobSteps(job(source, 'release'));
  const deploy = steps[stepIndex(steps, /^      - name: Deploy existing Worker configuration$/m, 'deploy')];
  const command = source.startsWith('name: Release Ask Mantosh Worker on founder merge\n')
    ? 'npx wrangler deploy --message "GitHub founder merge $EXPECTED_SHA"'
    : 'npx wrangler deploy';
  assert.match(deploy, /set -uo pipefail\n\s+set \+e\n/, 'Deploy must disable the runner bash -e exit');
  assert.ok(deploy.includes(`${command} > "$RUNNER_TEMP/wrangler-deploy.log" 2>&1\n          deploy_exit=$?`), 'Deploy must capture Wrangler exit under the runner bash -e shell');
  assert.match(deploy, /cat "\$RUNNER_TEMP\/wrangler-deploy\.log"/);
  assert.match(deploy, /echo "exit_code=\$deploy_exit" >> "\$GITHUB_OUTPUT"/);
  assert.match(job(source, 'release'), /if: always\(\) && steps\.deploy\.outputs\.attempted == 'true'/);
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
  assert.doesNotMatch(push[1], /^    paths-ignore:|^    paths:\s*\[|^      -\s+['"]?!/m, 'Unsupported path filter must fail closed');
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
      [pages, knowledge].map((workflow) => runsOnMainPush(workflow, change))
        .concat(automatic ? runsOnMainPush(automatic, change) : false),
      [expected[0], expected[1], automatic ? expected[2] : false],
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

test('Worker toolchain gets a separate visible audit and dry-run check on PR and main', () => {
  const toolchain = job(technicalSeo, 'worker-toolchain');
  assert.match(technicalSeo, /^  pull_request:$/m);
  assert.match(technicalSeo, /^  push:$/m);
  assert.match(toolchain, /npm ci --prefix chat-worker/);
  assert.match(toolchain, /npm audit --prefix chat-worker --audit-level=high/);
  assert.match(toolchain, /wrangler deploy --dry-run/);
  assertToolchainGate(technicalSeo);
});

test('manual Worker release stays dispatch-only with a protected production boundary', () => {
  const on = topLevelBlock(manual, 'on');
  assert.match(on, /^  workflow_dispatch:/m);
  assert.doesNotMatch(on, /^  push:/m);
  const verify = job(manual, 'verify');
  const release = job(manual, 'release');
  assert.match(verify, /npm audit --prefix chat-worker --audit-level=high/);
  assertVerifyGate(manual);
  assert.match(release, /needs: verify/);
  assert.match(release, /environment: ask-mantosh-production/);
  assert.match(release, /npm audit --prefix chat-worker --audit-level=high/);
  assertReleaseGate(manual);
  assertDeployFailureCapture(manual);
  assert.match(release, /EXPECTED_PRIOR_VERSION/);
  assert.match(release, /Smoke production/);
  assert.match(release, /issue comment 77/);
});

test('release gate rejects early credentials, bypassed audits and lost deploy results', () => {
  const audit = 'run: npm audit --prefix chat-worker --audit-level=high';
  const mutations = [
    ['    runs-on: ubuntu-latest', "    runs-on: ubuntu-latest\n    env:\n      EARLY: ${{ secrets.OTHER_TOKEN }}"],
    ['run: npm ci --prefix chat-worker', "env:\n          EARLY: ${{ secrets.CF_TOKEN_OTHER }}\n        run: npm ci --prefix chat-worker"],
    ['run: npm ci --prefix chat-worker', "env:\n          EARLY: ${{ secrets.ask_mantosh_cloudflare_api_token }}\n        run: npm ci --prefix chat-worker"],
    [audit, 'continue-on-error: true\n        ' + audit],
    [audit, 'if: false\n        ' + audit],
    [audit, audit + ' || true'],
    [audit, 'run: echo npm audit --prefix chat-worker --audit-level=high'],
  ];
  for (const source of [manual, automatic].filter(Boolean)) {
    const hoisted = source.replace(/^jobs:$/m, 'env:\n  CLOUDFLARE_API_TOKEN: ${{ secrets.ASK_MANTOSH_CLOUDFLARE_API_TOKEN }}\n\njobs:');
    assert.notEqual(hoisted, source, 'Workflow-level secret mutation must change the fixture');
    const appended = source + '\nenv:\n  CLOUDFLARE_API_TOKEN: ${{ secrets.ASK_MANTOSH_CLOUDFLARE_API_TOKEN }}\n';
    for (const changed of [hoisted, appended]) {
      assert.throws(() => assertReleaseGate(changed), /Workflow-level configuration must not expose a secret/);
      assert.throws(() => assertVerifyGate(changed), /Workflow-level configuration must not expose a secret/);
    }
    for (const [find, replacement] of mutations) {
      const changed = mutateJob(source, 'release', find, replacement);
      assert.throws(() => assertReleaseGate(changed));
    }
    assert.throws(() => assertDeployFailureCapture(
      mutateJob(source, 'release', '          set +e\n', '          set -e\n'),
    ));
  }
});

test('deploy step records a failed Wrangler command under the runner shell', () => {
  for (const source of [manual, automatic].filter(Boolean)) {
    const steps = jobSteps(job(source, 'release'));
    const deploy = steps[stepIndex(steps, /^      - name: Deploy existing Worker configuration$/m, 'deploy')];
    const run = deploy.match(/^        run: \|\n((?:^          .*\n)+)/m)?.[1];
    assert.ok(run, 'Deploy shell block must be present');
    const version = '11111111-2222-3333-4444-555555555555';
    const command = source === automatic
      ? 'npx wrangler deploy --message "GitHub founder merge $EXPECTED_SHA" > "$RUNNER_TEMP/wrangler-deploy.log" 2>&1'
      : 'npx wrangler deploy > "$RUNNER_TEMP/wrangler-deploy.log" 2>&1';
    const mock = `bash -c 'printf "Current Version ID: ${version}\\n"; exit 1' > "$RUNNER_TEMP/wrangler-deploy.log" 2>&1`;
    const script = run.replace(/^          /gm, '').replace(command, mock);
    assert.notEqual(script, run.replace(/^          /gm, ''), 'Wrangler must be replaced with a local failure fixture');
    assert.doesNotMatch(script, /npx wrangler deploy/);
    const dir = mkdtempSync(path.join(tmpdir(), 'ask-mantosh-deploy-test-'));
    try {
      const result = spawnSync('bash', ['-e', '-c', script], {
        encoding: 'utf8',
        env: { ...process.env, RUNNER_TEMP: dir, GITHUB_OUTPUT: path.join(dir, 'outputs') },
      });
      assert.equal(result.status, 0, result.stderr);
      assert.match(result.stdout, new RegExp(version));
      const outputs = readFileSync(path.join(dir, 'outputs'), 'utf8');
      assert.match(outputs, /^attempted=true$/m);
      assert.match(outputs, /^exit_code=1$/m);
      assert.match(outputs, new RegExp(`^version=${version}$`, 'm'));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

test('verify and toolchain audits reject early credentials and bypasses', () => {
  const hoisted = technicalSeo.replace(/^jobs:$/m, 'env:\n  CLOUDFLARE_API_TOKEN: ${{ secrets.ASK_MANTOSH_CLOUDFLARE_API_TOKEN }}\n\njobs:');
  assert.notEqual(hoisted, technicalSeo, 'Toolchain workflow mutation must change the fixture');
  const appended = technicalSeo + '\nenv:\n  CLOUDFLARE_API_TOKEN: ${{ secrets.ASK_MANTOSH_CLOUDFLARE_API_TOKEN }}\n';
  for (const changed of [hoisted, appended]) {
    assert.throws(() => assertToolchainGate(changed), /Workflow-level configuration must not expose a secret/);
  }
  for (const [source, name] of [[manual, 'verify'], [automatic, 'verify'], [technicalSeo, 'worker-toolchain']].filter(([source]) => source)) {
    const validate = name === 'verify' ? assertVerifyGate : assertToolchainGate;
    assert.throws(() => validate(mutateJob(source, name,
      'run: npm ci --prefix chat-worker',
      "env:\n          EARLY: ${{ secrets.CF_TOKEN_OTHER }}\n        run: npm ci --prefix chat-worker")));
    assert.throws(() => validate(mutateJob(source, name,
      'run: npm audit --prefix chat-worker --audit-level=high',
      'run: npm audit --prefix chat-worker --audit-level=high || true')));
  }
});

test('routing rejects alternate path filter forms until modeled explicitly', () => {
  const mainPush = '  push:\n    branches: [main]\n';
  for (const filter of [
    "    paths-ignore: ['chat-worker/**']\n",
    "    paths: ['index.html']\n",
    "    paths:\n      - '!chat-worker/**'\n",
  ]) {
    const changed = pages.replace(mainPush, mainPush + filter);
    assert.notEqual(changed, pages, 'Pages push fixture must be modified');
    assert.throws(() => runsOnMainPush(changed, ['chat-worker/src/indexer.js']));
  }
});

test('automatic Worker release stays scoped to founder merge and exact current main', { skip: !automatic }, () => {
  const verify = job(automatic, 'verify');
  const release = job(automatic, 'release');
  assert.match(verify, /merged_by/);
  assert.match(verify, /GITHUB_SHA/);
  assert.match(verify, /npm audit --prefix chat-worker --audit-level=high/);
  assertVerifyGate(automatic);
  assert.doesNotMatch(verify, /CLOUDFLARE_API_TOKEN|wrangler deploy(?! --dry-run)/);
  assert.match(release, /needs: verify/);
  assert.match(release, /environment: ask-mantosh-auto-production/);
  assert.match(release, /npm audit --prefix chat-worker --audit-level=high/);
  assertReleaseGate(automatic);
  assertDeployFailureCapture(automatic);
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

test('a Worker verification failure is visible before any production job begins', { skip: !automatic }, () => {
  const autoReport = job(automatic, 'report-verification-failure');
  assert.match(autoReport, /Record blocked automatic candidate/);
  assert.match(autoReport, /No production job started/);
  assert.match(autoReport, /GITHUB_RUN_ID/);
});

// An external dashboard or CLI writer is outside GitHub's concurrency group.
// This remains an activation blocker and needs a separate enforceable control.
test.todo('external deployment between prior-version read and write is rejected without overwriting it');
