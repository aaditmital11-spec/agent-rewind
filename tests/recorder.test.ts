// Needs Postgres running with db/init.sql applied (DATABASE_URL in .env.local or the environment).
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { createRun, step, type Ctx, type RecordedStep } from "../src/lib/recorder.ts";
import { getRun } from "../src/lib/runs.ts";
import { pool } from "../src/lib/db.ts";

const createdRuns: number[] = [];

after(async () => {
  // Steps are deleted with their run (ON DELETE CASCADE). Replays first, they reference the original.
  for (const id of createdRuns.reverse()) await pool.query("DELETE FROM runs WHERE id = $1", [id]);
  await pool.end();
});

async function newCtx(replay?: Ctx["replay"], replayedFromRunId?: number): Promise<Ctx> {
  const runId = await createRun("recorder test", replayedFromRunId);
  createdRuns.push(runId);
  return { runId, seq: 0, replay };
}

// A three step "agent": doubles a number, adds one, then doubles again.
// calls records which steps actually ran their function.
async function fakeAgent(ctx: Ctx, calls: string[]) {
  const a = await step(ctx, "llm", "double", { n: 5 }, async (input) => {
    calls.push("double");
    return input.n * 2;
  });
  const b = await step(ctx, "tool", "add_one", { n: a }, async (input) => {
    calls.push("add_one");
    return input.n + 1;
  });
  return step(ctx, "llm", "double_again", { n: b }, async (input) => {
    calls.push("double_again");
    return input.n * 2;
  });
}

async function stepsBySeq(runId: number) {
  const data = await getRun(runId);
  const steps: Record<number, RecordedStep> = {};
  for (const s of data!.steps) steps[s.seq] = s;
  return steps;
}

test("step() records every call in order with its input and output", async () => {
  const calls: string[] = [];
  const ctx = await newCtx();
  assert.equal(await fakeAgent(ctx, calls), 22);
  assert.deepEqual(calls, ["double", "add_one", "double_again"]);

  const steps = await stepsBySeq(ctx.runId);
  assert.deepEqual(
    Object.values(steps).map((s) => [s.seq, s.type, s.name, s.input, s.output]),
    [
      [1, "llm", "double", { n: 5 }, 10],
      [2, "tool", "add_one", { n: 10 }, 11],
      [3, "llm", "double_again", { n: 11 }, 22],
    ]
  );
});

test("replay serves earlier steps from Postgres and runs the edited step live", async () => {
  const original = await newCtx();
  await fakeAgent(original, []);

  // Replay from step 2 with an edited input: add_one gets 100 instead of 10.
  const calls: string[] = [];
  const replay = await newCtx({ fromSeq: 2, newInput: { n: 100 }, steps: await stepsBySeq(original.runId) }, original.runId);
  assert.equal(await fakeAgent(replay, calls), 202);

  // Step 1 did not run its function; steps 2 and 3 did.
  assert.deepEqual(calls, ["add_one", "double_again"]);
  const steps = await stepsBySeq(replay.runId);
  assert.equal(steps[1].output, 10);
  assert.equal(steps[1].duration_ms, 0);
  assert.deepEqual(steps[2].input, { n: 100 });
  assert.equal(steps[3].output, 202);
});

test("a failed step is recorded with its error and the error is rethrown", async () => {
  const ctx = await newCtx();
  await assert.rejects(
    step(ctx, "tool", "broken", {}, async () => {
      throw new Error("boom");
    }),
    /boom/
  );
  const steps = await stepsBySeq(ctx.runId);
  assert.equal(steps[1].error, "boom");
  assert.equal(steps[1].output, null);
});

test("replay stops if the agent takes a different path than the recording", async () => {
  const original = await newCtx();
  await fakeAgent(original, []);
  const replay = await newCtx({ fromSeq: 3, newInput: { n: 1 }, steps: await stepsBySeq(original.runId) }, original.runId);
  await assert.rejects(
    step(replay, "tool", "something_else", {}, async () => 1),
    /Replay mismatch at step 1/
  );
});
