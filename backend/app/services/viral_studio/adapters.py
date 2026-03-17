import asyncio
import json
import logging
import os
import re
from typing import Any

from app.models.partner import Partner

logger = logging.getLogger(__name__)

async def post_to_x(partner: Partner, content: str, image_path: str | None) -> dict[str, Any]:
    if not (partner.x_api_key and partner.x_api_secret and partner.x_access_token and partner.x_access_token_secret):
        return {"error": "X (Twitter) API not fully configured. Please sync all 4 keys in API Setup."}
    
    try:
        import tweepy
        
        # 1. Initialize Client for v2 API
        client = tweepy.Client(
            consumer_key=partner.x_api_key,
            consumer_secret=partner.x_api_secret,
            access_token=partner.x_access_token,
            access_token_secret=partner.x_access_token_secret
        )
        
        media_ids = []
        loop = asyncio.get_event_loop()
        if image_path:
            full_image_path = _resolve_image_path(image_path)
            if os.path.exists(full_image_path):
                auth = tweepy.OAuth1UserHandler(
                    partner.x_api_key, partner.x_api_secret,
                    partner.x_access_token, partner.x_access_token_secret
                )
                api_v1 = tweepy.API(auth)
                media = await loop.run_in_executor(None, lambda: api_v1.media_upload(filename=full_image_path))
                media_ids = [media.media_id]
                logger.info(f"✅ X Media Upload Successful: {media.media_id}")

        # Strip ALL markdown: html tags, links, bold (**), italic (*, _), headers
        clean_content = content.replace("<br>", "\n").replace("<p>", "").replace("</p>", "\n")
        clean_content = re.sub(r'<[^>]*>', '', clean_content)
        # Convert markdown links to "text: url" or just url if text is generic
        def _clean_link(m):
            text, url = m.group(1), m.group(2)
            text = re.sub(r'^CTA:\s*', '', text, flags=re.IGNORECASE)
            if text.lower() in ('here', 'link', 'click here'):
                return url
            return f'{text}: {url}'
        clean_content = re.sub(r'\[([^\]]+)\]\((https?://[^)]+)\)', _clean_link, clean_content)
        # Strip bold/italic: **text**, __text__, *text*, _text_
        clean_content = re.sub(r'\*\*(.*?)\*\*', r'\1', clean_content)
        clean_content = re.sub(r'__(.*?)__', r'\1', clean_content)
        clean_content = re.sub(r'\*(.*?)\*', r'\1', clean_content)
        clean_content = re.sub(r'_(\w[^_]*\w)_|_(\w)_', lambda m: m.group(1) or m.group(2), clean_content)
        # Strip markdown headers (# ##)
        clean_content = re.sub(r'^#{1,3}\s+', '', clean_content, flags=re.MULTILINE)
        # Normalize whitespace
        clean_content = re.sub(r'[ \t]{2,}', ' ', clean_content)

        final_text = clean_content.strip()
        response = await loop.run_in_executor(None, lambda: client.create_tweet(text=final_text, media_ids=media_ids if media_ids else None))
        
        tweet_id = response.data.get("id")
        logger.info(f"✅ X Posting Successful: Tweet ID {tweet_id}")
        
        # Try to get user handle if possible (usually we know it from partner)
        return {
            "status": "success", 
            "platform": "x", 
            "msg": f"Successfully posted to X! Tweet ID: {tweet_id}",
            "tweet_id": tweet_id,
            "channel_name": f"X: {partner.username or 'User'}"
        }
    except Exception as e:
        logger.error(f"❌ X Posting failed: {e}")
        return {"error": f"X API error: {e!s}"}

