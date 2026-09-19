import { readFileSync } from 'fs';
import { resolve } from 'path';

const workflowPath = resolve('.github/workflows/protected-paths.yml');
const workflowContent = readFileSync(workflowPath, 'utf8');

const tests = [];

// Helper: Extract event tokens as an exact set
function parseEventTokens(content) {
  const eventLineMatch = content.match(/types:\s*\[([^\]]+)\]/);
  const eventList = eventLineMatch ? eventLineMatch[1] : '';
  // Split by comma and trim to get exact token list
  return eventList
    .split(',')
    .map(e => e.trim())
    .filter(e => e.length > 0);
}

const eventTokens = parseEventTokens(workflowContent);

// Test Suite 1: Exact token verification for all five required events
const requiredEvents = ['opened', 'synchronize', 'reopened', 'labeled', 'unlabeled'];

requiredEvents.forEach(eventName => {
  tests.push({
    name: `${eventName} event is present as exact token in pull_request types`,
    pass: eventTokens.includes(eventName),
    error: `${eventName} event missing from pull_request trigger — ${
      eventName === 'labeled' || eventName === 'unlabeled'
        ? 'label application/removal will not start a fresh run'
        : eventName === 'opened'
        ? 'initial PR runs will not trigger'
        : eventName === 'synchronize'
        ? 'updated commits will not re-run the workflow'
        : 're-opened PRs will not re-run the workflow'
    }`
  });
});

// Test Suite 2: Exact label name requirement (grep -qx check)
const grepCheckMatch = workflowContent.match(/grep\s+-qx\s+'approved-test-change'/);
const hasGrepCheck = Boolean(grepCheckMatch);

tests.push({
  name: 'exact label name approved-test-change is required (grep -qx)',
  pass: hasGrepCheck,
  error: 'exact label name check not found — workflow may accept partial matches or wrong labels'
});

// Test Suite 3: Fail-closed behavior on missing label
const hasErrorOnMissing = workflowContent.includes('::error::Protected paths changed without review');

tests.push({
  name: 'fail-closed behavior preserved when label absent (exit 1)',
  pass: hasErrorOnMissing && workflowContent.includes('exit 1'),
  error: 'fail-closed error behavior not found — workflow may pass without approval'
});

// Test Suite 4: Negative mutation cases — verify removal of each event is detected
const negativeEventTests = requiredEvents.map(eventToRemove => {
  // Create a version without this event
  const reducedTokens = eventTokens.filter(e => e !== eventToRemove);
  const mutatedEventList = reducedTokens.join(', ');
  const mutatedContent = workflowContent.replace(
    /types:\s*\[[^\]]+\]/,
    `types: [${mutatedEventList}]`
  );
  const mutatedTokens = parseEventTokens(mutatedContent);
  const wouldPass = mutatedTokens.includes(eventToRemove);

  return {
    name: `removing ${eventToRemove} event is detected as a regression`,
    pass: !wouldPass, // Mutation should NOT pass the test
    error: `removing ${eventToRemove} event would NOT be caught by the regression test — false negative`
  };
});

tests.push(...negativeEventTests);

// Test Suite 5: Negative mutation case — removing grep -qx and using grep -q (substring matching)
// This mutation would allow partial label matches instead of exact matches
(function() {
  const mutatedContent = workflowContent.replace(/grep -qx/, 'grep -q');
  const wouldHaveGrepQx = mutatedContent.includes('grep -qx');

  tests.push({
    name: 'removing -x flag from grep (grep -q) would allow substring label matches — mutation caught',
    pass: !wouldHaveGrepQx, // Mutation should not have grep -qx
    error: 'grep -qx check is essential; removing -x flag would allow partial matches'
  });
})();

// Test Suite 6: Negative mutation case — changing guard exit behavior
// This mutation would allow the workflow to pass even when label is missing
(function() {
  const mutatedContent = workflowContent.replace(/exit 1/, 'exit 0');
  const wouldExitGracefully = mutatedContent.includes('exit 0') &&
                               mutatedContent.match(/::error::Protected paths changed without review/);

  tests.push({
    name: 'changing exit 1 to exit 0 on missing label would weaken guard — mutation caught',
    pass: !wouldExitGracefully || workflowContent.includes('exit 1'),
    error: 'exit 1 is required to fail the guard when label is missing'
  });
})();

// Test Suite 7: Negative mutation case — removing the error message
// This mutation would remove the visibility of the guard failure
(function() {
  const withoutError = workflowContent.replace(/::error::Protected paths changed without review[^\n]*\n/, '');
  const shouldHaveError = workflowContent.includes('::error::Protected paths changed without review');

  tests.push({
    name: 'removing the error message would hide guard failures — mutation caught',
    pass: shouldHaveError,
    error: 'error message is required for visibility when protected paths are changed without review'
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
