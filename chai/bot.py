import os, json, uuid, threading, time, asyncio
from pathlib import Path
from typing import Optional, List
import discord
import requests
import websocket
from dotenv import load_dotenv

load_dotenv()

DISCORD_TOKEN = os.getenv("DISCORD_TOKEN")
CHAR_TOKEN = os.getenv("CHAR_TOKEN")              # CharacterAI token
CHAR_ID = os.getenv("CHAR_ID")                    # character external id
CREATOR_ID = os.getenv("CREATOR_ID", "1")         # optional

if not all([DISCORD_TOKEN, CHAR_TOKEN, CHAR_ID]):
    raise SystemExit("Set DISCORD_TOKEN, CHAR_TOKEN, CHAR_ID in .env or environment")

# Allow slash commands plus message content so we can read user chat
intents = discord.Intents.default()
intents.message_content = True
bot = discord.Client(intents=intents)
tree = discord.app_commands.CommandTree(bot)

# Simple persistent state
STATE_PATH = Path(__file__).with_name("user_state.json")

def load_state():
    try:
        data = json.loads(STATE_PATH.read_text())
    except FileNotFoundError:
        return {}, {}
    except Exception as exc:
        print(f"Failed to load state: {exc}")
        return {}, {}
    chats = {int(k): v for k, v in data.get("chats", {}).items()}
    channels = {int(k): v for k, v in data.get("channels", {}).items()}
    return chats, channels

def save_state():
    try:
        payload = {
            "chats": {str(k): v for k, v in user_chats.items()},
            "channels": {str(k): v for k, v in user_channels.items()},
        }
        STATE_PATH.write_text(json.dumps(payload, indent=2))
    except Exception as exc:
        print(f"Failed to save state: {exc}")

user_chats, user_channels = load_state()
allowed_channels = {}   # guild_id -> channel_id (restrict bot to a channel if set)
active_requests = set()  # user_ids currently awaiting a reply
_resolved_creator_id: Optional[str] = None

class CharacterAIWebSocket:
    def __init__(self, token):
        self.token = token
        self.ws = None
        self.responses = []
        self.connected = False
        self.lock = threading.Lock()

    def connect(self):
        url = "wss://neo.character.ai/ws/"
        cookie = f'HTTP_AUTHORIZATION="Token {self.token}"'
        self.ws = websocket.WebSocketApp(
            url,
            header=[f"Cookie: {cookie}"],
            on_message=self.on_message,
            on_error=self.on_error,
            on_close=self.on_close,
            on_open=self.on_open,
        )
        t = threading.Thread(target=self.ws.run_forever, daemon=True)
        t.start()
        timeout = 5
        while not self.connected and timeout > 0:
            time.sleep(0.1)
            timeout -= 0.1
        if not self.connected:
            raise RuntimeError("ws connect failed")

    def on_open(self, ws):
        self.connected = True

    def on_message(self, ws, message):
        try:
            data = json.loads(message)
        except json.JSONDecodeError:
            return
        with self.lock:
            self.responses.append(data)

    def on_error(self, ws, error):
        print(f"WS error: {error}")

    def on_close(self, ws, code, msg):
        self.connected = False

    def send(self, command, payload):
        self.ws.send(json.dumps({"command": command, "payload": payload}))

    def create_chat(self, character_id, creator_id, chat_id=None, greeting=True):
        chat_id = chat_id or str(uuid.uuid4())
        payload = {
            "chat": {
                "chat_id": chat_id,
                "creator_id": str(creator_id),
                "visibility": "VISIBILITY_PRIVATE",
                "character_id": character_id,
                "type": "TYPE_ONE_ON_ONE",
            },
            "with_greeting": greeting,
        }
        with self.lock:
            start_index = len(self.responses)
        self.send("create_chat", payload)
        deadline = time.time() + 5
        current_index = start_index
        while time.time() < deadline:
            with self.lock:
                new_responses = self.responses[current_index:]
            if new_responses:
                for resp in new_responses:
                    if resp.get("command") == "neo_error":
                        comment = resp.get("comment") or resp.get("payload", {}).get("detail") or "Unknown error"
                        raise RuntimeError(f"Chat creation failed: {comment}")
                    chat = resp.get("chat")
                    if chat and chat.get("chat_id") == chat_id:
                        return chat_id
                current_index += len(new_responses)
            time.sleep(0.1)
        return chat_id

    def send_message(self, character_id, chat_id, text):
        payload = {
            "character_id": character_id,
            "turn": {
                "turn_key": {"chat_id": chat_id},
                "author": {},
                "candidates": [{"raw_content": text, "tti_image_rel_path": None}],
            },
        }
        self.send("create_and_generate_turn", payload)

    def wait_for_response(self, timeout=15):
        start = time.time()
        with self.lock:
            last_index = len(self.responses)
        latest_text = None
        while time.time() - start < timeout:
            with self.lock:
                new_responses = self.responses[last_index:]
            if new_responses:
                for resp in new_responses:
                    turn = resp.get("turn", {}) if isinstance(resp, dict) else {}
                    candidates = turn.get("candidates", [])
                    author = turn.get("author", {})
                    author_id = author.get("author_id", "") if isinstance(author, dict) else ""
                    if candidates and not author_id.isdigit():
                        candidate = candidates[0]
                        text = candidate.get("raw_content")
                        if text:
                            latest_text = text
                        if candidate.get("is_final") and text:
                            return text
                    if resp.get("command") == "neo_error":
                        comment = resp.get("comment") or resp.get("payload", {}).get("detail") or "Unknown error"
                        raise RuntimeError(f"Character reply failed: {comment}")
                with self.lock:
                    last_index += len(new_responses)
            time.sleep(0.2)
        return latest_text

    def close(self):
        if self.ws:
            self.ws.close()

