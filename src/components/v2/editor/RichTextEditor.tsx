import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import UnderlineExt from '@tiptap/extension-underline';
import LinkExt from '@tiptap/extension-link';
import TextAlignExt from '@tiptap/extension-text-align';
import PlaceholderExt from '@tiptap/extension-placeholder';
import DOMPurify from 'dompurify';
import { MergeTagNode } from './MergeTagNode';
import { EditorToolbar, type MergeTagOption } from './EditorToolbar';
import { isHtmlBody, legacyMarkdownToHtml } from './previewUtils';

interface Props {
  content: string;
  onChange: (html: string) => void;
  mergeTagOptions: MergeTagOption[];
  placeholder?: string;
  disabled?: boolean;
}

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2',
  'ul', 'ol', 'li', 'blockquote', 'hr', 'a', 'div', 'span',
];
const ALLOWED_ATTR = ['href', 'target', 'rel', 'style', 'data-merge-tag', 'class', 'contenteditable'];

function normalizeContent(raw: string): string {
  if (!raw || raw === '<p></p>') return '';
  return isHtmlBody(raw) ? raw : legacyMarkdownToHtml(raw);
}

export function RichTextEditor({ content, onChange, mergeTagOptions, placeholder, disabled }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
        codeBlock: false,
        code: false,
      }),
      UnderlineExt,
      LinkExt.configure({
        openOnClick: false,
        HTMLAttributes: {
          style: 'color:#1d4ed8;text-decoration:underline',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      TextAlignExt.configure({ types: ['heading', 'paragraph'] }),
      PlaceholderExt.configure({ placeholder: placeholder ?? 'Write your message…' }),
      MergeTagNode,
    ],
    content: normalizeContent(content),
    editable: !disabled,
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML();
      onChange(html === '<p></p>' ? '' : html);
    },
    editorProps: {
      handlePaste(_view, event) {
        const html = event.clipboardData?.getData('text/html');
        if (!html) return false;
        const clean = DOMPurify.sanitize(html, {
          ALLOWED_TAGS,
          ALLOWED_ATTR,
          FORBID_TAGS: ['img', 'script', 'style'],
        });
        if (!clean.trim()) return false;
        // Let TipTap handle the sanitized HTML via normal paste path
        const dt = new DataTransfer();
        dt.setData('text/html', clean);
        const fakeEvent = new ClipboardEvent('paste', { clipboardData: dt });
        // Only intercept if the original had HTML — let TipTap process the cleaned version
        _view.dom.dispatchEvent(fakeEvent);
        return true;
      },
    },
  });

  // Sync external content changes (e.g. template load)
  useEffect(() => {
    if (!editor) return;
    const normalized = normalizeContent(content);
    const current = editor.getHTML();
    if (normalized !== current && normalized !== (current === '<p></p>' ? '' : current)) {
      editor.commands.setContent(normalized, false);
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div className="lb-editor rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden bg-white dark:bg-[#1a1a1a] focus-within:border-[#FFCE0A] transition-colors">
      <EditorToolbar editor={editor} mergeTagOptions={mergeTagOptions} />
      <EditorContent editor={editor} />
    </div>
  );
}
