import Skeleton from "@/components/ui/Skeleton.tsx";

// Shown while the runs list loads: the same shapes as the real page, in gray.
export default function Loading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading runs">
      <div className="space-y-2.5">
        <div className="flex gap-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="flex gap-1.5">
          {[88, 136, 112, 144, 120].map((w) => (
            <Skeleton key={w} className="h-7" style={{ width: w }} />
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <div className="rounded-md border border-line bg-surface">
          <div className="h-8 border-b border-line" />
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex h-9 items-center gap-3 border-b border-line px-3 last:border-0">
              <Skeleton className="size-2 rounded-full" />
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-3 flex-1" style={{ maxWidth: `${60 - (i % 3) * 12}%` }} />
              <Skeleton className="ml-auto h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
