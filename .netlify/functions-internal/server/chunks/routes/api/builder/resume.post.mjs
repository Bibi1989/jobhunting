import { l as defineEventHandler, p as requireUser, r as readBody, G as query } from '../../../nitro/nitro.mjs';
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

const resume_post = defineEventHandler(async (event) => {
  await requireUser(event);
  const body = await readBody(event);
  const documentKind = body.documentKind === "cover_letter" ? "cover_letter" : "resume";
  const { documentKind: _omit, ...data } = body;
  const content = JSON.stringify(data);
  const name = body.name || (documentKind === "cover_letter" ? "Untitled Cover Letter" : "Untitled Resume");
  const result = await query(
    `INSERT INTO user_documents (doc_type, original_name, mime_type, content_text)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [documentKind, name, "application/json", content]
  );
  return { id: result.rows[0].id };
});

export { resume_post as default };
//# sourceMappingURL=resume.post.mjs.map
