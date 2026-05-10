"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import {
  Bold, Italic, Code, Link as LinkIcon, List, ListOrdered,
  Quote, Minus, Heading2, Heading3, Code2
} from "lucide-react";
import { cn } from "@/lib/utils";

const lowlight = createLowlight(common);

interface PostEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function PostEditor({ content, onChange, placeholder = "Write your post here…", minHeight = "160px" }: PostEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-[#00d4ff] underline" } }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: { class: "tiptap-content outline-none", style: `min-height: ${minHeight}` },
    },
  });

  if (!editor) return null;

  const tools: ToolbarButton[] = [
    { label: "Bold", icon: Bold, action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold") },
    { label: "Italic", icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic") },
    { label: "H2", icon: Heading2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }) },
    { label: "H3", icon: Heading3, action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive("heading", { level: 3 }) },
    { label: "Code", icon: Code, action: () => editor.chain().focus().toggleCode().run(), active: editor.isActive("code") },
    { label: "Code Block", icon: Code2, action: () => editor.chain().focus().toggleCodeBlock().run(), active: editor.isActive("codeBlock") },
    { label: "Quote", icon: Quote, action: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive("blockquote") },
    { label: "Bullet List", icon: List, action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList") },
    { label: "Ordered List", icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList") },
    { label: "Divider", icon: Minus, action: () => editor.chain().focus().setHorizontalRule().run(), active: false },
    {
      label: "Link",
      icon: LinkIcon,
      active: editor.isActive("link"),
      action: () => {
        const url = window.prompt("URL:");
        if (url) editor.chain().focus().setLink({ href: url }).run();
        else if (editor.isActive("link")) editor.chain().focus().unsetLink().run();
      },
    },
  ];

  return (
    <div className="rounded-lg border border-[#1e1e3a] overflow-hidden focus-within:border-[rgba(0,212,255,0.4)]">
      {/* Toolbar */}
      <div className="flex items-center flex-wrap gap-0.5 px-2 py-1.5 bg-[#0f0f1a] border-b border-[#1e1e3a]">
        {tools.map((tool) => (
          <button
            key={tool.label}
            type="button"
            title={tool.label}
            onClick={tool.action}
            className={cn(
              "p-1.5 rounded transition-colors",
              tool.active
                ? "bg-[#00d4ff]/20 text-[#00d4ff]"
                : "text-[#475569] hover:text-[#94a3b8] hover:bg-[#141428]"
            )}
          >
            <tool.icon className="w-3.5 h-3.5" />
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

type ToolbarButton = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  active: boolean;
};
