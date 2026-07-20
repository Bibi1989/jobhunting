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

const atsCheck_post = withCredits(async (event) => {
  var _a;
  const body = await readBody(event);
  const { resumeData, targetRole, jobDescription } = body || {};
  if (!resumeData || typeof resumeData !== "object") {
    throw createError({
      statusCode: 400,
      statusMessage: "Resume data is required for ATS check"
    });
  }
  const config = useRuntimeConfig();
  const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Gemini API key is not configured"
    });
  }
  let markdown = "";
  try {
    markdown = builderResumeToMarkdown(resumeData);
  } catch {
    markdown = JSON.stringify(resumeData);
  }
  if (!markdown.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: "Resume appears empty \u2014 add content before running ATS check"
    });
  }
  const roleHint = typeof targetRole === "string" && targetRole.trim() ? targetRole.trim() : ((_a = resumeData == null ? void 0 : resumeData.personalInfo) == null ? void 0 : _a.jobTitle) || "general professional role";
  const jdBlock = typeof jobDescription === "string" && jobDescription.trim() ? `

Target job description:
"""
${jobDescription.trim().slice(0, 6e3)}
"""` : "";
  const ai = createGeminiClient(apiKey);
  const prompt = `You are an expert ATS (Applicant Tracking System) resume auditor.
Analyze this resume for ATS parseability and hiring-manager fitness for the target role: "${roleHint}".

Resume (markdown):
"""
${markdown.slice(0, 12e3)}
"""${jdBlock}

Score 0\u2013100 for ATS readiness. Be practical and specific.
Focus on: contact fields, section clarity, keyword alignment, measurable bullets, formatting risks (tables/graphics), length, and missing essentials.

Return ONLY valid JSON matching this schema (no markdown fences):
{
  "score": number,
  "grade": string,
  "summary": string,
  "strengths": string[],
  "issues": [{ "severity": "critical"|"warning"|"info", "category": string, "message": string, "suggestion": string }],
  "keywordGaps": string[],
  "quickWins": string[]
}`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.35,
        responseMimeType: "application/json"
      }
    });
    const raw = (response.text || "").trim();
    const parsed = JSON.parse(raw);
    const score = Math.max(0, Math.min(100, Number(parsed.score) || 0));
    const grade = parsed.grade || (score >= 85 ? "A" : score >= 70 ? "B" : score >= 55 ? "C" : score >= 40 ? "D" : "F");
    return {
      score,
      grade,
      summary: String(parsed.summary || ""),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String).slice(0, 8) : [],
      issues: Array.isArray(parsed.issues) ? parsed.issues.slice(0, 12).map((issue) => ({
        severity: ["critical", "warning", "info"].includes(issue == null ? void 0 : issue.severity) ? issue.severity : "warning",
        category: String((issue == null ? void 0 : issue.category) || "General"),
        message: String((issue == null ? void 0 : issue.message) || ""),
        suggestion: String((issue == null ? void 0 : issue.suggestion) || "")
      })) : [],
      keywordGaps: Array.isArray(parsed.keywordGaps) ? parsed.keywordGaps.map(String).slice(0, 12) : [],
      quickWins: Array.isArray(parsed.quickWins) ? parsed.quickWins.map(String).slice(0, 8) : []
    };
  } catch (error) {
    console.error("ATS check error:", error);
    const message = error instanceof Error ? error.message : "Failed to run ATS check";
    throw createError({
      statusCode: 500,
      statusMessage: message
    });
  }
}, { reason: "ai_ats_check", requirePro: true, cost: 2 });

export { atsCheck_post as default };
//# sourceMappingURL=ats-check.post.mjs.map
