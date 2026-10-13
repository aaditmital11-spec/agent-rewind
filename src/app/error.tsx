"use client"; // error boundaries must be Client Components

import ErrorState from "@/components/ui/ErrorState.tsx";

// Shown when a page fails to load, usually because Postgres is not running.
// retry() re-fetches the page from the server.
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="mx-auto max-w-xl py-10">
      <ErrorState
        title="Could not load this page. Check that Postgres is running (docker compose up -d db)."
        message={error.message}
        onRetry={retry}
      />
    </div>
  );
}