def get_existing_chat(token, character_id):
    # Legacy placeholder (unused now)
    return None, None

def resolve_creator_id() -> str:
    """Best-effort lookup of the creator_id tied to CHAR_TOKEN."""
    global _resolved_creator_id
    if _resolved_creator_id:
        return _resolved_creator_id
    try:
        resp = requests.get(
            f"https://neo.character.ai/chats/recent/{CHAR_ID}",
            headers={"Authorization": f"Token {CHAR_TOKEN}"},
            timeout=5,
        )
        if resp.status_code == 200:
            data = resp.json()
            chats = data.get("chats", [])
            if chats:
                creator = chats[0].get("creator_id")
                if creator:
                    _resolved_creator_id = str(creator)
                    return _resolved_creator_id
    except Exception as exc:
        print(f"creator_id lookup failed: {exc}")
    _resolved_creator_id = str(CREATOR_ID or "1")
    return _resolved_creator_id

def ensure_chat(chat_id: str | None) -> str:
    """Always return a usable chat_id (create new if missing)."""
    if chat_id:
        return chat_id
    ws = CharacterAIWebSocket(CHAR_TOKEN)
    ws.connect()
    try:
        new_chat = ws.create_chat(CHAR_ID, resolve_creator_id())
        return new_chat
    finally:
        ws.close()

def ask_character(text, chat_id=None):
    """Send a prompt and return reply text, creating chat when needed."""
    chat_id = ensure_chat(chat_id)
    ws = CharacterAIWebSocket(CHAR_TOKEN)
    ws.connect()
    try:
        ws.send_message(CHAR_ID, chat_id, text)
        reply = ws.wait_for_response(timeout=15)
        return reply or "No response.", chat_id
    finally:
        ws.close()

async def respond_with_thinking(interaction: discord.Interaction, content: str):
    """Send ephemeral thinking/update."""
    if interaction.response.is_done():
        await interaction.followup.send(content=content, ephemeral=True)
    else:
        await interaction.response.send_message(content, ephemeral=True)

