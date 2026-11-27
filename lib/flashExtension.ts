import { Extension } from "@tiptap/react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

// Marks stretches of text for a few seconds (words just changed by a bulk
// fix, say), so the writer sees at a glance what moved.

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    flashChanges: { flashRanges: (ranges: { from: number; to: number }[]) => ReturnType };
  }
}

export const flashKey = new PluginKey<DecorationSet>("flashChanges");
const FLASH_MS = 4500;

export const FlashChanges = Extension.create({
  name: "flashChanges",
  addCommands() {
    return {
      flashRanges:
        (ranges) =>
        ({ tr, dispatch, editor }) => {
          if (dispatch) {
            tr.setMeta(flashKey, ranges);
            window.setTimeout(() => {
              if (!editor.isDestroyed) editor.view.dispatch(editor.state.tr.setMeta(flashKey, []));
            }, FLASH_MS);
          }
          return true;
        },
    };
  },
  addProseMirrorPlugins() {
    return [
      new Plugin<DecorationSet>({
        key: flashKey,
        state: {
          init: () => DecorationSet.empty,
          apply: (tr, previous) => {
            const ranges = tr.getMeta(flashKey) as { from: number; to: number }[] | undefined;
            if (ranges) {
              return DecorationSet.create(
                tr.doc,
                ranges.filter((r) => r.to > r.from).map((r) => Decoration.inline(r.from, r.to, { class: "flash-change" })),
              );
            }
            return previous.map(tr.mapping, tr.doc);
          },
        },
        props: { decorations: (state) => flashKey.getState(state) ?? null },
      }),
    ];
  },
});
