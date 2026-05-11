import { useState } from 'react';
import { type Editor } from '@tiptap/react';
import {
  Bold, Italic, Underline, Strikethrough,
  Heading1, Heading2,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Quote, Minus,
  Link, Link2Off, ChevronDown, Image, LayoutGrid, Type, Braces,
} from 'lucide-react';
import { SECTION_DEFAULT_ATTRS } from './SectionNode';

export interface MergeTagOption {
  label: string;
  variable: string;
}

interface Props {
  editor: Editor;
  mergeTagOptions: MergeTagOption[];
  onImageClick?: () => void;
}

const BTN = 'w-8 h-8 inline-flex items-center justify-center rounded-md transition-colors shrink-0';
const BTN_INACTIVE = 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white';
const BTN_ACTIVE = 'bg-[#FFCE0A]/20 text-[#92700a] dark:text-[#FFCE0A]';
const SEP = 'w-px h-4 bg-gray-200 dark:bg-white/15 mx-0.5 shrink-0 self-center';

const FONTS = [
  { label: 'Default', value: '' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: "Courier New", value: "'Courier New', monospace" },
  { label: 'Trebuchet MS', value: "'Trebuchet MS', sans-serif" },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
];

function ToolBtn({ onClick, active, title, children }: {
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

function hasSections(editor: Editor): boolean {
  return editor.state.doc.firstChild?.type.name === 'section';
}

function countBodySections(editor: Editor): number {
  let count = 0;
  editor.state.doc.descendants((node: any) => {
    if (node.type.name === 'section') {
      const lbl: string = node.attrs?.label ?? '';
      if (lbl === 'Body' || /^Body \d+$/.test(lbl)) count++;
    }
  });
  return count;
}

export function EditorToolbar({ editor, mergeTagOptions, onImageClick }: Props) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [varOpen, setVarOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [fontOpen, setFontOpen] = useState(false);

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

  const setFont = (fontValue: string) => {
    if (!fontValue) editor.chain().focus().unsetFontFamily().run();
    else editor.chain().focus().setFontFamily(fontValue).run();
    setFontOpen(false);
  };

  const insertColumnBlock = (cols: 1 | 2 | 3) => {
    const bodyCount = countBodySections(editor);
    const usingSections = hasSections(editor);
    const nextLabel = `Body ${bodyCount + 1}`;

    editor.chain().command(({ tr, state }) => {
      const { schema } = state;
      let innerContent;
      if (cols === 1) {
        innerContent = schema.nodes.paragraph.create();
      } else {
        const cells = Array.from({ length: cols }, () =>
          schema.nodes.tableCell.createAndFill({}, schema.nodes.paragraph.create())!
        );
        innerContent = schema.nodes.table.create({}, schema.nodes.tableRow.create({}, cells));
      }
      if (usingSections && schema.nodes.section) {
        const sec = schema.nodes.section.createAndFill(
          { ...SECTION_DEFAULT_ATTRS, label: nextLabel },
          innerContent,
        );
        if (sec) tr.insert(state.doc.content.size, sec);
      } else {
        tr.replaceSelectionWith(innerContent);
      }
      return true;
    }).run();

    setBlockOpen(false);
  };

  const currentFont = FONTS.find(f => f.value && editor.isActive('textStyle', { fontFamily: f.value }));

  return (
    <div className="border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
      {/*
        Single wrappable toolbar row.
        Priority order (left → right) so the most-used tools appear first
        and land on the first visual line before wrapping:
          B I U S  |  H1 H2 Font  |  Align  |  Lists Quote HR  |  Link Image Blocks  |  Variables
      */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 flex-wrap">

        {/* ── Group 1: inline formatting (highest priority) ── */}
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

        {/* ── Group 2: headings + font ── */}
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
          <Heading1 className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
          <Heading2 className="w-3.5 h-3.5" />
        </ToolBtn>

        {/* Font picker — compact on mobile (icon only), expanded on sm+ */}
        <div className="relative shrink-0">
          <button
            type="button"
            title="Font family"
            onMouseDown={e => e.preventDefault()}
            onClick={() => setFontOpen(v => !v)}
            className={`inline-flex items-center gap-1 h-8 rounded-md px-1.5 text-xs font-medium transition-colors shrink-0 ${fontOpen ? BTN_ACTIVE : BTN_INACTIVE}`}
          >
            <Type className="w-3.5 h-3.5 shrink-0" />
            {/* Label hidden on xs, shown on sm+ */}
            <span className="hidden sm:inline max-w-[52px] truncate">
              {currentFont?.label ?? 'Default'}
            </span>
            <ChevronDown className="w-3 h-3 opacity-60 hidden sm:block" />
          </button>
          {fontOpen && (
            <>
              <div className="fixed inset-0 z-40" onMouseDown={() => setFontOpen(false)} />
              <div className="absolute left-0 top-full mt-1 z-50 w-48 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2a2a2a] shadow-xl overflow-hidden">
                {FONTS.map(f => (
                  <button
                    key={f.value}
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => setFont(f.value)}
                    style={{ fontFamily: f.value || undefined }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${
                      (currentFont?.value ?? '') === f.value
                        ? 'text-[#92700a] dark:text-[#FFCE0A] font-semibold'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <span className={SEP} />

        {/* ── Group 3: alignment ── */}
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

        {/* ── Group 4: lists / block formatting ── */}
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

        {/* ── Group 5: insert ── */}
        {editor.isActive('link') ? (
          <ToolBtn onClick={() => editor.chain().focus().unsetLink().run()} active title="Remove link">
            <Link2Off className="w-3.5 h-3.5" />
          </ToolBtn>
        ) : (
          <ToolBtn onClick={() => { setLinkUrl(editor.getAttributes('link').href ?? ''); setLinkOpen(v => !v); }} title="Insert link">
            <Link className="w-3.5 h-3.5" />
          </ToolBtn>
        )}

        {onImageClick && (
          <ToolBtn onClick={onImageClick} title="Insert image">
            <Image className="w-3.5 h-3.5" />
          </ToolBtn>
        )}

        {/* Column block dropdown */}
        <div className="relative shrink-0">
          <button
            type="button"
            title="Insert content block"
            onMouseDown={e => e.preventDefault()}
            onClick={() => setBlockOpen(v => !v)}
            className={`${BTN} ${blockOpen ? BTN_ACTIVE : BTN_INACTIVE}`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          {blockOpen && (
            <>
              <div className="fixed inset-0 z-40" onMouseDown={() => setBlockOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 w-52 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2a2a2a] shadow-xl overflow-hidden">
                <div className="px-3 pt-2.5 pb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Insert block</span>
                </div>
                {([
                  { cols: 1 as const, label: '1 column', desc: 'Full-width block' },
                  { cols: 2 as const, label: '2 columns', desc: 'Split layout' },
                  { cols: 3 as const, label: '3 columns', desc: 'Three-column layout' },
                ] as const).map(({ cols, label, desc }) => (
                  <button
                    key={cols}
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => insertColumnBlock(cols)}
                    className="w-full text-left px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center gap-3"
                  >
                    <div className="flex gap-0.5 shrink-0">
                      {Array.from({ length: cols }).map((_, i) => (
                        <div key={i} className="h-7 rounded bg-gray-200 dark:bg-white/15"
                          style={{ width: cols === 1 ? 32 : cols === 2 ? 14 : 9 }} />
                      ))}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{label}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">{desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <span className={SEP} />

        {/* ── Group 6: variables dropdown (replaces the inline chip row) ── */}
        <div className="relative shrink-0">
          <button
            type="button"
            onMouseDown={e => e.preventDefault()}
            onClick={() => setVarOpen(v => !v)}
            title="Insert variable"
            className={`inline-flex items-center gap-1 h-8 px-2 rounded-md text-xs font-medium transition-colors ${varOpen ? BTN_ACTIVE : BTN_INACTIVE}`}
          >
            <Braces className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Variable</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>
          {varOpen && (
            <>
              <div className="fixed inset-0 z-40" onMouseDown={() => setVarOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 w-52 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2a2a2a] shadow-xl overflow-hidden">
                <div className="px-3 pt-2.5 pb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Insert variable</span>
                </div>
                {mergeTagOptions.map(opt => (
                  <button
                    key={opt.variable}
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => insertMergeTag(opt)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <span className="font-medium text-sm text-gray-900 dark:text-white block">{opt.label}</span>
                    <span className="text-xs font-mono text-blue-600 dark:text-blue-400">{opt.variable}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
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
          <button type="button" onClick={applyLink} className="text-sm px-3 py-1.5 rounded-md font-semibold shrink-0" style={{ background: '#FFCE0A', color: '#342e37' }}>
            {linkUrl.trim() ? 'Set link' : 'Remove'}
          </button>
          <button type="button" onClick={() => setLinkOpen(false)} className="text-sm px-2 py-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shrink-0">
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
