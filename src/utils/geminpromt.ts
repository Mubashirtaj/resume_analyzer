export function Analyzerprompt(cvText: string, country: string) {
  return `
You are an expert HR and recruiter specialized in ${country} market.
The following text is a candidate's resume. Improve and rewrite it to fit professional standards and language used in ${country}.
Keep it clean, structured, and ATS-friendly.

Resume:
${cvText}
  `;
}

// export function AnalyzerpromptWithDesign(
//   cvText: string,
//   country: string,
//   colorTheme: string,
//   fontPreference: string = "Lato, Arial, sans-serif",
//   layoutStyle: string = "table",
//   designTheme: string = "modern", // e.g. "modern", "classic", "minimal", "creative"
//   allowUserLayoutChoice: boolean = true
// ): string {
//   return `You are an expert career consultant and senior front-end designer.

// Task (strict):
// 1) Rewrite and improve the resume content below so it reads as clean, professional, and humanized English appropriate for the ${country} job market.
// 2) Structure the resume clearly into typical sections (Header, Summary, Experience, Education, Skills, Contact). Optionally include Certifications or Projects if relevant content exists.
// 3) Produce a single, complete HTML document (<!doctype html><html lang="en">...<head>...<body>...</body></html>) that renders a polished, web-preview-friendly resume.

// CRITICAL LAYOUT & STYLING RULES (follow exactly):
// - Use **INLINE CSS ONLY**: put all styles as style="..." attributes on HTML elements. Do NOT rely on external CSS files.
// - Avoid using a <style> block. Only permit a **tiny** <style> block in <head> if absolutely required for layout normalization. Preferred approach: inline styles everywhere.
// - Use **table-based layout** for the major page structure (header/sidebar/main sections) — i.e., use <table>, <tr>, <td> to control layout. Use semantic tags inside table cells as needed (<section>, <header>, <h1>, <h2>, <ul>, <li>, <address>, etc.).
// - The document must be optimized for screen preview and light print use — overall layout size:
//   **style="width:100%; max-width:850px; max-height:500px; margin:0 auto; border:1px solid #ddd;"**
// - No JavaScript. No external assets. If fonts are specified, use safe fallback stacks (e.g., "${fontPreference}").
// - Color theme: use this color: ${colorTheme} for highlights/headers; keep contrast accessible and ensure readable black/dark text for body content.
// - Make it ATS-friendly: clear headings, simple text blocks, plain date formats (e.g., "Jan 2020 — Dec 2022"), bullet lists for responsibilities, and avoid decorative characters that break parsers.
// - Output ONLY the HTML document — no commentary, no markdown, no extra text.

// Design & user-controlled layout rules:
// - The resume must follow the requested layout style: "${layoutStyle}" (e.g., "table", "two-column", "single-column"). If ${allowUserLayoutChoice} is true, the resume should allow variations for common choices; by default apply a balanced two-column layout.
// - Respect the requested design theme: "${designTheme}". Interpret theme as follows:
//   - "modern": clean lines, modest use of ${colorTheme} for section headers and accent bars, sans-serif stack (${fontPreference}), generous spacing.
//   - "classic": conservative spacing, subtle separators, slightly smaller heading sizes, serif-like fallback allowed (but keep ${fontPreference} if specified).
//   - "minimal": very sparse use of color, plenty of white space, simple type scale.
//   - "creative": tasteful use of ${colorTheme} blocks or sidebars, but still ATS-friendly (content order and semantic tags must remain standard).
// - If the original resume text contains section hints (e.g., project names, certification lines), preserve and place them in the appropriate optional sections.

// Design & content rules (typesetting):
// - Use reasonable font sizes for display (headings 16–20px, body 12–14px). Use line-height for readability.
// - Use tables only for page layout (major columns/rows). Inside each table cell use semantic tags like <section>, <h1>, <h2>, <p>, <ul>, <li>, <address>.
// - Condense overly long text — prioritize clarity and relevance. Convert dense paragraphs into 3–6 concise bullets where appropriate for Experience.
// - Ensure all text is well-formed HTML; escape necessary characters (&, <, >, ").
// - Dates should be plain and short (e.g., "2021 — 2024" or "Mar 2020 — Nov 2021").
// - Keep spacing consistent and prevent content overflow within the 1200px height limit. Allow scrolling if content exceeds height.

// Preview note:
// - The entire resume must fit within a **max height of 1200px** for web display. Use inline styles like:
//   **style="max-height:1200px; overflow:auto; box-sizing:border-box;"**
//   to ensure the document remains readable within UI components or resume viewers.

// Original resume text (use to rewrite & populate the HTML):
// """
// ${cvText}
// """

