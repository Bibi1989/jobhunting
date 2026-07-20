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
  const tag = root.get(0).tagName;
  const id = root.attr('id') || '';
  const classes = root.attr('class') || '';
  
  console.log(`\n=== ${file} ===`);
  console.log(`Tag: <${tag} id="${id}" class="${classes.substring(0, 120)}">`);
  
  // Find major child containers
  const children = root.children();
  console.log(`Children elements (${children.length}):`);
  children.each((i, el) => {
    const childTag = el.tagName;
    const childId = $(el).attr('id') || '';
    const childClass = $(el).attr('class') || '';
    const textSnippet = $(el).text().trim().substring(0, 50).replace(/\s+/g, ' ');
    console.log(`  - <${childTag} id="${childId}" class="${childClass.substring(0, 80)}"> [text: "${textSnippet}"]`);
  });
}
