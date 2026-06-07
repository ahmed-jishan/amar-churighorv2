export default function ProductSkeleton() {
  return (
    <div className="animate-pulse bg-white dark:bg-gray-900/60 rounded-2xl border border-[#1f3334] overflow-hidden">
      <div className="bg-gray-200 dark:bg-gray-700 h-56 w-full" />
      <div className="p-5 space-y-3">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        <div className="flex gap-2 pt-1">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl flex-1" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl w-16" />
        </div>
      </div>
    </div>
  );
}
