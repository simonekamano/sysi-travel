// The story of the « Notre histoire » page cut into its parts: the text before the first
// « ## Title » (no title), then one part per title. Any heading level counts as a part title, so
// a « # » or « ### » typed in the administration still starts a part.
export function splitStory(text = "") {
  const parts = [];
  let current = { title: "", lines: [] };
  for (const line of text.replace(/\r\n?/g, "\n").split("\n")) {
    const heading = line.match(/^#{1,6}\s+(.+?)\s*#*\s*$/);
    if (heading) {
      parts.push(current);
      current = { title: heading[1], lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  parts.push(current);
  return parts
    .map(({ title, lines }) => ({ title, body: lines.join("\n").trim() }))
    .filter((part) => part.title || part.body);
}

// The first paragraph made of one italic sentence only (« *…* » on its own line), taken out of
// a part's text: the page shows it beside the part, as a large quote.
export function extractQuote(body = "") {
  const paragraphs = body.split(/\n\s*\n/);
  const index = paragraphs.findIndex((paragraph) => /^\s*(?:\*[^*\n]+\*|_[^_\n]+_)\s*$/.test(paragraph));
  if (index < 0) return { quote: "", body };
  return {
    quote: paragraphs[index].trim().slice(1, -1).trim(),
    body: paragraphs.filter((_, i) => i !== index).join("\n\n"),
  };
}

// The three moments of the support, in page order, with the database column of each text.
export const ACCOMPAGNEMENT = [
  { key: "avant", title: "Avant le voyage" },
  { key: "pendant", title: "Pendant le voyage" },
  { key: "apres", title: "Après le voyage" },
];
