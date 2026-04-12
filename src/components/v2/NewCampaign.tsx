import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { CityAutocomplete } from '../CityAutocomplete';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface BusinessInfo {
  business_name: string;
  contact_name: string;
  forward_to: string;
  service_type: string[];
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
const STEPS = [
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
    .replace(/\{\{agent_name\}\}/g, 'Sarah')
    .replace(/\{\{address\}\}/g, '1842 Maple St')
    .replace(/\{\{city\}\}/g, city || 'your city')
    .replace(/\{\{price\}\}/g, '$485,000')
    .replace(/\{\{listing_date\}\}/g, 'today');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function NewCampaign() {
  const [step, setStep] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const [step0Mode, setStep0Mode] = useState<'confirm' | 'edit'>('edit');
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    business_name: '',
    contact_name: '',
    forward_to: '',
    service_type: [],
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

  // Load auth + pre-populate for returning users
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data: userRecord } = await supabase
        .from('users')
        .select('business_name, contact_name, forward_to, service_type, email')
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
        };
        setBusinessInfo(info);
        if (userRecord.business_name && userRecord.forward_to) {
          setHasExistingProfile(true);
          setStep0Mode('confirm');
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
      if (!businessInfo.business_name.trim()) errors.business_name = 'Business name is required';
      if (!businessInfo.forward_to.trim()) errors.forward_to = 'Reply-to email is required';
    }
    if (s === 1) {
      if (!searchCriteria.city.trim()) errors.city = 'City is required — select one from the dropdown';
      if (!searchCriteria.state.trim()) errors.state = 'State is required';
    }
    if (s === 2) {
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
      }).eq('id', userId);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleNext = async () => {
    if (!validateStep(step)) return;
    if (step === 0) await saveBusinessInfo();
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
  // onMouseDown + e.preventDefault() on each chip prevents the button from
  // stealing focus from the textarea, so selectionStart/End remain valid
  // and we can read them directly at click time.
  const insertVar = (v: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newBody = messageInfo.body.slice(0, start) + v + messageInfo.body.slice(end);
    const newPos = start + v.length;
    setMessageInfo(m => ({ ...m, body: newBody }));
    // Restore cursor after React re-render
    requestAnimationFrame(() => {
      ta.setSelectionRange(newPos, newPos);
      ta.focus();
    });
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
          campaign_name: messageInfo.campaign_name,
          status: 'active',
          channel: messageInfo.channel,
          sender_type: 'default',
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

      await supabase.from('campaign_search_criteria').insert({
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

      if (fnErr) throw new Error(fnErr.message);

      setEmailsSent(result?.emails_sent ?? 0);
    } catch (err: any) {
      console.error('Campaign creation failed:', err);
      setSubmitError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
              className="text-[11px] text-center"
              style={{ color: i === step ? '#111827' : '#6b7280', fontWeight: i === step ? 500 : 400 }}
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

  const renderStep1 = () => (
    <div className="mb-2">
      <div className="text-base font-medium text-gray-900 dark:text-white mb-1">Where do you want listings from?</div>
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-5">We'll watch for new listings in this area and email the listing agent automatically</div>

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
    </div>
  );

  const renderStep2 = () => (
    <div className="mb-2">
      <div className="text-base font-medium text-gray-900 dark:text-white mb-1">Write your intro message</div>
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-5">
        Sent to every listing agent when a new listing matches your search. Keep it short and personal.
      </div>

      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">Campaign name</label>
      <Input
        value={messageInfo.campaign_name}
        onChange={e => setMessageInfo(m => ({ ...m, campaign_name: e.target.value }))}
        placeholder="e.g. Denver SFH outreach"
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
        onChange={e => setMessageInfo(m => ({ ...m, body: e.target.value }))}
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
      </div>

      <label className="block text-sm text-gray-600 dark:text-gray-400 mt-3.5 mb-1.5">
        Preview <span className="text-xs text-gray-400 dark:text-gray-500">(how it looks to the agent)</span>
      </label>
      <div className="rounded-lg p-4 text-sm text-gray-900 dark:text-white leading-relaxed min-h-[80px] bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10">
        {messageInfo.body
          ? interpolatePreview(messageInfo.body, searchCriteria.city)
          : <span className="text-gray-400 dark:text-gray-500">Your message preview will appear here...</span>
        }
      </div>
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
            { label: 'Location', value: `${searchCriteria.city}, ${searchCriteria.state}` },
            { label: 'Property type', value: searchCriteria.property_type },
            { label: 'Days listed', value: String(daysNum) },
            { label: 'Price range', value: (searchCriteria.price_min || searchCriteria.price_max) ? `$${(searchCriteria.price_min ?? 0).toLocaleString()} – $${(searchCriteria.price_max ?? 0).toLocaleString()}` : 'Any' },
            { label: 'Year built', value: ybSummary },
            { label: 'Campaign', value: messageInfo.campaign_name },
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

        <button
          onClick={handleGoLive}
          disabled={isSubmitting}
          className="w-full py-2.5 rounded-lg text-sm font-bold transition-opacity disabled:opacity-60 hover:opacity-90"
          style={{ background: '#FFCE0A', color: '#342e37' }}
        >
          Send first emails →
        </button>
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
            {step === 0 && (step0Mode === 'confirm' ? renderStep0Confirm() : renderStep0Edit())}
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </div>

          {/* Nav buttons inside card footer */}
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
    </div>
  );
}
