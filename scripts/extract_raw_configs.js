import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const stitchDir = path.resolve(__dirname, '../assets/stitch');

const files = fs.readdirSync(stitchDir).filter(f => f.endsWith('.html')).sort();

for (const file of files) {
  const html = fs.readFileSync(path.join(stitchDir, file), 'utf-8');
  const $ = cheerio.load(html);
  
  let configText = '';
  $('script').each((i, el) => {
    const text = $(el).text();
    if (text.includes('tailwind.config')) {
      configText = text;
    }
  });

  console.log(`\n=== ${file} ===`);
  if (configText) {
    // extract everything inside the curly braces of tailwind.config = ...
    const startIdx = configText.indexOf('{');
    const endIdx = configText.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1) {
      const configJsonStr = configText.substring(startIdx, endIdx + 1);
      // Clean up JS object to parse as JSON (keys to double quotes, single quotes to double quotes, remove trailing commas)
      try {
        // We can just use an eval-like approach or parse keys using regex
        // Let's use Function to return the config object safely
        const getConfig = new Function(`return ${configJsonStr}`);
        const config = getConfig();
        const colors = config.theme?.extend?.colors || {};
        const fonts = config.theme?.extend?.fontFamily || {};
        console.log("Colors:", Object.keys(colors).reduce((acc, k) => {
          if (['primary', 'secondary', 'tertiary', 'background', 'surface', 'on-surface', 'on-surface-variant'].includes(k)) {
            acc[k] = colors[k];
          }
          return acc;
        }, {}));
        console.log("Fonts:", fonts);
      } catch (e) {
        console.log("Could not parse config object:", e.message);
      }
    } else {
      console.log("Could not find brace bounds in script text");
    }
  } else {
    console.log("No tailwind config script found");
  }
}
