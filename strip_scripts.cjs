const fs = require('fs');
const glob = require('glob');

const files = [
  'pages/builder/index.vue',
  'pages/builder/templates.vue',
  'pages/builder/resume/[id].vue',
  'pages/builder/cover-letter/[id].vue'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Remove <script> tags that don't have setup (the raw ones from HTML)
  // Non-greedy match for <script> content without attributes
  content = content.replace(/<script>\s*[\s\S]*?<\/script>/g, '');
  fs.writeFileSync(file, content);
  console.log('Stripped scripts from', file);
});
