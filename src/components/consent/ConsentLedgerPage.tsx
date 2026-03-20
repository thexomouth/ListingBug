/**
 * CONSENT LEDGER PAGE
 * Full-page component for managing consent and compliance
 * 
 * Accessible from: Settings → Compliance / Consent Ledger
 */

import { useState } from 'react';
import { Shield, Download, FileText, AlertTriangle } from 'lucide-react';
import { ConsentLedgerTable, ConsentLedgerRecord, ConsentEventHistory } from './ConsentLedgerTable';
import { Button } from '../ui/button';

/**
 * Mock Data - Replace with API calls
 * Developer Note: GET /ledger/contacts should return paginated records
 */
const mockConsentRecords: ConsentLedgerRecord[] = [
  {
    contact_id: 'cnt_001',
    email: 'jane.smith@example.com',
    phone: '+14155551234',
    provenance_source: 'Form',
    consent_method: 'Website opt-in checkbox',
    consent_timestamp: '2024-01-15T14:32:18Z',
    consent_ip: '192.168.1.100',
    owner_confirmation: true,
    suppression_flag: false
  },
  {
    contact_id: 'cnt_002',
    email: 'john.doe@example.com',
    phone: '+14155559876',
    provenance_source: 'Imported',
    consent_method: 'CSV import - 2023 Open House',
    consent_timestamp: '2023-06-10T09:15:00Z',
    consent_ip: '10.0.0.1',
    owner_confirmation: false,
    suppression_flag: true
  },
  {
    contact_id: 'cnt_003',
    email: 'sarah.johnson@example.com',
    phone: '+14155552222',
    provenance_source: 'Phone',
    consent_method: 'Phone call consent recording',
    consent_timestamp: '2024-02-20T11:45:00Z',
    consent_ip: '192.168.1.105',
    owner_confirmation: true,
    suppression_flag: false
  },
  {
    contact_id: 'cnt_004',
    email: 'michael.brown@example.com',
    phone: '',
    provenance_source: 'Form',
    consent_method: 'Landing page form submission',
    consent_timestamp: '2024-03-01T08:22:00Z',
    consent_ip: '192.168.1.110',
    owner_confirmation: true,
    suppression_flag: false
  },
  {
    contact_id: 'cnt_005',
    email: 'emily.davis@example.com',
    phone: '+14155553333',
    provenance_source: 'In-person',
    consent_method: 'Trade show sign-up sheet',
    consent_timestamp: '2024-02-15T16:00:00Z',
    consent_ip: '10.0.0.2',
    owner_confirmation: true,
    suppression_flag: false
  },
  {
    contact_id: 'cnt_006',
    email: 'robert.wilson@example.com',
    phone: '+14155554444',
    provenance_source: 'Imported',
    consent_method: 'Legacy database import',
    consent_timestamp: '2023-01-01T00:00:00Z',
    consent_ip: '10.0.0.1',
    owner_confirmation: false,
    suppression_flag: false
  },
  {
    contact_id: 'cnt_007',
    email: 'linda.martinez@example.com',
    phone: '+14155555555',
    provenance_source: 'Form',
    consent_method: 'Newsletter signup - Homepage',
    consent_timestamp: '2024-03-10T14:15:00Z',
    consent_ip: '192.168.1.115',
    owner_confirmation: true,
    suppression_flag: false
  },
  {
    contact_id: 'cnt_008',
    email: 'david.garcia@example.com',
    phone: '',
    provenance_source: 'API',
    consent_method: 'Zapier integration - Facebook Lead Ads',
    consent_timestamp: '2024-03-05T10:30:00Z',
    consent_ip: '203.0.113.5',
    owner_confirmation: true,
    suppression_flag: false
  }
];

