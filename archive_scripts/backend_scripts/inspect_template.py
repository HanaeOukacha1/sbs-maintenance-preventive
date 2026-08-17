import os
import sys
sys.path.append(os.getcwd())
from docxtpl import DocxTemplate

doc = DocxTemplate('app/templates/template_ancfcc.docx')
print('Variables dans le template:', doc.get_undeclared_template_variables())
