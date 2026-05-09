import { Node, mergeAttributes } from '@tiptap/core';

export interface MergeTagOptions {}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mergeTag: {
      insertMergeTag: (attrs: { label: string; variable: string }) => ReturnType;
    };
  }
}

export const MergeTagNode = Node.create<MergeTagOptions>({
  name: 'mergeTag',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      label: { default: '' },
      variable: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-merge-tag]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-merge-tag': HTMLAttributes.variable,
        class: 'merge-tag-chip',
        contenteditable: 'false',
      }),
      HTMLAttributes.label,
    ];
  },

  addCommands() {
    return {
      insertMergeTag:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs,
          }),
    };
  },
});
