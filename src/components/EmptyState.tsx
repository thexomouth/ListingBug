import { FileText, Inbox, Search, AlertCircle, Plus } from 'lucide-react';
import { Button } from './ui/button';

/**
 * EMPTY STATE COMPONENT
 * 
 * PURPOSE: Display when no data exists or no results found
 * 
 * USAGE SCENARIOS:
 * - No reports created yet
 * - No report history
 * - No search results
 * - No activity to display
 * 
 * DESIGN PATTERN:
 * - Large icon (visual anchor)
 * - Heading (what's missing)
 * - Description (why it's empty / what to do)
 * - Action button (CTA to resolve)
 * 
 * BACKEND INTEGRATION:
 * - Show when API returns empty array: reports.length === 0
 * - Show when search/filter returns no results
 * - Show when user hasn't created any data yet
 */

interface EmptyStateProps {
  variant?: 'no-reports' | 'no-history' | 'no-results' | 'no-activity' | 'generic';
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  variant = 'generic',
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}: EmptyStateProps) {
  
  // VARIANT: No reports created yet
  // USED IN: MyReports page when reports array is empty
  // API CONDITION: GET /api/reports returns { reports: [] }
  if (variant === 'no-reports') {
    return (
      <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
        {/* EmptyState_Icon - Visual indicator */}
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
          <FileText className="w-10 h-10 text-gray-400" />
        </div>
        
        {/* EmptyState_Title - Main message */}
        <h3 className="text-xl font-bold text-[#342e37] mb-2">
          {title || "No Reports Yet"}
        </h3>
        
        {/* EmptyState_Description - Explanation and guidance */}
        <p className="text-base text-gray-600 mb-6 max-w-md">
          {description || "You haven't created any reports yet. Create your first report to start tracking real estate listings."}
        </p>
        
        {/* EmptyState_Button_Action - CTA to resolve empty state */}
        {onAction && (
          <Button
            onClick={onAction}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            {actionLabel || "Create Your First Report"}
          </Button>
        )}
      </div>
    );
  }
  
  // VARIANT: No report history
  // USED IN: ReportDetailsModal - History tab when runs array is empty
  // API CONDITION: GET /api/reports/:id/runs returns { runs: [] }
  if (variant === 'no-history') {
    return (
      <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
        {/* EmptyState_Icon - Visual indicator */}
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Inbox className="w-8 h-8 text-gray-400" />
        </div>
        
        {/* EmptyState_Title - Main message */}
        <h3 className="text-lg font-bold text-[#342e37] mb-2">
          {title || "No History Yet"}
        </h3>
        
        {/* EmptyState_Description - Explanation */}
        <p className="text-sm text-gray-600 max-w-sm">
          {description || "This report hasn't been run yet. Automated reports will appear here after their first scheduled run, or you can run it manually."}
        </p>
        
        {/* EmptyState_Button_Action - Optional action */}
        {onAction && (
          <Button
            onClick={onAction}
            variant="outline"
            size="sm"
            className="mt-4"
          >
            {actionLabel || "Run Report Now"}
          </Button>
        )}
      </div>
    );
  }
  
  // VARIANT: No search results
  // USED IN: Search/filter scenarios when no matches found
  // API CONDITION: GET /api/reports?search=query returns { reports: [] }
  if (variant === 'no-results') {
    return (
      <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
        {/* EmptyState_Icon - Visual indicator */}
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Search className="w-8 h-8 text-gray-400" />
        </div>
        
        {/* EmptyState_Title - Main message */}
        <h3 className="text-lg font-bold text-[#342e37] mb-2">
          {title || "No Results Found"}
        </h3>
        
        {/* EmptyState_Description - Explanation */}
        <p className="text-sm text-gray-600 max-w-sm">
          {description || "This search hasn't been run yet. Automated searches will appear here after their first scheduled run, or you can run it manually."}
        </p>
        
        {/* EmptyState_Button_Action - Optional action */}
        {onAction && (
          <Button
            onClick={onAction}
            variant="outline"
            size="sm"
            className="mt-4"
          >
            {actionLabel || "Run Search Now"}
          </Button>
        )}
      </div>
    );
  }
  
  // VARIANT: No activity
  // USED IN: Dashboard activity feed when activities array is empty
  // API CONDITION: GET /api/activity/recent returns { activities: [] }
  if (variant === 'no-activity') {
    return (
      <div className={`flex flex-col items-center justify-center py-8 px-4 text-center ${className}`}>
        {/* EmptyState_Icon - Visual indicator */}
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <Inbox className="w-6 h-6 text-gray-400" />
        </div>
        
        {/* EmptyState_Title - Main message */}
        <h4 className="text-base font-bold text-[#342e37] mb-1">
          {title || "No Recent Activity"}
        </h4>
        
        {/* EmptyState_Description - Explanation */}
        <p className="text-xs text-gray-600 max-w-xs">
          {description || "Your recent activity will appear here."}
        </p>
      </div>
    );
  }
  
  // VARIANT: Generic empty state (customizable)
  // USED IN: Any custom scenario with provided props
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      {/* EmptyState_Icon - Visual indicator */}
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-gray-400" />
      </div>
      
      {/* EmptyState_Title - Main message */}
      {title && (
        <h3 className="text-lg font-bold text-[#342e37] mb-2">
          {title}
        </h3>
      )}
      
      {/* EmptyState_Description - Explanation */}
      {description && (
        <p className="text-sm text-gray-600 max-w-sm mb-4">
          {description}
        </p>
      )}
      
      {/* EmptyState_Button_Action - Optional action */}
      {onAction && actionLabel && (
        <Button
          onClick={onAction}
          variant="outline"
          size="sm"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

/**
 * USAGE EXAMPLES:
 * 
 * // In MyReports page
 * {reports.length === 0 && (
 *   <EmptyState 
 *     variant="no-reports"
 *     onAction={() => navigate('new-report')}
 *   />
 * )}
 * 
 * // In ReportDetailsModal - History tab
 * {runs.length === 0 && (
 *   <EmptyState 
 *     variant="no-history"
 *     onAction={handleRunReport}
 *     actionLabel="Run Report Now"
 *   />
 * )}
 * 
 * // In Dashboard activity section
 * {activities.length === 0 && (
 *   <EmptyState variant="no-activity" />
 * )}
 * 
 * // Custom empty state
 * <EmptyState
 *   variant="generic"
 *   title="No Data Available"
 *   description="There's nothing to show right now."
 *   actionLabel="Refresh"
 *   onAction={handleRefresh}
 * />
 */

/**
 * BACKEND INTEGRATION NOTES:
 * 
 * When to show EmptyState:
 * 
 * 1. API returns empty array:
 *    if (response.reports.length === 0) {
 *      return <EmptyState variant="no-reports" />
 *    }
 * 
 * 2. After filtering/searching:
 *    if (filteredReports.length === 0 && searchQuery) {
 *      return <EmptyState variant="no-results" />
 *    }
 * 
 * 3. New user with no data:
 *    if (response.reports.length === 0 && isNewUser) {
 *      return <EmptyState variant="no-reports" />
 *    }
 * 
 * 4. Success response but empty data:
 *    if (response.success && response.activities.length === 0) {
 *      return <EmptyState variant="no-activity" />
 *    }
 */