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

const enhanceDescription_post = withCredits(async (event) => {
  var _a;
  const body = await readBody(event);
  const { title, currentDescription, type, experiences } = body;
  if (!title) {
    throw createError({
      statusCode: 400,
      statusMessage: "Title is required for enhancement"
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
  const ai = createGeminiClient(apiKey);
  let prompt = "";
  if (type === "summary") {
    let experienceContext = "";
    if (experiences && experiences.length > 0) {
      experienceContext = `

User's past experiences to consider:
` + experiences.map((exp) => `- ${exp.title} at ${exp.company}`).join("\n");
    }
    prompt = `You are an expert resume writer. The user is writing a professional summary. The target role/job title is "${title}".
Current summary text (if any) (may contain HTML):
"""
${currentDescription || ""}
"""${experienceContext}

Instructions:
- If the current summary is empty, generate a highly professional, 2-3 sentence summary tailored for a "${title}" role.
- If the current summary is present, enhance it to be more professional, impactful, and concise.
- Use the provided past experiences to highlight relevant achievements if appropriate.
- DO NOT use markdown. ALWAYS format your response as valid HTML using <p>, <strong>, <em>, etc.
- Do NOT add inline styles, background colors, or text colors.
- Return ONLY the raw HTML string without any markdown code blocks.`;
  } else if (type === "experience") {
    prompt = `You are an expert resume writer. The user is writing the description for an experience entry with the title "${title}". 
Current description text (if any) (may contain HTML):
"""
${currentDescription || ""}
"""

Instructions:
- If the current description is empty, generate 3-4 professional, impactful bullet points for a typical "${title}" role.
- If the current description is present, enhance it to be more professional, action-oriented, and impactful, keeping it as a bulleted list.
- Focus on accomplishments and metrics rather than just duties.
- DO NOT use markdown. ALWAYS format your response as valid HTML using <ul> and <li> only for lists. Do NOT put bullet characters (\u2022, -, *) inside the <li> text \u2014 the list tags provide the bullets.
- Do NOT add inline styles, background colors, or text colors.
- Return ONLY the raw HTML string without any markdown code blocks.`;
  } else if (type === "project") {
    prompt = `You are an expert resume writer. The user is writing the description for a project entry with the title "${title}". 
Current description text (if any) (may contain HTML):
"""
${currentDescription || ""}
"""

Instructions:
- If the current description is empty, generate 2-3 professional bullet points describing what a typical project named "${title}" might entail.
- If the current description is present, enhance it to be more professional and impactful, focusing on the technologies used and the results achieved.
- DO NOT use markdown. ALWAYS format your response as valid HTML using <ul> and <li> only for lists. Do NOT put bullet characters (\u2022, -, *) inside the <li> text.
- Do NOT add inline styles, background colors, or text colors.
- Return ONLY the raw HTML string without any markdown code blocks.`;
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7
      }
    });
    const text = (((_a = response.text) == null ? void 0 : _a.trim()) || "").replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/i, "").trim();
    return {
      enhancedDescription: text
    };
  } catch (error) {
    console.error("Enhance API Error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Failed to enhance description"
    });
  }
}, { reason: "ai_enhance", requirePro: true });

export { enhanceDescription_post as default };
//# sourceMappingURL=enhance-description.post.mjs.map
