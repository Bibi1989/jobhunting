import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const stitchDir = path.resolve(__dirname, '../assets/stitch');
const destDir = path.resolve(__dirname, '../assets/stitch_resumes');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const files = fs.readdirSync(stitchDir).filter(f => f.endsWith('.html'));

function findResumeContainer($, file) {
  // Try id="cv-canvas" or id="resume-canvas"
  let el = $('#cv-canvas, #resume-canvas');
  if (el.length) return el;

  // Try classes with canvas, or max-w-[800px], or max-w-[850px]
  el = $('.resume-canvas, .cv-canvas, .max-w-\\[800px\\], .max-w-\\[850px\\]');
  if (el.length) return el.first();

  // Find container containing h1 and is inside <main> or is a direct child of some content section
  // Let's traverse up from the first h1
  const h1 = $('h1').first();
  if (h1.length) {
    let parent = h1;
    for (let i = 0; i < 6; i++) {
      const nextParent = parent.parent();
      if (!nextParent.length || nextParent.is('body') || nextParent.is('html')) {
        return parent;
      }
      const classStr = nextParent.attr('class') || '';
      // If parent has a shadow class, or max-w-..., or is a main container
      if (classStr.includes('max-w-') || classStr.includes('shadow') || classStr.includes('bg-white') || nextParent.is('main')) {
        return nextParent;
      }
      parent = nextParent;
    }
    return parent;
  }
  return null;
}

for (const file of files) {
  const html = fs.readFileSync(path.join(stitchDir, file), 'utf-8');
  const $ = cheerio.load(html);
  const container = findResumeContainer($, file);
  
  if (container && container.length) {
    fs.writeFileSync(path.join(destDir, `${path.basename(file, '.html')}_resume.html`), $.html(container));
    console.log(`Extracted resume container for ${file}`);
  } else {
    console.log(`Could not find resume container for ${file}`);
  }
}
