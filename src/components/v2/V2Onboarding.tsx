import { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { CityAutocomplete } from '../CityAutocomplete';
import { formatSenderName } from '../../lib/senderName';
import { SMTPSetupModal } from '../SMTPSetupModal';
import { Mail, Server } from 'lucide-react';

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

// 6-step flow: Connect account + business info + search + message + review + create account
const STEPS = [
  { label: 'Connect account', short: 'Connect' },
  { label: 'Your business', short: 'Business' },
  { label: 'Search area', short: 'Search' },
  { label: 'Your message', short: 'Message' },
  { label: 'Review', short: 'Review' },
  { label: 'Create account', short: 'Account' },
];

const PROPERTY_TYPES = [
  'Single Family', 'Condo', 'Townhouse', 'Manufactured',
  'Multi-Family', 'Apartment', 'Land',
];

// localStorage key for pending campaign data (used when email confirmation is required)
const PENDING_KEY = 'lb_pending_onboarding';

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
  s = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    (_, t, u) => `<a href="${u}" style="color:#1d4ed8;text-decoration:underline" target="_blank" rel="noopener noreferrer">${t}</a>`);
  s = s.replace(/\n/g, '<br>');
  return s;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function V2Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // Form state
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    business_name: '', contact_name: '', forward_to: '', service_type: [], mailing_address: '',
  });
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    city: '', state: '', listing_type: 'For Sale', days_old: 1,
    price_min: null, price_max: null, property_type: 'Single Family',
    year_built_min: null, year_built_max: null,
  });
  const [messageInfo, setMessageInfo] = useState<MessageInfo>({
    campaign_name: '', channel: 'email', subject: '', body: '',
  });
  const [smsConfig, setSmsConfig] = useState<SmsConfig>({
    twilio_from_number: '', forward_to_phone: '',
  });

  // Step-level errors
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  // Sender selection state
  const [selectedSenderId, setSelectedSenderId] = useState<string | null>(null);
  const [smtpModalOpen, setSMTPModalOpen] = useState(false);
  const [pendingSMTPConfig, setPendingSMTPConfig] = useState<any | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailsSent, setEmailsSent] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Signup state (step 4)
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupError, setSignupError] = useState('');
  const [isVerificationStep, setIsVerificationStep] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Message editor state
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cursorPos = useRef(0);
  const cursorEnd = useRef(0);
  const [linkForm, setLinkForm] = useState({ open: false, text: '', url: '' });
  const [testModal, setTestModal] = useState({ open: false, address: '', sending: false, sent: false, error: null as string | null });

  type Template = { id: string; template_name: string; channel: string; subject: string | null; body: string; is_shared: boolean };
  const [templatePicker, setTemplatePicker] = useState<{ open: boolean; loading: boolean; myTemplates: Template[]; sharedTemplates: Template[] }>({
    open: false, loading: false, myTemplates: [], sharedTemplates: [],
  });
  const templateDropdownRef = useRef<HTMLDivElement>(null);

  // Stop polling on unmount
  useEffect(() => {
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  // Pre-fill email from signupEmail into forward_to if user hasn't set it yet
  useEffect(() => {
    if (signupEmail && !businessInfo.forward_to) {
      setBusinessInfo(b => ({ ...b, forward_to: signupEmail }));
    }
  }, [signupEmail]);

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------
  const validateStep = (s: number): boolean => {
    const errors: Record<string, string> = {};
    // Step 0: Sender selection (optional - can skip)
    if (s === 0) {
      // No validation - sender is optional
    }
    // Step 1: Business info
    if (s === 1) {
      if (!businessInfo.business_name.trim()) errors.business_name = 'Business name is required';
      if (!businessInfo.forward_to.trim()) errors.forward_to = 'Reply-to email is required';
      if (!businessInfo.mailing_address.trim()) errors.mailing_address = 'Mailing address is required (CAN-SPAM compliance)';
    }
    // Step 2: Search area
    if (s === 2) {
      if (!searchCriteria.city.trim()) errors.city = 'City is required — select one from the dropdown';
      if (!searchCriteria.state.trim()) errors.state = 'State is required';
    }
    // Step 3: Message
    if (s === 3) {
      if (!messageInfo.campaign_name.trim()) errors.campaign_name = 'Campaign name is required';
      if (messageInfo.channel === 'email' && !messageInfo.subject.trim()) errors.subject = 'Subject line is required';
      if (!messageInfo.body.trim()) errors.body = 'Message body is required';
      if (messageInfo.channel === 'sms' && !smsConfig.twilio_from_number.trim()) errors.twilio_from_number = 'Sending number is required for SMS campaigns';
      if (messageInfo.channel === 'sms' && !smsConfig.forward_to_phone.trim()) errors.forward_to_phone = 'Forward-to phone is required for SMS campaigns';
    }
    // Step 4: Review (no validation)
    // Step 5: Create account
    if (s === 5) {
      if (!signupEmail.trim()) errors.signupEmail = 'Email is required';
      if (!signupPassword.trim()) errors.signupPassword = 'Password is required';
      if (signupPassword && signupPassword.length < 8) errors.signupPassword = 'Password must be at least 8 characters';
    }
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep(step)) return;
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
    flushSync(() => { setMessageInfo(m => ({ ...m, body: newBody })); });
    const ta = textareaRef.current;
    if (ta) { ta.setSelectionRange(newPos, newPos); ta.focus(); }
  };

  const doInsertLink = (text: string, url: string) => {
    const token = `[${text}](${url})`;
    const start = cursorPos.current;
    const end = cursorEnd.current;
    const body = messageInfo.body;
    const newBody = body.slice(0, start) + token + body.slice(end);
    const newPos = start + token.length;
    cursorPos.current = newPos;
    cursorEnd.current = newPos;
    flushSync(() => { setMessageInfo(m => ({ ...m, body: newBody })); });
    const ta = textareaRef.current;
    if (ta) { ta.setSelectionRange(newPos, newPos); ta.focus(); }
    setLinkForm({ open: false, text: '', url: '' });
  };

  // ---------------------------------------------------------------------------
  // Core campaign creation logic (runs after we have a confirmed user ID)
  // ---------------------------------------------------------------------------
  const createCampaignAndSend = async (userId: string) => {
    // Write business info to user record
    await supabase.from('users').upsert({
      id: userId,
      business_name: businessInfo.business_name,
      contact_name: businessInfo.contact_name,
      forward_to: businessInfo.forward_to,
      service_type: businessInfo.service_type.join(','),
      mailing_address: businessInfo.mailing_address,
    });

    const campaignName = searchCriteria.city
      ? `${searchCriteria.city} - ${messageInfo.campaign_name}`
      : messageInfo.campaign_name;

    const { data: campaign, error: campaignErr } = await supabase
      .from('campaigns')
      .insert({
        user_id: userId,
        campaign_name: campaignName,
        status: 'active',
        channel: messageInfo.channel,
        sender_type: 'default',
        sender_id: selectedSenderId,  // User-selected sending identity
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
      const detail = (result as any)?.error || (result as any)?.details || fnErr.message;
      throw new Error(detail);
    }

    return result?.emails_sent ?? 0;
  };

  // ---------------------------------------------------------------------------
  // Signup + go live (called from step 4)
  // ---------------------------------------------------------------------------
  const handleSignupAndGoLive = async () => {
    if (!validateStep(4)) return;
    setIsSubmitting(true);
    setSubmitError(null);
    setSignupError('');

    try {
      const { data: signupData, error: authErr } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: { emailRedirectTo: `${window.location.origin}/v2/dashboard` },
      });

      // Supabase silently "succeeds" for existing emails → empty identities
      const emailAlreadyExists = !authErr && signupData?.user?.identities?.length === 0;
      if (emailAlreadyExists) {
        setSignupError('An account with that email already exists. Please sign in instead.');
        setIsSubmitting(false);
        return;
      }

      if (authErr) {
        setSignupError(authErr.message);
        setIsSubmitting(false);
        return;
      }

      const userId = signupData?.user?.id;
      if (!userId) {
        setSignupError('Something went wrong. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Case 1: Session returned immediately (email confirmation disabled)
      if (signupData?.session) {
        const sent = await createCampaignAndSend(userId);
        setEmailsSent(sent);
        setIsSubmitting(false);
        return;
      }

      // Case 2: Email confirmation required — save data to localStorage, show verification UI
      localStorage.setItem(PENDING_KEY, JSON.stringify({
        userId,
        businessInfo,
        searchCriteria,
        messageInfo,
        smsConfig,
      }));

      setIsVerificationStep(true);
      setIsSubmitting(false);

      // Poll for email confirmation — same pattern as SignUpPage
      pollingRef.current = setInterval(async () => {
        const { data: pollData, error: pollErr } = await supabase.auth.signInWithPassword({
          email: signupEmail,
          password: signupPassword,
        });
        if (pollData?.session && !pollErr) {
          clearInterval(pollingRef.current!);
          // Now confirmed — create campaign
          const pending = localStorage.getItem(PENDING_KEY);
          if (pending) {
            try {
              const sent = await createCampaignAndSend(pollData.session.user.id);
              localStorage.removeItem(PENDING_KEY);
              setEmailsSent(sent);
            } catch (err: any) {
              console.error('Failed to create campaign after confirmation:', err);
              // Still navigate to dashboard — V2Dashboard will retry via localStorage
              navigate('/v2/dashboard');
            }
          } else {
            navigate('/v2/dashboard');
          }
        }
      }, 3000);
    } catch (err: any) {
      console.error('Signup/campaign creation failed:', err);
      setSubmitError(err.message || 'Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Templates
  // ---------------------------------------------------------------------------
  const loadTemplates = async () => {
    if (templatePicker.open) { setTemplatePicker(p => ({ ...p, open: false })); return; }
    setTemplatePicker(p => ({ ...p, open: true, loading: true }));
    // For unauthenticated users, only show shared templates
    const { data } = await supabase
      .from('marketing_templates')
      .select('id, template_name, channel, subject, body, is_shared')
      .eq('is_shared', true)
      .order('created_at', { ascending: false });
    setTemplatePicker(p => ({
      ...p,
      loading: false,
      myTemplates: [],
      sharedTemplates: data ?? [],
    }));
  };

  const applyTemplate = (t: { channel: string; subject: string | null; body: string }) => {
    setMessageInfo(m => ({ ...m, channel: t.channel, subject: t.subject ?? '', body: t.body }));
    setTemplatePicker(p => ({ ...p, open: false }));
  };

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
          <div className="flex flex-col items-center gap-1.5 cursor-pointer" onClick={() => handleStepClick(i)}>
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
            <span className={`text-[11px] text-center ${i === step ? 'font-medium text-gray-900 dark:text-white' : 'font-normal text-gray-500'}`}>
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

  // Step 0 — Connect sending account (informational for now)
  const renderStep0 = () => {
    return (
      <div className="mb-2">
        <div className="text-base font-medium text-gray-900 dark:text-white mb-1">Choose your sending method</div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-5">
          For your first campaign, we'll use our shared mailbox. After creating your account, you can connect your own email provider for better deliverability.
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {/* SMTP Card */}
          <div className="group relative p-4 rounded-lg border-2 border-gray-200 dark:border-white/10 bg-white dark:bg-[#2F2F2F]">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                <Server className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white mb-1">Custom SMTP</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Use your own mail server
                </div>
              </div>
            </div>
          </div>

          {/* Gmail - Coming Soon */}
          <div className="group relative p-4 rounded-lg border-2 border-gray-200 dark:border-white/10 bg-white dark:bg-[#2F2F2F]">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white mb-1">Gmail</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Send via Google OAuth
                </div>
              </div>
            </div>
          </div>

          {/* Outlook */}
          <div className="group relative p-4 rounded-lg border-2 border-gray-200 dark:border-white/10 bg-white dark:bg-[#2F2F2F]">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white mb-1">Outlook</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Send via Microsoft OAuth
                </div>
              </div>
            </div>
          </div>

          {/* SendGrid/Mailchimp/HubSpot */}
          <div className="group relative p-4 rounded-lg border-2 border-gray-200 dark:border-white/10 bg-white dark:bg-[#2F2F2F]">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white mb-1">SendGrid/Mailchimp</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Use your existing integration
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>For now:</strong> We'll use our shared mailbox (hello@listingping.com) with your business name as the sender.
            After signup, you can connect your own email provider in Settings → Sending Accounts.
          </p>
        </div>
      </div>
    );
  };

  // Step 1 — Business info (always edit mode, no returning-user check)
  const renderStep1 = () => (
    <div className="mb-2">
      <div className="text-base font-medium text-gray-900 dark:text-white mb-1">Tell us about your business</div>
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

  // Step 2 — Search area (identical to NewCampaign)
  const renderStep2 = () => (
    <div className="mb-2">
      <div className="text-base font-medium text-gray-900 dark:text-white mb-1">Where do you want listings from?</div>
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-5">We'll watch for new listings in this area and email the listing agent automatically</div>

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
          <select disabled className="w-full h-9 rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground cursor-not-allowed">
            <option>Active</option>
          </select>
        </div>
      </div>

      <div className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 mt-5">Price Range</div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">Min Price</label>
          <Input type="number" value={searchCriteria.price_min ?? ''} onChange={e => setSearchCriteria(c => ({ ...c, price_min: e.target.value ? Number(e.target.value) : null }))} placeholder="Any" />
        </div>
        <div className="flex-1">
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">Max Price</label>
          <Input type="number" value={searchCriteria.price_max ?? ''} onChange={e => setSearchCriteria(c => ({ ...c, price_max: e.target.value ? Number(e.target.value) : null }))} placeholder="Any" />
        </div>
      </div>

      <div className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 mt-5">Listing Details</div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">Year Built (min)</label>
          <Input type="number" value={searchCriteria.year_built_min ?? ''} onChange={e => setSearchCriteria(c => ({ ...c, year_built_min: e.target.value ? Number(e.target.value) : null }))} placeholder="e.g. 2000" />
        </div>
        <div className="flex-1">
          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">Year Built (max)</label>
          <Input type="number" value={searchCriteria.year_built_max ?? ''} onChange={e => setSearchCriteria(c => ({ ...c, year_built_max: e.target.value ? Number(e.target.value) : null }))} placeholder="e.g. 2020" />
        </div>
      </div>

      <div className="mt-3.5">
        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">Days Listed</label>
        <Input type="number" min={1} value={searchCriteria.days_old} onChange={e => setSearchCriteria(c => ({ ...c, days_old: e.target.value }))} placeholder="1" className="max-w-[120px]" />
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Search tip: each search yields up to 500 listings.</p>
      </div>
    </div>
  );

  // Step 3 — Message (identical to NewCampaign)
  const renderStep3 = () => (
    <div className="mb-2">
      <div className="text-base font-medium text-gray-900 dark:text-white mb-1">Write your intro message</div>
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-5">
        Sent to every listing agent when a new listing matches your search. Keep it short and personal.
      </div>

      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">Campaign name</label>
      <Input value={messageInfo.campaign_name} onChange={e => setMessageInfo(m => ({ ...m, campaign_name: toTitleCase(e.target.value) }))} placeholder="e.g. $500 Off; New Client Offer" />
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
          Templates <span className="text-[10px] opacity-60">▾</span>
        </button>
        {templatePicker.open && (
          <div className="absolute left-0 top-full mt-1 z-50 w-64 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2a2a2a] shadow-lg overflow-hidden">
            {templatePicker.loading ? (
              <div className="py-4 text-center text-xs text-gray-400">Loading…</div>
            ) : (
              <div className="max-h-[280px] overflow-y-auto">
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                  Starter Templates
                </div>
                {templatePicker.sharedTemplates.filter(t => t.channel === messageInfo.channel).length === 0 ? (
                  <div className="px-3 py-2.5 text-xs text-gray-400 italic">No templates yet</div>
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
          <Input value={messageInfo.subject} onChange={e => setMessageInfo(m => ({ ...m, subject: e.target.value }))} placeholder="e.g. Roof certification for {{address}}" />
          {stepErrors.subject && <p className="text-xs text-red-500 mt-1">{stepErrors.subject}</p>}
        </>
      )}

      {messageInfo.channel === 'sms' && (
        <div className="mt-3.5 rounded-lg border border-gray-200 dark:border-white/10 p-4 space-y-3 bg-gray-50 dark:bg-[#1a1a1a]">
          <div className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">SMS Delivery</div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">Sending number</label>
            <Input type="tel" value={smsConfig.twilio_from_number} onChange={e => setSmsConfig(s => ({ ...s, twilio_from_number: e.target.value }))} placeholder="+18885550100" />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Your Twilio number — must be SMS-capable</p>
            {stepErrors.twilio_from_number && <p className="text-xs text-red-500 mt-1">{stepErrors.twilio_from_number}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">Forward replies to</label>
            <Input type="tel" value={smsConfig.forward_to_phone} onChange={e => setSmsConfig(s => ({ ...s, forward_to_phone: e.target.value }))} placeholder="+13035550100" />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Your phone — agent replies will be forwarded here</p>
            {stepErrors.forward_to_phone && <p className="text-xs text-red-500 mt-1">{stepErrors.forward_to_phone}</p>}
          </div>
        </div>
      )}

      <label className="block text-sm text-gray-600 dark:text-gray-400 mt-3.5 mb-1.5">Message body</label>
      <Textarea
        ref={textareaRef}
        value={messageInfo.body}
        onChange={e => { cursorPos.current = e.target.selectionStart ?? 0; cursorEnd.current = e.target.selectionEnd ?? 0; setMessageInfo(m => ({ ...m, body: e.target.value })); }}
        onSelect={e => { cursorPos.current = (e.target as HTMLTextAreaElement).selectionStart ?? 0; cursorEnd.current = (e.target as HTMLTextAreaElement).selectionEnd ?? 0; }}
        onClick={e => { cursorPos.current = (e.target as HTMLTextAreaElement).selectionStart ?? 0; cursorEnd.current = (e.target as HTMLTextAreaElement).selectionEnd ?? 0; }}
        onKeyUp={e => { cursorPos.current = (e.target as HTMLTextAreaElement).selectionStart ?? 0; cursorEnd.current = (e.target as HTMLTextAreaElement).selectionEnd ?? 0; }}
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
              const ta = textareaRef.current;
              const start = ta?.selectionStart ?? cursorPos.current;
              const end = ta?.selectionEnd ?? cursorEnd.current;
              cursorPos.current = start; cursorEnd.current = end;
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
          <input autoFocus={!linkForm.text} type="text" placeholder="Display text" value={linkForm.text} onChange={e => setLinkForm(f => ({ ...f, text: e.target.value }))} className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white w-32 outline-none focus:border-[#FFCE0A]" />
          <input autoFocus={!!linkForm.text} type="url" placeholder="https://..." value={linkForm.url} onChange={e => setLinkForm(f => ({ ...f, url: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter' && linkForm.text.trim() && linkForm.url.trim()) doInsertLink(linkForm.text.trim(), linkForm.url.trim()); }} className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white w-48 outline-none focus:border-[#FFCE0A]" />
          <button type="button" disabled={!linkForm.text.trim() || !linkForm.url.trim()} onClick={() => doInsertLink(linkForm.text.trim(), linkForm.url.trim())} className="text-xs px-2.5 py-1 rounded font-medium transition-colors disabled:opacity-40" style={{ background: '#FFCE0A', color: '#342e37' }}>Insert</button>
          <button type="button" onClick={() => setLinkForm({ open: false, text: '', url: '' })} className="text-xs px-2 py-1 rounded text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Cancel</button>
        </div>
      )}

      <label className="block text-sm text-gray-600 dark:text-gray-400 mt-3.5 mb-1.5">
        Preview <span className="text-xs text-gray-400 dark:text-gray-500">(how it looks to the agent)</span>
      </label>
      {messageInfo.body ? (
        <div className="rounded-lg p-4 text-sm text-gray-900 dark:text-white leading-relaxed min-h-[80px] bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10" dangerouslySetInnerHTML={{ __html: renderBodyPreview(messageInfo.body, searchCriteria.city) }} />
      ) : (
        <div className="rounded-lg p-4 text-sm leading-relaxed min-h-[80px] bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10">
          <span className="text-gray-400 dark:text-gray-500">Your message preview will appear here...</span>
        </div>
      )}
    </div>
  );

  // Step 4 — Review summary (no submit button here; user clicks Next → to proceed to step 5)
  const renderStep4 = () => {
    const daysNum = typeof searchCriteria.days_old === 'string'
      ? parseInt(searchCriteria.days_old, 10) || 1
      : searchCriteria.days_old;
    const ybSummary = searchCriteria.year_built_min || searchCriteria.year_built_max
      ? `${searchCriteria.year_built_min ?? '?'}–${searchCriteria.year_built_max ?? '?'}`
      : '—';

    return (
      <div className="mb-2">
        <div className="text-base font-medium text-gray-900 dark:text-white mb-1">Review your campaign</div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-5">
          Looks good? Create your account on the next step to go live.
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

        {/* Optional: send test email before creating account */}
        <button
          type="button"
          onClick={() => setTestModal({ open: true, address: businessInfo.forward_to || '', sending: false, sent: false, error: null })}
          className="text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600 transition-colors"
        >
          Send a test email to yourself first
        </button>
      </div>
    );
  };

  // Step 5 — Create account
  const renderStep5 = () => {
    // Sending spinner
    if (isSubmitting) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 mb-2" style={{ minHeight: '260px' }}>
          <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#FFCE0A', borderTopColor: 'transparent' }} />
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Creating your account and sending emails to agents in {searchCriteria.city}...
          </p>
        </div>
      );
    }

    // Emails sent successfully (email conf disabled path)
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
          <div className="text-sm font-bold mb-5 px-3 py-2 rounded-lg" style={{ background: '#FFCE0A', color: '#342e37' }}>
            {emailsSent} email{emailsSent !== 1 ? 's' : ''} sent to agents in {searchCriteria.city}
          </div>
          <button onClick={() => navigate('/v2/dashboard')} className="w-full py-2.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
            Go to dashboard →
          </button>
        </div>
      );
    }

    // Email confirmation pending
    if (isVerificationStep) {
      return (
        <div className="mb-2 text-center" style={{ minHeight: '260px' }}>
          <div className="text-4xl mb-4">📬</div>
          <div className="text-base font-medium text-gray-900 dark:text-white mb-2">Check your email</div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            We sent a confirmation link to <strong className="text-gray-900 dark:text-white">{signupEmail}</strong>.
            Click it to confirm your account — we'll send your first emails to agents in {searchCriteria.city} automatically.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#FFCE0A', borderTopColor: 'transparent' }} />
            Waiting for confirmation…
          </div>
        </div>
      );
    }

    // Default: signup form
    return (
      <div className="mb-2">
        <div className="text-base font-medium text-gray-900 dark:text-white mb-1">Create your account</div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-5">
          You're almost there. Create a free account and we'll send your first emails to agents in {searchCriteria.city}.
        </div>

        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">Email</label>
        <Input
          type="email"
          value={signupEmail}
          onChange={e => { setSignupEmail(e.target.value); setSignupError(''); }}
          placeholder="you@yourbusiness.com"
          autoComplete="email"
        />
        {stepErrors.signupEmail && <p className="text-xs text-red-500 mt-1">{stepErrors.signupEmail}</p>}

        <label className="block text-sm text-gray-600 dark:text-gray-400 mt-3.5 mb-1.5">Password</label>
        <Input
          type="password"
          value={signupPassword}
          onChange={e => { setSignupPassword(e.target.value); setSignupError(''); }}
          placeholder="At least 8 characters"
          autoComplete="new-password"
        />
        {stepErrors.signupPassword && <p className="text-xs text-red-500 mt-1">{stepErrors.signupPassword}</p>}

        {signupError && (
          <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2 mt-3">
            {signupError === '__email_exists__'
              ? <>An account with that email already exists. <a href="/login" className="underline">Sign in instead →</a></>
              : signupError}
          </div>
        )}

        {submitError && (
          <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2 mt-3">
            {submitError}
          </div>
        )}

        <div className="mt-5">
          <button
            onClick={handleSignupAndGoLive}
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-lg text-sm font-bold transition-opacity disabled:opacity-60 hover:opacity-90"
            style={{ background: '#FFCE0A', color: '#342e37' }}
          >
            Send first emails →
          </button>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 text-center">
          7-day free trial · No credit card required · Cancel anytime
        </p>

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 text-center">
          Already have an account?{' '}
          <a href="/login" className="underline underline-offset-2 hover:text-gray-600 dark:hover:text-gray-300">Sign in</a>
        </p>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Layout
  // ---------------------------------------------------------------------------
  const isLastStep = step === STEPS.length - 1;
  const isFirstStep = step === 0;
  const isDone = emailsSent !== null || isVerificationStep;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f]">
      {/* Minimal header */}
      <div className="border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] px-4 py-3 flex items-center justify-between">
        <a href="/v2" className="text-[17px] font-bold text-[#342e37] dark:text-white tracking-tight">ListingBug</a>
        <span className="text-xs text-gray-400 dark:text-gray-500">Set up your first campaign</span>
      </div>

      <div className="max-w-[680px] mx-auto px-4 py-8">
        <div className="bg-white dark:bg-[#2F2F2F] rounded-lg border border-gray-200 dark:border-white/10">
          {/* Progress */}
          <div className="px-6 pt-6 pb-5 border-b border-gray-200 dark:border-white/10">
            {renderProgress()}
          </div>

          {/* Step content */}
          <div className="px-6 py-6">
            {step === 0 && renderStep0()}
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
            {step === 5 && renderStep5()}
          </div>

          {/* Nav buttons — hidden on last step (step 4 has its own inline CTA) and when done */}
          {!isDone && (
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
                  className="px-6 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
                  style={{ background: '#FFCE0A', color: '#342e37' }}
                >
                  Next →
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Test email modal (identical to NewCampaign) */}
      {testModal.open && (() => {
        const fromName = formatSenderName(businessInfo.contact_name, businessInfo.business_name);
        const previewSubject = messageInfo.subject
          ? messageInfo.subject.replace(/\{\{agent_name\}\}/g, 'Sarah').replace(/\{\{address\}\}/g, '1842 Maple St').replace(/\{\{city\}\}/g, searchCriteria.city || 'your city').replace(/\{\{price\}\}/g, '$485,000').replace(/\{\{listing_date\}\}/g, 'today')
          : '(no subject)';

        const handleSendTest = async () => {
          if (!testModal.address.trim()) return;
          setTestModal(m => ({ ...m, sending: true, error: null }));
          try {
            const { error } = await supabase.functions.invoke('send-test-email', {
              body: { to: testModal.address.trim(), subject: messageInfo.subject, body: messageInfo.body, from_name: fromName },
            });
            if (error) throw new Error(error.message);
            setTestModal(m => ({ ...m, sending: false, sent: true }));
          } catch (e: any) {
            setTestModal(m => ({ ...m, sending: false, error: e.message ?? 'Send failed' }));
          }
        };

        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setTestModal(m => ({ ...m, open: false }))}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div className="relative w-full sm:max-w-lg bg-white dark:bg-[#1e1e1e] rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col" style={{ maxHeight: '85svh' }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 dark:border-white/10 shrink-0">
                <span className="font-semibold text-gray-900 dark:text-white">Send test email</span>
                <button onClick={() => setTestModal(m => ({ ...m, open: false }))} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none">×</button>
              </div>
              <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1 min-h-0">
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
                <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#1a1a1a] p-4">
                  <div className="text-sm text-gray-900 dark:text-white leading-relaxed" dangerouslySetInnerHTML={{ __html: renderBodyPreview(messageInfo.body, searchCriteria.city) }} />
                </div>
                {!testModal.sent ? (
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Send to</label>
                    <input type="email" placeholder="you@example.com" value={testModal.address} onChange={e => setTestModal(m => ({ ...m, address: e.target.value, error: null }))} onKeyDown={e => { if (e.key === 'Enter') handleSendTest(); }} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white outline-none focus:border-[#FFCE0A]" />
                    {testModal.error && <p className="text-xs text-red-500 mt-1">{testModal.error}</p>}
                  </div>
                ) : (
                  <div className="rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-400">Test email sent to {testModal.address}</div>
                )}
              </div>
              <div className="flex gap-2 px-5 pb-5 shrink-0">
                {!testModal.sent ? (
                  <>
                    <button onClick={() => setTestModal(m => ({ ...m, open: false }))} className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">Cancel</button>
                    <button onClick={handleSendTest} disabled={testModal.sending || !testModal.address.trim()} className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-opacity disabled:opacity-50 hover:opacity-90" style={{ background: '#FFCE0A', color: '#342e37' }}>{testModal.sending ? 'Sending…' : 'Send test'}</button>
                  </>
                ) : (
                  <button onClick={() => setTestModal(m => ({ ...m, open: false }))} className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">Done</button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
