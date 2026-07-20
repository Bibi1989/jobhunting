import { w as withCredits, r as readBody, c as createError, u as useRuntimeConfig, a as createGeminiClient } from '../../../nitro/nitro.mjs';
import '@google/genai';
import 'node:fs/promises';
import 'node:path';
import 'mammoth';
import 'cheerio';
import '@react-pdf/primitives';
import 'buffer';
import '@react-pdf/font';
import '@react-pdf/render';
import '@react-pdf/pdfkit';
import '@react-pdf/layout';
import '@react-pdf/fns';
import '@react-pdf/reconciler';
import 'node:stream';
import 'stripe';
import 'pg';
import 'node:crypto';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';

const parseResume_post = withCredits(async (event) => {
  const body = await readBody(event);
  const rawText = typeof (body == null ? void 0 : body.text) === "string" ? body.text.trim() : "";
  if (!rawText) {
    throw createError({ statusCode: 400, statusMessage: "Resume text is required" });
  }
  const config = useRuntimeConfig();
  const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: "Gemini API key is not configured" });
  }
  const ai = createGeminiClient(apiKey);
  const prompt = `You are an expert resume parser and writer.
I will provide you with the raw text extracted from a user's uploaded resume (PDF/Word/txt).
Your task is to parse this text and structure it into a valid JSON object representing the resume data.

Rules:
- Return ONLY a valid JSON object matching the requested schema.
- Extract personal info (name, job title, email, phone, location, linkedin, github, portfolio, summary).
- Extract experience (job title, company, location, dates, description).
- Extract education (degree, school, location, dates).
- Extract skills (as an array of objects with an 'id' and 'name' field).
- Extract projects and achievements if present.
- Generate a unique string UUID for the 'id' field of every experience, education, skill, project, achievement, or custom item.
- For all long-form text fields like summaries or job descriptions, format the content as semantic HTML (e.g., using <p>, <ul>, <li>, <strong>) instead of markdown.
- Do NOT make up any fake work experience or education. Only use what is provided in the text.
- If the text is messy, do your best to clean it up and enhance the bullet points slightly for professional tone without changing the facts.

Raw Resume Text:
"""
${rawText.slice(0, 15e3)}
"""

The output JSON MUST follow this exact schema structure:
{
  "personalInfo": {
    "fullName": "string",
    "jobTitle": "string",
    "location": "string",
    "email": "string",
    "phone": "string",
    "linkedin": "string",
    "github": "string",
    "portfolio": "string",
    "summary": "string (HTML)"
  },
  "experience": [
    { "id": "uuid", "title": "string", "company": "string", "location": "string", "startDate": "string", "endDate": "string", "isCurrent": false, "description": "string (HTML)" }
  ],
  "education": [
    { "id": "uuid", "degree": "string", "school": "string", "location": "string", "graduationDate": "string", "description": "string (HTML)" }
  ],
  "skills": [
    { "id": "uuid", "name": "string", "level": "string" }
  ],
  "projects": [],
  "achievements": [],
  "customSections": []
}
`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    });
    const raw = (response.text || "").trim();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.experience)) parsed.experience = [];
    if (!Array.isArray(parsed.education)) parsed.education = [];
    if (!Array.isArray(parsed.skills)) parsed.skills = [];
    if (!Array.isArray(parsed.projects)) parsed.projects = [];
    if (!Array.isArray(parsed.achievements)) parsed.achievements = [];
    if (!Array.isArray(parsed.customSections)) parsed.customSections = [];
    if (!parsed.personalInfo) {
      parsed.personalInfo = {
        fullName: "Imported Resume",
        location: "",
        email: "",
        phone: "",
        summary: ""
      };
    }
    return { resumeData: parsed };
  } catch (error) {
    console.error("Parse resume error:", error);
    const message = error instanceof Error ? error.message : "Failed to parse resume text";
    throw createError({ statusCode: 500, statusMessage: message });
  }
}, { reason: "ai_parse_resume", requirePro: true, cost: 2 });

export { parseResume_post as default };
//# sourceMappingURL=parse-resume.post.mjs.map
