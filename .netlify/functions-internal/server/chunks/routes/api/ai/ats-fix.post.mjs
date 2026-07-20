import { w as withCredits, r as readBody, c as createError, u as useRuntimeConfig, a as createGeminiClient } from '../../../nitro/nitro.mjs';
import { b as builderResumeToMarkdown } from '../../../_/builderToMarkdown.mjs';
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

const atsFix_post = withCredits(async (event) => {
  var _a, _b;
  const body = await readBody(event);
  const resumeData = body == null ? void 0 : body.resumeData;
  const atsResult = body == null ? void 0 : body.atsResult;
  const jobDescription = typeof (body == null ? void 0 : body.jobDescription) === "string" ? body.jobDescription : "";
  if (!resumeData || typeof resumeData !== "object") {
    throw createError({ statusCode: 400, statusMessage: "Resume data is required" });
  }
  if (!atsResult || typeof atsResult !== "object") {
    throw createError({ statusCode: 400, statusMessage: "Run ATS Check first, then fix." });
  }
  const config = useRuntimeConfig();
  const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: "Gemini API key is not configured" });
  }
  const markdown = builderResumeToMarkdown(resumeData);
  const issues = Array.isArray(atsResult.issues) ? atsResult.issues : [];
  const gaps = Array.isArray(atsResult.keywordGaps) ? atsResult.keywordGaps : [];
  const wins = Array.isArray(atsResult.quickWins) ? atsResult.quickWins : [];
  const ai = createGeminiClient(apiKey);
  const prompt = `You are an expert resume writer optimizing for ATS parseability.
Apply the audit findings to improve this resume JSON. Keep the same JSON schema/shape.

Target role: "${((_a = resumeData.personalInfo) == null ? void 0 : _a.jobTitle) || "professional"}"
${jobDescription.trim() ? `Job description excerpt:
"""
${jobDescription.trim().slice(0, 4e3)}
"""
` : ""}

ATS score: ${(_b = atsResult.score) != null ? _b : "n/a"}
Summary: ${atsResult.summary || ""}
Issues:
${issues.map((i) => `- [${i.severity}] ${i.category}: ${i.message} \u2192 ${i.suggestion}`).join("\n") || "(none)"}
Keyword gaps: ${gaps.join(", ") || "(none)"}
Quick wins: ${wins.join("; ") || "(none)"}

Current resume markdown (reference):
"""
${markdown.slice(0, 1e4)}
"""

Current resume JSON:
"""
${JSON.stringify(resumeData).slice(0, 14e3)}
"""

Rules:
- Return ONLY a valid JSON object with the FULL updated resume (same keys as input).
- Preserve all ids for experience/education/skills/projects/achievements/customSections when possible.
- Keep templateId, themeColor, language, name unchanged.
- Improve summary, bullets, skills, and section wording for ATS + the target role.
- Descriptions that are HTML must stay valid HTML using <p>/<ul>/<li>/<strong> only (no markdown).
- Do not invent fake employers or degrees; strengthen existing content and weave in missing keywords naturally.
- Do not add commentary outside the JSON object.`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.4,
        responseMimeType: "application/json"
      }
    });
    const raw = (response.text || "").trim();
    const fixed = JSON.parse(raw);
    fixed.templateId = resumeData.templateId;
    fixed.themeColor = resumeData.themeColor;
    fixed.language = resumeData.language;
    fixed.name = resumeData.name;
    if (!fixed.personalInfo) fixed.personalInfo = resumeData.personalInfo;
    if (!Array.isArray(fixed.experience)) fixed.experience = resumeData.experience;
    if (!Array.isArray(fixed.education)) fixed.education = resumeData.education;
    if (!Array.isArray(fixed.skills)) fixed.skills = resumeData.skills;
    if (!Array.isArray(fixed.projects)) fixed.projects = resumeData.projects || [];
    if (!Array.isArray(fixed.achievements)) fixed.achievements = resumeData.achievements || [];
    if (!Array.isArray(fixed.customSections)) fixed.customSections = resumeData.customSections || [];
    return { resumeData: fixed };
  } catch (error) {
    console.error("ATS fix error:", error);
    const message = error instanceof Error ? error.message : "Failed to apply ATS fixes";
    throw createError({ statusCode: 500, statusMessage: message });
  }
}, { reason: "ai_ats_fix", requirePro: true, cost: 3 });

export { atsFix_post as default };
//# sourceMappingURL=ats-fix.post.mjs.map
