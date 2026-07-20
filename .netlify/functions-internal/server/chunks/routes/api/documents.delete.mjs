import { l as defineEventHandler, I as getQuery, r as readBody, c as createError, J as deleteUserDocument } from '../../nitro/nitro.mjs';
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

const documents_delete = defineEventHandler(async (event) => {
  const queryParams = getQuery(event);
  const body = await readBody(event).catch(() => null) || {};
  const docType = body.type || queryParams.type || "";
  if (docType !== "resume" && docType !== "cover_letter") {
    throw createError({
      statusCode: 400,
      statusMessage: "type must be resume or cover_letter"
    });
  }
  const result = await deleteUserDocument(docType);
  return result;
});

export { documents_delete as default };
//# sourceMappingURL=documents.delete.mjs.map
