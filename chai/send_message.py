"""
Simple script to send messages to CharacterAI using your token
Just set CHARACTER_ID and run!
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
# SET YOUR CHARACTER ID HERE
# ============================================
# Get this from character.ai website URL: character.ai/chat?char=CHARACTER_ID
CHARACTER_ID = "2BNF3GwaPjdSeBEZpa7vaWgoA0cl5mdG4k_EccPo-ZE"

# Your user/creator ID (can be any string, often your account ID)
# If you don't know it, try "1" or any number as string
CREATOR_ID = "1"


class CharacterAIWebSocket:
    """WebSocket client for CharacterAI Chat V2 API"""
    
    def __init__(self, token):
        self.token = token
        self.ws = None
        self.responses = []
        self.connected = False
        self.lock = threading.Lock()
        
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
        
        wst = threading.Thread(target=self.ws.run_forever)
        wst.daemon = True
        wst.start()
        
        timeout = 5
        while not self.connected and timeout > 0:
            time.sleep(0.1)
            timeout -= 0.1
        
        if not self.connected:
            raise Exception("Failed to connect to WebSocket")
    
    def on_open(self, ws):
        self.connected = True
        print("[OK] Connected to CharacterAI")
    
    def on_message(self, ws, message):
        try:
            data = json.loads(message)
            with self.lock:
                self.responses.append(data)
            # Debug: print received messages
            if 'turn' in data or 'chat' in data or 'command' in data:
                print(f"[DEBUG] Received: {data.get('command', 'turn/chat data')}")
        except json.JSONDecodeError:
            print(f"[DEBUG] Non-JSON message: {message[:100]}")
    
    def on_error(self, ws, error):
        print(f"[ERROR] {error}")
    
    def on_close(self, ws, close_status_code, close_msg):
        self.connected = False
    
    def send(self, command, payload):
        message = {"command": command, "payload": payload}
        self.ws.send(json.dumps(message))
    
    def create_chat(self, character_id, creator_id, chat_id=None, greeting=True):
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
        
        # Wait for chat creation response
        start_time = time.time()
        while time.time() - start_time < 5:
            with self.lock:
                for response in self.responses:
                    if response.get("command") == "neo_error":
                        error = response.get("comment", "Unknown error")
                        raise Exception(f"Chat creation failed: {error}")
                    if "chat" in response:
                        return chat_id
            time.sleep(0.1)
        
        return chat_id
    
    def send_message(self, character_id, chat_id, text):
        payload = {
            "character_id": character_id,
            "turn": {
                "turn_key": {"chat_id": chat_id},
                "author": {},
                "candidates": [{"raw_content": text, "tti_image_rel_path": None}]
            }
        }
        self.send("create_and_generate_turn", payload)
    
    def wait_for_response(self, timeout=30):
        start_time = time.time()
        last_count = 0
        
        while time.time() - start_time < timeout:
            with self.lock:
                if len(self.responses) > last_count:
                    for response in self.responses[last_count:]:
                        try:
                            # Check if it's a turn response
                            turn = response.get("turn", {})
                            if turn:
                                candidates = turn.get("candidates", [])
                                author = turn.get("author", {})
                                author_id = author.get("author_id", "")
                                
                                # Character responses have non-digit author_id
                                if not author_id.isdigit() and candidates:
                                    candidate = candidates[0]
                                    # Check if it's final or has content
                                    if candidate.get("is_final") or candidate.get("raw_content"):
                                        print(f"[DEBUG] Found character response from {author.get('name', 'Unknown')}")
                                        return turn
                        except (KeyError, AttributeError) as e:
                            print(f"[DEBUG] Error parsing response: {e}")
                            continue
                    last_count = len(self.responses)
            
            time.sleep(0.2)
        
        # If timeout, show what we received
        with self.lock:
            print(f"[DEBUG] Total responses received: {len(self.responses)}")
            if self.responses:
                print(f"[DEBUG] Last response: {json.dumps(self.responses[-1], indent=2)[:500]}")
        raise TimeoutError("No response received")
    
    def close(self):
        if self.ws:
            self.ws.close()


def get_user_id_from_token(token, character_id):
    """Try to get user ID from token by checking recent chats"""
    try:
        url = f"https://neo.character.ai/chats/recent/{character_id}"
        headers = {
            "Authorization": f"Token {token}",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        response = requests.get(url, headers=headers, timeout=5)
        if response.status_code == 200:
            data = response.json()
            chats = data.get("chats", [])
            if chats:
                creator_id = chats[0].get("creator_id")
                if creator_id:
                    return str(creator_id)
    except:
        pass
    return "1"  # Default fallback


def get_existing_chat(token, character_id):
    """Get the most recent chat for a character, or None if no chat exists"""
    try:
        url = f"https://neo.character.ai/chats/recent/{character_id}"
        headers = {
            "Authorization": f"Token {token}",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        response = requests.get(url, headers=headers, timeout=5)
        if response.status_code == 200:
            data = response.json()
            chats = data.get("chats", [])
            if chats and len(chats) > 0:
                chat_id = chats[0].get("chat_id")
                creator_id = chats[0].get("creator_id")
                return chat_id, str(creator_id)
    except Exception as e:
        print(f"[DEBUG] Could not get existing chat: {e}")
    return None, None


def send_message_to_character(character_id, creator_id, message_text, chat_id=None):
    """
    Send a message to a CharacterAI character
    
    Args:
        character_id: Character ID from character.ai
        creator_id: Your user ID (string or number)
        message_text: Message to send
        chat_id: Optional chat ID to reuse existing chat. If None, will try to get existing or create new.
    """
    print(f"\n{'='*60}")
    print(f"Sending message to character: {character_id}")
    print(f"Message: {message_text}")
    print(f"{'='*60}\n")
    
    # Try to get existing chat first
    if chat_id is None:
        print("Checking for existing chat...")
        existing_chat_id, existing_creator_id = get_existing_chat(TOKEN, character_id)
        if existing_chat_id:
            chat_id = existing_chat_id
            if existing_creator_id:
                creator_id = existing_creator_id
            print(f"[OK] Using existing chat: {chat_id}")
        else:
            print("No existing chat found, will create new one")
    
    # Try to get actual creator_id if not provided
    if creator_id == "1":
        print("Attempting to get creator_id from API...")
        actual_creator_id = get_user_id_from_token(TOKEN, character_id)
        if actual_creator_id != "1":
            creator_id = actual_creator_id
            print(f"[OK] Using creator_id: {creator_id}")
    
    ws = CharacterAIWebSocket(TOKEN)
    
    try:
        ws.connect()
        
        # Create chat only if we don't have one
        if chat_id is None:
            print("Creating new chat...")
            chat_id = ws.create_chat(character_id, creator_id)
            print(f"[OK] Created chat: {chat_id}")
            # Wait for greeting only on new chats
            print("Waiting for greeting...")
            time.sleep(2)
        else:
            print(f"[OK] Reusing chat: {chat_id}")
        
        # Send message
        print(f"Sending: {message_text}")
        ws.send_message(character_id, chat_id, message_text)
        
        # Wait for response
        print("Waiting for response...")
        response = ws.wait_for_response(timeout=30)
        
        character_response = response['candidates'][0]['raw_content']
        print(f"\n{'='*60}")
        print("CHARACTER RESPONSE:")
        print(f"{'='*60}")
        print(character_response)
        print(f"{'='*60}\n")
        
        return character_response, chat_id  # Return chat_id so it can be reused
        
    except Exception as e:
        print(f"[ERROR] {e}")
        import traceback
        traceback.print_exc()
        return None, chat_id
    finally:
        ws.close()


if __name__ == "__main__":
    if CHARACTER_ID == "YOUR_CHARACTER_ID_HERE":
        print("=" * 60)
        print("ERROR: Please set CHARACTER_ID in the script!")
        print("=" * 60)
        print("\nTo get a Character ID:")
        print("1. Go to character.ai")
        print("2. Open a character's chat")
        print("3. Look at the URL: character.ai/chat?char=CHARACTER_ID")
        print("4. Copy the CHARACTER_ID and paste it in this script")
        print("\nExample:")
        print('CHARACTER_ID = "abc123xyz"')
        print("=" * 60)
    else:
        # Send messages - will reuse existing chat if available
        response, chat_id = send_message_to_character(
            CHARACTER_ID,
            CREATOR_ID,
            "hey"
        )
        
        # You can send more messages to the same chat:
        # response2, chat_id = send_message_to_character(
        #     CHARACTER_ID,
        #     CREATOR_ID,
        #     "How are you?",
        #     chat_id=chat_id  # Reuse the same chat
        # )

image.png