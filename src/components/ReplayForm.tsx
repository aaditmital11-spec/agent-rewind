"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MODELS } from "@/lib/models.ts";
import type { RecordedStep } from "@/lib/recorder.ts";
import Button from "./ui/Button.tsx";
import ErrorState from "./ui/ErrorState.tsx";

// "Replay from this step": a button that opens a side drawer where you edit this step's input
// as JSON, optionally pick a model, and start a replay. Uses the native <dialog> element,
// which handles focus and closes on Esc.
export default function ReplayForm({ runId, step }: { runId: number; step: RecordedStep }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const original = JSON.stringify(step.input, null, 2);
  const [text, setText] = useState(original);
  const [model, setModel] = useState("");
  const [running, setRunning] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function open() {
    setText(original);
    setJsonError(null);
    setError(null);
    dialogRef.current?.showModal();
  }

  async function submit() {
    let newInput;
    try {
      newInput = JSON.parse(text);
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : "Input is not valid JSON");
      return;
    }
    setJsonError(null);
    setRunning(true);
    setError(null);
    try {
      const res = await fetch(`/api/runs/${runId}/replay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromSeq: step.seq, newInput, model: model || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Replay failed with status ${res.status}`);
      // Stay in the loading state until the new run's page replaces this one.
      router.push(`/runs/${data.runId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setRunning(false);
    }
  }

  return (
    <>
      <Button variant="primary" size="sm" onClick={open}>
        Replay from this step
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby="replay-title"
        // Esc closes the drawer, except while a replay is in flight.
        onCancel={(e) => running && e.preventDefault()}
        className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-full max-w-xl border-l border-line bg-surface p-0 text-fg shadow-xl backdrop:bg-black/40"
      >
        <form
          className="flex h-full flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-line px-4">
            <h2 id="replay-title" className="text-sm font-medium">
              Replay from step <span className="font-mono">{step.seq}</span>
            </h2>
            <Button
              variant="ghost"
              size="sm"
              disabled={running}
              onClick={() => dialogRef.current?.close()}
            >
              Close
            </Button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
            <p className="text-sm leading-relaxed text-muted">
              {step.seq > 1 ? (
                <>
                  Steps 1 to {step.seq - 1} are served from this run&apos;s recorded outputs and make no API calls.{" "}
                </>
              ) : null}
              Step {step.seq} (<span className="font-mono text-fg">{step.name}</span>) runs live with the input below,
              and every step after it runs live too. The replay is saved as a new run.
            </p>

            <div className="flex min-h-64 flex-1 flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="replay-input" className="text-sm font-medium">
                  Input
                </label>
                <button
                  type="button"
                  onClick={() => setText(original)}
                  disabled={running || text === original}
                  className="text-xs text-muted hover:text-fg disabled:opacity-50"
                >
                  Reset to recorded input
                </button>
              </div>
              <textarea
                id="replay-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                spellCheck={false}
                disabled={running}
                aria-invalid={jsonError !== null}
                aria-describedby={jsonError ? "replay-json-error" : undefined}
                className="min-h-0 flex-1 resize-none rounded border border-line bg-subtle p-3 font-mono text-xs leading-5 focus-visible:border-accent focus-visible:outline-none disabled:opacity-60"
              />
              {jsonError && (
                <p id="replay-json-error" className="font-mono text-xs text-danger">
                  Invalid JSON: {jsonError}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="replay-model" className="text-sm font-medium">
                Model for live LLM calls
              </label>
              <select
                id="replay-model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={running}
                className="h-8 rounded border border-line bg-surface px-2 font-mono text-xs focus-visible:border-accent focus-visible:outline-none"
              >
                <option value="">Same as original</option>
                {MODELS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {running && (
              <p role="status" className="text-sm text-muted">
                Replaying. The new run opens when the agent finishes.
              </p>
            )}
            {error && <ErrorState title="Replay failed" message={error} onRetry={submit} />}
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-line px-4 py-3">
            <Button disabled={running} onClick={() => dialogRef.current?.close()}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={running}>
              Replay
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
