import type { CSSProperties } from "react";

// A gray placeholder block shown while data loads. Size it with className or style.
export default function Skeleton({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return <div aria-hidden="true" style={style} className={`rounded bg-subtle motion-safe:animate-pulse ${className}`} />;
}
