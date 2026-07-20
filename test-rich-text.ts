import { prepareEditorHtml, sanitizeRichTextHtml } from './utils/richText'
console.log(prepareEditorHtml('<p>test</p>'))
console.log(prepareEditorHtml('<span style="color: black">hello</span>'))
