import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Bookmark,
  Check,
  Clock3,
  Folder,
  Link2,
  ListChecks,
  Menu,
  Moon,
  Notebook,
  Plus,
  Search,
  Settings,
  Star,
  Sun,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useTheme } from "@/lib/theme";
import { getDefaultCategory } from "@/lib/theme";
import {
  categoriesKey,
  createCategory,
  createNote,
  fetchCategories,
  fetchNotes,
  noteTitle,
  notesKey,
  preview,
  type Note,
} from "@/lib/notes";

const VIEWS = [
  { to: "/notes", search: { view: "all" }, label: "All Notes", icon: BookOpen },
  { to: "/notes", search: { view: "recent" }, label: "Recent", icon: Clock3 },
  { to: "/notes", search: { view: "pinned" }, label: "Pinned", icon: Bookmark },
  { to: "/notes", search: { view: "favorites" }, label: "Favorites", icon: Star },
] as const;

export function useNotes() {
  return useQuery({ queryKey: notesKey, queryFn: fetchNotes });
}

export function useCategories() {
  return useQuery({ queryKey: categoriesKey, queryFn: fetchCategories });
}

export function useCreateNote() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: () => createNote({ category: getDefaultCategory() }),
    onSuccess: (note) => {
      qc.invalidateQueries({ queryKey: notesKey });
      navigate({ to: "/notes/$noteId", params: { noteId: note.id } });
    },
  });
}

type NavRowProps = {
  to: string;
  search?: Record<string, unknown> | undefined;
  active?: boolean | undefined;
  onClick?: (() => void) | undefined;
  children: React.ReactNode;
};

const FlexibleLink = Link as unknown as React.ComponentType<
  Record<string, unknown> & { children?: React.ReactNode }
>;

function NavRow({ active, children, ...rest }: NavRowProps) {
  return (
    <FlexibleLink
      {...rest}
      className={cn(
        "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/85 transition-all duration-200",
        "hover:translate-x-0.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        active && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
      )}
    >
      {children}
    </FlexibleLink>
  );
}


function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const { data: categories = [] } = useCategories();
  const qc = useQueryClient();
  const location = useRouterState({ select: (s) => s.location });
  const create = useCreateNote();
  const { theme, toggle } = useTheme();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  const addCategory = useMutation({
    mutationFn: (value: string) => createCategory(value),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoriesKey });
      setName("");
      setAdding(false);
    },
  });

  const search = location.search as { view?: string; category?: string };
  const isView = (v: string) =>
    location.pathname === "/notes" && (search.view ?? "all") === v && !search.category;

  return (
    <div className="flex h-full flex-col bg-sidebar paper-grain">
      <div className="flex items-center gap-2.5 px-5 pt-6 pb-5">
        <Notebook className="h-5 w-5 text-primary" />
        <div className="leading-tight">
          <p className="font-display text-base font-semibold text-sidebar-foreground">
            My Notebook
          </p>
          <p className="hand text-sm text-muted-foreground">a quiet place to think</p>
        </div>
      </div>

      <div className="px-4 pb-4">
        <Button
          className="w-full justify-start gap-2 rounded-xl shadow-page transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
          onClick={() => {
            create.mutate();
            onNavigate?.();
          }}
          disabled={create.isPending}
        >
          <Plus className="h-4 w-4" /> New Note
        </Button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {VIEWS.map((v) => (
          <NavRow
            key={v.label}
            to={v.to}
            search={v.search}
            active={isView(v.search.view)}
            onClick={onNavigate}
          >
            <v.icon className="h-4 w-4 opacity-75" />
            {v.label}
          </NavRow>
        ))}
        <NavRow to="/tasks" active={location.pathname === "/tasks"} onClick={onNavigate}>
          <ListChecks className="h-4 w-4 opacity-75" />
          Checklist
        </NavRow>
        <NavRow to="/links" active={location.pathname === "/links"} onClick={onNavigate}>
          <Link2 className="h-4 w-4 opacity-75" />
          Important Links
        </NavRow>

        <div className="px-3 pt-6 pb-1.5">
          <p className="text-[0.68rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Categories
          </p>
        </div>
        {categories.map((c) => (
          <NavRow
            key={c.id}
            to="/notes"
            search={{ view: "all", category: c.name }}
            active={search.category === c.name}
            onClick={onNavigate}
          >
            <Folder className="h-4 w-4 opacity-70" />
            {c.name}
          </NavRow>
        ))}

        {adding ? (
          <form
            className="flex items-center gap-1.5 px-2 pt-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) addCategory.mutate(name.trim());
            }}
          >
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => !name && setAdding(false)}
              placeholder="Category name"
              className="h-8 bg-paper text-sm"
            />
            <Button type="submit" size="icon" variant="ghost" className="h-8 w-8 shrink-0">
              <Check className="h-4 w-4" />
            </Button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Plus className="h-4 w-4" /> Add category
          </button>
        )}
      </nav>

      <div className="flex items-center justify-between border-t border-sidebar-border px-3 py-3">
        <NavRow to="/settings" active={location.pathname === "/settings"} onClick={onNavigate}>
          <Settings className="h-4 w-4 opacity-75" />
          Settings
        </NavRow>
        <button
          type="button"
          onClick={toggle}
          aria-label="Toggle theme"
          className="mr-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:scale-95"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function SearchPalette({
  open,
  setOpen,
  notes,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  notes: Note[];
}) {
  const navigate = useNavigate();
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search titles, content and tags…" />
      <CommandList>
        <CommandEmpty>Nothing found in your notebook.</CommandEmpty>
        <CommandGroup heading="Notes">
          {notes.map((n) => (
            <CommandItem
              key={n.id}
              value={`${n.title} ${n.tags.join(" ")} ${preview(n, 400)}`}
              onSelect={() => {
                setOpen(false);
                navigate({ to: "/notes/$noteId", params: { noteId: n.id } });
              }}
            >
              <BookOpen className="h-4 w-4 opacity-60" />
              <span className="truncate">{noteTitle(n)}</span>
              {n.category && (
                <span className="ml-auto text-xs text-muted-foreground">{n.category}</span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [drawer, setDrawer] = useState(false);
  const [search, setSearch] = useState(false);
  const { data: notes = [] } = useNotes();
  const create = useCreateNote();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === "k") {
        e.preventDefault();
        setSearch((v) => !v);
      }
      if (key === "n" && !e.shiftKey) {
        e.preventDefault();
        create.mutate();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [create]);

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* notebook binding */}
      <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 border-r border-sidebar-border md:block">
        <SidebarBody />
      </aside>

      <Sheet open={drawer} onOpenChange={setDrawer}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SidebarBody onNavigate={() => setDrawer(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border/70 bg-background/85 px-3 backdrop-blur-md md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setDrawer(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <button
            type="button"
            onClick={() => setSearch(true)}
            className="flex h-9 flex-1 items-center gap-2 rounded-xl border border-border bg-card/70 px-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 md:max-w-md"
          >
            <Search className="h-4 w-4" />
            <span className="truncate">Search your notebook</span>
            <kbd className="ml-auto hidden rounded border border-border px-1.5 py-0.5 text-[0.65rem] sm:inline">
              ⌘K
            </kbd>
          </button>
          <div className="ml-auto">
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5"
              onClick={() => create.mutate()}
              disabled={create.isPending}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Note</span>
            </Button>
          </div>
        </header>

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <SearchPalette open={search} setOpen={setSearch} notes={notes} />
    </div>
  );
}
