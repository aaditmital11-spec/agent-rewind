"use client";

import Button from "./Button.tsx";

// Says what failed and offers a retry. Used by error.tsx files and failed fetches.
export default function ErrorState({
  title,
  message,
  onRetry,
  retrying = false,
}: {
  title: string;
  message?: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  return (
    <div role="alert" className="rounded-md border border-danger/40 bg-danger/5 p-4">
      <p className="text-sm font-medium text-danger">{title}</p>
      {message && <p className="mt-1 font-mono text-xs break-words text-muted">{message}</p>}
      {onRetry && (
        <Button size="sm" className="mt-3" onClick={onRetry} loading={retrying}>
          Retry
        </Button>
      )}
    </div>
  );
}
