// Small display helpers shared by server and client components.

export function formatDuration(ms: number | null) {
  if (ms === null) return "";
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;
}

// "just now", "3m ago", "2h ago", "5d ago". Older than 30 days shows the date.
export function timeAgo(date: Date, now = new Date()) {
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString("en-CA", { dateStyle: "medium" });
}

export function formatDateTime(date: Date) {
  return date.toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" });
}
