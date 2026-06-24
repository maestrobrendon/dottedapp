export function EventListSkeleton() {
  return (
    <div className="space-y-3" aria-busy aria-label="Loading events">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="bg-surface rounded-md p-4 shadow-[0_8px_30px_rgba(0,0,0,0.05)] flex items-center gap-3 animate-pulse"
        >
          <div className="w-2 h-2 rounded-full bg-hairline shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-hairline rounded w-1/3" />
            <div className="h-3 bg-hairline rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
