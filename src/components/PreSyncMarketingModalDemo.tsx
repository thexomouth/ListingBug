/**
 * PRE-SYNC MARKETING MODAL DEMO
 * 
 * PURPOSE: Demonstrate the PreSyncMarketingModal component
 * Shows different scenarios: high consent, low consent, blocking state
 */

import { useState } from 'react';
import { PreSyncMarketingModal, ValidationResult } from './consent/PreSyncMarketingModal';
import { LBButton } from './design-system/LBButton';
import { LBCard, LBCardHeader, LBCardTitle, LBCardContent } from './design-system/LBCard';
import { Shield, Send, Mail } from 'lucide-react';

export function PreSyncMarketingModalDemo() {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<'high' | 'low' | 'medium'>('high');

  // Mock sample contacts
  const mockSampleContacts = [
    {
      contact_id: 'cnt_001',
      email: 'jane.smith@example.com',
      phone: '+14155551234',
      consent_flag: true,
      consent_method: 'Email opt-in',
      provenance_source: 'Form'
    },
    {
      contact_id: 'cnt_002',
      email: 'john.doe@example.com',
      phone: '+14155552222',
      consent_flag: true,
      consent_method: 'Phone consent',
      provenance_source: 'Phone'
    },
    {
      contact_id: 'cnt_003',
      email: 'sarah.johnson@example.com',
      consent_flag: true,
      consent_method: 'Paper form',
      provenance_source: 'In-person'
    },
    {
      contact_id: 'cnt_004',
      email: 'michael.brown@example.com',
      consent_flag: false,
      consent_method: 'No consent',
      provenance_source: 'Imported'
    },
    {
      contact_id: 'cnt_005',
      email: 'emily.davis@example.com',
      phone: '+14155553333',
      consent_flag: false,
      consent_method: 'No consent',
      provenance_source: 'Imported'
    },
    {
      contact_id: 'cnt_006',
      email: 'robert.wilson@example.com',
      consent_flag: false,
      consent_method: 'No consent',
      provenance_source: 'Imported'
    },
    {
      contact_id: 'cnt_007',
      email: 'lisa.anderson@example.com',
      phone: '+14155554444',
      consent_flag: true,
      consent_method: 'Email verified',
      provenance_source: 'Form'
    }
  ];

  // Scenario configurations
  const scenarios = {
    high: {
      title: 'High Consent Rate (92%)',
      description: 'Most contacts have verified opt-in. Should proceed with confirmation.',
      validation: {
        consent_percentage: 92,
        suppression_count: 2,
        total_contacts: 100,
        verified_count: 92,
        sample_contacts: mockSampleContacts.map((c, i) => i < 5 ? { ...c, consent_flag: true } : c),
        risk_assessment: 'low' as const
      }
    },
    medium: {
      title: 'Medium Consent Rate (85%)',
      description: 'Acceptable consent rate with warning. Requires confirmation.',
      validation: {
        consent_percentage: 85,
        suppression_count: 3,
        total_contacts: 100,
        verified_count: 85,
        sample_contacts: mockSampleContacts,
        risk_assessment: 'medium' as const
      }
    },
    low: {
      title: 'Low Consent Rate (65%)',
      description: 'Below 80% threshold. Blocks push unless owner provides reason or sends confirmations.',
      validation: {
        consent_percentage: 65,
        suppression_count: 5,
        total_contacts: 100,
        verified_count: 65,
        sample_contacts: mockSampleContacts.map((c, i) => i > 2 ? { ...c, consent_flag: false } : c),
        risk_assessment: 'high' as const
      }
    }
  };

  const handleConfirm = (confirmationData: any) => {
    console.log('✅ Confirmation received:', confirmationData);
    alert(`Success! Action: ${confirmationData.action_type}\nReason: ${confirmationData.reason || 'N/A'}\nIdempotency Key: ${confirmationData.idempotency_key}`);
    setModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#342E37] mb-2">
            PreSyncMarketingModal Demo
          </h1>
          <p className="text-gray-600">
            Interactive modal for Tier C (high-risk) marketing destination confirmations
          </p>
        </div>

        {/* Scenario Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <LBCard 
            className={`cursor-pointer transition-all border-2 ${currentScenario === 'high' ? 'border-[#FFD447] bg-[#FFD447]/10' : 'border-gray-300'}`}
            onClick={() => setCurrentScenario('high')}
          >
            <LBCardHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <LBCardTitle className="text-base">High (92%)</LBCardTitle>
              </div>
            </LBCardHeader>
            <LBCardContent>
              <p className="text-sm text-gray-700">Most contacts verified. Ready to proceed.</p>
              <LBButton
                variant="primary"
                size="sm"
                className="w-full mt-3"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentScenario('high');
                  setModalOpen(true);
                }}
              >
                <Shield className="w-4 h-4 mr-2" />
                Try This Scenario
              </LBButton>
            </LBCardContent>
          </LBCard>

          <LBCard 
            className={`cursor-pointer transition-all border-2 ${currentScenario === 'medium' ? 'border-[#FFD447] bg-[#FFD447]/10' : 'border-gray-300'}`}
            onClick={() => setCurrentScenario('medium')}
          >
            <LBCardHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <LBCardTitle className="text-base">Medium (85%)</LBCardTitle>
              </div>
            </LBCardHeader>
            <LBCardContent>
              <p className="text-sm text-gray-700">Acceptable with warning. Confirmation required.</p>
              <LBButton
                variant="primary"
                size="sm"
                className="w-full mt-3"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentScenario('medium');
                  setModalOpen(true);
                }}
              >
                <Mail className="w-4 h-4 mr-2" />
                Try This Scenario
              </LBButton>
            </LBCardContent>
          </LBCard>

          <LBCard 
            className={`cursor-pointer transition-all border-2 ${currentScenario === 'low' ? 'border-[#FFD447] bg-[#FFD447]/10' : 'border-gray-300'}`}
            onClick={() => setCurrentScenario('low')}
          >
            <LBCardHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <LBCardTitle className="text-base">Low (65%)</LBCardTitle>
              </div>
            </LBCardHeader>
            <LBCardContent>
              <p className="text-sm text-gray-700">Below threshold. Requires owner action.</p>
              <LBButton
                variant="primary"
                size="sm"
                className="w-full mt-3"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentScenario('low');
                  setModalOpen(true);
                }}
              >
                <Send className="w-4 h-4 mr-2" />
                Try This Scenario
              </LBButton>
            </LBCardContent>
          </LBCard>
        </div>

        {/* Feature Overview */}
        <LBCard className="border-2 border-gray-300 mb-8">
          <LBCardHeader>
            <LBCardTitle>Component Features</LBCardTitle>
          </LBCardHeader>
          <LBCardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-sm text-[#342E37] mb-2">Plain English Copy</h3>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>✓ Title: "Confirm Marketing Setup"</li>
                  <li>✓ Summary: "Only send marketing to contacts who asked to hear from you."</li>
                  <li>✓ Required checkbox: "Confirm contacts that have explicitly opted in to receive marketing."</li>
                  <li>✓ Clear action descriptions</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#342E37] mb-2">Two Radio Options</h3>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>✓ Option 1: Mark as opted in now (requires reason)</li>
                  <li>✓ Option 2: Send confirmation first (shows projections)</li>
                  <li>✓ Blocks push if consent_rate {'<'} 80% without option 1 reason</li>
                  <li>✓ Estimated delivery & opt-in projection for option 2</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#342E37] mb-2">Display Components</h3>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>✓ Sample table (max 5 rows)</li>
                  <li>✓ Consent percentage visualization</li>
                  <li>✓ Suppression count display</li>
                  <li>✓ Color-coded status indicators</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#342E37] mb-2">Developer Annotations</h3>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>✓ POST /api/ledger/validate (pre-check)</li>
                  <li>✓ POST /api/ledger/events (owner actions)</li>
                  <li>✓ Idempotency key generation</li>
                  <li>✓ All actions logged with owner_id, timestamp, IP</li>
                </ul>
              </div>
            </div>
          </LBCardContent>
        </LBCard>

        {/* Behavior Documentation */}
        <LBCard className="border-2 border-gray-300">
          <LBCardHeader>
            <LBCardTitle>Modal Behavior</LBCardTitle>
          </LBCardHeader>
          <LBCardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-sm text-[#342E37] mb-2">Blocking Logic</h3>
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3 text-xs text-red-900">
                  <p className="font-bold mb-1">If consent_rate {'<'} 0.8 (80%):</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Modal blocks "Confirm & Proceed" button</li>
                    <li>User MUST select Option 1 and provide reason, OR</li>
                    <li>User selects Option 2 to send confirmations first</li>
                    <li>Cannot proceed without explicit owner action</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-sm text-[#342E37] mb-2">Option 1: Mark as Opted In</h3>
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3 text-xs text-gray-800">
                  <p className="font-bold mb-1">When selected:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Requires short reason input (200 chars max)</li>
                    <li>Logs to POST /api/ledger/events with action=owner_mark_opt_in</li>
                    <li>Calls POST /api/consent/mark-opted-in to update contacts</li>
                    <li>Includes idempotency_key, owner_id, timestamp, IP, reason</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-sm text-[#342E37] mb-2">Option 2: Send Confirmation Campaign</h3>
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3 text-xs text-gray-800">
                  <p className="font-bold mb-1">When selected:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Shows estimated delivery time (10 minutes)</li>
                    <li>Displays expected opt-in projection (~65% response rate)</li>
                    <li>Logs to POST /api/ledger/events with action=owner_request_confirmation</li>
                    <li>Triggers POST /api/campaigns/confirmation to send requests</li>
                    <li>Automation starts after contacts confirm (24-48 hours)</li>
                  </ul>
                </div>
              </div>
            </div>
          </LBCardContent>
        </LBCard>

        {/* Usage Example */}
        <div className="mt-8 bg-gray-900 border-2 border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Usage Example</h2>
          <pre className="text-green-400 text-xs font-mono overflow-x-auto">
{`import { PreSyncMarketingModal } from './consent/PreSyncMarketingModal';

<PreSyncMarketingModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  destinationName="Mailchimp"
  destinationType="mailchimp"
  riskTier="high"
  validationResult={{
    consent_percentage: 85,
    suppression_count: 3,
    total_contacts: 100,
    verified_count: 85,
    sample_contacts: contacts,
    risk_assessment: 'medium'
  }}
  onConfirm={(data) => {
    console.log('Confirmed:', data);
    // Proceed with automation creation
  }}
  ownerId={currentUser.id}
/>`}
          </pre>
        </div>
      </div>

      {/* Modal Instance */}
      <PreSyncMarketingModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        destinationName="Mailchimp"
        destinationType="mailchimp"
        riskTier="high"
        validationResult={scenarios[currentScenario].validation}
        onConfirm={handleConfirm}
        ownerId="owner_demo_123"
      />
    </div>
  );
}
