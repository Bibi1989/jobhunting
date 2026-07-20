import { l as defineEventHandler, r as readBody, c as createError, R as withLayoutState, S as createCoverLetterPdfDocument, T as createResumePdfDocument, U as setHeader, I as getQuery, V as renderPdfToNodeStream, W as sendStream, X as renderPdfToBuffer } from '../../../nitro/nitro.mjs';
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

function sanitizeFilename(value) {
  const base = String(value || "resume").toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
  return base.endsWith(".pdf") ? base : `${base || "resume"}.pdf`;
}
const download_post = defineEventHandler(async (event) => {
  var _a, _b;
  const body = await readBody(event);
  if (!(body == null ? void 0 : body.resume) || typeof body.resume !== "object") {
    throw createError({
      statusCode: 400,
      statusMessage: "Resume payload is required."
    });
  }
  const kind = body.kind === "cover_letter" ? "cover_letter" : "resume";
  const resume = withLayoutState({
    ...body.resume,
    templateSlug: body.templateSlug || body.resume.templateSlug || body.resume.templateId,
    templateId: body.templateSlug || body.resume.templateId || body.resume.templateSlug || "the-distinguished",
    sectionsOrder: body.sectionsOrder || body.resume.sectionsOrder
  });
  const filename = sanitizeFilename(
    body.filename || (kind === "cover_letter" ? `${((_a = resume.personalInfo) == null ? void 0 : _a.fullName) || resume.name || "cover"}-cover-letter` : `${((_b = resume.personalInfo) == null ? void 0 : _b.fullName) || resume.name || "resume"}-resume`)
  );
  const document = kind === "cover_letter" ? createCoverLetterPdfDocument(resume, body.coverLetter || resume.coverLetter) : createResumePdfDocument(resume);
  setHeader(event, "Content-Type", "application/pdf");
  setHeader(event, "Content-Disposition", `attachment; filename="${filename}"`);
  setHeader(event, "Cache-Control", "no-store");
  const preferStream = String(getQuery(event).stream || "") === "1";
  if (preferStream) {
    const stream = await renderPdfToNodeStream(document);
    return sendStream(event, stream);
  }
  const buffer = await renderPdfToBuffer(document);
  setHeader(event, "Content-Length", buffer.length);
  return buffer;
});

export { download_post as default };
//# sourceMappingURL=download.post.mjs.map
