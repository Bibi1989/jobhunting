import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const stitchDir = path.resolve(__dirname, '../assets/stitch');

const files = fs.readdirSync(stitchDir).filter(f => f.endsWith('.html'));

for (const file of files) {
  const content = fs.readFileSync(path.join(stitchDir, file), 'utf-8');
  // Look for something matching max-w-[800px] or resume-canvas or min-h-[1100px] or shadow-xl
  const matches = content.match(/<(div|article|section)[^>]+(max-w-\[800px\]|resume-canvas|id="resume-canvas")[^>]*>/i);
  if (matches) {
    console.log(`${file}: found container: ${matches[0].substring(0, 150)}`);
  } else {
    console.log(`${file}: NOT FOUND`);
  }
}
