import { l as defineEventHandler, r as readBody, c as createError, N as replaceEmDashes, M as saveUserDocument } from '../../../nitro/nitro.mjs';
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

const text_post = defineEventHandler(async (event) => {
  var _a;
  const body = await readBody(event);
  const docType = body == null ? void 0 : body.type;
  if (docType !== "resume" && docType !== "cover_letter") {
    throw createError({
      statusCode: 400,
      statusMessage: "type must be resume or cover_letter"
    });
  }
  const contentText = replaceEmDashes(((body == null ? void 0 : body.contentText) || "").trim());
  if (contentText.length < 20) {
    throw createError({
      statusCode: 400,
      statusMessage: "contentText must be at least 20 characters"
    });
  }
  const originalName = ((_a = body.originalName) == null ? void 0 : _a.trim()) || (docType === "resume" ? "tailored-resume.md" : "tailored-cover-letter.md");
  const buffer = Buffer.from(contentText, "utf8");
  const document = await saveUserDocument({
    docType,
    originalName,
    mimeType: "text/markdown",
    contentText,
    buffer
  });
  return { document };
});

export { text_post as default };
//# sourceMappingURL=text.post.mjs.map
