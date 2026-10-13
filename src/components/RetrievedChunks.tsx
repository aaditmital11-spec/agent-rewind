"use client";

import { useState } from "react";

export type Chunk = { id: number; source: string; content: string; similarity: number };

// Retrieval output as a ranked list: rank, source file, similarity score, and the chunk text.
export default function RetrievedChunks({ chunks }: { chunks: Chunk[] }) {
  if (chunks.length === 0) {
    return <p className="text-sm text-muted">No chunks were retrieved.</p>;
  }
  return (
    <ol className="divide-y divide-line rounded border border-line">
      {chunks.map((c, i) => (
        <ChunkRow key={c.id} rank={i + 1} chunk={c} />
      ))}
    </ol>
  );
}

function ChunkRow({ rank, chunk }: { rank: number; chunk: Chunk }) {
  const [expanded, setExpanded] = useState(false);
  // Only offer "Show all" when the text is likely longer than the three clamped lines.
  const long = chunk.content.length > 280 || chunk.content.split("\n").length > 3;

  return (
    <li className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-2 px-3 py-2.5">
      <span className="pt-px text-right font-mono text-xs text-muted tabular-nums">{rank}</span>
      <div className="min-w-0 space-y-1.5">
        <div className="flex items-center gap-3">
          <span className="min-w-0 flex-1 truncate font-mono text-xs font-medium" title={chunk.source}>
            {chunk.source}
          </span>
          {/* Bar width shows the score, 0 to 1 */}
          <span className="h-1.5 w-20 shrink-0 rounded-sm bg-subtle" aria-hidden="true">
            <span
              className="block h-full rounded-sm bg-retrieval/70"
              style={{ width: `${Math.min(1, Math.max(0, chunk.similarity)) * 100}%` }}
            />
          </span>
          <span className="w-12 shrink-0 text-right font-mono text-xs tabular-nums" title="Cosine similarity">
            {chunk.similarity.toFixed(3)}
          </span>
        </div>
        <p className={`text-sm leading-relaxed whitespace-pre-wrap text-fg ${expanded ? "" : "line-clamp-3"}`}>
          {chunk.content}
        </p>
        {long && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            className="text-xs text-muted hover:text-fg"
          >
            {expanded ? "Show less" : "Show all"}
          </button>
        )}
      </div>
    </li>
  );
}
