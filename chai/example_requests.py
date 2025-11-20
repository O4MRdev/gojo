"""
Example: Sending messages to CharacterAI using standard HTTP requests
Based on the kramcat/CharacterAI library implementation
"""

import requests
import json
import uuid
import websocket
import threading
import time

# ============================================
# AUTHENTICATION
# ============================================

def get_guest_token():
    """Get a guest token for CharacterAI"""
    url = "https://beta.character.ai/chat/auth/lazy/"
    payload = {
        "lazy_uuid": str(uuid.uuid1())
    }
    
    response = requests.post(url, json=payload)
    data = response.json()
    
    if "token" in data:
        return data["token"]
    else:
        raise Exception(f"Failed to get token: {data}")


# ============================================
# CHAT V1 API (HTTP POST)
# ============================================

def send_message_v1(token, chat_id, tgt, text):
    """
    Send a message using Chat V1 API (HTTP POST)
    
    Args:
        token: Your authentication token
        chat_id: The chat/room ID
        tgt: Character target ID (old format)
        text: Message text
    """
    url = "https://plus.character.ai/chat/streaming/"
    headers = {
        "Authorization": f"Token {token}",
        "Content-Type": "application/json"
    }
    payload = {
        "history_external_id": chat_id,
        "text": text,
        "tgt": tgt
    }
    
    response = requests.post(url, headers=headers, json=payload)
    return response.json()


def create_chat_v1(token, character_id):
    """Create a new chat using Chat V1 API"""
    url = "https://plus.character.ai/chat/history/create/"
    headers = {
        "Authorization": f"Token {token}",
        "Content-Type": "application/json"
    }
    payload = {
        "character_external_id": character_id
    }
    
    response = requests.post(url, headers=headers, json=payload)
    return response.json()


def get_chat_history_v1(token, character_id, chat_id):
    """Get chat history using Chat V1 API"""
    url = "https://plus.character.ai/chat/history/continue/"
    headers = {
        "Authorization": f"Token {token}",
        "Content-Type": "application/json"
    }
    payload = {
        "character_external_id": character_id,
        "history_external_id": chat_id
    }
    
    response = requests.post(url, headers=headers, json=payload)
    return response.json()


# ============================================
# CHAT V2 API (WebSocket)
# ============================================

class CharacterAIWebSocket:
    """WebSocket client for CharacterAI Chat V2 API"""
    
    def __init__(self, token):
        self.token = token
        self.ws = None
        self.responses = []
        self.connected = False
        
    def connect(self):
        """Connect to CharacterAI WebSocket"""
        url = "wss://neo.character.ai/ws/"
        cookie = f'HTTP_AUTHORIZATION="Token {self.token}"'
        
        self.ws = websocket.WebSocketApp(
            url,
            header=[f"Cookie: {cookie}"],
            on_message=self.on_message,
            on_error=self.on_error,
            on_close=self.on_close,
            on_open=self.on_open
        )
        
        # Run in a separate thread
        wst = threading.Thread(target=self.ws.run_forever)
        wst.daemon = True
        wst.start()
        
        # Wait for connection
        timeout = 5
        while not self.connected and timeout > 0:
            time.sleep(0.1)
            timeout -= 0.1
        
        if not self.connected:
            raise Exception("Failed to connect to WebSocket")
    
    def on_open(self, ws):
        """Called when WebSocket connection is opened"""
        self.connected = True
        print("WebSocket connected")
    
    def on_message(self, ws, message):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(message)
            self.responses.append(data)
            print(f"Received: {json.dumps(data, indent=2)}")
        except json.JSONDecodeError:
            print(f"Received non-JSON: {message}")
    
    def on_error(self, ws, error):
        """Handle WebSocket errors"""
        print(f"WebSocket error: {error}")
    
    def on_close(self, ws, close_status_code, close_msg):
        """Called when WebSocket connection is closed"""
        self.connected = False
        print("WebSocket closed")
    
    def send(self, command, payload):
        """Send a command to the WebSocket"""
        message = {
            "command": command,
            "payload": payload
        }
        self.ws.send(json.dumps(message))
    
    def create_chat(self, character_id, creator_id, chat_id=None, greeting=True):
        """Create a new chat"""
        if chat_id is None:
            chat_id = str(uuid.uuid4())
        
        payload = {
            "chat": {
                "chat_id": chat_id,
                "creator_id": str(creator_id),
                "visibility": "VISIBILITY_PRIVATE",
                "character_id": character_id,
                "type": "TYPE_ONE_ON_ONE"
            },
            "with_greeting": greeting
        }
        
        self.send("create_chat", payload)
        return chat_id
    
    def send_message(self, character_id, chat_id, text, image_path=None):
        """Send a message"""
        payload = {
            "character_id": character_id,
            "turn": {
                "turn_key": {
                    "chat_id": chat_id
                },
                "author": {},
                "candidates": [
                    {
                        "raw_content": text,
                        "tti_image_rel_path": image_path
                    }
                ]
            }
        }
        
        self.send("create_and_generate_turn", payload)
    
    def wait_for_response(self, timeout=30):
        """Wait for a final response from the character"""
        start_time = time.time()
        last_count = 0
        
        while time.time() - start_time < timeout:
            # Check if we have new responses
            if len(self.responses) > last_count:
                for response in self.responses[last_count:]:
                    try:
                        turn = response.get("turn", {})
                        candidates = turn.get("candidates", [])
                        author = turn.get("author", {})
                        
                        # Check if it's from the character (not a digit)
                        author_id = author.get("author_id", "")
                        if not author_id.isdigit() and candidates:
                            candidate = candidates[0]
                            if candidate.get("is_final"):
                                return turn
                    except (KeyError, AttributeError):
                        continue
                
                last_count = len(self.responses)
            
            time.sleep(0.1)
        
        raise TimeoutError("No response received within timeout")
    
    def close(self):
        """Close the WebSocket connection"""
        if self.ws:
            self.ws.close()


