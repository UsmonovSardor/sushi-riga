export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-surface">
      <div className="skeleton aspect-[5/4] w-full" />
      <div className="space-y-2 p-3">
        <div className="skeleton h-3.5 w-4/5 rounded" />
        <div className="skeleton h-3 w-full rounded" />
        <div className="mt-3 flex items-center justify-between">
          <div className="skeleton h-4 w-14 rounded" />
          <div className="skeleton h-9 w-9 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function GridSkeleton({ n = 6 }: { n?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: n }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
