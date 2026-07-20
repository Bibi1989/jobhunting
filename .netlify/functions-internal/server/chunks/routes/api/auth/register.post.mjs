import { l as defineEventHandler, r as readBody, c as createError, m as getUserByEmail, q as createUser, F as FREE_CREDITS, n as setAuthSession, v as isDatabaseError } from '../../../nitro/nitro.mjs';
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

const register_post = defineEventHandler(async (event) => {
  var _a;
  const body = await readBody(event);
  const email = (_a = body == null ? void 0 : body.email) == null ? void 0 : _a.trim().toLowerCase();
  const password = (body == null ? void 0 : body.password) || "";
  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: "Email and password are required" });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid email address" });
  }
  if (password.length < 8) {
    throw createError({ statusCode: 400, statusMessage: "Password must be at least 8 characters" });
  }
  const existing = await getUserByEmail(email);
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: "An account with this email already exists" });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const user = await createUser({
      email,
      passwordHash,
      creditsRemaining: FREE_CREDITS
    });
    return {
      user: await setAuthSession(event, user)
    };
  } catch (error) {
    console.error("[auth/register] failed:", error);
    if (isDatabaseError(error)) {
      throw createError({
        statusCode: 503,
        statusMessage: "Database unavailable. Check DATABASE_URL on the host."
      });
    }
    const message = error instanceof Error ? error.message : "Registration failed";
    throw createError({
      statusCode: 500,
      statusMessage: message.slice(0, 200)
    });
  }
});

export { register_post as default };
//# sourceMappingURL=register.post.mjs.map