// End of instructions.`;
// }
export function AnalyzerpromptWithDesign(
  cvText: string,
  country: string,
  colorTheme: string,
  fontPreference: string = "Arial, sans-serif",
  layoutStyle: string = "two-column",
  designTheme: string = "modern"
): string {
  return `
You are an expert resume writer and professional UI designer. Your job is to rewrite the resume into **clear, natural, professional English** and create a visually balanced, modern resume layout.

⚠️ CRITICAL OUTPUT RULES:
✅ RETURN ONLY PURE JSON — absolutely no markdown, no code blocks (\`\`\`), no explanations before or after
✅ The resume must be designed to fit exactly ONE A4 page (800px width × 1200px height in the editor)
✅ Use REALISTIC font sizes and spacing that look professional and readable
✅ Content should be concise but complete — expand only where naturally needed
✅ Layout must be clean, organized, and ATS-friendly

🎨 DESIGN SPECIFICATIONS:

**Font Sizes (IMPORTANT - Keep These Realistic):**
- Name/Header: 24-28px (bold)
- Section Headings: 16-18px (bold)
- Job Titles: 14-15px (bold)
- Body Text: 11-13px (regular)
- Contact Info: 10-12px (regular)
- Dates/Small Text: 10-11px (regular)

**Spacing & Layout Guidelines:**
- Top margin: Start at y: 30-40
- Section spacing: 20-30px between sections
- Line height: 1.3-1.5 for body text
- Element padding: 6-12px
- Maximum width for text blocks: 350-400px (for two-column), 700px (for single column)

**Color Usage:**
- Use ${colorTheme} ONLY for: section headings, name, or subtle accents
- Body text: #000000 or #1a1a1a (dark gray)
- Secondary text (dates, locations): #666666 or #888888
- Backgrounds: Use subtle colors or transparent

📐 LAYOUT STRUCTURE (800px × 1200px canvas):

${
  layoutStyle === "two-column"
    ? `
**Two-Column Layout:**
- LEFT COLUMN (x: 30-40, width: 280-300px):
  * Contact Info
  * Skills (categorized)
  * Languages
  * Certifications (if any)

- RIGHT COLUMN (x: 350-380, width: 400-420px):
  * Name & Title (can span both columns)
  * Professional Summary (3-4 lines)
  * Work Experience (2-3 positions max)
  * Education
  * Projects (if space allows)
`
    : `
**Single-Column Layout:**
- Full width content (x: 40-60, width: 680-720px)
- Name & Contact at top
- All sections stacked vertically
`
}

🎯 MANDATORY JSON STRUCTURE:

{
  "elements": [
    {
      "id": "header_name",
      "type": "heading",
      "content": "Full Name",
      "fontSize": 26,
      "fontFamily": "${fontPreference}",
      "fontWeight": "bold",
      "color": "${colorTheme}",
      "backgroundColor": "transparent",
      "x": 40,
      "y": 30,
      "width": 700,
      "height": 35,
      "lineHeight": 1.2
    },
    {
      "id": "header_title",
      "type": "text",
      "content": "Professional Title",
      "fontSize": 14,
      "fontFamily": "${fontPreference}",
      "fontWeight": "normal",
      "color": "#666666",
      "backgroundColor": "transparent",
      "x": 40,
      "y": 70,
      "width": 700,
      "height": 20,
      "lineHeight": 1.3
    },
    // ... more elements following the same pattern
  ],
  "background": "#ffffff",
  "layout": "${layoutStyle}",
  "designTheme": "${designTheme}",
  "fontPreference": "${fontPreference}",
  "page": {
    "format": "A4",
    "unit": "px",
    "width": 800,
    "height": 1200,
    "margin": 40
  }
}

📝 CONTENT WRITING RULES:

**Professional Summary:**
- 3-4 sentences maximum
- Natural, human tone (not robotic)
- Include: years of experience, key skills, career focus
- Example: "Experienced software developer with 5+ years building scalable web applications. Passionate about clean code and user-centric design. Proven track record of delivering projects on time and improving system performance by 40%."

**Work Experience:**
- Job Title | Company Name
- Location | Date Range (on same line or below)
- 2-4 bullet points per job
- Use action verbs + measurable results
- Example: "Developed REST APIs serving 50K+ daily users, reducing response time by 35%"
- Keep it concise and impactful

**Skills:**
- Categorize: Technical Skills, Soft Skills, Languages, Tools
- List format or grouped boxes
- Don't overload — include only relevant skills

**Education:**
- Degree | University Name
- Location | Graduation Year
- GPA (if above 3.5), honors, or relevant coursework (optional)

**Spacing Strategy:**
- Each section should have clear visual separation
- Use y-coordinates that create natural flow top to bottom
- Leave some white space — don't cram everything
- Typical y-coordinate progression: 30 → 70 → 120 → 180 → 250 → 380 → 520 → 680 → 850 → 1000

⚠️ CRITICAL MISTAKES TO AVOID:
❌ Font sizes over 30px (except for special design needs)
❌ Tiny fonts under 10px (unreadable)
❌ Overlapping elements (check x, y coordinates)
❌ Text extending beyond canvas (x + width must be ≤ 800, y + height must be ≤ 1200)
❌ Too much bold text (only headings and job titles)
❌ Inconsistent spacing between sections
❌ Using LAB colors (use hex like #3b82f6 instead)

🎨 COLOR PALETTE SUGGESTIONS:
- Modern Blue: #3b82f6, #2563eb
- Professional Green: #10b981, #059669
- Corporate Gray: #64748b, #475569
- Creative Purple: #8b5cf6, #7c3aed
- Classic Black: #000000, #1a1a1a

📄 SOURCE RESUME TO ANALYZE:
"""
${cvText}
"""

🎯 YOUR TASK:
1. Extract key information from the source resume
2. Rewrite content in natural, professional English
3. Design a clean, modern layout with proper spacing
4. Use realistic font sizes (11-26px range)
5. Ensure all elements fit within 800×1200px canvas
6. Return ONLY the JSON — no extra text whatsoever

Remember: The goal is a professional, readable, ATS-friendly resume that looks designed by a human, not generated by AI.
`;
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