def _stylize_roleplay(text: str) -> str:
    """Auto-add italic styling for narrative lines and keep markdown balanced."""
    lines = [line.strip() for line in text.splitlines()]
    styled = []
    for line in lines:
        if not line:
            continue
        lower = line.lower()
        if lower.startswith("gojo") and not (line.startswith("*") and line.endswith("*")):
            line = f"*{line}*"
        styled.append(line)
    result = "\n".join(styled)
    if result.count("*") % 2 == 1:
        result += "*"
    return result

def _chunk_text(text: str, limit: int = 4000) -> List[str]:
    """Break text into Discord-embed safe chunks."""
    chunks = []
    remaining = text
    while len(remaining) > limit:
        split_idx = remaining.rfind("\n\n", 0, limit)
        if split_idx == -1:
            split_idx = remaining.rfind("\n", 0, limit)
        if split_idx == -1:
            split_idx = limit
        chunks.append(remaining[:split_idx].strip())
        remaining = remaining[split_idx:].lstrip()
    if remaining:
        chunks.append(remaining)
    if not chunks:
        chunks.append("No response.")
    return chunks

def format_reply(resp_text: str) -> List[discord.Embed]:
    """Return one or more embeds that preserve long roleplay responses."""
    clean = (resp_text or "No response.").strip()
    clean = _stylize_roleplay(clean)
    chunks = _chunk_text(clean)
    embeds = [discord.Embed(description=chunk, color=0x5865F2) for chunk in chunks]
    return embeds

async def run_blocking(fn, *args, **kwargs):
    """Run a blocking function in a thread executor."""
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, lambda: fn(*args, **kwargs))

def is_channel_allowed(guild_id: Optional[int], channel_id: int, user_id: int) -> bool:
    """Shared channel restriction logic."""
    if guild_id is not None:
        allowed_guild = allowed_channels.get(guild_id)
        if allowed_guild is not None and allowed_guild != channel_id:
            return False
    u_allowed = user_channels.get(user_id)
    if u_allowed is not None and u_allowed != channel_id:
        return False
    return True

def channel_check(interaction: discord.Interaction) -> bool:
    """True if channel allowed (guild or per-user restriction)."""
    return is_channel_allowed(interaction.guild_id, interaction.channel_id, interaction.user.id)

async def ensure_channel(interaction: discord.Interaction):
    if channel_check(interaction):
        return True
    channel_id = allowed_channels.get(interaction.guild_id)
    target = f"<#{channel_id}>" if channel_id else "the channel you started talking in"
    await interaction.response.send_message(
        f"This bot is restricted to {target}. Use /setchannel (guild) or /stoptalk then /talk here to reset your channel.",
        ephemeral=True,
    )
    return False

@bot.event
async def on_ready():
    await tree.sync()
    print(f"Logged in as {bot.user} and synced slash commands")

@tree.command(name="help", description="List available commands")
async def help_cmd(interaction: discord.Interaction):
    text = (
        "/talk [message] - start/continue conversation (message optional)\n"
        "/newchat - start a fresh chat in this channel\n"
        "/stoptalk - stop conversation and unlock your channel\n"
        "/resetmemory - clear stored chat for you\n"
        "/setchannel - restrict bot to this channel (guild-wide)\n"
        "/help - this help message"
    )
    await interaction.response.send_message(text, ephemeral=True)

@tree.command(name="talk", description="Start or continue a conversation with the bot")
async def talk_cmd(interaction: discord.Interaction, message: Optional[str] = None, new_chat: bool = False):
    if not await ensure_channel(interaction):
        return
    user_id = interaction.user.id
    chat_id = None if new_chat else user_chats.get(user_id)
    user_channels[user_id] = interaction.channel_id  # lock user to this channel
    save_state()
    prompt = (message or "").strip()
    if not prompt:
        prompt = "Please introduce yourself and start the conversation with me."
    try:
        await interaction.response.defer(thinking=True, ephemeral=False)
    except Exception:
        # fallback
        if not interaction.response.is_done():
            await interaction.response.send_message("Thinking...", ephemeral=True)
    try:
        reply, chat_id = await run_blocking(ask_character, prompt, chat_id)
        user_chats[user_id] = chat_id
        save_state()
        save_state()
        embeds = format_reply(reply)
        first, rest = embeds[0], embeds[1:]
        await interaction.followup.send(embed=first, ephemeral=False)
        for extra in rest:
            await interaction.followup.send(embed=extra, ephemeral=False)
        await interaction.followup.send(
            "I'm now listening to anything you type in this channel. Use /stoptalk when you're done.",
            ephemeral=True,
        )
    except Exception as e:
        await interaction.followup.send(f"Error: {e}", ephemeral=True)

