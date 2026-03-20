/**
 * CONSENT PROVENANCE PANEL DEMO
 * 
 * PURPOSE: Demonstrate the interactive ConsentProvenancePanel component
 * Shows all features: badges, action menus, expandable details, per-row actions
 */

import { ConsentProvenancePanel } from './consent/ConsentProvenancePanel';

export function ConsentProvenancePanelDemo() {
  // Mock data for demonstration
  const mockSummary = {
    total_contacts: 65,
    verified_opt_in_count: 58,
    verified_opt_in_percentage: 89.2,
    missing_consent_count: 7,
    provenance_breakdown: {
      'Form': 45,
      'Phone': 8,
      'In-person': 5,
      'Imported': 7
    }
  };

  const mockSampleContacts = [
    {
      contact_id: 'cnt_001',
      contact_name: 'Jane Smith',
      contact_email: 'jane.smith@example.com',
      contact_phone: '+14155551234',
      provenance_source: 'Form' as const,
      provenance_method: 'Website opt-in form',
      provenance_timestamp: '2024-11-15T10:30:00Z',
      consent_flag: true,
      consent_method: 'Email opt-in checkbox',
      consent_timestamp: '2024-11-15T10:30:00Z',
      consent_ip: '192.168.1.1'
    },
    {
      contact_id: 'cnt_002',
      contact_name: 'John Doe',
      contact_email: 'john.doe@example.com',
      provenance_source: 'Phone' as const,
      provenance_method: 'Phone verification',
      provenance_timestamp: '2024-11-20T14:20:00Z',
      consent_flag: true,
      consent_method: 'Verbal consent recorded',
      consent_timestamp: '2024-11-20T14:20:00Z',
      consent_ip: '192.168.1.2'
    },
    {
      contact_id: 'cnt_003',
      contact_name: 'Sarah Johnson',
      contact_email: 'sarah.johnson@example.com',
      contact_phone: '+14155552222',
      provenance_source: 'In-person' as const,
      provenance_method: 'Trade show signup',
      provenance_timestamp: '2024-10-05T09:00:00Z',
      consent_flag: true,
      consent_method: 'Paper form signed',
      consent_timestamp: '2024-10-05T09:00:00Z',
      consent_ip: '192.168.1.3'
    },
    {
      contact_id: 'cnt_004',
      contact_name: 'Michael Brown',
      contact_email: 'michael.brown@example.com',
      provenance_source: 'Imported' as const,
      provenance_method: 'CSV import',
      provenance_timestamp: '2024-09-01T08:00:00Z',
      consent_flag: false,
      consent_method: 'No consent recorded',
      consent_timestamp: '',
      consent_ip: ''
    },
    {
      contact_id: 'cnt_005',
      contact_name: 'Emily Davis',
      contact_email: 'emily.davis@example.com',
      contact_phone: '+14155553333',
      provenance_source: 'Form' as const,
      provenance_method: 'Email subscription',
      provenance_timestamp: '2024-11-28T16:45:00Z',
      consent_flag: true,
      consent_method: 'Double opt-in confirmed',
      consent_timestamp: '2024-11-28T16:50:00Z',
      consent_ip: '192.168.1.4'
    },
    {
      contact_id: 'cnt_006',
      contact_name: 'Robert Wilson',
      contact_email: 'robert.wilson@example.com',
      provenance_source: 'Imported' as const,
      provenance_method: 'Partner list import',
      provenance_timestamp: '2024-08-15T12:00:00Z',
      consent_flag: false,
      consent_method: 'No consent',
      consent_timestamp: '',
      consent_ip: ''
    },
    {
      contact_id: 'cnt_007',
      contact_name: 'Lisa Anderson',
      contact_email: 'lisa.anderson@example.com',
      contact_phone: '+14155555555',
      provenance_source: 'Phone' as const,
      provenance_method: 'Cold call follow-up',
      provenance_timestamp: '2024-11-01T15:30:00Z',
      consent_flag: true,
      consent_method: 'Verbal opt-in confirmed',
      consent_timestamp: '2024-11-01T15:30:00Z',
      consent_ip: '192.168.1.5'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#342E37] mb-2">
            ConsentProvenancePanel Component Demo
          </h1>
          <p className="text-gray-600">
            Interactive component showing contact provenance and consent status with owner actions
          </p>
        </div>

        {/* Component Demo */}
        <div className="space-y-8">
          {/* High Consent Rate Example */}
          <div>
            <h2 className="text-xl font-bold text-[#342E37] mb-4">
              Example 1: High Consent Rate (89.2%)
            </h2>
            <ConsentProvenancePanel
              summary={mockSummary}
              sampleContacts={mockSampleContacts}
              onViewLedger={() => window.open('/settings/consent-ledger', '_blank')}
              showConciergeButton={false}
              ownerId="owner_demo"
            />
          </div>

          {/* Low Consent Rate Example */}
          <div>
            <h2 className="text-xl font-bold text-[#342E37] mb-4">
              Example 2: Low Consent Rate (65%) - Shows Concierge CTA
            </h2>
            <ConsentProvenancePanel
              summary={{
                total_contacts: 100,
                verified_opt_in_count: 65,
                verified_opt_in_percentage: 65,
                missing_consent_count: 35,
                provenance_breakdown: {
                  'Form': 30,
                  'Phone': 15,
                  'In-person': 20,
                  'Imported': 35
                }
              }}
              sampleContacts={mockSampleContacts}
              onViewLedger={() => window.open('/settings/consent-ledger', '_blank')}
              showConciergeButton={true}
              onConciergeClick={() => alert('Concierge review requested!')}
              ownerId="owner_demo"
            />
          </div>

          {/* Feature Highlights */}
          <div className="bg-white border-2 border-gray-300 rounded-lg p-6">
            <h2 className="text-xl font-bold text-[#342E37] mb-4">Component Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-bold text-[#342E37]">Interactive Elements</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>✓ Dynamic summary line with live counts</li>
                  <li>✓ Provenance badges with status dots (green/yellow/red)</li>
                  <li>✓ Badge action menus: Review, Mark Opted In, Send Confirmation, Exclude</li>
                  <li>✓ Expandable details drawer</li>
                  <li>✓ Per-row actions in sample table</li>
                  <li>✓ Tooltip with "Why this matters" microcopy</li>
                  <li>✓ "View consent ledger" link</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-[#342E37]">Developer Annotations</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>✓ All API endpoints documented</li>
                  <li>✓ Field bindings annotated in code</li>
                  <li>✓ Owner actions POST to /api/ledger/events</li>
                  <li>✓ Idempotency key generated for each action</li>
                  <li>✓ Event schema fully documented</li>
                  <li>✓ TypeScript interfaces for all data structures</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Usage Example */}
          <div className="bg-gray-900 border-2 border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Usage Example</h2>
            <pre className="text-green-400 text-xs font-mono overflow-x-auto">
{`import { ConsentProvenancePanel } from './consent/ConsentProvenancePanel';

<ConsentProvenancePanel
  summary={{
    total_contacts: 65,
    verified_opt_in_count: 58,
    verified_opt_in_percentage: 89.2,
    missing_consent_count: 7,
    provenance_breakdown: {
      'Form': 45,
      'Phone': 8,
      'In-person': 5,
      'Imported': 7
    }
  }}
  sampleContacts={contactRecords}
  onViewLedger={() => window.open('/consent-ledger', '_blank')}
  showConciergeButton={true}
  onConciergeClick={() => requestConcierge()}
  ownerId={currentUser.id}
/>`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
