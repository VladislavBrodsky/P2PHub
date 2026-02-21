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

        # Transform HTML to Newlines
        clean_content = content.replace("<br>", "\n").replace("<p>", "").replace("</p>", "\n")
        clean_content = re.sub(r'<[^>]*>', '', clean_content)
        clean_content = re.sub(r'\[(.*?)\]\((https?://.*?)\)', r'\1: \2', clean_content)
        clean_content = clean_content.replace('**', '').replace('__', '').replace('*', '')

        final_text = clean_content.strip()
        response = await loop.run_in_executor(None, lambda: client.create_tweet(text=final_text, media_ids=media_ids if media_ids else None))
        
        tweet_id = response.data.get("id")
        logger.info(f"✅ X Posting Successful: Tweet ID {tweet_id}")
        
        return {
            "status": "success", 
            "platform": "x", 
            "msg": f"Successfully posted to X! Tweet ID: {tweet_id}",
            "tweet_id": tweet_id
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

    for i, msg_id in enumerate(sent_msg_ids):
        channel_id = channels[i]
        if msg_id:
            success_count += 1
            message_ids.append(f"{channel_id}:{msg_id}")
            results.append(f"✅ {channel_id}")
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

async def post_to_linkedin(partner: Partner, content: str, image_path: str | None) -> dict[str, Any]:
    if not partner.linkedin_access_token:
        return {"error": "LinkedIn API not configured. Upgrade to ELITE integration required."}
    return {"status": "success", "platform": "linkedin", "msg": "Syndicated to LinkedIn Network (PRO Simulation)"}

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
            return msg.message_id
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
                
            return msg.message_id

    except Exception as e:
        logger.error(f"Failed to post photo to {channel_id}: {e}")
        return None

async def _send_telegram_message(channel_id: str, content: str) -> int | None:
    from bot import bot
    try:
        msg = await bot.send_message(chat_id=channel_id, text=content[:4096], parse_mode="HTML")
        return msg.message_id
    except Exception as e:
        logger.error(f"Failed to post message to {channel_id}: {e}")
        return None
