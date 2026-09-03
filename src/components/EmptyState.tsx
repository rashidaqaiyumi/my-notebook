import { BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  title = "Your notebook is waiting.",
  description = "Start with an idea, a lesson, a checklist, or anything you don't want to forget.",
  onCreate,
  actionLabel = "Create your first note",
}: {
  title?: string | undefined;
  description?: string | undefined;
  onCreate?: (() => void) | undefined;
  actionLabel?: string | undefined;
}) {
  return (
    <div className="rise-in flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
      <div className="mb-5 rounded-full bg-accent/70 p-5">
        <BookOpen className="h-7 w-7 text-primary" strokeWidth={1.4} />
      </div>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      {onCreate && (
        <Button className="mt-6 gap-2 rounded-xl" onClick={onCreate}>
          <Plus className="h-4 w-4" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
