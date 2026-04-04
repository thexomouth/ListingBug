/**
 * AUTOMATION DETAIL PAGE - Full Page View
 * 
 * Provides comprehensive view of an automation with:
 * - Detailed history and logs
 * - Search parameters
 * - Integration context
 * - Scheduling management
 * - Download options
 */

import { useState } from 'react';
import { LBButton } from './design-system/LBButton';
import { LBCard, LBCardHeader, LBCardContent } from './design-system/LBCard';
import { LBTable, LBTableHeader, LBTableBody, LBTableHead, LBTableRow, LBTableCell } from './design-system/LBTable';
import { LBInput } from './design-system/LBInput';
import { LBSelect } from './design-system/LBSelect';
import { LBToggle } from './design-system/LBToggle';
import {
  ArrowLeft,
  Play,
  Pause,
  Trash2,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Calendar,
  Settings,
  Mail,
  Database,
  FileSpreadsheet,
  MessageSquare,
  Webhook,
  ChevronDown,
  ChevronUp,
  Edit2,
  TrendingUp,
  Activity,
  Link as LinkIcon,
  Shield,
  FileText,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import React from 'react';

interface AutomationDetailPageProps {
  automation: any;
  onBack: () => void;
  onDelete?: (id: string) => void;
  onToggleActive?: (id: string, active: boolean) => void;
  onEdit?: (automation: any) => void;
}

export function AutomationDetailPage({
  automation,
  onBack,
  onDelete,
  onToggleActive,
  onEdit
}: AutomationDetailPageProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showScheduleEdit, setShowScheduleEdit] = useState(false);
  const [editedSchedule, setEditedSchedule] = useState(automation.schedule || 'daily');

  // Mock data for run history
  const runHistory = [
    {
      id: '1',
      date: new Date().toISOString(),
      listingsProcessed: 12,
      successCount: 12,
      errorCount: 0,
      status: 'success' as const,
      duration: '2.3s',
      suppressedCount: 3,
      errors: []
    },
    {
      id: '2',
      date: new Date(Date.now() - 86400000).toISOString(),
      listingsProcessed: 15,
      successCount: 14,
      errorCount: 1,
      status: 'partial' as const,
      duration: '3.1s',
      suppressedCount: 5,
      errors: ['Failed to sync listing #45678 - API rate limit exceeded']
    },
    {
      id: '3',
      date: new Date(Date.now() - 172800000).toISOString(),
      listingsProcessed: 8,
      successCount: 8,
      errorCount: 0,
      status: 'success' as const,
      duration: '1.8s',
      suppressedCount: 2,
      errors: []
    },
    {
      id: '4',
      date: new Date(Date.now() - 259200000).toISOString(),
      listingsProcessed: 0,
      successCount: 0,
      errorCount: 1,
      status: 'failed' as const,
      duration: '0.5s',
      suppressedCount: 0,
      errors: ['Integration authentication expired - please reconnect']
    }
  ];

  // Calculate usage stats
  const totalRuns = runHistory.length;
  const totalListingsProcessed = runHistory.reduce((sum, run) => sum + run.listingsProcessed, 0);
  const totalErrors = runHistory.reduce((sum, run) => sum + run.errorCount, 0);
  const successRate = totalRuns > 0 ? ((totalRuns - runHistory.filter(r => r.status === 'failed').length) / totalRuns * 100).toFixed(1) : '0';

  // Get integration icon
  const getIntegrationIcon = (type: string) => {
    const icons: any = {
      email: Mail,
      mailchimp: Mail,
      hubspot: Database,
      sheets: FileSpreadsheet,
      slack: MessageSquare,
      webhook: Webhook,
      salesforce: Database
    };
    return icons[type] || Database;
  };

  const IntegrationIcon = getIntegrationIcon(automation.destination?.type || 'email');

  const toggleRowExpansion = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDownloadCSV = () => {
    toast.success('Downloading automation history as CSV...');
  };

  const handleDownloadPDF = () => {
    toast.success('Generating PDF report...');
  };

  const handlePauseResume = () => {
    if (onToggleActive) {
      onToggleActive(automation.id, !automation.active);
      toast.success(automation.active ? 'Automation paused' : 'Automation resumed');
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this automation? This action cannot be undone.')) {
      if (onDelete) {
        onDelete(automation.id);
        toast.success('Automation deleted');
        onBack();
      }
    }
  };

  const handleSaveSchedule = () => {
    toast.success('Schedule updated successfully');
    setShowScheduleEdit(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusBadge = () => {
    if (!automation.active) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
          <Pause className="w-3.5 h-3.5" />
          Paused
        </span>
      );
    }

    const lastRun = runHistory[0];
    if (lastRun?.status === 'failed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full">
          <XCircle className="w-3.5 h-3.5" />
          Error
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full">
        <Play className="w-3.5 h-3.5" />
        Running
      </span>
    );
  };

  const getRunStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'partial':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <LBButton
                onClick={onBack}
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Automations</span>
                <span className="sm:hidden">Back</span>
              </LBButton>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">Automation Details</h1>
                {getStatusBadge()}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LBButton
                onClick={handlePauseResume}
                variant="outline"
                size="sm"
              >
                {automation.active ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Resume
                  </>
                )}
              </LBButton>
              <LBButton
                onClick={handleDelete}
                variant="outline"
                size="sm"
                className="text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Delete</span>
              </LBButton>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Overview Section */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div className="flex-1">
              <h2 className="text-xl mb-2">{automation.name}</h2>
              <p className="text-gray-600">
                Automatically syncing <strong>{automation.searchName}</strong> to{' '}
                <strong>{automation.destination?.label}</strong>
              </p>
            </div>
            {onEdit && (
              <LBButton onClick={() => onEdit(automation)} variant="outline" size="sm">
                <Edit2 className="w-4 h-4" />
                Edit
              </LBButton>
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Next Run */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex justify-center mb-2">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs text-gray-600 block text-center mb-1">Next Run</span>
              <p className="font-medium text-gray-900 text-center text-sm">
                {automation.nextRun || 'Not scheduled'}
              </p>
            </div>

            {/* Total Processed */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="flex justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-xs text-gray-600 block text-center mb-1">Total Processed</span>
              <p className="font-medium text-gray-900 text-center text-sm">
                {totalListingsProcessed.toLocaleString()} listings
              </p>
            </div>

            {/* Success Rate */}
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
              <div className="flex justify-center mb-2">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-xs text-gray-600 block text-center mb-1">Success Rate</span>
              <p className="font-medium text-gray-900 text-center text-sm">{successRate}%</p>
            </div>

            {/* Total Runs */}
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
              <div className="flex justify-center mb-2">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-xs text-gray-600 block text-center mb-1">Total Runs</span>
              <p className="font-medium text-gray-900 text-center text-sm">{totalRuns} runs</p>
            </div>
          </div>

          {/* Usage Meter */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Monthly Usage</span>
              <span className="text-sm font-medium">
                {totalListingsProcessed} / 5,000 listings
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#ffd447] h-2 rounded-full transition-all"
                style={{ width: `${Math.min((totalListingsProcessed / 5000) * 100, 100)}%` }}
              />
            </div>
            {totalListingsProcessed > 4000 && (
              <p className="text-xs text-orange-600 mt-2">
                ⚠️ Approaching plan limit - consider upgrading
              </p>
            )}
          </div>
        </div>

        {/* History & Logs Section */}
        <div className="pt-8 border-t-2 border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold">Run History & Logs</h2>
            <div className="flex items-center gap-2">
              <LBButton onClick={handleDownloadCSV} variant="outline" size="sm">
                <Download className="w-4 h-4" />
                CSV
              </LBButton>
              <LBButton onClick={handleDownloadPDF} variant="outline" size="sm">
                <Download className="w-4 h-4" />
                PDF
              </LBButton>
            </div>
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0">
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <LBTable>
                <LBTableHeader>
                  <LBTableRow>
                    <LBTableHead>Status</LBTableHead>
                    <LBTableHead>Date & Time</LBTableHead>
                    <LBTableHead>Processed</LBTableHead>
                    <LBTableHead>Successes</LBTableHead>
                    <LBTableHead>Errors</LBTableHead>
                    <LBTableHead>Suppressed</LBTableHead>
                    <LBTableHead>Duration</LBTableHead>
                    <LBTableHead></LBTableHead>
                  </LBTableRow>
                </LBTableHeader>
                <LBTableBody>
                  {runHistory.map((run) => (
                    <React.Fragment key={run.id}>
                      <LBTableRow className="hover:bg-gray-50">
                        <LBTableCell>
                          <div className="flex items-center gap-2">
                            {getRunStatusIcon(run.status)}
                          </div>
                        </LBTableCell>
                        <LBTableCell>{formatDate(run.date)}</LBTableCell>
                        <LBTableCell>{run.listingsProcessed}</LBTableCell>
                        <LBTableCell>
                          <span className="text-green-600">{run.successCount}</span>
                        </LBTableCell>
                        <LBTableCell>
                          {run.errorCount > 0 ? (
                            <span className="text-red-600">{run.errorCount}</span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </LBTableCell>
                        <LBTableCell>
                          <span className="text-gray-600">{run.suppressedCount}</span>
                        </LBTableCell>
                        <LBTableCell>
                          <span className="text-gray-500">{run.duration}</span>
                        </LBTableCell>
                        <LBTableCell>
                          {run.errors.length > 0 && (
                            <LBButton
                              onClick={() => toggleRowExpansion(run.id)}
                              variant="ghost"
                              size="sm"
                            >
                              {expandedRows.has(run.id) ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </LBButton>
                          )}
                        </LBTableCell>
                      </LBTableRow>
                      {expandedRows.has(run.id) && run.errors.length > 0 && (
                        <LBTableRow>
                          <LBTableCell colSpan={8}>
                            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                              <h4 className="font-medium text-red-900 mb-2">Error Log</h4>
                              <ul className="space-y-1">
                                {run.errors.map((error, idx) => (
                                  <li key={idx} className="text-sm text-red-700 flex items-start gap-2">
                                    <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>{error}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </LBTableCell>
                        </LBTableRow>
                      )}
                    </React.Fragment>
                  ))}
                </LBTableBody>
              </LBTable>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3 px-4">
              {runHistory.map((run) => (
                <div key={run.id} className="bg-white border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getRunStatusIcon(run.status)}
                      <span className="text-sm text-gray-500">{formatDate(run.date)}</span>
                    </div>
                    <span className="text-sm text-gray-500">{run.duration}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <div className="text-gray-600 text-xs">Processed</div>
                      <div className="font-medium">{run.listingsProcessed}</div>
                    </div>
                    <div>
                      <div className="text-gray-600 text-xs">Success</div>
                      <div className="font-medium text-green-600">{run.successCount}</div>
                    </div>
                    <div>
                      <div className="text-gray-600 text-xs">Errors</div>
                      <div className="font-medium text-red-600">{run.errorCount || 0}</div>
                    </div>
                  </div>
                  {run.errors.length > 0 && (
                    <div>
                      <LBButton
                        onClick={() => toggleRowExpansion(run.id)}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-center"
                      >
                        {expandedRows.has(run.id) ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            Hide Errors
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            Show Errors
                          </>
                        )}
                      </LBButton>
                      {expandedRows.has(run.id) && (
                        <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                          <h4 className="font-medium text-red-900 mb-2 text-sm">Error Log</h4>
                          <ul className="space-y-1">
                            {run.errors.map((error, idx) => (
                              <li key={idx} className="text-sm text-red-700 flex items-start gap-2">
                                <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>{error}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {runHistory.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No run history yet</p>
              <p className="text-sm mt-1">This automation hasn't run yet</p>
            </div>
          )}
        </div>

        {/* Two Column Layout for Medium Sections */}
        <div className="pt-8 border-t-2 border-gray-200 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Search Parameters */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Search Parameters</h2>
              <LBButton variant="ghost" size="sm">
                <Edit2 className="w-4 h-4" />
                Edit
              </LBButton>
            </div>

            <div className="bg-white border rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between py-2 border-b">
                  <span className="text-sm text-gray-600">Search Name</span>
                  <span className="font-medium text-right">{automation.searchName}</span>
                </div>
                <div className="flex items-start justify-between py-2 border-b">
                  <span className="text-sm text-gray-600">Location</span>
                  <span className="font-medium text-right">Miami, FL</span>
                </div>
                <div className="flex items-start justify-between py-2 border-b">
                  <span className="text-sm text-gray-600">Property Type</span>
                  <span className="font-medium text-right">Foreclosures</span>
                </div>
                <div className="flex items-start justify-between py-2 border-b">
                  <span className="text-sm text-gray-600">Price Range</span>
                  <span className="font-medium text-right">$100K - $500K</span>
                </div>
                <div className="flex items-start justify-between py-2 border-b">
                  <span className="text-sm text-gray-600">Days on Market</span>
                  <span className="font-medium text-right">{'<'} 30 days</span>
                </div>
                <div className="flex items-start justify-between py-2">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className="font-medium text-right">Active Listings</span>
                </div>
              </div>

              {/* Guardrail Warning */}
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-yellow-800 font-medium">Plan Limit Notice</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      This search may return 200+ results per run. Consider narrowing parameters to stay within plan limits.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scheduling */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Scheduling</h2>
              <LBButton
                variant="ghost"
                size="sm"
                onClick={() => setShowScheduleEdit(!showScheduleEdit)}
              >
                <Settings className="w-4 h-4" />
                {showScheduleEdit ? 'Cancel' : 'Edit'}
              </LBButton>
            </div>

            <div className="bg-white border rounded-lg p-4">
              {!showScheduleEdit ? (
                <div className="space-y-3">
                  <div className="flex items-start justify-between py-2 border-b">
                    <span className="text-sm text-gray-600">Frequency</span>
                    <span className="font-medium text-right">{automation.schedule}</span>
                  </div>
                  <div className="flex items-start justify-between py-2 border-b">
                    <span className="text-sm text-gray-600">Next Run</span>
                    <span className="font-medium text-right">{automation.nextRun}</span>
                  </div>
                  <div className="flex items-start justify-between py-2 border-b">
                    <span className="text-sm text-gray-600">Time Zone</span>
                    <span className="font-medium text-right">Pacific Time (PST)</span>
                  </div>
                  <div className="flex items-start justify-between py-2">
                    <span className="text-sm text-gray-600">Active</span>
                    <LBToggle
                      checked={automation.active}
                      onChange={() => handlePauseResume()}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Frequency</label>
                    <LBSelect
                      value={editedSchedule}
                      onChange={(e) => setEditedSchedule(e.target.value)}
                    >
                      <option value="realtime">Real-time (when new matches appear)</option>
                      <option value="daily">Daily at 3:00 AM PST</option>
                      <option value="weekly">Weekly on Monday at 3:00 AM PST</option>
                      <option value="monthly">Monthly on the 1st at 3:00 AM PST</option>
                    </LBSelect>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>Next run preview:</strong> Tomorrow at 3:00 AM PST
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <LBButton onClick={handleSaveSchedule} variant="primary" size="sm">
                      Save Schedule
                    </LBButton>
                    <LBButton
                      onClick={() => setShowScheduleEdit(false)}
                      variant="outline"
                      size="sm"
                    >
                      Cancel
                    </LBButton>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Integration Context Section */}
        <div className="pt-8 border-t-2 border-gray-200">
          <h2 className="text-xl font-bold mb-4">Integration Context</h2>

          <div className="space-y-4">
            {/* Connected Integration */}
            <div className="flex flex-col sm:flex-row items-start gap-4 p-4 bg-gray-50 rounded-lg border">
              <div className="p-3 bg-white rounded-lg border flex-shrink-0">
                <IntegrationIcon className="w-6 h-6 text-gray-700" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="font-medium">{automation.destination?.label}</h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                    <CheckCircle2 className="w-3 h-3" />
                    Connected
                  </span>
                </div>
                <p className="text-sm text-gray-600 break-words">
                  Last synced: {formatDate(runHistory[0]?.date)}
                </p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <LBButton variant="outline" size="sm" className="flex-1 sm:flex-initial">
                  <LinkIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Reconnect</span>
                </LBButton>
                <LBButton variant="ghost" size="sm" className="flex-shrink-0">
                  <ExternalLink className="w-4 h-4" />
                </LBButton>
              </div>
            </div>

            {/* Field Mappings */}
            <div>
              <h3 className="font-medium mb-3">Field Mappings</h3>
              <div className="space-y-2">
                {[
                  { source: 'Address', destination: 'Property Address', required: true },
                  { source: 'Price', destination: 'Listing Price', required: true },
                  { source: 'Bedrooms', destination: 'Beds', required: false },
                  { source: 'Bathrooms', destination: 'Baths', required: false },
                  { source: 'Square Feet', destination: 'Size (sqft)', required: false },
                  { source: 'Listing Date', destination: 'Date Listed', required: false }
                ].map((mapping, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-sm py-2 border-b last:border-0">
                    <span className="flex-1 text-gray-700">{mapping.source}</span>
                    <span className="text-gray-400 hidden sm:inline">→</span>
                    <span className="flex-1 text-gray-900">{mapping.destination}</span>
                    {mapping.required && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs w-fit">
                        Required
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Connection Health */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">Connection Healthy</p>
                  <p className="text-sm text-green-700 mt-1">
                    API credentials valid • Last verified 2 hours ago • Rate limit: 847/1000 requests remaining
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications & Compliance Section */}
        <div className="pt-8 border-t-2 border-gray-200">
          <h2 className="text-xl font-bold mb-4">Notifications & Compliance</h2>

          <div className="space-y-4">
            {/* Alerts */}
            <div>
              <h3 className="font-medium mb-3">Alert Settings</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Failure Alerts</p>
                    <p className="text-xs text-gray-600">
                      Notify me when an automation run fails
                    </p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Compliance Issues</p>
                    <p className="text-xs text-gray-600">
                      Alert on data controller compliance issues
                    </p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border">
                  <input type="checkbox" className="rounded" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Daily Summary</p>
                    <p className="text-xs text-gray-600">
                      Receive daily summary of automation activity
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Compliance Disclaimer */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 mb-2">Data Controller Responsibility</p>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    You are the data controller for all listing data processed through this automation.
                    Ensure you have proper consent and legitimate interest for contacting property owners
                    and agents. ListingBug provides the technology but you are responsible for compliance
                    with CAN-SPAM, GDPR, and other applicable regulations.
                  </p>
                </div>
              </div>
            </div>

            {/* Provenance Tracking */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium">Provenance Tracking Log</p>
                  <p className="text-xs text-gray-600">
                    View complete audit trail of all data processing
                  </p>
                </div>
              </div>
              <LBButton variant="outline" size="sm" className="w-full sm:w-auto">
                <ExternalLink className="w-4 h-4" />
                View
              </LBButton>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-white rounded-lg border">
          <div className="text-sm text-gray-600">
            Need more automation capacity?{' '}
            <a href="#" className="text-[#342e37] underline font-medium">
              Upgrade your plan
            </a>
          </div>
          <div className="flex items-center gap-2">
            <LBButton onClick={handlePauseResume} variant="outline" size="sm">
              {automation.active ? (
                <>
                  <Pause className="w-4 h-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Resume
                </>
              )}
            </LBButton>
            <LBButton
              onClick={handleDelete}
              variant="outline"
              size="sm"
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </LBButton>
          </div>
        </div>
      </div>
    </div>
  );
}