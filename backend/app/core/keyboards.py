from aiogram import types
from aiogram.utils.keyboard import InlineKeyboardBuilder

def get_main_menu_keyboard(url: str, referral_link: str = "", referral_code: str = ""):
    builder = InlineKeyboardBuilder()
    builder.row(types.InlineKeyboardButton(
        text="🚀 Open App", 
        web_app=types.WebAppInfo(url=url)
    ))
    if referral_code:
        builder.row(types.InlineKeyboardButton(
            text="📲 Share Link (Immediate)",
            switch_inline_query=referral_code
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

def get_pro_payment_keyboard(address: str, amount_ton: float):
    builder = InlineKeyboardBuilder()
    # Deep link to TON wallet if possible, otherwise just instructions
    ton_link = f"ton://transfer/{address}?amount={int(amount_ton * 10**9)}"
    
    builder.row(types.InlineKeyboardButton(
        text=f"💎 Pay {amount_ton} TON",
        url=ton_link
    ))
    builder.row(types.InlineKeyboardButton(
        text="✅ Verify Payment",
        callback_data="verify_pro_payment"
    ))
    builder.row(types.InlineKeyboardButton(
        text="❌ Cancel",
        callback_data="cancel_payment"
    ))
    return builder.as_markup()

