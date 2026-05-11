import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import UnderlineExt from '@tiptap/extension-underline';
import LinkExt from '@tiptap/extension-link';
import TextAlignExt from '@tiptap/extension-text-align';
import PlaceholderExt from '@tiptap/extension-placeholder';
import ImageExt from '@tiptap/extension-image';
import { TextStyle, FontFamily } from '@tiptap/extension-text-style';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import { NodeSelection } from '@tiptap/pm/state';
import DOMPurify from 'dompurify';
import { MergeTagNode } from './MergeTagNode';
import { SectionNode, type SectionAttrs } from './SectionNode';
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
const ALLOWED_ATTR = [
  'href', 'target', 'rel', 'style', 'data-merge-tag', 'class', 'contenteditable',
  'src', 'alt', 'width', 'height', 'data-section', 'data-bg', 'data-border-color',
  'data-border-width', 'data-padding', 'colspan', 'rowspan',
];

const SECTIONS_SEED = {
  type: 'doc',
  content: [
    { type: 'section', attrs: { label: 'Header', bgColor: '', borderColor: '#e5e7eb', borderWidth: 0, padding: 12 }, content: [{ type: 'paragraph' }] },
    { type: 'section', attrs: { label: 'Body', bgColor: '', borderColor: '#e5e7eb', borderWidth: 0, padding: 12 }, content: [{ type: 'paragraph' }] },
    { type: 'section', attrs: { label: 'Footer', bgColor: '', borderColor: '#e5e7eb', borderWidth: 0, padding: 12 }, content: [{ type: 'paragraph' }] },
  ],
};

function normalizeContent(raw: string): string {
  if (!raw || raw === '<p></p>') return '';
  return isHtmlBody(raw) ? raw : legacyMarkdownToHtml(raw);
}

function isEmpty(raw: string): boolean {
  return !raw || raw === '<p></p>' || raw.trim() === '';
}

// ─── Section style modal ────────────────────────────────────────────────────

interface SectionModal { pos: number; attrs: SectionAttrs; }

