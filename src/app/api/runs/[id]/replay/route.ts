import { getRun } from "@/lib/runs.ts";
import { runAgent } from "@/lib/agent.ts";
import type { RecordedStep } from "@/lib/recorder.ts";

// Body: { fromSeq, newInput, model? }. Re-runs the original question as a new run:
// steps before fromSeq come from the recording, step fromSeq uses newInput.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const data = Number.isInteger(id) ? await getRun(id) : null;
  if (!data) {
    return Response.json({ error: "Run not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const fromSeq = body?.fromSeq;
  let newInput = body?.newInput;

  const steps: Record<number, RecordedStep> = {};
  for (const s of data.steps) steps[s.seq] = s;

  if (!Number.isInteger(fromSeq) || !steps[fromSeq]) {
    return Response.json({ error: "fromSeq must be the seq of a step in this run" }, { status: 400 });
  }

  // No model picked: keep the model the original run was using at this point.
  const lastLlm = data.steps.filter((s) => s.type === "llm" && s.seq <= fromSeq).at(-1);
  const originalModel = (lastLlm?.input as { model?: string } | undefined)?.model;
  const model = typeof body?.model === "string" && body.model ? body.model : originalModel;
  if (newInput === undefined) {
    return Response.json({ error: "newInput is required" }, { status: 400 });
  }

  // A model picked for an LLM step goes into that step's input, since the input holds the model.
  if (model && steps[fromSeq].type === "llm" && typeof newInput === "object" && newInput !== null) {
    newInput = { ...newInput, model };
  }

  const result = await runAgent(data.run.name, {
    model,
    replayedFromRunId: id,
    replay: { fromSeq, newInput, steps },
  });
  return Response.json(result, { status: 201 });
}