export function ConsentLedgerPage() {
  const [records] = useState<ConsentLedgerRecord[]>(mockConsentRecords);

  // Calculate summary stats
  const totalContacts = records.length;
  const verifiedOptIn = records.filter(r => !r.suppression_flag && r.owner_confirmation).length;
  const suppressed = records.filter(r => r.suppression_flag).length;
  const missingConsent = records.filter(r => !r.owner_confirmation && !r.suppression_flag).length;

  /**
   * Handle CSV Export
   * Developer Note: Call POST /ledger/export
   */
  const handleExport = (filters: any) => {
    console.log('Exporting with filters:', filters);
    // In production, this would call the API endpoint
    // fetch('/ledger/export', { method: 'POST', body: JSON.stringify(filters) })
  };

  /**
   * Load contact history
   * Developer Note: Call GET /ledger/contacts/{contact_id}
   */
  const handleLoadContactHistory = async (contactId: string): Promise<ConsentEventHistory[]> => {
    console.log('Loading history for contact:', contactId);
    // Mock history - in production, fetch from API
    return [
      {
        event_id: 'evt_001',
        event_type: 'consent',
        timestamp: '2024-01-15T14:32:18Z',
        source: 'Website Form',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        metadata: {
          form_url: 'https://listingbug.com/contact',
          campaign_source: 'google_ads'
        }
      },
      {
        event_id: 'evt_002',
        event_type: 'confirmation',
        timestamp: '2024-01-16T09:00:00Z',
        source: 'Owner Dashboard',
        ip_address: '192.168.1.50',
        metadata: {
          owner_id: 'owner_123',
          confirmation_type: 'bulk_review'
        }
      }
    ];
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-8 h-8 text-[#342E37]" />
                <h1 className="text-[32px] font-bold text-[#342E37]">Consent Ledger</h1>
              </div>
              <p className="text-[15px] text-gray-600">
                Complete audit trail of contact consent, provenance, and suppression status
              </p>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] text-blue-700 mb-1">Total Contacts</p>
                  <p className="text-[24px] font-bold text-blue-900">{totalContacts}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600 opacity-50" />
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] text-green-700 mb-1">Verified Opt-in</p>
                  <p className="text-[24px] font-bold text-green-900">{verifiedOptIn}</p>
                  <p className="text-[11px] text-green-700">
                    {((verifiedOptIn / totalContacts) * 100).toFixed(0)}% of total
                  </p>
                </div>
                <Shield className="w-8 h-8 text-green-600 opacity-50" />
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] text-red-700 mb-1">Suppressed</p>
                  <p className="text-[24px] font-bold text-red-900">{suppressed}</p>
                  <p className="text-[11px] text-red-700">Unsubscribed/Bounced</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600 opacity-50" />
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] text-yellow-700 mb-1">Missing Consent</p>
                  <p className="text-[24px] font-bold text-yellow-900">{missingConsent}</p>
                  <p className="text-[11px] text-yellow-700">Needs review</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-600 opacity-50" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-[14px] font-medium text-blue-900 mb-1">
                Why Consent Tracking Matters
              </p>
              <p className="text-[13px] text-blue-800">
                This ledger tracks where every contact came from and when they opted in. 
                This protects you from legal issues with CAN-SPAM, GDPR, and CASL compliance. 
                Only send marketing to contacts with verified opt-in.
              </p>
            </div>
          </div>
        </div>

        {/* Consent Ledger Table */}
        <ConsentLedgerTable
          records={records}
          onExport={handleExport}
          onLoadContactHistory={handleLoadContactHistory}
        />

        {/* Developer Notes */}
        <div className="mt-6 p-4 bg-gray-100 border border-gray-200 rounded-lg">
          <p className="text-sm font-bold text-gray-900 mb-2">Developer Integration Notes:</p>
          <ul className="list-disc list-inside text-xs text-gray-700 space-y-1">
            <li><strong>GET /ledger/contacts</strong> - Fetch paginated consent records (supports filters)</li>
            <li><strong>GET /ledger/contacts/{'{'} contact_id{'}'}</strong> - Fetch individual contact event history</li>
            <li><strong>POST /ledger/export</strong> - Export filtered records to CSV</li>
            <li><strong>POST /ledger/events</strong> - Log new consent/suppression events</li>
            <li><strong>PATCH /ledger/contacts/{'{'} contact_id{'}'}</strong> - Update contact consent status</li>
            <li>All timestamps stored as ISO8601 format</li>
            <li>Suppression sync via ESP webhooks (Mailchimp, ActiveCampaign, etc.)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
