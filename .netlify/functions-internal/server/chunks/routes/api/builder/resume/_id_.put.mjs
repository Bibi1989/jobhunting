import { l as defineEventHandler, p as requireUser, H as getRouterParam, r as readBody, G as query } from '../../../../nitro/nitro.mjs';
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

const _id__put = defineEventHandler(async (event) => {
  await requireUser(event);
  const id = getRouterParam(event, "id");
  const body = await readBody(event);
  const { documentKind: _omit, ...data } = body;
  const content = JSON.stringify(data);
  const name = body.name || "Untitled Document";
  await query(
    `UPDATE user_documents
     SET original_name = $1, content_text = $2, updated_at = NOW()
     WHERE id = $3 AND mime_type = 'application/json' AND doc_type IN ('resume', 'cover_letter')`,
    [name, content, id]
  );
  return { success: true };
});

export { _id__put as default };
//# sourceMappingURL=_id_.put.mjs.map