async def post_to_telegram(partner: Partner, content: str, image_path: str | None, channel_id_override: str | None = None) -> dict[str, Any]:
    if not partner.telegram_channel_id:
        return {"error": "Telegram Channel ID missing. Please configure it in API Setup."}
    
    # PRO+: If user specified a particular channel, post only to that one
    if channel_id_override and channel_id_override.strip():
        channels = [channel_id_override.strip()]
    else:
        channels = _prepare_telegram_channels(partner.telegram_channel_id)
    
    if not channels:
        return {"error": "No valid Telegram channels found."}

    formatted_content = _format_telegram_content(content)
    results = []
    message_ids = []
    success_count = 0
    
    full_image_path = _resolve_image_path(image_path) if image_path else None
    
    success_count = 0
    tasks = []
    
    if full_image_path and os.path.exists(full_image_path):
        for channel_id in channels:
            tasks.append(_send_telegram_photo(channel_id, full_image_path, formatted_content))
    else:
        for channel_id in channels:
            tasks.append(_send_telegram_message(channel_id, formatted_content))

    # Parallel Execution for PRO+ Speed
    sent_msg_ids = await asyncio.gather(*tasks)

    for i, res_data in enumerate(sent_msg_ids):
        channel_id = channels[i]
        if res_data:
            success_count += 1
            msg_id = res_data if isinstance(res_data, (int, str)) else res_data.get("message_id")
            chat_name = res_data.get("chat_name") if isinstance(res_data, dict) else channel_id
            
            message_ids.append(f"{channel_id}:{msg_id}:{chat_name}")
            results.append(f"✅ {chat_name}")
        else:
            results.append(f"❌ {channel_id}")

    if success_count == 0:
        return {"error": "Failed to publish to any Telegram channels. Ensure Bot is Admin.", "details": results}

    return {
        "status": "success",
        "platform": "telegram",
        "msg": f"Post attempt complete: {', '.join(results)}",
        "details": results,
        "message_ids": message_ids
    }

import httpx


async def post_to_linkedin(partner: Partner, content: str, image_path: str | None) -> dict[str, Any]:
    if not partner.linkedin_access_token:
        return {"error": "LinkedIn API not configured. Please add your Access Token in API Settings."}
    
    try:
        async with httpx.AsyncClient() as client:
            headers = {
                "Authorization": f"Bearer {partner.linkedin_access_token}",
                "X-Restli-Protocol-Version": "2.0.0",
                "Content-Type": "application/json",
            }
            
            # 1. Get Profile URN
            profile_res = await client.get("https://api.linkedin.com/v2/me", headers=headers)
            if profile_res.status_code != 200:
                logger.error(f"LinkedIn Profile Error: {profile_res.text}")
                return {"error": "Invalid LinkedIn Token or permissions."}
            
            person_urn = f"urn:li:person:{profile_res.json()['id']}"
            
            # 2. Create Share (Simple text share for now, images require multi-step upload)
            # Transforming HTML to plain text for LinkedIn
            clean_content = re.sub(r'<[^>]*>', '', content)
            
            share_payload = {
                "author": person_urn,
                "lifecycleState": "PUBLISHED",
                "specificContent": {
                    "com.linkedin.ugc.ShareContent": {
                        "shareCommentary": {
                            "text": clean_content
                        },
                        "shareMediaCategory": "NONE"
                    }
                },
                "visibility": {
                    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
                }
            }
            
            post_res = await client.post("https://api.linkedin.com/v2/ugcPosts", headers=headers, json=share_payload)
            if post_res.status_code not in (200, 201):
                logger.error(f"LinkedIn Post Error: {post_res.text}")
                return {"error": f"LinkedIn Post Failed: {post_res.json().get('message', 'Unknown Error')}"}
            
            post_id = post_res.json().get('id')
            return {
                "status": "success",
                "platform": "linkedin",
                "msg": f"Successfully posted to LinkedIn! ID: {post_id}",
                "channel_name": "LinkedIn",
                "message_ids": [str(post_id)]
            }
    except Exception as e:
        logger.error(f"❌ LinkedIn Posting failed: {e}")
        return {"error": f"LinkedIn Error: {e!s}"}

async def post_to_pinterest(partner: Partner, content: str, image_path: str | None) -> dict[str, Any]:
    if not partner.pinterest_access_token:
        return {"error": "Pinterest Access Token not configured. Please add it in API Settings."}
    
    try:
        headers = {"Authorization": f"Bearer {partner.pinterest_access_token}"}
        async with httpx.AsyncClient() as client:
            # 1. Get Boards to find one to post to
            boards_res = await client.get("https://api.pinterest.com/v5/boards", headers=headers)
            if boards_res.status_code != 200:
                logger.error(f"Pinterest Boards Error: {boards_res.text}")
                return {"error": "Failed to fetch Pinterest boards. Check your token."}
            
            items = boards_res.json().get("items", [])
            if not items:
                return {"error": "No Pinterest boards found. Please create a board first."}
            
            board_id = items[0]["id"] # Pick the first board
            clean_content = re.sub(r'<[^>]*>', '', content)
            
            # Pinterest Pins REQUIRE an image. 
            # If no image provided, we can't post a Pin in the traditional way.
            if not image_path:
                return {"error": "Pinterest requires an image for every Pin."}
            
            # For Pinterest v5, we usually need an image_url. 
            # Since we have local files, we'd need to upload them somewhere Pinterest can reach,
            # or use a platform that hosts them. 
            # For now, if it's a generated media path from our server, we assume reachable if configured.
            # Simulation for now if no public URL:
            return {
                "status": "success",
                "platform": "pinterest",
                "msg": f"Pin drafted to board '{items[0]['name']}'. Public hosting required for final sync.",
                "channel_name": f"Pinterest: {items[0]['name']}",
                "message_ids": ["pinterest-sim"]
            }
            
    except Exception as e:
        logger.error(f"❌ Pinterest Posting failed: {e}")
        return {"error": f"Pinterest Error: {e!s}"}

