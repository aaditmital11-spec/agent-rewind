"use client";

import type { KeyboardEvent } from "react";

type Tab = { id: string; label: string };

// A row of tabs. Left and right arrows move between them, like native tab controls.
// The parent renders the panel with role="tabpanel" and id `${idPrefix}-panel`.
export default function Tabs({
  tabs,
  value,
  onChange,
  idPrefix,
  label,
}: {
  tabs: Tab[];
  value: string;
  onChange: (id: string) => void;
  idPrefix: string;
  label: string;
}) {
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const i = tabs.findIndex((t) => t.id === value);
    const next = tabs[(i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
    onChange(next.id);
    document.getElementById(`${idPrefix}-tab-${next.id}`)?.focus();
  }

  return (
    <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className="flex gap-4 border-b border-line">
      {tabs.map((t) => {
        const selected = t.id === value;
        return (
          <button
            key={t.id}
            id={`${idPrefix}-tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t.id)}
            className={`-mb-px h-8 border-b-2 text-sm ${
              selected ? "border-accent font-medium text-fg" : "border-transparent text-muted hover:text-fg"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
