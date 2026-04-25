import { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { CityAutocomplete } from '../CityAutocomplete';
import { CityLimitModal } from './CityLimitModal';
import { normalizePlan, canAddCity, type PlanType } from '../utils/planLimits';
import { formatSenderName } from '../../lib/senderName';
import { SMTPSetupModal } from '../SMTPSetupModal';
import { Mail, Server, CheckCircle2, Plus } from 'lucide-react';
import { buildGmailAuthUrl } from '../../utils/gmailOAuth';
import { buildOutlookAuthUrl } from '../../utils/outlookOAuth';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface BusinessInfo {
  business_name: string;
  contact_name: string;
  forward_to: string;
  service_type: string[];
  mailing_address: string;
}

interface SearchCriteria {
  city: string;
  state: string;
  // listing_type kept in state but not shown in UI — always 'For Sale'
  listing_type: string;
  days_old: number | string;
  price_min: number | null;
  price_max: number | null;
  property_type: string;
  year_built_min: number | null;
  year_built_max: number | null;
}

interface MessageInfo {
  campaign_name: string;
  channel: string;
  subject: string;
  body: string;
}

interface SmsConfig {
  twilio_from_number: string;
  forward_to_phone: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const SERVICE_TAGS = ['Roofing', 'Staging', 'Cleaning', 'Landscaping', 'Contracting', 'Photography', 'Inspection'];
const VARS = ['{{agent_name}}', '{{address}}', '{{price}}', '{{city}}', '{{listing_date}}'];
const FROM_EMAIL_DISPLAY = 'hello@listingping.com';

const STEPS = [
  { label: 'Which mailbox', short: 'Mailbox' },
  { label: 'Your business', short: 'Business' },
  { label: 'Search area', short: 'Search' },
  { label: 'Your message', short: 'Message' },
  { label: 'Review', short: 'Review' },
];
const PROPERTY_TYPES = [
  'Single Family',
  'Condo',
  'Townhouse',
  'Manufactured',
  'Multi-Family',
  'Apartment',
  'Land',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function interpolatePreview(text: string, city: string): string {
  return text
    .replace(/\{\{agent_name\}\}/g, '[AGENT NAME]')
    .replace(/\{\{address\}\}/g, '[LISTING ADDRESS]')
    .replace(/\{\{city\}\}/g, city || '[CITY]')
    .replace(/\{\{price\}\}/g, '[LISTING PRICE]')
    .replace(/\{\{listing_date\}\}/g, '[LISTING DATE]');
}

function toTitleCase(str: string): string {
  return str.replace(/\b\w+/g, word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

function renderBodyPreview(text: string, city: string): string {
  let s = interpolatePreview(text, city);
  // HTML-escape
  s = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // Convert [text](url) → clickable link
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    (_, t, u) => `<a href="${u}" style="color:#1d4ed8;text-decoration:underline" target="_blank" rel="noopener noreferrer">${t}</a>`);
  // Newlines → <br>
  s = s.replace(/\n/g, '<br>');
  return s;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function NewCampaign() {
  const [step, setStep] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const [step0Mode, setStep0Mode] = useState<'confirm' | 'edit' | null>(null);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    business_name: '',
    contact_name: '',
    forward_to: '',
    service_type: [],
    mailing_address: '',
  });
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    city: '',
    state: '',
    listing_type: 'For Sale',
    days_old: 1,
    price_min: null,
    price_max: null,
    property_type: 'Single Family',
    year_built_min: null,
    year_built_max: null,
  });
  const [messageInfo, setMessageInfo] = useState<MessageInfo>({
    campaign_name: '',
    channel: 'email',
    subject: '',
    body: '',
  });
  const [smsConfig, setSmsConfig] = useState<SmsConfig>({
    twilio_from_number: '',
    forward_to_phone: '',
  });
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailsSent, setEmailsSent] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Tracks cursor position so insertVar works even if selectionStart
  // can't be read at click time (e.g. focus already moved)
  const cursorPos = useRef(0);
  const cursorEnd = useRef(0);
  const [linkForm, setLinkForm] = useState({ open: false, text: '', url: '' });
  const [testModal, setTestModal] = useState({ open: false, address: '', sending: false, sent: false, error: null as string | null });
  type Template = { id: string; template_name: string; channel: string; subject: string | null; body: string; is_shared: boolean };
  const [templatePicker, setTemplatePicker] = useState<{ open: boolean; loading: boolean; myTemplates: Template[]; sharedTemplates: Template[] }>({ open: false, loading: false, myTemplates: [], sharedTemplates: [] });
  const templateDropdownRef = useRef<HTMLDivElement>(null);
  const [userPlan, setUserPlan] = useState<PlanType>('trial');
  const [activeCityCount, setActiveCityCount] = useState(0);
  const [cityLimitOpen, setCityLimitOpen] = useState(false);

  // Sender selection state
  const [senders, setSenders] = useState<Array<{ id: string; display_name: string; from_email: string; integration_id: string }>>([]);
  const [selectedSender, setSelectedSender] = useState<string | null>(null);
  const [smtpModalOpen, setSMTPModalOpen] = useState(false);

  // Load auth + pre-populate for returning users
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data: userRecord } = await supabase
        .from('users')
        .select('business_name, contact_name, forward_to, service_type, email, plan, mailing_address')
        .eq('id', user.id)
        .single();
      if (userRecord) {
        const info: BusinessInfo = {
          business_name: userRecord.business_name || '',
          contact_name: userRecord.contact_name || '',
          forward_to: userRecord.forward_to || userRecord.email || '',
          service_type: userRecord.service_type
            ? userRecord.service_type.split(',').map((s: string) => s.trim()).filter(Boolean)
            : [],
          mailing_address: userRecord.mailing_address || '',
        };
        setBusinessInfo(info);
        setUserPlan(normalizePlan(userRecord.plan));
        if (userRecord.business_name && userRecord.forward_to) {
          setHasExistingProfile(true);
          setStep0Mode('confirm');
        } else {
          setStep0Mode('edit');
        }
      } else {
        setStep0Mode('edit');
      }

      // Count distinct cities already in active campaigns
      const { data: activeCampaigns } = await supabase
        .from('campaigns')
        .select('campaign_search_criteria(city)')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (activeCampaigns) {
        const cities = new Set(
          activeCampaigns.flatMap((c: any) =>
            (c.campaign_search_criteria ?? []).map((cr: any) => cr.city?.toLowerCase().trim()).filter(Boolean)
          )
        );
        setActiveCityCount(cities.size);
      }

      // Load connected sending identities
      const { data: sendersData } = await supabase
        .from('integration_connections')
        .select('id, display_name, from_email, integration_id')
        .eq('user_id', user.id)
        .eq('is_sender', true);

      if (sendersData && sendersData.length > 0) {
        setSenders(sendersData);

        // Load default sender
        const { data: userDefault } = await supabase
          .from('users')
          .select('default_sender_id')
          .eq('id', user.id)
          .single();

        if (userDefault?.default_sender_id) {
          setSelectedSender(userDefault.default_sender_id);
        } else {
          setSelectedSender(sendersData[0].id);
        }
      }
    };
    init();
  }, []);

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------
  const validateStep = (s: number): boolean => {
    const errors: Record<string, string> = {};
    if (s === 0) {
      if (senders.length === 0) {
        errors.sender = 'Please connect at least one email account to continue.';
      } else if (!selectedSender) {
        errors.sender = 'Please select which mailbox you want to use for this campaign.';
      }
    }
    if (s === 1) {
      if (!businessInfo.business_name.trim()) errors.business_name = 'Business name is required';
      if (!businessInfo.forward_to.trim()) errors.forward_to = 'Reply-to email is required';
      if (!businessInfo.mailing_address.trim()) errors.mailing_address = 'Mailing address is required (CAN-SPAM compliance)';
    }
    if (s === 2) {
      if (!searchCriteria.city.trim()) errors.city = 'City is required — select one from the dropdown';
      if (!searchCriteria.state.trim()) errors.state = 'State is required';
    }
    if (s === 3) {
      if (!messageInfo.campaign_name.trim()) errors.campaign_name = 'Campaign name is required';
      if (messageInfo.channel === 'email' && !messageInfo.subject.trim()) errors.subject = 'Subject line is required';
      if (!messageInfo.body.trim()) errors.body = 'Message body is required';
      if (messageInfo.channel === 'sms' && !smsConfig.twilio_from_number.trim()) errors.twilio_from_number = 'Sending number is required for SMS campaigns';
      if (messageInfo.channel === 'sms' && !smsConfig.forward_to_phone.trim()) errors.forward_to_phone = 'Forward-to phone is required for SMS campaigns';
    }
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveBusinessInfo = async () => {
    if (!userId) return;
    setIsSavingProfile(true);
    try {
      await supabase.from('users').update({
        business_name: businessInfo.business_name,
        contact_name: businessInfo.contact_name,
        forward_to: businessInfo.forward_to,
        service_type: businessInfo.service_type.join(','),
        mailing_address: businessInfo.mailing_address,
      }).eq('id', userId);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleNext = async () => {
    if (!validateStep(step)) return;
    if (step === 1) await saveBusinessInfo();
    if (step === 2) {
      // Check city limit before proceeding past city selection
      const cityLower = searchCriteria.city.toLowerCase().trim();
      // Count cities: existing active ones, minus this city if already included
      const { data: activeCampaigns } = await supabase
        .from('campaigns')
        .select('campaign_search_criteria(city)')
        .eq('user_id', userId!)
        .eq('status', 'active');
      const existingCities = new Set(
        (activeCampaigns ?? []).flatMap((c: any) =>
          (c.campaign_search_criteria ?? []).map((cr: any) => cr.city?.toLowerCase().trim()).filter(Boolean)
        )
      );
      // Only counts as a new city if not already covered by an active campaign
      const newCityCount = existingCities.has(cityLower) ? existingCities.size : existingCities.size + 1;
      const check = canAddCity(userPlan, newCityCount);
      if (!check.allowed) {
        setActiveCityCount(existingCities.size);
        setCityLimitOpen(true);
        return;
      }
    }
    setStep(s => s + 1);
  };

  const handleBack = () => {
    setStepErrors({});
    setStep(s => s - 1);
  };

  const handleStepClick = (i: number) => {
    if (i < step) setStep(i);
  };

  // ---------------------------------------------------------------------------
  // Variable chip insertion
  // ---------------------------------------------------------------------------
  const insertVar = (v: string) => {
    const pos = cursorPos.current;
    const body = messageInfo.body;
    const newBody = body.slice(0, pos) + v + body.slice(pos);
    const newPos = pos + v.length;
    cursorPos.current = newPos;
    // flushSync forces React to commit the DOM update synchronously so
    // setSelectionRange runs after the textarea value is already updated.
    flushSync(() => {
      setMessageInfo(m => ({ ...m, body: newBody }));
    });
    const ta = textareaRef.current;
    if (ta) {
      ta.setSelectionRange(newPos, newPos);
      ta.focus();
    }
  };

  // Replaces the current selection (or inserts at cursor) with [text](url)
  const doInsertLink = (text: string, url: string) => {
    const token = `[${text}](${url})`;
    const start = cursorPos.current;
    const end = cursorEnd.current;
    const body = messageInfo.body;
    const newBody = body.slice(0, start) + token + body.slice(end);
    const newPos = start + token.length;
    cursorPos.current = newPos;
    cursorEnd.current = newPos;
    flushSync(() => {
      setMessageInfo(m => ({ ...m, body: newBody }));
    });
    const ta = textareaRef.current;
    if (ta) {
      ta.setSelectionRange(newPos, newPos);
      ta.focus();
    }
    setLinkForm({ open: false, text: '', url: '' });
  };

  // ---------------------------------------------------------------------------
  // Submission
  // ---------------------------------------------------------------------------
  const handleGoLive = async () => {
    if (!userId) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await supabase.from('users').update({
        business_name: businessInfo.business_name,
        contact_name: businessInfo.contact_name,
        forward_to: businessInfo.forward_to,
        service_type: businessInfo.service_type.join(','),
      }).eq('id', userId);

      const { data: campaign, error: campaignErr } = await supabase
        .from('campaigns')
        .insert({
          user_id: userId,
          campaign_name: searchCriteria.city ? `${searchCriteria.city} - ${messageInfo.campaign_name}` : messageInfo.campaign_name,
          status: 'active',
          channel: messageInfo.channel,
          sender_type: 'default',
          sender_id: selectedSender,  // User-selected sending identity
          subject: messageInfo.subject,
          body: messageInfo.body,
          forward_to: businessInfo.forward_to,
          drip_delay_minutes: 2,
        })
        .select()
        .single();

      if (campaignErr || !campaign) throw new Error(campaignErr?.message || 'Failed to create campaign');

      const daysOldNum = typeof searchCriteria.days_old === 'string'
        ? parseInt(searchCriteria.days_old, 10) || 1
        : searchCriteria.days_old;

      const { error: criteriaErr } = await supabase.from('campaign_search_criteria').insert({
        campaign_id: campaign.id,
        city: searchCriteria.city,
        state: searchCriteria.state,
        listing_type: searchCriteria.listing_type,
        active_status: 'Active',
        days_old: daysOldNum,
        price_min: searchCriteria.price_min,
        price_max: searchCriteria.price_max,
        property_type: searchCriteria.property_type,
        year_built_min: searchCriteria.year_built_min,
        year_built_max: searchCriteria.year_built_max,
      });
      if (criteriaErr) throw new Error(`Failed to save search criteria: ${criteriaErr.message}`);

      // Write SMS config when channel is sms
      if (messageInfo.channel === 'sms') {
        await supabase.from('campaign_sms_config').insert({
          campaign_id: campaign.id,
          twilio_from_number: smsConfig.twilio_from_number,
          forward_to_phone: smsConfig.forward_to_phone,
        });
      }

      const { data: result, error: fnErr } = await supabase.functions.invoke('send-campaign-emails', {
        body: { campaign_id: campaign.id },
      });

      if (fnErr) {
        // Extract actual error message from the function response body when available
        const detail = (result as any)?.error || (result as any)?.details || fnErr.message;
        throw new Error(detail);
      }

      setEmailsSent(result?.emails_sent ?? 0);
    } catch (err: any) {
      console.error('Campaign creation failed:', err);
      setSubmitError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadTemplates = async () => {
    if (templatePicker.open) { setTemplatePicker(p => ({ ...p, open: false })); return; }
    setTemplatePicker(p => ({ ...p, open: true, loading: true }));
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setTemplatePicker(p => ({ ...p, loading: false })); return; }
    const { data } = await supabase
      .from('marketing_templates')
      .select('id, template_name, channel, subject, body, is_shared')
      .or(`user_id.eq.${user.id},is_shared.eq.true`)
      .order('created_at', { ascending: false });
    const all = data ?? [];
    setTemplatePicker(p => ({
      ...p,
      loading: false,
      myTemplates: all.filter(t => !t.is_shared),
      sharedTemplates: all.filter(t => t.is_shared),
    }));
  };

  const applyTemplate = (t: { channel: string; subject: string | null; body: string }) => {
    setMessageInfo(m => ({ ...m, channel: t.channel, subject: t.subject ?? '', body: t.body }));
    setTemplatePicker(p => ({ ...p, open: false }));
  };

  // Close template dropdown on outside click
  useEffect(() => {
    if (!templatePicker.open) return;
    const handler = (e: MouseEvent) => {
      if (templateDropdownRef.current && !templateDropdownRef.current.contains(e.target as Node)) {
        setTemplatePicker(p => ({ ...p, open: false }));
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [templatePicker.open]);

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------
  const renderProgress = () => (
    <div className="flex gap-0">
      {STEPS.map((s, i) => (
        <div key={i} className="flex items-center" style={{ flex: i < STEPS.length - 1 ? '1' : 'none' }}>
          <div
            className="flex flex-col items-center gap-1.5 cursor-pointer"
            onClick={() => handleStepClick(i)}
          >
            <div
              className="w-7 h-7 rounded-full border flex items-center justify-center text-xs font-medium transition-all"
              style={
                i === step
                  ? { background: '#FFCE0A', borderColor: '#FFCE0A', color: '#342e37' }
                  : i < step
                  ? { background: 'rgb(240 253 244)', borderColor: 'rgb(187 247 208)', color: 'rgb(21 128 61)' }
                  : { background: '#f3f4f6', borderColor: '#d1d5db', color: '#6b7280' }
              }
            >
              {i < step ? '✓' : i + 1}
            </div>
            <span
              className={`text-[11px] text-center ${i === step ? 'font-medium text-gray-900 dark:text-white' : 'font-normal text-gray-500'}`}
            >
              {s.short}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className="flex-1 h-px mx-2 mt-[-14px] bg-gray-200 dark:bg-white/10" />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep0Confirm = () => (
    <div className="mb-2">
      <div className="text-base font-medium text-gray-900 dark:text-white mb-1">Confirm your business details</div>
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-5">These appear in emails sent on your behalf</div>

      <div className="space-y-2 mb-5">
        {[
          { label: 'Business', value: businessInfo.business_name },
          { label: 'Your name', value: businessInfo.contact_name || '—' },
          { label: 'Reply-to', value: businessInfo.forward_to },
          { label: 'Mailing address', value: businessInfo.mailing_address || '—' },
          { label: 'Services', value: businessInfo.service_type.length ? businessInfo.service_type.join(', ') : '—' },
        ].map(row => (
          <div key={row.label} className="flex justify-between py-2 border-b border-gray-100 dark:border-white/10">
            <span className="text-sm text-gray-600 dark:text-gray-400">{row.label}</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{row.value}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setStep0Mode('edit')}
        className="text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600 transition-colors"
      >
        Edit details
      </button>
    </div>
  );

  const renderStep0Edit = () => (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-1">
        <div className="text-base font-medium text-gray-900 dark:text-white">Tell us about your business</div>
        {hasExistingProfile && (
          <button
            type="button"
            onClick={() => { setStepErrors({}); setStep0Mode('confirm'); }}
            className="text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600 transition-colors"
          >
            ← Back to confirm
          </button>
        )}
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-5">This appears in emails sent on your behalf</div>

      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">Business name</label>
      <Input
        value={businessInfo.business_name}
        onChange={e => setBusinessInfo(b => ({ ...b, business_name: e.target.value }))}
        placeholder="e.g. Denver Summit Roofing"
      />
      {stepErrors.business_name && <p className="text-xs text-red-500 mt-1">{stepErrors.business_name}</p>}

      <label className="block text-sm text-gray-600 dark:text-gray-400 mt-3.5 mb-1.5">Your name</label>
      <Input
        value={businessInfo.contact_name}
        onChange={e => setBusinessInfo(b => ({ ...b, contact_name: e.target.value }))}
        placeholder="e.g. Mike Thornton"
      />

      <label className="block text-sm text-gray-600 dark:text-gray-400 mt-3.5 mb-1.5">Reply-to email</label>
      <Input
        type="email"
        value={businessInfo.forward_to}
        onChange={e => setBusinessInfo(b => ({ ...b, forward_to: e.target.value }))}
        placeholder="you@yourbusiness.com"
      />
      {stepErrors.forward_to && <p className="text-xs text-red-500 mt-1">{stepErrors.forward_to}</p>}

      <label className="block text-sm text-gray-600 dark:text-gray-400 mt-3.5 mb-1.5">
        Mailing address <span className="text-gray-400 dark:text-gray-500 font-normal">(required for CAN-SPAM compliance)</span>
      </label>
      <Input
        value={businessInfo.mailing_address}
        onChange={e => setBusinessInfo(b => ({ ...b, mailing_address: e.target.value }))}
        placeholder="123 Main St, Denver, CO 80202"
      />
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Appears in the footer of every email sent on your behalf.</p>
      {stepErrors.mailing_address && <p className="text-xs text-red-500 mt-1">{stepErrors.mailing_address}</p>}

      <label className="block text-sm text-gray-600 dark:text-gray-400 mt-3.5 mb-1.5">Service type</label>
      <div className="flex flex-wrap gap-2 mt-1.5">
        {SERVICE_TAGS.map(tag => (
          <button
            key={tag}
            type="button"
            onClick={() => setBusinessInfo(b => ({
              ...b,
              service_type: b.service_type.includes(tag)
                ? b.service_type.filter(t => t !== tag)
                : [...b.service_type, tag],
            }))}
            className="px-3 py-1 rounded-full border text-xs transition-all"
            style={
              businessInfo.service_type.includes(tag)
                ? { background: '#FFCE0A', borderColor: '#FFCE0A', color: '#342e37' }
                : { background: '#f3f4f6', borderColor: '#d1d5db', color: '#6b7280' }
            }
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => {
    const handleSMTPSuccess = (connectionId: string) => {
      // Reload senders and select the new one
      const loadNewSender = async () => {
        if (!userId) return;
        const { data } = await supabase
          .from('integration_connections')
          .select('id, display_name, from_email, integration_id')
          .eq('id', connectionId)
          .single();

        if (data) {
          setSenders(prev => [...prev, data]);
          setSelectedSender(connectionId);
        }
      };
      loadNewSender();
      setSMTPModalOpen(false);
    };

    return (
      <div className="mb-2">
        <div className="text-base font-medium text-gray-900 dark:text-white mb-1">Where do you want listings from?</div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-5">We'll watch for new listings in this area and email the listing agent automatically</div>

        {/* Sender Selection */}
        <div className="mb-4">
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">Send from</label>
          <div className="flex gap-2">
            <select
              value={selectedSender || ''}
              onChange={(e) => {
                if (e.target.value === 'add_new') {
                  setSMTPModalOpen(true);
                } else {
                  setSelectedSender(e.target.value || null);
                }
              }}
              className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              <option value="">Shared mailbox (hello@listingping.com)</option>
              {senders.map(s => (
                <option key={s.id} value={s.id}>
                  {s.display_name || `${s.integration_id} (${s.from_email})`}
                </option>
              ))}
              <option value="add_new">+ Connect new account</option>
            </select>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Emails will be sent from this account. Connect your own for better deliverability.
          </p>
        </div>

        {/* Location */}
        <div className="mb-4">
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">Location</label>
        <CityAutocomplete
          value={searchCriteria.city}
          stateValue={searchCriteria.state}
          onSelect={(city, state) => {
            setSearchCriteria(c => ({ ...c, city, state }));
            setStepErrors(e => ({ ...e, city: '', state: '' }));
          }}
        />
        {(stepErrors.city || stepErrors.state) && (
          <p className="text-xs text-red-500 mt-1">{stepErrors.city || stepErrors.state}</p>
        )}
      </div>

      {/* Property Details */}
      <div className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 mt-5">Property Details</div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">Property Type</label>
          <select
            value={searchCriteria.property_type}
            onChange={e => setSearchCriteria(c => ({ ...c, property_type: e.target.value }))}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
          >
            {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">Listing Status</label>
          <select
            disabled
            className="w-full h-9 rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground cursor-not-allowed"
          >
            <option>Active</option>
          </select>
        </div>
      </div>

      {/* Price Range */}
      <div className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 mt-5">Price Range</div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">Min Price</label>
          <Input
            type="number"
            value={searchCriteria.price_min ?? ''}
            onChange={e => setSearchCriteria(c => ({ ...c, price_min: e.target.value ? Number(e.target.value) : null }))}
            placeholder="Any"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">Max Price</label>
          <Input
            type="number"
            value={searchCriteria.price_max ?? ''}
            onChange={e => setSearchCriteria(c => ({ ...c, price_max: e.target.value ? Number(e.target.value) : null }))}
            placeholder="Any"
          />
        </div>
      </div>

      {/* Listing Details */}
      <div className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 mt-5">Listing Details</div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">Year Built (min)</label>
          <Input
            type="number"
            value={searchCriteria.year_built_min ?? ''}
            onChange={e => setSearchCriteria(c => ({ ...c, year_built_min: e.target.value ? Number(e.target.value) : null }))}
            placeholder="e.g. 2000"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">Year Built (max)</label>
          <Input
            type="number"
            value={searchCriteria.year_built_max ?? ''}
            onChange={e => setSearchCriteria(c => ({ ...c, year_built_max: e.target.value ? Number(e.target.value) : null }))}
            placeholder="e.g. 2020"
          />
        </div>
      </div>

      <div className="mt-3.5">
        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">Days Listed</label>
        <Input
          type="number"
          min={1}
          value={searchCriteria.days_old}
          onChange={e => setSearchCriteria(c => ({ ...c, days_old: e.target.value }))}
          placeholder="1"
          className="max-w-[120px]"
        />
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Search tip: each search yields up to 500 listings.</p>
      </div>

      {/* SMTP Setup Modal */}
      {smtpModalOpen && (
        <SMTPSetupModal
          isOpen={smtpModalOpen}
          onClose={() => setSMTPModalOpen(false)}
          onSuccess={handleSMTPSuccess}
          userId={userId || ''}
          userContactName={businessInfo.contact_name}
          userBusinessName={businessInfo.business_name}
        />
      )}
    </div>
  );
};

  const renderStep2 = () => (
    <div className="mb-2">
      <div className="text-base font-medium text-gray-900 dark:text-white mb-1">Write your intro message</div>
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-5">
        Sent to every listing agent when a new listing matches your search. Keep it short and personal.
      </div>

      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">Campaign name</label>
      <Input
        value={messageInfo.campaign_name}
        onChange={e => setMessageInfo(m => ({ ...m, campaign_name: toTitleCase(e.target.value) }))}
        placeholder="e.g. $500 Off; New Client Offer"
      />
      {stepErrors.campaign_name && <p className="text-xs text-red-500 mt-1">{stepErrors.campaign_name}</p>}

      <label className="block text-sm text-gray-600 dark:text-gray-400 mt-3.5 mb-1.5">Channel</label>
      <div className="flex gap-2">
        {['email', 'sms'].map(ch => (
          <button
            key={ch}
            type="button"
            onClick={() => setMessageInfo(m => ({ ...m, channel: ch }))}
            className="px-4 py-1.5 rounded-full border text-xs font-medium transition-all capitalize"
            style={
              messageInfo.channel === ch
                ? { background: '#FFCE0A', borderColor: '#FFCE0A', color: '#342e37' }
                : { background: '#f3f4f6', borderColor: '#d1d5db', color: '#6b7280' }
            }
          >
            {ch === 'email' ? 'Email' : 'SMS'}
          </button>
        ))}
      </div>

      {/* Templates dropdown */}
      <div className="mt-2 relative inline-block" ref={templateDropdownRef}>
        <button
          type="button"
          onClick={loadTemplates}
          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        >
          Templates
          <span className="text-[10px] opacity-60">▾</span>
        </button>

        {templatePicker.open && (
          <div className="absolute left-0 top-full mt-1 z-50 w-64 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2a2a2a] shadow-lg overflow-hidden">
            {templatePicker.loading ? (
              <div className="py-4 text-center text-xs text-gray-400">Loading…</div>
            ) : (
              <div className="max-h-[280px] overflow-y-auto">
                {/* My Templates */}
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                  My Templates
                </div>
                {templatePicker.myTemplates.filter(t => t.channel === messageInfo.channel).length === 0 ? (
                  <div className="px-3 py-2.5 text-xs text-gray-400 italic">No saved templates yet</div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-white/5">
                    {templatePicker.myTemplates.filter(t => t.channel === messageInfo.channel).map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => applyTemplate(t)}
                        className="w-full text-left px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                      >
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{t.template_name}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 capitalize">
                          {t.channel} · {t.body.slice(0, 45)}{t.body.length > 45 ? '…' : ''}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Shared Templates */}
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-white/5 border-t border-b border-gray-100 dark:border-white/5">
                  Shared Templates
                </div>
                {templatePicker.sharedTemplates.filter(t => t.channel === messageInfo.channel).length === 0 ? (
                  <div className="px-3 py-2.5 text-xs text-gray-400 italic">No shared templates yet</div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-white/5">
                    {templatePicker.sharedTemplates.filter(t => t.channel === messageInfo.channel).map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => applyTemplate(t)}
                        className="w-full text-left px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                      >
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{t.template_name}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 capitalize">
                          {t.channel} · {t.body.slice(0, 45)}{t.body.length > 45 ? '…' : ''}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {messageInfo.channel === 'email' && (
        <>
          <label className="block text-sm text-gray-600 dark:text-gray-400 mt-3.5 mb-1.5">Subject line</label>
          <Input
            value={messageInfo.subject}
            onChange={e => setMessageInfo(m => ({ ...m, subject: e.target.value }))}
            placeholder="e.g. Roof certification for {{address}}"
          />
          {stepErrors.subject && <p className="text-xs text-red-500 mt-1">{stepErrors.subject}</p>}
        </>
      )}

      {messageInfo.channel === 'sms' && (
        <div className="mt-3.5 rounded-lg border border-gray-200 dark:border-white/10 p-4 space-y-3 bg-gray-50 dark:bg-[#1a1a1a]">
          <div className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">SMS Delivery</div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">Sending number</label>
            <Input
              type="tel"
              value={smsConfig.twilio_from_number}
              onChange={e => setSmsConfig(s => ({ ...s, twilio_from_number: e.target.value }))}
              placeholder="+18885550100"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Your Twilio number — must be SMS-capable</p>
            {stepErrors.twilio_from_number && <p className="text-xs text-red-500 mt-1">{stepErrors.twilio_from_number}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">Forward replies to</label>
            <Input
              type="tel"
              value={smsConfig.forward_to_phone}
              onChange={e => setSmsConfig(s => ({ ...s, forward_to_phone: e.target.value }))}
              placeholder="+13035550100"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Your phone — agent replies will be forwarded here</p>
            {stepErrors.forward_to_phone && <p className="text-xs text-red-500 mt-1">{stepErrors.forward_to_phone}</p>}
          </div>
        </div>
      )}

      <label className="block text-sm text-gray-600 dark:text-gray-400 mt-3.5 mb-1.5">Message body</label>
      <Textarea
        ref={textareaRef}
        value={messageInfo.body}
        onChange={e => {
          cursorPos.current = e.target.selectionStart ?? 0;
          cursorEnd.current = e.target.selectionEnd ?? 0;
          setMessageInfo(m => ({ ...m, body: e.target.value }));
        }}
        onSelect={e => {
          cursorPos.current = (e.target as HTMLTextAreaElement).selectionStart ?? 0;
          cursorEnd.current = (e.target as HTMLTextAreaElement).selectionEnd ?? 0;
        }}
        onClick={e => {
          cursorPos.current = (e.target as HTMLTextAreaElement).selectionStart ?? 0;
          cursorEnd.current = (e.target as HTMLTextAreaElement).selectionEnd ?? 0;
        }}
        onKeyUp={e => {
          cursorPos.current = (e.target as HTMLTextAreaElement).selectionStart ?? 0;
          cursorEnd.current = (e.target as HTMLTextAreaElement).selectionEnd ?? 0;
        }}
        rows={5}
        placeholder="Hi {{agent_name}}, I noticed a new listing at {{address}} in {{city}}..."
        className="resize-y"
      />
      {stepErrors.body && <p className="text-xs text-red-500 mt-1">{stepErrors.body}</p>}

      <div className="mt-2.5 mb-1">
        <span className="text-xs text-gray-400 dark:text-gray-500">Insert variable: </span>
        {VARS.map(v => (
          <button
            key={v}
            type="button"
            onMouseDown={e => e.preventDefault()}
            onClick={() => insertVar(v)}
            className="inline-block px-2 py-0.5 rounded-md text-xs mx-0.5 cursor-pointer transition-opacity hover:opacity-80"
            style={{ background: 'rgb(239 246 255)', color: 'rgb(29 78 216)' }}
          >
            {v}
          </button>
        ))}
        {!linkForm.open && (
          <button
            type="button"
            onMouseDown={e => {
              e.preventDefault();
              // Read selection directly from the textarea while it still has focus
              const ta = textareaRef.current;
              const start = ta?.selectionStart ?? cursorPos.current;
              const end = ta?.selectionEnd ?? cursorEnd.current;
              cursorPos.current = start;
              cursorEnd.current = end;
              const selectedText = messageInfo.body.slice(start, end);
              setLinkForm({ open: true, text: selectedText, url: '' });
            }}
            className="inline-block px-2 py-0.5 rounded-md text-xs mx-0.5 cursor-pointer transition-opacity hover:opacity-80"
            style={{ background: 'rgb(240 253 244)', color: 'rgb(21 128 61)' }}
          >
            + link
          </button>
        )}
      </div>

      {linkForm.open && (
        <div className="mt-2 mb-1 flex flex-wrap items-center gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10">
          <input
            autoFocus={!linkForm.text}
            type="text"
            placeholder="Display text"
            value={linkForm.text}
            onChange={e => setLinkForm(f => ({ ...f, text: e.target.value }))}
            className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white w-32 outline-none focus:border-[#FFCE0A]"
          />
          <input
            autoFocus={!!linkForm.text}
            type="url"
            placeholder="https://..."
            value={linkForm.url}
            onChange={e => setLinkForm(f => ({ ...f, url: e.target.value }))}
            onKeyDown={e => {
              if (e.key === 'Enter' && linkForm.text.trim() && linkForm.url.trim()) {
                doInsertLink(linkForm.text.trim(), linkForm.url.trim());
              }
            }}
            className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white w-48 outline-none focus:border-[#FFCE0A]"
          />
          <button
            type="button"
            disabled={!linkForm.text.trim() || !linkForm.url.trim()}
            onClick={() => doInsertLink(linkForm.text.trim(), linkForm.url.trim())}
            className="text-xs px-2.5 py-1 rounded font-medium transition-colors disabled:opacity-40"
            style={{ background: '#FFCE0A', color: '#342e37' }}
          >
            Insert
          </button>
          <button
            type="button"
            onClick={() => setLinkForm({ open: false, text: '', url: '' })}
            className="text-xs px-2 py-1 rounded text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      <label className="block text-sm text-gray-600 dark:text-gray-400 mt-3.5 mb-1.5">
        Preview <span className="text-xs text-gray-400 dark:text-gray-500">(how it looks to the agent)</span>
      </label>
      {messageInfo.body ? (
        <div
          className="rounded-lg p-4 text-sm text-gray-900 dark:text-white leading-relaxed min-h-[80px] bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10"
          dangerouslySetInnerHTML={{ __html: renderBodyPreview(messageInfo.body, searchCriteria.city) }}
        />
      ) : (
        <div className="rounded-lg p-4 text-sm leading-relaxed min-h-[80px] bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10">
          <span className="text-gray-400 dark:text-gray-500">Your message preview will appear here...</span>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => {
    if (isSubmitting) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 mb-2" style={{ minHeight: '260px' }}>
          <div
            className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: '#FFCE0A', borderTopColor: 'transparent' }}
          />
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Searching listings and sending emails to agents in {searchCriteria.city}...
          </p>
        </div>
      );
    }

    if (emailsSent !== null) {
      return (
        <div className="mb-2">
          <div className="text-base font-medium text-gray-900 dark:text-white mb-1">You're live</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-5">
            ListingBug is watching {searchCriteria.city}, {searchCriteria.state} and emailing agents on your behalf
          </div>

          <div className="grid grid-cols-3 gap-2.5 mb-5">
            {[
              { label: 'Emails sent', value: String(emailsSent) },
              { label: 'Replies', value: '0' },
              { label: 'City', value: searchCriteria.city || '—' },
            ].map(stat => (
              <div key={stat.label} className="rounded-lg p-3 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10">
                <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-1">{stat.label}</div>
                <div className="text-[22px] font-semibold text-gray-900 dark:text-white leading-none">{stat.value}</div>
              </div>
            ))}
          </div>

          <div
            className="text-sm font-bold mb-5 px-3 py-2 rounded-lg"
            style={{ background: '#FFCE0A', color: '#342e37' }}
          >
            {emailsSent} email{emailsSent !== 1 ? 's' : ''} sent to agents in {searchCriteria.city}
          </div>

          <button
            onClick={() => window.location.href = '/v2/dashboard'}
            className="w-full py-2.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
          >
            Go to dashboard →
          </button>
        </div>
      );
    }

    // Pre-submission summary
    const daysNum = typeof searchCriteria.days_old === 'string'
      ? parseInt(searchCriteria.days_old, 10) || 1
      : searchCriteria.days_old;
    const ybSummary = searchCriteria.year_built_min || searchCriteria.year_built_max
      ? `${searchCriteria.year_built_min ?? '?'}–${searchCriteria.year_built_max ?? '?'}`
      : '—';

    return (
      <div className="mb-2">
        <div className="text-base font-medium text-gray-900 dark:text-white mb-1">Review and go live</div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-5">
          ListingBug will start watching {searchCriteria.city}, {searchCriteria.state} and email matching agents daily.
        </div>

        <div className="space-y-2 mb-5">
          {[
            { label: 'Business', value: businessInfo.business_name },
            { label: 'Reply-to', value: businessInfo.forward_to },
            { label: 'Mailing address', value: businessInfo.mailing_address || '—' },
            { label: 'Location', value: `${searchCriteria.city}, ${searchCriteria.state}` },
            { label: 'Property type', value: searchCriteria.property_type },
            { label: 'Days listed', value: String(daysNum) },
            { label: 'Price range', value: (searchCriteria.price_min || searchCriteria.price_max) ? `$${(searchCriteria.price_min ?? 0).toLocaleString()} – $${(searchCriteria.price_max ?? 0).toLocaleString()}` : 'Any' },
            { label: 'Year built', value: ybSummary },
            { label: 'Campaign', value: searchCriteria.city ? `${searchCriteria.city} - ${messageInfo.campaign_name}` : messageInfo.campaign_name },
            { label: 'Channel', value: messageInfo.channel === 'email' ? 'Email' : 'SMS' },
          ].map(row => (
            <div key={row.label} className="flex justify-between py-2 border-b border-gray-100 dark:border-white/10">
              <span className="text-sm text-gray-600 dark:text-gray-400">{row.label}</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{row.value || '—'}</span>
            </div>
          ))}
        </div>

        {submitError && (
          <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">
            {submitError}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTestModal({ open: true, address: businessInfo.forward_to || '', sending: false, sent: false, error: null })}
            className="flex-none py-2.5 px-4 rounded-lg text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
          >
            Send test email
          </button>
          <button
            onClick={handleGoLive}
            disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-opacity disabled:opacity-60 hover:opacity-90"
            style={{ background: '#FFCE0A', color: '#342e37' }}
          >
            Send first emails →
          </button>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Nav bar
  // ---------------------------------------------------------------------------
  const isLastStep = step === STEPS.length - 1;
  const isFirstStep = step === 0;
  const isDone = emailsSent !== null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f]">
      <div className="max-w-[680px] mx-auto px-4 py-8">

        {/* Page header */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">New Campaign</h1>

        {/* Card wrapping steps + nav */}
        <div className="bg-white dark:bg-[#2F2F2F] rounded-lg border border-gray-200 dark:border-white/10">

          {/* Progress bar inside card */}
          <div className="px-6 pt-6 pb-5 border-b border-gray-200 dark:border-white/10">
            {renderProgress()}
          </div>

          {/* Step content */}
          <div className="px-6 py-6">
            {step === 0 && (step0Mode === null ? null : step0Mode === 'confirm' ? renderStep0Confirm() : renderStep0Edit())}
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </div>

          {/* Nav buttons inside card footer */}
          {!isDone && step0Mode !== null && (
            <div className="flex justify-between px-6 pb-6">
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2 rounded-lg border border-gray-200 dark:border-white/10 text-sm text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                style={{ visibility: isFirstStep ? 'hidden' : 'visible' }}
              >
                Back
              </button>
              {!isLastStep && (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isSavingProfile}
                  className="px-6 py-2 rounded-lg text-sm font-bold disabled:opacity-60 hover:opacity-90 transition-opacity"
                  style={{ background: '#FFCE0A', color: '#342e37' }}
                >
                  {isSavingProfile ? 'Saving...' : 'Next →'}
                </button>
              )}
            </div>
          )}

        </div>
      </div>

      <CityLimitModal
        isOpen={cityLimitOpen}
        onClose={() => setCityLimitOpen(false)}
        currentPlan={userPlan}
        citiesUsed={activeCityCount}
        onUpgrade={() => { window.location.href = '/billing'; }}
      />

      {/* Test email modal */}
      {testModal.open && (() => {
        const fromName = formatSenderName(businessInfo.contact_name, businessInfo.business_name);
        const previewSubject = messageInfo.subject
          ? messageInfo.subject
              .replace(/\{\{agent_name\}\}/g, 'Sarah')
              .replace(/\{\{address\}\}/g, '1842 Maple St')
              .replace(/\{\{city\}\}/g, searchCriteria.city || 'your city')
              .replace(/\{\{price\}\}/g, '$485,000')
              .replace(/\{\{listing_date\}\}/g, 'today')
          : '(no subject)';
        const sampleBody = messageInfo.body
          .replace(/\{\{agent_name\}\}/g, 'Sarah')
          .replace(/\{\{address\}\}/g, '1842 Maple St')
          .replace(/\{\{city\}\}/g, searchCriteria.city || 'Austin')
          .replace(/\{\{price\}\}/g, '$485,000')
          .replace(/\{\{listing_date\}\}/g, 'today');
        const sampleBodyHtml = sampleBody
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
            (_, t, u) => `<a href="${u}" style="color:#1d4ed8;text-decoration:underline">${t}</a>`)
          .replace(/\n/g, '<br/>');
        const previewHtml = `<div style="font-family:Georgia,serif;font-size:15px;line-height:1.6;max-width:580px;color:#222">${sampleBodyHtml}</div>`;

        const handleSendTest = async () => {
          if (!testModal.address.trim()) return;
          setTestModal(m => ({ ...m, sending: true, error: null }));
          try {
            const { error } = await supabase.functions.invoke('send-test-email', {
              body: { to: testModal.address.trim(), subject: messageInfo.subject, body: messageInfo.body, from_name: fromName, user_id: userId },
            });
            if (error) throw new Error(error.message);
            setTestModal(m => ({ ...m, sending: false, sent: true }));
          } catch (e: any) {
            setTestModal(m => ({ ...m, sending: false, error: e.message ?? 'Send failed' }));
          }
        };

        return (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            onClick={() => setTestModal(m => ({ ...m, open: false }))}
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div
              className="relative w-full sm:max-w-lg bg-white dark:bg-[#1e1e1e] rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col"
              style={{ maxHeight: '85svh' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 dark:border-white/10 shrink-0">
                <span className="font-semibold text-gray-900 dark:text-white">Send test email</span>
                <button
                  onClick={() => setTestModal(m => ({ ...m, open: false }))}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none"
                >×</button>
              </div>

              <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1 min-h-0">
                {/* From / Subject */}
                <div className="space-y-1.5">
                  <div className="flex gap-2 text-xs">
                    <span className="text-gray-400 dark:text-gray-500 w-14 shrink-0">From</span>
                    <span className="text-gray-700 dark:text-gray-300">{fromName} &lt;{FROM_EMAIL_DISPLAY}&gt;</span>
                  </div>
                  {messageInfo.channel === 'email' && (
                    <div className="flex gap-2 text-xs">
                      <span className="text-gray-400 dark:text-gray-500 w-14 shrink-0">Subject</span>
                      <span className="text-gray-700 dark:text-gray-300">{previewSubject}</span>
                    </div>
                  )}
                </div>

                {/* Body preview */}
                <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#1a1a1a] p-4">
                  <div
                    className="text-sm text-gray-900 dark:text-white leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderBodyPreview(messageInfo.body, searchCriteria.city) }}
                  />
                </div>

                {/* Address input */}
                {!testModal.sent ? (
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Send to</label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={testModal.address}
                      onChange={e => setTestModal(m => ({ ...m, address: e.target.value, error: null }))}
                      onKeyDown={e => { if (e.key === 'Enter') handleSendTest(); }}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white outline-none focus:border-[#FFCE0A]"
                    />
                    {testModal.error && (
                      <p className="text-xs text-red-500 mt-1">{testModal.error}</p>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-400">
                    Test email sent to {testModal.address}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex gap-2 px-5 pb-5 shrink-0">
                {!testModal.sent ? (
                  <>
                    <button
                      onClick={() => setTestModal(m => ({ ...m, open: false }))}
                      className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSendTest}
                      disabled={testModal.sending || !testModal.address.trim()}
                      className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-opacity disabled:opacity-50 hover:opacity-90"
                      style={{ background: '#FFCE0A', color: '#342e37' }}
                    >
                      {testModal.sending ? 'Sending…' : 'Send test'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setTestModal(m => ({ ...m, open: false }))}
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
                  >
                    Done
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
