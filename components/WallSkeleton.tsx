export function WallSkeleton() {
  return (
    <div
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
      aria-busy
      aria-label="Loading wall"
    >
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-[20px] aspect-[3/4] bg-hairline animate-pulse"
        />
      ))}
    </div>
  );
}
