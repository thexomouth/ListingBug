import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { CityAutocomplete } from '../CityAutocomplete';
import { SMTPSetupModal } from '../SMTPSetupModal';
import { RichTextEditor } from './editor/RichTextEditor';
import { buildPreviewHtml } from './editor/previewUtils';
import { Mail, Server, CheckCircle2, Pencil } from 'lucide-react';
import { GenerateModal, StarIcon, type GenerateContext, type GenerateTargetField } from '../GenerateModal';
import patternBgLight from 'figma:asset/8435b26aaf23ac49cf6eeff1fe337b24fe375fb0.png';
import patternBgDark from 'figma:asset/b916b80137b1bd7badbcf865751a03133a7f7893.png';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import headerLogoSimplified from 'figma:asset/18389b12a0fe14349edcb6b64a2864bb6264d47e.png';
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
  preview_text: string;
  variant_b_subject: string;
  variant_b_preview_text: string;
  variant_b_body: string;
  variant_c_subject: string;
  variant_c_preview_text: string;
  variant_c_body: string;
  variant_d_subject: string;
  variant_d_preview_text: string;
  variant_d_body: string;
}

interface SmsConfig {
  twilio_from_number: string;
  forward_to_phone: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const SERVICE_TAGS = [
  'Photography', 'Videography', 'Virtual Tours', 'Drone / Aerial',
  'Staging', 'Inspection', 'Roofing', 'Pest Control', 'HVAC', 'Cleaning', 'Landscaping',
  'Moving & Storage', 'Mortgage / Lending', 'Title & Escrow', 'Insurance',
  'Appraisal', 'Contractor / Repair', 'Legal / Attorney',
];

const MERGE_TAGS = [
  { label: 'Agent Name',    variable: '{{agent_name}}' },
  { label: 'Address',       variable: '{{address}}' },
  { label: 'Price',         variable: '{{price}}' },
  { label: 'City',          variable: '{{city}}' },
  { label: 'Listing Date',  variable: '{{listing_date}}' },
];

// 6-step flow: Connect account + business info + search + message + review + create account
const STEPS = [
  { label: 'Connect account', short: 'Connect' },
  { label: 'Your business', short: 'Business' },
  { label: 'Search area', short: 'Listings' },
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
function toTitleCase(str: string): string {
  return str.replace(/\b\w+/g, word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
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
    campaign_name: '', channel: 'email', subject: '', body: '', preview_text: '',
    variant_b_subject: '', variant_b_preview_text: '', variant_b_body: '',
    variant_c_subject: '', variant_c_preview_text: '', variant_c_body: '',
    variant_d_subject: '', variant_d_preview_text: '', variant_d_body: '',
  });
  type VariantKey = 'A' | 'B' | 'C' | 'D';
  const [activeVariant, setActiveVariant] = useState<VariantKey>('A');
  const [smsConfig, setSmsConfig] = useState<SmsConfig>({
    twilio_from_number: '', forward_to_phone: '',
  });

  // Step-level errors
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generateField, setGenerateField] = useState<GenerateTargetField | null>(null);

