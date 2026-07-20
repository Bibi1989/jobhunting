import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const resumesDir = path.resolve(__dirname, '../assets/stitch_resumes');

const files = fs.readdirSync(resumesDir).filter(f => f.endsWith('.html')).sort();

for (const file of files) {
  const html = fs.readFileSync(path.join(resumesDir, file), 'utf-8');
  const $ = cheerio.load(html);
  const root = $('body').children().first();
  
  console.log(`\n========================================`);
  console.log(`FILE: ${file}`);
  console.log(`ROOT TAG: <${root.get(0).tagName} class="${root.attr('class') || ''}">`);
  
  // print first 500 characters of the inner HTML
  const cleanHtml = root.html().trim().replace(/\s+/g, ' ');
  console.log(`INNER SNIPPET: ${cleanHtml.substring(0, 300)}...`);
}
