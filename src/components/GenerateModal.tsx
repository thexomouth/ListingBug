import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { X, Send } from 'lucide-react';

// ─── Star icon ────────────────────────────────────────────────────────────────
export function StarIcon({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" fill="currentColor" />
    </svg>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface GenerateContext {
  city: string;
  state: string;
  listing_type?: string;
  property_type?: string;
  channel: string;
  business_name?: string;
  contact_name?: string;
  service_type?: string[];
  days_old?: number | string;
  price_min?: number | null;
  price_max?: number | null;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ParsedFields {
  subject?: string;
  preview?: string;
  body?: string;
  plain?: string;
}

export type GenerateTargetField = 'subject' | 'preview' | 'body';

interface GenerateModalProps {
  open: boolean;
  onClose: () => void;
  context: GenerateContext;
  current: { subject?: string; preview_text?: string; body?: string };
  channel: string;
  onApply: (fields: { subject?: string; preview_text?: string; body?: string }) => void;
  targetField?: GenerateTargetField;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

function textToHtml(text: string): string {
  return text.split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
}

function parseResponse(text: string): ParsedFields {
  const result: ParsedFields = {};
  const lines = text.split('\n');
  let mode: 'subject' | 'preview' | 'body' | null = null;
  const bodyLines: string[] = [];

  for (const line of lines) {
    const s = line.match(/^SUBJECT:\s*(.*)/i);
    const p = line.match(/^PREVIEW:\s*(.*)/i);
    const b = line.match(/^BODY:\s*(.*)/i);
    if (s) { mode = 'subject'; result.subject = s[1].trim(); }
    else if (p) { mode = 'preview'; result.preview = p[1].trim(); }
    else if (b) { mode = 'body'; if (b[1].trim()) bodyLines.push(b[1]); }
    else if (mode === 'body') bodyLines.push(line);
  }

  if (bodyLines.length) result.body = bodyLines.join('\n').trim();
  if (!result.subject && !result.preview && !result.body) result.plain = text;
  return result;
}

// ─── Helpers for field-targeted generation ────────────────────────────────────
function getInitialFieldPrompt(
  targetField: GenerateTargetField,
  channel: string,
  current?: { subject?: string; preview_text?: string; body?: string },
): string {
  if (targetField === 'subject') {
    if (current?.subject?.trim())
      return `I've started a subject line: "${current.subject.trim()}". Improve or rewrite it — keep the same angle or try a better one.`;
    return 'Write a subject line for my campaign.';
  }
  if (targetField === 'preview') {
    if (current?.preview_text?.trim())
      return `I've started preview text: "${current.preview_text.trim()}". Improve or rewrite it.`;
    return 'Write preview text for my campaign.';
  }
  const body = stripHtml(current?.body ?? '');
  if (body) return `I've started a message body:\n${body}\n\nImprove or rewrite it.`;
  return channel === 'email' ? 'Write a full email body for my campaign.' : 'Write an SMS message for my campaign.';
}

const FIELD_FORMAT_HINT: Record<GenerateTargetField, string> = {
  subject: 'Only write the subject line. Use format: SUBJECT: <text>',
  preview: 'Only write the preview text. Use format: PREVIEW: <text>',
  body: 'Only write the message body. Use format: BODY:\n<text>',
};

const FIELD_LABEL: Record<GenerateTargetField, string> = {
  subject: 'subject line',
  preview: 'preview text',
  body: 'message body',
};

// ─── Preset pills ─────────────────────────────────────────────────────────────
function getPills(channel: string, current: GenerateModalProps['current'], targetField?: GenerateTargetField) {
  const pills: { label: string; prompt: string }[] = [];

  if (targetField === 'subject') {
    pills.push({ label: 'Try again', prompt: 'Write a different subject line.' });
    pills.push({ label: 'Shorter', prompt: 'Make it shorter.' });
    pills.push({ label: 'Add urgency', prompt: 'Add a sense of urgency.' });
    pills.push({ label: 'More casual', prompt: 'More casual tone.' });
    pills.push({ label: 'Question format', prompt: 'Phrase it as a question.' });
  } else if (targetField === 'preview') {
    pills.push({ label: 'Try again', prompt: 'Write a different preview text.' });
    pills.push({ label: 'Shorter', prompt: 'Make it shorter.' });
    pills.push({ label: 'More intriguing', prompt: 'Make it more intriguing and curiosity-driven.' });
    pills.push({ label: 'More casual', prompt: 'More casual tone.' });
  } else if (targetField === 'body') {
    const hasBody = !!stripHtml(current.body ?? '');
    pills.push({ label: 'Try again', prompt: 'Write a completely different message body.' });
    if (hasBody) {
      pills.push({ label: 'Shorter', prompt: 'Make it shorter and more concise.' });
      pills.push({ label: 'More casual', prompt: 'More casual, friendly tone.' });
      pills.push({ label: 'More professional', prompt: 'More professional tone.' });
      pills.push({ label: 'Add urgency', prompt: 'Add a sense of urgency.' });
    }
  } else {
    const hasContent = !!(current.subject || current.preview_text || stripHtml(current.body ?? ''));
    const email = channel === 'email';
    if (email) {
      pills.push({ label: 'Write everything', prompt: 'Write a subject line, preview text, and full email body for my campaign.' });
      pills.push({ label: 'Subject + preview', prompt: 'Write just a subject line and preview text for my campaign.' });
      pills.push({ label: 'Message body', prompt: 'Write just the full message body for my campaign.' });
    } else {
      pills.push({ label: 'Write message', prompt: 'Write an SMS message for my campaign.' });
    }
    if (hasContent) {
      pills.push({ label: 'Make it shorter', prompt: 'Make the current copy shorter and more concise. Keep the same fields.' });
      pills.push({ label: 'More casual', prompt: 'Rewrite the current copy in a more casual, friendly tone.' });
      pills.push({ label: 'More professional', prompt: 'Rewrite the current copy in a more professional tone.' });
      pills.push({ label: 'Different angle', prompt: 'Try a completely different creative angle.' });
    }
  }

  return pills;
}

// ─── AssistantMessage: renders parsed AI output ───────────────────────────────
function AssistantMessage({
  content,
  channel,
  onApply,
}: {
  content: string;
  channel: string;
  onApply: (fields: { subject?: string; preview_text?: string; body?: string }) => void;
}) {
  const parsed = parseResponse(content);

  if (parsed.plain) {
    return <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{parsed.plain}</p>;
  }

  const canApplyAll = (parsed.subject ? 1 : 0) + (parsed.preview ? 1 : 0) + (parsed.body ? 1 : 0) > 1;

  return (
    <div className="space-y-3">
      {parsed.subject && (
        <div className="rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden">
          <div className="px-3 py-1.5 bg-gray-50 dark:bg-white/5 flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Subject line</span>
            <button
              onClick={() => onApply({ subject: parsed.subject })}
              className="text-[11px] font-medium px-2 py-0.5 rounded-md transition-colors"
              style={{ background: '#FFCE0A', color: '#342e37' }}
            >
              Apply
            </button>
          </div>
          <p className="px-3 py-2 text-sm text-gray-900 dark:text-white font-medium">{parsed.subject}</p>
        </div>
      )}

      {parsed.preview && (
        <div className="rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden">
          <div className="px-3 py-1.5 bg-gray-50 dark:bg-white/5 flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Preview text</span>
            <button
              onClick={() => onApply({ preview_text: parsed.preview })}
              className="text-[11px] font-medium px-2 py-0.5 rounded-md transition-colors"
              style={{ background: '#FFCE0A', color: '#342e37' }}
            >
              Apply
            </button>
          </div>
          <p className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">{parsed.preview}</p>
        </div>
      )}

      {parsed.body && (
        <div className="rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden">
          <div className="px-3 py-1.5 bg-gray-50 dark:bg-white/5 flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Message body</span>
            <button
              onClick={() => onApply({ body: channel === 'email' ? textToHtml(parsed.body!) : parsed.body })}
              className="text-[11px] font-medium px-2 py-0.5 rounded-md transition-colors"
              style={{ background: '#FFCE0A', color: '#342e37' }}
            >
              Apply
            </button>
          </div>
          <p className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{parsed.body}</p>
        </div>
      )}

      {canApplyAll && (
        <button
          onClick={() => onApply({
            ...(parsed.subject ? { subject: parsed.subject } : {}),
            ...(parsed.preview ? { preview_text: parsed.preview } : {}),
            ...(parsed.body ? { body: channel === 'email' ? textToHtml(parsed.body) : parsed.body } : {}),
          })}
          className="w-full py-1.5 rounded-lg text-[12px] font-semibold transition-colors"
          style={{ background: '#342e37', color: '#FFCE0A' }}
        >
          Apply all
        </button>
      )}
    </div>
  );
}

// ─── Setup screen constants ───────────────────────────────────────────────────
const SETUP_GOALS = ['Make Sales', 'Get Engagement', 'Repeat Business', 'Spread Awareness'];
const SETUP_TONES = ['Friendly', 'Professional', 'Funny', 'Optimistic', 'Formal', 'Informal', 'Entertaining', 'Serious'];
const SETUP_HOOKS = ['Fast turnaround', 'Best price', 'Premium quality', 'Local market', 'Free consult', 'Intro Offer'];

// ─── Main component ───────────────────────────────────────────────────────────
export function GenerateModal({ open, onClose, context, current, channel, onApply, targetField }: GenerateModalProps) {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Setup screen state
  const [setupDone, setSetupDone] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [selectedTone, setSelectedTone] = useState<string | null>(null);
  const [selectedHook, setSelectedHook] = useState<string | null>(null);

  // Reset everything when modal opens
  useEffect(() => {
    if (open) {
      setHistory([]);
      setInput('');
      setSetupDone(false);
      setSelectedGoal(null);
      setSelectedTone(null);
      setSelectedHook(null);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  const send = async (text: string, goal = selectedGoal, tone = selectedTone, hook = selectedHook) => {
    if (!text.trim() || loading) return;

    const refersToCurrentContent = /shorter|casual|professional|different angle|rewrite|try again|urgency|intriguing|question/i.test(text);
    let apiPrompt = text;

    // Append relevant current content for rewrite-style prompts
    if (refersToCurrentContent) {
      const parts: string[] = [];
      if (targetField === 'subject' && current.subject) {
        parts.push(`Current subject: "${current.subject}"`);
      } else if (targetField === 'preview' && current.preview_text) {
        parts.push(`Current preview: "${current.preview_text}"`);
      } else if (targetField === 'body') {
        const body = stripHtml(current.body ?? '');
        if (body) parts.push(`Current body:\n${body}`);
      } else if (!targetField) {
        if (current.subject) parts.push(`Current subject: "${current.subject}"`);
        if (current.preview_text) parts.push(`Current preview: "${current.preview_text}"`);
        const body = stripHtml(current.body ?? '');
        if (body) parts.push(`Current body:\n${body}`);
      }
      if (parts.length) apiPrompt = `${text}\n\n${parts.join('\n')}`;
    }

    // Constrain AI to the target field's format
    if (targetField) {
      apiPrompt = `${apiPrompt}\n\n${FIELD_FORMAT_HINT[targetField]}`;
    }

    const apiHistory: ChatMessage[] = [...history, { role: 'user', content: apiPrompt }];
    setHistory(h => [...h, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-message', {
        body: {
          messages: apiHistory,
          context: { ...context, channel },
          ...(goal ? { goal } : {}),
          ...(tone ? { tone } : {}),
          ...(hook ? { hook } : {}),
        },
      });

      if (error || !data?.reply) throw new Error(error?.message ?? 'No response');
      setHistory(h => [...h, { role: 'assistant', content: data.reply }]);
    } catch {
      setHistory(h => [...h, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSetupGenerate = () => {
    setSetupDone(true);
    const base = targetField
      ? getInitialFieldPrompt(targetField, channel, current)
      : channel === 'email'
        ? 'Write everything — subject line, preview text, and full email body.'
        : 'Write an SMS message for my campaign.';
    send(base, selectedGoal, selectedTone, selectedHook);
  };

  const handleSetupSkip = () => {
    setSetupDone(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  if (!open) return null;

  const pills = getPills(channel, current, targetField);
  const contextLabel = [context.city, context.state].filter(Boolean).join(', ');
  const inSetup = !setupDone && history.length === 0;

  const setupPillClass = (selected: boolean) =>
    `px-3 py-1 rounded-full border text-xs font-medium transition-all cursor-pointer select-none ${
      selected
        ? 'border-[#FFCE0A] text-[#342e37] dark:text-[#342e37]'
        : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-[#FFCE0A]/60 hover:text-gray-900 dark:hover:text-white'
    }`;

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative flex flex-col bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-2xl overflow-hidden"
        style={{ width: '100%', maxWidth: 600, height: '80vh', maxHeight: 700 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <StarIcon size={16} className="text-[#FFCE0A]" />
            <span className="font-semibold text-[15px] text-gray-900 dark:text-white">
              {targetField ? `Generate ${FIELD_LABEL[targetField]}` : 'Generate with AI'}
            </span>
            {contextLabel && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400">
                {contextLabel} · {channel}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Setup screen */}
        {inSetup && (
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold">Quick setup — dial in the right angle</p>

            {/* Goal */}
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">What's the goal?</p>
              <div className="flex flex-wrap gap-2">
                {SETUP_GOALS.map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setSelectedGoal(v => v === g ? null : g)}
                    className={setupPillClass(selectedGoal === g)}
                    style={selectedGoal === g ? { background: '#FFCE0A' } : {}}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Tone */}
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">What tone?</p>
              <div className="flex flex-wrap gap-2">
                {SETUP_TONES.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTone(v => v === t ? null : t)}
                    className={setupPillClass(selectedTone === t)}
                    style={selectedTone === t ? { background: '#FFCE0A' } : {}}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Hook */}
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">What's your main edge? <span className="text-xs text-gray-400 dark:text-gray-500 font-normal">(optional)</span></p>
              <div className="flex flex-wrap gap-2">
                {SETUP_HOOKS.map(h => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setSelectedHook(v => v === h ? null : h)}
                    className={setupPillClass(selectedHook === h)}
                    style={selectedHook === h ? { background: '#FFCE0A' } : {}}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chat area */}
        {!inSetup && (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {history.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center mt-0.5" style={{ background: '#342e37' }}>
                    <StarIcon size={10} className="text-[#FFCE0A]" />
                  </div>
                )}
                <div className={`max-w-[85%] ${msg.role === 'user' ? 'ml-auto' : ''}`}>
                  {msg.role === 'user' ? (
                    <div className="px-3 py-2 rounded-2xl rounded-tr-sm text-sm text-white" style={{ background: '#342e37' }}>
                      {msg.content}
                    </div>
                  ) : (
                    <AssistantMessage content={msg.content} channel={channel} onApply={onApply} />
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center mt-0.5" style={{ background: '#342e37' }}>
                  <StarIcon size={10} className="text-[#FFCE0A]" />
                </div>
                <div className="flex items-center gap-1 py-2">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Setup footer */}
        {inSetup && (
          <div className="px-5 py-4 border-t border-gray-200 dark:border-white/10 shrink-0 flex items-center justify-between gap-3">
            <button
              onClick={handleSetupSkip}
              className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              Skip setup →
            </button>
            <button
              onClick={handleSetupGenerate}
              disabled={!selectedGoal || !selectedTone}
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg transition-opacity disabled:opacity-40"
              style={{ background: '#342e37', color: '#FFCE0A' }}
            >
              <StarIcon size={11} className="text-[#FFCE0A]" />
              Generate
            </button>
          </div>
        )}

        {/* Chat pills */}
        {!inSetup && (
          <div className="px-5 py-2.5 border-t border-gray-100 dark:border-white/5 shrink-0">
            <div className="flex flex-wrap gap-1.5">
              {pills.map(pill => (
                <button
                  key={pill.label}
                  onClick={() => send(pill.prompt)}
                  disabled={loading}
                  className="flex items-center gap-1 text-[12px] font-medium px-2.5 py-1 rounded-full border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-[#FFCE0A] hover:text-[#342e37] dark:hover:text-white transition-colors disabled:opacity-40"
                >
                  <StarIcon size={9} className="text-[#FFCE0A]" />
                  {pill.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat input */}
        {!inSetup && (
          <div className="px-5 py-3 border-t border-gray-200 dark:border-white/10 shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
                }}
                placeholder="Ask anything — 'shorter', 'add urgency', 'more casual'…"
                rows={1}
                className="flex-1 resize-none rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:border-[#FFCE0A] transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                style={{ minHeight: 40, maxHeight: 120 }}
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || loading}
                className="p-2.5 rounded-xl transition-colors disabled:opacity-40"
                style={{ background: '#342e37' }}
              >
                <Send className="w-4 h-4 text-[#FFCE0A]" />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
