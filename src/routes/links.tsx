import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, Link2 } from "lucide-react";

import { useCreateNote, useNotes } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { extractLinks, noteTitle } from "@/lib/notes";

export const Route = createFileRoute("/links")({
  head: () => ({
    meta: [
      { title: "Important links — My Notebook" },
      {
        name: "description",
        content: "Articles, docs and videos you saved inside your notes, gathered in one list.",
      },
      { property: "og:title", content: "Important links — My Notebook" },
      { property: "og:description", content: "Links saved inside your notebook pages." },
    ],
  }),
  component: Links,
});

function Links() {
  const { data: notes, isLoading } = useNotes();
  const create = useCreateNote();

  const marked = (notes ?? []).filter((n) => n.has_important_links);
  const source = marked.length ? marked : (notes ?? []);
  const groups = source
    .map((n) => ({ note: n, links: extractLinks(n.content) }))
    .filter((g) => g.links.length > 0);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-8 md:py-12">
      <div className="flex items-center gap-2">
        <Link2 className="h-5 w-5 text-primary" />
        <h1 className="font-display text-2xl md:text-3xl">Important Links</h1>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Mark a note with the link icon to keep only its links here.
      </p>

      <div className="mt-8 space-y-5">
        {isLoading && <Skeleton className="h-40 rounded-xl" />}
        {!isLoading && groups.length === 0 && (
          <EmptyState
            title="No links saved yet."
            description="Paste a link inside any note — it'll show up here, ready to open."
            onCreate={() => create.mutate()}
            actionLabel="Save a link"
          />
        )}
        {groups.map(({ note, links }, gi) => (
          <div
            key={note.id}
            style={{ animationDelay: `${Math.min(gi, 6) * 40}ms` }}
            className="overflow-hidden rounded-xl page-surface paper-grain rise-in"
          >
            <Link
              to="/notes/$noteId"
              params={{ noteId: note.id }}
              className="block border-b border-border/60 px-5 py-3 font-display text-sm font-semibold transition-colors hover:text-primary"
            >
              {noteTitle(note)}
            </Link>
            <ul className="px-2 py-2">
              {links.map((l, i) => (
                <li key={`${l.href}-${i}`}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent/50"
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-primary/80" />
                    <span className="truncate">{l.label}</span>
                    <span className="ml-auto hidden truncate text-xs text-muted-foreground sm:block">
                      {(() => {
                        try {
                          return new URL(l.href).hostname.replace("www.", "");
                        } catch {
                          return "";
                        }
                      })()}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
