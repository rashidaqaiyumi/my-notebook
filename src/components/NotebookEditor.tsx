import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Code2,
  Heading2,
  Heading3,
  Highlighter,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Quote,
  Strikethrough,
  Underline as UnderlineIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { looksStructured, plainTextToHtml } from "@/lib/paste";

const HIGHLIGHTS = [
  { name: "yellow", varName: "--hl-yellow" },
  { name: "green", varName: "--hl-green" },
  { name: "blue", varName: "--hl-blue" },
  { name: "pink", varName: "--hl-pink" },
] as const;

function ToolButton({
  active,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-all duration-200",
        "hover:bg-accent hover:text-accent-foreground active:scale-95",
        active && "bg-accent text-accent-foreground",
      )}
    >
      {children}
    </button>
  );
}

function HighlightPicker({ editor }: { editor: Editor }) {
  return (
    <div className="flex items-center gap-1 rounded-md px-1">
      <Highlighter className="h-3.5 w-3.5 text-muted-foreground" />
      {HIGHLIGHTS.map((h) => (
        <button
          key={h.name}
          type="button"
          title={`Highlight ${h.name}`}
          aria-label={`Highlight ${h.name}`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() =>
            editor.chain().focus().toggleHighlight({ color: `var(${h.varName})` }).run()
          }
          className="h-4 w-4 rounded-full border border-border transition-transform duration-200 hover:scale-115"
          style={{ backgroundColor: `var(${h.varName})` }}
        />
      ))}
    </div>
  );
}

function SelectionToolbar({ editor }: { editor: Editor }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const update = () => {
      const { state, view } = editor;
      const { from, to, empty } = state.selection;
      if (empty || !editor.isFocused) {
        setPos(null);
        return;
      }
      const start = view.coordsAtPos(from);
      const end = view.coordsAtPos(to);
      const parent = wrapRef.current?.offsetParent as HTMLElement | null;
      const box = parent?.getBoundingClientRect();
      setPos({
        top: start.top - (box?.top ?? 0) - 48,
        left: (start.left + end.left) / 2 - (box?.left ?? 0),
      });
    };
    editor.on("selectionUpdate", update);
    editor.on("blur", () => setTimeout(() => setPos(null), 120));
    return () => {
      editor.off("selectionUpdate", update);
    };
  }, [editor]);

  return (
    <div
      ref={wrapRef}
      className={cn(
        "pointer-events-none absolute z-30 -translate-x-1/2 transition-all duration-200",
        pos ? "pointer-events-auto opacity-100" : "translate-y-1 opacity-0",
      )}
      style={pos ? { top: pos.top, left: pos.left } : { top: -9999, left: -9999 }}
    >
      <div className="flex items-center gap-0.5 rounded-xl border border-border bg-popover px-1.5 py-1 shadow-lift">
        <ToolButton
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          label="Code"
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code2 className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Link" onClick={() => promptLink(editor)}>
          <Link2 className="h-4 w-4" />
        </ToolButton>
        <span className="mx-1 h-5 w-px bg-border" />
        <HighlightPicker editor={editor} />
      </div>
    </div>
  );
}

function promptLink(editor: Editor) {
  const previous = editor.getAttributes("link")["href"] as string | undefined;
  const url = window.prompt("Link URL", previous ?? "https://");
  if (url === null) return;
  if (url.trim() === "") {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    return;
  }
  editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
}

export function NotebookEditor({
  content,
  onChange,
  onSaveShortcut,
}: {
  content: string;
  onChange: (html: string) => void;
  onSaveShortcut?: () => void;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
        },
        heading: { levels: [1, 2, 3] },
      }),
      Highlight.configure({ multicolor: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({
        placeholder: "Start writing, or paste anything you want to keep…",
      }),
    ],
    content,
    editorProps: {
      attributes: { class: "notebook-prose min-h-[52vh] pb-24" },
      handlePaste: (view, event) => {
        const text = event.clipboardData?.getData("text/plain") ?? "";
        const html = event.clipboardData?.getData("text/html") ?? "";
        if (html) return false; // keep rich structure from ChatGPT / docs / web
        if (!text || !looksStructured(text)) return false;
        event.preventDefault();
        editorRef.current?.chain().focus().insertContent(plainTextToHtml(text)).run();
        return true;
      },
      handleKeyDown: (_view, event) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
          event.preventDefault();
          onSaveShortcut?.();
          return true;
        }
        return false;
      },
      handleClickOn: (_view, _pos, _node, _npos, event) => {
        const target = (event.target as HTMLElement)?.closest("a");
        if (target && (event.metaKey || event.ctrlKey)) {
          window.open(target.getAttribute("href") ?? "", "_blank", "noopener");
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
  });

  const editorRef = useRef<Editor | null>(null);
  editorRef.current = editor ?? null;

  // Load a different note into the same editor instance.
  const loadedRef = useRef(content);
  useEffect(() => {
    if (!editor) return;
    if (content !== loadedRef.current && content !== editor.getHTML()) {
      loadedRef.current = content;
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  if (!editor) {
    return <div className="notebook-prose min-h-[52vh] animate-pulse text-muted-foreground" />;
  }

  return (
    <div className="relative">
      <div className="sticky top-0 z-20 -mx-1 mb-5 flex flex-wrap items-center gap-0.5 rounded-lg border border-border/70 bg-paper/90 px-1.5 py-1 backdrop-blur-sm">
        <ToolButton
          label="Heading"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          label="Subheading"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="h-4 w-4" />
        </ToolButton>
        <span className="mx-1 h-5 w-px bg-border" />
        <ToolButton
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          label="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          label="Strikethrough"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </ToolButton>
        <span className="mx-1 h-5 w-px bg-border" />
        <ToolButton
          label="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          label="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          label="Checklist"
          active={editor.isActive("taskList")}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          <ListChecks className="h-4 w-4" />
        </ToolButton>
        <span className="mx-1 h-5 w-px bg-border" />
        <ToolButton
          label="Quote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          label="Code block"
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code2 className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          label="Divider"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          label="Link"
          active={editor.isActive("link")}
          onClick={() => promptLink(editor)}
        >
          <Link2 className="h-4 w-4" />
        </ToolButton>
        <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
        <div className="hidden sm:block">
          <HighlightPicker editor={editor} />
        </div>
      </div>

      <SelectionToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
