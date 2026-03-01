# Referral Notification Update Trigger
MESSAGES = {
    "en": {
        "welcome": (
            "💎 *Welcome, {name}!*\n\n"
            "🔥 *Transition from consumer to architect.*\n\n"
            "You are officially a *Core Partner*! You are early 🚀\n\n"
            "You’ve just entered the *future of decentralized finance*. While others observe, you’re already building a sovereign legacy.\n\n"
            "💰 *Earn XP. Grow your influence. Secure strategic rewards.*\n\n"
            "🔗 *Your Personal Gateway:*\n`{referral_link}`\n\n"
            "👇 *Tap below to start your journey*"
        ),
        "welcome_back": (
            "👋 *Welcome Back, {name}!*\n\n"
            "Your network efficiency remains stable. Review your latest growth and rewards in the Partner App below!\n\n"
            "🚀 Let's achieve the next milestone today."
        ),
        "referral_l1_congrats": (
            "⚡ *Direct Connection Established!* ⚡\n\n"
            "👤 *Partner:* {name}\n"
            "📈 *Depth:* Level 1\n"
            "💎 *Status:* Active Integration\n"
            "💰 *Reward:* `+{xp} XP`\n\n"
            "🚀 *Your network foundation strengthens!*"
        ),
        "referral_l2_congrats": (
            "📊 Your network is working for you!\n\n"
            "🧬 Network: {referral_chain}\n\n"
            "📈 Depth: Level 2\n"
            "💰 Reward: `+{xp} XP`\n\n"
            "🚀 Your empire is scaling automatically!"
        ),
        "referral_deep_activity": (
            "📊 Your network is working for you!\n\n"
            "🧬 Network: {referral_chain}\n\n"
            "📈 Depth: Level {level}\n"
            "💰 Reward: `+{xp} XP`\n\n"
            "🏆 Your global influence grows!"
        ),
        "level_up": (
            "🏆 *RANK UPGRADE: LEVEL {level}!* 🏆\n\n"
            "⭐ *Status:* New Milestone Achieved\n"
            "🚀 *Continue scaling your empire to unlock advanced tiers!*"
        ),
        "level_up_multi": (
            "🔥 *MEGA RANK UPGRADE!* 🔥\n\n"
            "📈 *Jump:* L{old_level} ➡️ L{new_level}\n"
            "✨ *Status:* Advanced rewards optimized\n"
            "🚀 *Your network efficiency is unmatched!*"
        ),
        "task_completed": (
            "✅ *Task Completed!*\n\n"
            "You earned *+{reward} XP*.\n"
            "🌟 Your journey to the top continues!"
        ),
        "share_text": "Join me on Pintopay and build your financial legacy! The future of decentralized payments is here",
        "pro_welcome": (
            "👑 *WELCOME TO THE PINTOPAY CORE!* 👑\n\n"
            "You have just unlocked the *Advanced Infrastructure* of the Pintopay Network!\n\n"
            "🚀 *Your Strategic Advantages:*\n"
            "• *20-Level Empire:* Earn from every participant in your structure down to Level 20.\n"
            "• *3x XP Acceleration:* Reach top tiers with maximum efficiency.\n"
            "• *Leadership Status:* You are now a recognized architect of the network.\n\n"
            "✨ *Your influence is now significantly enhanced. Build your legacy!* 🏰"
        ),
        "pro_plus_welcome": (
            "👑 *WELCOME TO THE PINTOPAY PRO+ EMPIRE!* 👑\n\n"
            "You have unlocked the *Ultimate Infrastructure* of our ecosystem!\n\n"
            "🚀 *Elite Strategic Advantages:*\n"
            "• *Maximum Scale:* Full 20-level revenue sync enabled.\n"
            "• *AI Priority:* Hyper-accelerated growth with our best tools.\n"
            "• *VIP Omni-Channel:* Seamless management to dominate the market.\n\n"
            "✨ *Your influence is unstoppable. Welcome to the top.* 🏰"
        ),
        "pro_viral_announcement": (
            "🔥 *MEGA ANNOUNCEMENT!* 🔥\n\n"
            "I just went *PRO* on the Pintopay Network! 💎\n\n"
            "I've unlocked *20 levels of affiliate commissions* and powerful network boosts. This is the absolute peak of decentralized networking.\n\n"
            "Don't stay on the sidelines while we build the future of payments. 🚀\n\n"
            "🔗 *Join my structure now:* {referral_link}"
        ),
        "pro_plus_viral_announcement": (
            "🚀 *THE EMPIRE HAS ARRIVED!* 🚀\n\n"
            "I just upgraded to *PRO+ ELITE* status on Pintopay! 👑\n\n"
            "I've unlocked the *Maximum Multiplier*, VIP AI Priority, and full 20-level revenue sync. This is structural superiority. 🏰\n\n"
            "Ready to build at the highest level? My structure is open for architects. 💎\n\n"
            "🔗 *Secure your spot under me:* {referral_link}"
        ),
        "commission_received": (
            "💰 *USDT COMMISSION SECURED!* 💰\n\n"
            "👤 *Partner:* {from_user}\n"
            "📈 *Depth:* Level {level}\n"
            "💎 *Status:* PRO Upgrade\n"
            "💸 *Payout:* `${amount} USDT`\n\n"
            "🌟 *Your infrastructure is generating value 24/7!*"
        ),
        "referral_upgrade_announcement": (
            "⚡ *An upgrade occurred in your elite structure!*\n\n"
            "👤 *Partner:* {buyer_name}\n"
            "📈 *Depth:* Level {level}\n"
            "💎 *New Tier:* {plan_name}\n"
            "💰 *Reward:* `${amount} USDT`\n\n"
            "🚀 As a *PRO+ Leader*, you are receiving active rewards from this structural growth.\n"
            "🏆 *Your empire continues to scale!*"
        ),
        "viral_share_caption": (
            "🛑 EVOLVE BEYOND TRADITIONAL BANKING! \n"
            "Join the Pintopay Global Partner Network and achieve financial sovereignty. 🚀"
        ),
        "pro_fomo_missed": (
            "🔒 *POTENTIAL REWARD MISSED!* 🔒\n\n"
            "📈 *Depth:* Level {level}\n"
            "💎 *Status:* PRO Upgrades Unclaimed\n\n"
            "👑 *Upgrade to PRO to unlock 20 levels of USDT rewards and Fast XP!*\n"
            "🏰 *Secure your future growth today!*"
        ),
        "commission_fomo_missed": (
            "⚠️ *UNCLAIMED USDT REWARD!* ⚠️\n\n"
            "💸 *Missed:* `${amount} USDT`\n"
            "📈 *Depth:* Level {level}\n"
            "✖️ *Reason:* Depth not accessible\n\n"
            "🚀 *Upgrade to {target_plan} to optimize your reward structure!*"
        ),
        "upgrade_xp_bonus": (
            "⚡️ *XP BOOST UNLOCKED!* ⚡️\n\n"
            "💎 *Bonus:* `+{xp} XP`\n"
            "🚀 *Your rank acceleration is active.*\n"
            "🏆 *Closer to the Platinum Metal Card!*"
        ),
        "btn_upgrade": "👑 Upgrade Plan",
        "btn_view_network": "📊 View Network",
        "btn_check_balance": "💰 Check Balance",
        "btn_extend_sub": "💎 Extend Subscription",
        "btn_reactivate_sub": "👑 Reactivate PRO",
        
        "sub_warning_title": "⚠️ *PRO Subscription Notice*",
        "sub_warning_body": "Your PRO membership status will adjust in *{days} days*.\n\n💰 *Price to Maintain Status:* ${price}\n\nExtend now to maintain your advanced infrastructure and network rewards!",
        "sub_expired_title": "❌ *Subscription Expired*",
        "sub_expired_body": "Your PRO membership status has been reset. Access to advanced features is now limited.\n\nRe-activate your PRO status to restore your reward depth and infrastructure tools.",
        
        "viralkit_intro": "🎁 *VIRAL KIT UNLOCKED!*\n\nShare this message to announce your PRO status and attract more partners:\n\n---",
        "admin_payment_success": "✅ <b>SUCCESSFUL {plan} PURCHASE</b>\n\n👤 <b>User:</b> {user} (<code>{user_id}</code>)\n💰 <b>Amount:</b> ${amount} {currency}\n🔗 <b>Hash:</b> <code>{hash}</code>\n📊 <b>Plan:</b> {plan_type}\n⌛ <b>Expires:</b> {expires}\n\nVerified and commissions distributed.",
        "admin_payment_success_parse_mode": "HTML",
        "admin_manual_payment": "🚨 <b>NEW MANUAL PAYMENT PENDING REVIEW</b> 🚨\n\n👤 <b>User:</b> {user} (<code>{user_id}</code>)\n💰 <b>Amount:</b> ${amount} {currency}\n🌐 <b>Network:</b> {network}\n📝 <b>TX Hash:</b> <code>{hash}</code>\n\n🆔 <b>Trans ID:</b> <code>{trans_id}</code>\n\n👉 <b>Action Required:</b> Please verify this transaction in the Admin Panel or use /admin commands.",
        
        # Bot Commands & Messages
        "not_registered_error": "⚠️ You are not registered yet. Type /start to join!",
        "fetch_stats_error": "⚠️ Error fetching stats: {e}",
        "my_network_title": "🌳 *Your Referral Network*",
        "my_network_total": "Total Partners: *{count}*",
        "my_network_level_count": "Level {level}: {count} partners",
        "my_network_empty": "\n_You haven't invited anyone yet. Share your link to start earning!_",
        
        "support_intro": (
            "🌟 *Pintopay CUSTOMER CARE*\n\n"
            "How can we optimize your ecosystem today?\n"
            "Select a category below for instant guidance and 5-star support from our expert team."
        ),
        "support_category_details": (
            "📍 *{category_name}*\n\n"
            "Quick Instructions:\n{instr_text}\n\n"
            "💡 *Need more help?* Just reply to this message and our Expert AI Support Team will assist you instantly!"
        ),
        "support_error": "I apologize, but my circuits are currently busy improving our elite services. Please try again in 30 seconds!",
        
        "cat_cards": "💳 Virtual & Physical Cards",
        "cat_setup": "🚀 Card Setup & Activation",
        "cat_topup": "💰 Top-ups & Crypto Deposits",
        "cat_mobile": "📲 Mobile Payments (Apple/Google Pay)",
        "cat_pro": "💎 PRO Membership & Benefits",
        "cat_partner": "🤝 Partner Network & Earnings",
        "cat_safety": "🔒 Account Security & Safety",
        "cat_trading": "⚡ Trading & Transactions",
        "powered_by": "Powered by Pintopay Elite Support",
        "cat_general": "General",
        
        "already_pro": "✅ You are already a PRO member! Enjoy your benefits.",
        "upgrade_pro_details": (
            "👑 *UPGRADE TO PRO*\n\n"
            "Unlock the full potential of Pintopay:\n"
            "• 20-Level Empire System\n"
            "• Fast XP Boost (up to 3x)\n"
            "• Priority Payouts\n"
            "• VIP Support\n\n"
            "💰 *Price:* {amount} TON (~$39)\n"
            "⏳ *Valid for:* 10 minutes\n\n"
            "Please send the exact amount to the address below:"
        ),
        "session_creation_error": "⚠️ Session creation failed. Please try again later.",
        "verify_pro_step": (
            "📝 *Verification Step*\n\n"
            "Please paste the *Transaction Hash* (TX ID) of your payment below. "
            "I will verify it on the TON blockchain immediately."
        ),
        "verifying_transaction": "⏳ *Verifying transaction...* Please wait a moment.",
        "welcome_pro_verified": (
            "🎉 *WELCOME TO PRO!*\n\n"
            "Your payment has been verified. You now have full access to all premium features!"
        ),
        "what_next": "What would you like to do next?",
        "verification_failed": (
            "❌ *Verification Failed*\n\n"
            "I couldn't find a matching transaction for this hash, or your payment session has expired (10 min limit).\n\n"
            "If you just paid, wait 30 seconds and try again. If the session expired, please start a new one."
        ),
        "verification_error": "⚠️ Verification error. Please contact support.",
        "payment_cancelled": "❌ Payment cancelled. You can upgrade to PRO anytime by typing /pro.",

        # Keyboards
        "btn_open_app": "🚀 Open App",
        "btn_share_link": "📲 Share Link (Immediate)",
        "btn_send_card": "💎 Send Premium Card",
        "btn_join_community": "📢 Join Community",
        "btn_super_app": "💎 Pintopay Ecosystem",
        "btn_pay_ton": "💎 Pay {amount} TON",
        "btn_verify_payment": "✅ Verify Payment",
        "btn_cancel": "❌ Cancel",
        "btn_sup_cards": "💳 Cards",
        "btn_sup_setup": "🚀 Setup",
        "btn_sup_topup": "💰 Top-up",
        "btn_sup_mobile": "📲 Mobile",
        "btn_sup_pro": "💎 PRO",
        "btn_sup_partner": "🤝 Partner",
        "btn_sup_safety": "🔒 Safety",
        "btn_sup_trading": "⚡ Trading",
        "btn_sup_vip": "☎️ VIP VIP",
        "btn_try_again": "🔄 Try Again",
        "you": "You",

        # Onboarding & Verification
        "onboarding_welcome": (
            "💎 *Welcome, {name}!*\n\n"
            "🔥 *Transition from consumer to architect.*\n\n"
            "You are officially a *Core Partner*! You are early 🚀\n\n"
            "You’ve just entered the *future of decentralized finance*. While others observe, you’re already building a sovereign legacy.\n\n"
            "💰 *Earn XP. Grow your influence. Secure strategic rewards.*\n\n"
            "🔗 *Your Personal Gateway:*\n`{referral_link}`\n\n"
            "👇 *Tap below to start your journey*"
        ),
        "onboarding_info_text": "💎 *Why Verify?*\n\n1. *High Limits*: Move capital without restrictions.\n2. *Card Access*: Order virtual and physical Pintopay Mastercards.\n3. *Network Rewards*: Unlock 20 levels of affiliate revenue.\n\nChoose your verification method below.",
        "verification_start": "📝 *Digital Identity Verification*\n\nPlease choose a verification method. For testing purposes, you can use the *Test Verify* option.",
        "verification_success": "✅ *Verification Complete!*\n\nWelcome, Architect. Your identity is now synced with the Pintopay Network. You have full access to our financial instruments.",
        "prompt_phone": "📱 Please share your phone number using the button below to verify your account.",
        "prompt_passport": "🛂 Please upload a clear photo of your Passport or ID card for verification.",
        "processing_verification": "⏳ *Processing your data...* This usually takes 5-10 minutes. We will notify you once approved.",

        # Main Menu Buttons
        "btn_verify_now": "🚀 Verify Now",
        "btn_learn_more": "🔍 Learn More",
        "btn_verify_phone": "📱 Verify Phone",
        "btn_verify_passport": "🛂 Verify Passport",
        "btn_test_verify": "🛠️ Test Verify (Dev)",
        "btn_menu_profile": "👤 Profile",
        "btn_menu_balance": "💰 Balance",
        "btn_menu_topup": "💳 Top-up",
        "btn_menu_payout": "💸 Payout",
        "btn_menu_purchase": "🔄 Purchase",
        "btn_menu_history": "📊 History"
    },
    "ru": {
        "welcome": (
            "💎 *Добро пожаловать, {name}!*\n\n"
            "🔥 *Путь от потребителя к архитектору.*\n\n"
            "Вы официально — *Core Partner*! Вы в числе первых 🚀\n\n"
            "Вы только что вошли в *будущее децентрализованных финансов*. Пока другие наблюдают, вы уже строите суверенное наследие.\n\n"
            "💰 *Зарабатывайте XP. Растите влияние. Получайте стратегические награды.*\n\n"
            "🔗 *Ваш персональный вход:*\n`{referral_link}`\n\n"
            "👇 *Нажмите ниже, чтобы начать путь*"
        ),
        "welcome_back": (
            "👋 *С возвращением, {name}!*\n\n"
            "Узлы вашей сети функционируют стабильно. Проверьте новые вехи и показатели вашей структуры в приложении!\n\n"
            "🚀 Время достичь новых стратегических вершин."
        ),
        "referral_l1_congrats": (
            "⚡ *Прямое подключение установлено!* ⚡\n\n"
            "👤 *Партнер:* {name}\n"
            "📈 *Глубина:* Уровень 1\n"
            "💎 *Статус:* Активная Интеграция\n"
            "💰 *Награда:* `+{xp} XP`\n\n"
            "🚀 *Фундамент вашей сети укрепляется!*"
        ),
        "referral_l2_congrats": (
            "📊 Твоя сеть работает на тебя!\n\n"
            "🧬 Сеть: {referral_chain}\n\n"
            "📈 Глубина: Уровень 2\n"
            "💰 Награда: +{xp} XP\n\n"
            "🚀 Ваша империя масштабируется автоматически 24/7!"
        ),
        "referral_deep_activity": (
            "📊 Твоя сеть работает на тебя!\n\n"
            "🧬 Сеть: {referral_chain}\n\n"
            "📈 Глубина: Уровень {level}\n"
            "💰 Награда: `+{xp} XP`\n\n"
            "🏆 Ваше глобальное влияние растет!"
        ),
        "level_up": (
            "🏆 *АПГРЕЙД РАНГА: УРОВЕНЬ {level}!* 🏆\n\n"
            "⭐ *Статус:* Достигнута Новая Веха\n"
            "🚀 *Продолжайте масштабировать империю для лучших наград!*"
        ),
        "level_up_multi": (
            "🔥 *МЕГА АПГРЕЙД РАНГА!* 🔥\n\n"
            "📈 *Рывок:* L{old_level} ➡️ L{new_level}\n"
            "✨ *Статус:* Награды оптимизированы\n"
            "🚀 *Эффективность вашей сети впечатляет!*"
        ),
        "task_completed": (
            "✅ *Задание выполнено!*\n\n"
            "Вы получили *+{reward} XP*.\n"
            "🌟 Ваш путь к вершине продолжается!"
        ),
        "share_text": "Присоединяйся ко мне в Pintopay и строй свое финансовое наследие! Будущее децентрализованных платежей уже здесь",
        "pro_welcome": (
            "👑 *ДОБРО ПОЖАЛОВАТЬ В ЯДРО PINTOPAY!* 👑\n\n"
            "Вы только что открыли *Продвинутую Инфраструктуру* сети PINTOPAY!\n\n"
            "🚀 *Ваши стратегические преимущества:*\n"
            "• *Империя 20 уровней:* Доход с каждого участника вашей структуры до 20 уровня.\n"
            "• *X3 Ускорение XP:* Достигайте топовых рангов с максимальной эффективностью.\n"
            "• *Статус Лидера:* Теперь вы признанный архитектор сети.\n\n"
            "✨ *Ваше влияние теперь на новом уровне. Стройте свое наследие!* 🏰"
        ),
        "pro_plus_welcome": (
            "👑 *ДОБРО ПОЖАЛОВАТЬ В ИМПЕРИЮ PINTOPAY PRO+!* 👑\n\n"
            "Теперь вы PRO+! Вы открыли *Ультимативную Инфраструктуру* нашей экосистемы!\n\n"
            "🚀 *Элитные преимущества:*\n"
            "• *Максимальный Масштаб:* Полная синхронизация дохода на 20 уровней.\n"
            "• *Приоритетный AI:* Гипер-ускоренный рост с нашими лучшими инструментами.\n"
            "• *VIP Омни-канал:* Бесшовное управление для доминирования на рынке.\n\n"
            "✨ *Ваше влияние неудержимо. Добро пожаловать на вершину.* 🏰"
        ),
        "pro_viral_announcement": (
            "🔥 *МЕГА АНОНС!* 🔥\n\n"
            "Я только что стал *PRO* в сети PINTOPAY! 💎\n\n"
            "Я открыл *20 уровней партнерских комиссий* и мощные бонусы. Это абсолютный пик децентрализованного нетворкинга.\n\n"
            "Не оставайся в стороне, пока мы строим будущее платежей. 🚀\n\n"
            "🔗 *Присоединяйся к моей структуре:* {referral_link}"
        ),
        "pro_plus_viral_announcement": (
            "🚀 *ИМПЕРИЯ ПРИБЫЛА!* 🚀\n\n"
            "Я только что перешел на статус *PRO+ ELITE* в PINTOPAY! 👑\n\n"
            "Я разблокировал *Максимальный Множитель*, VIP AI приоритет и полную синхронизацию дохода. Это структурное превосходство. 🏰\n\n"
            "Готов строить на высшем уровне? Моя структура открыта для архитекторов. 💎\n\n"
            "🔗 *Займи свое место под моим началом:* {referral_link}"
        ),
        "commission_received": (
            "💰 *USDT ВОЗНАГРАЖДЕНИЕ ПОЛУЧЕНО!* 💰\n\n"
            "👤 *Партнер:* {from_user}\n"
            "📈 *Глубина:* Уровень {level}\n"
            "💎 *Статус:* PRO Апгрейд\n"
            "💸 *Выплата:* `${amount} USDT`\n\n"
            "🌟 *Ваша инфраструктура генерирует ценность 24/7!*"
        ),
        "referral_upgrade_announcement": (
            "⚡ *В вашей элитной структуре произошел апгрейд!*\n\n"
            "👤 *Партнер:* {buyer_name}\n"
            "📈 *Глубина:* Уровень {level}\n"
            "💎 *Новый Уровень:* {plan_name}\n"
            "💰 *Награда:* `${amount} USDT`\n\n"
            "🚀 Как *PRO+ Лидер*, вы получаете активные вознаграждения от этого роста.\n"
            "🏆 *Ваша империя продолжает масштабироваться!*"
        ),
        "viral_share_caption": (
            "🛑 ЭВОЛЮЦИЯ ВНЕ ТРАДИЦИОННОГО БАНКИНГА! 🛑\n"
            "Присоединяйся к Глобальной Сети PINTOPAY и достигни финансового суверенитета. 🚀"
        ),
        "pro_fomo_missed": (
            "🔒 *УПУЩЕНО ВОЗНАГРАЖДЕНИЕ!* 🔒\n\n"
            "📈 *Глубина:* Уровень {level}\n"
            "💎 *Статус:* PRO награды не активны\n\n"
            "👑 *Перейдите на PRO, чтобы открыть 20 уровней наград USDT и Fast XP!*\n"
            "🏰 *Обеспечьте свой будущий рост уже сегодня!*"
        ),
        "commission_fomo_missed": (
            "⚠️ *НЕДОСТУПНОЕ USDT ВОЗНАГРАЖДЕНИЕ!* ⚠️\n\n"
            "💸 *Упущено:* `${amount} USDT`\n"
            "📈 *Глубина:* Уровень {level}\n"
            "✖️ *Причина:* Глубина недоступна\n\n"
            "🚀 *Обновитесь до {target_plan} для оптимизации структуры наград!*"
        ),
        "upgrade_xp_bonus": (
            "⚡️ *XP БУСТ АКТИВИРОВАН!* ⚡️\n\n"
            "💎 *Бонус:* `+{xp} XP`\n"
            "🚀 *Ваше ускорение ранга активно.*\n"
            "🏆 *Еще ближе к Платиновой Карте!*"
        ),
        "btn_upgrade": "👑 Повысить План",
        "btn_view_network": "📊 Моя Сеть",
        "btn_check_balance": "💰 Проверить Баланс",
        "btn_extend_sub": "💎 Продлить Подписку",
        "btn_reactivate_sub": "👑 Активировать PRO",

        "sub_warning_title": "⚠️ *Внимание: Подписка*",
        "sub_warning_body": "Ваш статус PRO изменится через *{days} дн.*\n\n💰 *Цена сохранения статуса:* ${price}\n\nПродлите сейчас, чтобы сохранить инфраструктуру и все бонусы!",
        "sub_expired_title": "❌ *Статус Изменен*",
        "sub_expired_body": "Ваш статус PRO был сброшен. Доступ к расширенным функциям ограничен.\n\nАктивируйте PRO снова, чтобы восстановить глубину вознаграждений.",
        
        "viralkit_intro": "🎁 *ВИРУСНЫЙ НАБОР РАЗБЛОКИРОВАН!*\n\nПерешлите это сообщение, чтобы рассказать о статусе PRO и привлечь больше партнеров:\n\n---",
        "admin_payment_success": "✅ <b>УСПЕШНАЯ ОПЛАТА {plan}</b>\n\n👤 <b>Пользователь:</b> {user} (<code>{user_id}</code>)\n💰 <b>Сумма:</b> ${amount} {currency}\n🔗 <b>Хеш:</b> <code>{hash}</code>\n📊 <b>План:</b> {plan_type}\n⌛ <b>Истекает:</b> {expires}\n\nПроверено и комиссии распределены.",
        "admin_payment_success_parse_mode": "HTML",
        "admin_manual_payment": "🚨 <b>НОВЫЙ РУЧНОЙ ПЛАТЕЖ НА ПРОВЕРКЕ</b> 🚨\n\n👤 <b>Пользователь:</b> {user} (<code>{user_id}</code>)\n💰 <b>Сумма:</b> ${amount} {currency}\n🌐 <b>Сеть:</b> {network}\n📝 <b>Хеш:</b> <code>{hash}</code>\n\n🆔 <b>ID Транзакции:</b> <code>{trans_id}</code>\n\n👉 <b>Действие:</b> Проверьте транзакцию в Админ Панели.",

        # Bot Commands & Messages
        "not_registered_error": "⚠️ Вы еще не зарегистрированы. Введите /start чтобы присоединиться!",
        "fetch_stats_error": "⚠️ Ошибка при получении статистики: {e}",
        "my_network_title": "🌳 *Ваша Партнерская Сеть*",
        "my_network_total": "Всего Партнеров: *{count}*",
        "my_network_level_count": "Уровень {level}: {count} партнеров",
        "my_network_empty": "\n_Вы еще никого не пригласили. Поделитесь ссылкой, чтобы начать зарабатывать!_",
        
        "support_intro": (
            "🌟 *СЛУЖБА ЗАБОТЫ PINTOPAY*\n\n"
            "Как мы можем оптимизировать ваш опыт сегодня?\n"
            "Выберите категорию ниже для получения мгновенных инструкций и поддержки 5 звезд от нашей экспертной команды."
        ),
        "support_category_details": (
            "📍 *{category_name}*\n\n"
            "Быстрые Инструкции:\n{instr_text}\n\n"
            "💡 *Нужна помощь?* Просто ответьте на это сообщение, и наш Экспертный AI мгновенно поможет вам!"
        ),
        "support_error": "Прошу прощения, но мои системы сейчас заняты улучшением наших элитных сервисов. Пожалуйста, попробуйте через 30 секунд!",
        
        "cat_cards": "💳 Карты (Вирт. и Физ.)",
        "cat_setup": "🚀 Настройка и Активация",
        "cat_topup": "💰 Пополнения и Депозиты",
        "cat_mobile": "📲 Мобильные Платежи",
        "cat_pro": "💎 PRO Подписка",
        "cat_partner": "🤝 Партнерская Сеть",
        "cat_safety": "🔒 Безопасность Аккаунта",
        "cat_trading": "⚡ Трейдинг и Переводы",
        "cat_vip": "☎️ VIP Приоритет",
        "cat_general": "Общее",
        
        "already_pro": "✅ Вы уже PRO участник! Наслаждайтесь преимуществами.",
        "upgrade_pro_details": (
            "👑 *АПГРЕЙД ДО PRO*\n\n"
            "Откройте полный потенциал PINTOPAY:\n"
            "• 20-Уровневая Империя\n"
            "• Быстрый XP Буст (до x3)\n"
            "• Приоритетные Выплаты\n"
            "• VIP Поддержка\n\n"
            "💰 *Цена:* {amount} TON (~$39)\n"
            "⏳ *Действительно:* 10 минут\n\n"
            "Пожалуйста, отправьте точную сумму на адрес ниже:"
        ),
        "session_creation_error": "⚠️ Ошибка создания сессии. Попробуйте позже.",
        "verify_pro_step": (
            "📝 *Шаг Проверки*\n\n"
            "Пожалуйста, вставьте *Хеш Транзакции* (TX ID) вашего платежа ниже. "
            "Я мгновенно проверю его в блокчейне TON."
        ),
        "verifying_transaction": "⏳ *Проверка транзакции...* Пожалуйста, подождите.",
        "welcome_pro_verified": (
            "🎉 *ДОБРО ПОЖАЛОВАТЬ В PRO!*\n\n"
            "Ваш платеж подтвержден. Теперь у вас есть полный доступ ко всем премиум функциям!"
        ),
        "what_next": "Что вы хотите сделать дальше?",
        "verification_failed": (
            "❌ *Проверка не удалась*\n\n"
            "Я не нашел подходящую транзакцию для этого хеша, или ваша сессия истекла (лимит 10 мин).\n\n"
            "Если вы только что оплатили, подождите 30 секунд и попробуйте снова. Если сессия истекла, пожалуйста, начните новую."
        ),
        "verification_error": "⚠️ Ошибка проверки. Пожалуйста, свяжитесь с поддержкой.",
        "payment_cancelled": "❌ Платеж отменен. Вы можете улучшить план до PRO в любое время, введя /pro.",

        # Keyboards
        "btn_open_app": "🚀 Открыть Приложение",
        "btn_share_link": "📲 Поделиться (Моментально)",
        "btn_send_card": "💎 Отправить Премиум Карту",
        "btn_join_community": "📢 Вступить в Сообщество",
        "btn_super_app": "💎 Экосистема PINTOPAY",
        "btn_pay_ton": "💎 Оплатить {amount} TON",
        "btn_verify_payment": "✅ Проверить Платеж",
        "btn_cancel": "❌ Отмена",
        "btn_sup_cards": "💳 Карты",
        "btn_sup_setup": "🚀 Настройка",
        "btn_sup_topup": "💰 Пополнение",
        "btn_sup_mobile": "📲 Мобайл",
        "btn_sup_pro": "💎 PRO",
        "btn_sup_partner": "🤝 Партнер",
        "btn_sup_safety": "🔒 Безопасность",
        "btn_sup_trading": "⚡ Трейдинг",
        "btn_sup_vip": "☎️ VIP Доступ",
        "btn_try_again": "🔄 Попробовать Снова",
        "you": "Ты",

        # Onboarding & Verification (Russian)
        "onboarding_welcome": (
            "💎 *Добро пожаловать, {name}!*\n\n"
            "🔥 *Путь от потребителя к архитектору.*\n\n"
            "Вы официально — *Core Partner*! Вы в числе первых 🚀\n\n"
            "Вы только что вошли в *будущее децентрализованных финансов*. Пока другие наблюдают, вы уже строите суверенное наследие.\n\n"
            "💰 *Зарабатывайте XP. Растите влияние. Получайте стратегические награды.*\n\n"
            "🔗 *Ваш персональный вход:*\n`{referral_link}`\n\n"
            "👇 *Нажмите ниже, чтобы начать путь*"
        ),
        "onboarding_info_text": "💎 *Зачем нужна верификация?*\n\n1. *Высокие лимиты*: Перемещайте капитал без ограничений.\n2. *Доступ к картам*: Заказывайте виртуальные и физические карты PINTOPAY Mastercard.\n3. *Сетевые награды*: Откройте 20 уровней партнерского дохода.\n\nВыберите метод верификации ниже.",
        "verification_start": "📝 *Верификация Цифровой Личности*\n\nПожалуйста, выберите метод верификации. Для целей тестирования вы можете использовать опцию *Тестовая верификация*.",
        "verification_success": "✅ *Верификация завершена!*\n\nДобро пожаловать, Архитектор. Ваша личность синхронизирована с сетью PINTOPAY. У вас есть полный доступ к нашим финансовым инструментам.",
        "prompt_phone": "📱 Пожалуйста, поделитесь своим номером телефона, используя кнопку ниже, чтобы подтвердить ваш аккаунт.",
        "prompt_passport": "🛂 Пожалуйста, загрузите четкое фото вашего паспорта или удостоверения личности для верификации.",
        "processing_verification": "⏳ *Обработка ваших данных...* Обычно это занимает 5-10 минут. Мы уведомим вас после одобрения.",

        # Main Menu Buttons (Russian)
        "btn_verify_now": "🚀 Пройти верификацию",
        "btn_learn_more": "🔍 Узнать больше",
        "btn_verify_phone": "📱 Верификация телефона",
        "btn_verify_passport": "🛂 Верификация паспорта",
        "btn_test_verify": "🛠️ Тест верификация (Dev)",
        "btn_menu_profile": "👤 Профиль",
        "btn_menu_balance": "💰 Баланс",
        "btn_menu_topup": "💳 Пополнение",
        "btn_menu_payout": "💸 Вывод",
        "btn_menu_purchase": "🔄 Покупка",
        "btn_menu_history": "📊 История"
    }
}

def get_msg(code: str, key: str, **kwargs) -> str:
    lang = code if code in MESSAGES else "en"
    msg = MESSAGES[lang].get(key, MESSAGES["en"].get(key, ""))
    return msg.format(**kwargs)
