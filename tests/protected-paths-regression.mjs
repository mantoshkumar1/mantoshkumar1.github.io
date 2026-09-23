import { readFileSync } from 'fs';
import { resolve } from 'path';

const workflowPath = resolve('.github/workflows/protected-paths.yml');
const workflowContent = readFileSync(workflowPath, 'utf8');

const tests = [];
const requiredEvents = ['opened', 'synchronize', 'reopened', 'labeled', 'unlabeled'];

// ========== SHARED VALIDATOR ==========
// One function that validates the workflow and returns failures
function validateWorkflow(content) {
  const failures = [];

  // Extract events from on.pull_request specifically
  const pullRequestMatch = content.match(/on:\s*\n\s*pull_request:\s*\n[\s\S]*?branches:\s*\[([^\]]*)\]\n\s*types:\s*\[([^\]]*)\]/);

  if (!pullRequestMatch) {
    failures.push('PARSE_ERROR: Could not find on.pull_request.types block');
    return failures;
  }

  const eventList = pullRequestMatch[2];
  const eventTokens = eventList
    .split(',')
    .map(e => e.trim())
    .map(e => e.replace(/^['\"]|['\"]$/g, ''))  // Strip surrounding quotes
    .filter(e => e.length > 0);

  // Check 1: All required events must be present as exact tokens
  requiredEvents.forEach(event => {
    if (!eventTokens.includes(event)) {
      failures.push(`MISSING_EVENT: ${event}`);
    }
  });

  // Check 2: Exact label check with grep -qx (not substring matching)
  if (!content.includes("grep -qx 'approved-test-change'")) {
    failures.push('MISSING_EXACT_LABEL_CHECK: grep -qx required');
  }

  // Check 3: Fail-closed behavior: error message required
  if (!content.includes('::error::Protected paths changed without review')) {
    failures.push('MISSING_ERROR_MESSAGE');
  }

  // Check 4: Fail-closed behavior: exit 1 required (specifically in guard job after error message)
  // Look for the guard job and verify it has error → exit 1 sequence
  const guardMatch = content.match(/jobs:\s*\n\s*guard:[\s\S]*?(?=\n  \w+:|$)/);
  if (guardMatch && guardMatch[0]) {
    const guardJob = guardMatch[0];
    // Must have error message followed by exit 1 in proper order
    const errorPos = guardJob.indexOf('::error::Protected paths changed without review');
    const exitPos = guardJob.indexOf('exit 1');
    if (errorPos === -1 || exitPos === -1 || exitPos < errorPos) {
      failures.push('MISSING_EXIT_1');
    }
  } else {
    failures.push('PARSE_ERROR: Could not find guard job');
  }

  return failures;
}

// ========== POSITIVE TEST: Real workflow must pass ==========
const realFailures = validateWorkflow(workflowContent);
tests.push({
  name: 'real workflow passes all validation checks',
  pass: realFailures.length === 0,
  error: realFailures.length > 0 ? `Failures: ${realFailures.join(', ')}` : 'None'
});

// ========== NEGATIVE TESTS: Mutations must be caught ==========

// Mutation Suite A: Event removal mutations
// EXACT ONE-ELEMENT FAILURE SET REQUIRED: Each mutation produces exactly one failure
requiredEvents.forEach(eventToRemove => {
  // Create mutated workflow without this event
  const pullRequestMatch = workflowContent.match(/on:\s*\n\s*pull_request:\s*\n[\s\S]*?branches:\s*\[([^\]]*)\]\n\s*types:\s*\[([^\]]*)\]/);
  const eventList = pullRequestMatch[2];
  const eventTokens = eventList
    .split(',')
    .map(e => e.trim())
    .map(e => e.replace(/^['\"]|['\"]$/g, ''))  // Strip surrounding quotes
    .filter(e => e.length > 0);

  const reducedTokens = eventTokens.filter(e => e !== eventToRemove);
  const mutatedEventString = reducedTokens.join(', ');
  const pullRequestBlock = pullRequestMatch[0];
  const mutatedPullRequestBlock = pullRequestBlock.replace(
    /types:\s*\[[^\]]*\]/,
    `types: [${mutatedEventString}]`
  );
  const mutatedContent = workflowContent.replace(
    pullRequestBlock,
    mutatedPullRequestBlock
  );

  const mutatedFailures = validateWorkflow(mutatedContent);

  tests.push({
    name: `removing '${eventToRemove}' event is detected as regression`,
    pass: mutatedFailures.length === 1 && mutatedFailures[0] === `MISSING_EVENT: ${eventToRemove}`,
    error: mutatedFailures.length === 1 
      ? `Mutation not caught — validator should fail with MISSING_EVENT: ${eventToRemove}`
      : `Expected exactly 1 failure; got ${mutatedFailures.length}: ${mutatedFailures.join(', ')}`
  });
});

// Mutation B: Weaken label check from grep -qx to grep -q
(function() {
  const mutatedContent = workflowContent.replace(/grep -qx/, 'grep -q');
  const mutatedFailures = validateWorkflow(mutatedContent);

  tests.push({
    name: "changing 'grep -qx' to 'grep -q' (substring matching) is detected",
    pass: mutatedFailures.length === 1 && mutatedFailures[0] === 'MISSING_EXACT_LABEL_CHECK: grep -qx required',
    error: mutatedFailures.length === 1
      ? 'Mutation not caught — validator should fail with MISSING_EXACT_LABEL_CHECK'
      : `Expected exactly 1 failure; got ${mutatedFailures.length}: ${mutatedFailures.join(', ')}`
  });
})();

// Mutation C: Remove fail-closed exit from exit 1 to exit 0
(function() {
  const mutatedContent = workflowContent.replace(/exit 1/, 'exit 0');
  const mutatedFailures = validateWorkflow(mutatedContent);

  tests.push({
    name: "changing 'exit 1' to 'exit 0' (fail-open) is detected",
    pass: mutatedFailures.length === 1 && mutatedFailures[0] === 'MISSING_EXIT_1',
    error: mutatedFailures.length === 1
      ? 'Mutation not caught — validator should fail with MISSING_EXIT_1'
      : `Expected exactly 1 failure; got ${mutatedFailures.length}: ${mutatedFailures.join(', ')}`
  });
})();

// Report results
let failCount = 0;
const passed = [];
const failed = [];

tests.forEach(test => {
  if (test.pass) {
    passed.push(`✓ ${test.name}`);
  } else {
    failed.push(`✗ ${test.name}\n  → ${test.error}`);
    failCount++;
  }
});

console.log('Protected-paths regression test suite');
console.log('=====================================\n');
console.log('Positive assertions (exact tokens required):');
passed.forEach(p => console.log(p));

if (failed.length > 0) {
  console.log('\nFailed assertions:');
  failed.forEach(f => console.error(f));
}

console.log(`\n${tests.length - failCount}/${tests.length} tests passed`);

if (failCount > 0) {
  process.exit(1);
}
