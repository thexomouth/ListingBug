/**
 * CONSENT LEDGER UI COMPONENT
 * Component name: ConsentLedgerTable
 * 
 * Purpose: Full audit table of all contact consent and provenance records
 * 
 * Developer Field Names & Data Bindings:
 * Columns:
 * - contact_id: string (unique identifier)
 * - email: string
 * - phone: string
 * - provenance_source: string ("Form", "Phone", "In-person", "Imported")
 * - consent_method: string (how they opted in)
 * - consent_timestamp: ISO8601 timestamp
 * - consent_ip: string
 * - owner_confirmation: boolean (owner manually confirmed)
 * - suppression_flag: boolean (unsubscribed or bounced)
 * 
 * Features:
 * - Filter by provenance, consent_method, suppression_flag
 * - Export to CSV (POST /ledger/export)
 * - Row details drawer (GET /ledger/contacts/{contact_id})
 * 
 * API Endpoints:
 * - GET /ledger/contacts - Fetch paginated contact list
 * - GET /ledger/contacts/{contact_id} - Fetch contact event history
 * - POST /ledger/export - Export filtered contacts to CSV
 */

import { useState } from 'react';
import { 
  Search, 
  Download, 
  Filter, 
  X, 
  ChevronRight, 
  CheckCircle, 
  XCircle,
  FileText,
  Phone,
  Users,
  Database,
  AlertTriangle
} from 'lucide-react';
import { Button } from '../ui/button';
import { LBInput } from '../design-system/LBInput';
import { LBSelect } from '../design-system/LBSelect';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';

/**
 * Data Binding Interfaces
 */
export interface ConsentLedgerRecord {
  contact_id: string;
  email: string;
  phone: string;
  provenance_source: 'Form' | 'Phone' | 'In-person' | 'Imported' | 'API' | 'Manual';
  consent_method: string;
  consent_timestamp: string; // ISO8601
  consent_ip: string;
  owner_confirmation: boolean;
  suppression_flag: boolean;
}

export interface ConsentEventHistory {
  event_id: string;
  event_type: 'consent' | 'suppression' | 'update' | 'confirmation';
  timestamp: string; // ISO8601
  source: string;
  ip_address: string;
  user_agent?: string;
  metadata?: Record<string, any>;
}

interface ConsentLedgerTableProps {
  records: ConsentLedgerRecord[];
  onExport?: (filters: FilterState) => void;
  onLoadContactHistory?: (contactId: string) => Promise<ConsentEventHistory[]>;
}

interface FilterState {
  search: string;
  provenance_source: string;
  consent_method: string;
  suppression_flag: string;
}

/**
 * Component: ConsentLedgerTable
 * Full-featured consent ledger with filtering, export, and detail views
 */
