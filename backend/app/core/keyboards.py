from aiogram import types
from aiogram.utils.keyboard import InlineKeyboardBuilder


def get_main_menu_keyboard(url: str, referral_link: str = "", referral_code: str = ""):
    builder = InlineKeyboardBuilder()
    builder.row(types.InlineKeyboardButton(
        text="🚀 Open App",
        web_app=types.WebAppInfo(url=url)
    ))
    if referral_link:
        builder.row(types.InlineKeyboardButton(
            text="📲 Share Link (Immediate)",
            url=referral_link
        ))

    # Ensure Send Premium Card is ALWAYS visible
    query_code = referral_code if referral_code else "start"
    builder.row(types.InlineKeyboardButton(
        text="💎 Send Premium Card",
        switch_inline_query=query_code
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

def get_support_keyboard():
    builder = InlineKeyboardBuilder()
    categories = [
        ("💳 Cards", "sup_cards"),
        ("🚀 Setup", "sup_setup"),
        ("💰 Top-up", "sup_topup"),
        ("📲 Mobile", "sup_mobile"),
        ("💎 PRO", "sup_pro"),
        ("🤝 Partner", "sup_partner"),
        ("🔒 Safety", "sup_safety"),
        ("⚡ Trading", "sup_trading"),
        ("☎️ VIP VIP", "sup_vip")
    ]
    
    # 3 buttons per row for 9 categories
    for i in range(0, len(categories), 3):
        row = [types.InlineKeyboardButton(text=text, callback_data=data) for text, data in categories[i:i+3]]
        builder.row(*row)
    
    return builder.as_markup()
