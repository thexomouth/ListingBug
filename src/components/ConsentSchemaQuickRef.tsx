/**
 * CONSENT SCHEMA QUICK REFERENCE
 * 
 * PURPOSE: Interactive schema browser for developers
 * Shows JSON schema, TypeScript interfaces, API endpoints, and examples
 */

import { useState } from 'react';
import { Copy, Check, Code, Database, Zap, FileCode } from 'lucide-react';
import { LBCard, LBCardHeader, LBCardTitle, LBCardContent } from './design-system/LBCard';
import { toast } from 'sonner@2.0.3';

interface CodeBlockProps {
  code: string;
  title: string;
  language?: string;
}

function CodeBlock({ code, title, language = 'json' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Copied to clipboard!', { description: title });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-gray-600 uppercase">{title}</h4>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-200 hover:bg-[#FFD447] rounded transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function ConsentSchemaQuickRef() {
  const [activeTab, setActiveTab] = useState<'schema' | 'types' | 'api' | 'examples'>('schema');

  const jsonSchema = `{
  "contact_id": "string",
  "email": "string",
  "phone": "string",
  "provenance_source": "string",
  "provenance_method": "string",
  "provenance_timestamp": "ISO8601",
  "consent_flag": true,
  "consent_method": "string",
  "consent_timestamp": "ISO8601",
  "consent_ip": "string",
  "owner_confirmation": true,
  "owner_confirmation_reason": "string",
  "suppression_flag": false
}`;

  const typeScriptInterfaces = `interface ConsentRecord {
  contact_id: string;
  email: string;
  phone?: string | null;
  provenance_source: 'Form' | 'Phone' | 'In-person' | 'Imported';
  provenance_method: string;
  provenance_timestamp: string; // ISO 8601
  consent_flag: boolean;
  consent_method?: 'checkbox' | 'verbal' | 'email_confirmation' | 
                    'owner_confirmation' | null;
  consent_timestamp?: string | null;
  consent_ip?: string | null;
  owner_confirmation?: boolean;
  owner_confirmation_reason?: string | null;
  suppression_flag: boolean;
}

interface ConsentSummary {
  total_contacts: number;
  verified_opt_in_count: number;
  verified_opt_in_percentage: number;
  missing_consent_count: number;
  suppressed_count: number;
}

interface OwnerActionEvent {
  event_type: 'owner_action';
  action: 'mark_opted_in' | 'send_confirmation' | 'exclude' | 'review';
  contact_ids: string[];
  provenance_source?: string;
  owner_id: string;
  reason?: string;
  timestamp: string; // ISO 8601
  ip: string;
  idempotency_key: string;
}`;

  const apiEndpoints = `// 1. Fetch Consent Data
GET /api/consent/provenance?search_id={searchId}

Response:
{
  "summary": {
    "total_contacts": 100,
    "verified_opt_in_count": 85,
    "verified_opt_in_percentage": 85.0,
    "missing_consent_count": 15,
    "suppressed_count": 2
  },
  "by_source": {
    "Form": { "total": 60, "consented": 58, "consent_rate": 96.7 }
  },
  "sample_contacts": [ /* ConsentRecord[] */ ]
}

// 2. Log Owner Action
POST /api/ledger/events

Request:
{
  "event_type": "owner_action",
  "action": "mark_opted_in",
  "contact_ids": ["cnt_001", "cnt_002"],
  "owner_id": "owner_123",
  "reason": "Verbal consent during phone call",
  "timestamp": "2024-12-06T10:30:00Z",
  "ip": "192.168.1.1",
  "idempotency_key": "uuid-v4-here"
}

// 3. Mark Contacts as Opted In
POST /api/consent/mark-opted-in

Request:
{
  "contact_ids": ["cnt_004"],
  "owner_id": "owner_123",
  "reason": "Verbal consent during phone call",
  "consent_method": "owner_confirmation",
  "consent_timestamp": "2024-12-06T10:30:00Z",
  "consent_ip": "192.168.1.1",
  "idempotency_key": "uuid-v4-here"
}

// 4. Send Opt-In Confirmation
POST /api/campaigns/confirmation

Request:
{
  "contact_ids": ["cnt_005"],
  "owner_id": "owner_123",
  "campaign_type": "opt_in_confirmation",
  "destination_name": "Mailchimp",
  "idempotency_key": "uuid-v4-here"
}`;

  const examples = `// Example 1: Form Submission with Consent
{
  "contact_id": "cnt_7x9k2m4p",
  "email": "jane.smith@example.com",
  "phone": "+1-555-0123",
  "provenance_source": "Form",
  "provenance_method": "web_form",
  "provenance_timestamp": "2024-11-15T14:23:00Z",
  "consent_flag": true,
  "consent_method": "checkbox",
  "consent_timestamp": "2024-11-15T14:23:00Z",
  "consent_ip": "192.168.1.1",
  "owner_confirmation": false,
  "owner_confirmation_reason": null,
  "suppression_flag": false
}

// Example 2: Phone Call without Consent
{
  "contact_id": "cnt_3m8n1k5r",
  "email": "john.doe@example.com",
  "phone": "+1-555-0456",
  "provenance_source": "Phone",
  "provenance_method": "phone_call",
  "provenance_timestamp": "2024-10-22T09:15:00Z",
  "consent_flag": false,
  "consent_method": null,
  "consent_timestamp": null,
  "consent_ip": null,
  "owner_confirmation": false,
  "owner_confirmation_reason": null,
  "suppression_flag": false
}

// Example 3: Imported with Owner Confirmation
{
  "contact_id": "cnt_9p2k7m1x",
  "email": "sarah.johnson@example.com",
  "phone": null,
  "provenance_source": "Imported",
  "provenance_method": "csv_import",
  "provenance_timestamp": "2024-09-05T16:45:00Z",
  "consent_flag": true,
  "consent_method": "owner_confirmation",
  "consent_timestamp": "2024-12-06T10:30:00Z",
  "consent_ip": "10.0.1.15",
  "owner_confirmation": true,
  "owner_confirmation_reason": "Verbal consent during phone call on 2024-12-05",
  "suppression_flag": false
}

// Example 4: Usage in Component
const fetchConsentData = async (searchId: string) => {
  const response = await fetch(
    \`/api/consent/provenance?search_id=\${searchId}\`
  );
  const data = await response.json();
  return data; // { summary, by_source, sample_contacts }
};

const logOwnerAction = async (
  action: string, 
  contactIds: string[], 
  reason?: string
) => {
  await fetch('/api/ledger/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_type: 'owner_action',
      action,
      contact_ids: contactIds,
      owner_id: 'owner_123',
      reason,
      timestamp: new Date().toISOString(),
      ip: '192.168.1.1',
      idempotency_key: crypto.randomUUID()
    })
  });
};`;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-8 h-8 text-[#342E37]" />
            <h1 className="text-3xl font-bold text-[#342E37]">
              Consent Ledger Schema - Quick Reference
            </h1>
          </div>
          <p className="text-gray-600">
            Interactive schema browser for developers. Click any code block to copy to clipboard.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b-2 border-gray-300">
          <button
            onClick={() => setActiveTab('schema')}
            className={`flex items-center gap-2 px-4 py-3 font-bold transition-colors ${
              activeTab === 'schema'
                ? 'border-b-4 border-[#FFD447] text-[#342E37]'
                : 'text-gray-500 hover:text-[#342E37]'
            }`}
          >
            <Code className="w-4 h-4" />
            JSON Schema
          </button>
          <button
            onClick={() => setActiveTab('types')}
            className={`flex items-center gap-2 px-4 py-3 font-bold transition-colors ${
              activeTab === 'types'
                ? 'border-b-4 border-[#FFD447] text-[#342E37]'
                : 'text-gray-500 hover:text-[#342E37]'
            }`}
          >
            <FileCode className="w-4 h-4" />
            TypeScript
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`flex items-center gap-2 px-4 py-3 font-bold transition-colors ${
              activeTab === 'api'
                ? 'border-b-4 border-[#FFD447] text-[#342E37]'
                : 'text-gray-500 hover:text-[#342E37]'
            }`}
          >
            <Zap className="w-4 h-4" />
            API Endpoints
          </button>
          <button
            onClick={() => setActiveTab('examples')}
            className={`flex items-center gap-2 px-4 py-3 font-bold transition-colors ${
              activeTab === 'examples'
                ? 'border-b-4 border-[#FFD447] text-[#342E37]'
                : 'text-gray-500 hover:text-[#342E37]'
            }`}
          >
            <Database className="w-4 h-4" />
            Examples
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'schema' && (
            <LBCard className="border-2 border-gray-300">
              <LBCardHeader>
                <LBCardTitle>Contact Record JSON Schema</LBCardTitle>
              </LBCardHeader>
              <LBCardContent className="space-y-6">
                <CodeBlock code={jsonSchema} title="Core Schema" />
                
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                  <h4 className="font-bold text-sm mb-2 text-blue-900">Field Notes:</h4>
                  <ul className="text-xs text-blue-900 space-y-1">
                    <li>• <strong>provenance_source:</strong> "Form" | "Phone" | "In-person" | "Imported"</li>
                    <li>• <strong>consent_method:</strong> "checkbox" | "verbal" | "email_confirmation" | "owner_confirmation"</li>
                    <li>• <strong>timestamps:</strong> ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)</li>
                    <li>• <strong>owner_confirmation_reason:</strong> Max 200 characters, required if owner_confirmation=true</li>
                  </ul>
                </div>

                <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
                  <h4 className="font-bold text-sm mb-2 text-amber-900">Conditional Fields:</h4>
                  <ul className="text-xs text-amber-900 space-y-1">
                    <li>• <strong>consent_method:</strong> Required if consent_flag = true</li>
                    <li>• <strong>consent_timestamp:</strong> Required if consent_flag = true</li>
                    <li>• <strong>owner_confirmation_reason:</strong> Required if owner_confirmation = true</li>
                  </ul>
                </div>
              </LBCardContent>
            </LBCard>
          )}

          {activeTab === 'types' && (
            <LBCard className="border-2 border-gray-300">
              <LBCardHeader>
                <LBCardTitle>TypeScript Interfaces</LBCardTitle>
              </LBCardHeader>
              <LBCardContent>
                <CodeBlock 
                  code={typeScriptInterfaces} 
                  title="TypeScript Definitions" 
                  language="typescript" 
                />
              </LBCardContent>
            </LBCard>
          )}

          {activeTab === 'api' && (
            <LBCard className="border-2 border-gray-300">
              <LBCardHeader>
                <LBCardTitle>API Endpoints</LBCardTitle>
              </LBCardHeader>
              <LBCardContent>
                <CodeBlock 
                  code={apiEndpoints} 
                  title="All API Endpoints" 
                  language="javascript" 
                />
              </LBCardContent>
            </LBCard>
          )}

          {activeTab === 'examples' && (
            <LBCard className="border-2 border-gray-300">
              <LBCardHeader>
                <LBCardTitle>Example Records & Usage</LBCardTitle>
              </LBCardHeader>
              <LBCardContent>
                <CodeBlock 
                  code={examples} 
                  title="Complete Examples" 
                  language="javascript" 
                />
              </LBCardContent>
            </LBCard>
          )}
        </div>

        {/* Component References */}
        <div className="mt-8 bg-gray-900 border-2 border-gray-700 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">Component Bindings</h3>
          <div className="space-y-2 text-sm font-mono">
            <div className="text-green-400">
              <span className="text-yellow-400">ConsentProvenancePanel:</span> /components/consent/ConsentProvenancePanel.tsx
            </div>
            <div className="text-green-400">
              <span className="text-yellow-400">PreSyncMarketingModal:</span> /components/consent/PreSyncMarketingModal.tsx
            </div>
            <div className="text-green-400">
              <span className="text-yellow-400">CreateAutomationModal:</span> /components/CreateAutomationModal.tsx (Step 3)
            </div>
            <div className="text-gray-400 mt-4">
              Full documentation: /CONSENT_LEDGER_SCHEMA.md
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
