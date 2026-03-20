/**
 * ACTIVATE AUTOMATION MODAL - Simplified 2-Step Flow
 * 
 * Steps:
 * 1. Preview & Test - Show preview payload and send test
 * 2. Activate - Integration-specific config + activate
 * 
 * API ENDPOINTS:
 * - POST /api/automations/test - Send test data
 * - POST /api/automations - Create automation
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { LBButton } from './design-system/LBButton';
import { LBInput } from './design-system/LBInput';
import { 
  Eye, 
  Play, 
  CheckCircle, 
  ArrowRight,
  FileJson,
  Zap,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface ActivateAutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  automationName: string;
  searchName: string;
  destination?: {
    id: string;
    name: string;
    icon: any;
  };
  fieldMappings: Array<{
    source: string;
    destination: string;
  }>;
  syncFrequency: string;
  onActivate: (config: any) => void;
}

export function ActivateAutomationModal({
  isOpen,
  onClose,
  automationName,
  searchName,
  destination,
  fieldMappings,
  syncFrequency,
  onActivate
}: ActivateAutomationModalProps) {
  const [step, setStep] = useState<'preview' | 'activate'>('preview');
  const [testSent, setTestSent] = useState(false);
  const [integrationConfig, setIntegrationConfig] = useState<Record<string, string>>({});

  // Generate preview payload
  const previewPayload = {
    search: searchName,
    sync_frequency: syncFrequency,
    field_mappings: fieldMappings.reduce((acc, mapping) => {
      acc[mapping.source] = mapping.destination;
      return acc;
    }, {} as Record<string, string>),
    sample_record: {
      address: '123 Main St, Miami, FL 33101',
      price: 450000,
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1800,
      listing_date: '2024-12-06',
    }
  };

  const handleSendTest = async () => {
    toast.info('Sending test data...');
    
    // Simulate API call
    setTimeout(() => {
      setTestSent(true);
      toast.success('Test sent successfully! Check your destination.');
    }, 1500);
  };

  const handleContinueToActivate = () => {
    setStep('activate');
  };

  const handleActivate = () => {
    if (!validateIntegrationConfig()) {
      toast.error('Please fill in all required fields');
      return;
    }

    onActivate(integrationConfig);
    toast.success('Automation activated!');
    
    // Reset modal state
    setStep('preview');
    setTestSent(false);
    setIntegrationConfig({});
  };

  const validateIntegrationConfig = () => {
    const requiredFields = getRequiredFields();
    return requiredFields.every(field => integrationConfig[field.key]);
  };

  // Get integration-specific required fields
  const getRequiredFields = () => {
    const configs: Record<string, Array<{ key: string; label: string; type?: string; placeholder: string }>> = {
      mailchimp: [
        { key: 'audience_id', label: 'Audience ID', placeholder: 'abc123' },
        { key: 'tags', label: 'Tags (comma-separated)', placeholder: 'new-lead, miami' },
      ],
      constantcontact: [
        { key: 'list_id', label: 'Contact List ID', placeholder: 'Enter list ID' },
        { key: 'source', label: 'Contact Source', placeholder: 'ListingBug' },
      ],
      salesforce: [
        { key: 'object_type', label: 'Salesforce Object', placeholder: 'Lead' },
        { key: 'lead_source', label: 'Lead Source', placeholder: 'ListingBug' },
      ],
      hubspot: [
        { key: 'pipeline_id', label: 'Pipeline ID (optional)', placeholder: 'default' },
        { key: 'deal_stage', label: 'Deal Stage (optional)', placeholder: 'appointmentscheduled' },
      ],
      sheets: [
        { key: 'spreadsheet_id', label: 'Spreadsheet ID', placeholder: '1A2B3C4D...' },
        { key: 'sheet_name', label: 'Sheet Name', placeholder: 'Listings' },
      ],
      airtable: [
        { key: 'base_id', label: 'Base ID', placeholder: 'appXXXXXXXXXXXXXX' },
        { key: 'table_id', label: 'Table ID', placeholder: 'tblXXXXXXXXXXXXXX' },
      ],
      twilio: [
        { key: 'from_number', label: 'From Number', placeholder: '+1234567890' },
        { key: 'message_template', label: 'Message Template', placeholder: 'New listing at {address}' },
      ],
      zapier: [
        { key: 'webhook_url', label: 'Zapier Webhook URL', type: 'url', placeholder: 'https://hooks.zapier.com/...' },
      ],
      make: [
        { key: 'webhook_url', label: 'Make Webhook URL', type: 'url', placeholder: 'https://hook.integromat.com/...' },
      ],
      webhook: [
        { key: 'webhook_url', label: 'Webhook URL', type: 'url', placeholder: 'https://api.example.com/webhook' },
        { key: 'auth_header', label: 'Authorization Header (optional)', placeholder: 'Bearer token123' },
      ],
    };

    return configs[destination?.id || ''] || [];
  };

  const handleReset = () => {
    setStep('preview');
    setTestSent(false);
    setIntegrationConfig({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleReset}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[20px] font-bold text-[#ffffff]">
            {step === 'preview' ? 'Preview & Test' : 'Activate Automation'}
          </DialogTitle>
          <DialogDescription className="text-[14px] text-gray-600">
            {step === 'preview' 
              ? 'Review the data that will be sent and send a test'
              : `Configure ${destination?.name} specific settings`
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'preview' ? (
          <div className="space-y-6">
            {/* Automation Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-[15px] font-bold text-[#342E37] mb-3">Automation Summary</h3>
              <div className="space-y-2 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium text-[#342E37]">{automationName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Search:</span>
                  <span className="font-medium text-[#342E37]">{searchName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Destination:</span>
                  <span className="font-medium text-[#342E37]">{destination?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Frequency:</span>
                  <span className="font-medium text-[#342E37]">{syncFrequency}</span>
                </div>
              </div>
            </div>

            {/* Preview Payload */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileJson className="w-4 h-4 text-[#ffffff]" />
                <h3 className="text-[15px] font-bold text-[#ffffff]">Preview Payload</h3>
              </div>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-[300px] font-mono text-[12px]">
                <pre>{JSON.stringify(previewPayload, null, 2)}</pre>
              </div>
            </div>

            {/* Test Send */}
            <div className="">
              <div className="flex items-start gap-3">
                
                <div className="flex-1">
                  <p className="text-[13px] mb-3 text-[#4a5565]">
                    Send a test record to {destination?.name} to verify your configuration is working correctly.
                  </p>
                  <LBButton
                    onClick={handleSendTest}
                    disabled={testSent}
                    size="sm"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {testSent ? 'Test Sent ✓' : 'Send Test'}
                  </LBButton>
                </div>
              </div>
            </div>

            {/* Continue Button */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <LBButton variant="outline" onClick={onClose}>
                Cancel
              </LBButton>
              <LBButton onClick={handleContinueToActivate}>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </LBButton>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Integration-Specific Fields */}
            <div>
              <h3 className="text-[15px] font-bold mb-4 text-[#ffffff]">
                {destination?.name} Configuration
              </h3>
              
              {getRequiredFields().length > 0 ? (
                <div className="space-y-4">
                  {getRequiredFields().map(field => (
                    <LBInput
                      key={field.key}
                      label={field.label}
                      type={field.type || 'text'}
                      placeholder={field.placeholder}
                      value={integrationConfig[field.key] || ''}
                      onChange={(e) => setIntegrationConfig(prev => ({
                        ...prev,
                        [field.key]: e.target.value
                      }))}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-[13px] text-gray-600">
                    No additional configuration required for {destination?.name}.
                  </p>
                </div>
              )}
            </div>

            {/* Activation Notice */}
            

            {/* Action Buttons */}
            <div className="flex justify-between pt-4 border-t">
              <LBButton variant="outline" onClick={() => setStep('preview')}>
                Back
              </LBButton>
              <div className="flex gap-3">
                <LBButton variant="outline" onClick={handleReset}>
                  Cancel
                </LBButton>
                <LBButton onClick={handleActivate}>
                  <Zap className="w-4 h-4 mr-2" />
                  Activate
                </LBButton>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
