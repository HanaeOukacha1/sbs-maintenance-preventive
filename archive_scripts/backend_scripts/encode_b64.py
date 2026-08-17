import base64
import os

os.makedirs('../mobile/src/utils', exist_ok=True)
with open('app/templates/template_ancfcc.docx', 'rb') as f:
    b64 = base64.b64encode(f.read()).decode('utf-8')

with open('../mobile/src/utils/templates.js', 'w', encoding='utf-8') as out:
    out.write(f'export const TEMPLATE_ANCFCC_B64 = "{b64}";\n')

print('Base64 generated successfully!')