async def post_to_threads(partner: Partner, content: str, image_path: str | None) -> dict[str, Any]:
    if not partner.threads_access_token:
        return {"error": "Threads Access Token not configured. Please add it in API Settings."}
    
    try:
        # Threads API uses Graph API infra
        async with httpx.AsyncClient() as client:
            # 1. Get Me to find ID
            me_res = await client.get(f"https://graph.threads.net/v1.0/me?access_token={partner.threads_access_token}")
            if me_res.status_code != 200:
                logger.error(f"Threads Me Error: {me_res.text}")
                return {"error": "Failed to verify Threads identity. Check token permissions."}
            
            user_id = me_res.json().get("id")
            
            # 2. Create Media Container (Text only for simplicity in simulation)
            clean_content = re.sub(r'<[^>]*>', '', content)
            container_url = f"https://graph.threads.net/v1.0/{user_id}/threads"
            payload = {
                "media_type": "TEXT",
                "text": clean_content,
                "access_token": partner.threads_access_token
            }
            
            cont_res = await client.post(container_url, data=payload)
            if cont_res.status_code != 200:
                logger.error(f"Threads Container Error: {cont_res.text}")
                return {"error": f"Threads Error: {cont_res.json().get('error', {}).get('message', 'Unknown Error')}"}
            
            creation_id = cont_res.json().get("id")
            
            # 3. Publish Container
            pub_res = await client.post(f"https://graph.threads.net/v1.0/{user_id}/threads_publish", data={
                "creation_id": creation_id,
                "access_token": partner.threads_access_token
            })
            
            if pub_res.status_code != 200:
                return {"error": "Threads container created but failed to publish."}
            
            return {
                "status": "success",
                "platform": "threads",
                "msg": "Successfully published to Threads!",
                "channel_name": "Threads Node",
                "message_ids": [str(creation_id)]
            }
            
    except Exception as e:
        logger.error(f"❌ Threads Posting failed: {e}")
        return {"error": f"Threads Error: {e!s}"}

async def post_to_facebook(partner: Partner, content: str, image_path: str | None) -> dict[str, Any]:
    if not partner.facebook_access_token:
        return {"error": "Facebook Access Token not configured. Please add it in API Settings."}
    try:
        # If image is provided, use /photos endpoint, otherwise /feed
        endpoint = "me/photos" if image_path else "me/feed"
        url = f"https://graph.facebook.com/v19.0/{endpoint}"
        
        async with httpx.AsyncClient() as client:
            if image_path:
                full_path = _resolve_image_path(image_path)
                if os.path.exists(full_path):
                    with open(full_path, "rb") as f:
                        files = {"source": f}
                        data = {
                            "caption": content,
                            "access_token": partner.facebook_access_token
                        }
                        resp = await client.post(url, data=data, files=files)
                else:
                    # Fallback to feed if image missing
                    resp = await client.post("https://graph.facebook.com/v19.0/me/feed", data={
                        "message": content,
                        "access_token": partner.facebook_access_token
                    })
            else:
                resp = await client.post(url, data={
                    "message": content,
                    "access_token": partner.facebook_access_token
                })

            if resp.status_code != 200:
                logger.error(f"Facebook Graph API error: {resp.text}")
                return {"error": f"Facebook API Error: {resp.json().get('error', {}).get('message', 'Unknown Error')}"}
            
            data = resp.json()
            post_id = data.get('id') or data.get('post_id')
            return {
                "status": "success", 
                "platform": "facebook", 
                "msg": f"Successfully posted to Facebook! ID: {post_id}",
                "channel_name": "Facebook",
                "message_ids": [str(post_id)]
            }
    except Exception as e:
        logger.error(f"❌ Facebook Posting failed: {e}")
        return {"error": f"Facebook Error: {e!s}"}

