import { l as defineEventHandler, p as requireUser, H as getRouterParam, I as getQuery, c as createError, O as deleteJob } from '../../../nitro/nitro.mjs';
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
  const queryParams = getQuery(event);
  const url = typeof queryParams.url === "string" ? queryParams.url : void 0;
  if (!id && !url) {
    throw createError({ statusCode: 400, statusMessage: "Job id or url is required" });
  }
  try {
    const deleted = await deleteJob({
      userId: user.id,
      id: id && id !== "by-url" ? id : void 0,
      url
    });
    return { ok: true, deleted };
  } catch (error) {
    console.warn(
      "Could not delete job from database:",
      error instanceof Error ? error.message : error
    );
    return { ok: true, deleted: false, localOnly: true };
  }
});

export { _id__delete as default };
//# sourceMappingURL=_id_.delete.mjs.map
