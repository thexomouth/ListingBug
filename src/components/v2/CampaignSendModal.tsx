import { X, Mail, Phone, Home, CheckCircle2, Eye, MousePointer, MessageSquare, AlertCircle, User } from 'lucide-react';
import { createPortal } from 'react-dom';
import { ReactNode, useEffect } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Reply {
  id: string;
  replied_at: string;
}

export interface CampaignSendData {
  id: string;
  agent_email: string;
  agent_name: string | null;
  agent_phone: string | null;
  listing_address: string | null;
  listing_city: string | null;
  listing_state: string | null;
  listing_price: number | null;
  listing_type: string | null;
  listing_property_type: string | null;
  listing_beds: number | null;
  listing_baths: number | null;
  listing_sqft: number | null;
  listing_brokerage: string | null;
  listing_mls_number: string | null;
  status: string;
  error_message: string | null;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  channel: string;
  campaign_replies: Reply[];
}

export interface CampaignSendModalCampaign {
  campaign_name: string;
  channel: string;
  subject: string | null;
  body: string;
  city: string;
  state: string;
}

interface CampaignSendModalProps {
  send: CampaignSendData;
  campaign: CampaignSendModalCampaign;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDateTime(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    + ' at '
    + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function fillVars(text: string, send: CampaignSendData) {
  return text
    .replace(/\{\{agent_name\}\}/g, send.agent_name || send.agent_email)
    .replace(/\{\{address\}\}/g, send.listing_address || '[address]')
    .replace(/\{\{city\}\}/g, send.listing_city || '[city]')
    .replace(/\{\{price\}\}/g, send.listing_price != null ? `$${send.listing_price.toLocaleString()}` : '[price]')
    .replace(/\{\{listing_date\}\}/g, send.sent_at ? new Date(send.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '[date]');
}

function statusBadge(status: string, hasReply: boolean) {
  if (hasReply) return { label: 'Replied', bg: '#dcfce7', color: '#15803d' };
  switch (status) {
    case 'sent':    return { label: 'Sent',   bg: '#f3f4f6', color: '#6b7280' };
    case 'opened':  return { label: 'Opened', bg: '#eff6ff', color: '#1d4ed8' };
    case 'failed':  return { label: 'Failed', bg: '#fef2f2', color: '#dc2626' };
    case 'queued':  return { label: 'Queued', bg: '#f3f4f6', color: '#6b7280' };
    default:        return { label: status,   bg: '#f3f4f6', color: '#6b7280' };
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function CampaignSendModal({ send, campaign, onClose }: CampaignSendModalProps) {
  const hasReply = (send.campaign_replies?.length ?? 0) > 0;
  const badge = statusBadge(send.status, hasReply);
  const isFailed = send.status === 'failed';

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Scroll lock
  useEffect(() => {
    const scrollY = window.scrollY;
    const prev = { overflow: document.body.style.overflow, position: document.body.style.position, top: document.body.style.top, width: document.body.style.width };
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    return () => {
      document.body.style.overflow = prev.overflow;
      document.body.style.position = prev.position;
      document.body.style.top = prev.top;
      document.body.style.width = prev.width;
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Message preview with real data substituted in
  const previewSubject = campaign.subject ? fillVars(campaign.subject, send) : null;
  const previewBodyText = fillVars(campaign.body, send);
  const previewBodyHtml = previewBodyText
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      (_, t, u) => `<a href="${u}" style="color:#1d4ed8;text-decoration:underline" target="_blank" rel="noopener noreferrer">${t}</a>`)
    .replace(/\n/g, '<br>');

  const addressTitle = send.listing_address
    ? send.listing_address
    : (send.agent_name || send.agent_email);
  const addressSubtitle = [send.listing_city, send.listing_state].filter(Boolean).join(', ');

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[9998]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Side drawer */}
      <div
        className="fixed right-0 top-0 h-screen w-[calc(100%-12px)] md:w-[650px] lg:w-[760px] bg-white dark:bg-[#0F1115] z-[9999] shadow-2xl overflow-hidden"
        style={{ transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)' }}
        role="dialog"
        aria-modal="true"
      >
        <div className="h-full flex flex-col">

          {/* Header */}
          <div className="flex-shrink-0 bg-[#ffd447] border-b border-[#ffd447]/20 px-4 md:px-6 py-4 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <h2 className="text-[20px] font-bold text-[#342e37] truncate">{addressTitle}</h2>
                <span
                  className="text-[11px] px-2 py-0.5 rounded-full font-semibold shrink-0"
                  style={{ background: badge.color + '22', color: badge.color }}
                >
                  {badge.label}
                </span>
              </div>
              {addressSubtitle && (
                <p className="text-[13px] text-[#342e37]/70">{addressSubtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#342e37]/10 rounded-lg transition-colors shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-[#342e37]" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-6">

            {/* Failed error banner */}
            {isFailed && send.error_message && (
              <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-4 py-3 flex gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">Send failed</div>
                  <div className="text-sm text-red-700 dark:text-red-300 font-mono break-all">{send.error_message}</div>
                </div>
              </div>
            )}

            {/* Agent */}
            <div className="bg-[#342e37] rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-[#FFCE0A]" />
                <h3 className="font-bold text-[15px] text-white">Listing Agent</h3>
              </div>
              {send.agent_name
                ? <p className="text-white font-semibold text-[15px]">{send.agent_name}</p>
                : <p className="text-white/50 italic text-[13px]">Name not provided</p>
              }
              <div className="flex flex-wrap gap-2">
                {send.agent_phone ? (
                  <a
                    href={`tel:${send.agent_phone}`}
                    className="flex items-center gap-1.5 bg-[#FFCE0A] text-[#342e37] font-bold px-3 py-1.5 rounded-lg text-[13px] hover:bg-[#FFCE0A]/90 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />{send.agent_phone}
                  </a>
                ) : (
                  <span className="text-white/40 text-[12px] italic">No phone</span>
                )}
                <a
                  href={`mailto:${send.agent_email}`}
                  className="flex items-center gap-1.5 bg-white/10 text-white px-3 py-1.5 rounded-lg text-[13px] hover:bg-white/20 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />{send.agent_email}
                </a>
              </div>
              {send.listing_brokerage && (
                <div className="border-t border-white/10 pt-3 space-y-0.5">
                  <p className="text-white/60 text-[11px] uppercase tracking-wide">Brokerage</p>
                  <p className="text-white font-medium text-[14px]">{send.listing_brokerage}</p>
                </div>
              )}
            </div>

            {/* Listing Details */}
            {send.listing_address && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Home className="w-5 h-5 text-[#342e37] dark:text-[#FFCE0A]" />
                  <h3 className="font-bold text-[17px] dark:text-white">Listing Details</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-[14px]">
                  <div className="col-span-2">
                    <p className="text-gray-500 dark:text-gray-400 mb-0.5">Address</p>
                    <p className="font-medium dark:text-white">
                      {[send.listing_address, send.listing_city, send.listing_state].filter(Boolean).join(', ')}
                    </p>
                  </div>
                  {send.listing_price != null && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 mb-0.5">List Price</p>
                      <p className="font-bold text-[18px] text-[#342e37] dark:text-white">${send.listing_price.toLocaleString()}</p>
                    </div>
                  )}
                  {send.listing_property_type && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 mb-0.5">Property Type</p>
                      <p className="font-medium dark:text-white">{send.listing_property_type}</p>
                    </div>
                  )}
                  {send.listing_type && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 mb-0.5">Listing Type</p>
                      <p className="font-medium dark:text-white">{send.listing_type}</p>
                    </div>
                  )}
                  {(send.listing_beds != null || send.listing_baths != null) && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 mb-0.5">Bed / Bath</p>
                      <p className="font-semibold text-[16px] dark:text-white">
                        {send.listing_beds ?? '—'} bd · {send.listing_baths ?? '—'} ba
                      </p>
                    </div>
                  )}
                  {send.listing_sqft != null && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 mb-0.5">Living Area</p>
                      <p className="font-medium dark:text-white">{send.listing_sqft.toLocaleString()} sq ft</p>
                    </div>
                  )}
                  {send.listing_mls_number && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 mb-0.5">MLS #</p>
                      <p className="font-medium font-mono text-[13px] dark:text-white">{send.listing_mls_number}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Correspondence */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-[#342e37] dark:text-[#FFCE0A]" />
                <h3 className="font-bold text-[17px] dark:text-white">Correspondence</h3>
              </div>

              {/* Timeline */}
              <div className="relative pl-6 space-y-4 mb-5">
                {/* Vertical line */}
                <div className="absolute left-2 top-2 bottom-2 w-px bg-gray-200 dark:bg-white/10" />

                {send.sent_at && (
                  <TimelineEvent
                    icon={<Mail className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />}
                    label={campaign.channel === 'sms' ? 'SMS sent' : 'Email sent'}
                    time={formatDateTime(send.sent_at)}
                    dotColor="bg-gray-300 dark:bg-white/20"
                  />
                )}
                {send.opened_at && (
                  <TimelineEvent
                    icon={<Eye className="w-3.5 h-3.5 text-blue-500" />}
                    label="Opened"
                    time={formatDateTime(send.opened_at)}
                    dotColor="bg-blue-400"
                  />
                )}
                {send.clicked_at && (
                  <TimelineEvent
                    icon={<MousePointer className="w-3.5 h-3.5 text-indigo-500" />}
                    label="Clicked link"
                    time={formatDateTime(send.clicked_at)}
                    dotColor="bg-indigo-400"
                  />
                )}
                {send.campaign_replies?.map((reply) => (
                  <TimelineEvent
                    key={reply.id}
                    icon={<CheckCircle2 className="w-3.5 h-3.5 text-green-600" />}
                    label="Replied"
                    time={formatDateTime(reply.replied_at)}
                    dotColor="bg-green-500"
                    highlight
                  />
                ))}
                {!send.sent_at && !send.opened_at && !send.clicked_at && !hasReply && (
                  <p className="text-sm text-gray-400 dark:text-gray-500 italic">No activity recorded yet.</p>
                )}
              </div>

              {/* Message preview */}
              <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {campaign.channel === 'sms' ? 'SMS Message' : 'Email Preview'}
                  </span>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">{campaign.campaign_name}</span>
                </div>
                {previewSubject && (
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-white/10 text-[13px] text-gray-700 dark:text-gray-300">
                    <span className="text-gray-400 dark:text-gray-500 mr-2">Subject:</span>
                    <span className="font-medium">{previewSubject}</span>
                  </div>
                )}
                <div className="px-4 py-3 bg-white dark:bg-[#1a1a1a]">
                  <div
                    className="text-[14px] text-gray-800 dark:text-gray-200 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: previewBodyHtml }}
                  />
                </div>
              </div>
            </div>

            <div className="pb-4" />
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}

// ---------------------------------------------------------------------------
// Timeline event sub-component
// ---------------------------------------------------------------------------
function TimelineEvent({
  icon,
  label,
  time,
  dotColor,
  highlight = false,
}: {
  icon: ReactNode;
  label: string;
  time: string | null;
  dotColor: string;
  highlight?: boolean;
}) {
  return (
    <div className="relative flex items-start gap-2.5">
      {/* Dot on the line */}
      <div className={`absolute -left-[18px] w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#0F1115] mt-0.5 ${dotColor}`} />
      <div className={`flex items-center gap-1.5 ${highlight ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
        {icon}
        <span className="text-[14px] font-medium">{label}</span>
      </div>
      {time && (
        <span className="text-[12px] text-gray-400 dark:text-gray-500 mt-0.5">{time}</span>
      )}
    </div>
  );
}
