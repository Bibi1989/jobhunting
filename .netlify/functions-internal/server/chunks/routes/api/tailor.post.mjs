import { w as withCredits, r as readBody, c as createError, g as getJobById, b as getLatestDocuments, ae as normalizeCandidateProfile, af as resolveCandidateProfileSync, ag as hasUsableIdentity, u as useRuntimeConfig, a as createGeminiClient, ah as tailorApplicationMaterials, e as getGeminiModels, ai as stampCandidateIdentity, N as replaceEmDashes, aj as enforceExperienceBullets } from '../../nitro/nitro.mjs';
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

const tailor_post = withCredits(async (event) => {
  var _a, _b, _c, _d;
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
  let resumeText = ((_a = body.resumeText) == null ? void 0 : _a.trim()) || "";
  let coverLetterText = ((_b = body.coverLetterText) == null ? void 0 : _b.trim()) || "";
  if (body.useSavedDocuments !== false && (!resumeText || !coverLetterText)) {
    const docs = await getLatestDocuments();
    if (!resumeText && docs.resume) resumeText = docs.resume.contentText;
    if (!coverLetterText && docs.coverLetter) coverLetterText = docs.coverLetter.contentText;
  }
  const formProfile = normalizeCandidateProfile({
    ...body.candidateProfile,
    skillsText: (_c = body.candidateProfile) == null ? void 0 : _c.skillsText,
    experienceText: (_d = body.candidateProfile) == null ? void 0 : _d.experienceText
  });
  const candidateProfile = resolveCandidateProfileSync({
    resumeText,
    candidateProfile: formProfile
  });
  if (!resumeText && !hasUsableIdentity(candidateProfile)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Upload a CV or fill in your name, email, phone, and location before generating."
    });
  }
  const config = useRuntimeConfig();
  const ai = createGeminiClient(config.geminiApiKey);
  const tailored = await tailorApplicationMaterials(
    ai,
    getGeminiModels(config.geminiModel),
    job,
    resumeText || void 0,
    coverLetterText || void 0,
    body.cvFormat,
    candidateProfile
  );
  return {
    resume: stampCandidateIdentity(
      enforceExperienceBullets(replaceEmDashes(tailored.resume)),
      candidateProfile
    ),
    coverLetter: stampCandidateIdentity(
      replaceEmDashes(tailored.coverLetter),
      candidateProfile
    ),
    cvFormat: body.cvFormat || "classic-professional",
    profile: {
      fullName: candidateProfile.fullName,
      email: candidateProfile.email,
      phone: candidateProfile.phone,
      location: candidateProfile.location
    }
  };
}, { reason: "ai_tailor", requirePro: true });

export { tailor_post as default };
//# sourceMappingURL=tailor.post.mjs.map
