import { p as defineNuxtRouteMiddleware, a as useSaaS, q as executeAsync, n as navigateTo } from './server.mjs';
import 'vue';
import '../nitro/nitro.mjs';
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
import 'unhead';
import '@unhead/shared';
import 'vue-router';
import 'vue/server-renderer';

const auth = defineNuxtRouteMiddleware(async (to) => {
  let __temp, __restore;
  const { loggedIn, fetchSession, sessionReady, apiBackend } = useSaaS();
  if (apiBackend.value === "fastapi" || !sessionReady.value || !loggedIn.value) {
    [__temp, __restore] = executeAsync(() => fetchSession()), await __temp, __restore();
  }
  if (!loggedIn.value) {
    return navigateTo({
      path: "/login",
      query: { redirect: to.fullPath }
    });
  }
});

export { auth as default };
//# sourceMappingURL=auth-C7kj7g4t.mjs.map
