import { l as defineEventHandler, p as requireUser, H as getRouterParam, c as createError, r as readBody, _ as sanitizeProfileData, $ as updatePortfolioForUser } from '../../../nitro/nitro.mjs';
import { i as isPortfolioTemplateSlug } from '../../../_/portfolio.mjs';
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
  const user = await requireUser(event);
  const id = getRouterParam(event, "id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid portfolio id" });
  }
  const body = await readBody(event);
  if (!isPortfolioTemplateSlug(body == null ? void 0 : body.templateSlug)) {
    throw createError({ statusCode: 400, statusMessage: "A valid templateSlug is required" });
  }
  if (!(body == null ? void 0 : body.profileData) || typeof body.profileData !== "object") {
    throw createError({ statusCode: 400, statusMessage: "profileData is required" });
  }
  const profileData = sanitizeProfileData(body.profileData);
  if (!profileData.full_name.trim()) {
    throw createError({ statusCode: 400, statusMessage: "Full name cannot be empty" });
  }
  const portfolio = await updatePortfolioForUser(id, user.id, {
    templateSlug: body.templateSlug,
    profileData
  });
  if (!portfolio) {
    throw createError({ statusCode: 404, statusMessage: "Portfolio not found" });
  }
  return { portfolio };
});

export { _id__put as default };
//# sourceMappingURL=_id_.put.mjs.map
