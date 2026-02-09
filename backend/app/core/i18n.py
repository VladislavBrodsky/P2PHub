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
            "🎉 *Congratulations, your team is growing!*\n\n"
            "➕ You’ve just invited {name}{username} (L1) to join the journey!\n"
            "🚀 +35 XP credited to your balance! Keep up the great work!"
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
        "referral_deep_activity": (
            "🔥 *Network on Fire!* 🔥\n\n"
            "Someone in your downline just joined at *Level {level}*!\n"
            "Your passive income empire is growing! 🌍"
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
            "🎉 *Поздравляем, ваша команда растет!*\n\n"
            "➕ Вы только что пригласили {name}{username} (L1) в это путешествие!\n"
            "🚀 +35 XP зачислено на ваш баланс! Так держать!"
        ),
        "level_up": (
            "🏆 *Новый Уровень!* 🏆\n\n"
            "Вы достигли *Уровня {level}*!\n\n"
            "Продолжайте, чтобы открыть Платиновый уровень и получить больше наград! 🚀"
        ),
        "task_completed": (
            "✅ *Задание Выполнено!*\n\n"
            "Вы заработали *+{reward} XP*.\n"
            "Ваш путь к вершине продолжается! 🌟"
        ),
        "referral_deep_activity": (
            "🔥 *Сеть в Огне!* 🔥\n\n"
            "Кто-то в вашей структуре присоединился на *Уровне {level}*!\n"
            "Ваша империя пассивного дохода растет! 🌍"
        ),
        "share_text": "🚀 Присоединяйся ко мне в Pintopay и зарабатывай $1 в минуту! Стань частью революции децентрализованных платежей. 💎"
    }
}

def get_msg(code: str, key: str, **kwargs) -> str:
    lang = code if code in MESSAGES else "en"
    msg = MESSAGES[lang].get(key, MESSAGES["en"].get(key, ""))
    return msg.format(**kwargs)
