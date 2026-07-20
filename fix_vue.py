import os
import glob
import re

files = glob.glob('components/portfolio/templates/*.vue')

for file in files:
    with open(file, 'r') as f:
        content = f.read()

    # We are looking for something like:
    # {{ data.button_texts?.something || '<a\n ... \n</a>'.replace(/<[^>]+>/g, '').trim() }}
    
    # We can just match the || ' ... '.replace
    # Note that there could be single quotes inside the string.
    
    def replacer(match):
        prefix = match.group(1)
        raw_html = match.group(2)
        suffix = match.group(3)
        # return it using backticks
        # escape backticks in raw_html
        raw_html = raw_html.replace('`', '\\`')
        return f"{prefix}`{raw_html}`{suffix}"
    
    # Match data.button_texts?.name || 'MULTILINE STRING'.replace
    pattern = r"(\{\{\s*data\.(?:button_texts|section_titles)\?\.[a-zA-Z_]+\s*\|\|\s*)'([\s\S]*?)'(\.replace\(/<\[\^>\]\+>/g, ''\)\.trim\(\)\s*\}\})"
    
    new_content = re.sub(pattern, replacer, content)
    
    if new_content != content:
        with open(file, 'w') as f:
            f.write(new_content)
        print(f"Fixed {file}")

print("Done")
