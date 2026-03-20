/**
 * CONSENT PROVENANCE PANEL - Interactive Component
 * Component name: ConsentProvenancePanel
 * 
 * PURPOSE: Interactive panel showing contact provenance and consent status with owner actions
 * 
 * DEVELOPER FIELD NAMES & DATA BINDINGS:
 * - provenance_source: string (e.g., "Form", "Phone", "In-person", "Imported")
 * - provenance_method: string (detailed method description)
 * - provenance_timestamp: ISO8601 timestamp
 * - consent_flag: boolean (true if contact has opted in)
 * - consent_method: string (e.g., "Email opt-in", "Phone consent", "Form submission")
 * - consent_timestamp: ISO8601 timestamp
 * - consent_ip: string (IP address of consent)
 * 
 * API ENDPOINTS:
 * - POST /api/ledger/events - Log owner actions with event_type and idempotency_key
 * - GET /api/consent/provenance?search_id={id} - Fetch consent summary
 * - POST /api/consent/mark-opted-in - Mark contacts as opted in
 * - POST /api/consent/send-confirmation - Send opt-in confirmation request
 * - POST /api/consent/exclude - Exclude contacts from sync
 * 
 * OWNER ACTION EVENT SCHEMA:
 * {
 *   event_type: 'owner_action',
 *   action: 'mark_opted_in' | 'send_confirmation' | 'exclude' | 'review',
 *   contact_ids: string[],
 *   provenance_source?: string,
 *   owner_id: string,
 *   timestamp: ISO8601,
 *   idempotency_key: UUID
 * }
 */

import { useState } from 'react';
import { 
  Shield, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  FileText, 
  Phone, 
  Users, 
  Database, 
  CheckCircle, 
  AlertTriangle, 
  HelpCircle,
  MoreVertical,
  Mail,
  UserCheck,
  UserX,
  Eye,
  Send,
  ExternalLink
} from 'lucide-react';
import { LBButton } from '../design-system/LBButton';
import { toast } from 'sonner@2.0.3';

/**
 * DATA BINDING INTERFACES
 */
export interface ConsentRecord {
  contact_id: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  provenance_source: 'Form' | 'Phone' | 'In-person' | 'Imported' | 'API' | 'Manual';
  provenance_method: string;
  provenance_timestamp: string; // ISO8601
  consent_flag: boolean;
  consent_method: string;
  consent_timestamp: string; // ISO8601
  consent_ip: string;
}

export interface ConsentSummary {
  total_contacts: number;
  verified_opt_in_count: number;
  verified_opt_in_percentage: number;
  missing_consent_count?: number;
  provenance_breakdown: {
    [key: string]: number; // e.g., { "Form": 45, "Phone": 12, "Imported": 8 }
  };
}

interface ConsentProvenancePanelProps {
  summary: ConsentSummary;
  sampleContacts?: ConsentRecord[];
  onViewLedger?: () => void;
  showConciergeButton?: boolean;
  onConciergeClick?: () => void;
  ownerId?: string;
}

/**
 * COMPONENT: ConsentProvenancePanel
 * Interactive panel with provenance badges, action menus, and expandable details
 */
