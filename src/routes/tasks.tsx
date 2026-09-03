import { createFileRoute, Link } from "@tanstack/react-router";
import { ListChecks } from "lucide-react";

import { useCreateNote, useNotes } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { extractTasks, noteTitle } from "@/lib/notes";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Checklist — My Notebook" },
      {
        name: "description",
        content: "Every unfinished checklist item gathered from the pages of your notebook.",
      },
      { property: "og:title", content: "Checklist — My Notebook" },
      { property: "og:description", content: "Unfinished checklist items across your notes." },
    ],
  }),
  component: Tasks,
});

function Tasks() {
  const { data: notes, isLoading } = useNotes();
  const create = useCreateNote();

  const groups = (notes ?? [])
    .map((n) => ({ note: n, tasks: extractTasks(n.content) }))
    .filter((g) => g.tasks.length > 0);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-8 md:py-12">
      <div className="flex items-center gap-2">
        <ListChecks className="h-5 w-5 text-primary" />
        <h1 className="font-display text-2xl md:text-3xl">Checklist</h1>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Everything you've ticked — or not yet ticked — across your pages.
      </p>

      <div className="mt-8 space-y-5">
        {isLoading && <Skeleton className="h-40 rounded-xl" />}
        {!isLoading && groups.length === 0 && (
          <EmptyState
            title="No checklists yet."
            description="Add a checklist inside any note and the items will gather here."
            onCreate={() => create.mutate()}
            actionLabel="Start a checklist"
          />
        )}
        {groups.map(({ note, tasks }, gi) => (
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
            <ul className="px-5 py-3">
              {tasks.map((t, i) => (
                <li key={i} className="flex items-start gap-3 py-1.5 text-sm">
                  <span
                    className={cn(
                      "mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[4px] border-[1.5px]",
                      t.done ? "border-primary bg-primary" : "border-primary/45",
                    )}
                  >
                    {t.done && (
                      <span className="mt-[-2px] block h-[7px] w-[3.5px] rotate-45 border-r-2 border-b-2 border-primary-foreground" />
                    )}
                  </span>
                  <span className={cn(t.done && "text-muted-foreground line-through")}>
                    {t.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
