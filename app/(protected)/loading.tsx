export default function Loading() {
  return <Skeleton />;
}

export function Skeleton() {
  return (
    <div className="animate-pulse space-y-8">
      {/* Page header */}
      <div className="space-y-2">
        <div className="bg-muted h-7 w-48 rounded-lg" />
        <div className="bg-muted h-4 w-72 rounded-md" />
      </div>

      {/* Stats / summary row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card space-y-3 rounded-xl border p-5">
            <div className="flex items-center justify-between">
              <div className="bg-muted h-4 w-24 rounded-md" />
              <div className="bg-muted h-8 w-8 rounded-lg" />
            </div>
            <div className="bg-muted h-6 w-16 rounded-md" />
            <div className="bg-muted h-3 w-32 rounded-md" />
          </div>
        ))}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card overflow-hidden rounded-xl border">
            <div className="bg-muted aspect-video" />
            <div className="space-y-2 p-4">
              <div className="bg-muted h-4 w-3/4 rounded-md" />
              <div className="bg-muted h-3 w-1/2 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
