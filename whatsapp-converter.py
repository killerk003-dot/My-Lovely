"""
=========================================================
WHATSAPP TO JSON CONVERTER (Python Version)

Converts WhatsApp chat export (.txt) to JSON format
matching the structure used by chat-data.js

Usage:
1. Export your WhatsApp chat (without media)
2. Save it as "whatsapp-export.txt" in the same folder
3. Run: python whatsapp-converter.py
4. Output: Chat3.0.json
=========================================================
"""

import json
import re
from datetime import datetime

# Read the WhatsApp export file
with open('whatsapp-export.txt', 'r', encoding='utf-8') as f:
    input_text = f.read()

# Parse WhatsApp messages
lines = input_text.split('\n')
messages = []

# WhatsApp format: DD/MM/YYYY, HH:MM - Sender: Message
message_pattern = re.compile(r'^(\d{2}/\d{2}/\d{4}),\s(\d{2}:\d{2})\s-\s([^:]+):\s(.+)$')

for line in lines:
    match = message_pattern.match(line)
    
    if match:
        date, time, sender, content = match.groups()
        
        # Skip system messages
        if any(phrase in content for phrase in [
            'end-to-end encrypted',
            'security code changed',
            'joined using',
            'left'
        ]):
            continue
        
        # Parse date (DD/MM/YYYY)
        day, month, year = date.split('/')
        hours, minutes = time.split(':')
        
        # Create timestamp (milliseconds)
        dt = datetime(int(year), int(month), int(day), int(hours), int(minutes))
        timestamp = int(dt.timestamp() * 1000)
        
        # Check if media was omitted
        is_media = content == '<Media omitted>'
        
        message = {
            'sender_name': sender.strip(),
            'timestamp_ms': timestamp,
            'content': '' if is_media else content
        }
        
        if is_media:
            message['type'] = 'Generic'
            message['photos'] = [{'uri': 'media_omitted.jpg'}]
        
        messages.append(message)

# Create JSON structure matching Instagram format
output = {
    'participants': [
        {'name': 'Khalil Yousfi'},
        {'name': '27/09 🪨 Alps'}
    ],
    'messages': list(reversed(messages)),  # WhatsApp exports newest first, we want oldest first
    'title': 'WhatsApp Chat',
    'is_still_participant': True,
    'thread_path': 'inbox/whatsapp',
    'magic_words': []
}

# Write to Chat3.0.json
with open('Chat3.0.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

print(f'Converted {len(messages)} messages to Chat3.0.json')
if messages:
    first_date = datetime.fromtimestamp(messages[0]['timestamp_ms'] / 1000)
    last_date = datetime.fromtimestamp(messages[-1]['timestamp_ms'] / 1000)
    print(f'Date range: {first_date.strftime("%Y-%m-%d")} to {last_date.strftime("%Y-%m-%d")}')
