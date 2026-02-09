MESSAGES = {
    "en": {
        "welcome": (
            "💎 *Welcome to Pintopay Partner*\n\n"
            "You are early! 🚀\n"
            "Join the revolution in decentralized payments.\n"
            "Earn XP, invite friends, and unlock exclusive rewards.\n\n"
            "🔗 *Your Referral Link:*\n`{referral_link}`\n\n"
            "👇 *Start your journey below*"
        ),
        "referral_l1_congrats": (
            "🤝 *New Direct Partner!* (L1)\n\n"
            "👤 {name}\n"
            "📈 *Status:* Just joined your first line!\n"
            "💰 *Reward:* `+35 XP` credited.\n\n"
            "🚀 *Keep going!* Every direct invite builds your foundation."
        ),
        "referral_l2_congrats": (
            "👥 *Team Expansion!* (L2)\n\n"
            "Someone just joined your *2nd level*!\n\n"
            "📊 *Referral Line:*\n"
            "{referral_chain}\n\n"
            "💰 *Reward:* `+10 XP` credited.\n"
            "🚀 Your network is growing automatically!"
        ),
        "referral_deep_activity": (
            "🌐 *Network Pulse* (L{level})\n\n"
            "New partner joined at *Level {level}*!\n\n"
            "📊 *Referral Line:*\n"
            "{referral_chain}\n\n"
            "💰 *Reward:* `+1 XP` credited.\n"
            "🏰 Your empire is expanding deep! 🌍"
        ),
        "level_up": (
            "🏆 *Level Up!* 🏆\n\n"
            "You've reached *Level {level}*!\n\n"
            "Keep going to unlock the Platinum Tier and earn more rewards! 🚀"
        ),
        "task_completed": (
            "✅ *Task Completed!*\n\n"
            "You earned *+{reward} XP*.\n"
            "Your journey to the top continues! 🌟"
        ),
        "share_text": "🚀 Join me on Pintopay and earn $1 per minute! Join the revolution in decentralized payments. 💎"
    },
    "ru": {
        "welcome": (
            "💎 *Добро пожаловать в Pintopay Partner*\n\n"
            "Вы в числе первых! 🚀\n"
            "Присоединяйтесь к революции децентрализованных платежей.\n"
            "Зарабатывайте XP, приглашайте друзей и открывайте эксклюзивные награды.\n\n"
            "🔗 *Ваша реферальная ссылка:*\n`{referral_link}`\n\n"
            "👇 *Начните свой путь ниже*"
        ),
        "referral_l1_congrats": (
            "🤝 *Новый прямой партнер!* (L1)\n\n"
            "👤 {name}\n"
            "📈 *Статус:* Присоединился к вашей первой линии!\n"
            "💰 *Награда:* `+35 XP` зачислено.\n\n"
            "🚀 *Так держать!* Каждое приглашение укрепляет ваш фундамент."
        ),
        "referral_l2_congrats": (
            "👥 *Расширение команды!* (L2)\n\n"
            "Кто-то присоединился на ваш *2-й уровень*!\n\n"
            "📊 *Цепочка приглашений:*\n"
            "{referral_chain}\n\n"
            "💰 *Награда:* `+10 XP` зачислено.\n"
            "🚀 Ваша сеть растет автоматически!"
        ),
        "referral_deep_activity": (
            "🌐 *Пульс Сети* (L{level})\n\n"
            "Новый партнер на *Уровне {level}*!\n\n"
            "📊 *Цепочка приглашений:*\n"
            "{referral_chain}\n\n"
            "💰 *Награда:* `+1 XP` зачислено.\n"
            "🏰 Ваша империя растет вглубь! 🌍"
        ),
        "share_text": "🚀 Присоединяйся ко мне в Pintopay и зарабатывай $1 в минуту! Стань частью революции децентрализованных платежей. 💎"
    }
}

def get_msg(code: str, key: str, **kwargs) -> str:
    lang = code if code in MESSAGES else "en"
    msg = MESSAGES[lang].get(key, MESSAGES["en"].get(key, ""))
    return msg.format(**kwargs)
