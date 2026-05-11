import { useState } from 'react';
import { type Editor } from '@tiptap/react';
import {
  Bold, Italic, Underline, Strikethrough,
  Heading1, Heading2,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Quote, Minus,
  Link, Link2Off, ChevronDown,
} from 'lucide-react';

export interface MergeTagOption {
  label: string;
  variable: string;
}

interface Props {
  editor: Editor;
  mergeTagOptions: MergeTagOption[];
}

const BTN = 'w-8 h-8 inline-flex items-center justify-center rounded-md transition-colors';
const BTN_INACTIVE = 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white';
const BTN_ACTIVE = 'bg-[#FFCE0A]/20 text-[#92700a] dark:text-[#FFCE0A]';
const SEP = 'w-px h-4 bg-gray-200 dark:bg-white/15 mx-0.5 shrink-0';

function ToolBtn({
  onClick, active, title, children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={e => e.preventDefault()}
      onClick={onClick}
      className={`${BTN} ${active ? BTN_ACTIVE : BTN_INACTIVE}`}
    >
      {children}
    </button>
  );
}

export function EditorToolbar({ editor, mergeTagOptions }: Props) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [varOpen, setVarOpen] = useState(false);

  const applyLink = () => {
    const url = linkUrl.trim();
    if (url) editor.chain().focus().setLink({ href: url }).run();
    else editor.chain().focus().unsetLink().run();
    setLinkUrl('');
    setLinkOpen(false);
  };

  const insertMergeTag = (opt: MergeTagOption) => {
    editor.chain().focus().insertMergeTag({ label: opt.label, variable: opt.variable }).run();
    setVarOpen(false);
  };

  return (
    <div className="border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
      {/* Row 1 — formatting */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 flex-wrap">
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
          <Heading1 className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
          <Heading2 className="w-3.5 h-3.5" />
        </ToolBtn>
        <span className={SEP} />
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
          <Bold className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
          <Italic className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
          <Underline className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
          <Strikethrough className="w-3.5 h-3.5" />
        </ToolBtn>
        <span className={SEP} />
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left">
          <AlignLeft className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align center">
          <AlignCenter className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right">
          <AlignRight className="w-3.5 h-3.5" />
        </ToolBtn>
        <span className={SEP} />
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
          <List className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">
          <ListOrdered className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
          <Quote className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
          <Minus className="w-3.5 h-3.5" />
        </ToolBtn>
        <span className={SEP} />
        {/* Link button */}
        {editor.isActive('link') ? (
          <ToolBtn onClick={() => editor.chain().focus().unsetLink().run()} active title="Remove link">
            <Link2Off className="w-3.5 h-3.5" />
          </ToolBtn>
        ) : (
          <ToolBtn
            onClick={() => {
              setLinkUrl(editor.getAttributes('link').href ?? '');
              setLinkOpen(v => !v);
            }}
            title="Insert link"
          >
            <Link className="w-3.5 h-3.5" />
          </ToolBtn>
        )}
      </div>

      {/* Link popover */}
      {linkOpen && (
        <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a]">
          <input
            autoFocus
            type="url"
            placeholder="https://..."
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') applyLink(); if (e.key === 'Escape') setLinkOpen(false); }}
            className="flex-1 text-sm px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white outline-none focus:border-[#FFCE0A] min-w-0"
          />
          <button
            type="button"
            onClick={applyLink}
            className="text-sm px-3 py-1.5 rounded-md font-semibold"
            style={{ background: '#FFCE0A', color: '#342e37' }}
          >
            {linkUrl.trim() ? 'Set link' : 'Remove'}
          </button>
          <button
            type="button"
            onClick={() => setLinkOpen(false)}
            className="text-sm px-2 py-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Row 2 — merge tags */}
      <div className="flex flex-wrap items-center gap-1 px-3 py-1.5 border-t border-gray-200 dark:border-white/10">
        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide mr-0.5">Insert</span>
        {mergeTagOptions.map(opt => (
          <button
            key={opt.variable}
            type="button"
            onMouseDown={e => e.preventDefault()}
            onClick={() => insertMergeTag(opt)}
            className="px-2 py-0.5 rounded-md text-xs font-mono transition-opacity hover:opacity-80 bg-blue-50 text-blue-700 border border-transparent dark:bg-transparent dark:border-white/20 dark:text-gray-300"
          >
            {opt.variable}
          </button>
        ))}

        {/* Variable dropdown (mobile-friendly alternative) */}
        <div className="relative ml-auto">
          <button
            type="button"
            onMouseDown={e => e.preventDefault()}
            onClick={() => setVarOpen(v => !v)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            + variable <ChevronDown className="w-3 h-3" />
          </button>
          {varOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2a2a2a] shadow-lg overflow-hidden">
              {mergeTagOptions.map(opt => (
                <button
                  key={opt.variable}
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => insertMergeTag(opt)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <span className="font-medium text-gray-900 dark:text-white block">{opt.label}</span>
                  <span className="text-xs font-mono text-blue-600 dark:text-blue-400">{opt.variable}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
