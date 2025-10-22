export function cleanAiHtml(aiOutput: string) {
  if (!aiOutput) return "";

  return aiOutput
    .replace(/```html/g, "")
    .replace(/```/g, "")
    .replace(/\\u003C/g, "<")
    .replace(/\\u003E/g, ">")
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, '"')
    .trim();
}
