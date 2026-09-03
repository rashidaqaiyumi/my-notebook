import { Link } from "@tanstack/react-router";
import { Bookmark, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { cn } from "@/lib/utils";
import { noteTitle, preview, type Note } from "@/lib/notes";

export function NoteCard({
  note,
  variant = "grid",
  index = 0,
}: {
  note: Note;
  variant?: "grid" | "list";
  index?: number;
}) {
  return (
    <Link
      to="/notes/$noteId"
      params={{ noteId: note.id }}
      style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
      className={cn(
        "group relative block overflow-hidden rounded-xl page-surface paper-grain rise-in",
        "transition-all duration-300 hover:-translate-y-1 hover:shadow-lift",
        variant === "grid" ? "p-5" : "px-5 py-4",
      )}
    >
      {note.is_pinned && (
        <Bookmark className="absolute top-0 right-5 h-6 w-6 fill-primary/85 text-primary/85" />
      )}
      <div className={cn(variant === "list" && "flex items-center gap-4")}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 pr-8">
            <h3 className="truncate font-display text-base font-semibold">{noteTitle(note)}</h3>
            {note.is_favorite && (
              <Star className="h-3.5 w-3.5 shrink-0 fill-clay text-clay" />
            )}
          </div>
          <p
            className={cn(
              "mt-1.5 text-sm leading-relaxed text-muted-foreground",
              variant === "grid" ? "line-clamp-3" : "line-clamp-1",
            )}
          >
            {preview(note) || "Empty page — waiting for words."}
          </p>
        </div>
        <div
          className={cn(
            "flex flex-wrap items-center gap-2 text-xs text-muted-foreground",
            variant === "grid" ? "mt-4" : "shrink-0",
          )}
        >
          {note.category && (
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-accent-foreground">
              {note.category}
            </span>
          )}
          {note.tags.slice(0, 2).map((t) => (
            <span key={t} className="hand text-[0.95rem] text-muted-foreground">
              #{t}
            </span>
          ))}
          <span className="ml-auto whitespace-nowrap">
            {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
          </span>
        </div>
      </div>
    </Link>
  );
}
