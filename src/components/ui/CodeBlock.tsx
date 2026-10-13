"use client";

import { useState, type ReactNode } from "react";

// Matches one JSON token: a string (and the colon after it if it is a key), a literal, or a number.
const TOKEN = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;

// Wraps each JSON token in a colored span. Everything between tokens (braces, commas, spaces) stays plain.
function highlight(json: string) {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const m of json.matchAll(TOKEN)) {
    parts.push(json.slice(last, m.index));
    let color = "text-syn-number";
    if (m[1] && m[2]) color = "text-syn-key";
    else if (m[1]) color = "text-syn-string";
    else if (m[3]) color = "text-syn-literal";
    parts.push(
      <span key={m.index} className={color}>
        {m[1] ?? m[0]}
      </span>
    );
    if (m[2]) parts.push(m[2]);
    last = m.index + m[0].length;
  }
  parts.push(json.slice(last));
  return parts;
}

// JSON in a wrapped monospace block with a copy button.
export default function CodeBlock({ value }: { value: unknown }) {
  const json = JSON.stringify(value, null, 2) ?? "undefined";
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="relative rounded border border-line bg-subtle">
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Copied" : "Copy JSON"}
        className="absolute top-1.5 right-1.5 flex h-6 items-center gap-1 rounded border border-line bg-surface px-1.5 text-xs text-muted hover:text-fg"
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
        {copied ? "Copied" : "Copy"}
      </button>
      <pre className="overflow-x-auto p-3 pr-20 font-mono text-xs leading-5 break-words whitespace-pre-wrap text-fg">
        {highlight(json)}
      </pre>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="5.5" y="5.5" width="8" height="8" rx="1" />
      <path d="M10.5 3.5v-1a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M3 8.5l3 3 7-7" />
    </svg>
  );
}
