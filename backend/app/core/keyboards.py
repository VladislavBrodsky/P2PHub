from aiogram import types
from aiogram.utils.keyboard import InlineKeyboardBuilder

def get_main_menu_keyboard(url: str, referral_link: str = "", referral_code: str = ""):
    builder = InlineKeyboardBuilder()
    builder.row(types.InlineKeyboardButton(
        text="🚀 Open App", 
        web_app=types.WebAppInfo(url=url)
    ))
    if referral_code:
        # Viral message for direct sharing - IMMEDIATE FLOW
        share_text = "🚀 STOP BLEEDING MONEY! Join Pintopay and unlock $1/minute strategy! 💎"
        builder.row(types.InlineKeyboardButton(
            text="📲 Share Link (Immediate)",
            url=f"https://t.me/share/url?url={referral_link}&text={share_text}"
        ))
        
        # Premium card flow - TWO-STEP FLOW
        builder.row(types.InlineKeyboardButton(
            text="💎 Send Premium Card",
            switch_inline_query=referral_code
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
