import { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import UnderlineExt from '@tiptap/extension-underline';
import LinkExt from '@tiptap/extension-link';
import TextAlignExt from '@tiptap/extension-text-align';
import PlaceholderExt from '@tiptap/extension-placeholder';
import ImageExt from '@tiptap/extension-image';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import DOMPurify from 'dompurify';
import { MergeTagNode } from './MergeTagNode';
import { SectionDividerNode } from './SectionDividerNode';
import { EditorToolbar, type MergeTagOption } from './EditorToolbar';
import { isHtmlBody, legacyMarkdownToHtml } from './previewUtils';

interface Props {
  content: string;
  onChange: (html: string) => void;
  mergeTagOptions: MergeTagOption[];
  placeholder?: string;
  disabled?: boolean;
  withSections?: boolean;
}

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2',
  'ul', 'ol', 'li', 'blockquote', 'hr', 'a', 'div', 'span',
  'img', 'table', 'tr', 'td', 'th', 'tbody', 'thead',
];
const ALLOWED_ATTR = ['href', 'target', 'rel', 'style', 'data-merge-tag', 'class', 'contenteditable', 'src', 'alt', 'width', 'height', 'data-section-divider', 'colspan', 'rowspan'];

const SECTIONS_SEED = [
  '<div data-section-divider="Header"></div>',
  '<p></p>',
  '<div data-section-divider="Body"></div>',
  '<p></p>',
  '<div data-section-divider="Footer"></div>',
  '<p></p>',
].join('');

function normalizeContent(raw: string, withSections: boolean): string {
  if (!raw || raw === '<p></p>') {
    return withSections ? SECTIONS_SEED : '';
  }
  return isHtmlBody(raw) ? raw : legacyMarkdownToHtml(raw);
}

export function RichTextEditor({ content, onChange, mergeTagOptions, placeholder, disabled, withSections }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      ImageExt.configure({ allowBase64: true, inline: false }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      MergeTagNode,
      SectionDividerNode,
    ],
    content: normalizeContent(content, withSections ?? false),
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
          FORBID_TAGS: ['script', 'style'],
        });
        if (!clean.trim()) return false;
        const dt = new DataTransfer();
        dt.setData('text/html', clean);
        const fakeEvent = new ClipboardEvent('paste', { clipboardData: dt });
        _view.dom.dispatchEvent(fakeEvent);
        return true;
      },
    },
  });

  // Sync external content changes (e.g. template load)
  useEffect(() => {
    if (!editor) return;
    const normalized = normalizeContent(content, withSections ?? false);
    const current = editor.getHTML();
    if (normalized !== current && normalized !== (current === '<p></p>' ? '' : current)) {
      editor.commands.setContent(normalized, false);
    }
  }, [content, editor]);

  const handleImageFile = (file: File) => {
    if (!editor) return;
    if (file.size > 3 * 1024 * 1024) {
      alert('Image must be under 3 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      editor.chain().focus().setImage({ src: reader.result as string }).run();
    };
    reader.readAsDataURL(file);
  };

  if (!editor) return null;

  return (
    <div className="lb-editor rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden bg-white dark:bg-[#1a1a1a] focus-within:border-[#FFCE0A] transition-colors">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageFile(file);
          e.target.value = '';
        }}
      />
      <EditorToolbar
        editor={editor}
        mergeTagOptions={mergeTagOptions}
        onImageClick={() => fileInputRef.current?.click()}
      />
      <EditorContent editor={editor} />
    </div>
  );
}
