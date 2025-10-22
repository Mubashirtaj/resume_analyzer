export function unescapeAiHtml(aiOutput: string) {
  if (!aiOutput) return aiOutput;

  let s = aiOutput;

  s = s
    .replace(/\\r/g, "\r")
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'");

  s = s
    .replace(/\\u003C/g, "<")
    .replace(/\\u003E/g, ">")
    .replace(/\\u002F/g, "/");

  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1);
  }

  s = s.replace(/\\"/g, '"');

  s = s.replace(/^\s*```html\s*/i, "").replace(/\s*```\s*$/i, "");

  return s.trim();
}
