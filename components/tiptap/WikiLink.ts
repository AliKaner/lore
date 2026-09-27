import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import Suggestion from "@tiptap/suggestion";
import { PluginKey } from "@tiptap/pm/state";
import { WikiLinkNodeView } from "./WikiLinkNodeView";

export interface WikiLinkDoc { id: string; title: string }

function positionPopup(popup: HTMLDivElement, rect?: (() => DOMRect | null) | null) {
  const r = typeof rect === "function" ? rect() : null;
  if (!r) return;
  popup.style.left = `${r.left + window.scrollX}px`;
  popup.style.top = `${r.bottom + window.scrollY + 6}px`;
}

export const WikiLink = Node.create<{
  onNavigate: (id: string) => void;
  getDocuments: () => WikiLinkDoc[];
}>({
  name: "wikiLink",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addOptions() {
    return { onNavigate: () => {}, getDocuments: () => [] };
  },

  addAttributes() {
    return {
      id: { default: null, parseHTML: (el) => el.getAttribute("data-id"), renderHTML: (attrs) => ({ "data-id": attrs.id }) },
      label: { default: "", parseHTML: (el) => el.getAttribute("data-label"), renderHTML: (attrs) => ({ "data-label": attrs.label }) },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="wiki-link"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { "data-type": "wiki-link" }), HTMLAttributes.label ?? ""];
  },

  addNodeView() {
    return ReactNodeViewRenderer(WikiLinkNodeView);
  },

  addProseMirrorPlugins() {
    const options = this.options;
    return [
      Suggestion({
        editor: this.editor,
        char: "[[",
        pluginKey: new PluginKey("wikiLinkSuggestion"),
        items: ({ query }) => {
          const q = query.toLocaleLowerCase("tr");
          return options.getDocuments().filter((d) => d.title.toLocaleLowerCase("tr").includes(q)).slice(0, 8);
        },
        command: ({ editor, range, props }) => {
          const item = props as WikiLinkDoc;
          editor.chain().focus().insertContentAt(range, [
            { type: "wikiLink", attrs: { id: item.id, label: item.title } },
            { type: "text", text: " " },
          ]).run();
        },
        render: () => {
          let popup: HTMLDivElement | null = null;
          let selectedIndex = 0;
          let currentItems: WikiLinkDoc[] = [];
          let currentCommand: ((item: WikiLinkDoc) => void) | null = null;

          const renderItems = () => {
            if (!popup) return;
            popup.innerHTML = "";
            if (currentItems.length === 0) {
              const empty = document.createElement("div");
              empty.className = "wiki-suggest-empty";
              empty.textContent = "Eşleşen yazı yok";
              popup.appendChild(empty);
              return;
            }
            currentItems.forEach((item, i) => {
              const el = document.createElement("button");
              el.type = "button";
              el.className = "wiki-suggest-item" + (i === selectedIndex ? " active" : "");
              el.textContent = item.title;
              el.onmousedown = (e) => { e.preventDefault(); currentCommand?.(item); };
              popup!.appendChild(el);
            });
          };

          return {
            onStart: (props) => {
              currentItems = props.items as WikiLinkDoc[];
              currentCommand = props.command as (item: WikiLinkDoc) => void;
              selectedIndex = 0;
              popup = document.createElement("div");
              popup.className = "wiki-suggest-popup";
              document.body.appendChild(popup);
              renderItems();
              positionPopup(popup, props.clientRect);
            },
            onUpdate: (props) => {
              currentItems = props.items as WikiLinkDoc[];
              currentCommand = props.command as (item: WikiLinkDoc) => void;
              renderItems();
              if (popup) positionPopup(popup, props.clientRect);
            },
            onKeyDown: (props) => {
              if (props.event.key === "Escape") { popup?.remove(); popup = null; return true; }
              if (props.event.key === "ArrowDown") { selectedIndex = (selectedIndex + 1) % Math.max(1, currentItems.length); renderItems(); return true; }
              if (props.event.key === "ArrowUp") { selectedIndex = (selectedIndex - 1 + currentItems.length) % Math.max(1, currentItems.length); renderItems(); return true; }
              if (props.event.key === "Enter") { if (currentItems[selectedIndex]) currentCommand?.(currentItems[selectedIndex]); return true; }
              return false;
            },
            onExit: () => { popup?.remove(); popup = null; },
          };
        },
      }),
    ];
  },
});
