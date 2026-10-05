# WhatsApp Chat Conversion Instructions

## Step 1: Export WhatsApp Chat

1. Open WhatsApp on your **phone** (most reliable method)
2. Open the chat with Ilham
3. Tap the **three dots** (⋮) or the contact name at the top
4. Select **"More" → "Export chat"**
5. Choose **"Without media"** (this keeps the file smaller)
6. Send the file to yourself via email or save to cloud storage
7. Download it on your computer into the `My lovely` folder
8. Rename the file to `whatsapp-export.txt`

## Step 2: Run the Converter

Open a terminal in the `My lovely` folder and run:

```bash
python whatsapp-converter.py
```

This will create `Chat3.0.json` automatically.

## Step 3: Verify the Output

The script will show you:
- ✅ Number of messages converted
- 📅 Date range of the chat

## Step 4: Test on Your Website

1. Open `conversations.html` in your browser
2. The page should now load messages from all three sources:
   - Discord (Chat.json)
   - Instagram (Chat2.0.json)
   - WhatsApp (Chat3.0.json)

## Troubleshooting

**If you get "python: command not found":**
- You need to install Python from https://www.python.org/downloads/
- On Windows, the Microsoft Store version is the simplest, or tick "Add Python to PATH" during install
- Restart your terminal and try again

**If the date format is different in your WhatsApp export:**
- Open `whatsapp-converter.py` and adjust the `message_pattern` regex
- Your format should be: `23/06/2026, 13:38 - Khalil Yousfi: Message`

**If participant names don't match:**
- The script will use whatever names appear in the WhatsApp export
- Make sure `shared.js` recognizes both "Khalil Yousfi" and "27/09 🪨 Alps" (or update the aliases)

## What Gets Converted

✅ **Included:**
- Text messages
- Timestamps
- Sender names
- Media markers (shown as attachments)

❌ **Excluded:**
- System messages (encryption notices, group changes)
- Actual media files (only markers are kept)
- Deleted messages
- Voice notes (marked as media)

## Note on Sender Names

Based on your export, the two participants are:
- **Khalil Yousfi** (recognized as "khalil" in shared.js)
- **27/09 🪨 Alps** (needs to be added to Ilham's aliases)

You may want to update the aliases in `shared.js` to recognize "27/09 🪨 Alps" as "ilham".
</contents>