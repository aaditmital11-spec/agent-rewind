// A gray placeholder block shown while data loads. Size it with className.
export default function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`rounded bg-subtle motion-safe:animate-pulse ${className}`} />;
}
