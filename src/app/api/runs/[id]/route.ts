import { getRun } from "@/lib/runs.ts";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return Response.json({ error: "Invalid run id" }, { status: 400 });
  }
  const data = await getRun(id);
  if (!data) {
    return Response.json({ error: "Run not found" }, { status: 404 });
  }
  return Response.json(data);
}
