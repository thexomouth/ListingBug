import { AlertCircle, WifiOff, ServerCrash, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';

/**
 * ERROR STATE COMPONENT
 * 
 * PURPOSE: Display when API calls fail or errors occur
 * 
 * USAGE SCENARIOS:
 * - Network errors (fetch failed)
 * - Server errors (500, 503)
 * - Not found errors (404)
 * - Authorization errors (401, 403)
 * - Validation errors (400)
 * - Rate limit errors (429)
 * 
 * DESIGN PATTERN:
 * - Error icon (visual indicator)
 * - Error title (what went wrong)
 * - Error message (details / guidance)
 * - Retry button (attempt to recover)
 * - Secondary action (alternative path)
 * 
 * BACKEND INTEGRATION:
 * - Show when API returns { success: false }
 * - Show on network failures (catch block)
 * - Show on HTTP error status codes
 * - Parse error.message from API response
 */

interface ErrorStateProps {
  variant?: 'network' | 'server' | 'not-found' | 'unauthorized' | 'rate-limit' | 'generic';
  title?: string;
  message?: string;
  errorCode?: string;
  onRetry?: () => void;
  onBack?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  variant = 'generic',
  title,
  message,
  errorCode,
  onRetry,
  onBack,
  retryLabel = 'Try Again',
  className = ''
}: ErrorStateProps) {
  
  // VARIANT: Network error (no connection)
  // USED IN: Catch blocks when fetch() fails
  // CONDITION: Network request fails, no response received
  if (variant === 'network') {
    return (
      <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
        {/* ErrorState_Icon - Network error indicator */}
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
          <WifiOff className="w-10 h-10 text-red-500" />
        </div>
        
        {/* ErrorState_Title - Main error message */}
        <h3 className="text-xl font-bold text-[#342e37] mb-2">
          {title || "Connection Failed"}
        </h3>
        
        {/* ErrorState_Description - Details and guidance */}
        <p className="text-base text-gray-600 mb-6 max-w-md">
          {message || "Unable to connect to the server. Please check your internet connection and try again."}
        </p>
        
        {/* ErrorState_ErrorCode - Technical error reference */}
        {errorCode && (
          <p className="text-xs text-gray-500 mb-4 font-mono">
            Error Code: {errorCode}
          </p>
        )}
        
        {/* ErrorState_Actions - Recovery options */}
        <div className="flex gap-3">
          {onRetry && (
            <Button
              onClick={onRetry}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {retryLabel}
            </Button>
          )}
          {onBack && (
            <Button
              onClick={onBack}
              variant="outline"
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
          )}
        </div>
      </div>
    );
  }
  
  // VARIANT: Server error (500, 503)
  // USED IN: When API returns 5xx status codes
  // API RESPONSE: { success: false, error: { code: "SERVER_ERROR" } }
  if (variant === 'server') {
    return (
      <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
        {/* ErrorState_Icon - Server error indicator */}
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
          <ServerCrash className="w-10 h-10 text-red-500" />
        </div>
        
        {/* ErrorState_Title - Main error message */}
        <h3 className="text-xl font-bold text-[#342e37] mb-2">
          {title || "Server Error"}
        </h3>
        
        {/* ErrorState_Description - Details and guidance */}
        <p className="text-base text-gray-600 mb-6 max-w-md">
          {message || "Something went wrong on our end. Our team has been notified and is working on a fix. Please try again in a few moments."}
        </p>
        
        {/* ErrorState_ErrorCode - Technical error reference */}
        {errorCode && (
          <p className="text-xs text-gray-500 mb-4 font-mono">
            Error Code: {errorCode}
          </p>
        )}
        
        {/* ErrorState_Actions - Recovery options */}
        <div className="flex gap-3">
          {onRetry && (
            <Button
              onClick={onRetry}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {retryLabel}
            </Button>
          )}
          {onBack && (
            <Button
              onClick={onBack}
              variant="outline"
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
          )}
        </div>
      </div>
    );
  }
  
  // VARIANT: Not found error (404)
  // USED IN: When requested resource doesn't exist
  // API RESPONSE: { success: false, error: { code: "NOT_FOUND" } }
  if (variant === 'not-found') {
    return (
      <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
        {/* ErrorState_Icon - Not found indicator */}
        <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-amber-500" />
        </div>
        
        {/* ErrorState_Title - Main error message */}
        <h3 className="text-xl font-bold text-[#342e37] mb-2">
          {title || "Not Found"}
        </h3>
        
        {/* ErrorState_Description - Details and guidance */}
        <p className="text-base text-gray-600 mb-6 max-w-md">
          {message || "The report you're looking for doesn't exist or has been deleted."}
        </p>
        
        {/* ErrorState_Actions - Recovery options */}
        <div className="flex gap-3">
          {onBack && (
            <Button
              onClick={onBack}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              View Search History
            </Button>
          )}
        </div>
      </div>
    );
  }
  
  // VARIANT: Unauthorized error (401, 403)
  // USED IN: When token is invalid or user lacks permission
  // API RESPONSE: { success: false, error: { code: "UNAUTHORIZED" | "FORBIDDEN" } }
  if (variant === 'unauthorized') {
    return (
      <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
        {/* ErrorState_Icon - Unauthorized indicator */}
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        
        {/* ErrorState_Title - Main error message */}
        <h3 className="text-xl font-bold text-[#342e37] mb-2">
          {title || "Access Denied"}
        </h3>
        
        {/* ErrorState_Description - Details and guidance */}
        <p className="text-base text-gray-600 mb-6 max-w-md">
          {message || "You don't have permission to access this resource. Please log in again or contact support."}
        </p>
        
        {/* ErrorState_Actions - Recovery options */}
        <div className="flex gap-3">
          {onRetry && (
            <Button
              onClick={onRetry}
              className="gap-2"
            >
              Log In Again
            </Button>
          )}
          {onBack && (
            <Button
              onClick={onBack}
              variant="outline"
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
          )}
        </div>
      </div>
    );
  }
  
  // VARIANT: Rate limit error (429)
  // USED IN: When user exceeds API rate limits
  // API RESPONSE: { success: false, error: { code: "RATE_LIMIT", retryAfter: 300 } }
  if (variant === 'rate-limit') {
    return (
      <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
        {/* ErrorState_Icon - Rate limit indicator */}
        <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-amber-500" />
        </div>
        
        {/* ErrorState_Title - Main error message */}
        <h3 className="text-xl font-bold text-[#342e37] mb-2">
          {title || "Too Many Requests"}
        </h3>
        
        {/* ErrorState_Description - Details and guidance */}
        <p className="text-base text-gray-600 mb-6 max-w-md">
          {message || "You've made too many requests. Please wait a few minutes and try again."}
        </p>
        
        {/* ErrorState_ErrorCode - Technical error reference */}
        {errorCode && (
          <p className="text-xs text-gray-500 mb-4">
            {errorCode}
          </p>
        )}
        
        {/* ErrorState_Actions - Recovery options */}
        <div className="flex gap-3">
          {onBack && (
            <Button
              onClick={onBack}
              variant="outline"
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
          )}
        </div>
      </div>
    );
  }
  
  // VARIANT: Generic error (customizable)
  // USED IN: Any custom error scenario with provided props
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      {/* ErrorState_Icon - Generic error indicator */}
      <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
        <AlertCircle className="w-10 h-10 text-red-500" />
      </div>
      
      {/* ErrorState_Title - Main error message */}
      <h3 className="text-xl font-bold text-[#342e37] mb-2">
        {title || "Something Went Wrong"}
      </h3>
      
      {/* ErrorState_Description - Details and guidance */}
      <p className="text-base text-gray-600 mb-6 max-w-md">
        {message || "An unexpected error occurred. Please try again or contact support if the problem persists."}
      </p>
      
      {/* ErrorState_ErrorCode - Technical error reference */}
      {errorCode && (
        <p className="text-xs text-gray-500 mb-4 font-mono">
          Error Code: {errorCode}
        </p>
      )}
      
      {/* ErrorState_Actions - Recovery options */}
      <div className="flex gap-3">
        {onRetry && (
          <Button
            onClick={onRetry}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {retryLabel}
          </Button>
        )}
        {onBack && (
          <Button
            onClick={onBack}
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * USAGE EXAMPLES:
 * 
 * // Network error (fetch failed)
 * try {
 *   const response = await fetch('/api/reports');
 * } catch (error) {
 *   return <ErrorState 
 *     variant="network"
 *     onRetry={() => fetchReports()}
 *   />;
 * }
 * 
 * // Server error (500)
 * if (!response.ok && response.status >= 500) {
 *   return <ErrorState 
 *     variant="server"
 *     errorCode={`HTTP ${response.status}`}
 *     onRetry={() => fetchReports()}
 *     onBack={() => navigate('dashboard')}
 *   />;
 * }
 * 
 * // Not found (404)
 * if (response.status === 404) {
 *   return <ErrorState 
 *     variant="not-found"
 *     title="Report Not Found"
 *     message="This report may have been deleted."
 *     onBack={() => navigate('search-listings')}
 *   />;
 * }
 * 
 * // Unauthorized (401)
 * if (response.status === 401) {
 *   return <ErrorState 
 *     variant="unauthorized"
 *     onRetry={() => navigate('login')}
 *     retryLabel="Log In"
 *   />;
 * }
 * 
 * // Rate limit (429)
 * if (result.error?.code === 'RATE_LIMIT') {
 *   return <ErrorState 
 *     variant="rate-limit"
 *     message={result.error.message}
 *     errorCode="Please wait 5 minutes"
 *   />;
 * }
 * 
 * // Generic error
 * if (!result.success) {
 *   return <ErrorState 
 *     variant="generic"
 *     title={result.error.code}
 *     message={result.error.message}
 *     onRetry={() => fetchData()}
 *   />;
 * }
 */

/**
 * BACKEND INTEGRATION NOTES:
 * 
 * Error Handling Pattern:
 * 
 * const fetchReports = async () => {
 *   try {
 *     setLoading(true);
 *     setError(null);
 *     
 *     const response = await fetch('/api/reports', {
 *       headers: {
 *         'Authorization': `Bearer ${token}`
 *       }
 *     });
 *     
 *     // Handle HTTP errors
 *     if (!response.ok) {
 *       if (response.status === 401) {
 *         setError({ variant: 'unauthorized' });
 *       } else if (response.status === 404) {
 *         setError({ variant: 'not-found' });
 *       } else if (response.status === 429) {
 *         setError({ variant: 'rate-limit' });
 *       } else if (response.status >= 500) {
 *         setError({ variant: 'server', code: `HTTP ${response.status}` });
 *       } else {
 *         setError({ variant: 'generic' });
 *       }
 *       return;
 *     }
 *     
 *     const result = await response.json();
 *     
 *     // Handle API errors
 *     if (!result.success) {
 *       setError({
 *         variant: 'generic',
 *         title: result.error.code,
 *         message: result.error.message
 *       });
 *       return;
 *     }
 *     
 *     // Success
 *     setReports(result.reports);
 *     
 *   } catch (error) {
 *     // Network error
 *     setError({ variant: 'network' });
 *   } finally {
 *     setLoading(false);
 *   }
 * };
 * 
 * // In render
 * if (loading) return <LoadingState />;
 * if (error) return <ErrorState {...error} onRetry={fetchReports} />;
 * if (reports.length === 0) return <EmptyState />;
 * return <ReportsList reports={reports} />;
 */