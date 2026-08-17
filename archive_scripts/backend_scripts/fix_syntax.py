import os
import sys

file_path = r'c:\Users\hanae\Desktop\Stage PFA 2026\mobile\src\app\mission\[id].tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    code = f.read()

bad_url = 'const url = api.defaults.baseURL + /missions/\/export;'
good_url = 'const url = api.defaults.baseURL + "/missions/" + mission.id + "/export";'
code = code.replace(bad_url, good_url)

bad_uri = r'const fileUri = FileSystem.documentDirectory + Rapport_Mission_\.xlsx;'
good_uri = 'const fileUri = FileSystem.documentDirectory + "Rapport_Mission_" + mission.id + ".xlsx";'
code = code.replace(bad_uri, good_uri)

bad_auth = '{ headers: { Authorization: Bearer \ } }'
good_auth = '{ headers: { Authorization: "Bearer " + token } }'
code = code.replace(bad_auth, good_auth)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Fixed syntax in [id].tsx")
