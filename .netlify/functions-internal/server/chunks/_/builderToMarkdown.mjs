function sanitizeRichTextHtml(html) {
  if (!html) return "";
  let out = html.replace(/\u00a0/g, " ").replace(/—/g, ", ").replace(/–/g, ", ");
  out = out.replace(/<span[^>]*class="[^"]*ql-ui[^"]*"[^>]*><\/span>/gi, "");
  out = out.replace(/<ol([^>]*)>([\s\S]*?)<\/ol>/gi, (_match, attrs, inner) => {
    const hasBullet = /data-list\s*=\s*["']bullet["']/i.test(inner);
    const hasOrdered = /data-list\s*=\s*["']ordered["']/i.test(inner);
    if (hasBullet && !hasOrdered) {
      const cleaned = inner.replace(/\sdata-list\s*=\s*["']bullet["']/gi, "").replace(/\sclass\s*=\s*["'][^"']*["']/gi, "");
      return `<ul${attrs}>${cleaned}</ul>`;
    }
    return `<ol${attrs}>${inner}</ol>`;
  });
  out = out.replace(/(<(?:li|p)[^>]*>)(\s*(?:<[^>]+>)*\s*)[•●▪◦‧∙·]\s+/gi, "$1$2");
  out = out.replace(/(<(?:li|p)[^>]*>)(\s*(?:<[^>]+>)*\s*)[-–—*]\s+/gi, "$1$2");
  out = out.replace(/\sstyle=(["'])(.*?)\1/gi, (match, quote, styleContent) => {
    const cleaned = styleContent.split(";").map((part) => part.trim()).filter(Boolean).filter((part) => !/^(background|background-color|color)\s*:/i.test(part)).join("; ");
    return cleaned ? ` style=${quote}${cleaned}${quote}` : "";
  });
  return out;
}
function formatResumeDateRange(start, end, isCurrent) {
  const startLabel = formatMonthYear(start);
  const endLabel = isCurrent ? "Present" : formatMonthYear(end);
  if (startLabel && endLabel) return `${startLabel}, ${endLabel}`;
  return startLabel || endLabel || "";
}
function formatMonthYear(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function decodeEntities(text) {
  return text.replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#39;/gi, "'");
}
function htmlToPlainText(html) {
  if (!html) return "";
  let text = sanitizeRichTextHtml(html);
  text = text.replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n").replace(/<li[^>]*>/gi, "").replace(/<[^>]+>/g, "");
  return decodeEntities(text).replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
function htmlToBulletLines(html) {
  if (!html) return [];
  const cleaned = sanitizeRichTextHtml(html);
  const fromLis = [...cleaned.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map(
    (m) => htmlToPlainText(m[1]).replace(/^[-*•●▪◦]\s*/, "").trim()
  ).filter(Boolean);
  if (fromLis.length) return fromLis;
  return htmlToPlainText(cleaned).split(/\n+/).map((line) => line.replace(/^[-*•●▪◦]\s*/, "").trim()).filter(Boolean);
}
function builderResumeToMarkdown(data) {
  var _a, _b, _c, _d;
  const info = data.personalInfo || {};
  const lines = [];
  lines.push(`# ${info.fullName || "Your Name"}`);
  if (info.jobTitle) lines.push(info.jobTitle);
  const contact = [
    info.location,
    info.email,
    info.phone,
    info.linkedin,
    info.portfolio,
    info.github
  ].filter(Boolean);
  if (contact.length) lines.push(contact.join(" \xB7 "));
  const summary = htmlToPlainText(info.summary);
  if (summary) {
    lines.push("", "## Summary", summary);
  }
  const skillNames = (data.skills || []).map((s) => {
    var _a2;
    return (_a2 = s.name) == null ? void 0 : _a2.trim();
  }).filter(Boolean);
  if (skillNames.length) {
    lines.push("", "## Skills");
    lines.push(skillNames.join(" \xB7 "));
  }
  if ((_a = data.experience) == null ? void 0 : _a.length) {
    lines.push("", "## Experience");
    for (const exp of data.experience) {
      const heading = [exp.title || "Role", exp.company].filter(Boolean).join(", ");
      lines.push(`### ${heading}`);
      const dates = formatResumeDateRange(exp.startDate, exp.endDate, exp.isCurrent);
      const metaParts = [exp.location, dates].filter(Boolean);
      if (metaParts.length) lines.push(`*${metaParts.join(" \xB7 ")}*`);
      for (const bullet of htmlToBulletLines(exp.description)) {
        lines.push(`- ${bullet}`);
      }
      lines.push("");
    }
  }
  if ((_b = data.projects) == null ? void 0 : _b.length) {
    lines.push("", "## Projects");
    for (const proj of data.projects) {
      lines.push(`### ${proj.title || "Project"}`);
      for (const bullet of htmlToBulletLines(proj.description)) {
        lines.push(`- ${bullet}`);
      }
      lines.push("");
    }
  }
  const education = (data.education || []).filter((edu) => {
    const degree = (edu.degree || "").trim();
    const school = (edu.school || "").trim();
    return Boolean(school || degree && degree.toLowerCase() !== "degree");
  });
  if (education.length) {
    lines.push("", "## Education");
    for (const edu of education) {
      const degree = (edu.degree || "").trim();
      const school = (edu.school || "").trim();
      const heading = [degree && degree.toLowerCase() !== "degree" ? degree : "", school].filter(Boolean).join(", ");
      lines.push(`### ${heading || "Education"}`);
      const metaParts = [edu.location, formatMonthish(edu.graduationDate)].filter(Boolean);
      if (metaParts.length) lines.push(`*${metaParts.join(" \xB7 ")}*`);
      for (const bullet of htmlToBulletLines(edu.description)) {
        lines.push(`- ${bullet}`);
      }
      lines.push("");
    }
  }
  if ((_c = data.achievements) == null ? void 0 : _c.length) {
    lines.push("", "## Credentials");
    for (const ach of data.achievements) {
      const label = [ach.title, ach.issuer, formatMonthish(ach.date)].filter(Boolean).join(" \xB7 ");
      if (label) lines.push(`- ${label}`);
      for (const bullet of htmlToBulletLines(ach.description)) {
        lines.push(`- ${bullet}`);
      }
    }
  }
  for (const section of data.customSections || []) {
    const title = (section.title || "").trim();
    if (!title || !((_d = section.items) == null ? void 0 : _d.length)) continue;
    lines.push("", `## ${title}`);
    for (const item of section.items) {
      const itemTitle = (item.title || "").trim();
      if (!itemTitle) continue;
      lines.push(`### ${itemTitle}`);
      if (item.subtitle || item.date) {
        const meta = [item.subtitle, formatMonthish(item.date)].filter(Boolean).join(" \xB7 ");
        if (meta) lines.push(`*${meta}*`);
      }
      for (const bullet of htmlToBulletLines(item.description)) {
        lines.push(`- ${bullet}`);
      }
      lines.push("");
    }
  }
  return lines.join("\n").trim();
}
function formatMonthish(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export { builderResumeToMarkdown as b };
//# sourceMappingURL=builderToMarkdown.mjs.map
