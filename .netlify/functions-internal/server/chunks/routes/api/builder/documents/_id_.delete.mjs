import { l as defineEventHandler, p as requireUser, H as getRouterParam, I as getQuery, c as createError, G as query } from '../../../../nitro/nitro.mjs';
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

const _id__delete = defineEventHandler(async (event) => {
  await requireUser(event);
  const id = getRouterParam(event, "id");
  const type = String(getQuery(event).type || "").trim();
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Document id is required" });
  }
  if (type !== "resume" && type !== "cover_letter") {
    throw createError({
      statusCode: 400,
      statusMessage: "type must be resume or cover_letter"
    });
  }
  const result = await query(`SELECT id, doc_type, content_text FROM user_documents WHERE id = $1`, [id]);
  const row = result.rows[0];
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: "Document not found" });
  }
  if (type === "cover_letter" && row.doc_type === "resume") {
    let parsed;
    try {
      parsed = JSON.parse(row.content_text);
    } catch {
      throw createError({ statusCode: 400, statusMessage: "Invalid document content" });
    }
    delete parsed.coverLetter;
    await query(
      `UPDATE user_documents
       SET content_text = $2, updated_at = NOW()
       WHERE id = $1`,
      [id, JSON.stringify(parsed)]
    );
    return { deleted: "cover_letter", id };
  }
  if (type === "resume" || row.doc_type === "cover_letter" || type === "cover_letter") {
    await query(`DELETE FROM user_documents WHERE id = $1`, [id]);
    return { deleted: type, id };
  }
  throw createError({ statusCode: 400, statusMessage: "Unable to delete document" });
});

export { _id__delete as default };
//# sourceMappingURL=_id_.delete.mjs.map
