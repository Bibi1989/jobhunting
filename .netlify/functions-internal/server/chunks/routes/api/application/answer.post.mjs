import { w as withCredits, r as readBody, c as createError, g as getJobById, b as getLatestDocuments, u as useRuntimeConfig, a as createGeminiClient, d as answerApplicationQuestions, e as getGeminiModels } from '../../../nitro/nitro.mjs';
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

const answer_post = withCredits(
  async (event) => {
    var _a, _b, _c;
    const body = await readBody(event);
    let job = body == null ? void 0 : body.job;
    if ((!job || !job.title) && (body == null ? void 0 : body.jobId)) {
      const user = event.context.user;
      if (!(user == null ? void 0 : user.id)) {
        throw createError({ statusCode: 401, statusMessage: "Authentication required" });
      }
      job = await getJobById(body.jobId, user.id) || void 0;
    }
    if (!(job == null ? void 0 : job.title)) {
      throw createError({ statusCode: 400, statusMessage: "Job details are required" });
    }
    if (!((_a = body == null ? void 0 : body.questions) == null ? void 0 : _a.length)) {
      throw createError({ statusCode: 400, statusMessage: "questions are required" });
    }
    let resumeText = ((_b = body.resumeText) == null ? void 0 : _b.trim()) || "";
    let coverLetterText = ((_c = body.coverLetterText) == null ? void 0 : _c.trim()) || "";
    if (!resumeText || !coverLetterText) {
      const docs = await getLatestDocuments();
      if (!resumeText && docs.resume) resumeText = docs.resume.contentText;
      if (!coverLetterText && docs.coverLetter) coverLetterText = docs.coverLetter.contentText;
    }
    const config = useRuntimeConfig();
    const ai = createGeminiClient(config.geminiApiKey);
    const questions = await answerApplicationQuestions(
      ai,
      getGeminiModels(config.geminiModel),
      job,
      body.questions,
      resumeText || void 0,
      coverLetterText || void 0
    );
    return { questions };
  },
  { reason: "ai_application_answer", requirePro: true }
);

export { answer_post as default };
//# sourceMappingURL=answer.post.mjs.map
