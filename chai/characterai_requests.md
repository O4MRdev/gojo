# CharacterAI HTTP Requests Guide

This document explains how to send messages to CharacterAI using direct HTTP requests, based on the [kramcat/CharacterAI](https://github.com/kramcat/CharacterAI) library implementation.

## Authentication

### Get Token (Guest)
```http
POST https://beta.character.ai/chat/auth/lazy/
Content-Type: application/json

{
  "lazy_uuid": "<uuid-v1>"
}
```

**Response:**
```json
{
  "token": "YOUR_TOKEN_HERE"
}
```

### Get Token (Email Login)
1. Send verification code:
```http
POST https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=AIzaSyAbLy_s6hJqVNr2ZN0UHHiCbJX1X8smTws
Content-Type: application/json

{
  "requestType": "EMAIL_SIGNIN",
  "email": "your@email.com",
  "clientType": "CLIENT_TYPE_WEB",
  "continueUrl": "https://beta.character.ai",
  "canHandleCodeInApp": true
}
```

2. Authenticate with email link (after clicking link in email)
3. Exchange Firebase token for CharacterAI token:
```http
POST https://beta.character.ai/dj-rest-auth/google_idp/
Content-Type: application/json

{
  "id_token": "<firebase_id_token>"
}
```

**Response:**
```json
{
  "key": "YOUR_TOKEN_HERE"
}
```

---

## Chat V1 API (Legacy - HTTP POST)

### Base URL
```
https://plus.character.ai/
```

### Send Message
```http
POST https://plus.character.ai/chat/streaming/
Authorization: Token YOUR_TOKEN_HERE
Content-Type: application/json

{
  "history_external_id": "CHAT_ID",
  "text": "Your message text here",
  "tgt": "CHARACTER_TGT_ID"
}
```

**Parameters:**
- `history_external_id`: The chat/room ID
- `text`: Your message text
- `tgt`: The character's target ID (old format)
- `primary_msg_uuid` (optional): UUID to reply to a specific message

**Response:**
```json
{
  "status": "OK",
  "replies": [
    {
      "text": "Character's response",
      "uuid": "message-uuid",
      ...
    }
  ],
  ...
}
```

### Create New Chat
```http
POST https://plus.character.ai/chat/history/create/
Authorization: Token YOUR_TOKEN_HERE
Content-Type: application/json

{
  "character_external_id": "CHARACTER_ID"
}
```

### Get Chat History
```http
POST https://plus.character.ai/chat/history/continue/
Authorization: Token YOUR_TOKEN_HERE
Content-Type: application/json

{
  "character_external_id": "CHARACTER_ID",
  "history_external_id": "CHAT_ID"
}
```

### Get Chat Messages
```http
GET https://plus.character.ai/chat/history/msgs/user/?history_external_id=CHAT_ID
Authorization: Token YOUR_TOKEN_HERE
```

### Generate Alternative Response
```http
POST https://plus.character.ai/chat/streaming/
Authorization: Token YOUR_TOKEN_HERE
Content-Type: application/json

{
  "history_external_id": "CHAT_ID",
  "parent_msg_uuid": "MESSAGE_UUID",
  "tgt": "CHARACTER_TGT_ID"
}
```

---

## Chat V2 API (New - WebSocket)

### WebSocket Connection
```
wss://neo.character.ai/ws/
```

**Headers:**
```
Cookie: HTTP_AUTHORIZATION="Token YOUR_TOKEN_HERE"
```

### Send Message (WebSocket)
Connect to the WebSocket and send:

```json
{
  "command": "create_and_generate_turn",
  "payload": {
    "character_id": "CHARACTER_ID",
    "turn": {
      "turn_key": {
        "chat_id": "CHAT_ID"
      },
      "author": {},
      "candidates": [
        {
          "raw_content": "Your message text here",
          "tti_image_rel_path": null
        }
      ]
    }
  }
}
```

**Response (streaming):**
The WebSocket will send multiple messages. Wait for a message where:
- `turn.author.author_id` is NOT a digit (meaning it's from the character)
- `turn.candidates[0].is_final` exists (meaning generation is complete)

```json
{
  "turn": {
    "turn_key": {
      "chat_id": "CHAT_ID",
      "turn_id": "TURN_ID"
    },
    "author": {
      "author_id": "CHARACTER_ID",
      "name": "Character Name"
    },
    "candidates": [
      {
        "raw_content": "Character's response",
        "is_final": true,
        ...
      }
    ]
  }
}
```

### Create New Chat (WebSocket)
```json
{
  "command": "create_chat",
  "payload": {
    "chat": {
      "chat_id": "UUID_OR_CUSTOM_ID",
      "creator_id": "YOUR_USER_ID",
      "visibility": "VISIBILITY_PRIVATE",
      "character_id": "CHARACTER_ID",
      "type": "TYPE_ONE_ON_ONE"
    },
    "with_greeting": true
  }
}
```

**Response:**
First response contains the chat data, second response contains the greeting message.

### Generate Alternative Response (WebSocket)
```json
{
  "command": "generate_turn_candidate",
  "payload": {
    "tts_enabled": false,
    "selected_language": "English",
    "character_id": "CHARACTER_ID",
    "turn_key": {
      "turn_id": "TURN_ID",
      "chat_id": "CHAT_ID"
    }
  }
}
```

### Edit Message (WebSocket)
```json
{
  "command": "edit_turn_candidate",
  "payload": {
    "turn_key": {
      "chat_id": "CHAT_ID",
      "turn_id": "TURN_ID"
    },
    "new_candidate_raw_content": "New message text"
  }
}
```

### Delete Message (WebSocket)
```json
{
  "command": "remove_turns",
  "payload": {
    "chat_id": "CHAT_ID",
    "turn_ids": ["TURN_ID_1", "TURN_ID_2"]
  }
}
```

---

## Chat V2 API (New - HTTP REST)

### Base URL
```
https://neo.character.ai/
```

### Get Chat Histories
```http
GET https://neo.character.ai/chats/?character_ids=CHARACTER_ID&num_preview_turns=2
Authorization: Token YOUR_TOKEN_HERE
```

### Get Recent Chat
```http
GET https://neo.character.ai/chats/recent/CHARACTER_ID
Authorization: Token YOUR_TOKEN_HERE
```

### Get Chat History
```http
GET https://neo.character.ai/turns/CHAT_ID/
Authorization: Token YOUR_TOKEN_HERE
```

### Pin Message
```http
POST https://neo.character.ai/turn/pin
Authorization: Token YOUR_TOKEN_HERE
Content-Type: application/json

{
  "is_pinned": true,
  "turn_key": {
    "chat_id": "CHAT_ID",
    "turn_id": "TURN_ID"
  }
}
```

---

## Important Notes

1. **Token Format**: Always use `Authorization: Token YOUR_TOKEN` header format
2. **User-Agent**: The library uses `curl_cffi` with Chrome 120 impersonation. You may need to set a proper User-Agent header
3. **Chat V1 vs V2**: 
   - V1 uses HTTP POST requests to `plus.character.ai`
   - V2 uses WebSocket for real-time messaging to `neo.character.ai/ws/`
4. **Error Handling**: Check for `status: "OK"` in responses. Errors may be in `error` field or `comment` field for WebSocket
5. **Streaming**: Chat V2 WebSocket sends multiple messages during generation. Wait for `is_final: true` in candidates

---

## Example: Complete Flow (Chat V2)

1. **Get Token** (Guest):
```bash
curl -X POST https://beta.character.ai/chat/auth/lazy/ \
  -H "Content-Type: application/json" \
  -d '{"lazy_uuid": "generated-uuid-v1"}'
```

2. **Connect WebSocket**:
```javascript
const ws = new WebSocket('wss://neo.character.ai/ws/', {
  headers: {
    'Cookie': 'HTTP_AUTHORIZATION="Token YOUR_TOKEN"'
  }
});
```

3. **Create Chat**:
```javascript
ws.send(JSON.stringify({
  command: 'create_chat',
  payload: {
    chat: {
      chat_id: 'unique-chat-id',
      creator_id: 'YOUR_USER_ID',
      visibility: 'VISIBILITY_PRIVATE',
      character_id: 'CHARACTER_ID',
      type: 'TYPE_ONE_ON_ONE'
    },
    with_greeting: true
  }
}));
```

4. **Send Message**:
```javascript
ws.send(JSON.stringify({
  command: 'create_and_generate_turn',
  payload: {
    character_id: 'CHARACTER_ID',
    turn: {
      turn_key: {
        chat_id: 'CHAT_ID'
      },
      author: {},
      candidates: [{
        raw_content: 'Hello!',
        tti_image_rel_path: null
      }]
    }
  }
}));
```

5. **Receive Response**:
```javascript
ws.onmessage = (event) => {
  const response = JSON.parse(event.data);
  if (response.turn && response.turn.candidates?.[0]?.is_final) {
    console.log('Response:', response.turn.candidates[0].raw_content);
  }
};
```



