import { readFileSync } from 'fs';
import { resolve } from 'path';
import YAML from 'yaml';

const workflowPath = resolve('.github/workflows/protected-paths.yml');
const workflowContent = readFileSync(workflowPath, 'utf8');
const workflow = YAML.parse(workflowContent);

const tests = [];

// Test 1: Verify labeled and unlabeled events are explicitly included
const pullRequestTypes = workflow.on?.pull_request?.types || [];
tests.push({
  name: 'labeled event is in pull_request types',
  pass: pullRequestTypes.includes('labeled'),
  error: 'labeled event missing from pull_request trigger — label application will not start a fresh run'
});

tests.push({
  name: 'unlabeled event is in pull_request types',
  pass: pullRequestTypes.includes('unlabeled'),
  error: 'unlabeled event missing from pull_request trigger — label removal will not start a fresh run'
});

// Test 2: Verify required pull_request activities are present
tests.push({
  name: 'opened event is in pull_request types',
  pass: pullRequestTypes.includes('opened'),
  error: 'opened event missing — initial PR runs will not trigger'
});

tests.push({
  name: 'synchronize event is in pull_request types',
  pass: pullRequestTypes.includes('synchronize'),
  error: 'synchronize event missing — updated commits will not re-run the workflow'
});

tests.push({
  name: 'reopened event is in pull_request types',
  pass: pullRequestTypes.includes('reopened'),
  error: 'reopened event missing — re-opened PRs will not re-run the workflow'
});

// Test 3: Verify the exact label name is required
const guardStep = workflow.jobs?.guard?.steps?.find(
  s => s.name && s.name.includes('Block unapproved changes')
);

if (!guardStep) {
  tests.push({
    name: 'guard step exists',
    pass: false,
    error: 'guard step not found in workflow'
  });
} else {
  const runScript = guardStep.run || '';
  
  tests.push({
    name: 'exact label name approved-test-change is required',
    pass: runScript.includes("grep -qx 'approved-test-change'"),
    error: 'exact label name check not found — workflow may accept partial matches or wrong labels'
  });

  tests.push({
    name: 'fail-closed behavior preserved when label absent',
    pass: runScript.includes('exit 1') && runScript.includes('::error::'),
    error: 'fail-closed error behavior not found — workflow may pass without approval'
  });
}

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
