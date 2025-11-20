# Quick Start Guide - Using Your Token

Your token: `82080a326731225710e7471fc1308c1e7a904720`

## Option 1: Simple Script (Easiest)

1. Open `send_message.py`
2. Set `CHARACTER_ID` to your character ID from character.ai
3. Run: `python send_message.py`

## Option 2: Using the Test Script

1. Open `test_with_token.py`
2. Uncomment the example code at the bottom
3. Fill in `CHARACTER_ID` and `CREATOR_ID`
4. Run: `python test_with_token.py`

## How to Get Character ID

1. Go to [character.ai](https://character.ai)
2. Open any character's chat
3. Look at the URL: `character.ai/chat?char=CHARACTER_ID`
4. Copy the `CHARACTER_ID` part

## HTTP Request Examples

### Chat V1 (HTTP POST)
```python
import requests

token = "82080a326731225710e7471fc1308c1e7a904720"
url = "https://plus.character.ai/chat/streaming/"

headers = {
    "Authorization": f"Token {token}",
    "Content-Type": "application/json"
}

payload = {
    "history_external_id": "CHAT_ID",
    "text": "Hello!",
    "tgt": "TGT_ID"
}

response = requests.post(url, headers=headers, json=payload)
print(response.json())
```

### Chat V2 (WebSocket - Recommended)
```python
import websocket
import json
import uuid

token = "82080a326731225710e7471fc1308c1e7a904720"
ws = websocket.WebSocketApp(
    "wss://neo.character.ai/ws/",
    header=[f'Cookie: HTTP_AUTHORIZATION="Token {token}"']
)

# Connect and send message
ws.send(json.dumps({
    "command": "create_and_generate_turn",
    "payload": {
        "character_id": "CHARACTER_ID",
        "turn": {
            "turn_key": {"chat_id": "CHAT_ID"},
            "author": {},
            "candidates": [{"raw_content": "Hello!"}]
        }
    }
}))
```

## Files Created

- `send_message.py` - Simple script, just set CHARACTER_ID and run
- `test_with_token.py` - Full test script with examples
- `example_requests.py` - Complete library of functions
- `characterai_requests.md` - Full API documentation

## Notes

- Token is already set in all scripts
- Chat V2 (WebSocket) is the newer, recommended API
- Chat V1 (HTTP POST) is the legacy API but still works
- You need a Character ID to send messages
- Creator ID can usually be any string (try "1" if unsure)



