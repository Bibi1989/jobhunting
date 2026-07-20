import { l as defineEventHandler, p as requireUser, a2 as listPortfoliosByUser } from '../../nitro/nitro.mjs';
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

const index_get = defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const portfolios = await listPortfoliosByUser(user.id);
  return { portfolios };
});

export { index_get as default };
//# sourceMappingURL=index2.get.mjs.map
