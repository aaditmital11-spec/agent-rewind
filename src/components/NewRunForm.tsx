"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "./ui/Button.tsx";
import ErrorState from "./ui/ErrorState.tsx";

// Short labels for the demo questions, named by what each one shows. Unknown questions show as-is.
const DEMO_LABELS: Record<string, string> = {
  "What is (17 * 23) + 4?": "Calculator",
  "What's the weather in Tokyo, in Fahrenheit?": "Weather in Fahrenheit",
  "Is it warmer in Paris or London right now?": "Two tool calls",
  "What's the weather in Atlantis?": "Unknown city failure",
  "How much is 12 stone in kilograms?": "Unsupported unit",
  "Is 30 degrees hot?": "Vague question",
  "How much does Nimbus Pro cost per year for 4 users?": "Docs, then calculator",
  "Can I get a refund on a Nimbus annual plan after 3 weeks?": "Docs lookup",
  "What is the API rate limit on the Nimbus Pro plan?": "Wrong chunk retrieved",
};

// Starts a run through the API, then opens it. The request waits for the agent to finish.
export default function NewRunForm({ demoQuestions }: { demoQuestions: string[] }) {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [running, setRunning] = useState<string | null>(null); // the question being run
  const [error, setError] = useState<{ question: string; message: string } | null>(null);

  async function start(q: string) {
    if (!q.trim() || running) return;
    setRunning(q);
    setError(null);
    try {
      const res = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Request failed with status ${res.status}`);
      router.push(`/runs/${data.runId}`);
    } catch (err) {
      setError({ question: q, message: err instanceof Error ? err.message : String(err) });
      setRunning(null);
    }
  }

  return (
    <section aria-label="Start a run" className="space-y-2.5">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          start(question);
        }}
      >
        <label htmlFor="question" className="sr-only">
          Question for the agent
        </label>
        <input
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask the agent a question"
          disabled={running !== null}
          className="h-8 min-w-0 flex-1 rounded border border-line bg-surface px-2.5 text-sm placeholder:text-muted focus-visible:border-accent focus-visible:outline-none disabled:opacity-60"
        />
        <Button type="submit" variant="primary" loading={running === question} disabled={running !== null || !question.trim()}>
          Start run
        </Button>
      </form>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs text-muted">Try a demo:</span>
        {demoQuestions.map((q) => (
          <Button
            key={q}
            size="sm"
            title={q}
            onClick={() => start(q)}
            loading={running === q}
            disabled={running !== null}
          >
            {DEMO_LABELS[q] ?? q}
          </Button>
        ))}
      </div>

      {running && <p className="text-xs text-muted">Running the agent. This takes a few seconds.</p>}
      {error && (
        <ErrorState title="Could not start the run" message={error.message} onRetry={() => start(error.question)} />
      )}
    </section>
  );
}
