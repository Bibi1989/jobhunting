const fs = require('fs')
const glob = require('glob')

const files = glob.sync('components/portfolio/templates/*.vue')

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8')
  // Find {{ data.button_texts?.some_key || '...'... }} where the string spans multiple lines
  // We'll use a replacer function
  const regex = /\{\{\s*data\.button_texts\?\.([a-zA-Z_]+)\s*\|\|\s*'([\s\S]*?)'\.replace\(\/<\[\^>\]\+>\/g,\s*''\)\.trim\(\)\s*\}\}/g;
  
  content = content.replace(regex, (match, key, rawHtml) => {
    // Strip HTML and trim
    const cleanText = rawHtml.replace(/<[^>]+>/g, '').trim().replace(/'/g, "\\'")
    return `{{ data.button_texts?.${key} || '${cleanText}' }}`
  })

  // Also catch section_titles
  const regex2 = /\{\{\s*data\.section_titles\?\.([a-zA-Z_]+)\s*\|\|\s*'([\s\S]*?)'\.replace\(\/<\[\^>\]\+>\/g,\s*''\)\.trim\(\)\s*\}\}/g;
  content = content.replace(regex2, (match, key, rawHtml) => {
    const cleanText = rawHtml.replace(/<[^>]+>/g, '').trim().replace(/'/g, "\\'")
    return `{{ data.section_titles?.${key} || '${cleanText}' }}`
  })

  fs.writeFileSync(file, content)
}
console.log("Fixed files!")
