/**
 * SkeletonLoader - Loading state components for forms and UI elements
 * Provides visual feedback during data fetching and lazy loading
 */

interface SkeletonProps {
  className?: string;
}

// Base shimmer block — dark-mode compatible
function Sk({ className = '' }: SkeletonProps) {
  return <div className={`rounded bg-gray-100 dark:bg-white/[0.06] animate-pulse ${className}`} />;
}

export function SkeletonIntegrationCard() {
  return (
    <div className="bg-white dark:bg-[#2F2F2F] border border-gray-200 dark:border-white/10 rounded-lg p-4">
      <Sk className="w-10 h-10 rounded-lg mb-3" />
      <Sk className="h-3.5 w-24 mb-2" />
      <Sk className="h-2.5 w-16 mb-3" />
      <Sk className="h-7 w-full" />
    </div>
  );
}

export function SkeletonAutomationRow() {
  return (
    <tr className="border-b border-gray-100 dark:border-white/5">
      <td className="px-4 py-3"><Sk className="h-6 w-10 rounded-full" /></td>
      <td className="px-4 py-3"><Sk className="h-4 w-40" /></td>
      <td className="px-4 py-3 hidden md:table-cell"><Sk className="h-4 w-24" /></td>
      <td className="px-4 py-3 hidden md:table-cell"><Sk className="h-4 w-16" /></td>
      <td className="px-4 py-3 hidden md:table-cell"><Sk className="h-4 w-16" /></td>
      <td className="px-4 py-3"><Sk className="h-7 w-14 ml-auto" /></td>
    </tr>
  );
}

export function SkeletonAgentRow() {
  return (
    <div className="grid grid-cols-8 gap-2 px-4 py-3 border-b border-gray-100 dark:border-white/5 animate-pulse">
      <div className="col-span-5 flex items-center gap-3">
        <Sk className="h-9 w-9 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Sk className="h-3.5 w-36" />
          <Sk className="h-2.5 w-24" />
        </div>
      </div>
      <div className="col-span-1 flex items-center justify-center"><Sk className="h-4 w-8" /></div>
      <div className="col-span-2 flex items-center justify-end"><Sk className="h-4 w-20" /></div>
    </div>
  );
}

export function SkeletonSavedListingRow() {
  return (
    <tr className="border-b border-gray-100 dark:border-white/5 animate-pulse">
      <td className="px-4 py-3"><Sk className="h-4 w-48" /></td>
      <td className="px-4 py-3"><Sk className="h-4 w-24" /></td>
      <td className="px-4 py-3"><Sk className="h-4 w-20" /></td>
      <td className="px-4 py-3"><Sk className="h-4 w-16" /></td>
      <td className="px-4 py-3"><Sk className="h-5 w-16 rounded-full" /></td>
      <td className="px-4 py-3"><Sk className="h-4 w-24" /></td>
      <td className="px-4 py-3"><Sk className="h-7 w-20 rounded-md" /></td>
    </tr>
  );
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