@bot.event
async def on_message(message: discord.Message):
    """Automatically relay user messages once /talk has been used."""
    if message.author == bot.user or message.author.bot:
        return
    user_id = message.author.id
    chat_id = user_chats.get(user_id)
    if not chat_id:
        return
    guild_id = message.guild.id if message.guild else None
    if not is_channel_allowed(guild_id, message.channel.id, user_id):
        return
    content = (message.content or "").strip()
    if not content:
        return
    if user_id in active_requests:
        return
    active_requests.add(user_id)
    try:
        async with message.channel.typing():
            reply, chat_id = await run_blocking(ask_character, content, chat_id)
        user_chats[user_id] = chat_id
        embeds = format_reply(reply)
        first, rest = embeds[0], embeds[1:]
        await message.channel.send(
            embed=first,
            reference=message,
            mention_author=False,
        )
        for extra in rest:
            await message.channel.send(embed=extra, mention_author=False)
    except Exception as e:
        await message.channel.send(f"{message.author.mention} Error: {e}")
    finally:
        active_requests.discard(user_id)
@tree.command(name="stoptalk", description="Stop the conversation with the bot")
async def stoptalk_cmd(interaction: discord.Interaction):
    user_id = interaction.user.id
    existed = user_chats.pop(user_id, None)
    user_channels.pop(user_id, None)
    save_state()
    msg = "Conversation stopped and channel unlocked." if existed else "No active conversation to stop."
    await interaction.response.send_message(msg, ephemeral=True)

@tree.command(name="resetmemory", description="Reset the bot's memory for your user ID")
async def resetmemory_cmd(interaction: discord.Interaction):
    user_id = interaction.user.id
    existed = user_chats.pop(user_id, None)
    save_state()
    msg = "Memory cleared for you." if existed else "No stored memory found."
    await interaction.response.send_message(msg, ephemeral=True)

@tree.command(name="setchannel", description="Restrict bot interactions to this channel")
async def setchannel_cmd(interaction: discord.Interaction):
    if interaction.guild_id is None:
        await interaction.response.send_message("Setchannel works in guilds only.", ephemeral=True)
        return
    allowed_channels[interaction.guild_id] = interaction.channel_id
    await interaction.response.send_message(f"Bot restricted to <#{interaction.channel_id}> for this server.", ephemeral=True)

@tree.command(name="newchat", description="Start a fresh chat in this channel")
async def newchat_cmd(interaction: discord.Interaction):
    if not await ensure_channel(interaction):
        return
    user_id = interaction.user.id
    user_channels[user_id] = interaction.channel_id
    user_chats.pop(user_id, None)
    save_state()
    try:
        await interaction.response.defer(thinking=True, ephemeral=False)
    except Exception:
        if not interaction.response.is_done():
            await interaction.response.send_message("Starting a new chat...", ephemeral=True)
    try:
        reply, chat_id = await run_blocking(ask_character, "Hi", None)
        user_chats[user_id] = chat_id
        save_state()
        embeds = format_reply(reply)
        first, rest = embeds[0], embeds[1:]
        await interaction.followup.send(embed=first, ephemeral=False)
        for extra in rest:
            await interaction.followup.send(embed=extra, ephemeral=False)
    except Exception as e:
        await interaction.followup.send(f"Error creating chat: {e}", ephemeral=True)

if __name__ == "__main__":
    bot.run(DISCORD_TOKEN)