function SectionStyleModal({ modal, onUpdate, onClose }: {
  modal: SectionModal;
  onUpdate: (attrs: Partial<SectionAttrs>) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState<SectionAttrs>({ ...modal.attrs });
  const set = (patch: Partial<SectionAttrs>) => {
    const next = { ...local, ...patch };
    setLocal(next);
    onUpdate(next);
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute left-3 top-10 z-50 w-64 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#222] shadow-xl p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Section style</span>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none">×</button>
        </div>
        <div>
          <label className="text-[11px] text-gray-500 dark:text-gray-400 block mb-0.5">Label</label>
          <input type="text" value={local.label} onChange={e => set({ label: e.target.value })}
            className="w-full text-sm px-2 py-1 rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white outline-none focus:border-[#FFCE0A]" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-gray-500 dark:text-gray-400 w-20 shrink-0">Background</label>
          <input type="color" value={local.bgColor || '#ffffff'} onChange={e => set({ bgColor: e.target.value })}
            className="w-7 h-7 rounded cursor-pointer border border-gray-200 dark:border-white/10 p-0.5" />
          <button type="button" onClick={() => set({ bgColor: '' })} className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Clear</button>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-gray-500 dark:text-gray-400 w-20 shrink-0">Border</label>
            <input type="number" min={0} max={8} value={local.borderWidth}
              onChange={e => set({ borderWidth: Math.max(0, parseInt(e.target.value, 10) || 0) })}
              className="w-14 text-sm px-2 py-1 rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white outline-none focus:border-[#FFCE0A]" />
            <span className="text-[11px] text-gray-400">px</span>
            {local.borderWidth > 0 && (
              <input type="color" value={local.borderColor || '#e5e7eb'} onChange={e => set({ borderColor: e.target.value })}
                className="w-7 h-7 rounded cursor-pointer border border-gray-200 dark:border-white/10 p-0.5" />
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-gray-500 dark:text-gray-400 w-20 shrink-0">Padding</label>
          <input type="range" min={0} max={48} value={local.padding} onChange={e => set({ padding: parseInt(e.target.value, 10) })} className="flex-1" />
          <span className="text-[11px] text-gray-400 w-8 text-right">{local.padding}px</span>
        </div>
      </div>
    </>
  );
}

// ─── Image size modal ───────────────────────────────────────────────────────

interface ImageModal {
  pos: number;
  src: string;
  width: string;
  height: string;
  viewportX: number;
  viewportY: number;
}

function ImageSizeModal({ modal, onApply, onClose }: {
  modal: ImageModal;
  onApply: (width: string, height: string) => void;
  onClose: () => void;
}) {
  const [w, setW] = useState(modal.width || '');
  const [h, setH] = useState(modal.height || '');
  const [lock, setLock] = useState(true);
  const [ratio, setRatio] = useState<number | null>(null);

  useEffect(() => {
    if (!modal.src) return;
    const img = new window.Image();
    img.onload = () => {
      const r = img.naturalWidth / img.naturalHeight;
      setRatio(r);
      if (!modal.width && !modal.height) {
        setW(String(img.naturalWidth));
        setH(String(img.naturalHeight));
      }
    };
    img.src = modal.src;
  }, [modal.src]);

  const onWChange = (val: string) => {
    setW(val);
    if (lock && ratio && val) setH(String(Math.round(parseInt(val, 10) / ratio)));
  };
  const onHChange = (val: string) => {
    setH(val);
    if (lock && ratio && val) setW(String(Math.round(parseInt(val, 10) * ratio)));
  };

  // position the panel just below+left of where the image is, clamped to viewport
  const panelW = 220;
  const left = Math.min(modal.viewportX, window.innerWidth - panelW - 12);
  const top = modal.viewportY + 8;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 w-[220px] rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#222] shadow-xl p-3 space-y-2.5"
        style={{ top, left }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Image size</span>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none">×</button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="text-[11px] text-gray-500 dark:text-gray-400 block mb-0.5">Width (px)</label>
            <input
              type="number" min={10} value={w} onChange={e => onWChange(e.target.value)}
              className="w-full text-sm px-2 py-1 rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white outline-none focus:border-[#FFCE0A]"
            />
          </div>
          <div className="pt-4">
            <button
              type="button"
              title={lock ? 'Unlock ratio' : 'Lock ratio'}
              onClick={() => setLock(v => !v)}
              className={`w-7 h-7 flex items-center justify-center rounded-md border text-xs transition-colors ${
                lock
                  ? 'border-[#FFCE0A] bg-[#FFCE0A]/10 text-[#92700a] dark:text-[#FFCE0A]'
                  : 'border-gray-200 dark:border-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              {lock ? '🔒' : '🔓'}
            </button>
          </div>
          <div className="flex-1">
            <label className="text-[11px] text-gray-500 dark:text-gray-400 block mb-0.5">Height (px)</label>
            <input
              type="number" min={10} value={h} onChange={e => onHChange(e.target.value)}
              className="w-full text-sm px-2 py-1 rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white outline-none focus:border-[#FFCE0A]"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => { onApply(w, h); onClose(); }}
            className="flex-1 text-sm py-1.5 rounded-md font-semibold"
            style={{ background: '#FFCE0A', color: '#342e37' }}
          >
            Apply
          </button>
          <button type="button" onClick={onClose} className="flex-1 text-sm py-1.5 rounded-md border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main editor component ──────────────────────────────────────────────────

export function RichTextEditor({ content, onChange, mergeTagOptions, placeholder, disabled, withSections }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [sectionModal, setSectionModal] = useState<SectionModal | null>(null);
  const [imageModal, setImageModal] = useState<ImageModal | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2] }, codeBlock: false, code: false }),
      UnderlineExt,
      LinkExt.configure({
        openOnClick: false,
        HTMLAttributes: { style: 'color:#1d4ed8;text-decoration:underline', target: '_blank', rel: 'noopener noreferrer' },
      }),
      TextAlignExt.configure({ types: ['heading', 'paragraph'] }),
      PlaceholderExt.configure({ placeholder: placeholder ?? 'Write your message…' }),
      ImageExt.configure({
        allowBase64: true,
        inline: false,
        resize: { enabled: true, minWidth: 20, alwaysPreserveAspectRatio: false },
      }),
      TextStyle,
      FontFamily,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      MergeTagNode,
      SectionNode,
    ],
    content: withSections && isEmpty(content) ? SECTIONS_SEED : normalizeContent(content),
    editable: !disabled,
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML();
      onChange(html === '<p></p>' ? '' : html);
    },
    editorProps: {
      handlePaste(_view, event) {
        const html = event.clipboardData?.getData('text/html');
        if (!html) return false;
        const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR, FORBID_TAGS: ['script', 'style'] });
        if (!clean.trim()) return false;
        const dt = new DataTransfer();
        dt.setData('text/html', clean);
        _view.dom.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt }));
        return true;
      },
    },
  });

  // Sync external content changes
  useEffect(() => {
    if (!editor) return;
    if (withSections && isEmpty(content)) {
      if (editor.state.doc.firstChild?.type.name !== 'section') {
        editor.commands.setContent(SECTIONS_SEED as any, false);
      }
      return;
    }
    const normalized = normalizeContent(content);
    const current = editor.getHTML();
    if (normalized !== current && normalized !== (current === '<p></p>' ? '' : current)) {
      editor.commands.setContent(normalized, false);
    }
  }, [content, editor]);

  // Section click → style modal
  useEffect(() => {
    if (!editor) return;
    const onSectionClick = (e: Event) => {
      const { pos, attrs } = (e as CustomEvent).detail;
      setSectionModal({ pos, attrs: { ...attrs } });
      setImageModal(null);
    };
    editor.view.dom.addEventListener('lb:section-click', onSectionClick);
    return () => editor.view.dom.removeEventListener('lb:section-click', onSectionClick);
  }, [editor]);

  // Image NodeSelection → size modal
  useEffect(() => {
    if (!editor) return;
    const onSelection = () => {
      const sel = editor.state.selection;
      if (sel instanceof NodeSelection && sel.node.type.name === 'image') {
        const { width, height, src } = sel.node.attrs;
        // Get viewport coords of the image bottom-left
        const coords = editor.view.coordsAtPos(sel.from + 1);
        setImageModal({
          pos: sel.from,
          src: src ?? '',
          width: width ? String(width) : '',
          height: height ? String(height) : '',
          viewportX: coords.left,
          viewportY: coords.bottom,
        });
        setSectionModal(null);
      } else {
        setImageModal(null);
      }
    };
    editor.on('selectionUpdate', onSelection);
    return () => { editor.off('selectionUpdate', onSelection); };
  }, [editor]);

  const handleImageFile = (file: File) => {
    if (!editor) return;
    if (file.size > 3 * 1024 * 1024) { alert('Image must be under 3 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => editor.chain().focus().setImage({ src: reader.result as string }).run();
    reader.readAsDataURL(file);
  };

  const handleSectionUpdate = (attrs: Partial<SectionAttrs>) => {
    if (!sectionModal || !editor) return;
    editor.chain().focus().updateSectionAttrs(sectionModal.pos, attrs).run();
    setSectionModal(prev => prev ? { ...prev, attrs: { ...prev.attrs, ...attrs } } : null);
  };

  const handleImageApply = (w: string, h: string) => {
    if (!imageModal || !editor) return;
    editor.chain().focus().updateAttributes('image', {
      width: w ? Number(w) : null,
      height: h ? Number(h) : null,
    }).run();
  };

  if (!editor) return null;

  return (
    <div ref={wrapperRef} className="lb-editor relative rounded-xl border border-gray-200 dark:border-white/10 overflow-visible bg-white dark:bg-[#1a1a1a] focus-within:border-[#FFCE0A] transition-colors">
      <input
        ref={fileInputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = ''; }}
      />
      <div className="rounded-xl overflow-hidden">
        <EditorToolbar editor={editor} mergeTagOptions={mergeTagOptions} onImageClick={() => fileInputRef.current?.click()} />
        <EditorContent editor={editor} />
      </div>

      {/* Section style modal */}
      {sectionModal && (
        <SectionStyleModal
          modal={sectionModal}
          onUpdate={handleSectionUpdate}
          onClose={() => setSectionModal(null)}
        />
      )}

      {/* Image size modal — fixed to viewport so it can escape overflow */}
      {imageModal && (
        <ImageSizeModal
          modal={imageModal}
          onApply={handleImageApply}
          onClose={() => setImageModal(null)}
        />
      )}
    </div>
  );
}
