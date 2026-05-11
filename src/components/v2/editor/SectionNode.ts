import { Node, mergeAttributes } from '@tiptap/core';

export type SectionAttrs = {
  label: string;
  bgColor: string;
  borderColor: string;
  borderWidth: number;
  padding: number;
};

const DEFAULT_ATTRS: SectionAttrs = {
  label: 'Section',
  bgColor: '',
  borderColor: '#e5e7eb',
  borderWidth: 0,
  padding: 12,
};

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    section: {
      updateSectionAttrs: (pos: number, attrs: Partial<SectionAttrs>) => ReturnType;
    };
  }
}

export const SectionNode = Node.create({
  name: 'section',
  group: 'block',
  content: 'block+',
  defining: false,

  addAttributes() {
    return {
      label: { default: DEFAULT_ATTRS.label },
      bgColor: { default: DEFAULT_ATTRS.bgColor },
      borderColor: { default: DEFAULT_ATTRS.borderColor },
      borderWidth: { default: DEFAULT_ATTRS.borderWidth },
      padding: { default: DEFAULT_ATTRS.padding },
    };
  },

  parseHTML() {
    return [{
      tag: 'div[data-section]',
      getAttrs: (el) => {
        const e = el as HTMLElement;
        return {
          label: e.getAttribute('data-section') || DEFAULT_ATTRS.label,
          bgColor: e.getAttribute('data-bg') || DEFAULT_ATTRS.bgColor,
          borderColor: e.getAttribute('data-border-color') || DEFAULT_ATTRS.borderColor,
          borderWidth: parseInt(e.getAttribute('data-border-width') || '0', 10),
          padding: parseInt(e.getAttribute('data-padding') || '12', 10),
        };
      },
    }];
  },

  renderHTML({ node }) {
    const { label, bgColor, borderColor, borderWidth, padding } = node.attrs as SectionAttrs;
    const styles: string[] = [`padding:${padding}px`];
    if (bgColor) styles.push(`background-color:${bgColor}`);
    if (borderWidth > 0) styles.push(`border:${borderWidth}px solid ${borderColor || '#e5e7eb'};border-radius:4px`);

    return ['div', mergeAttributes({
      'data-section': label,
      ...(bgColor ? { 'data-bg': bgColor } : {}),
      ...(borderWidth > 0 ? { 'data-border-color': borderColor, 'data-border-width': String(borderWidth) } : {}),
      'data-padding': String(padding),
      style: styles.join(';'),
    }), 0];
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      const attrs = node.attrs as SectionAttrs;

      const dom = document.createElement('div');
      dom.className = 'lb-section';
      applyDomStyles(dom, attrs);

      const badge = document.createElement('button');
      badge.type = 'button';
      badge.className = 'lb-section-badge';
      badge.textContent = attrs.label;
      badge.setAttribute('contenteditable', 'false');
      badge.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof getPos !== 'function') return;
        editor.view.dom.dispatchEvent(new CustomEvent('lb:section-click', {
          bubbles: true,
          detail: {
            pos: getPos(),
            attrs: { ...node.attrs },
            badgeRect: badge.getBoundingClientRect(),
          },
        }));
      });

      const contentDOM = document.createElement('div');
      contentDOM.className = 'lb-section-content';

      dom.appendChild(badge);
      dom.appendChild(contentDOM);

      return {
        dom,
        contentDOM,
        update: (updatedNode) => {
          if (updatedNode.type.name !== 'section') return false;
          const a = updatedNode.attrs as SectionAttrs;
          badge.textContent = a.label;
          applyDomStyles(dom, a);
          return true;
        },
      };
    };
  },

  addCommands() {
    return {
      updateSectionAttrs:
        (pos, attrs) =>
        ({ tr, state, dispatch }) => {
          const node = tr.doc.nodeAt(pos);
          if (!node || node.type.name !== 'section') return false;
          if (dispatch) {
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...attrs });
            dispatch(tr);
          }
          return true;
        },
    };
  },
});

function applyDomStyles(dom: HTMLElement, attrs: SectionAttrs) {
  dom.style.padding = `${attrs.padding}px`;
  dom.style.backgroundColor = attrs.bgColor || '';
  if (attrs.borderWidth > 0) {
    dom.style.border = `${attrs.borderWidth}px solid ${attrs.borderColor || '#e5e7eb'}`;
    dom.style.borderRadius = '6px';
  } else {
    dom.style.border = '';
    dom.style.borderRadius = '';
  }
}

export { DEFAULT_ATTRS as SECTION_DEFAULT_ATTRS };
