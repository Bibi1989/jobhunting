import { w as withCredits, r as readBody, c as createError, b as getLatestDocuments, a4 as hasScrapeTarget, u as useRuntimeConfig, a as createGeminiClient, e as getGeminiModels, a5 as fetchPageHtml, a6 as cleanHtmlForExtraction, a7 as shouldUseSearchFallback, a8 as searchJobsForUrl, a9 as extractJobsFromHtml, aa as filterJobsByTarget, ab as enrichJobsWithFullDescriptions, ac as createScrapeRun, ad as upsertJobs } from '../../nitro/nitro.mjs';
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

const scrape_post = withCredits(
  async (event) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const body = await readBody(event);
    const url = (_a = body == null ? void 0 : body.url) == null ? void 0 : _a.trim();
    const jobTitle = ((_b = body == null ? void 0 : body.jobTitle) == null ? void 0 : _b.trim()) || "";
    if (!url) {
      throw createError({ statusCode: 400, statusMessage: "URL is required" });
    }
    let target = null;
    if ((body == null ? void 0 : body.useResume) || (body == null ? void 0 : body.useCoverLetter) || jobTitle) {
      const docs = await getLatestDocuments();
      if (body.useResume && !((_d = (_c = docs.resume) == null ? void 0 : _c.contentText) == null ? void 0 : _d.trim())) {
        throw createError({
          statusCode: 400,
          statusMessage: "No resume uploaded. Upload a resume or uncheck \u201CUse resume\u201D."
        });
      }
      if (body.useCoverLetter && !((_f = (_e = docs.coverLetter) == null ? void 0 : _e.contentText) == null ? void 0 : _f.trim())) {
        throw createError({
          statusCode: 400,
          statusMessage: "No cover letter uploaded. Upload a cover letter or uncheck \u201CUse cover letter\u201D."
        });
      }
      target = {
        jobTitle: jobTitle || void 0,
        resumeText: body.useResume ? (_g = docs.resume) == null ? void 0 : _g.contentText : void 0,
        coverLetterText: body.useCoverLetter ? (_h = docs.coverLetter) == null ? void 0 : _h.contentText : void 0
      };
      if (!hasScrapeTarget(target)) {
        target = null;
      }
    }
    const config = useRuntimeConfig();
    const ai = createGeminiClient(config.geminiApiKey);
    const models = getGeminiModels(config.geminiModel);
    const { html, isError, statusText, status, finalUrl } = await fetchPageHtml(url);
    const cleanedHtml = isError ? "" : cleanHtmlForExtraction(html, finalUrl);
    let jobs = [];
    let usedSearch = false;
    if (shouldUseSearchFallback(isError, cleanedHtml, status)) {
      usedSearch = true;
      const reason = isError ? `fetch failed: ${statusText}` : `page unusable (${statusText})`;
      jobs = await searchJobsForUrl(ai, models, finalUrl, reason, target);
    } else {
      jobs = await extractJobsFromHtml(ai, models, cleanedHtml, finalUrl, target);
      if (jobs.length === 0) {
        usedSearch = true;
        jobs = await searchJobsForUrl(
          ai,
          models,
          finalUrl,
          "no jobs found in page HTML (likely JavaScript-rendered)",
          target
        );
      }
    }
    if (hasScrapeTarget(target) && jobs.length > 0) {
      jobs = await filterJobsByTarget(ai, models, jobs, target);
    }
    jobs = await enrichJobsWithFullDescriptions(ai, models, jobs, finalUrl);
    const user = event.context.user;
    if (!(user == null ? void 0 : user.id)) {
      throw createError({ statusCode: 401, statusMessage: "Authentication required" });
    }
    const scrapeRunId = await createScrapeRun({
      userId: user.id,
      sourceUrl: url,
      finalUrl,
      usedSearch,
      sourceStatus: statusText,
      jobCount: jobs.length
    });
    const savedJobs = await upsertJobs(jobs, scrapeRunId, url, user.id);
    return {
      jobs: savedJobs,
      meta: {
        count: savedJobs.length,
        usedSearch,
        targeted: Boolean(hasScrapeTarget(target)),
        targetJobTitle: jobTitle || null,
        sourceStatus: statusText,
        scrapeRunId,
        enriched: savedJobs.filter((j) => j.descriptionSource === "detail_page").length
      }
    };
  },
  { reason: "job_scrape" }
);

export { scrape_post as default };
//# sourceMappingURL=scrape.post.mjs.map
