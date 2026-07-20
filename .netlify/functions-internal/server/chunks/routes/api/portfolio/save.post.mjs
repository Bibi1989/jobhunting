import { l as defineEventHandler, p as requireUser, r as readBody, c as createError, a3 as createPortfolio, _ as sanitizeProfileData } from '../../../nitro/nitro.mjs';
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

const save_post = defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const body = await readBody(event);
  if (!isPortfolioTemplateSlug(body == null ? void 0 : body.templateSlug)) {
    throw createError({ statusCode: 400, statusMessage: "A valid templateSlug is required" });
  }
  if (!(body == null ? void 0 : body.profileData) || typeof body.profileData !== "object") {
    throw createError({ statusCode: 400, statusMessage: "profileData is missing or malformed" });
  }
  const portfolio = await createPortfolio({
    userId: user.id,
    templateSlug: body.templateSlug,
    profileData: sanitizeProfileData(body.profileData)
  });
  return { portfolio };
});

export { save_post as default };
//# sourceMappingURL=save.post.mjs.map
