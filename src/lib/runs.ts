import { pool } from "./db.ts";
import type { RecordedStep } from "./recorder.ts";

// One run and its steps in order, or null if the run does not exist.
export async function getRun(id: number) {
  const runResult = await pool.query("SELECT * FROM runs WHERE id = $1", [id]);
  if (runResult.rows.length === 0) return null;
  const stepsResult = await pool.query(
    "SELECT * FROM steps WHERE run_id = $1 ORDER BY seq",
    [id]
  );
  return { run: runResult.rows[0], steps: stepsResult.rows as RecordedStep[] };
}
