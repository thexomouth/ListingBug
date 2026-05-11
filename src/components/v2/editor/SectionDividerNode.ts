import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    sectionDivider: {
      insertSectionDivider: (attrs: { label: string }) => ReturnType;
    };
  }
}

export const SectionDividerNode = Node.create({
  name: 'sectionDivider',
  group: 'block',
  atom: true,
  draggable: false,
  selectable: true,

  addAttributes() {
    return {
      label: { default: 'Section' },
    };
  },

  parseHTML() {
    return [{
      tag: 'div[data-section-divider]',
      getAttrs: (element) => ({
        label: (element as HTMLElement).getAttribute('data-section-divider') || 'Section',
      }),
    }];
  },

  // In email HTML: invisible placeholder
  renderHTML({ node }) {
    return [
      'div',
      mergeAttributes({
        'data-section-divider': node.attrs.label,
        style: 'display:none;margin:0;padding:0;line-height:0;font-size:0',
      }),
    ];
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('div');
      dom.className = 'lb-section-divider-view';
      dom.setAttribute('contenteditable', 'false');

      const line1 = document.createElement('span');
      line1.className = 'lb-sd-line';

      const label = document.createElement('span');
      label.className = 'lb-sd-label';
      label.textContent = node.attrs.label;

      const line2 = document.createElement('span');
      line2.className = 'lb-sd-line';

      dom.appendChild(line1);
      dom.appendChild(label);
      dom.appendChild(line2);

      return {
        dom,
        update: (updatedNode) => {
          if (updatedNode.type.name !== 'sectionDivider') return false;
          label.textContent = updatedNode.attrs.label;
          return true;
        },
      };
    };
  },

  addCommands() {
    return {
      insertSectionDivider:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },
});
