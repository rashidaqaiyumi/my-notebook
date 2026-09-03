import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { LayoutGrid, Rows3 } from "lucide-react";

import { useCreateNote, useNotes } from "@/components/AppShell";
import { NoteCard } from "@/components/NoteCard";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { preview } from "@/lib/notes";

type Search = {
  view: "all" | "recent" | "pinned" | "favorites";
  category?: string | undefined;
};

export const Route = createFileRoute("/notes/")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    view: (search["view"] as Search["view"]) ?? "all",
    category: typeof search["category"] === "string" ? (search["category"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "All notes — My Notebook" },
      {
        name: "description",
        content: "Browse, search and filter every page in your personal notebook.",
      },
      { property: "og:title", content: "All notes — My Notebook" },
      { property: "og:description", content: "Every page in your personal notebook." },
    ],
  }),
  component: Library,
});

const TITLES: Record<string, string> = {
  all: "All Notes",
  recent: "Recent",
  pinned: "Pinned",
  favorites: "Favorites",
};

function Library() {
  const { view, category } = Route.useSearch();
  const { data: notes, isLoading } = useNotes();
  const create = useCreateNote();
  const [query, setQuery] = useState("");
  const [layout, setLayout] = useState<"grid" | "list">("grid");

  const filtered = useMemo(() => {
    let list = notes ?? [];
    if (category) list = list.filter((n) => n.category === category);
    if (view === "pinned") list = list.filter((n) => n.is_pinned);
    if (view === "favorites") list = list.filter((n) => n.is_favorite);
    if (view === "recent") list = list.slice(0, 12);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q)) ||
          preview(n, 100000).toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned));
  }, [notes, view, category, query]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8 md:py-12">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl">{category ?? TITLES[view]}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "page" : "pages"}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter notes…"
            className="h-9 w-40 bg-card sm:w-56"
          />
          <div className="flex rounded-lg border border-border bg-card p-0.5">
            {(["grid", "list"] as const).map((l) => (
              <button
                key={l}
                type="button"
                aria-label={`${l} view`}
                onClick={() => setLayout(l)}
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors",
                  layout === l && "bg-accent text-accent-foreground",
                )}
              >
                {l === "grid" ? (
                  <LayoutGrid className="h-4 w-4" />
                ) : (
                  <Rows3 className="h-4 w-4" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={query ? "Nothing matches that." : "This shelf is empty."}
            description={
              query
                ? "Try a different word, or search the whole notebook with ⌘K."
                : "Notes you add here will appear in this view."
            }
            onCreate={query ? undefined : () => create.mutate()}
            actionLabel="Create a note"
          />
        ) : (
          <div
            className={cn(
              layout === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-3",
            )}
          >
            {filtered.map((n, i) => (
              <NoteCard key={n.id} note={n} index={i} variant={layout} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
