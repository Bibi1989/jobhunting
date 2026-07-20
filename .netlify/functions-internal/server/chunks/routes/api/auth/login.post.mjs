import { l as defineEventHandler, r as readBody, c as createError, m as getUserByEmail, s as syncAdminRole, n as setAuthSession } from '../../../nitro/nitro.mjs';
import bcrypt from 'bcryptjs';
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

const login_post = defineEventHandler(async (event) => {
  var _a;
  const body = await readBody(event);
  const email = (_a = body == null ? void 0 : body.email) == null ? void 0 : _a.trim().toLowerCase();
  const password = (body == null ? void 0 : body.password) || "";
  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: "Email and password are required" });
  }
  const found = await getUserByEmail(email);
  if (!found) {
    throw createError({ statusCode: 401, statusMessage: "Invalid email or password" });
  }
  const ok = await bcrypt.compare(password, found.passwordHash);
  if (!ok) {
    throw createError({ statusCode: 401, statusMessage: "Invalid email or password" });
  }
  const user = await syncAdminRole(found);
  return {
    user: await setAuthSession(event, user)
  };
});

export { login_post as default };
//# sourceMappingURL=login.post.mjs.map
