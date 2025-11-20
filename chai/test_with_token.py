"""
Test script using the provided token to send messages to CharacterAI
"""

import requests
import json
import uuid
import websocket
import threading
import time

# Your token
TOKEN = "82080a326731225710e7471fc1308c1e7a904720"

# ============================================
# CHAT V1 API (HTTP POST) - Simple Example
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
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    payload = {
        "history_external_id": chat_id,
        "text": text,
        "tgt": tgt
    }
    
    print(f"Sending message to Chat V1...")
    print(f"URL: {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    response = requests.post(url, headers=headers, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.json()


def create_chat_v1(token, character_id):
    """Create a new chat using Chat V1 API"""
    url = "https://plus.character.ai/chat/history/create/"
    headers = {
        "Authorization": f"Token {token}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    payload = {
        "character_external_id": character_id
    }
    
    print(f"Creating chat with character: {character_id}")
    response = requests.post(url, headers=headers, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.json()


# ============================================
# CHAT V2 API (WebSocket) - Simple Example
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
        
        print(f"Connecting to WebSocket: {url}")
        
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
        print("✓ WebSocket connected")
    
    def on_message(self, ws, message):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(message)
            self.responses.append(data)
            print(f"\n📨 Received message:")
            print(json.dumps(data, indent=2))
        except json.JSONDecodeError:
            print(f"Received non-JSON: {message}")
    
    def on_error(self, ws, error):
        """Handle WebSocket errors"""
        print(f"❌ WebSocket error: {error}")
    
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
        print(f"\n📤 Sending command: {command}")
        print(json.dumps(message, indent=2))
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
        "Authorization": f"Token {token}",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    
    print(f"Getting chat histories for character: {character_id}")
    response = requests.get(url, headers=headers)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print(f"Chat Histories: {json.dumps(response.json(), indent=2)}")
        return response.json()
    else:
        print(f"Error: {response.text}")
        return None


# ============================================
# TEST WITH YOUR TOKEN
# ============================================

# ============================================
# QUICK START EXAMPLES
# ============================================

def example_chat_v2_websocket(character_id, creator_id, message_text="Hello!"):
    """
    Example: Send a message using Chat V2 WebSocket API
    
    Args:
        character_id: Character ID from character.ai
        creator_id: Your user ID (can be any string, often your account ID)
        message_text: Message to send
    """
    print("\n" + "=" * 60)
    print("Chat V2 WebSocket Example")
    print("=" * 60)
    
    ws_client = CharacterAIWebSocket(TOKEN)
    ws_client.connect()
    
    try:
        # Create a new chat
        chat_id = ws_client.create_chat(character_id, creator_id)
        print(f"\n✓ Created chat: {chat_id}")
        
        # Wait a bit for greeting
        print("Waiting for greeting...")
        time.sleep(3)
        
        # Send a message
        print(f"\nSending message: {message_text}")
        ws_client.send_message(character_id, chat_id, message_text)
        
        # Wait for response
        print("Waiting for character response...")
        try:
            response = ws_client.wait_for_response(timeout=30)
            character_response = response['candidates'][0]['raw_content']
            print(f"\n{'='*60}")
            print(f"✓ Character Response:")
            print(f"{character_response}")
            print(f"{'='*60}")
            return response
        except TimeoutError:
            print("\n⚠ Timeout waiting for response")
            return None
    finally:
        ws_client.close()


def example_chat_v1_http(character_id, chat_id, tgt, message_text="Hello!"):
    """
    Example: Send a message using Chat V1 HTTP API
    
    Args:
        character_id: Character ID
        chat_id: Existing chat ID (or create one first)
        tgt: Character target ID (old format)
        message_text: Message to send
    """
    print("\n" + "=" * 60)
    print("Chat V1 HTTP Example")
    print("=" * 60)
    
    response = send_message_v1(TOKEN, chat_id, tgt, message_text)
    
    if response.get("status") == "OK":
        replies = response.get("replies", [])
        if replies:
            print(f"\n{'='*60}")
            print(f"✓ Character Response:")
            print(f"{replies[0].get('text', 'No text in response')}")
            print(f"{'='*60}")
    else:
        print(f"Error: {response}")
    
    return response


if __name__ == "__main__":
    print("=" * 60)
    print("CharacterAI API Test with Your Token")
    print("=" * 60)
    print(f"Token: {TOKEN[:20]}...")
    print()
    
    print("=" * 60)
    print("HOW TO USE:")
    print("=" * 60)
    print("1. Get a Character ID from character.ai website")
    print("   (e.g., from a character's URL: character.ai/chat?char=CHARACTER_ID)")
    print()
    print("2. For Chat V2 (WebSocket - Recommended):")
    print("   example_chat_v2_websocket('CHARACTER_ID', 'YOUR_USER_ID', 'Hello!')")
    print()
    print("3. For Chat V1 (HTTP POST):")
    print("   - First create a chat: create_chat_v1(TOKEN, 'CHARACTER_ID')")
    print("   - Then send: example_chat_v1_http('CHAR_ID', 'CHAT_ID', 'TGT_ID', 'Hello!')")
    print()
    print("=" * 60)
    print("QUICK TEST - Uncomment and fill in values below:")
    print("=" * 60)
    
    # Uncomment and fill in these values to test:
    """
    # Example 1: Chat V2 WebSocket (Recommended)
    CHARACTER_ID = "YOUR_CHARACTER_ID_HERE"  # Get from character.ai
    CREATOR_ID = "123456"  # Can be any string, often your user ID
    
    example_chat_v2_websocket(CHARACTER_ID, CREATOR_ID, "Hello! How are you?")
    """
    
    # Example 2: Chat V1 HTTP
    """
    CHARACTER_ID = "YOUR_CHARACTER_ID_HERE"
    # First create a chat
    chat_data = create_chat_v1(TOKEN, CHARACTER_ID)
    chat_id = chat_data.get("external_id")
    tgt = chat_data.get("tgt")  # Get TGT from response
    
    # Then send a message
    example_chat_v1_http(CHARACTER_ID, chat_id, tgt, "Hello!")
    """
    
    print("\n" + "=" * 60)
    print("Token is ready to use!")
    print("=" * 60)



