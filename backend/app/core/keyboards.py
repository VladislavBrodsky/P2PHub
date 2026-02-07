from aiogram import types
from aiogram.utils.keyboard import InlineKeyboardBuilder

def get_main_menu_keyboard(url: str):
    builder = InlineKeyboardBuilder()
    builder.row(types.InlineKeyboardButton(
        text="🚀 Open App", 
        web_app=types.WebAppInfo(url=url)
    ))
    builder.row(types.InlineKeyboardButton(
        text="📢 Join Community",
        url="https://t.me/pintopay_superapp"
    ))
    return builder.as_markup()