# ============================================
# CHAT V2 API (HTTP REST)
# ============================================

def get_chat_histories_v2(token, character_id, preview=2):
    """Get chat histories using Chat V2 API"""
    url = f"https://neo.character.ai/chats/?character_ids={character_id}&num_preview_turns={preview}"
    headers = {
        "Authorization": f"Token {token}"
    }
    
    response = requests.get(url, headers=headers)
    return response.json()


def get_recent_chat_v2(token, character_id):
    """Get the most recent chat for a character"""
    url = f"https://neo.character.ai/chats/recent/{character_id}"
    headers = {
        "Authorization": f"Token {token}"
    }
    
    response = requests.get(url, headers=headers)
    data = response.json()
    return data.get("chats", [{}])[0] if data.get("chats") else None


def get_chat_history_v2(token, chat_id):
    """Get full chat history"""
    url = f"https://neo.character.ai/turns/{chat_id}/"
    headers = {
        "Authorization": f"Token {token}"
    }
    
    response = requests.get(url, headers=headers)
    return response.json()


# ============================================
# EXAMPLE USAGE
# ============================================

if __name__ == "__main__":
    # Example 1: Using Chat V1 API
    print("=== Chat V1 API Example ===")
    token = get_guest_token()
    print(f"Got token: {token[:20]}...")
    
    # Note: You need actual character_id, chat_id, and tgt values
    # These are just examples
    # response = send_message_v1(token, "CHAT_ID", "TGT_ID", "Hello!")
    # print(response)
    
    # Example 2: Using Chat V2 WebSocket API
    print("\n=== Chat V2 WebSocket API Example ===")
    ws_client = CharacterAIWebSocket(token)
    ws_client.connect()
    
    # Create a new chat (you need actual character_id and creator_id)
    # chat_id = ws_client.create_chat("CHARACTER_ID", "CREATOR_ID")
    # print(f"Created chat: {chat_id}")
    
    # Send a message
    # ws_client.send_message("CHARACTER_ID", chat_id, "Hello!")
    
    # Wait for response
    # response = ws_client.wait_for_response()
    # print(f"Character response: {response['candidates'][0]['raw_content']}")
    
    # ws_client.close()
    
    print("\nNote: Replace CHARACTER_ID, CHAT_ID, TGT_ID, and CREATOR_ID with actual values")

