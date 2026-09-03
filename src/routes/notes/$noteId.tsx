import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Bookmark, Check, Link2, Loader2, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { useCategories, useNotes } from "@/components/AppShell";
import { NotebookEditor } from "@/components/NotebookEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { deleteNote, notesKey, updateNote, type Note } from "@/lib/notes";

export const Route = createFileRoute("/notes/$noteId")({
  head: () => ({
    meta: [
      { title: "Reading a page — My Notebook" },
      {
        name: "description",
        content: "Write, highlight and check off items on this notebook page. Saves as you type.",
      },
      { property: "og:title", content: "Reading a page — My Notebook" },
      { property: "og:description", content: "A quiet page in your personal notebook." },
    ],
  }),
  component: NotePage,
});

type SaveState = "idle" | "saving" | "saved";

function NotePage() {
  const { noteId } = Route.useParams();
  const { data: notes, isLoading } = useNotes();
  const { data: categories = [] } = useCategories();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const note = useMemo(() => notes?.find((n) => n.id === noteId), [notes, noteId]);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [save, setSave] = useState<SaveState>("idle");
  const hydrated = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!note || hydrated.current === note.id) return;
    hydrated.current = note.id;
    setTitle(note.title);
    setContent(note.content);
    void updateNote(note.id, { opened_at: new Date().toISOString() }).catch(() => {});
    if (!note.title && !note.content) titleRef.current?.focus();
  }, [note]);

  const persist = useCallback(
    async (patch: Partial<Note>) => {
      if (!note) return;
      setSave("saving");
      try {
        const updated = await updateNote(note.id, patch);
        qc.setQueryData<Note[]>(notesKey, (prev) =>
          (prev ?? []).map((n) => (n.id === updated.id ? updated : n)),
        );
        setSave("saved");
      } catch {
        setSave("idle");
        toast.error("Could not save this page. Check your connection.");
      }
    },
    [note, qc],
  );

  const queueSave = useCallback(
    (patch: Partial<Note>) => {
      setSave("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void persist(patch), 800);
    },
    [persist],
  );

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  useEffect(() => {
    if (save !== "saved") return;
    const t = setTimeout(() => setSave("idle"), 2400);
    return () => clearTimeout(t);
  }, [save]);

  const saveNow = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    void persist({ title, content });
  }, [persist, title, content]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveNow();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saveNow]);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 md:px-8">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="mt-6 h-80 w-full rounded-2xl" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="font-display text-xl">This page isn't in your notebook.</h1>
        <Button className="mt-6" variant="secondary" onClick={() => navigate({ to: "/notes", search: { view: "all" } })}>
          Back to all notes
        </Button>
      </div>
    );
  }

  const addTag = (value: string) => {
    const tag = value.trim().replace(/^#/, "");
    if (!tag || note.tags.includes(tag)) return;
    void persist({ tags: [...note.tags, tag] });
    setTagInput("");
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-3 py-6 md:px-8 md:py-10">
      <div className="mb-4 flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
          onClick={() => navigate({ to: "/notes", search: { view: "all" } })}
        >
          <ArrowLeft className="h-4 w-4" /> Notebook
        </Button>

        <span
          className={cn(
            "ml-auto flex items-center gap-1.5 text-xs text-muted-foreground transition-opacity duration-300",
            save === "idle" && "opacity-0",
          )}
        >
          {save === "saving" ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" /> Saving…
            </>
          ) : (
            <>
              <Check className="h-3 w-3 text-primary" /> Saved
            </>
          )}
        </span>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Pin note"
          onClick={() => void persist({ is_pinned: !note.is_pinned })}
        >
          <Bookmark
            className={cn("h-4 w-4", note.is_pinned && "fill-primary text-primary")}
          />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Favorite note"
          onClick={() => void persist({ is_favorite: !note.is_favorite })}
        >
          <Star className={cn("h-4 w-4", note.is_favorite && "fill-clay text-clay")} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Mark links as important"
          onClick={() => void persist({ has_important_links: !note.has_important_links })}
        >
          <Link2
            className={cn("h-4 w-4", note.has_important_links && "text-primary")}
          />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Delete note">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tear out this page?</AlertDialogTitle>
              <AlertDialogDescription>
                This note will be permanently removed from your notebook.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep it</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  await deleteNote(note.id);
                  qc.invalidateQueries({ queryKey: notesKey });
                  navigate({ to: "/notes", search: { view: "all" } });
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <article className="page-open overflow-hidden rounded-2xl page-surface paper-grain">
        <div className="px-5 py-7 md:px-12 md:py-10">
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              queueSave({ title: e.target.value, content });
            }}
            placeholder="Title…"
            className="w-full bg-transparent font-display text-2xl leading-tight font-semibold outline-none placeholder:text-muted-foreground/60 md:text-3xl"
          />

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Select
              value={note.category ?? "none"}
              onValueChange={(v) => void persist({ category: v === "none" ? null : v })}
            >
              <SelectTrigger className="h-8 w-auto gap-1.5 rounded-full border-border bg-accent/60 px-3 text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No category</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {note.tags.map((t) => (
              <span
                key={t}
                className="group inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
              >
                #{t}
                <button
                  type="button"
                  aria-label={`Remove tag ${t}`}
                  onClick={() => void persist({ tags: note.tags.filter((x) => x !== t) })}
                  className="opacity-50 transition-opacity hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}

            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag(tagInput);
                }
              }}
              onBlur={() => tagInput && addTag(tagInput)}
              placeholder="Add tag…"
              className="h-8 w-24 rounded-full border-dashed bg-transparent px-3 text-xs"
            />

            <span className="ml-auto text-xs text-muted-foreground">
              Edited {format(new Date(note.updated_at), "d MMM, HH:mm")}
            </span>
          </div>

          <div className="my-6 h-px bg-paper-edge" />

          <NotebookEditor
            content={note.content}
            onChange={(html) => {
              setContent(html);
              queueSave({ title, content: html });
            }}
            onSaveShortcut={saveNow}
          />
        </div>
      </article>
    </div>
  );
}
