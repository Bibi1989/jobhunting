import { l as defineEventHandler, H as getRouterParam, c as createError, G as query } from '../../../../nitro/nitro.mjs';
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
  const id = getRouterParam(event, "id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid portfolio id" });
  }
  const result = await query(`SELECT * FROM portfolios WHERE id = $1`, [id]);
  const row = result.rows[0];
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: "Portfolio not found" });
  }
  return {
    portfolio: {
      id: row.id,
      userId: row.user_id,
      templateSlug: row.template_slug,
      profileData: typeof row.profile_data === "string" ? JSON.parse(row.profile_data) : row.profile_data,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at)
    }
  };
});

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
