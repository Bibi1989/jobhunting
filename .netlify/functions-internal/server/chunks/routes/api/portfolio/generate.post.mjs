import { w as withCredits, h as readMultipartFormData, c as createError, K as assertAllowedUpload, L as extractTextFromUpload, a1 as generatePortfolioFromText } from '../../../nitro/nitro.mjs';
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

const generate_post = withCredits(
  async (event) => {
    const form = await readMultipartFormData(event);
    if (!(form == null ? void 0 : form.length)) {
      throw createError({ statusCode: 400, statusMessage: "No file uploaded" });
    }
    const filePart = form.find((p) => p.name === "file" && p.filename);
    if (!(filePart == null ? void 0 : filePart.data) || !filePart.filename) {
      throw createError({ statusCode: 400, statusMessage: "A CV or cover letter file is required" });
    }
    const mimeType = filePart.type || "application/octet-stream";
    assertAllowedUpload(mimeType, filePart.filename);
    const buffer = Buffer.from(filePart.data);
    const documentText = await extractTextFromUpload(buffer, mimeType, filePart.filename);
    if (!documentText || documentText.length < 40) {
      throw createError({
        statusCode: 400,
        statusMessage: "Could not extract enough text from the uploaded document"
      });
    }
    const profileData = await generatePortfolioFromText(documentText);
    return { profileData };
  },
  {
    cost: 20,
    reason: "portfolio_generate",
    requirePro: true,
    proMessage: "Portfolio generation requires a Pro subscription",
    insufficientCreditsMessage: "Insufficient credits. 20 credits required."
  }
);

export { generate_post as default };
//# sourceMappingURL=generate.post.mjs.map
