import { Loader2 } from 'lucide-react';

/**
 * LOADING STATE COMPONENT
 * 
 * PURPOSE: Display loading indicator while fetching data from backend
 * 
 * USAGE SCENARIOS:
 * - Dashboard metrics loading
 * - Report list loading
 * - Report history loading
 * - Any async data fetch
 * 
 * VARIANTS:
 * - inline: Small loader for inline use
 * - card: Loader inside a card
 * - fullpage: Full page loading screen
 * - skeleton: Placeholder shapes (future enhancement)
 */

interface LoadingStateProps {
  variant?: 'inline' | 'card' | 'fullpage';
  message?: string;
  className?: string;
}

export function LoadingState({ 
  variant = 'card', 
  message = 'Loading...',
  className = '' 
}: LoadingStateProps) {
  
  // VARIANT: Inline loader (small, for buttons or inline sections)
  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {/* LoadingState_Icon_Spinner - Animated rotating icon */}
        <Loader2 className="w-4 h-4 text-[#342e37] animate-spin" />
        {/* LoadingState_Text_Message - Loading message */}
        {message && (
          <span className="text-sm text-gray-600">{message}</span>
        )}
      </div>
    );
  }
  
  // VARIANT: Full page loader (for page-level loading)
  if (variant === 'fullpage') {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[60vh] ${className}`}>
        {/* LoadingState_Icon_Spinner - Animated rotating icon */}
        <Loader2 className="w-12 h-12 text-[#342e37] animate-spin mb-4" />
        {/* LoadingState_Text_Message - Loading message */}
        {message && (
          <p className="text-lg text-gray-600">{message}</p>
        )}
      </div>
    );
  }
  
  // VARIANT: Card loader (default, for card sections)
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      {/* LoadingState_Icon_Spinner - Animated rotating icon */}
      <Loader2 className="w-8 h-8 text-[#342e37] animate-spin mb-3" />
      {/* LoadingState_Text_Message - Loading message */}
      {message && (
        <p className="text-base text-gray-600">{message}</p>
      )}
    </div>
  );
}

/**
 * SKELETON LOADER COMPONENT
 * 
 * PURPOSE: Placeholder UI that mimics content structure while loading
 * 
 * USAGE: Report cards, metric cards, table rows
 * 
 * BENEFITS:
 * - Better UX than spinner alone
 * - Shows expected layout
 * - Reduces perceived loading time
 */

interface SkeletonProps {
  type?: 'text' | 'card' | 'metric' | 'table-row';
  count?: number;
  className?: string;
}

export function Skeleton({ type = 'text', count = 1, className = '' }: SkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);
  
  // TEXT SKELETON: Single or multiple lines
  if (type === 'text') {
    return (
      <>
        {items.map((i) => (
          <div
            key={i}
            className={`h-4 bg-gray-200 rounded animate-pulse mb-2 ${className}`}
            style={{ width: `${Math.random() * 30 + 70}%` }}
          />
        ))}
      </>
    );
  }
  
  // CARD SKELETON: Report card placeholder
  if (type === 'card') {
    return (
      <>
        {items.map((i) => (
          <div
            key={i}
            className={`border rounded-lg p-4 mb-3 ${className}`}
          >
            {/* Skeleton_Card_Title */}
            <div className="h-5 bg-gray-200 rounded animate-pulse mb-3 w-3/4" />
            {/* Skeleton_Card_Content */}
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3" />
            </div>
          </div>
        ))}
      </>
    );
  }
  
  // METRIC SKELETON: Dashboard metric card placeholder
  if (type === 'metric') {
    return (
      <>
        {items.map((i) => (
          <div
            key={i}
            className={`border rounded-lg p-6 ${className}`}
          >
            {/* Skeleton_Metric_Icon */}
            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse mb-4" />
            {/* Skeleton_Metric_Value */}
            <div className="h-8 bg-gray-200 rounded animate-pulse mb-2 w-1/2" />
            {/* Skeleton_Metric_Label */}
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
          </div>
        ))}
      </>
    );
  }
  
  // TABLE ROW SKELETON: Table row placeholder
  if (type === 'table-row') {
    return (
      <>
        {items.map((i) => (
          <tr key={i}>
            <td className="py-3 px-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
            </td>
            <td className="py-3 px-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
            </td>
            <td className="py-3 px-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
            </td>
          </tr>
        ))}
      </>
    );
  }
  
  return null;
}

/**
 * USAGE EXAMPLES:
 * 
 * // Inline loading in a button
 * <LoadingState variant="inline" message="Saving..." />
 * 
 * // Card section loading
 * <LoadingState variant="card" message="Loading reports..." />
 * 
 * // Full page loading
 * <LoadingState variant="fullpage" message="Loading dashboard..." />
 * 
 * // Skeleton for report cards
 * <Skeleton type="card" count={3} />
 * 
 * // Skeleton for metrics
 * <Skeleton type="metric" count={4} />
 */