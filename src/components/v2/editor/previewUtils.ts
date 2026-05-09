export function isHtmlBody(body: string): boolean {
  return /<(p|div|strong|em|u|s|br|h[1-6]|ul|ol|li|blockquote|hr)\b/i.test(body.trim());
}

// Converts the legacy markdown dialect used before TipTap so old bodies still render.
export function legacyMarkdownToHtml(text: string): string {
  let s = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const applyInline = (t: string) =>
    t
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
        (_, lbl, url) => `<a href="${url}" style="color:#1d4ed8;text-decoration:underline" target="_blank" rel="noopener noreferrer">${lbl}</a>`)
      .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
      .replace(/__([^_\n]+)__/g, '<u>$1</u>')
      .replace(/(?<!\w)_([^_\n]+)_(?!\w)/g, '<em>$1</em>')
      .replace(/~~([^~\n]+)~~/g, '<s>$1</s>');

  const lines = s.split('\n');
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const ln = lines[i];
    if (ln === '---') {
      out.push('<hr style="border:0;border-top:1px solid #e5e7eb;margin:10px 0">');
    } else if (ln.startsWith('&gt; ')) {
      out.push(`<blockquote style="border-left:3px solid #d1d5db;padding:2px 0 2px 12px;color:#6b7280">${applyInline(ln.slice(5))}</blockquote>`);
    } else if (ln.startsWith('# ')) {
      out.push(`<h1 style="font-size:1.375rem;font-weight:700;margin:0.5em 0;line-height:1.25">${applyInline(ln.slice(2))}</h1>`);
    } else if (ln.startsWith('## ')) {
      out.push(`<h2 style="font-size:1.125rem;font-weight:600;margin:0.4em 0;line-height:1.3">${applyInline(ln.slice(3))}</h2>`);
    } else if (ln.startsWith('[center]') && ln.includes('[/center]')) {
      const inner = ln.slice(8, ln.indexOf('[/center]'));
      out.push(`<div style="text-align:center">${applyInline(inner)}</div>`);
    } else if (ln.startsWith('- ')) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(`<li>${applyInline(lines[i].slice(2))}</li>`);
        i++;
      }
      out.push(`<ul style="margin:4px 0;padding-left:20px;list-style-type:disc">${items.join('')}</ul>`);
      continue;
    } else if (/^\d+\. /.test(ln)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(`<li>${applyInline(lines[i].replace(/^\d+\. /, ''))}</li>`);
        i++;
      }
      out.push(`<ol style="margin:4px 0;padding-left:20px">${items.join('')}</ol>`);
      continue;
    } else {
      out.push(applyInline(ln));
    }
    i++;
  }

  return out.join('<br>').replace(/(<\/(?:h[1-6]|ul|ol|blockquote|div|hr)>)<br>/g, '$1');
}

const CHIP_RE = /<span[^>]*data-merge-tag="(\{\{\w+\}\})"[^>]*>.*?<\/span>/g;

const PREVIEW_LABELS: Record<string, string> = {
  '{{agent_name}}':    '[AGENT NAME]',
  '{{address}}':       '[ADDRESS]',
  '{{price}}':         '[PRICE]',
  '{{city}}':          '[CITY]',
  '{{listing_date}}':  '[DATE]',
  '{{listing_url}}':   '[LISTING URL]',
  '{{unsubscribe_url}}': '[UNSUBSCRIBE]',
};

// Replaces TipTap merge-tag chip spans with readable placeholder text for preview.
export function buildPreviewHtml(htmlBody: string, city?: string): string {
  const labels = { ...PREVIEW_LABELS };
  if (city) labels['{{city}}'] = city;

  const body = isHtmlBody(htmlBody) ? htmlBody : legacyMarkdownToHtml(htmlBody);
  return body.replace(CHIP_RE, (_, variable) => labels[variable] ?? variable);
}

// Resolves TipTap chip spans AND raw {{}} tokens against a vars map (used server-side shim on client).
export function fillVarsHtml(html: string, vars: Record<string, string>): string {
  return html
    .replace(CHIP_RE, (_, variable) => {
      const key = variable.replace(/[{}]/g, '');
      return vars[key] ?? variable;
    })
    .replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}
