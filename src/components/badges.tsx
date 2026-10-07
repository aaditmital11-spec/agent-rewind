const STATUS_COLORS: Record<string, string> = {
  success: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  running: "bg-gray-200 text-gray-700",
};

const TYPE_COLORS: Record<string, string> = {
  llm: "bg-purple-100 text-purple-800",
  tool: "bg-blue-100 text-blue-800",
  retrieval: "bg-amber-100 text-amber-800",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status] ?? ""}`}>
      {status}
    </span>
  );
}

export function TypeBadge({ type }: { type: string }) {
  return (
    <span className={`rounded px-1.5 py-0.5 font-mono text-xs ${TYPE_COLORS[type] ?? ""}`}>
      {type}
    </span>
  );
}

export function formatDuration(ms: number | null) {
  if (ms === null) return "";
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;
}
