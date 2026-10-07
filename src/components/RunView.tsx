"use client";

import { useState } from "react";
import type { RecordedStep } from "@/lib/recorder.ts";
import { TypeBadge, formatDuration } from "./badges.tsx";
import ReplayForm from "./ReplayForm.tsx";

function Json({ value }: { value: unknown }) {
  return (
    <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap break-all rounded bg-gray-900 p-3 font-mono text-xs text-gray-100">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

// Timeline of steps on the left, the selected step's details on the right.
export default function RunView({ runId, steps }: { runId: number; steps: RecordedStep[] }) {
  // Open the first failed step by default, since that is usually what you want to debug.
  const firstFailed = steps.find((s) => s.error);
  const [selectedSeq, setSelectedSeq] = useState(firstFailed?.seq ?? steps[0]?.seq);
  const selected = steps.find((s) => s.seq === selectedSeq);

  if (steps.length === 0) {
    return <p className="text-sm text-gray-500">This run has no steps.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-[320px_1fr]">
      <ol className="space-y-1">
        {steps.map((s) => (
          <li key={s.seq}>
            <button
              onClick={() => setSelectedSeq(s.seq)}
              className={`flex w-full items-center gap-2 rounded border px-3 py-2 text-left text-sm ${
                s.error ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"
              } ${s.seq === selectedSeq ? "ring-2 ring-blue-500" : "hover:bg-gray-50"}`}
            >
              <span className="w-6 text-gray-400">{s.seq}</span>
              <TypeBadge type={s.type} />
              <span className={`flex-1 truncate font-medium ${s.error ? "text-red-700" : ""}`}>{s.name}</span>
              <span className="text-xs text-gray-500">{formatDuration(s.duration_ms)}</span>
            </button>
          </li>
        ))}
      </ol>

      {selected && (
        <section className="min-w-0 space-y-4 rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">#{selected.seq}</span>
            <TypeBadge type={selected.type} />
            <h2 className="font-semibold">{selected.name}</h2>
            <span className="ml-auto text-sm text-gray-500">{formatDuration(selected.duration_ms)}</span>
          </div>
          {/* key resets the form when a different step is selected */}
          <ReplayForm key={selected.seq} runId={runId} step={selected} />
          {selected.error && (
            <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
              <div className="mb-1 font-semibold">Error</div>
              <div className="break-all">{selected.error}</div>
            </div>
          )}
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase text-gray-500">Input</h3>
            <Json value={selected.input} />
          </div>
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase text-gray-500">Output</h3>
            <Json value={selected.output} />
          </div>
        </section>
      )}
    </div>
  );
}
