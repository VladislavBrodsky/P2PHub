from aiogram import types
from aiogram.utils.keyboard import InlineKeyboardBuilder

def get_main_menu_keyboard(url: str, referral_link: str = "", share_text: str = ""):
    builder = InlineKeyboardBuilder()
    builder.row(types.InlineKeyboardButton(
        text="🚀 Open App", 
        web_app=types.WebAppInfo(url=url)
    ))
    if referral_link:
        if not share_text:
            share_text = "🚀 Join me on Pintopay and earn $1 per minute! Join the revolution in decentralized payments. 💎"
        
        builder.row(types.InlineKeyboardButton(
            text="🤝 Share Referral Link",
            url=f"https://t.me/share/url?url={referral_link}&text={share_text}"
        ))
    builder.row(types.InlineKeyboardButton(
        text="📢 Join Community",
        url="https://t.me/pintopay_superapp"
    ))
    builder.row(types.InlineKeyboardButton(
        text="💎 Pintopay Super App",
        url="https://t.me/pintopaybot?start=p_6977c29c66ed9faa401342f3"
    ))
    return builder.as_markup()
