import assert from "node:assert/strict";
import test from "node:test";
import { validateKnowledgeFacts } from "../scripts/audit-knowledge-sync.mjs";

const source = "knowledge/faq/about-mantosh.md";
const document = (facts) => `---\ntitle: Profile\n${facts}\n---\nPublished profile.\n`;

test("accepts a currently deployed structured profile fact", () => {
  assert.equal(validateKnowledgeFacts(source, document('fact_location: "Toronto, Canada"')), 1);
});

test("rejects the UAE fact keys that broke the main knowledge sync", () => {
  for (const key of ["relocation_target", "relocation_availability", "target_locations"]) {
    assert.throws(
      () => validateKnowledgeFacts(source, document(`fact_${key}: "UAE"`)),
      /not accepted by the deployed indexer/
    );
  }
});

test("rejects structured facts in an unapproved knowledge source", () => {
  assert.throws(
    () => validateKnowledgeFacts("knowledge/resume/professional-experience.md", document('fact_location: "Toronto"')),
    /not allowed from this source/
  );
});
