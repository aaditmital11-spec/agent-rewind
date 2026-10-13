import Link from "next/link";
import { connection } from "next/server";
import { listRuns } from "@/lib/runs.ts";
import { DEMO_QUESTIONS } from "@/lib/agent.ts";
import { formatDateTime, formatDuration, timeAgo } from "@/lib/format.ts";
import NewRunForm from "@/components/NewRunForm.tsx";
import StatusDot from "@/components/ui/StatusDot.tsx";
import { Table, Td, Th } from "@/components/ui/Table.tsx";

const FILTERS = [
  { status: undefined, label: "All" },
  { status: "success", label: "Success" },
  { status: "failed", label: "Failed" },
] as const;

export default async function Home({ searchParams }: PageProps<"/">) {
  await connection(); // read the database on every request, not once at build time
  const { status } = await searchParams;
  const allRuns = await listRuns();
  // Filtering happens here instead of in SQL: the list is small and the counts need every run anyway.
  const runs = status ? allRuns.filter((r) => r.status === status) : allRuns;
  const now = new Date();

  return (
    <div className="space-y-5">
      <NewRunForm demoQuestions={DEMO_QUESTIONS} />

      <section aria-label="Runs" className="space-y-2">
        <nav aria-label="Filter runs by status" className="flex gap-1">
          {FILTERS.map((f) => {
            const active = f.status === status;
            const count = f.status ? allRuns.filter((r) => r.status === f.status).length : allRuns.length;
            return (
              <Link
                key={f.label}
                href={f.status ? `/?status=${f.status}` : "/"}
                aria-current={active ? "page" : undefined}
                className={`flex h-7 items-center gap-1.5 rounded px-2.5 text-sm ${
                  active ? "bg-subtle font-medium text-fg" : "text-muted hover:text-fg"
                }`}
              >
                {f.label}
                <span className="font-mono text-xs text-muted">{count}</span>
              </Link>
            );
          })}
        </nav>

        <Table>
          <thead>
            <tr>
              <Th className="w-8">
                <span className="sr-only">Status</span>
              </Th>
              <Th className="w-14">Run</Th>
              <Th>Question</Th>
              <Th className="w-16 text-right">Steps</Th>
              <Th className="w-20 text-right">Duration</Th>
              <Th className="w-24 text-right">Started</Th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              // relative + the link's after:inset-0 makes the whole row clickable with one real link
              <tr key={run.id} className="relative border-b border-line last:border-0 hover:bg-subtle">
                <Td>
                  <StatusDot status={run.status} />
                </Td>
                <Td className="font-mono text-xs text-muted">#{run.id}</Td>
                <Td className="max-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/runs/${run.id}`}
                      title={run.name}
                      className="truncate after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-accent"
                    >
                      {run.name}
                    </Link>
                    {run.replayed_from_run_id && (
                      <span className="shrink-0 rounded border border-line px-1 font-mono text-xs text-muted">
                        replay of #{run.replayed_from_run_id}
                      </span>
                    )}
                  </div>
                </Td>
                <Td className="text-right font-mono text-xs tabular-nums text-muted">{run.step_count}</Td>
                <Td className="text-right font-mono text-xs tabular-nums text-muted">
                  {run.status === "running" ? "" : formatDuration(run.total_duration_ms)}
                </Td>
                <Td className="text-right text-xs whitespace-nowrap text-muted">
                  <time dateTime={run.started_at.toISOString()} title={formatDateTime(run.started_at)}>
                    {timeAgo(run.started_at, now)}
                  </time>
                </Td>
              </tr>
            ))}
            {runs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-sm text-muted">
                  {allRuns.length === 0 ? "No runs yet. Start one above." : `No ${status} runs.`}
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </section>
    </div>
  );
}
