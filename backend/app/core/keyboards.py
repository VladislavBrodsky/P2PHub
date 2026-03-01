from aiogram import types
from aiogram.utils.keyboard import InlineKeyboardBuilder

from app.core.i18n import get_msg


def get_main_menu_keyboard(url: str, referral_link: str = "", referral_code: str = "", lang: str = "en"):
    builder = InlineKeyboardBuilder()
    builder.row(types.InlineKeyboardButton(
        text=get_msg(lang, "btn_open_app"),
        web_app=types.WebAppInfo(url=url)
    ))
    if referral_link:
        builder.row(types.InlineKeyboardButton(
            text=get_msg(lang, "btn_share_link"),
            url=referral_link
        ))

    # Ensure Send Premium Card is ALWAYS visible
    query_code = referral_code if referral_code else "start"
    builder.row(types.InlineKeyboardButton(
        text=get_msg(lang, "btn_send_card"),
        switch_inline_query=query_code
    ))

    builder.row(types.InlineKeyboardButton(
        text=get_msg(lang, "btn_join_community"),
        url="https://t.me/pintopay_superapp"
    ))

    builder.row(types.InlineKeyboardButton(
        text=get_msg(lang, "btn_super_app"),
        url="https://t.me/pintopaybot?start=p_6977c29c66ed9faa401342f3"
    ))
    return builder.as_markup()

def get_pro_payment_keyboard(address: str, amount_ton: float, lang: str = "en"):
    builder = InlineKeyboardBuilder()
    # Deep link to TON wallet if possible, otherwise just instructions
    ton_link = f"ton://transfer/{address}?amount={int(amount_ton * 10**9)}"

    builder.row(types.InlineKeyboardButton(
        text=get_msg(lang, "btn_pay_ton", amount=amount_ton),
        url=ton_link
    ))
    builder.row(types.InlineKeyboardButton(
        text=get_msg(lang, "btn_verify_payment"),
        callback_data="verify_pro_payment"
    ))
    builder.row(types.InlineKeyboardButton(
        text=get_msg(lang, "btn_cancel"),
        callback_data="cancel_payment"
    ))
    return builder.as_markup()

def get_support_keyboard(lang: str = "en"):
    builder = InlineKeyboardBuilder()
    categories = [
        (get_msg(lang, "btn_sup_cards"), "sup_cards"),
        (get_msg(lang, "btn_sup_setup"), "sup_setup"),
        (get_msg(lang, "btn_sup_topup"), "sup_topup"),
        (get_msg(lang, "btn_sup_mobile"), "sup_mobile"),
        (get_msg(lang, "btn_sup_pro"), "sup_pro"),
        (get_msg(lang, "btn_sup_partner"), "sup_partner"),
        (get_msg(lang, "btn_sup_safety"), "sup_safety"),
        (get_msg(lang, "btn_sup_trading"), "sup_trading"),
        (get_msg(lang, "btn_sup_vip"), "sup_vip")
    ]
    
    # 3 buttons per row for 9 categories
    for i in range(0, len(categories), 3):
        row = [types.InlineKeyboardButton(text=text, callback_data=data) for text, data in categories[i:i+3]]
        builder.row(*row)
    
    return builder.as_markup()

def get_onboarding_keyboard(lang: str = "en"):
    builder = InlineKeyboardBuilder()
    builder.row(types.InlineKeyboardButton(
        text=get_msg(lang, "btn_verify_now"),
        callback_data="start_verification"
    ))
    builder.row(types.InlineKeyboardButton(
        text=get_msg(lang, "btn_learn_more"),
        callback_data="onboarding_info"
    ))
    return builder.as_markup()

def get_verification_keyboard(lang: str = "en"):
    builder = InlineKeyboardBuilder()
    builder.row(types.InlineKeyboardButton(
        text=get_msg(lang, "btn_verify_phone"),
        callback_data="verify_phone"
    ))
    builder.row(types.InlineKeyboardButton(
        text=get_msg(lang, "btn_verify_passport"),
        callback_data="verify_passport"
    ))
    # Test Environment Bypass
    builder.row(types.InlineKeyboardButton(
        text=get_msg(lang, "btn_test_verify"),
        callback_data="test_verify_bypass"
    ))
    return builder.as_markup()

def get_main_active_menu_keyboard(lang: str = "en"):
    # Using ReplyKeyboardMarkup for persistent presence
    kb = [
        [
            types.KeyboardButton(text=get_msg(lang, "btn_menu_profile")),
            types.KeyboardButton(text=get_msg(lang, "btn_menu_balance"))
        ],
        [
            types.KeyboardButton(text=get_msg(lang, "btn_menu_topup")),
            types.KeyboardButton(text=get_msg(lang, "btn_menu_payout"))
        ],
        [
            types.KeyboardButton(text=get_msg(lang, "btn_menu_purchase")),
            types.KeyboardButton(text=get_msg(lang, "btn_menu_history"))
        ],
        [
            types.KeyboardButton(text=get_msg(lang, "btn_open_app")) # Keeping Mini App access e.g. for TMA
        ]
    ]
    return types.ReplyKeyboardMarkup(keyboard=kb, resize_keyboard=True)
