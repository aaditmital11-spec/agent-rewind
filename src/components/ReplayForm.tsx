"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MODELS } from "@/lib/models.ts";
import type { RecordedStep } from "@/lib/recorder.ts";

// "Edit and replay from here": edit this step's input as JSON, then start a replay from it.
export default function ReplayForm({ runId, step }: { runId: number; step: RecordedStep }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(JSON.stringify(step.input, null, 2));
  const [model, setModel] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    let newInput;
    try {
      newInput = JSON.parse(text);
    } catch {
      setError("Input is not valid JSON");
      return;
    }
    setRunning(true);
    setError(null);
    try {
      const res = await fetch(`/api/runs/${runId}/replay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromSeq: step.seq, newInput, model: model || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Replay failed");
      router.push(`/runs/${data.runId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setRunning(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        Edit and replay from here
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded border border-blue-200 bg-blue-50 p-3">
      <p className="text-sm text-gray-700">
        Steps before #{step.seq} reuse their recorded outputs. Step #{step.seq} runs live with
        this input, and everything after it runs live too.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={12}
        spellCheck={false}
        className="w-full rounded border border-gray-300 bg-white p-2 font-mono text-xs focus:border-blue-500 focus:outline-none"
      />
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm text-gray-700">
          Model for live LLM calls{" "}
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="ml-1 rounded border border-gray-300 bg-white px-2 py-1 text-sm"
          >
            <option value="">Same as original</option>
            {MODELS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setOpen(false)}
            disabled={running}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={running}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {running ? "Replaying..." : "Replay"}
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