export function ConsentProvenancePanel({ 
  summary, 
  sampleContacts = [],
  onViewLedger,
  showConciergeButton = false,
  onConciergeClick,
  ownerId = 'owner_123'
}: ConsentProvenancePanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Calculate missing consent
  const missingConsent = summary.missing_consent_count ?? 
    (summary.total_contacts - summary.verified_opt_in_count);
  
  const consentPercentage = summary.verified_opt_in_percentage;
  const isLowConsent = consentPercentage < 80;

  /**
   * GENERATE IDEMPOTENCY KEY
   * Used to prevent duplicate event logging
   */
  const generateIdempotencyKey = () => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  };

  /**
   * LOG OWNER ACTION TO LEDGER
   * API ENDPOINT: POST /api/ledger/events
   * REQUEST BODY: { event_type, action, contact_ids, provenance_source, owner_id, timestamp, idempotency_key }
   */
  const logOwnerAction = async (
    action: 'mark_opted_in' | 'send_confirmation' | 'exclude' | 'review',
    contactIds: string[],
    provenanceSource?: string
  ) => {
    const event = {
      event_type: 'owner_action',
      action: action,
      contact_ids: contactIds,
      provenance_source: provenanceSource,
      owner_id: ownerId,
      timestamp: new Date().toISOString(),
      idempotency_key: generateIdempotencyKey()
    };

    console.log('📊 POST /api/ledger/events', event);

    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(event);
      }, 500);
    });
  };

  /**
   * HANDLE PROVENANCE BADGE ACTIONS
   * Actions: Review | Mark Opted In | Send Confirmation | Exclude
   */
  const handleProvenanceAction = async (
    action: 'review' | 'mark_opted_in' | 'send_confirmation' | 'exclude',
    source: string
  ) => {
    setLoadingAction(`${source}-${action}`);
    setActiveMenu(null);

    const actionKey = `${source}-${action}`;
    const count = summary.provenance_breakdown[source] || 0;

    try {
      // Get contact IDs for this provenance source
      const contactIds = sampleContacts
        .filter(c => c.provenance_source === source)
        .map(c => c.contact_id);

      // Log owner action
      await logOwnerAction(action, contactIds, source);

      // Show success message
      const messages = {
        review: `Reviewing ${count} contacts from ${source}`,
        mark_opted_in: `Marked ${count} contacts from ${source} as opted in`,
        send_confirmation: `Sending opt-in confirmation to ${count} contacts from ${source}`,
        exclude: `Excluded ${count} contacts from ${source} from sync`
      };

      toast.success(messages[action], {
        description: `Owner action logged with idempotency key`
      });
    } catch (error) {
      toast.error('Action failed', {
        description: 'Please try again or contact support'
      });
    } finally {
      setLoadingAction(null);
    }
  };

  /**
   * HANDLE PER-ROW ACTIONS
   * Actions: Mark as Opted In | Send Opt-In Request | Exclude
   */
  const handleRowAction = async (
    action: 'mark_opted_in' | 'send_confirmation' | 'exclude',
    contact: ConsentRecord
  ) => {
    setLoadingAction(`${contact.contact_id}-${action}`);

    try {
      await logOwnerAction(action, [contact.contact_id]);

      const messages = {
        mark_opted_in: `Marked ${contact.contact_email || contact.contact_id} as opted in`,
        send_confirmation: `Sent opt-in request to ${contact.contact_email || contact.contact_id}`,
        exclude: `Excluded ${contact.contact_email || contact.contact_id} from sync`
      };

      toast.success(messages[action]);
    } catch (error) {
      toast.error('Action failed');
    } finally {
      setLoadingAction(null);
    }
  };

  /**
   * GET PROVENANCE ICON
   */
  const getProvenanceIcon = (source: string) => {
    const icons: Record<string, any> = {
      Form: FileText,
      Phone: Phone,
      'In-person': Users,
      Imported: Database,
      API: Database,
      Manual: Users
    };
    return icons[source] || Database;
  };

  /**
   * GET STATUS DOT COLOR
   * Green: >90% consent, Yellow: 80-90%, Red: <80%
   */
  const getStatusDotColor = (source: string) => {
    // Calculate consent rate for this source from sample data
    const sourceContacts = sampleContacts.filter(c => c.provenance_source === source);
    if (sourceContacts.length === 0) return 'bg-gray-400';
    
    const consentedCount = sourceContacts.filter(c => c.consent_flag).length;
    const rate = (consentedCount / sourceContacts.length) * 100;
    
    if (rate >= 90) return 'bg-green-500';
    if (rate >= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  /**
   * GET OVERALL STATUS COLOR
   */
  const getStatusColor = () => {
    if (consentPercentage >= 90) return 'green';
    if (consentPercentage >= 80) return 'yellow';
    return 'red';
  };

  const statusColor = getStatusColor();
  const statusBg = statusColor === 'green' ? 'bg-green-50' : statusColor === 'yellow' ? 'bg-yellow-50' : 'bg-red-50';
  const statusBorder = statusColor === 'green' ? 'border-green-300' : statusColor === 'yellow' ? 'border-yellow-300' : 'border-red-300';
  const statusText = statusColor === 'green' ? 'text-green-900' : statusColor === 'yellow' ? 'text-yellow-900' : 'text-red-900';
  const statusIconColor = statusColor === 'green' ? 'text-green-600' : statusColor === 'yellow' ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className={`border-2 rounded-lg ${statusBorder} ${statusBg}`}>
      {/* HEADER - TOP SUMMARY */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <Shield className={`w-5 h-5 ${statusIconColor}`} />
            <h3 className={`font-bold text-base ${statusText}`}>
              Consent & Provenance
            </h3>
            
            {/* TOOLTIP: "Why this matters" */}
            <div className="group relative">
              <HelpCircle className="w-4 h-4 text-gray-500 cursor-help" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-72">
                <div className="bg-gray-900 text-white text-xs rounded-lg px-4 py-3 shadow-xl">
                  <p className="font-bold mb-1">Why this matters</p>
                  <p>
                    Provenance shows where the contact came from and whether they confirmed permission. 
                    This protects you from legal issues and ensures compliance with CAN-SPAM, GDPR, and CASL.
                  </p>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DYNAMIC SUMMARY LINE - DATA BINDING */}
        <p className={`text-sm font-bold ${statusText} mb-3`}>
          {summary.total_contacts} contacts · {summary.verified_opt_in_count} verified opt-in ({consentPercentage.toFixed(0)}%) · {missingConsent} missing consent
        </p>

        {/* PROVENANCE BADGES ROW WITH ACTION MENUS */}
        <div className="flex flex-wrap gap-2 mb-3">
          {Object.entries(summary.provenance_breakdown).map(([source, count]) => {
            const Icon = getProvenanceIcon(source);
            const dotColor = getStatusDotColor(source);
            const isMenuOpen = activeMenu === source;
            const isLoading = loadingAction?.startsWith(`${source}-`);

            return (
              <div key={source} className="relative">
                <button
                  onClick={() => setActiveMenu(isMenuOpen ? null : source)}
                  className={`inline-flex items-center gap-2 px-3 py-2 bg-white border-2 border-gray-300 rounded-lg text-xs font-bold hover:border-[#FFD447] transition-all ${
                    isMenuOpen ? 'border-[#FFD447] bg-[#FFD447]/10' : ''
                  }`}
                  disabled={isLoading}
                >
                  {/* STATUS DOT */}
                  <span className={`w-2 h-2 rounded-full ${dotColor} flex-shrink-0`} />
                  <Icon className="w-4 h-4 text-[#342E37]" />
                  <span className="text-[#342E37]">{source}</span>
                  <span className="text-gray-600">({count})</span>
                  <MoreVertical className="w-3 h-3 text-gray-500" />
                </button>

                {/* ACTION MENU DROPDOWN */}
                {isMenuOpen && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white border-2 border-gray-300 rounded-lg shadow-xl z-50">
                    <div className="p-1">
                      <button
                        onClick={() => handleProvenanceAction('review', source)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded"
                      >
                        <Eye className="w-3 h-3" />
                        Review
                      </button>
                      <button
                        onClick={() => handleProvenanceAction('mark_opted_in', source)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-green-700 hover:bg-green-50 rounded"
                      >
                        <UserCheck className="w-3 h-3" />
                        Mark Opted In
                      </button>
                      <button
                        onClick={() => handleProvenanceAction('send_confirmation', source)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50 rounded"
                      >
                        <Send className="w-3 h-3" />
                        Send Confirmation
                      </button>
                      <button
                        onClick={() => handleProvenanceAction('exclude', source)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 rounded"
                      >
                        <UserX className="w-3 h-3" />
                        Exclude
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* WARNING FOR LOW CONSENT */}
        {isLowConsent && (
          <div className="flex items-start gap-2 p-3 bg-red-100 border-2 border-red-300 rounded-lg mb-3">
            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-900">
              <strong>Low consent rate:</strong> Less than 80% of contacts have verified opt-in. 
              Sending marketing may violate CAN-SPAM, GDPR, and platform policies.
            </p>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap gap-2">
          <LBButton
            variant="outline"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="flex-shrink-0"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                View Details
              </>
            )}
          </LBButton>
          
          {onViewLedger && (
            <button
              onClick={onViewLedger}
              className="text-xs text-blue-600 hover:text-blue-800 underline font-medium flex items-center gap-1"
            >
              View consent ledger
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* CONCIERGE CTA */}
        {showConciergeButton && (
          <button
            onClick={onConciergeClick}
            className="mt-3 w-full p-3 bg-blue-50 border-2 border-blue-300 rounded-lg hover:bg-blue-100 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-blue-900">Need help with consent?</p>
                <p className="text-xs text-blue-700">We'll review and clean your list — one call, we do the rest.</p>
              </div>
            </div>
          </button>
        )}
      </div>

      {/* EXPANDABLE DETAILS DRAWER */}
      {expanded && (
        <div className="border-t-2 border-gray-300 p-4 bg-white">
          <h4 className="font-bold text-sm text-[#342E37] mb-3">Sample Records (Max 5)</h4>
          
          {/* SAMPLE ROWS TABLE */}
          {sampleContacts.length > 0 ? (
            <div className="border-2 border-gray-300 rounded-lg overflow-hidden mb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-100 border-b-2 border-gray-300">
                    <tr>
                      <th className="px-3 py-2 text-left font-bold text-gray-700">Contact</th>
                      <th className="px-3 py-2 text-left font-bold text-gray-700">Source</th>
                      <th className="px-3 py-2 text-left font-bold text-gray-700">Method</th>
                      <th className="px-3 py-2 text-left font-bold text-gray-700">Consent</th>
                      <th className="px-3 py-2 text-left font-bold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sampleContacts.slice(0, 5).map((contact) => {
                      const Icon = getProvenanceIcon(contact.provenance_source);
                      const isRowLoading = loadingAction?.startsWith(contact.contact_id);

                      return (
                        <tr key={contact.contact_id} className="hover:bg-gray-50">
                          <td className="px-3 py-2">
                            <div className="font-medium text-gray-900">
                              {contact.contact_email || contact.contact_phone || contact.contact_id}
                            </div>
                            {contact.contact_name && (
                              <div className="text-gray-600">{contact.contact_name}</div>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1">
                              <Icon className="w-3 h-3 text-gray-600" />
                              <span className="font-medium">{contact.provenance_source}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <span className="text-gray-700">{contact.provenance_method}</span>
                          </td>
                          <td className="px-3 py-2">
                            {contact.consent_flag ? (
                              <div className="flex items-center gap-1 text-green-700">
                                <CheckCircle className="w-3 h-3" />
                                <span className="font-bold">Verified</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-red-700">
                                <AlertTriangle className="w-3 h-3" />
                                <span className="font-bold">Missing</span>
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1">
                              {/* PER-ROW ACTION BUTTONS */}
                              {!contact.consent_flag && (
                                <>
                                  <button
                                    onClick={() => handleRowAction('mark_opted_in', contact)}
                                    disabled={isRowLoading}
                                    className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                                    title="Mark as Opted In"
                                  >
                                    <UserCheck className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleRowAction('send_confirmation', contact)}
                                    disabled={isRowLoading}
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                                    title="Send Opt-In Request"
                                  >
                                    <Mail className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleRowAction('exclude', contact)}
                                disabled={isRowLoading}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                title="Exclude"
                              >
                                <UserX className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 border-2 border-gray-300 rounded-lg text-center text-sm text-gray-600 mb-4">
              No sample contacts available
            </div>
          )}

          {/* SUMMARY STATS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-[#342E37]">{summary.total_contacts}</div>
              <div className="text-xs text-gray-600 mt-1">Total</div>
            </div>
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-green-800">{summary.verified_opt_in_count}</div>
              <div className="text-xs text-gray-600 mt-1">Verified</div>
            </div>
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-red-800">{missingConsent}</div>
              <div className="text-xs text-gray-600 mt-1">Missing</div>
            </div>
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-blue-800">{consentPercentage.toFixed(1)}%</div>
              <div className="text-xs text-gray-600 mt-1">Rate</div>
            </div>
          </div>

          {/* DEVELOPER NOTES */}
          <div className="bg-gray-900 border-2 border-gray-700 rounded-lg p-3 font-mono text-xs text-green-400">
            <p className="text-white font-bold mb-2">📊 Developer Annotations</p>
            <p><span className="text-yellow-400">API:</span> POST /api/ledger/events</p>
            <p><span className="text-yellow-400">Fields:</span> provenance_source, provenance_method, provenance_timestamp</p>
            <p className="mt-1"><span className="text-yellow-400">Consent:</span> consent_flag, consent_method, consent_timestamp, consent_ip</p>
            <p className="mt-1"><span className="text-yellow-400">Event:</span> event_type: "owner_action", idempotency_key: UUID</p>
          </div>
        </div>
      )}
    </div>
  );
}
