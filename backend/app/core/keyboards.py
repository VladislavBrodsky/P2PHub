from aiogram import types
from aiogram.utils.keyboard import InlineKeyboardBuilder

def get_main_menu_keyboard(url: str):
    builder = InlineKeyboardBuilder()
    builder.row(types.InlineKeyboardButton(
        text="🚀 Open Partner Hub", 
        web_app=types.WebAppInfo(url=url)
    ))
    return builder.as_markup()
