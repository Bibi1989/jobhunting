import { l as defineEventHandler, p as requireUser, H as getRouterParam, c as createError, Y as deletePortfolioForUser } from '../../../nitro/nitro.mjs';
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
  const user = await requireUser(event);
  const id = getRouterParam(event, "id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid portfolio id" });
  }
  const removed = await deletePortfolioForUser(id, user.id);
  if (!removed) {
    throw createError({ statusCode: 404, statusMessage: "Portfolio not found" });
  }
  return { removed: true };
});

export { _id__delete as default };
//# sourceMappingURL=_id_.delete.mjs.map
