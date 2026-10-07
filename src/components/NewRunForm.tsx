"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Starts a run through the API, then opens it. The request waits for the agent to finish.
export default function NewRunForm({ demoQuestions }: { demoQuestions: string[] }) {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start(q: string) {
    if (!q.trim() || running) return;
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      router.push(`/runs/${data.runId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setRunning(false);
    }
  }

  return (
    <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          start(question);
        }}
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask the agent something..."
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={running || !question.trim()}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {running ? "Running..." : "Start run"}
        </button>
      </form>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-500">Demo questions:</span>
        {demoQuestions.map((q) => (
          <button
            key={q}
            onClick={() => start(q)}
            disabled={running}
            className="rounded-full border border-gray-300 px-3 py-1 text-xs hover:bg-gray-100 disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  );
}
