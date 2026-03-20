/**
 * SkeletonLoader - Loading state components for forms and UI elements
 * Provides visual feedback during data fetching and lazy loading
 */

interface SkeletonProps {
  className?: string;
}

export function SkeletonInput({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
      <div className="h-10 bg-gray-200 rounded w-full"></div>
    </div>
  );
}

export function SkeletonButton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="h-11 bg-gray-200 rounded w-full"></div>
    </div>
  );
}

export function SkeletonCard({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse border border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="space-y-3">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}

export function LoginFormSkeleton() {
  return (
    <div className="max-w-md md:max-w-lg mx-auto w-full">
      <div className="border border-gray-200 rounded-lg shadow-sm">
        <div className="p-6 space-y-4 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-4 bg-gray-200 rounded w-64"></div>
          
          <div className="space-y-3 pt-4">
            <SkeletonButton />
            <SkeletonButton />
            <SkeletonButton />
          </div>
          
          <div className="py-4">
            <div className="h-px bg-gray-200"></div>
          </div>
          
          <SkeletonInput />
          <SkeletonInput />
          <SkeletonButton />
        </div>
      </div>
    </div>
  );
}
