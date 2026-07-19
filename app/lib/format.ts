// app/lib/format.ts
export function formatDate(
  dateStr: string,
  style: "medium" | "mediumDate" = "mediumDate",
) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return style === "medium"
    ? d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
    : d.toLocaleDateString("en-IN", { dateStyle: "medium" });
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Converts rich-text HTML description into clean plain text,
 * preserving paragraph breaks, no tags/entities visible.
 * Client-only (uses a DOM element to decode entities).
 */
export function htmlToPlainText(html: string): string {
  if (!html) return "";

  let text = html
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "");

  if (typeof document !== "undefined") {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = text;
    text = textarea.value;
  }

  return text
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
