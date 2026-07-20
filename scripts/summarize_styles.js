import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const stitchDir = path.resolve(__dirname, '../assets/stitch');

const files = fs.readdirSync(stitchDir).filter(f => f.endsWith('.html')).sort();

for (const file of files) {
  const content = fs.readFileSync(path.join(stitchDir, file), 'utf-8');
  const match = content.match(/tailwind\.config\s*=\s*({[\s\S]*?});/);
  if (match) {
    try {
      // Find extends colors
      const configStr = match[1];
      const colorsMatch = configStr.match(/"colors"\s*:\s*({[\s\S]*?})/);
      const fontsMatch = configStr.match(/"fontFamily"\s*:\s*({[\s\S]*?})/);
      
      console.log(`\n=== ${file} Colors & Fonts ===`);
      if (colorsMatch) {
        // Find key colors like primary, secondary, background, surface, error
        const colors = JSON.parse(colorsMatch[1].replace(/'/g, '"').replace(/,(\s*})/g, '$1'));
        console.log("Colors:");
        console.log(`  primary: ${colors.primary || 'default'}`);
        console.log(`  secondary: ${colors.secondary || 'default'}`);
        console.log(`  background: ${colors.background || 'default'}`);
        console.log(`  surface: ${colors.surface || 'default'}`);
        if (colors['on-surface-variant']) console.log(`  on-surface-variant: ${colors['on-surface-variant']}`);
        if (colors['tertiary']) console.log(`  tertiary: ${colors.tertiary}`);
      }
      if (fontsMatch) {
        const fonts = JSON.parse(fontsMatch[1].replace(/'/g, '"').replace(/,(\s*})/g, '$1'));
        console.log("Fonts:");
        console.log(`  name-display: ${JSON.stringify(fonts['name-display'])}`);
        console.log(`  body-main: ${JSON.stringify(fonts['body-main'])}`);
      }
    } catch (e) {
      console.log(`${file}: failed to parse config`, e.message);
    }
  } else {
    console.log(`${file}: no tailwind config found`);
  }
}
