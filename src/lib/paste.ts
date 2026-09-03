/**
 * Convert plain text pasted from ChatGPT / Claude / terminals into structured
 * HTML so lists, headings and checkboxes survive the paste.
 */
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function inline(text: string): string {
  let out = esc(text);
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|\W)\*([^*\n]+)\*/g, "$1<em>$2</em>");
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>');
  out = out.replace(
    /(^|[\s(])(https?:\/\/[^\s<)]+)/g,
    (_m, pre: string, url: string) => `${pre}<a href="${url}">${url}</a>`,
  );
  return out;
}

const taskItem = (text: string, done: boolean) =>
  `<li data-type="taskItem" data-checked="${done}"><label><input type="checkbox"${
    done ? ' checked="checked"' : ""
  }><span></span></label><div><p>${inline(text)}</p></div></li>`;

export function plainTextToHtml(raw: string): string {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let list: "ul" | "ol" | "task" | null = null;
  let inCode = false;
  let code: string[] = [];

  const closeList = () => {
    if (list === "ul") html.push("</ul>");
    else if (list === "ol") html.push("</ol>");
    else if (list === "task") html.push("</ul>");
    list = null;
  };
  const openList = (kind: "ul" | "ol" | "task") => {
    if (list === kind) return;
    closeList();
    if (kind === "task") html.push('<ul data-type="taskList">');
    else html.push(`<${kind}>`);
    list = kind;
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^```/.test(trimmed)) {
      if (inCode) {
        html.push(`<pre><code>${esc(code.join("\n"))}</code></pre>`);
        code = [];
        inCode = false;
      } else {
        closeList();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      code.push(line);
      continue;
    }
    if (!trimmed) {
      closeList();
      continue;
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(trimmed);
    if (heading) {
      closeList();
      const level = Math.min((heading[1] ?? "").length + 1, 4);
      html.push(`<h${level}>${inline(heading[2] ?? "")}</h${level}>`);
      continue;
    }

    const task = /^(?:[-*+]\s+)?(\[[ xX]\]|☐|☑|✅|✔)\s*(.*)$/.exec(trimmed);
    if (task) {
      const done = /[xX☑✅✔]/.test(task[1] ?? "");
      openList("task");
      html.push(taskItem(task[2] ?? "", done));
      continue;
    }

    const bullet = /^[-*•·–]\s+(.*)$/.exec(trimmed);
    if (bullet) {
      openList("ul");
      html.push(`<li><p>${inline(bullet[1] ?? "")}</p></li>`);
      continue;
    }

    const ordered = /^\d+[.)]\s+(.*)$/.exec(trimmed);
    if (ordered) {
      openList("ol");
      html.push(`<li><p>${inline(ordered[1] ?? "")}</p></li>`);
      continue;
    }

    const quote = /^>\s?(.*)$/.exec(trimmed);
    if (quote) {
      closeList();
      html.push(`<blockquote><p>${inline(quote[1] ?? "")}</p></blockquote>`);
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      closeList();
      html.push("<hr>");
      continue;
    }

    closeList();
    html.push(`<p>${inline(trimmed)}</p>`);
  }

  if (inCode && code.length) html.push(`<pre><code>${esc(code.join("\n"))}</code></pre>`);
  closeList();
  return html.join("");
}

/** True when the text carries structure worth converting. */
export function looksStructured(raw: string): boolean {
  return /(^|\n)\s*(#{1,4}\s|[-*+•]\s|\d+[.)]\s|\[[ xX]\]|☐|☑|>\s|```)/.test(raw);
}
