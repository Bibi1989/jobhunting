import { l as defineEventHandler, p as requireUser, H as getRouterParam, c as createError, Z as getPortfolioForUser } from '../../../nitro/nitro.mjs';
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
  const user = await requireUser(event);
  const id = getRouterParam(event, "id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid portfolio id" });
  }
  const portfolio = await getPortfolioForUser(id, user.id);
  if (!portfolio) {
    throw createError({ statusCode: 404, statusMessage: "Portfolio not found" });
  }
  return { portfolio };
});

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
