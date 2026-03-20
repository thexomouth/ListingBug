/**
 * CONSENT & PROVENANCE MICROCOPY PACK
 * 
 * PURPOSE: Copyable text snippets for Figma design files
 * All copy is plain English, compliance-focused, and production-ready
 * 
 * USAGE: Click any text block to copy to clipboard
 */

import { useState } from 'react';
import { 
  Copy, 
  Check, 
  AlertTriangle, 
  Info, 
  Shield, 
  HelpCircle,
  CheckCircle,
  Mail,
  Users
} from 'lucide-react';
import { LBCard, LBCardHeader, LBCardTitle, LBCardContent } from './design-system/LBCard';
import { toast } from 'sonner@2.0.3';

interface CopyBlockProps {
  text: string;
  category: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'warning' | 'info' | 'success';
}

function CopyBlock({ text, category, icon, variant = 'default' }: CopyBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!', {
      description: category
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const variantStyles = {
    default: 'bg-gray-50 border-gray-300 hover:border-[#FFD447]',
    warning: 'bg-red-50 border-red-300 hover:border-red-400',
    info: 'bg-blue-50 border-blue-300 hover:border-blue-400',
    success: 'bg-green-50 border-green-300 hover:border-green-400'
  };

  return (
    <div
      onClick={handleCopy}
      className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${variantStyles[variant]} group`}
    >
      <div className="flex items-start gap-3">
        {icon && <div className="flex-shrink-0 mt-0.5">{icon}</div>}
        <div className="flex-1">
          <div className="text-xs font-bold text-gray-500 uppercase mb-1">{category}</div>
          <p className="text-sm text-[#342E37] leading-relaxed">{text}</p>
        </div>
        <div className="flex-shrink-0">
          {copied ? (
            <Check className="w-5 h-5 text-green-600" />
          ) : (
            <Copy className="w-5 h-5 text-gray-400 group-hover:text-[#FFD447]" />
          )}
        </div>
      </div>
    </div>
  );
}

export function ConsentMicrocopyPack() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#342E37] mb-2">
            Consent & Provenance Microcopy Pack
          </h1>
          <p className="text-gray-600 mb-4">
            Short, plain English lines for tooltips, warnings, CTAs, and modal copy. 
            <strong> Click any text block to copy to clipboard.</strong>
          </p>
          <div className="bg-[#FFD447] border-2 border-[#342E37] rounded-lg p-4">
            <p className="text-sm text-[#342E37]">
              <strong>📋 For Figma designers:</strong> These are production-ready microcopy snippets. 
              Paste these exact lines into your Figma text fields for consent components, tooltips, and modals.
            </p>
          </div>
        </div>

        {/* PRIMARY INSTRUCTIONS */}
        <LBCard className="border-2 border-gray-300 mb-6">
          <LBCardHeader>
            <LBCardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              Primary Instructions
            </LBCardTitle>
          </LBCardHeader>
          <LBCardContent className="space-y-3">
            <CopyBlock
              text="Only sync contacts who asked to hear from you. Choose how to confirm opt-in for each source."
              category="Top Instruction"
              icon={<Shield className="w-4 h-4 text-blue-600" />}
              variant="info"
            />
          </LBCardContent>
        </LBCard>

        {/* TOOLTIPS */}
        <LBCard className="border-2 border-gray-300 mb-6">
          <LBCardHeader>
            <LBCardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-gray-600" />
              Tooltips & Help Text
            </LBCardTitle>
          </LBCardHeader>
          <LBCardContent className="space-y-3">
            <CopyBlock
              text="Provenance shows where the contact came from and whether they already confirmed permission."
              category="Badge Tooltip"
              icon={<HelpCircle className="w-4 h-4 text-gray-600" />}
            />
            <CopyBlock
              text="Provenance shows where the contact came from and whether they confirmed permission. This protects you from legal issues and ensures compliance with CAN-SPAM, GDPR, and CASL."
              category="Extended Tooltip (Why This Matters)"
              icon={<HelpCircle className="w-4 h-4 text-gray-600" />}
            />
          </LBCardContent>
        </LBCard>

        {/* MODAL COPY */}
        <LBCard className="border-2 border-gray-300 mb-6">
          <LBCardHeader>
            <LBCardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Modal Checkboxes & Confirmations
            </LBCardTitle>
          </LBCardHeader>
          <LBCardContent className="space-y-3">
            <CopyBlock
              text="I confirm these contacts have explicitly opted in to receive marketing from my business."
              category="Modal Checkbox (Required Exact Text)"
              icon={<CheckCircle className="w-4 h-4 text-green-600" />}
              variant="success"
            />
            <CopyBlock
              text="Confirm contacts that have explicitly opted in to receive marketing."
              category="Alternative Checkbox Text"
              icon={<CheckCircle className="w-4 h-4 text-green-600" />}
              variant="success"
            />
            <CopyBlock
              text="By checking this box, I acknowledge that sending to contacts without consent may violate CAN-SPAM, GDPR, and CASL regulations."
              category="Checkbox Subtext / Legal Notice"
              icon={<Info className="w-4 h-4 text-gray-600" />}
            />
          </LBCardContent>
        </LBCard>

        {/* WARNINGS */}
        <LBCard className="border-2 border-gray-300 mb-6">
          <LBCardHeader>
            <LBCardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Warnings & Alerts
            </LBCardTitle>
          </LBCardHeader>
          <LBCardContent className="space-y-3">
            <CopyBlock
              text="Less than 80% of these contacts have verified opt-in. Sending marketing may violate laws and platform rules."
              category="Low Consent Warning (Required)"
              icon={<AlertTriangle className="w-4 h-4 text-red-600" />}
              variant="warning"
            />
            <CopyBlock
              text="Imported contacts are not considered opted in until you confirm or they complete a confirmation step."
              category="Imported Contact Warning"
              icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
              variant="warning"
            />
            <CopyBlock
              text="Cannot proceed with consent rate below 80%"
              category="Blocking Message (Short)"
              icon={<AlertTriangle className="w-4 h-4 text-red-600" />}
              variant="warning"
            />
            <CopyBlock
              text="This automation cannot proceed due to insufficient consent verification"
              category="Blocking Message (Alternative)"
              icon={<AlertTriangle className="w-4 h-4 text-red-600" />}
              variant="warning"
            />
          </LBCardContent>
        </LBCard>

        {/* CTAS */}
        <LBCard className="border-2 border-gray-300 mb-6">
          <LBCardHeader>
            <LBCardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              CTAs & Action Buttons
            </LBCardTitle>
          </LBCardHeader>
          <LBCardContent className="space-y-3">
            <CopyBlock
              text="Need help? We'll set this up for you — one call, we do the rest."
              category="Concierge CTA (Required Exact Text)"
              icon={<Info className="w-4 h-4 text-blue-600" />}
              variant="info"
            />
            <CopyBlock
              text="Need help with consent? We'll review and clean your list — one call, we do the rest."
              category="Concierge CTA (Alternative)"
              icon={<Info className="w-4 h-4 text-blue-600" />}
              variant="info"
            />
            <CopyBlock
              text="Our concierge team can review your contact list, help you collect missing consent, and ensure compliance with email marketing regulations."
              category="Concierge Description (Expanded)"
              icon={<Info className="w-4 h-4 text-blue-600" />}
              variant="info"
            />
          </LBCardContent>
        </LBCard>

        {/* MODAL TITLES & HEADERS */}
        <LBCard className="border-2 border-gray-300 mb-6">
          <LBCardHeader>
            <LBCardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#342E37]" />
              Modal Titles & Headers
            </LBCardTitle>
          </LBCardHeader>
          <LBCardContent className="space-y-3">
            <CopyBlock
              text="Confirm Marketing Setup"
              category="Modal Title (Required Exact Text)"
              icon={<Shield className="w-4 h-4 text-[#342E37]" />}
            />
            <CopyBlock
              text="Only send marketing to contacts who asked to hear from you."
              category="Modal Summary (Required Bold)"
              icon={<Shield className="w-4 h-4 text-[#342E37]" />}
            />
            <CopyBlock
              text="Consent & Provenance"
              category="Panel Header"
              icon={<Shield className="w-4 h-4 text-[#342E37]" />}
            />
          </LBCardContent>
        </LBCard>

        {/* RADIO OPTIONS */}
        <LBCard className="border-2 border-gray-300 mb-6">
          <LBCardHeader>
            <LBCardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Radio Option Labels
            </LBCardTitle>
          </LBCardHeader>
          <LBCardContent className="space-y-3">
            <CopyBlock
              text="Mark selected contacts as opted in now"
              category="Option 1 Label (Required)"
              icon={<CheckCircle className="w-4 h-4 text-green-600" />}
            />
            <CopyBlock
              text="Use this if you have offline consent records or verbal agreements. You'll need to provide a reason."
              category="Option 1 Description"
              icon={<Info className="w-4 h-4 text-gray-600" />}
            />
            <CopyBlock
              text="Send opt-in confirmation message first"
              category="Option 2 Label (Required)"
              icon={<Mail className="w-4 h-4 text-blue-600" />}
            />
            <CopyBlock
              text="We'll send a confirmation email to contacts missing consent, asking them to verify their opt-in."
              category="Option 2 Description"
              icon={<Info className="w-4 h-4 text-gray-600" />}
            />
          </LBCardContent>
        </LBCard>

        {/* FORM LABELS */}
        <LBCard className="border-2 border-gray-300 mb-6">
          <LBCardHeader>
            <LBCardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-gray-600" />
              Form Labels & Inputs
            </LBCardTitle>
          </LBCardHeader>
          <LBCardContent className="space-y-3">
            <CopyBlock
              text="Reason for marking as opted in (required):"
              category="Reason Input Label"
              icon={<Info className="w-4 h-4 text-gray-600" />}
            />
            <CopyBlock
              text="e.g., Verbal consent during phone call, signed paper forms, etc."
              category="Reason Input Placeholder"
              icon={<Info className="w-4 h-4 text-gray-600" />}
            />
            <CopyBlock
              text="View consent ledger"
              category="Link Text"
              icon={<Info className="w-4 h-4 text-blue-600" />}
            />
          </LBCardContent>
        </LBCard>

        {/* SUMMARY LINES */}
        <LBCard className="border-2 border-gray-300 mb-6">
          <LBCardHeader>
            <LBCardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-gray-600" />
              Dynamic Summary Lines (Templates)
            </LBCardTitle>
          </LBCardHeader>
          <LBCardContent className="space-y-3">
            <CopyBlock
              text="X contacts · Y verified opt-in (Z%) · N missing consent"
              category="Top Summary Line Template"
              icon={<Info className="w-4 h-4 text-gray-600" />}
            />
            <CopyBlock
              text="65 contacts · 58 verified opt-in (89%) · 7 missing consent"
              category="Top Summary Line Example"
              icon={<Info className="w-4 h-4 text-gray-600" />}
            />
            <CopyBlock
              text="Showing first 5 of X contacts. All contacts will be validated before sync."
              category="Sample Table Footer"
              icon={<Info className="w-4 h-4 text-gray-600" />}
            />
          </LBCardContent>
        </LBCard>

        {/* PROJECTION LINES */}
        <LBCard className="border-2 border-gray-300 mb-6">
          <LBCardHeader>
            <LBCardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              Projection & Estimation Text
            </LBCardTitle>
          </LBCardHeader>
          <LBCardContent className="space-y-3">
            <CopyBlock
              text="Estimated delivery: Within 10 minutes"
              category="Delivery Estimate"
              icon={<Info className="w-4 h-4 text-blue-600" />}
            />
            <CopyBlock
              text="Expected opt-in projection: ~65% response rate"
              category="Opt-In Projection"
              icon={<Info className="w-4 h-4 text-blue-600" />}
            />
            <CopyBlock
              text="Your automation will start syncing after contacts confirm their opt-in (typically 24-48 hours)."
              category="Confirmation Timeline"
              icon={<Info className="w-4 h-4 text-blue-600" />}
            />
          </LBCardContent>
        </LBCard>

        {/* BUTTON LABELS */}
        <LBCard className="border-2 border-gray-300 mb-6">
          <LBCardHeader>
            <LBCardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[#342E37]" />
              Button Labels
            </LBCardTitle>
          </LBCardHeader>
          <LBCardContent className="space-y-3">
            <CopyBlock
              text="Confirm & Proceed"
              category="Primary Button"
              icon={<CheckCircle className="w-4 h-4 text-green-600" />}
            />
            <CopyBlock
              text="Send Confirmations & Proceed"
              category="Primary Button (Option 2)"
              icon={<Mail className="w-4 h-4 text-blue-600" />}
            />
            <CopyBlock
              text="View Details"
              category="Expand Button"
              icon={<Info className="w-4 h-4 text-gray-600" />}
            />
            <CopyBlock
              text="Hide Details"
              category="Collapse Button"
              icon={<Info className="w-4 h-4 text-gray-600" />}
            />
            <CopyBlock
              text="Request Concierge Review"
              category="Concierge Button"
              icon={<Users className="w-4 h-4 text-blue-600" />}
            />
          </LBCardContent>
        </LBCard>

        {/* BADGE ACTION MENU */}
        <LBCard className="border-2 border-gray-300">
          <LBCardHeader>
            <LBCardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-gray-600" />
              Badge Action Menu Items
            </LBCardTitle>
          </LBCardHeader>
          <LBCardContent className="space-y-3">
            <CopyBlock
              text="Review"
              category="Badge Menu Item 1"
              icon={<Info className="w-4 h-4 text-gray-600" />}
            />
            <CopyBlock
              text="Mark Opted In"
              category="Badge Menu Item 2"
              icon={<CheckCircle className="w-4 h-4 text-green-600" />}
            />
            <CopyBlock
              text="Send Confirmation"
              category="Badge Menu Item 3"
              icon={<Mail className="w-4 h-4 text-blue-600" />}
            />
            <CopyBlock
              text="Exclude"
              category="Badge Menu Item 4"
              icon={<AlertTriangle className="w-4 h-4 text-red-600" />}
            />
          </LBCardContent>
        </LBCard>

        {/* Quick Reference */}
        <div className="mt-8 bg-gray-900 border-2 border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Quick Reference: All Required Exact Text</h2>
          <div className="space-y-2 text-sm font-mono">
            <div className="text-green-400">
              <span className="text-yellow-400">Top Instruction:</span> Only sync contacts who asked to hear from you. Choose how to confirm opt-in for each source.
            </div>
            <div className="text-green-400">
              <span className="text-yellow-400">Badge Tooltip:</span> Provenance shows where the contact came from and whether they already confirmed permission.
            </div>
            <div className="text-green-400">
              <span className="text-yellow-400">Modal Checkbox:</span> I confirm these contacts have explicitly opted in to receive marketing from my business.
            </div>
            <div className="text-green-400">
              <span className="text-yellow-400">Warning:</span> Less than 80% of these contacts have verified opt-in. Sending marketing may violate laws and platform rules.
            </div>
            <div className="text-green-400">
              <span className="text-yellow-400">Imported Warning:</span> Imported contacts are not considered opted in until you confirm or they complete a confirmation step.
            </div>
            <div className="text-green-400">
              <span className="text-yellow-400">Concierge CTA:</span> Need help? We'll set this up for you — one call, we do the rest.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
