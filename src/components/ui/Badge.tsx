import type { ReactNode } from "react";

type Tone = "neutral" | "success" | "danger" | "warning" | "llm" | "tool" | "retrieval";

// Faint tint behind colored text. Full class names so Tailwind can find them.
const TONES: Record<Tone, string> = {
  neutral: "bg-subtle text-muted",
  success: "bg-success/10 text-success",
  danger: "bg-danger/10 text-danger",
  warning: "bg-warning/10 text-warning",
  llm: "bg-llm/12 text-llm",
  tool: "bg-tool/12 text-tool",
  retrieval: "bg-retrieval/12 text-retrieval",
};

export default function Badge({
  tone = "neutral",
  mono = false,
  children,
}: {
  tone?: Tone;
  mono?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex h-5 shrink-0 items-center rounded px-1.5 text-xs font-medium ${mono ? "font-mono" : ""} ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

const STATUS_TONES: Record<string, Tone> = { success: "success", failed: "danger", running: "warning" };

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONES[status] ?? "neutral"}>{status}</Badge>;
}

// llm, tool, and retrieval each have their own muted color.
export function TypeBadge({ type }: { type: string }) {
  const tone = type === "llm" || type === "tool" || type === "retrieval" ? type : "neutral";
  return (
    <Badge tone={tone} mono>
      {type}
    </Badge>
  );
}
