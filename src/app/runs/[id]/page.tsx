import Link from "next/link";
import { notFound } from "next/navigation";
import { getRun } from "@/lib/runs.ts";
import { formatDateTime, formatDuration, timeAgo } from "@/lib/format.ts";
import RunView from "@/components/RunView.tsx";
import { StatusBadge } from "@/components/ui/Badge.tsx";

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const data = Number.isInteger(id) ? await getRun(id) : null;
  if (!data) notFound();

  const { run, steps } = data;
  const totalMs = steps.reduce((sum, s) => sum + (s.duration_ms ?? 0), 0);

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted">
          <Link href="/" className="hover:text-fg">
            Runs
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-mono text-xs">#{run.id}</span>
        </nav>

        <div className="flex items-start gap-3">
          <h1 className="min-w-0 text-lg leading-snug font-semibold break-words">{run.name}</h1>
          <div className="pt-0.5">
            <StatusBadge status={run.status} />
          </div>
        </div>

        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <Meta label="Duration">
            <span className="font-mono text-xs">{formatDuration(totalMs)}</span>
          </Meta>
          <Meta label="Steps">
            <span className="font-mono text-xs">{steps.length}</span>
          </Meta>
          <Meta label="Started">
            <time dateTime={run.started_at.toISOString()} title={formatDateTime(run.started_at)}>
              {timeAgo(run.started_at)}
            </time>
          </Meta>
          {run.replayed_from_run_id && (
            <Meta label="Replayed from">
              <Link href={`/runs/${run.replayed_from_run_id}`} className="font-mono text-xs text-accent hover:underline">
                #{run.replayed_from_run_id}
              </Link>
              {run.replayed_from_seq && <span className="text-muted"> at step {run.replayed_from_seq}</span>}
            </Meta>
          )}
        </dl>

        {/* The run's own error, which can differ from any step's (for example a replay mismatch). */}
        {run.error && (
          <p className="rounded border border-danger/40 bg-danger/5 px-3 py-2 font-mono text-xs break-words text-danger">
            {run.error}
          </p>
        )}
      </header>

      <RunView
        runId={run.id}
        steps={steps}
        replayedFromRunId={run.replayed_from_run_id}
        replayedFromSeq={run.replayed_from_seq}
      />
    </div>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="text-muted">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
