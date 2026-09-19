import { readFileSync } from 'fs';
import { resolve } from 'path';

const workflowPath = resolve('.github/workflows/protected-paths.yml');
const workflowContent = readFileSync(workflowPath, 'utf8');

const tests = [];

// Test 1: Verify labeled and unlabeled events are explicitly included in the workflow trigger
const eventLineMatch = workflowContent.match(/types:\s*\[([^\]]+)\]/);
const eventList = eventLineMatch ? eventLineMatch[1] : '';

tests.push({
  name: 'labeled event is in pull_request types',
  pass: eventList.includes('labeled'),
  error: 'labeled event missing from pull_request trigger — label application will not start a fresh run'
});

tests.push({
  name: 'unlabeled event is in pull_request types',
  pass: eventList.includes('unlabeled'),
  error: 'unlabeled event missing from pull_request trigger — label removal will not start a fresh run'
});

// Test 2: Verify required pull_request activities are present
tests.push({
  name: 'opened event is in pull_request types',
  pass: eventList.includes('opened'),
  error: 'opened event missing — initial PR runs will not trigger'
});

tests.push({
  name: 'synchronize event is in pull_request types',
  pass: eventList.includes('synchronize'),
  error: 'synchronize event missing — updated commits will not re-run the workflow'
});

tests.push({
  name: 'reopened event is in pull_request types',
  pass: eventList.includes('reopened'),
  error: 'reopened event missing — re-opened PRs will not re-run the workflow'
});

// Test 3: Verify the exact label name is required in the guard step
const grepCheckMatch = workflowContent.match(/grep\s+-qx\s+'approved-test-change'/);
const hasGrepCheck = Boolean(grepCheckMatch);

tests.push({
  name: 'exact label name approved-test-change is required',
  pass: hasGrepCheck,
  error: 'exact label name check not found — workflow may accept partial matches or wrong labels'
});

// Test 4: Verify fail-closed behavior (exit 1 on missing label)
const hasErrorOnMissing = workflowContent.includes('::error::Protected paths changed without review');

tests.push({
  name: 'fail-closed behavior preserved when label absent',
  pass: hasErrorOnMissing && workflowContent.includes('exit 1'),
  error: 'fail-closed error behavior not found — workflow may pass without approval'
});

// Report results
let failCount = 0;
tests.forEach(test => {
  if (test.pass) {
    console.log(`✓ ${test.name}`);
  } else {
    console.error(`✗ ${test.name}`);
    console.error(`  → ${test.error}`);
    failCount++;
  }
});

console.log(`\n${tests.length - failCount}/${tests.length} tests passed`);

if (failCount > 0) {
  process.exit(1);
}
