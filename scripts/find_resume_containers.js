import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const stitchDir = path.resolve(__dirname, '../assets/stitch');

const files = fs.readdirSync(stitchDir).filter(f => f.endsWith('.html'));

for (const file of files) {
  const html = fs.readFileSync(path.join(stitchDir, file), 'utf-8');
  const $ = cheerio.load(html);
  
  // Let's find any element that has inline or class with "max-w-[800px]" or id containing "canvas" or class containing "canvas" or is the container for the resume.
  // We can search for elements that contain the candidate's name (e.g. h1).
  const h1s = $('h1');
  h1s.each((i, el) => {
    // Traverse up to find the container that looks like the paper sheet (usually max-w-[800px], or class with shadow, or a wrapper)
    let parent = $(el);
    let found = false;
    for (let depth = 0; depth < 10; depth++) {
      parent = parent.parent();
      if (!parent.length) break;
      const classStr = parent.attr('class') || '';
      const idStr = parent.attr('id') || '';
      if (classStr.includes('max-w-[800px]') || classStr.includes('canvas') || idStr.includes('canvas') || classStr.includes('max-w-[840px]') || classStr.includes('w-[800px]')) {
        console.log(`${file}: depth ${depth}, tag: ${parent.get(0).tagName}, id: "${idStr}", class: "${classStr.substring(0, 100)}", name inside: "${$(el).text().trim()}"`);
        found = true;
        break;
      }
    }
    if (!found) {
      // Just print the parent container of the h1
      const p = $(el).parent();
      console.log(`${file}: default parent tag: ${p.get(0).tagName}, id: "${p.attr('id') || ''}", class: "${p.attr('class') || ''}"`);
    }
  });
}
