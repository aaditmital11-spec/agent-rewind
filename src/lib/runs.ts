import { pool } from "./db.ts";
import type { RecordedStep } from "./recorder.ts";

export type RunSummary = {
  id: number;
  name: string;
  status: "running" | "success" | "failed";
  error: string | null;
  replayed_from_run_id: number | null;
  started_at: Date;
  step_count: number;
  total_duration_ms: number;
};

// All runs, newest first, with step count and total duration.
export async function listRuns(): Promise<RunSummary[]> {
  const result = await pool.query(
    `SELECT r.id, r.name, r.status, r.error, r.replayed_from_run_id, r.started_at,
            COUNT(s.id)::int AS step_count,
            COALESCE(SUM(s.duration_ms), 0)::int AS total_duration_ms
     FROM runs r
     LEFT JOIN steps s ON s.run_id = r.id
     GROUP BY r.id
     ORDER BY r.started_at DESC, r.id DESC`
  );
  return result.rows;
}

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
