import { pool } from "@/lib/db.ts";
import { runAgent } from "@/lib/agent.ts";

// List runs, newest first, with step count and total duration.
export async function GET() {
  const result = await pool.query(
    `SELECT r.id, r.name, r.status, r.error, r.replayed_from_run_id, r.started_at,
            COUNT(s.id)::int AS step_count,
            COALESCE(SUM(s.duration_ms), 0)::int AS total_duration_ms
     FROM runs r
     LEFT JOIN steps s ON s.run_id = r.id
     GROUP BY r.id
     ORDER BY r.started_at DESC, r.id DESC`
  );
  return Response.json(result.rows);
}

// Start a new run. Waits for the agent to finish, then returns the run id.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const question = body?.question;
  if (typeof question !== "string" || question.trim() === "") {
    return Response.json({ error: "question is required" }, { status: 400 });
  }
  const result = await runAgent(question.trim());
  return Response.json(result, { status: 201 });
}
