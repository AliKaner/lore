"use client";

import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

function parseContent(content: string): JSONContent | string {
  if (content.trim().length === 0) return "";
  try {
    return JSON.parse(content) as JSONContent;
  } catch {
    return content;
  }
}

export function ChapterReader({ content }: { content: string }) {
  const editor = useEditor({
    editable: false,
    immediatelyRender: false,
    extensions: [StarterKit],
    content: parseContent(content),
  });
  return (
    <EditorContent
      editor={editor}
      className="leading-7 text-foreground [&_p]:mb-3 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:text-xl [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6"
    />
  );
}

export function ChapterEditor({
  content,
  onChange,
}: {
  content: string;
  onChange: (json: string) => void;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: parseContent(content),
    onUpdate: ({ editor }) => onChange(JSON.stringify(editor.getJSON())),
  });

  useEffect(() => {
    return () => editor?.destroy();
  }, [editor]);

  return (
    <div className="border border-border rounded">
      <EditorContent
        editor={editor}
        className="leading-7 text-foreground min-h-[300px] p-3 focus:outline-none [&_p]:mb-3 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:text-xl [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6"
      />
    </div>
  );
}
