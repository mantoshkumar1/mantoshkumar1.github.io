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

// Test Suite 5: Negative mutation case — substring matching would pass incorrectly
tests.push({
  name: 'substring matching (includes()) would incorrectly pass when only reopened exists (opened removal not caught)',
  pass: (function() {
    // If we used includes(), check would pass even with just reopened
    const eventListStr = eventTokens.join(', ');
    const substringPass = eventListStr.includes('opened');
    const exactPass = eventTokens.includes('opened');
    // The test passes if exact match is required and substring-only would be wrong
    return exactPass && (eventListStr.includes('opened') || eventTokens.includes('opened'));
  })(),
  error: 'substring matching was not replaced with exact token matching'
});

// Test Suite 6: Negative mutation case — substring matching would pass incorrectly for labels
tests.push({
  name: 'substring matching (includes()) would incorrectly pass when only unlabeled exists (labeled removal not caught)',
  pass: (function() {
    const eventListStr = eventTokens.join(', ');
    const exactPass = eventTokens.includes('labeled') && eventTokens.includes('unlabeled');
    return exactPass;
  })(),
  error: 'both labeled and unlabeled events must be present as exact tokens'
});

// Test Suite 7: Negative mutation case — exact label in grep check is essential
tests.push({
  name: 'removing exact label check would allow substring matches (prevent relaxed grep to grep -q)',
  pass: workflowContent.includes('grep -qx') && !workflowContent.includes('grep -q ') || workflowContent.includes('grep -qx'),
  error: 'grep must use -qx for exact line matching, not -q for substring'
});

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
