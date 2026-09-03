import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Bookmark, Clock3, ListChecks, BookOpen } from "lucide-react";

import { useCreateNote, useNotes } from "@/components/AppShell";
import { NoteCard } from "@/components/NoteCard";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { extractTasks, greeting, noteTitle, type Note } from "@/lib/notes";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "My Notebook — your calm home for notes" },
      {
        name: "description",
        content:
          "Open your notebook: pinned pages, recent notes, unfinished checklist items and a quiet place to start writing.",
      },
      { property: "og:title", content: "My Notebook — your calm home for notes" },
      {
        property: "og:description",
        content: "Pinned pages, recent notes and unfinished tasks in one peaceful place.",
      },
    ],
  }),
  component: Home,
});

function Section({
  title,
  icon: Icon,
  children,
  action,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        <div className="ml-auto">{action}</div>
      </div>
      {children}
    </section>
  );
}

function Home() {
  const { data: notes, isLoading, error } = useNotes();
  const create = useCreateNote();

  const list = notes ?? [];
  const pinned = list.filter((n) => n.is_pinned);
  const recent = list.slice(0, 6);
  const continueReading = [...list]
    .filter((n) => n.opened_at)
    .sort((a, b) => (a.opened_at! < b.opened_at! ? 1 : -1))
    .slice(0, 3);

  const tasks: { note: Note; text: string }[] = [];
  for (const note of list) {
    for (const t of extractTasks(note.content)) {
      if (!t.done && tasks.length < 6) tasks.push({ note, text: t.text });
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 md:px-8 md:py-14">
      <header className="rise-in">
        <p className="hand text-xl text-primary">{greeting()}</p>
        <h1 className="mt-1 font-display text-3xl leading-tight md:text-4xl">
          What are you working on today?
        </h1>
        <Button
          className="mt-6 gap-2 rounded-xl px-5 shadow-page transition-transform duration-200 hover:-translate-y-0.5"
          size="lg"
          onClick={() => create.mutate()}
          disabled={create.isPending}
        >
          <Plus className="h-4 w-4" /> New Note
        </Button>
      </header>

      {error && (
        <p className="mt-8 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Your notebook could not be loaded. Please refresh the page.
        </p>
      )}

      {isLoading && (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && list.length === 0 && (
        <div className="mt-10">
          <EmptyState onCreate={() => create.mutate()} />
        </div>
      )}

      {list.length > 0 && (
        <>
          {continueReading.length > 0 && (
            <Section title="Continue reading" icon={BookOpen}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {continueReading.map((n, i) => (
                  <NoteCard key={n.id} note={n} index={i} />
                ))}
              </div>
            </Section>
          )}

          {pinned.length > 0 && (
            <Section title="Pinned notes" icon={Bookmark}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pinned.map((n, i) => (
                  <NoteCard key={n.id} note={n} index={i} />
                ))}
              </div>
            </Section>
          )}

          <Section
            title="Recent notes"
            icon={Clock3}
            action={
              <Link
                to="/notes"
                search={{ view: "all" }}
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                See all
              </Link>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recent.map((n, i) => (
                <NoteCard key={n.id} note={n} index={i} />
              ))}
            </div>
          </Section>

          {tasks.length > 0 && (
            <Section title="Quick tasks" icon={ListChecks}>
              <div className="overflow-hidden rounded-xl page-surface paper-grain">
                {tasks.map((t, i) => (
                  <Link
                    key={`${t.note.id}-${i}`}
                    to="/notes/$noteId"
                    params={{ noteId: t.note.id }}
                    className="flex items-center gap-3 border-b border-border/60 px-5 py-3 text-sm transition-colors last:border-0 hover:bg-accent/40"
                  >
                    <span className="h-3.5 w-3.5 shrink-0 rounded-[4px] border-[1.5px] border-primary/50" />
                    <span className="truncate">{t.text}</span>
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                      {noteTitle(t.note)}
                    </span>
                  </Link>
                ))}
              </div>
            </Section>
          )}
        </>
      )}
    </div>
  );
}
