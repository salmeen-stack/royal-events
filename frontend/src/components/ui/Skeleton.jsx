import { cn } from "../../utils/helpers";

const Skeleton = ({ className = "", variant = "default", ...props }) => {
  const variantStyles = {
    default: "bg-gray-200",
    primary: "bg-indigo-200",
    success: "bg-emerald-200",
    warning: "bg-amber-200",
    danger: "bg-red-200",
  };

  return (
    <div
      className={cn(
        "animate-pulse rounded-md",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
};

const SkeletonCard = ({ className = "" }) => {
  return (
    <div className={cn("bg-white rounded-2xl border border-gray-200 p-6", className)}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-12 w-12 rounded-2xl" />
      </div>
      <Skeleton className="h-2 w-full mb-2" />
      <Skeleton className="h-2 w-2/3" />
    </div>
  );
};

const SkeletonStat = ({ className = "" }) => {
  return (
    <div className={cn("bg-white rounded-2xl border border-gray-200 p-6", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Skeleton className="h-4 w-1/3 mb-3" />
          <Skeleton className="h-8 w-1/2 mb-2" />
          <Skeleton className="h-3 w-1/4" />
        </div>
        <Skeleton className="h-14 w-14 rounded-2xl" />
      </div>
    </div>
  );
};

const SkeletonTable = ({ rows = 5, className = "" }) => {
  return (
    <div className={cn("bg-white rounded-2xl border border-gray-200 overflow-hidden", className)}>
      <div className="p-6 border-b border-gray-100">
        <Skeleton className="h-6 w-1/3 mb-2" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-1/4 mb-2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-6 w-16 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
};

const SkeletonList = ({ items = 3, className = "" }) => {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="flex-1">
            <Skeleton className="h-4 w-1/3 mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      ))}
    </div>
  );
};

Skeleton.Card = SkeletonCard;
Skeleton.Stat = SkeletonStat;
Skeleton.Table = SkeletonTable;
Skeleton.List = SkeletonList;

export default Skeleton;
