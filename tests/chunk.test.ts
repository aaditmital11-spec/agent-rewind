import { test } from "node:test";
import assert from "node:assert/strict";
import { chunkMarkdown } from "../src/lib/rag.ts";

test("chunkMarkdown makes one chunk per ## section, each starting with the title", () => {
  const doc = "# Pricing\n\nIntro text.\n\n## Free\n\nCosts $0.\n\n## Pro\n\nCosts $25.";
  assert.deepEqual(chunkMarkdown(doc), [
    "Pricing\nIntro text.",
    "Pricing\n## Free\n\nCosts $0.",
    "Pricing\n## Pro\n\nCosts $25.",
  ]);
});

test("chunkMarkdown skips an empty intro and handles Windows line endings", () => {
  const doc = "# Support\r\n\r\n## Hours\r\nWeekdays.";
  assert.deepEqual(chunkMarkdown(doc), ["Support\n## Hours\nWeekdays."]);
});
