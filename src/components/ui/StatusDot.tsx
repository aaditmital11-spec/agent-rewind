const COLORS: Record<string, string> = {
  success: "bg-success",
  failed: "bg-danger",
  running: "bg-warning motion-safe:animate-pulse",
};

// A small colored dot. The status is also written out for screen readers.
export default function StatusDot({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center" title={status}>
      <span className={`size-2 rounded-full ${COLORS[status] ?? "bg-muted"}`} aria-hidden="true" />
      <span className="sr-only">{status}</span>
    </span>
  );
}
