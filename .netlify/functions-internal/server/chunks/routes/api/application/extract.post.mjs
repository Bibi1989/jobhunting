import { w as withCredits, r as readBody, c as createError, g as getJobById, u as useRuntimeConfig, a as createGeminiClient, e as getGeminiModels, f as extractApplicationForm, b as getLatestDocuments, d as answerApplicationQuestions } from '../../../nitro/nitro.mjs';
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

const extract_post = withCredits(
  async (event) => {
    var _a, _b;
    const body = await readBody(event);
    let job = body == null ? void 0 : body.job;
    if ((!job || !job.title) && (body == null ? void 0 : body.jobId)) {
      const user = event.context.user;
      if (!(user == null ? void 0 : user.id)) {
        throw createError({ statusCode: 401, statusMessage: "Authentication required" });
      }
      job = await getJobById(body.jobId, user.id) || void 0;
    }
    if (!(job == null ? void 0 : job.title) || !job.url) {
      throw createError({
        statusCode: 400,
        statusMessage: "Job with title and url is required"
      });
    }
    const config = useRuntimeConfig();
    const ai = createGeminiClient(config.geminiApiKey);
    const models = getGeminiModels(config.geminiModel);
    const form = await extractApplicationForm(ai, models, job);
    if ((body == null ? void 0 : body.answer) !== false && form.questions.length > 0) {
      let resumeText = ((_a = body.resumeText) == null ? void 0 : _a.trim()) || "";
      let coverLetterText = ((_b = body.coverLetterText) == null ? void 0 : _b.trim()) || "";
      if (!resumeText || !coverLetterText) {
        const docs = await getLatestDocuments();
        if (!resumeText && docs.resume) resumeText = docs.resume.contentText;
        if (!coverLetterText && docs.coverLetter) coverLetterText = docs.coverLetter.contentText;
      }
      form.questions = await answerApplicationQuestions(
        ai,
        models,
        job,
        form.questions,
        resumeText || void 0,
        coverLetterText || void 0
      );
    }
    return { form };
  },
  { reason: "ai_application_extract", requirePro: true }
);

export { extract_post as default };
//# sourceMappingURL=extract.post.mjs.map
