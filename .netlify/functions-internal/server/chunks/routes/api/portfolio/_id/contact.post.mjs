import { l as defineEventHandler, H as getRouterParam, c as createError, r as readBody, G as query, a0 as sendEmail } from '../../../../nitro/nitro.mjs';
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

const contact_post = defineEventHandler(async (event) => {
  var _a, _b;
  const id = getRouterParam(event, "id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid portfolio id" });
  }
  const body = await readBody(event);
  const name = String((body == null ? void 0 : body.name) || "").trim().slice(0, 120);
  const senderEmail = String((body == null ? void 0 : body.email) || "").trim().slice(0, 200);
  const message = String((body == null ? void 0 : body.message) || "").trim().slice(0, 5e3);
  if (!name) throw createError({ statusCode: 400, statusMessage: "Your name is required" });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
    throw createError({ statusCode: 400, statusMessage: "A valid email is required" });
  }
  if (message.length < 5) {
    throw createError({ statusCode: 400, statusMessage: "Please write a short message" });
  }
  const result = await query(
    `SELECT p.user_id,
            u.email AS owner_email,
            p.profile_data->>'full_name' AS full_name
       FROM portfolios p
       JOIN users u ON u.id = p.user_id
      WHERE p.id = $1`,
    [id]
  );
  const row = result.rows[0];
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: "Portfolio not found" });
  }
  const publicEmailResult = await query(
    `SELECT profile_data->>'email' AS contact_email FROM portfolios WHERE id = $1`,
    [id]
  );
  const toEmail = ((_b = (_a = publicEmailResult.rows[0]) == null ? void 0 : _a.contact_email) == null ? void 0 : _b.trim()) || row.owner_email;
  const emailResult = await sendEmail({
    to: toEmail,
    subject: `New message from your portfolio${row.full_name ? ` \u2014 ${row.full_name}` : ""}`,
    replyTo: senderEmail,
    text: [
      `You received a new message via your portfolio contact form.`,
      ``,
      `From: ${name} <${senderEmail}>`,
      ``,
      message
    ].join("\n")
  });
  try {
    await query(
      `INSERT INTO portfolio_messages (portfolio_id, sender_name, sender_email, body, delivered)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, name, senderEmail, message, emailResult.sent]
    );
  } catch (error) {
    console.warn("[contact] failed to store message:", error instanceof Error ? error.message : error);
  }
  return { ok: true, delivered: emailResult.sent };
});

export { contact_post as default };
//# sourceMappingURL=contact.post.mjs.map
