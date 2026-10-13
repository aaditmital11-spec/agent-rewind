import Skeleton from "@/components/ui/Skeleton.tsx";

// Shown while a run loads: header, timeline rows, and the step detail pane, in gray.
export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading run">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid gap-4 md:h-[calc(100dvh-13rem)] md:min-h-[28rem] md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="rounded-md border border-line bg-surface">
          <div className="h-9 border-b border-line" />
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="flex h-9 items-center gap-2 px-3">
              <Skeleton className="h-3 w-4" />
              <Skeleton className="h-5 w-14" />
              <Skeleton className="h-3 flex-1" />
              <Skeleton className="h-1.5 w-16" />
            </div>
          ))}
        </div>
        <div className="space-y-3 rounded-md border border-line bg-surface p-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-64" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  );
}
