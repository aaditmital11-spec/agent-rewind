import Link from "next/link";

// Shown for unknown URLs and for runs that do not exist.
export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl space-y-2 py-10">
      <h1 className="text-sm font-medium">Not found</h1>
      <p className="text-sm text-muted">
        No run or page exists at this address. Runs are removed when the database is reset.
      </p>
      <Link href="/" className="inline-block text-sm text-accent hover:underline">
        Back to all runs
      </Link>
    </div>
  );
}
