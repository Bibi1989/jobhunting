const fs = require('fs');
const cheerio = require('cheerio');

function convert(htmlFile, vueFile) {
  const html = fs.readFileSync(htmlFile, 'utf8');
  const $ = cheerio.load(html);
  
  const body = $('body');
  const bodyClass = body.attr('class') || '';
  
  // Extract body inner HTML
  const innerHtml = body.html();
  
  // Create Vue component
  const vueContent = `<template>
  <div class="${bodyClass}">
    ${innerHtml}
  </div>
</template>

<script setup lang="ts">
// Converted from ${htmlFile}
</script>

<style scoped>
/* Scoped styles if any */
</style>
`;
  
  // Ensure directory exists
  const dir = vueFile.substring(0, vueFile.lastIndexOf('/'));
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(vueFile, vueContent);
  console.log(`Created ${vueFile}`);
}

convert('stitch_screens/documents_dashboard.html', 'pages/builder/index.vue');
convert('stitch_screens/template_gallery.html', 'pages/builder/templates.vue');
convert('stitch_screens/resume_editor.html', 'pages/builder/resume/[id].vue');
convert('stitch_screens/cover_letter.html', 'pages/builder/cover-letter/[id].vue');

