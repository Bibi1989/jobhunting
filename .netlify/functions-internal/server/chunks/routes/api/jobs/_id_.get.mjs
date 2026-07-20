import { l as defineEventHandler, p as requireUser, H as getRouterParam, c as createError, g as getJobById } from '../../../nitro/nitro.mjs';
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
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Job id is required" });
  }
  const job = await getJobById(id, user.id);
  if (!job) {
    throw createError({ statusCode: 404, statusMessage: "Job not found" });
  }
  return { job };
});

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
