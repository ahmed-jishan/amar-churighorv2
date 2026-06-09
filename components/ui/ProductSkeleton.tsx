export default function ProductSkeleton() {
  return (
    <div className="animate-pulse bg-white dark:bg-gray-900/60 rounded-xl border border-[#1f3334] overflow-hidden">
      <div className="bg-gray-200 dark:bg-gray-700 aspect-[4/3] w-full" />
      <div className="p-3 space-y-2">
        <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
        <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        <div className="flex gap-1.5 pt-1">
          <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded-lg flex-1" />
          <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded-lg w-14" />
        </div>
      </div>
    </div>
  );
}
