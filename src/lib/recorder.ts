import { pool } from "./db.ts";

export type StepType = "llm" | "tool" | "retrieval";

export type RecordedStep = {
  seq: number;
  type: StepType;
  name: string;
  input: unknown;
  output: unknown;
  error: string | null;
  duration_ms: number | null;
};

// Passed through the whole agent run. seq counts steps so each one gets a number.
// When replaying, steps holds the original run's steps keyed by seq.
export type Ctx = {
  runId: number;
  seq: number;
  replay?: {
    fromSeq: number;
    newInput: unknown;
    steps: Record<number, RecordedStep>;
  };
};

export async function createRun(
  name: string,
  replayedFromRunId?: number,
  replayedFromSeq?: number
): Promise<number> {
  const result = await pool.query(
    "INSERT INTO runs (name, replayed_from_run_id, replayed_from_seq) VALUES ($1, $2, $3) RETURNING id",
    [name, replayedFromRunId ?? null, replayedFromSeq ?? null]
  );
  return result.rows[0].id;
}

export async function finishRun(runId: number, status: "success" | "failed", error?: string) {
  await pool.query("UPDATE runs SET status = $1, error = $2 WHERE id = $3", [
    status,
    error ?? null,
    runId,
  ]);
}

async function saveStep(
  runId: number,
  seq: number,
  type: StepType,
  name: string,
  input: unknown,
  output: unknown,
  error: string | null,
  durationMs: number
) {
  await pool.query(
    `INSERT INTO steps (run_id, seq, type, name, input, output, error, duration_ms)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    // JSONB columns: pg needs a JSON string, and undefined must become SQL NULL.
    [
      runId,
      seq,
      type,
      name,
      JSON.stringify(input ?? null),
      JSON.stringify(output ?? null),
      error,
      durationMs,
    ]
  );
}

// Every LLM call, tool call, and retrieval goes through here.
export async function step<I, T>(
  ctx: Ctx,
  type: StepType,
  name: string,
  input: I,
  fn: (input: I) => Promise<T>
): Promise<T> {
  ctx.seq += 1;
  const seq = ctx.seq;

  // Replay, before the edited step: serve the recorded output, do not call fn.
  if (ctx.replay && seq < ctx.replay.fromSeq) {
    const recorded = ctx.replay.steps[seq];
    if (!recorded || recorded.name !== name) {
      throw new Error(`Replay mismatch at step ${seq}: expected ${recorded?.name}, got ${name}`);
    }
    // Nothing ran, so duration is 0.
    await saveStep(ctx.runId, seq, recorded.type, recorded.name, recorded.input, recorded.output, recorded.error, 0);
    if (recorded.error) throw new Error(recorded.error);
    return recorded.output as T;
  }

  // Replay, at the edited step: run live with the edited input.
  if (ctx.replay && seq === ctx.replay.fromSeq) {
    // Trust the edited input to have the same shape as the original.
    input = ctx.replay.newInput as I;
  }

  const start = Date.now();
  try {
    const output = await fn(input);
    await saveStep(ctx.runId, seq, type, name, input, output, null, Date.now() - start);
    return output;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await saveStep(ctx.runId, seq, type, name, input, null, message, Date.now() - start);
    throw err;
  }
}
