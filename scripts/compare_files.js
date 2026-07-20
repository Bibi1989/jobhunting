import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const resumesDir = path.resolve(__dirname, '../assets/stitch_resumes');

const f1 = fs.readFileSync(path.join(resumesDir, 'the-researcher_resume.html'), 'utf-8');
const f2 = fs.readFileSync(path.join(resumesDir, 'the-researcher-updated_resume.html'), 'utf-8');

if (f1 === f2) {
  console.log("The files are identical.");
} else {
  console.log("The files are different. Length 1:", f1.length, "Length 2:", f2.length);
}
