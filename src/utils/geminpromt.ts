export function Analyzerprompt(cvText: string, country: string) {
  return `
You are an expert HR and recruiter specialized in ${country} market.
The following text is a candidate's resume. Improve and rewrite it to fit professional standards and language used in ${country}.
Keep it clean, structured, and ATS-friendly.

Resume:
${cvText}
  `;
}

export function AnalyzerpromptWithDesign(
  cvText: string,
  country: string,
  colorTheme: string,
  fontPreference: string = "Lato, Arial, sans-serif",
  layoutStyle: string = "table"
): string {
  return (
    `You are an expert career consultant and senior front-end designer.

Task (strict):
1) Rewrite and improve the resume content below so it reads as clean, professional, and humanized English appropriate for the ${country} job market.
2) Structure the resume clearly into typical sections (Summary, Experience, Education, Skills, Contact).
3) Produce a single, complete HTML document (<!doctype html><html>...<head>...<body>...</body></html>) that renders a polished A4 resume.

CRITICAL LAYOUT & STYLING RULES (follow exactly):
- Use **INLINE CSS ONLY**: put all styles as ` +
    'style="..."' +
    ` attributes on HTML elements. Do NOT rely on external CSS files.
- Avoid using a <style> block. Only permit a **tiny** <style> block in <head> if absolutely required for A4 print sizing (@page or body size). Preferred approach: inline styles everywhere.
- Use **table-based layout** for the major page structure (header/sidebar/main sections) — i.e., use <table>, <tr>, <td> to control the main A4 layout. Use semantic tags inside table cells as needed.
- The document must be printer-friendly for A4 (210mm x 297mm). If using a small <style> for print sizing, keep it minimal; otherwise rely on inline width/height styles (e.g., style="width:210mm;min-height:297mm;").
- No JavaScript. No external assets. If fonts are specified, use safe fallback stacks (e.g., "${fontPreference}").
- Color theme: use this color: ${colorTheme} for highlights/headers; keep contrast accessible.
- Make it ATS-friendly: clear headings, simple text blocks, bullet lists for responsibilities, plain date formats.
- Output ONLY the HTML document — no commentary, no markdown, no extra text.

Design & content rules:
- Use reasonable font sizes for print (e.g., headings 14–18pt, body 10–12pt). Keep line-height readable.
- Sections required: Header (name + contact), Summary, Experience (company, role, dates, bullets), Education, Skills, Optional: Certifications/Projects.
- Condense overly long text — prioritize most relevant points for readability.
- Ensure semantic structure inside table cells (e.g., <section>, <h1>, <h2>, <ul>, <li>) even though layout uses tables.
- Return well-formed HTML; ensure quotes and special characters are escaped correctly.

Original resume text (use to rewrite & populate the HTML):
"""
${cvText}
"""

End of instructions.`
  );
}
export function Getjobprompt(cvText: string) {
  return `
You are an expert HR resume analyzer.

Read the following resume text carefully and determine the most likely current or primary job title of the candidate.

Return **only** the job title — no explanations, no extra text.

Resume:
${cvText}
`;
}
