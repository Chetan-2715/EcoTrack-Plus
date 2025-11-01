export function ActivityHeatmapSkeleton() {
  return (
    <div className="flex gap-1 overflow-x-auto p-2 bg-muted/20 rounded-lg animate-pulse">
      {Array.from({ length: 12 }).map((_, weekIndex) => (
        <div key={weekIndex} className="flex flex-col gap-1">
          {Array.from({ length: 7 }).map((_, dayIndex) => (
            <div key={dayIndex} className="h-3 w-3 rounded-sm bg-gray-300 dark:bg-gray-700" />
          ))}
        </div>
      ))}
    </div>
  );
}