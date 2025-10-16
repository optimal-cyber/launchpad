export function SkeletonTile({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`}>
      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-300 rounded w-1/2"></div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 rounded-t-lg p-4">
        <div className="h-4 bg-gray-300 rounded w-1/4"></div>
      </div>
      <div className="bg-white border border-gray-200 rounded-b-lg">
        {[...Array(rows)].map((_, rowIndex) => (
          <div key={rowIndex} className="border-b border-gray-200 last:border-b-0">
            <div className="p-4">
              <div className="flex space-x-4">
                {[...Array(columns)].map((_, colIndex) => (
                  <div key={colIndex} className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonRow({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
    </div>
  );
}

export function SkeletonDrawer({ className = '' }: { className?: string }) {
  return (
    <div className={`drawer-content ${className}`}>
      <div className="drawer-header">
        <div className="skeleton h-8 w-64 mb-3"></div>
        <div className="skeleton h-6 w-96"></div>
      </div>
      <div className="drawer-body">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="skeleton h-6 w-32 mb-4"></div>
            <div className="skeleton h-4 w-full mb-2"></div>
            <div className="skeleton h-4 w-3/4"></div>
          </div>
          <div className="space-y-6">
            <div className="skeleton h-6 w-32 mb-4"></div>
            <div className="skeleton h-4 w-full mb-2"></div>
            <div className="skeleton h-4 w-3/4"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonKPIGrid({ count = 4, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${count} gap-8 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonTile key={i} />
      ))}
    </div>
  );
}

export function SkeletonServiceCard({ className = '' }: { className?: string }) {
  return (
    <div className={`card p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="skeleton h-6 w-32"></div>
        <div className="skeleton h-6 w-20"></div>
      </div>
      <div className="skeleton h-4 w-full mb-3"></div>
      <div className="flex items-center justify-between">
        <div className="skeleton h-4 w-24"></div>
        <div className="skeleton h-8 w-20"></div>
      </div>
    </div>
  );
}

