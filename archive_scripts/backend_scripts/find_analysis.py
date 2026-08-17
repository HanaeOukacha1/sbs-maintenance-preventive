import json
import os

transcript_path = r'C:\Users\hanae\.gemini\antigravity-ide\brain\515d06bb-ead8-41b0-92f1-b800917a4a0f\.system_generated\logs\transcript.jsonl'
with open(transcript_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for line in lines:
    try:
        data = json.loads(line)
        if data.get('type') == 'USER_INPUT':
            content = data.get('content', '')
            if 'msante' in content.lower() or 'analyse' in content.lower() or 'excel' in content.lower():
                print('--- USER MESSAGE ---')
                print(content[:1000]) # Print first 1000 chars of matching messages
    except:
        pass
