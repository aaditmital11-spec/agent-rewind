import Link from "next/link";
import { notFound } from "next/navigation";
import { getRun } from "@/lib/runs.ts";
import RunView from "@/components/RunView.tsx";
import { StatusBadge, formatDuration } from "@/components/badges.tsx";

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const data = Number.isInteger(id) ? await getRun(id) : null;
  if (!data) notFound();

  const { run, steps } = data;
  const totalMs = steps.reduce((sum, s) => sum + (s.duration_ms ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          &larr; All runs
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold">
            <span className="text-gray-400">#{run.id}</span> {run.name}
          </h1>
          <StatusBadge status={run.status} />
        </div>
        <p className="text-sm text-gray-500">
          {steps.length} steps · {formatDuration(totalMs)} ·{" "}
          {run.started_at.toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}
        </p>
        {run.replayed_from_run_id && (
          <p className="text-sm">
            Replayed from{" "}
            <Link href={`/runs/${run.replayed_from_run_id}`} className="text-blue-600 hover:underline">
              run #{run.replayed_from_run_id}
            </Link>
          </p>
        )}
        {run.error && (
          <p className="break-all rounded border border-red-300 bg-red-50 p-2 text-sm text-red-800">{run.error}</p>
        )}
      </div>

      <RunView steps={steps} />
    </div>
  );
}
