const fs = require('fs');
const html = fs.readFileSync('stitch_screens/documents_dashboard.html', 'utf8');
const scriptMatch = html.match(/<script id="tailwind-config">([\s\S]*?)<\/script>/);
if (scriptMatch) {
  let jsCode = scriptMatch[1].trim();
  // It has: tailwind.config = { ... }
  // Let's eval it after mocking tailwind
  let tailwind = {};
  eval(jsCode);
  const colors = tailwind.config.theme.extend.colors;
  
  let cssVars = '@theme {\n';
  for (const [key, value] of Object.entries(colors)) {
    cssVars += `  --color-${key}: ${value};\n`;
  }
  cssVars += '}\n';
  
  fs.writeFileSync('assets/css/stitch-theme.css', cssVars);
  console.log("Colors written to stitch-theme.css");
} else {
  console.log("No tailwind-config found");
}
