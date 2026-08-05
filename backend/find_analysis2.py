import json
import os

transcript_path = r'C:\Users\hanae\.gemini\antigravity-ide\brain\515d06bb-ead8-41b0-92f1-b800917a4a0f\.system_generated\logs\transcript.jsonl'
with open(transcript_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

messages = []
for line in lines:
    try:
        data = json.loads(line)
        if data.get('type') == 'USER_INPUT':
            content = data.get('content', '')
            messages.append(content)
    except:
        pass

for idx, msg in enumerate(messages):
    if 'msante' in msg.lower() or 'analyse' in msg.lower() or 'checklist' in msg.lower():
        print(f'--- USER MESSAGE {idx} ---')
        # Print only the user request part if it has XML tags
        if '<USER_REQUEST>' in msg:
            start = msg.find('<USER_REQUEST>') + len('<USER_REQUEST>')
            end = msg.find('</USER_REQUEST>')
            print(msg[start:end].strip())
        else:
            print(msg[:500].strip())
