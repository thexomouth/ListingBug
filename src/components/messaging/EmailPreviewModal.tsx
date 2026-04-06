import { useEffect, useRef } from 'react';
import { X, Monitor, Smartphone } from 'lucide-react';
import { useState } from 'react';

interface EmailPreviewModalProps {
  subject: string;
  body: string;
  fromName: string;
  fromEmail: string;
  sampleRecipient?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    city?: string;
    company?: string;
  };
  onClose: () => void;
}

/** Apply {{merge_tags}} with sample data so the preview looks real */
function applyMergeTags(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? `{{${key}}}`);
}

/** Detect if the body contains HTML tags */
function isHTML(str: string): boolean {
  return /<[a-z][\s\S]*>/i.test(str);
}

/** Wrap plain text in a basic email-safe HTML shell */
function plainToHTML(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
  return `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#222;">${escaped}</div>`;
}

/** Full email shell with safe defaults for client compatibility */
function buildEmailDocument(bodyHTML: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0; background: #f4f4f5; font-family: Arial, Helvetica, sans-serif; }
  .email-wrap { max-width: 600px; margin: 24px auto; background: #ffffff; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
  .email-body { padding: 32px; font-size: 15px; line-height: 1.65; color: #1a1a1a; }
  img { max-width: 100%; height: auto; }
  a { color: #2563eb; }
</style>
</head>
<body>
  <div class="email-wrap">
    <div class="email-body">${bodyHTML}</div>
  </div>
</body>
</html>`;
}

export function EmailPreviewModal({
  subject,
  body,
  fromName,
  fromEmail,
  sampleRecipient,
  onClose,
}: EmailPreviewModalProps) {
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const sample = {
    first_name: sampleRecipient?.first_name || 'Jane',
    last_name:  sampleRecipient?.last_name  || 'Smith',
    email:      sampleRecipient?.email      || 'jane@example.com',
    city:       sampleRecipient?.city       || 'Austin',
    company:    sampleRecipient?.company    || 'Keller Williams',
  };

  const mergedSubject = applyMergeTags(subject || '(No subject)', sample);
  const mergedBody    = applyMergeTags(body    || '', sample);
  const bodyHTML      = isHTML(mergedBody) ? mergedBody : plainToHTML(mergedBody);
  const emailDoc      = buildEmailDocument(bodyHTML);

  // Write srcdoc via ref to avoid React escaping issues with complex HTML
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(emailDoc);
    doc.close();
  }, [emailDoc]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-700 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">Email Preview</span>
            {sampleRecipient?.first_name && (
              <span className="text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                Previewing as {sample.first_name} {sample.last_name}
              </span>
            )}
            {!sampleRecipient?.first_name && (
              <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                Using sample data — select a recipient first for personalized preview
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Viewport toggle */}
            <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              <button
                onClick={() => setViewport('desktop')}
                className={`p-2 transition-colors ${viewport === 'desktop' ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900' : 'text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                title="Desktop view"
              >
                <Monitor size={14} />
              </button>
              <button
                onClick={() => setViewport('mobile')}
                className={`p-2 transition-colors border-l border-zinc-200 dark:border-zinc-700 ${viewport === 'mobile' ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900' : 'text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                title="Mobile view"
              >
                <Smartphone size={14} />
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Email header metadata */}
        <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 shrink-0 space-y-1 text-sm">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-medium text-zinc-400 w-14 shrink-0">From</span>
            <span className="text-zinc-700 dark:text-zinc-200">
              {fromName ? `${fromName} ` : ''}<span className="text-zinc-400">{fromEmail ? `<${fromEmail}>` : <em className="text-red-400">No sender selected</em>}</span>
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-medium text-zinc-400 w-14 shrink-0">To</span>
            <span className="text-zinc-700 dark:text-zinc-200">{sample.first_name} {sample.last_name} <span className="text-zinc-400">&lt;{sample.email}&gt;</span></span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-medium text-zinc-400 w-14 shrink-0">Subject</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{mergedSubject || <em className="text-zinc-400 font-normal">No subject</em>}</span>
          </div>
        </div>

        {/* Preview iframe */}
        <div className="flex-1 overflow-auto bg-zinc-100 dark:bg-zinc-800 p-4 flex justify-center">
          <div
            className={`transition-all duration-300 ${viewport === 'mobile' ? 'w-[390px]' : 'w-full max-w-[680px]'}`}
            style={{ minHeight: 400 }}
          >
            {/* Device chrome for mobile */}
            {viewport === 'mobile' && (
              <div className="mx-auto mb-2 flex items-center justify-center gap-1">
                <div className="w-16 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
              </div>
            )}
            <div className={`bg-white shadow-lg overflow-hidden ${viewport === 'mobile' ? 'rounded-2xl border border-zinc-200 dark:border-zinc-700' : 'rounded-lg'}`}>
              <iframe
                ref={iframeRef}
                title="Email preview"
                sandbox="allow-same-origin"
                className="w-full border-0 block"
                style={{ minHeight: 480 }}
                onLoad={() => {
                  // Auto-resize iframe to content height
                  const iframe = iframeRef.current;
                  if (!iframe) return;
                  try {
                    const h = iframe.contentDocument?.documentElement?.scrollHeight;
                    if (h) iframe.style.height = `${h}px`;
                  } catch { /* cross-origin */ }
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 shrink-0">
          <p className="text-xs text-zinc-400">
            {isHTML(body)
              ? 'Body rendered as HTML. Styles may appear differently across email clients.'
              : 'Body is plain text — will be wrapped in a basic HTML shell on send. Add HTML tags to use rich formatting.'}
          </p>
        </div>
      </div>
    </div>
  );
}
