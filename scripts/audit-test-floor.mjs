import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// A floor that only rises.
//
// The Worker test count is recorded in .test-count and compared on every run.
// The count may grow; it may never shrink. An agent that deletes or skips a
// test to turn the suite green trips this check without anyone watching.
//
// This guards quantity, not quality. It cannot detect a test weakened in place
// (an assertion replaced with something trivially true). That failure mode
// needs the protected-paths review gate, which forces a human to read the
// diff of tests/ before it can merge.

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const baselinePath = join(root, ".test-count");

function readBaseline() {
  try {
    const raw = readFileSync(baselinePath, "utf8").trim();
    if (!/^\d+$/.test(raw)) {
      console.error(`test floor: .test-count must contain a single integer, found "${raw}"`);
      process.exit(1);
    }
    return Number(raw);
  } catch {
    return 0;
  }
}

function currentCount() {
  // Pin the reporter. node --test picks the spec reporter on a TTY and TAP
  // otherwise, so an unpinned run prints "ℹ tests 89" in a terminal and
  // "# tests 89" in CI. Forcing tap makes the output identical everywhere.
  let output;
  try {
    output = execFileSync("node", ["--test", "--test-reporter=tap"], {
      cwd: join(root, "chat-worker"),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    // A failing suite still reports its totals; a genuine test failure is the
    // unit tests' job to report, not this script's.
    output = `${error.stdout || ""}${error.stderr || ""}`;
  }

  // Accept the tap form and the spec form, in case the reporter flag is ever
  // dropped or unsupported.
  const match = output.match(/^\s*(?:#|ℹ)\s*tests\s+(\d+)\s*$/m);
  if (!match) {
    console.error("test floor: could not read a test count from the runner output.");
    console.error("Last 20 lines of runner output:");
    console.error(output.trimEnd().split("\n").slice(-20).map((line) => `  ${line}`).join("\n"));
    process.exit(1);
  }
  return Number(match[1]);
}

const baseline = readBaseline();
const count = currentCount();

if (count < baseline) {
  console.error(`test floor: test count fell from ${baseline} to ${count}.`);
  console.error("Restore the removed tests, or lower the floor deliberately in a reviewed commit.");
  process.exit(1);
}

if (count > baseline) {
  writeFileSync(baselinePath, `${count}\n`);
  console.log(`test floor raised from ${baseline} to ${count}; commit .test-count.`);
  process.exit(0);
}

console.log(`test floor held at ${baseline} tests.`);
