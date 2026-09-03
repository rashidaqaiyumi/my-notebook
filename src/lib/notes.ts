import { supabase } from "@/integrations/supabase/client";

export type Note = {
  id: string;
  title: string;
  content: string;
  category: string | null;
  tags: string[];
  is_pinned: boolean;
  is_favorite: boolean;
  has_important_links: boolean;
  opened_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Category = { id: string; name: string; created_at: string };

export const notesKey = ["notes"] as const;
export const categoriesKey = ["categories"] as const;

export async function fetchNotes(): Promise<Note[]> {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Note[];
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function createNote(input: Partial<Note>): Promise<Note> {
  const { data, error } = await supabase
    .from("notes")
    .insert({ title: "", content: "", ...input })
    .select()
    .single();
  if (error) throw error;
  return data as Note;
}

export async function updateNote(id: string, patch: Partial<Note>): Promise<Note> {
  const { data, error } = await supabase
    .from("notes")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Note;
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) throw error;
}

export async function createCategory(name: string): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .insert({ name })
    .select()
    .single();
  if (error) throw error;
  return data as Category;
}

/* ---------- helpers on note HTML ---------- */

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function preview(note: Note, len = 140): string {
  const text = stripHtml(note.content);
  return text.length > len ? text.slice(0, len).trimEnd() + "…" : text;
}

export type TaskItem = { text: string; done: boolean };

export function extractTasks(html: string): TaskItem[] {
  const out: TaskItem[] = [];
  const re = /<li[^>]*data-type="taskItem"[^>]*>([\s\S]*?)<\/li>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const done = /data-checked="true"/.test(m[0] ?? "");
    const text = stripHtml(m[1] ?? "");
    if (text) out.push({ text, done });
  }
  return out;
}

export type NoteLink = { href: string; label: string };

export function extractLinks(html: string): NoteLink[] {
  const out: NoteLink[] = [];
  const re = /<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    out.push({ href: m[1] ?? "", label: stripHtml(m[2] ?? "") || (m[1] ?? "") });
  }
  return out;
}

export function noteTitle(note: Note): string {
  return note.title.trim() || "Untitled note";
}

export function greeting(d = new Date()): string {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
