import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { useCategories, useNotes } from "@/components/AppShell";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getDefaultCategory, setDefaultCategory, useTheme } from "@/lib/theme";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — My Notebook" },
      {
        name: "description",
        content: "Choose your notebook theme, default category and see where your notes live.",
      },
      { property: "og:title", content: "Settings — My Notebook" },
      { property: "og:description", content: "Theme, default category and storage details." },
    ],
  }),
  component: SettingsPage,
});

function Row({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-border/60 px-5 py-5 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

function SettingsPage() {
  const { theme, toggle } = useTheme();
  const { data: categories = [] } = useCategories();
  const { data: notes = [] } = useNotes();
  const [defaultCat, setCat] = useState<string>("none");

  useEffect(() => {
    setCat(getDefaultCategory() ?? "none");
  }, []);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 md:px-8 md:py-12">
      <h1 className="font-display text-2xl md:text-3xl">Settings</h1>
      <p className="mt-2 text-sm text-muted-foreground">A few small choices, nothing more.</p>

      <div className="mt-8 overflow-hidden rounded-2xl page-surface paper-grain">
        <Row title="Dark mode" description="A calm, warm dark page for the evening.">
          <Switch checked={theme === "dark"} onCheckedChange={toggle} aria-label="Dark mode" />
        </Row>
        <Row title="Default category" description="New notes start in this section.">
          <Select
            value={defaultCat}
            onValueChange={(v) => {
              setCat(v);
              setDefaultCategory(v === "none" ? null : v);
            }}
          >
            <SelectTrigger className="h-9 w-44 bg-card">
              <SelectValue />
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
        </Row>
        <Row
          title="Storage"
          description={`${notes.length} ${notes.length === 1 ? "note" : "notes"} saved securely in the cloud — autosaved as you write.`}
        >
          <span className="hand text-lg text-primary">all safe</span>
        </Row>
      </div>
    </div>
  );
}
