import Link from "next/link";
import { connection } from "next/server";
import { listRuns } from "@/lib/runs.ts";
import { DEMO_QUESTIONS } from "@/lib/agent.ts";
import NewRunForm from "@/components/NewRunForm.tsx";
import { StatusBadge } from "@/components/ui/Badge.tsx";
import { formatDuration } from "@/lib/format.ts";

export default async function Home() {
  await connection(); // read the database on every request, not once at build time
  const runs = await listRuns();

  return (
    <div className="space-y-6">
      <NewRunForm demoQuestions={DEMO_QUESTIONS} />

      <section className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2">Run</th>
              <th className="px-4 py-2">Question</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 text-right">Steps</th>
              <th className="px-4 py-2 text-right">Duration</th>
              <th className="px-4 py-2">Started</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr key={run.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-500">#{run.id}</td>
                <td className="px-4 py-2">
                  <Link href={`/runs/${run.id}`} className="font-medium hover:underline">
                    {run.name}
                  </Link>
                  {run.replayed_from_run_id && (
                    <span className="ml-2 text-xs text-gray-500">replay of #{run.replayed_from_run_id}</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <StatusBadge status={run.status} />
                </td>
                <td className="px-4 py-2 text-right">{run.step_count}</td>
                <td className="px-4 py-2 text-right">{formatDuration(run.total_duration_ms)}</td>
                <td className="whitespace-nowrap px-4 py-2 text-gray-500">
                  {run.started_at.toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}
                </td>
              </tr>
            ))}
            {runs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No runs yet. Ask a question above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