export function ConsentLedgerTable({ 
  records, 
  onExport,
  onLoadContactHistory 
}: ConsentLedgerTableProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    provenance_source: 'all',
    consent_method: 'all',
    suppression_flag: 'all'
  });
  const [selectedContact, setSelectedContact] = useState<ConsentLedgerRecord | null>(null);
  const [contactHistory, setContactHistory] = useState<ConsentEventHistory[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Apply filters
  const filteredRecords = records.filter(record => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (
        !record.email.toLowerCase().includes(searchLower) &&
        !record.phone?.toLowerCase().includes(searchLower) &&
        !record.contact_id.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }

    // Provenance filter
    if (filters.provenance_source !== 'all' && record.provenance_source !== filters.provenance_source) {
      return false;
    }

    // Consent method filter
    if (filters.consent_method !== 'all' && record.consent_method !== filters.consent_method) {
      return false;
    }

    // Suppression filter
    if (filters.suppression_flag !== 'all') {
      const showSuppressed = filters.suppression_flag === 'true';
      if (record.suppression_flag !== showSuppressed) {
        return false;
      }
    }

    return true;
  });

  // Get unique values for filters
  const uniqueProvenanceSources = Array.from(new Set(records.map(r => r.provenance_source)));
  const uniqueConsentMethods = Array.from(new Set(records.map(r => r.consent_method)));

  // Handle export
  const handleExport = async () => {
    if (onExport) {
      // Developer Note: Call POST /ledger/export with current filters
      // The backend should return CSV file
      onExport(filters);
    } else {
      // Fallback: client-side CSV generation
      const csvHeaders = [
        'Contact ID',
        'Email',
        'Phone',
        'Provenance Source',
        'Consent Method',
        'Consent Timestamp',
        'Consent IP',
        'Owner Confirmation',
        'Suppression Flag'
      ];
      
      const csvRows = filteredRecords.map(record => [
        record.contact_id,
        record.email,
        record.phone || '',
        record.provenance_source,
        record.consent_method,
        record.consent_timestamp,
        record.consent_ip,
        record.owner_confirmation ? 'Yes' : 'No',
        record.suppression_flag ? 'Yes' : 'No'
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `consent-ledger-${new Date().toISOString()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Handle row click
  const handleRowClick = async (record: ConsentLedgerRecord) => {
    setSelectedContact(record);
    setIsDrawerOpen(true);
    setIsLoadingHistory(true);

    if (onLoadContactHistory) {
      try {
        // Developer Note: Call GET /ledger/contacts/{contact_id}
        const history = await onLoadContactHistory(record.contact_id);
        setContactHistory(history);
      } catch (error) {
        console.error('Failed to load contact history:', error);
        setContactHistory([]);
      } finally {
        setIsLoadingHistory(false);
      }
    } else {
      // Mock history for demo
      setContactHistory([
        {
          event_id: '1',
          event_type: 'consent',
          timestamp: record.consent_timestamp,
          source: record.provenance_source,
          ip_address: record.consent_ip
        }
      ]);
      setIsLoadingHistory(false);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: '',
      provenance_source: 'all',
      consent_method: 'all',
      suppression_flag: 'all'
    });
  };

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => 
    key !== 'search' && value !== 'all'
  ).length;

  // Get icon for provenance source
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

  return (
    <div className="space-y-4">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="font-bold text-xl text-[#342E37]">Consent Ledger</h2>
          <p className="text-sm text-gray-600 mt-1">
            {filteredRecords.length} of {records.length} contacts
          </p>
        </div>
        <Button
          onClick={handleExport}
          variant="outline"
          size="sm"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="font-medium text-sm text-gray-900">Filters</span>
            {activeFilterCount > 0 && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                {activeFilterCount} active
              </span>
            )}
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear all
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search - data-binding: email, phone, contact_id */}
          <div className="col-span-1 sm:col-span-2">
            <LBInput
              label="Search"
              placeholder="Email, phone, or contact ID..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              icon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Provenance Source - data-binding: provenance_source */}
          <LBSelect
            label="Provenance Source"
            options={[
              { value: 'all', label: 'All Sources' },
              ...uniqueProvenanceSources.map(source => ({ value: source, label: source }))
            ]}
            value={filters.provenance_source}
            onChange={(value) => setFilters({ ...filters, provenance_source: value })}
          />

          {/* Suppression Flag - data-binding: suppression_flag */}
          <LBSelect
            label="Status"
            options={[
              { value: 'all', label: 'All' },
              { value: 'false', label: 'Active' },
              { value: 'true', label: 'Suppressed' }
            ]}
            value={filters.suppression_flag}
            onChange={(value) => setFilters({ ...filters, suppression_flag: value })}
          />
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Provenance
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Consent Method
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Consent Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredRecords.map((record, idx) => {
                const ProvenanceIcon = getProvenanceIcon(record.provenance_source);
                return (
                  <tr 
                    key={record.contact_id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleRowClick(record)}
                  >
                    {/* Contact - data-binding: email, phone */}
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{record.email}</p>
                        {record.phone && (
                          <p className="text-xs text-gray-600">{record.phone}</p>
                        )}
                      </div>
                    </td>

                    {/* Provenance - data-binding: provenance_source */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ProvenanceIcon className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-900">{record.provenance_source}</span>
                      </div>
                    </td>

                    {/* Consent Method - data-binding: consent_method */}
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900">{record.consent_method}</span>
                    </td>

                    {/* Consent Timestamp - data-binding: consent_timestamp */}
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900">
                        {new Date(record.consent_timestamp).toLocaleDateString()}
                      </span>
                    </td>

                    {/* Status - data-binding: suppression_flag, owner_confirmation */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {record.suppression_flag ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs font-medium w-fit">
                            <XCircle className="w-3 h-3" />
                            Suppressed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium w-fit">
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </span>
                        )}
                        {record.owner_confirmation && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium w-fit">
                            <CheckCircle className="w-3 h-3" />
                            Confirmed
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <button className="text-blue-600 hover:text-blue-800">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredRecords.length === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No contacts match your filters</p>
            <button
              onClick={resetFilters}
              className="text-sm text-blue-600 hover:text-blue-800 mt-2"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Contact Details Drawer - data-binding: GET /ledger/contacts/{contact_id} */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedContact && (
            <>
              <SheetHeader>
                <SheetTitle>Contact Details</SheetTitle>
                <SheetDescription>
                  Full consent and event history for {selectedContact.email}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Contact Info */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Contact ID</p>
                    <p className="text-sm font-mono text-gray-900">{selectedContact.contact_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Email</p>
                    <p className="text-sm font-medium text-gray-900">{selectedContact.email}</p>
                  </div>
                  {selectedContact.phone && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Phone</p>
                      <p className="text-sm text-gray-900">{selectedContact.phone}</p>
                    </div>
                  )}
                </div>

                {/* Consent Details */}
                <div>
                  <h3 className="font-bold text-sm text-gray-900 mb-3">Consent Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Provenance Source:</span>
                      <span className="font-medium text-gray-900">{selectedContact.provenance_source}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Consent Method:</span>
                      <span className="font-medium text-gray-900">{selectedContact.consent_method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Consent Date:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(selectedContact.consent_timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Consent IP:</span>
                      <span className="font-mono text-sm text-gray-900">{selectedContact.consent_ip}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Owner Confirmation:</span>
                      <span className="font-medium text-gray-900">
                        {selectedContact.owner_confirmation ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Suppression Flag:</span>
                      <span className="font-medium text-gray-900">
                        {selectedContact.suppression_flag ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Event History */}
                <div>
                  <h3 className="font-bold text-sm text-gray-900 mb-3">Event History</h3>
                  {isLoadingHistory ? (
                    <p className="text-sm text-gray-600">Loading history...</p>
                  ) : contactHistory.length > 0 ? (
                    <div className="space-y-3">
                      {contactHistory.map((event) => (
                        <div 
                          key={event.event_id}
                          className="border border-gray-200 rounded-lg p-3 bg-white"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              event.event_type === 'consent' ? 'bg-green-100 text-green-800' :
                              event.event_type === 'suppression' ? 'bg-red-100 text-red-800' :
                              event.event_type === 'confirmation' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {event.event_type}
                            </span>
                            <span className="text-xs text-gray-600">
                              {new Date(event.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">Source: {event.source}</p>
                          <p className="text-xs text-gray-600 font-mono">IP: {event.ip_address}</p>
                          {event.metadata && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                              <pre className="text-gray-700 overflow-x-auto">
                                {JSON.stringify(event.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No event history available</p>
                  )}
                </div>

                {/* Developer Notes */}
                <div className="text-xs text-gray-500 p-3 bg-gray-100 rounded border border-gray-200">
                  <strong>Developer Notes:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Row details bind to GET /ledger/contacts/{selectedContact.contact_id}</li>
                    <li>Export calls POST /ledger/export with current filter state</li>
                    <li>All timestamps stored as ISO8601 strings</li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Developer Notes Section */}
      <div className="text-xs text-gray-500 p-3 bg-gray-100 rounded border border-gray-200">
        <strong>Developer API Bindings:</strong>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Table data: GET /ledger/contacts (paginated)</li>
          <li>Export CSV: POST /ledger/export (returns CSV file with filtered records)</li>
          <li>Row details: GET /ledger/contacts/{'{'} contact_id{'}'} (returns event history)</li>
        </ul>
      </div>
    </div>
  );
}
