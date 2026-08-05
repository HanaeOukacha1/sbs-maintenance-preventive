import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

transcript_path = r'C:\Users\hanae\.gemini\antigravity-ide\brain\515d06bb-ead8-41b0-92f1-b800917a4a0f\.system_generated\logs\transcript_full.jsonl'
with open(transcript_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    try:
        data = json.loads(line)
        if data.get('type') == 'USER_INPUT':
            content = data.get('content', '')
            if 'msante' in content.lower():
                print(f'--- USER MESSAGE {idx} ---')
                start = content.find('<USER_REQUEST>') + len('<USER_REQUEST>')
                end = content.find('</USER_REQUEST>')
                if start > -1 and end > -1:
                    print(content[start:end].strip())
                else:
                    print(content.strip())
    except Exception as e:
        pass
