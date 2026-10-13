"use client";

import { useEffect, useState } from "react";
import type { RecordedStep } from "@/lib/recorder.ts";
import { formatDuration } from "@/lib/format.ts";
import { TypeBadge } from "./ui/Badge.tsx";
import CodeBlock from "./ui/CodeBlock.tsx";
import Tabs from "./ui/Tabs.tsx";
import ReplayForm from "./ReplayForm.tsx";
import RetrievedChunks from "./RetrievedChunks.tsx";

const BAR_COLORS: Record<string, string> = { llm: "bg-llm/60", tool: "bg-tool/60", retrieval: "bg-retrieval/60" };

// Keys that should not move the selection: the user is typing somewhere.
function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}

// Timeline of steps on the left, the selected step's details on the right.
export default function RunView({
  runId,
  steps,
  replayedFromRunId,
  replayedFromSeq,
}: {
  runId: number;
  steps: RecordedStep[];
  replayedFromRunId: number | null;
  replayedFromSeq: number | null;
}) {
  // Open the first failed step by default, since that is usually what you want to debug.
  const firstFailed = steps.find((s) => s.error);
  const [selectedSeq, setSelectedSeq] = useState(firstFailed?.seq ?? steps[0]?.seq);
  const selected = steps.find((s) => s.seq === selectedSeq);
  const maxMs = Math.max(1, ...steps.map((s) => s.duration_ms ?? 0));

  // Steps before the replay point were served from the original run's recording.
  const isCached = (s: RecordedStep) => replayedFromSeq !== null && s.seq < replayedFromSeq;

  // Up/down arrows or j/k move through the timeline.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.altKey || e.ctrlKey || e.metaKey || isTyping(e.target) || document.querySelector("dialog[open]")) return;
      const move = e.key === "ArrowDown" || e.key === "j" ? 1 : e.key === "ArrowUp" || e.key === "k" ? -1 : 0;
      if (!move) return;
      e.preventDefault();
      const i = steps.findIndex((s) => s.seq === selectedSeq);
      const next = steps[Math.min(steps.length - 1, Math.max(0, i + move))];
      setSelectedSeq(next.seq);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [steps, selectedSeq]);

  // Keep the selected row visible when moving with the keyboard.
  useEffect(() => {
    document.getElementById(`step-${selectedSeq}`)?.scrollIntoView({ block: "nearest" });
  }, [selectedSeq]);

  if (steps.length === 0) {
    return (
      <p className="rounded-md border border-line bg-surface px-3 py-10 text-center text-sm text-muted">
        This run has no recorded steps.
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:h-[calc(100dvh-13rem)] md:min-h-[28rem] md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <section aria-label="Timeline" className="flex min-h-0 flex-col rounded-md border border-line bg-surface">
        <div className="flex h-9 shrink-0 items-center justify-between border-b border-line px-3">
          <h2 className="text-sm font-medium">Timeline</h2>
          <p className="text-xs text-muted">
            <kbd className="font-mono">j</kbd> <kbd className="font-mono">k</kbd> or arrows to move
          </p>
        </div>
        <ol className="min-h-0 flex-1 overflow-y-auto py-1">
          {steps.map((s) => {
            const isSelected = s.seq === selectedSeq;
            const failed = s.error !== null;
            return (
              <li key={s.seq}>
                <button
                  id={`step-${s.seq}`}
                  type="button"
                  onClick={() => setSelectedSeq(s.seq)}
                  aria-current={isSelected || undefined}
                  className={`grid h-9 w-full grid-cols-[1.5rem_4.75rem_minmax(0,1fr)_4rem_3.75rem] items-center gap-2 border-l-2 pr-3 pl-2.5 text-left focus-visible:-outline-offset-2 ${
                    failed ? "border-danger" : isSelected ? "border-accent" : "border-transparent"
                  } ${isSelected ? "bg-accent/10" : "hover:bg-subtle"}`}
                >
                  <span className="text-right font-mono text-xs text-muted tabular-nums">{s.seq}</span>
                  <span>
                    <TypeBadge type={s.type} />
                  </span>
                  <span className="flex min-w-0 items-center gap-1.5">
                    {failed && <FailIcon />}
                    <span className={`truncate font-mono text-xs ${failed ? "text-danger" : ""}`}>{s.name}</span>
                    {isCached(s) && (
                      <span className="shrink-0 rounded border border-line px-1 text-[11px] leading-4 text-muted">
                        cached
                      </span>
                    )}
                  </span>
                  {/* Duration relative to the slowest step in this run */}
                  <span className="h-1.5 rounded-sm bg-subtle" aria-hidden="true">
                    <span
                      className={`block h-full rounded-sm ${failed ? "bg-danger/70" : (BAR_COLORS[s.type] ?? "bg-muted")}`}
                      style={{ width: `${((s.duration_ms ?? 0) / maxMs) * 100}%` }}
                    />
                  </span>
                  <span className="text-right font-mono text-xs text-muted tabular-nums">
                    {formatDuration(s.duration_ms)}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      {selected && (
        // key resets the tabs and the replay form when a different step is selected
        <StepDetail
          key={selected.seq}
          runId={runId}
          step={selected}
          cachedFrom={isCached(selected) ? replayedFromRunId : null}
        />
      )}
    </div>
  );
}

function StepDetail({ runId, step, cachedFrom }: { runId: number; step: RecordedStep; cachedFrom: number | null }) {
  const tabs = [
    { id: "input", label: "Input" },
    { id: "output", label: step.type === "retrieval" ? "Retrieved chunks" : "Output" },
    ...(step.error ? [{ id: "error", label: "Error" }] : []),
  ];
  // A failed step opens on its error, anything else on its output.
  const [tab, setTab] = useState(step.error ? "error" : "output");

  return (
    <section aria-label={`Step ${step.seq}`} className="flex min-h-0 flex-col rounded-md border border-line bg-surface">
      <div className="shrink-0 space-y-2 border-b border-line px-4 pt-3">
        <div className="flex items-center gap-2">
          <h2 className="min-w-0 truncate font-mono text-sm font-medium">{step.name}</h2>
          {step.error && <FailIcon />}
        </div>
        <dl className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
          <div className="flex gap-1.5">
            <dt className="text-muted">Type</dt>
            <dd className="font-mono">{step.type}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-muted">Seq</dt>
            <dd className="font-mono">{step.seq}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-muted">Duration</dt>
            <dd className="font-mono">{formatDuration(step.duration_ms)}</dd>
          </div>
          {cachedFrom !== null && (
            <div className="flex gap-1.5">
              <dt className="text-muted">Served from</dt>
              <dd className="font-mono">run #{cachedFrom}</dd>
            </div>
          )}
        </dl>
        <Tabs tabs={tabs} value={tab} onChange={setTab} idPrefix="step" label="Step data" />
      </div>

      <div
        id="step-panel"
        role="tabpanel"
        aria-labelledby={`step-tab-${tab}`}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4"
      >
        {tab === "input" && <CodeBlock value={step.input} />}
        {tab === "output" &&
          (step.type === "retrieval" && Array.isArray(step.output) ? (
            <RetrievedChunks chunks={step.output} />
          ) : (
            <CodeBlock value={step.output} />
          ))}
        {tab === "error" && (
          <pre className="rounded border border-danger/40 bg-danger/5 p-3 font-mono text-xs leading-5 break-words whitespace-pre-wrap text-danger">
            {step.error}
          </pre>
        )}
        <ReplayForm runId={runId} step={step} />
      </div>
    </section>
  );
}

function FailIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5 shrink-0 text-danger" fill="none" aria-label="Failed" role="img">
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.75 5.75l4.5 4.5M10.25 5.75l-4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