  // Sender selection state
  const [selectedSenderId, setSelectedSenderId] = useState<string | null>(null);
  const [smtpModalOpen, setSMTPModalOpen] = useState(false);
  const [pendingSMTPConfig, setPendingSMTPConfig] = useState<any | null>(null);
  const [connectedSenders, setConnectedSenders] = useState<Array<{ id: string; email: string; provider: string; display_name: string }>>([]);
  const [checkingSender, setCheckingSender] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailsSent, setEmailsSent] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [listingPreview, setListingPreview] = useState<{ count: number; agentCount: number; listings: any[]; isTestMode?: boolean } | null>(null);
  const [listingPreviewLoading, setListingPreviewLoading] = useState(false);
  const [testSendModal, setTestSendModal] = useState({ open: false, email: '' });

  // Signup state (step 4)
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupError, setSignupError] = useState('');
  const [isVerificationStep, setIsVerificationStep] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Message editor state
  const subjectRef = useRef<HTMLInputElement>(null);
  const subjectCursorPos = useRef(0);
  const subjectCursorEnd = useRef(0);
  const [testModal, setTestModal] = useState({ open: false, address: '', sending: false, sent: false, error: null as string | null });

  type Template = { id: string; name: string; channel: string; subject: string | null; body: string; is_shared: boolean };
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

  // Initialize anonymous session if needed, then check for connected sender
  useEffect(() => {
    const initializeSession = async () => {
      let currentSession = (await supabase.auth.getSession()).data.session;

      // Create anonymous session if user is not authenticated
      if (!currentSession) {
        console.log('[V2Onboarding] No session found, creating anonymous session');
        const { data, error } = await supabase.auth.signInAnonymously();

        if (error) {
          console.error('[V2Onboarding] Failed to create anonymous session:', error);
          toast.error('Failed to initialize session. Please refresh the page.');
          setCheckingSender(false);
          return;
        }

        currentSession = data.session;
        console.log('[V2Onboarding] Anonymous session created:', currentSession?.user.id);
      }

      // Store current user ID
      if (currentSession?.user?.id) {
        setCurrentUserId(currentSession.user.id);
      }

      return currentSession;
    };

    const checkConnectedSender = async () => {
      try {
        const session = await initializeSession();
        if (!session) {
          setCheckingSender(false);
          return;
        }

        const { data: senders, error } = await supabase
          .from('integration_connections')
          .select('id, sending_email, integration_id, status, display_name, is_primary_sender')
          .eq('user_id', session.user.id)
          .eq('is_sender', true)
          .eq('status', 'active')
          .order('is_primary_sender', { ascending: false });

        if (!error && senders && senders.length > 0) {
          setConnectedSenders(senders.map(s => ({
            id: s.id,
            email: s.sending_email,
            provider: s.integration_id,
            display_name: s.display_name || s.sending_email,
          })));
        }
      } catch (err) {
        console.error('[V2Onboarding] Failed to check connected sender:', err);
      } finally {
        setCheckingSender(false);
      }
    };

    checkConnectedSender();

    // Check for OAuth callback success/error messages
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');

    if (success === 'gmail_connected') {
      toast.success('Gmail account connected successfully!');
      checkConnectedSender();  // Refresh sender state
    } else if (success === 'outlook_connected') {
      toast.success('Outlook account connected successfully!');
      checkConnectedSender();  // Refresh sender state
    } else if (error) {
      const errorMessages: Record<string, string> = {
        gmail_canceled: 'Gmail connection was canceled',
        gmail_invalid: 'Invalid Gmail authorization',
        gmail_exchange_failed: 'Failed to connect Gmail account',
        outlook_canceled: 'Outlook connection was canceled',
        outlook_invalid: 'Invalid Outlook authorization',
        outlook_exchange_failed: 'Failed to connect Outlook account',
        state_mismatch: 'Security verification failed',
      };
      toast.error(errorMessages[error] || 'Connection failed');
    }

    // Clean up URL params
    if (success || error) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------
  const validateStep = (s: number): boolean => {
    const errors: Record<string, string> = {};
    // Step 0: Sender selection (REQUIRED)
    if (s === 0) {
      if (connectedSenders.length === 0) {
        errors.sender = 'Please connect at least one email account to continue. Choose Gmail, Outlook, or SMTP.';
      } else if (!selectedSenderId) {
        errors.sender = 'Please select which mailbox you want to use for this campaign.';
      }
    }
    // Step 1: Business info
    if (s === 1) {
      if (!businessInfo.business_name.trim()) errors.business_name = 'From Name is required';
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
      if (!messageInfo.body || messageInfo.body.replace(/<[^>]*>/g, '').trim() === '') errors.body = 'Message body is required';
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
    if (step === 2) {
      // Fire preview fetch in background — result populates the Review step button
      setListingPreviewLoading(true);
      setListingPreview(null);
      supabase.functions.invoke('fetch-listings-preview', { body: { criteria: searchCriteria } })
        .then(({ data }) => {
          if (data && !data.error) setListingPreview({ count: data.count, agentCount: data.agent_count, listings: data.listings ?? [], isTestMode: data.isTestMode ?? false });
        })
        .catch(() => {})
        .finally(() => setListingPreviewLoading(false));
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
  // Variant helpers
  // ---------------------------------------------------------------------------
  const activeSubject = activeVariant === 'A' ? messageInfo.subject : activeVariant === 'B' ? messageInfo.variant_b_subject : activeVariant === 'C' ? messageInfo.variant_c_subject : messageInfo.variant_d_subject;
  const activePreviewText = activeVariant === 'A' ? messageInfo.preview_text : activeVariant === 'B' ? messageInfo.variant_b_preview_text : activeVariant === 'C' ? messageInfo.variant_c_preview_text : messageInfo.variant_d_preview_text;
  const activeBody = activeVariant === 'A' ? messageInfo.body : activeVariant === 'B' ? messageInfo.variant_b_body : activeVariant === 'C' ? messageInfo.variant_c_body : messageInfo.variant_d_body;

  const setVariantFields = (updates: { subject?: string; preview_text?: string; body?: string }) => {
    if (activeVariant === 'A') { setMessageInfo(m => ({ ...m, ...updates })); return; }
    const mapped: Partial<MessageInfo> = {};
    if (activeVariant === 'B') {
      if (updates.subject !== undefined) mapped.variant_b_subject = updates.subject;
      if (updates.preview_text !== undefined) mapped.variant_b_preview_text = updates.preview_text;
      if (updates.body !== undefined) mapped.variant_b_body = updates.body;
    } else if (activeVariant === 'C') {
      if (updates.subject !== undefined) mapped.variant_c_subject = updates.subject;
      if (updates.preview_text !== undefined) mapped.variant_c_preview_text = updates.preview_text;
      if (updates.body !== undefined) mapped.variant_c_body = updates.body;
    } else {
      if (updates.subject !== undefined) mapped.variant_d_subject = updates.subject;
      if (updates.preview_text !== undefined) mapped.variant_d_preview_text = updates.preview_text;
      if (updates.body !== undefined) mapped.variant_d_body = updates.body;
    }
    setMessageInfo(m => ({ ...m, ...mapped }));
  };

  // Insert a variable token into the subject line at the last cursor position
  const insertVarIntoSubject = (v: string) => {
    const pos = subjectCursorPos.current;
    const end = subjectCursorEnd.current;
    const newSubject = activeSubject.slice(0, pos) + v + activeSubject.slice(end);
    const newPos = pos + v.length;
    subjectCursorPos.current = newPos;
    subjectCursorEnd.current = newPos;
    setVariantFields({ subject: newSubject });
    const input = subjectRef.current;
    if (input) { requestAnimationFrame(() => { input.setSelectionRange(newPos, newPos); input.focus(); }); }
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
        preview_text: messageInfo.preview_text || null,
        forward_to: businessInfo.forward_to,
        drip_delay_minutes: 2,
        variant_b_subject: messageInfo.variant_b_subject || null,
        variant_b_preview_text: messageInfo.variant_b_preview_text || null,
        variant_b_body: messageInfo.variant_b_body || null,
        variant_c_subject: messageInfo.variant_c_subject || null,
        variant_c_preview_text: messageInfo.variant_c_preview_text || null,
        variant_c_body: messageInfo.variant_c_body || null,
        variant_d_subject: messageInfo.variant_d_subject || null,
        variant_d_preview_text: messageInfo.variant_d_preview_text || null,
        variant_d_body: messageInfo.variant_d_body || null,
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
  // Create campaign record without sending (for email verification flow)
  // ---------------------------------------------------------------------------
  const createCampaignRecord = async (userId: string): Promise<string> => {
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
        preview_text: messageInfo.preview_text || null,
        forward_to: businessInfo.forward_to,
        drip_delay_minutes: 2,
        variant_b_subject: messageInfo.variant_b_subject || null,
        variant_b_preview_text: messageInfo.variant_b_preview_text || null,
        variant_b_body: messageInfo.variant_b_body || null,
        variant_c_subject: messageInfo.variant_c_subject || null,
        variant_c_preview_text: messageInfo.variant_c_preview_text || null,
        variant_c_body: messageInfo.variant_c_body || null,
        variant_d_subject: messageInfo.variant_d_subject || null,
        variant_d_preview_text: messageInfo.variant_d_preview_text || null,
        variant_d_body: messageInfo.variant_d_body || null,
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

    return campaign.id;
  };

  // ---------------------------------------------------------------------------
  // Send campaign emails (separate from creation for email verification gate)
  // ---------------------------------------------------------------------------
  const sendCampaignEmails = async (userId: string, campaignId: string, listings?: any[]): Promise<number> => {
    const hasListings = listings && listings.length > 0;
    const { data: result, error: fnErr } = await supabase.functions.invoke(
      hasListings ? 'send-new-campaign-emails' : 'send-campaign-emails',
      { body: hasListings ? { campaign_id: campaignId, listings } : { campaign_id: campaignId } }
    );

    if (fnErr) {
      const detail = (result as any)?.error || (result as any)?.details || fnErr.message;
      throw new Error(detail);
    }

    return result?.emails_sent ?? 0;
  };

  // ---------------------------------------------------------------------------
  // Signup + go live (called from step 4)
  // ---------------------------------------------------------------------------
  const buildTestListing = (email: string) => ({
    listingAgent: {
      email,
      name: businessInfo.contact_name || businessInfo.business_name || 'Test Agent',
      phone: '',
      office: businessInfo.business_name || '',
    },
    addressLine1: (businessInfo.mailing_address || '').split(',')[0].trim() || '100 Main Street',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
    formattedAddress: businessInfo.mailing_address || '100 Main Street, Austin, TX 78701',
    price: Math.floor(Math.random() * 500000) + 300000,
    listingType: searchCriteria.listing_type || 'sale',
    propertyType: 'Single Family',
    listedDate: new Date().toISOString(),
    id: `test-${Date.now()}`,
    bedrooms: 3,
    bathrooms: 2,
    squareFootage: 1800,
    yearBuilt: 2005,
    photos: [],
  });

  const handleTestModeSend = () => {
    const email = testSendModal.email.trim();
    if (!email.includes('@')) return;
    setTestSendModal({ open: false, email: '' });
    handleSignupAndGoLive([buildTestListing(email)]);
  };

  const handleSignupAndGoLive = async (testListings?: any[]) => {
    if (!validateStep(4)) return;
    setIsSubmitting(true);
    setSubmitError(null);
    setSignupError('');

    try {
      // Upgrade anonymous account to permanent account
      const { data: updateData, error: authErr } = await supabase.auth.updateUser({
        email: signupEmail,
        password: signupPassword,
      });

      if (authErr) {
        // Handle case where email already exists
        if (authErr.message.includes('already registered')) {
          setSignupError('An account with that email already exists. Please sign in instead.');
        } else {
          setSignupError(authErr.message);
        }
        setIsSubmitting(false);
        return;
      }

      const userId = updateData?.user?.id;
      if (!userId) {
        setSignupError('Something went wrong. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Check if email is verified
      const { data: { user } } = await supabase.auth.getUser();

      // Create campaign (always allowed)
      const campaignId = await createCampaignRecord(userId);

      // Case 1: Email verified - send immediately using pre-fetched or test listings
      if (user?.email_confirmed_at) {
        const sent = await sendCampaignEmails(userId, campaignId, testListings ?? listingPreview?.listings);
        setEmailsSent(sent);
        setIsSubmitting(false);
        return;
      }

      // Case 2: Email not verified - show verification prompt
      // Save data to localStorage for retry after verification
      localStorage.setItem(PENDING_KEY, JSON.stringify({
        userId,
        campaignId,
        businessInfo,
        searchCriteria,
        messageInfo,
        smsConfig,
        testListings: testListings ?? null,
      }));

      setIsVerificationStep(true);
      setIsSubmitting(false);

      // Poll for email confirmation
      pollingRef.current = setInterval(async () => {
        const { data: pollData, error: pollErr } = await supabase.auth.signInWithPassword({
          email: signupEmail,
          password: signupPassword,
        });
        if (pollData?.session && !pollErr && pollData?.user?.email_confirmed_at) {
          clearInterval(pollingRef.current!);
          // Now confirmed — send campaign emails
          const pending = localStorage.getItem(PENDING_KEY);
          if (pending) {
            try {
              const pendingData = JSON.parse(pending);
              const sent = await sendCampaignEmails(pendingData.userId, pendingData.campaignId, pendingData.testListings ?? undefined);
              localStorage.removeItem(PENDING_KEY);
              setEmailsSent(sent);
            } catch (err: any) {
              console.error('Failed to send campaign after confirmation:', err);
              // Still navigate to dashboard — V2Dashboard will retry via localStorage
              navigate('/v2/dashboard');
            }
          } else {
            navigate('/v2/dashboard');
          }
        }
      }, 3000);
    } catch (err: any) {
      console.error('Account upgrade/campaign creation failed:', err);
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
      .select('id, name, channel, subject, body, is_shared')
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
    setMessageInfo(m => {
      const updates: Partial<typeof m> = { channel: t.channel };
      if (activeVariant === 'A') {
        updates.subject = t.subject ?? '';
        updates.body = t.body;
      } else if (activeVariant === 'B') {
        updates.variant_b_subject = t.subject ?? '';
        updates.variant_b_body = t.body;
      } else if (activeVariant === 'C') {
        updates.variant_c_subject = t.subject ?? '';
        updates.variant_c_body = t.body;
      } else {
        updates.variant_d_subject = t.subject ?? '';
        updates.variant_d_body = t.body;
      }
      return { ...m, ...updates };
    });
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
  const VISIBLE_STEPS = STEPS.slice(0, -1);

  const renderProgress = () => (
    <div className="flex gap-0">
      {VISIBLE_STEPS.map((s, i) => (
        <div key={i} className="flex items-center" style={{ flex: i < VISIBLE_STEPS.length - 1 ? '1' : 'none' }}>
          <div className="flex flex-col items-center gap-1.5 cursor-pointer" onClick={() => handleStepClick(i)}>
            <div
              className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-medium transition-all ${
                i === step
                  ? 'bg-[#FFCE0A] border-[#FFCE0A] text-[#342e37]'
                  : i < step
                  ? 'bg-green-50 border-green-200 text-green-700 dark:bg-[#2F2F2F] dark:border-[#2F2F2F] dark:text-[#FFCE0A]'
                  : 'bg-gray-100 border-gray-300 text-gray-500 dark:bg-[#2F2F2F] dark:border-[#2F2F2F] dark:text-[#FFCE0A]'
              }`}
            >
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-[11px] text-center ${i === step ? 'font-medium text-gray-900 dark:text-white' : 'font-normal text-gray-500'}`}>
              {s.short}
            </span>
          </div>
          {i < VISIBLE_STEPS.length - 1 && (
            <div className="flex-1 h-px mx-2 mt-[-14px] bg-gray-200 dark:bg-white/10" />
          )}
        </div>
      ))}
    </div>
  );

  // Step 0 — Connect sending account
  const renderStep0 = () => {
    const handleGmailConnect = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { toast.error('Session expired. Please refresh the page.'); return; }
        const authUrl = await buildGmailAuthUrl(session.user.id);
        window.location.href = authUrl;
      } catch (err) {
        console.error('[V2Onboarding] Gmail auth failed:', err);
        toast.error('Failed to initiate Gmail connection');
      }
    };

    const handleOutlookConnect = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { toast.error('Session expired. Please refresh the page.'); return; }
        const authUrl = await buildOutlookAuthUrl(session.user.id);
        window.location.href = authUrl;
      } catch (err) {
        console.error('[V2Onboarding] Outlook auth failed:', err);
        toast.error('Failed to initiate Outlook connection');
      }
    };

    const gmailSender = connectedSenders.find(s => s.provider === 'gmail') ?? null;
    const outlookSender = connectedSenders.find(s => s.provider === 'outlook') ?? null;
    const smtpSender = connectedSenders.find(s => s.provider === 'smtp') ?? null;

    const isGmailSelected = !!gmailSender && selectedSenderId === gmailSender.id;
    const isOutlookSelected = !!outlookSender && selectedSenderId === outlookSender.id;
    const isSmtpSelected = !!smtpSender && selectedSenderId === smtpSender.id;

    return (
      <div className="mb-2">
        <div className="text-base font-medium text-gray-900 dark:text-white mb-1">Connect your sending mailbox</div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-5">
          {connectedSenders.length === 0
            ? 'Connect an email account to send emails to listing agents.'
            : 'Connected accounts show a checkmark — click one to select it for this campaign.'}
        </div>

        {stepErrors.sender && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-400">{stepErrors.sender}</p>
          </div>
        )}

        {/* Gmail & Outlook — 2 column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <button
            type="button"
            onClick={gmailSender ? () => setSelectedSenderId(gmailSender.id) : handleGmailConnect}
            disabled={checkingSender}
            className={`group relative p-4 rounded-lg border-2 transition-all text-left hover:border-[#FFCE0A] dark:hover:border-[#FFCE0A] hover:shadow-sm disabled:opacity-60 disabled:cursor-not-allowed ${isGmailSelected ? '' : 'bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-white/10'}`}
            style={isGmailSelected ? { borderColor: '#10b981', backgroundColor: '#10b98110' } : undefined}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-white mb-1">Gmail</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {gmailSender ? gmailSender.email : 'Send via Google OAuth'}
                </div>
                {gmailSender && !isGmailSelected && (
                  <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Click to select</div>
                )}
              </div>
              {gmailSender && <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />}
            </div>
          </button>

          <button
            type="button"
            onClick={outlookSender ? () => setSelectedSenderId(outlookSender.id) : handleOutlookConnect}
            disabled={checkingSender}
            className={`group relative p-4 rounded-lg border-2 transition-all text-left hover:border-[#FFCE0A] dark:hover:border-[#FFCE0A] hover:shadow-sm disabled:opacity-60 disabled:cursor-not-allowed ${isOutlookSelected ? '' : 'bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-white/10'}`}
            style={isOutlookSelected ? { borderColor: '#10b981', backgroundColor: '#10b98110' } : undefined}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-white mb-1">Outlook</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {outlookSender ? outlookSender.email : 'Send via Microsoft OAuth'}
                </div>
                {outlookSender && !isOutlookSelected && (
                  <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Click to select</div>
                )}
              </div>
              {outlookSender && <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />}
            </div>
          </button>
        </div>

        {/* Custom SMTP — full width */}
        <div className="mb-5">
          <button
            type="button"
            onClick={smtpSender ? () => setSelectedSenderId(smtpSender.id) : () => setSMTPModalOpen(true)}
            className={`w-full group relative p-4 rounded-lg border-2 transition-all text-left hover:border-[#FFCE0A] dark:hover:border-[#FFCE0A] hover:shadow-sm ${
              !isSmtpSelected ? 'bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-white/10' : ''
            }`}
            style={isSmtpSelected ? { borderColor: '#10b981', backgroundColor: '#10b98110' } : undefined}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                <Server className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-white mb-1">Custom SMTP</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {smtpSender ? smtpSender.email : 'Use your own mail server (SendGrid, Mailchimp, or any SMTP provider)'}
                </div>
                {smtpSender && !isSmtpSelected && (
                  <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Click to select</div>
                )}
              </div>
              {smtpSender && <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />}
            </div>
          </button>
        </div>
      </div>
    );
  };

  // Step 1 — Business info (always edit mode, no returning-user check)
  const renderStep1 = () => (
    <div className="mb-2">
      <div className="text-base font-medium text-gray-900 dark:text-white mb-1">Tell us about your business</div>
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-5">This appears in emails sent on your behalf</div>

      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">From Name</label>
      <Input
        value={businessInfo.business_name}
        onChange={e => setBusinessInfo(b => ({ ...b, business_name: e.target.value }))}
        placeholder="e.g. Mike Thornton, Sandbox Realty"
      />
      {stepErrors.business_name && <p className="text-xs text-red-500 mt-1">{stepErrors.business_name}</p>}

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
              service_type: b.service_type.includes(tag) ? [] : [tag],
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
  const renderStep3 = () => {
    const previewSubjectText = activeSubject
      ? activeSubject
          .replace(/\{\{agent_name\}\}/g, 'Sarah')
          .replace(/\{\{address\}\}/g, '1842 Maple St')
          .replace(/\{\{city\}\}/g, searchCriteria.city || 'your city')
          .replace(/\{\{price\}\}/g, '$485,000')
          .replace(/\{\{listing_date\}\}/g, 'today')
      : null;
    return (
      <div>
        {/* Header row — title left, channel toggle right (wraps on mobile) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Write your intro message</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sent to every listing agent when a new listing matches your search. Keep it short and personal.
            </p>
          </div>
          <div className="self-start inline-flex rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-0.5">
            {['email', 'sms'].map(ch => (
              <button
                key={ch}
                type="button"
                onClick={() => setMessageInfo(m => ({ ...m, channel: ch }))}
                className="px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize"
                style={
                  messageInfo.channel === ch
                    ? { background: '#FFCE0A', color: '#342e37' }
                    : { background: 'transparent', color: 'rgb(107 114 128)' }
                }
              >
                {ch === 'email' ? 'Email' : 'SMS'}
              </button>
            ))}
          </div>
        </div>

        {/* Campaign name + Templates row */}
        <div className="flex items-end gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1.5">Campaign name</label>
            {!messageInfo.campaign_name && searchCriteria.city && businessInfo.service_type.length > 0 && (
              <button
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => setMessageInfo(m => ({ ...m, campaign_name: `${searchCriteria.city} ${businessInfo.service_type[0]} Outreach` }))}
                className="block text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 mb-1.5 transition-colors"
              >
                Suggest: "{searchCriteria.city} {businessInfo.service_type[0]} Outreach"
              </button>
            )}
            <Input
              value={messageInfo.campaign_name}
              onChange={e => setMessageInfo(m => ({ ...m, campaign_name: toTitleCase(e.target.value) }))}
              placeholder="e.g. $500 Off; New Client Offer"
            />
            {stepErrors.campaign_name && <p className="text-xs text-red-500 mt-1">{stepErrors.campaign_name}</p>}
          </div>

          <div className="relative shrink-0" ref={templateDropdownRef}>
            <button
              type="button"
              onClick={loadTemplates}
              className="flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              Templates <span className="text-xs opacity-60">▾</span>
            </button>
            {templatePicker.open && (
              <div className="absolute right-0 top-full mt-1 z-50 w-64 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2a2a2a] shadow-lg overflow-hidden">
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
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{t.name}</div>
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
        </div>

        {/* A/B/C/D variant tabs */}
        <div className="flex items-center gap-1.5 mb-6">
          {(['A', 'B', 'C', 'D'] as const).map(v => {
            const hasContent = v === 'A' || !!(
              v === 'B' ? messageInfo.variant_b_body :
              v === 'C' ? messageInfo.variant_c_body :
              messageInfo.variant_d_body
            );
            return (
              <button
                key={v}
                type="button"
                onClick={() => setActiveVariant(v)}
                className={`w-7 h-7 rounded-md text-xs font-bold transition-colors ${
                  activeVariant === v
                    ? 'bg-[#FFCE0A] text-[#342e37]'
                    : hasContent
                      ? 'bg-gray-100 dark:bg-white/15 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20'
                      : 'border border-dashed border-gray-300 dark:border-white/20 text-gray-400 dark:text-gray-500 hover:border-gray-400 dark:hover:border-white/30'
                }`}
              >
                {v}
              </button>
            );
          })}
          <span className="text-[11px] text-gray-400 dark:text-gray-500 ml-0.5">
            {activeVariant === 'A' ? 'Default message' : `Variant ${activeVariant}`}
          </span>
        </div>

        <hr className="border-gray-200 dark:border-white/10 mb-6" />

        {/* Split: compose left, preview right */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">

          {/* Compose column */}
          <div className="min-w-0 space-y-4">

            {messageInfo.channel === 'sms' && (
              <div className="space-y-3">
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

            {messageInfo.channel === 'email' && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm text-gray-600 dark:text-gray-400">Subject line</label>
                    <span className={`text-xs tabular-nums ${activeSubject.length >= 55 ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'}`}>{activeSubject.length}/60</span>
                  </div>
                  <div className="relative">
                    <Input
                      ref={subjectRef}
                      value={activeSubject}
                      maxLength={60}
                      className="pr-24"
                      onFocus={() => {}}
                      onChange={e => {
                        subjectCursorPos.current = e.target.selectionStart ?? 0;
                        subjectCursorEnd.current = e.target.selectionEnd ?? 0;
                        setVariantFields({ subject: e.target.value });
                      }}
                      onSelect={e => {
                        subjectCursorPos.current = (e.target as HTMLInputElement).selectionStart ?? 0;
                        subjectCursorEnd.current = (e.target as HTMLInputElement).selectionEnd ?? 0;
                      }}
                      onClick={e => {
                        subjectCursorPos.current = (e.target as HTMLInputElement).selectionStart ?? 0;
                        subjectCursorEnd.current = (e.target as HTMLInputElement).selectionEnd ?? 0;
                      }}
                      onKeyUp={e => {
                        subjectCursorPos.current = (e.target as HTMLInputElement).selectionStart ?? 0;
                        subjectCursorEnd.current = (e.target as HTMLInputElement).selectionEnd ?? 0;
                      }}
                      placeholder="e.g. Roof certification for {{address}}"
                    />
                    <button
                      type="button"
                      onClick={() => { setGenerateField('subject'); setGenerateOpen(true); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border border-[#FFCE0A]/50 bg-[#FFCE0A]/10 text-[#342e37] dark:text-[#FFCE0A] hover:bg-[#FFCE0A]/20 transition-colors"
                    >
                      <StarIcon size={9} className="text-[#FFCE0A]" />
                      Generate
                    </button>
                  </div>
                  {stepErrors.subject && <p className="text-xs text-red-500 mt-1">{stepErrors.subject}</p>}
                  <div className="flex flex-wrap items-center gap-1 mt-1.5">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide mr-0.5">Insert</span>
                    {MERGE_TAGS.map(opt => (
                      <button
                        key={opt.variable}
                        type="button"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => insertVarIntoSubject(opt.variable)}
                        className="px-2 py-0.5 rounded-md text-xs font-mono transition-opacity hover:opacity-80 bg-blue-50 text-blue-700 border border-transparent dark:bg-transparent dark:border-white/20 dark:text-gray-300"
                      >
                        {opt.variable}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm text-gray-600 dark:text-gray-400">Preview text <span className="text-xs text-gray-400 dark:text-gray-500">(shown after subject in inbox)</span></label>
                    <span className={`text-xs tabular-nums ${activePreviewText.length >= 82 ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'}`}>{activePreviewText.length}/90</span>
                  </div>
                  <div className="relative">
                    <Input
                      value={activePreviewText}
                      maxLength={90}
                      className="pr-24"
                      onChange={e => setVariantFields({ preview_text: e.target.value })}
                      placeholder="e.g. I'd love to help with the listing at {{address}}..."
                    />
                    <button
                      type="button"
                      onClick={() => { setGenerateField('preview'); setGenerateOpen(true); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border border-[#FFCE0A]/50 bg-[#FFCE0A]/10 text-[#342e37] dark:text-[#FFCE0A] hover:bg-[#FFCE0A]/20 transition-colors"
                    >
                      <StarIcon size={9} className="text-[#FFCE0A]" />
                      Generate
                    </button>
                  </div>
                </div>
              </>
            )}

            <div>
              <div className="mb-1.5">
                <label className="text-sm text-gray-600 dark:text-gray-400">Message body</label>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setGenerateField('body'); setGenerateOpen(true); }}
                  className="absolute top-2 right-2 z-10 flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border border-[#FFCE0A]/50 bg-[#FFCE0A]/10 text-[#342e37] dark:text-[#FFCE0A] hover:bg-[#FFCE0A]/20 transition-colors"
                >
                  <StarIcon size={9} className="text-[#FFCE0A]" />
                  Generate
                </button>
                <RichTextEditor
                  content={activeBody}
                  onChange={html => setVariantFields({ body: html })}
                  mergeTagOptions={MERGE_TAGS}
                  placeholder="Hi there, I noticed a new listing at your address in your city…"
                  withSections
                />
              </div>
              <div className="flex items-center justify-between mt-1.5 min-h-[1.25rem]">
                {stepErrors.body ? <p className="text-xs text-red-500">{stepErrors.body}</p> : <span />}
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {(() => { const n = activeBody.replace(/<[^>]*>/g, '').length; return `${n} chars${n >= 100 && n <= 300 ? ' · ideal ✓' : ''}`; })()}
                </span>
              </div>
            </div>
          </div>

          {/* Preview column - sticky on desktop */}
          {messageInfo.channel === 'email' && (
            <div className="lg:sticky lg:top-6 lg:self-start">
              <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] overflow-hidden shadow-sm">
                {/* Mac window chrome */}
                <div className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gray-100 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
                  <span className="ml-2 text-[11px] text-gray-500 dark:text-gray-400">Inbox preview</span>
                </div>
                {/* Sender row */}
                <div className="px-4 py-3.5 flex items-start gap-3 border-b border-gray-100 dark:border-white/10">
                  <div className="w-9 h-9 rounded-full bg-[#FFCE0A] flex items-center justify-center text-sm font-bold text-[#342e37] shrink-0 mt-0.5 select-none">
                    {(businessInfo.business_name || 'Y').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{businessInfo.business_name || 'Your Name'}</span>
                      <span className="text-[11px] text-gray-400 dark:text-gray-500 shrink-0">just now</span>
                    </div>
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {previewSubjectText ?? <span className="text-gray-400 dark:text-gray-500 font-normal italic">No subject yet…</span>}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {activePreviewText || <span className="italic text-gray-300 dark:text-gray-600">Preview text will appear here…</span>}
                    </div>
                  </div>
                </div>
                {/* Body */}
                <div className="px-4 py-4 max-h-[480px] overflow-y-auto">
                  {activeBody ? (
                    <div
                      className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: buildPreviewHtml(activeBody, searchCriteria.city) }}
                    />
                  ) : (
                    <p className="text-sm text-gray-300 dark:text-gray-600 italic">Your message will appear here…</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Step 4 — Review summary (no submit button here; user clicks Next → to proceed to step 5)
  const renderStep4 = () => {
    const fromName = businessInfo.business_name || 'Your Name';
    const senderEmail = connectedSenders.find(s => s.id === selectedSenderId)?.email;
    const previewSubject = messageInfo.subject
      ? messageInfo.subject
          .replace(/\{\{agent_name\}\}/g, 'Sarah')
          .replace(/\{\{address\}\}/g, '1842 Maple St')
          .replace(/\{\{city\}\}/g, searchCriteria.city || 'your city')
          .replace(/\{\{price\}\}/g, '$485,000')
          .replace(/\{\{listing_date\}\}/g, 'today')
      : '(no subject)';
    const priceRange = (searchCriteria.price_min || searchCriteria.price_max)
      ? `$${(searchCriteria.price_min ?? 0).toLocaleString()} – $${(searchCriteria.price_max ?? 0).toLocaleString()}`
      : 'Any';
    const ybSummary = searchCriteria.year_built_min || searchCriteria.year_built_max
      ? `${searchCriteria.year_built_min ?? '?'}–${searchCriteria.year_built_max ?? '?'}`
      : null;

    const goToStep = (s: number) => { setStepErrors({}); setStep(s); };

    return (
      <div className="mb-2">
        <div className="text-base font-medium text-gray-900 dark:text-white mb-1">Review your campaign</div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Here's what agents in {searchCriteria.city || 'your city'} will receive.
        </div>

        {/* Inbox mockup */}
        <div className="mb-4 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
            <span className="ml-2 text-[11px] text-gray-400 dark:text-gray-500">Inbox — listing agent's view</span>
          </div>
          <div className="px-4 py-3 bg-blue-50/60 dark:bg-blue-950/20 border-b border-gray-100 dark:border-white/10 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#FFCE0A] flex items-center justify-center text-xs font-bold text-[#342e37] shrink-0 mt-0.5 select-none">
              {fromName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{fromName}</span>
                <span className="text-[11px] text-gray-400 dark:text-gray-500 shrink-0">just now</span>
              </div>
              <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{previewSubject}</div>
              {messageInfo.preview_text
                ? <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{messageInfo.preview_text}</div>
                : senderEmail && <div className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{senderEmail}</div>
              }
            </div>
          </div>
          <div className="px-4 py-5 bg-white dark:bg-[#1a1a1a]">
            <div
              className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: buildPreviewHtml(messageInfo.body, searchCriteria.city) }}
            />
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {/* Mailbox */}
          <div className="rounded-lg border border-gray-200 dark:border-white/10 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Mailbox</span>
              <button type="button" onClick={() => goToStep(1)} className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: '#FFCE0A' }}>
                <Pencil className="w-3 h-3 text-[#342e37]" />
              </button>
            </div>
            <div className="space-y-1.5">
              <div>
                <div className="text-[10px] text-gray-400 dark:text-gray-500">Sender Email</div>
                <div className="text-xs font-medium text-gray-900 dark:text-white truncate">{senderEmail || '—'}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400 dark:text-gray-500">From Name</div>
                <div className="text-xs text-gray-700 dark:text-gray-300 truncate">{businessInfo.business_name || '—'}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400 dark:text-gray-500">Reply-To</div>
                <div className="text-xs text-gray-700 dark:text-gray-300 truncate">{businessInfo.forward_to || '—'}</div>
              </div>
              {businessInfo.mailing_address && (
                <div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500">Address</div>
                  <div className="text-xs text-gray-700 dark:text-gray-300 truncate">{businessInfo.mailing_address}</div>
                </div>
              )}
            </div>
          </div>

          {/* Listings */}
          <div className="rounded-lg border border-gray-200 dark:border-white/10 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Listings</span>
              <button type="button" onClick={() => goToStep(2)} className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: '#FFCE0A' }}>
                <Pencil className="w-3 h-3 text-[#342e37]" />
              </button>
            </div>
            <div className="space-y-1.5">
              <div>
                <div className="text-[10px] text-gray-400 dark:text-gray-500">Location</div>
                <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
                  {searchCriteria.city || '—'}{searchCriteria.state ? `, ${searchCriteria.state}` : ''}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400 dark:text-gray-500">Type</div>
                <div className="text-xs text-gray-700 dark:text-gray-300 truncate">{searchCriteria.property_type}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400 dark:text-gray-500">Price</div>
                <div className="text-xs text-gray-700 dark:text-gray-300 truncate">{priceRange}</div>
              </div>
              {ybSummary && (
                <div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500">Year built</div>
                  <div className="text-xs text-gray-700 dark:text-gray-300">{ybSummary}</div>
                </div>
              )}
            </div>
          </div>

          {/* Message */}
          <div className="rounded-lg border border-gray-200 dark:border-white/10 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Message</span>
              <button type="button" onClick={() => goToStep(3)} className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: '#FFCE0A' }}>
                <Pencil className="w-3 h-3 text-[#342e37]" />
              </button>
            </div>
            <div className="space-y-1.5">
              <div>
                <div className="text-[10px] text-gray-400 dark:text-gray-500">Campaign</div>
                <div className="text-xs font-medium text-gray-900 dark:text-white truncate">{messageInfo.campaign_name || '—'}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400 dark:text-gray-500">Channel</div>
                <div className="text-xs text-gray-700 dark:text-gray-300 capitalize">{messageInfo.channel}</div>
              </div>
              {messageInfo.channel === 'email' && messageInfo.subject && (
                <div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500">Subject</div>
                  <div className="text-xs text-gray-700 dark:text-gray-300 truncate">{messageInfo.subject}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTestModal({ open: true, address: businessInfo.forward_to || '', sending: false, sent: false, error: null })}
            className="flex-none py-2.5 px-4 rounded-lg text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
          >
            Send test email
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-opacity hover:opacity-90"
            style={{ background: '#FFCE0A', color: '#342e37' }}
          >
            Continue →
          </button>
        </div>
      </div>
    );
  };

  // Step 5 — Complete profile
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
        <div className="text-base font-medium text-gray-900 dark:text-white mb-1">Complete your profile</div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-5">
          Finalize your account with email and password to start sending emails to agents in {searchCriteria.city}.
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
            onClick={() => listingPreview?.isTestMode ? setTestSendModal({ open: true, email: '' }) : handleSignupAndGoLive()}
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-lg text-sm font-bold transition-opacity disabled:opacity-60 hover:opacity-90"
            style={{ background: '#FFCE0A', color: '#342e37' }}
          >
            {isSubmitting ? 'Sending...' : listingPreviewLoading ? 'Finding listings...' : listingPreview?.isTestMode ? 'Send test email →' : listingPreview ? `Email ${listingPreview.agentCount} Listing Agents →` : 'Send first emails →'}
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
  const stepMaxWidth = step === 3 ? '1100px' : '680px';

  return (
    <div className="min-h-screen relative">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-[0.33] dark:opacity-0 pointer-events-none" style={{ backgroundImage: `url(${patternBgLight})`, backgroundRepeat: 'repeat', backgroundSize: '600px' }} />
      <div className="absolute inset-0 opacity-0 dark:opacity-[0.12] pointer-events-none" style={{ backgroundImage: `url(${patternBgDark})`, backgroundRepeat: 'repeat', backgroundSize: '600px' }} />

      {/* Minimal header */}
      <div className="border-b border-[#342e37]/10 bg-[#ffce0a] px-4 py-3 flex items-center justify-center relative z-10">
        <a href="/v2/dashboard" className="flex items-center" aria-label="ListingBug dashboard">
          <ImageWithFallback
            src={headerLogoSimplified}
            alt="ListingBug"
            className="h-13 w-13 object-contain"
          />
        </a>
      </div>

      <div
        className="mx-auto px-4 py-8 relative z-10 transition-[max-width] duration-300"
        style={{ maxWidth: stepMaxWidth }}
      >
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
              {!isLastStep && step !== 4 && (
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

      {/* Test mode send modal */}
      {testSendModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Send test campaign</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Enter an email to receive the campaign. Your business info and a random listing price will be used.
            </p>
            <input
              type="email"
              value={testSendModal.email}
              onChange={e => setTestSendModal(m => ({ ...m, email: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleTestModeSend()}
              placeholder="you@example.com"
              className="w-full rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-white/10 focus:outline-none focus:border-[#FFCE0A] mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => setTestSendModal({ open: false, email: '' })}
                className="flex-1 py-2 rounded-lg text-sm border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#222] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTestModeSend}
                disabled={!testSendModal.email.includes('@')}
                className="flex-1 py-2 rounded-lg text-sm font-bold disabled:opacity-50 hover:opacity-90 transition-opacity"
                style={{ background: '#FFCE0A', color: '#342e37' }}
              >
                Send test →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test email modal (identical to NewCampaign) */}
      {testModal.open && (() => {
        const fromName = businessInfo.business_name || businessInfo.contact_name || 'ListingBug';
        const senderEmail = connectedSenders.find(s => s.id === selectedSenderId)?.email ?? '';
        const previewSubject = messageInfo.subject
          ? messageInfo.subject.replace(/\{\{agent_name\}\}/g, 'Sarah').replace(/\{\{address\}\}/g, '1842 Maple St').replace(/\{\{city\}\}/g, searchCriteria.city || 'your city').replace(/\{\{price\}\}/g, '$485,000').replace(/\{\{listing_date\}\}/g, 'today')
          : '(no subject)';

        const handleSendTest = async () => {
          if (!testModal.address.trim()) return;
          setTestModal(m => ({ ...m, sending: true, error: null }));
          try {
            const { error } = await supabase.functions.invoke('send-test-email', {
              body: { to: testModal.address.trim(), subject: messageInfo.subject, body: messageInfo.body, from_name: fromName, sender_id: selectedSenderId },
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
                    <span className="text-gray-700 dark:text-gray-300">{fromName} &lt;{senderEmail}&gt;</span>
                  </div>
                  {messageInfo.channel === 'email' && (
                    <div className="flex gap-2 text-xs">
                      <span className="text-gray-400 dark:text-gray-500 w-14 shrink-0">Subject</span>
                      <span className="text-gray-700 dark:text-gray-300">{previewSubject}</span>
                    </div>
                  )}
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#1a1a1a] p-4">
                  <div className="text-sm text-gray-900 dark:text-white leading-relaxed" dangerouslySetInnerHTML={{ __html: buildPreviewHtml(messageInfo.body, searchCriteria.city) }} />
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

      {/* Generate modal */}
      <GenerateModal
        open={generateOpen}
        onClose={() => { setGenerateOpen(false); setGenerateField(null); }}
        context={{
          city: searchCriteria.city,
          state: searchCriteria.state,
          listing_type: searchCriteria.listing_type,
          property_type: searchCriteria.property_type ?? undefined,
          channel: messageInfo.channel,
          business_name: businessInfo.business_name,
          contact_name: businessInfo.contact_name,
          service_type: businessInfo.service_type,
          days_old: searchCriteria.days_old ?? undefined,
          price_min: searchCriteria.price_min ?? undefined,
          price_max: searchCriteria.price_max ?? undefined,
        } as GenerateContext}
        current={{
          subject: activeSubject,
          preview_text: activePreviewText,
          body: activeBody,
        }}
        channel={messageInfo.channel}
        targetField={generateField ?? undefined}
        onApply={fields => {
          const updates: Record<string, string> = {};
          if (fields.subject !== undefined) {
            if (activeVariant === 'A') updates.subject = fields.subject;
            else if (activeVariant === 'B') updates.variant_b_subject = fields.subject;
            else if (activeVariant === 'C') updates.variant_c_subject = fields.subject;
            else updates.variant_d_subject = fields.subject;
          }
          if (fields.preview_text !== undefined) {
            if (activeVariant === 'A') updates.preview_text = fields.preview_text;
            else if (activeVariant === 'B') updates.variant_b_preview_text = fields.preview_text;
            else if (activeVariant === 'C') updates.variant_c_preview_text = fields.preview_text;
            else updates.variant_d_preview_text = fields.preview_text;
          }
          if (fields.body !== undefined) {
            if (activeVariant === 'A') updates.body = fields.body;
            else if (activeVariant === 'B') updates.variant_b_body = fields.body;
            else if (activeVariant === 'C') updates.variant_c_body = fields.body;
            else updates.variant_d_body = fields.body;
          }
          setMessageInfo(m => ({ ...m, ...updates }));
        }}
      />

      {/* SMTP Setup Modal */}
      <SMTPSetupModal
        isOpen={smtpModalOpen}
        onClose={() => setSMTPModalOpen(false)}
        onSuccess={async (_connectionId) => {
          // Reload connected senders
          const session = await supabase.auth.getSession();
          if (session.data.session) {
            const { data: senders } = await supabase
              .from('integration_connections')
              .select('id, integration_id, sending_email, display_name, status')
              .eq('user_id', session.data.session.user.id)
              .eq('is_sender', true)
              .eq('status', 'active');

            if (senders && senders.length > 0) {
              setConnectedSenders(senders.map(s => ({
                id: s.id,
                email: s.sending_email,
                provider: s.integration_id,
                display_name: s.display_name || s.sending_email,
              })));
            }
          }
          toast.success('SMTP account connected successfully!');
          setSMTPModalOpen(false);
        }}
        userId={currentUserId}
        userContactName={businessInfo.contact_name}
        userBusinessName={businessInfo.business_name}
      />
    </div>
  );
}
