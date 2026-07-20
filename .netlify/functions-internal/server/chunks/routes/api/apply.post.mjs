import { w as withCredits, h as readMultipartFormData, c as createError, u as useRuntimeConfig, i as createDocumentAiClient, j as generateFromPdfResume, k as generateFromJobDescriptionOnly } from '../../nitro/nitro.mjs';
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

function partText(part) {
  if (!(part == null ? void 0 : part.data)) return "";
  return Buffer.from(part.data).toString("utf8").trim();
}
function partBuffer(part) {
  if (!(part == null ? void 0 : part.data)) return null;
  return Buffer.from(part.data);
}
function isPdfPart(part, buffer) {
  var _a;
  if (!(buffer == null ? void 0 : buffer.length)) return false;
  const filename = ((_a = part == null ? void 0 : part.filename) == null ? void 0 : _a.toLowerCase()) || "";
  return filename.endsWith(".pdf") || (part == null ? void 0 : part.type) === "application/pdf" || buffer.subarray(0, 4).toString("utf8") === "%PDF";
}
const apply_post = withCredits(async (event) => {
  try {
    const form = await readMultipartFormData(event);
    if (!(form == null ? void 0 : form.length)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Expected multipart/form-data with jobDescription"
      });
    }
    const jobDescriptionPart = form.find((part) => part.name === "jobDescription");
    const resumePart = form.find((part) => part.name === "userResume" && part.filename) || form.find((part) => part.name === "resume" && part.filename);
    const coverLetterPart = form.find((part) => part.name === "userCoverLetter" && part.filename) || form.find((part) => part.name === "coverLetter" && part.filename);
    const jobDescription = partText(jobDescriptionPart);
    if (!jobDescription || jobDescription.length < 40) {
      throw createError({
        statusCode: 400,
        statusMessage: "jobDescription is required (paste a full job posting)"
      });
    }
    const apiKey = process.env.GEMINI_API_KEY || useRuntimeConfig().geminiApiKey;
    const ai = createDocumentAiClient(String(apiKey || ""));
    const resumeBuffer = partBuffer(resumePart || void 0);
    const coverBuffer = partBuffer(coverLetterPart || void 0);
    if (resumeBuffer && resumeBuffer.length > 0 && !isPdfPart(resumePart, resumeBuffer)) {
      throw createError({
        statusCode: 400,
        statusMessage: "userResume must be a PDF file"
      });
    }
    if (coverBuffer && coverBuffer.length > 0 && !isPdfPart(coverLetterPart, coverBuffer)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Cover letter upload must be a PDF file"
      });
    }
    if (resumeBuffer && isPdfPart(resumePart, resumeBuffer)) {
      if (resumeBuffer.length > 45 * 1024 * 1024) {
        throw createError({
          statusCode: 400,
          statusMessage: "PDF is too large (max ~45MB for inline Gemini upload)"
        });
      }
      const docs2 = await generateFromPdfResume({
        ai,
        jobDescription,
        pdfBuffer: resumeBuffer,
        coverLetterPdfBuffer: coverBuffer && isPdfPart(coverLetterPart, coverBuffer) ? coverBuffer : null
      });
      return {
        resume: docs2.resume,
        coverLetter: docs2.coverLetter,
        mode: "pdf",
        model: "gemini-3.1-pro-preview"
      };
    }
    const docs = await generateFromJobDescriptionOnly({
      ai,
      jobDescription
    });
    return {
      resume: docs.resume,
      coverLetter: docs.coverLetter,
      mode: "template",
      model: "gemini-3.1-pro-preview"
    };
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Document generation failed unexpectedly";
    console.error("apply.post failed:", error);
    throw createError({
      statusCode: 500,
      statusMessage: message
    });
  }
}, { reason: "ai_apply", requirePro: true });

export { apply_post as default };
//# sourceMappingURL=apply.post.mjs.map
