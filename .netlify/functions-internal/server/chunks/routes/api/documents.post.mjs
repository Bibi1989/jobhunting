import { l as defineEventHandler, h as readMultipartFormData, c as createError, K as assertAllowedUpload, L as extractTextFromUpload, M as saveUserDocument } from '../../nitro/nitro.mjs';
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

const documents_post = defineEventHandler(async (event) => {
  var _a;
  try {
    const form = await readMultipartFormData(event);
    if (!(form == null ? void 0 : form.length)) {
      throw createError({ statusCode: 400, statusMessage: "No file uploaded" });
    }
    const typePart = form.find((p) => p.name === "type");
    const filePart = form.find((p) => p.name === "file" && p.filename);
    const docType = ((_a = typePart == null ? void 0 : typePart.data) == null ? void 0 : _a.toString("utf8")) || "";
    if (docType !== "resume" && docType !== "cover_letter") {
      throw createError({
        statusCode: 400,
        statusMessage: "type must be resume or cover_letter"
      });
    }
    if (!(filePart == null ? void 0 : filePart.data) || !filePart.filename) {
      throw createError({ statusCode: 400, statusMessage: "file is required" });
    }
    const mimeType = filePart.type || "application/octet-stream";
    assertAllowedUpload(mimeType, filePart.filename);
    const buffer = Buffer.from(filePart.data);
    const contentText = await extractTextFromUpload(buffer, mimeType, filePart.filename);
    if (!contentText || contentText.length < 20) {
      throw createError({
        statusCode: 400,
        statusMessage: "Could not extract enough text from the uploaded file"
      });
    }
    const document = await saveUserDocument({
      docType,
      originalName: filePart.filename,
      mimeType,
      contentText,
      buffer
    });
    return { document };
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Document upload failed";
    console.error("Document upload failed:", error);
    throw createError({
      statusCode: 500,
      statusMessage: message
    });
  }
});

export { documents_post as default };
//# sourceMappingURL=documents.post.mjs.map
