/**
 * PRE-SYNC MARKETING MODAL - Tier C Confirmation
 * Component name: PreSyncMarketingModal
 * 
 * PURPOSE: Required confirmation modal for high-risk marketing destinations (Tier C)
 * Requires explicit owner action before pushing to marketing platforms
 * 
 * TRIGGER CONDITIONS:
 * - destination.risk_tier === 'high' (Mailchimp, ActiveCampaign, SendGrid, etc.)
 * - User clicks "Approve" or "Create Automation" button
 * 
 * BEHAVIOR:
 * - Block push if consent_percentage < 0.8 (80%) unless owner marks as opted in with reason
 * - Require explicit checkbox confirmation
 * - Offer two options: mark as opted in now OR send confirmation campaign first
 * - Log all owner actions to /api/ledger/events with idempotency_key
 * 
 * DEVELOPER FIELD NAMES & DATA BINDINGS:
 * - destination_name: string
 * - destination_type: string (mailchimp, activecampaign, sendgrid, etc.)
 * - risk_tier: 'low' | 'medium' | 'high'
 * - sample_contacts: Array<{contact_id, email, phone, consent_flag}>
 * - consent_percentage: number (0-100)
 * - suppression_count: number
 * - owner_id: string
 * - confirmation_timestamp: ISO8601
 * - confirmation_ip: string
 * - idempotency_key: UUID
 * 
 * API ENDPOINTS:
 * - POST /api/ledger/validate - Validate consent before push
 * - POST /api/ledger/events - Log owner actions (owner_mark_opt_in, owner_request_confirmation)
 * - POST /api/consent/mark-opted-in - Bulk mark contacts as opted in
 * - POST /api/campaigns/confirmation - Trigger opt-in confirmation campaign
 */

import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ExternalLink,
  Send,
  UserCheck,
  Clock,
  TrendingUp
} from 'lucide-react';
import { LBButton } from '../design-system/LBButton';
import { toast } from 'sonner@2.0.3';

/**
 * DATA BINDING INTERFACES
 */
export interface ContactSample {
  contact_id: string;
  email: string;
  phone?: string;
  consent_flag: boolean;
  consent_method?: string;
  provenance_source?: string;
}

export interface ValidationResult {
  consent_percentage: number;
  suppression_count: number;
  total_contacts: number;
  verified_count: number;
  sample_contacts: ContactSample[];
  risk_assessment: 'low' | 'medium' | 'high';
}

interface PreSyncMarketingModalProps {
  isOpen: boolean;
  onClose: () => void;
  destinationName: string;
  destinationType: string;
  riskTier: 'low' | 'medium' | 'high';
  validationResult: ValidationResult;
  onConfirm: (confirmationData: {
    owner_id: string;
    confirmation_timestamp: string;
    confirmation_ip: string;
    idempotency_key: string;
    consent_acknowledged: boolean;
    action_type: 'owner_mark_opt_in' | 'owner_request_confirmation';
    reason?: string;
  }) => void;
  ownerId: string;
}

/**
 * COMPONENT: PreSyncMarketingModal
 * Tier C confirmation modal with two-option flow
 */
