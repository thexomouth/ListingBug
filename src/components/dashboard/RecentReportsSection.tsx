import { Button } from '../ui/button';
import { FileText, Download, Clock, Eye } from 'lucide-react';

/**
 * RECENT REPORTS SECTION COMPONENT
 * 
 * PURPOSE: Display all reports from the last 7 days (max 20 cards)
 * 
 * BACKEND INTEGRATION:
 * - API Endpoint: GET /api/reports?since=7days&limit=20&sort=lastRun&order=desc
 * - Data Source: Recent reports from current user within last 7 days
 * - Refresh: On component mount, when new report created
 * 
 * NAMING CONVENTION:
 * - RecentReports_Card_Container
 * - RecentReports_Card_Title
 * - RecentReports_Card_Name
 * - RecentReports_Card_Location
 * - RecentReports_Card_Criteria
 * - RecentReports_Card_Results
 * - RecentReports_Badge_Automated (conditional)
 * - RecentReports_Badge_Ready (conditional)
 * - RecentReports_Button_ViewEdit
 * - RecentReports_Button_Download
 */

interface RecentReport {
  id: number;                  // DYNAMIC: Unique report identifier from database
  name: string;                // DYNAMIC: RecentReports_Card_Name - User-defined report name
  location: string;            // DYNAMIC: RecentReports_Card_Location - City, State
  criteria: string;            // DYNAMIC: RecentReports_Card_Criteria - Auto-generated summary
  lastRun: string;             // DYNAMIC: RecentReports_Card_LastRun - Relative time (e.g., "2 hours ago")
  lastRunTimestamp: Date;      // DYNAMIC: Actual timestamp for filtering
  resultsCount: number;        // DYNAMIC: RecentReports_Card_Results - Number of listings found
  automated: boolean;          // DYNAMIC: Controls RecentReports_Badge_Automated visibility
}

interface RecentReportsSectionProps {
  onReportClick: (reportId: number, action: 'edit' | 'download') => void;
  // FUTURE PROPS:
  // reports?: RecentReport[];        // Pass from parent when backend integrated
  // isLoading?: boolean;             // Show loading state
  // error?: Error;                   // Show error state
  // onRefresh?: () => void;          // Manual refresh callback
}

export function RecentReportsSection({ onReportClick }: RecentReportsSectionProps) {
  // ============================================================================
  // BACKEND INTEGRATION TODO:
  // Replace this mock data with actual API call
  // 
  // Example implementation:
  // const [reports, setReports] = useState<RecentReport[]>([]);
  // const [isLoading, setIsLoading] = useState(true);
  // const [error, setError] = useState<Error | null>(null);
  // 
  // useEffect(() => {
  //   const fetchReports = async () => {
  //     try {
  //       const response = await fetch('/api/reports?since=7days&limit=20&sort=lastRun&order=desc');
  //       const data = await response.json();
  //       setReports(data.reports);
  //     } catch (err) {
  //       setError(err);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };
  //   fetchReports();
  // }, []);
  // ============================================================================
  
  // Load reports from localStorage
  const allMockReports: RecentReport[] = [];

  // Filter reports from last 7 days and limit to 20
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentReports = allMockReports
    .filter(report => report.lastRunTimestamp >= sevenDaysAgo)
    .sort((a, b) => {
      const aTime = typeof a.lastRunTimestamp === 'string' ? new Date(a.lastRunTimestamp).getTime() : a.lastRunTimestamp.getTime();
      const bTime = typeof b.lastRunTimestamp === 'string' ? new Date(b.lastRunTimestamp).getTime() : b.lastRunTimestamp.getTime();
      return bTime - aTime;
    })
    .slice(0, 20);

  return (
    <div className="mb-6">
      {/* Section Header - matching System Performance format */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-5 h-5 text-[#342e37]" />
          <h2 className="font-bold text-[#342e37] text-xl md:text-2xl">Recent Reports</h2>
        </div>
        <p className="text-xs md:text-sm text-gray-600">
          All reports from the last 7 days ({recentReports.length} total)
        </p>
      </div>

      {/* Reports List - No card wrapper */}
      <div className="space-y-3">
        {/* REPEATABLE COMPONENT: Map each report to a card */}
        {/* BACKEND: reports.map((report) => ( ... )) */}
        {recentReports.map((report) => (
          <div
            key={report.id}  // IMPORTANT: Use unique ID from database
            className="border rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors overflow-hidden cursor-pointer"
            onClick={() => onReportClick(report.id, 'edit')}
          >
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              {/* LEFT SECTION: Report Information */}
              <div className="flex-1 min-w-0">
                {/* RecentReports_Card_TitleRow - Report name and badges */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                  {/* RecentReports_Card_Name - DYNAMIC: Report name from database */}
                  <h3 className="sm:text-base leading-snug break-words text-[21px] font-bold">
                    {report.name}
                  </h3>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* RecentReports_Badge_Automated - CONDITIONAL: Show if automated === true */}
                    {report.automated && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-[#ffd447]/20 text-[#342e37] flex-shrink-0">
                        Automated
                      </span>
                    )}
                  </div>
                </div>
                
                {/* RecentReports_Card_Metadata - Report details grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 text-sm text-gray-600">
                  <div className="min-w-0">
                    <span className="text-gray-500">Location: </span>
                    {/* RecentReports_Card_Location - DYNAMIC: City, State */}
                    <span className="text-gray-900 break-words">{report.location}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-gray-500">Criteria: </span>
                    {/* RecentReports_Card_Criteria - DYNAMIC: Filter summary */}
                    <span className="text-gray-900 break-words">{report.criteria}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-gray-500">Results: </span>
                    {/* RecentReports_Card_Results - DYNAMIC: Listing count */}
                    <span className="font-medium text-[#342e37]">
                      {report.resultsCount}
                    </span>
                  </div>
                </div>
                
                {/* RecentReports_Card_LastRun - DYNAMIC: Relative timestamp */}
                <div className="flex items-center gap-1 mt-3 text-xs text-gray-500">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  Last run {report.lastRun}
                </div>
              </div>

              {/* RIGHT SECTION: Action Buttons */}
              <div className="flex gap-2 w-full sm:w-auto lg:flex-shrink-0">
                {/* RecentReports_Button_ViewEdit - WORKFLOW: Opens ReportDetailsModal in edit mode */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReportClick(report.id, 'edit');
                  }}
                  className="gap-2 flex-1 sm:flex-initial"
                >
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline">View/Edit</span>
                </Button>
                
                {/* RecentReports_Button_Download - WORKFLOW: Opens modal to download report */}
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReportClick(report.id, 'download');
                  }}
                  className="gap-2 flex-1 sm:flex-initial bg-[#FFD447] hover:bg-[#FFD447]/90 text-[#342E37]"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download</span>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}