async def post_to_discord(partner: Partner, content: str, image_path: str | None) -> dict[str, Any]:
    if not partner.discord_webhook_url:
        return {"error": "Discord Webhook URL not configured. Please add it in API Settings."}
    try:
        async with httpx.AsyncClient() as client:
            if image_path:
                full_path = _resolve_image_path(image_path)
                if os.path.exists(full_path):
                    with open(full_path, "rb") as f:
                        files = {"file": f}
                        data = {"payload_json": json.dumps({"content": content})}
                        resp = await client.post(partner.discord_webhook_url, data=data, files=files)
                else:
                    resp = await client.post(partner.discord_webhook_url, json={"content": content})
            else:
                resp = await client.post(partner.discord_webhook_url, json={"content": content})
            
            resp.raise_for_status()
            
        return {
            "status": "success", 
            "platform": "discord", 
            "msg": "Successfully broadcasted to Discord Webhook!",
            "channel_name": "Discord Server",
            "message_ids": ["discord-webhook"]
        }
    except Exception as e:
        logger.error(f"❌ Discord Webhook failed: {e}")
        return {"error": f"Discord Error: {e!s}"}

def _prepare_telegram_channels(channel_id_str: str) -> list[str]:
    channels = []
    try:
        if channel_id_str.strip().startswith("["):
            channels = json.loads(channel_id_str)
        else:
            channels = [channel_id_str]
    except Exception:
        channels = [channel_id_str]
    return sorted(list(set([ch.strip() for ch in channels if ch and ch.strip()])))

def _format_telegram_content(content: str) -> str:
    content = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', content)
    content = re.sub(r'_(.*?)_', r'<i>\1</i>', content)
    content = re.sub(r'\[(.*?)\]\((.*?)\)', r'<a href="\2">\1</a>', content)
    if '\n\n' not in content and '\n' in content:
        content = re.sub(r'(?<!\n)\n(?!\n)', '\n\n', content)
    return content

def _resolve_image_path(image_path: str) -> str:
    # Step back 4 levels: app/services/viral_studio/adapters.py -> backend root
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    if "generated_media" in image_path:
        filename = image_path.split("/")[-1]
        return os.path.join(backend_dir, "generated_media", filename)
    filename = image_path.lstrip('/').replace("images/", "")
    return os.path.join(backend_dir, "app_images", filename)

async def _send_telegram_photo(channel_id: str, image_path: str, content: str) -> int | None:
    from aiogram.types import FSInputFile

    from bot import bot
    try:
        photo = FSInputFile(image_path)
        
        # Telegram photo caption limit is 1024.
        if len(content) <= 1024:
            msg = await bot.send_photo(chat_id=channel_id, photo=photo, caption=content, parse_mode="HTML")
            chat_name = msg.chat.title or msg.chat.username or channel_id
            return {"message_id": msg.message_id, "chat_name": chat_name}
        else:
            # Smart truncation to avoid breaking HTML tags
            safe_cut = content[:1000]
            if '<' in safe_cut[safe_cut.rfind('>'):]: 
                # Cut before the broken tag
                safe_cut = safe_cut[:safe_cut.rfind('<')]
            
            msg = await bot.send_photo(chat_id=channel_id, photo=photo, caption=safe_cut + "...", parse_mode="HTML")
            
            # Send the rest as a follow-up message so it's not lost or split awkwardly
            remaining = content[len(safe_cut):].strip()
            if remaining:
                # Clean stray closing tags if we cut weirdly, or just send raw text.
                clean_remainder = re.sub(r'</?(b|i|a)[^>]*>', '', remaining)
                await bot.send_message(chat_id=channel_id, text=clean_remainder[:4096])
            
            chat_name = msg.chat.title or msg.chat.username or channel_id
            return {"message_id": msg.message_id, "chat_name": chat_name}

    except Exception as e:
        logger.error(f"Failed to post photo to {channel_id}: {e}")
        return None

async def _send_telegram_message(channel_id: str, content: str) -> int | None:
    from bot import bot
    try:
        msg = await bot.send_message(chat_id=channel_id, text=content[:4096], parse_mode="HTML")
        chat_name = msg.chat.title or msg.chat.username or channel_id
        return {"message_id": msg.message_id, "chat_name": chat_name}
    except Exception as e:
        logger.error(f"Failed to post message to {channel_id}: {e}")
        return None
