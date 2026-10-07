import { listRuns } from "@/lib/runs.ts";
import { runAgent } from "@/lib/agent.ts";

// List runs, newest first, with step count and total duration.
export async function GET() {
  return Response.json(await listRuns());
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
