import { l as defineEventHandler, p as requireUser, G as query } from '../../../nitro/nitro.mjs';
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

function stripHtml(html) {
  return String(html || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ").trim();
}
function hasCoverLetterContent(data) {
  var _a;
  const text = stripHtml((_a = data.coverLetter) == null ? void 0 : _a.content);
  return text.length > 12 && !/^start typing/i.test(text);
}
function buildResumePreview(data) {
  const info = data.personalInfo || {};
  return {
    kind: "resume",
    fullName: info.fullName || data.name || "Untitled Resume",
    jobTitle: info.jobTitle || "",
    location: info.location || "",
    email: info.email || "",
    phone: info.phone || "",
    summary: stripHtml(info.summary).slice(0, 220),
    experience: (data.experience || []).slice(0, 3).map((exp) => ({
      title: exp.title || "",
      company: exp.company || "",
      dates: [exp.startDate, exp.isCurrent ? "Present" : exp.endDate].filter(Boolean).join(" \u2013 ")
    })),
    skills: (data.skills || []).map((s) => s.name).filter(Boolean).slice(0, 8)
  };
}
function buildCoverLetterPreview(data) {
  const info = data.personalInfo || {};
  const letter = data.coverLetter;
  return {
    kind: "cover_letter",
    fullName: info.fullName || data.name || "Cover Letter",
    jobTitle: info.jobTitle || "",
    location: info.location || "",
    email: info.email || "",
    phone: info.phone || "",
    summary: "",
    experience: [],
    skills: [],
    companyName: (letter == null ? void 0 : letter.companyName) || "",
    hiringManager: (letter == null ? void 0 : letter.hiringManager) || "",
    contentPreview: stripHtml(letter == null ? void 0 : letter.content).slice(0, 480)
  };
}
const documents_get = defineEventHandler(async (event) => {
  var _a, _b;
  await requireUser(event);
  const result = await query(
    `SELECT id, doc_type, original_name, updated_at, content_text
     FROM user_documents
     WHERE mime_type = 'application/json'
     ORDER BY updated_at DESC`
  );
  const documents = [];
  for (const row of result.rows) {
    let templateId = "";
    let parsed = null;
    try {
      parsed = JSON.parse(row.content_text);
      templateId = parsed.templateId || "";
    } catch {
    }
    const isCover = row.doc_type === "cover_letter";
    documents.push({
      id: row.id,
      type: row.doc_type,
      name: row.original_name,
      updatedAt: row.updated_at,
      templateId,
      preview: parsed ? isCover ? buildCoverLetterPreview(parsed) : buildResumePreview(parsed) : null
    });
    if (row.doc_type === "resume" && parsed && hasCoverLetterContent(parsed)) {
      const company = (_b = (_a = parsed.coverLetter) == null ? void 0 : _a.companyName) == null ? void 0 : _b.trim();
      documents.push({
        id: row.id,
        type: "cover_letter",
        name: company ? `Cover Letter \xB7 ${company}` : `${row.original_name.replace(/\s+resume$/i, "").trim() || row.original_name} \xB7 Cover Letter`,
        updatedAt: row.updated_at,
        templateId,
        preview: buildCoverLetterPreview(parsed)
      });
    }
  }
  return documents;
});

export { documents_get as default };
//# sourceMappingURL=documents.get.mjs.map
