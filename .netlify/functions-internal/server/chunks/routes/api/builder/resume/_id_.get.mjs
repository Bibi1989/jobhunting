import { l as defineEventHandler, p as requireUser, H as getRouterParam, G as query, c as createError } from '../../../../nitro/nitro.mjs';
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

const _id__get = defineEventHandler(async (event) => {
  await requireUser(event);
  const id = getRouterParam(event, "id");
  const result = await query(
    `SELECT content_text, original_name, doc_type
     FROM user_documents
     WHERE id = $1 AND mime_type = 'application/json' AND doc_type IN ('resume', 'cover_letter')`,
    [id]
  );
  if (!result.rows.length) {
    throw createError({ statusCode: 404, statusMessage: "Document not found" });
  }
  const data = JSON.parse(result.rows[0].content_text);
  return {
    ...data,
    documentKind: result.rows[0].doc_type
  };
});

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