export function PreSyncMarketingModal({
  isOpen,
  onClose,
  destinationName,
  destinationType,
  riskTier,
  validationResult,
  onConfirm,
  ownerId
}: PreSyncMarketingModalProps) {
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'mark_opted_in' | 'send_confirmation' | null>(null);
  const [ownerReason, setOwnerReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientIp, setClientIp] = useState<string>('');

  // Fetch client IP on mount
  useEffect(() => {
    // In production, call your IP detection service
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setClientIp(data.ip))
      .catch(() => setClientIp('0.0.0.0'));
  }, []);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setConfirmationChecked(false);
      setSelectedOption(null);
      setOwnerReason('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const { consent_percentage, suppression_count, total_contacts, verified_count, sample_contacts } = validationResult;
  
  // Determine if push should be blocked
  const shouldBlock = consent_percentage < 80;
  const isWarning = consent_percentage >= 80 && consent_percentage < 90;
  const missingConsentCount = total_contacts - verified_count;

  /**
   * GENERATE IDEMPOTENCY KEY
   * UUID to prevent duplicate submissions
   */
  const generateIdempotencyKey = () => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  };

  /**
   * HANDLE CONFIRMATION
   * 
   * DEVELOPER NOTES:
   * - Calls POST /api/ledger/validate before proceeding
   * - Generates idempotency_key (UUID)
   * - Logs to POST /api/ledger/events with action_type
   * - For option 1: Calls POST /api/consent/mark-opted-in
   * - For option 2: Calls POST /api/campaigns/confirmation
   */
  const handleConfirm = async () => {
    if (!confirmationChecked) {
      toast.error('Please confirm the checkbox');
      return;
    }

    if (!selectedOption) {
      toast.error('Please select an option');
      return;
    }

    if (selectedOption === 'mark_opted_in' && !ownerReason.trim()) {
      toast.error('Please provide a reason for marking contacts as opted in');
      return;
    }

    setIsSubmitting(true);

    try {
      const idempotency_key = generateIdempotencyKey();
      const confirmation_timestamp = new Date().toISOString();

      // Step 1: Validate consent
      console.log('📊 POST /api/ledger/validate', {
        destination_type: destinationType,
        consent_percentage,
        total_contacts,
        verified_count,
        owner_id: ownerId,
        timestamp: confirmation_timestamp
      });

      const confirmationData = {
        owner_id: ownerId,
        confirmation_timestamp,
        confirmation_ip: clientIp,
        idempotency_key,
        consent_acknowledged: true,
        action_type: selectedOption,
        reason: selectedOption === 'mark_opted_in' ? ownerReason : undefined
      };

      // Step 2: Log owner action
      console.log('📊 POST /api/ledger/events', {
        event_type: 'owner_action',
        action: selectedOption,
        owner_id: ownerId,
        destination_type: destinationType,
        destination_name: destinationName,
        contact_count: total_contacts,
        missing_consent_count: missingConsentCount,
        consent_percentage,
        reason: confirmationData.reason,
        timestamp: confirmation_timestamp,
        ip: clientIp,
        idempotency_key
      });

      // Step 3: Execute selected action
      if (selectedOption === 'mark_opted_in') {
        // Option 1: Mark contacts as opted in
        console.log('✅ POST /api/consent/mark-opted-in', {
          contact_ids: sample_contacts.filter(c => !c.consent_flag).map(c => c.contact_id),
          owner_id: ownerId,
          reason: ownerReason,
          consent_method: 'owner_confirmation',
          consent_timestamp: confirmation_timestamp,
          consent_ip: clientIp,
          idempotency_key
        });

        toast.success('Contacts marked as opted in', {
          description: `${missingConsentCount} contacts updated with owner confirmation`
        });
      } else {
        // Option 2: Send confirmation campaign
        console.log('📧 POST /api/campaigns/confirmation', {
          contact_ids: sample_contacts.filter(c => !c.consent_flag).map(c => c.contact_id),
          owner_id: ownerId,
          campaign_type: 'opt_in_confirmation',
          destination_name: destinationName,
          idempotency_key
        });

        toast.success('Confirmation campaign initiated', {
          description: 'Opt-in requests will be sent within 10 minutes'
        });
      }

      // Call parent handler
      onConfirm(confirmationData);
      
    } catch (error) {
      console.error('Failed to confirm:', error);
      toast.error('Failed to process confirmation', {
        description: 'Please try again or contact support'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate estimated opt-in projection for option 2
  const estimatedOptInRate = 0.65; // 65% typical opt-in rate for confirmation campaigns
  const projectedOptIns = Math.round(missingConsentCount * estimatedOptInRate);
  const projectedFinalRate = ((verified_count + projectedOptIns) / total_contacts) * 100;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* HEADER */}
            <div className={`px-6 py-4 border-b-2 ${shouldBlock ? 'bg-red-50 border-red-300' : isWarning ? 'bg-yellow-50 border-yellow-300' : 'bg-blue-50 border-blue-300'}`}>
              <div className="flex items-center gap-3 mb-2">
                {shouldBlock ? (
                  <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                ) : isWarning ? (
                  <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                ) : (
                  <Shield className="w-6 h-6 text-blue-600 flex-shrink-0" />
                )}
                <h2 className={`text-xl font-bold ${shouldBlock ? 'text-red-900' : isWarning ? 'text-yellow-900' : 'text-blue-900'}`}>
                  Confirm Marketing Setup
                </h2>
              </div>
              <p className={`text-sm font-bold ${shouldBlock ? 'text-red-800' : isWarning ? 'text-yellow-800' : 'text-blue-800'}`}>
                Only send marketing to contacts who asked to hear from you.
              </p>
            </div>

            {/* CONTENT */}
            <div className="p-6 space-y-6">
              {/* SUMMARY STATS */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-[#342E37]">{total_contacts}</div>
                  <div className="text-xs text-gray-600 mt-1">Total Contacts</div>
                </div>
                <div className={`border-2 rounded-lg p-4 text-center ${verified_count >= total_contacts * 0.9 ? 'bg-green-50 border-green-300' : verified_count >= total_contacts * 0.8 ? 'bg-yellow-50 border-yellow-300' : 'bg-red-50 border-red-300'}`}>
                  <div className={`text-2xl font-bold ${verified_count >= total_contacts * 0.9 ? 'text-green-800' : verified_count >= total_contacts * 0.8 ? 'text-yellow-800' : 'text-red-800'}`}>
                    {consent_percentage.toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Consent Rate</div>
                </div>
                <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-[#342E37]">{suppression_count}</div>
                  <div className="text-xs text-gray-600 mt-1">Suppressed</div>
                </div>
              </div>

              {/* SAMPLE TABLE */}
              <div>
                <h3 className="font-bold text-sm text-[#342E37] mb-3">Sample Contacts (Max 5 Rows)</h3>
                <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 border-b-2 border-gray-300">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-700">Email</th>
                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-700">Phone</th>
                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-700">Consent</th>
                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-700">Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sample_contacts.slice(0, 5).map((contact, idx) => (
                        <tr key={contact.contact_id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-2 text-xs font-medium">{contact.email}</td>
                          <td className="px-4 py-2 text-xs text-gray-600">{contact.phone || '—'}</td>
                          <td className="px-4 py-2">
                            {contact.consent_flag ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 border border-green-300 text-green-800 rounded text-xs font-bold">
                                <CheckCircle className="w-3 h-3" />
                                Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 border border-red-300 text-red-800 rounded text-xs font-bold">
                                <XCircle className="w-3 h-3" />
                                Missing
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-600">{contact.provenance_source || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Showing first 5 of {total_contacts} contacts. All contacts will be validated before sync.
                </p>
              </div>

              {/* REQUIRED CHECKBOX */}
              <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmationChecked}
                    onChange={(e) => setConfirmationChecked(e.target.checked)}
                    className="mt-1 w-4 h-4 border-2 border-gray-400 rounded"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#342E37]">
                      Confirm contacts that have explicitly opted in to receive marketing.
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      By checking this box, I acknowledge that sending to contacts without consent may violate 
                      CAN-SPAM, GDPR, and CASL regulations.
                    </p>
                  </div>
                </label>
              </div>

              {/* TWO RADIO OPTIONS */}
              {confirmationChecked && (
                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-[#342E37]">Choose how to proceed:</h3>

                  {/* OPTION 1: MARK AS OPTED IN NOW */}
                  <div 
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedOption === 'mark_opted_in' 
                        ? 'border-[#FFD447] bg-[#FFD447]/10' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => setSelectedOption('mark_opted_in')}
                  >
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="consent-option"
                        checked={selectedOption === 'mark_opted_in'}
                        onChange={() => setSelectedOption('mark_opted_in')}
                        className="mt-1 w-4 h-4"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <UserCheck className="w-4 h-4 text-green-700" />
                          <p className="text-sm font-bold text-[#342E37]">
                            Mark selected contacts as opted in now
                          </p>
                        </div>
                        <p className="text-xs text-gray-700 mb-2">
                          Use this if you have offline consent records or verbal agreements. You'll need to provide a reason.
                        </p>
                        
                        {selectedOption === 'mark_opted_in' && (
                          <div className="mt-3">
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                              Reason for marking as opted in (required):
                            </label>
                            <input
                              type="text"
                              value={ownerReason}
                              onChange={(e) => setOwnerReason(e.target.value)}
                              placeholder="e.g., Verbal consent during phone call, signed paper forms, etc."
                              className="w-full px-3 py-2 border-2 border-gray-300 rounded text-sm"
                              maxLength={200}
                            />
                            <p className="text-xs text-gray-600 mt-1">
                              {ownerReason.length}/200 characters · This will be logged to /api/ledger/events
                            </p>
                          </div>
                        )}

                        {shouldBlock && selectedOption === 'mark_opted_in' && ownerReason.trim() && (
                          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-300 rounded">
                            <p className="text-xs text-yellow-900">
                              ⚠️ <strong>Warning:</strong> Consent rate is below 80%. By providing a reason and confirming, 
                              you acknowledge full responsibility for compliance with marketing regulations.
                            </p>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>

                  {/* OPTION 2: SEND CONFIRMATION FIRST */}
                  <div 
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedOption === 'send_confirmation' 
                        ? 'border-[#FFD447] bg-[#FFD447]/10' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => setSelectedOption('send_confirmation')}
                  >
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="consent-option"
                        checked={selectedOption === 'send_confirmation'}
                        onChange={() => setSelectedOption('send_confirmation')}
                        className="mt-1 w-4 h-4"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Send className="w-4 h-4 text-blue-700" />
                          <p className="text-sm font-bold text-[#342E37]">
                            Send opt-in confirmation message first
                          </p>
                        </div>
                        <p className="text-xs text-gray-700 mb-2">
                          We'll send a confirmation email to contacts missing consent, asking them to verify their opt-in.
                        </p>
                        
                        {selectedOption === 'send_confirmation' && (
                          <div className="mt-3 space-y-2">
                            <div className="flex items-start gap-2 text-xs text-gray-700">
                              <Clock className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <strong>Estimated delivery:</strong> Within 10 minutes
                                <br />
                                <span className="text-gray-600">{missingConsentCount} contacts will receive confirmation request</span>
                              </div>
                            </div>
                            <div className="flex items-start gap-2 text-xs text-gray-700">
                              <TrendingUp className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <strong>Expected opt-in projection:</strong> ~{(estimatedOptInRate * 100).toFixed(0)}% response rate
                                <br />
                                <span className="text-gray-600">
                                  Final consent rate: ~{projectedFinalRate.toFixed(0)}% ({verified_count + projectedOptIns} of {total_contacts})
                                </span>
                              </div>
                            </div>
                            <div className="mt-3 p-2 bg-blue-50 border border-blue-300 rounded">
                              <p className="text-xs text-blue-900">
                                ℹ️ Your automation will start syncing after contacts confirm their opt-in (typically 24-48 hours).
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* BLOCKING MESSAGE */}
              {shouldBlock && (!selectedOption || (selectedOption === 'mark_opted_in' && !ownerReason.trim())) && (
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-red-900 mb-1">
                        Cannot proceed with consent rate below 80%
                      </p>
                      <p className="text-xs text-red-800">
                        To proceed, you must either:
                      </p>
                      <ul className="text-xs text-red-800 list-disc list-inside mt-2 space-y-1">
                        <li>Select Option 1 and provide a reason for marking contacts as opted in</li>
                        <li>Select Option 2 to send confirmation requests first (recommended)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* ACTIONS */}
              <div className="flex items-center justify-between pt-4 border-t-2 border-gray-300">
                <LBButton
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </LBButton>
                
                <LBButton
                  variant="primary"
                  onClick={handleConfirm}
                  disabled={
                    !confirmationChecked || 
                    !selectedOption || 
                    (selectedOption === 'mark_opted_in' && !ownerReason.trim()) ||
                    isSubmitting
                  }
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#342E37] border-t-transparent rounded-full animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {selectedOption === 'mark_opted_in' ? 'Confirm & Proceed' : 'Send Confirmations & Proceed'}
                    </>
                  )}
                </LBButton>
              </div>

              {/* DEVELOPER NOTES */}
              <div className="bg-gray-900 border-2 border-gray-700 rounded-lg p-3 font-mono text-xs">
                <p className="text-white font-bold mb-2">📊 Developer Annotations</p>
                <div className="text-green-400 space-y-1">
                  <p><span className="text-yellow-400">API:</span> POST /api/ledger/validate (pre-check)</p>
                  <p><span className="text-yellow-400">Event:</span> POST /api/ledger/events (owner_mark_opt_in or owner_request_confirmation)</p>
                  <p><span className="text-yellow-400">Action 1:</span> POST /api/consent/mark-opted-in (if option 1)</p>
                  <p><span className="text-yellow-400">Action 2:</span> POST /api/campaigns/confirmation (if option 2)</p>
                  <p><span className="text-yellow-400">Key:</span> idempotency_key = UUID (prevents duplicates)</p>
                  <p><span className="text-yellow-400">Logged:</span> owner_id, timestamp, IP, reason</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
