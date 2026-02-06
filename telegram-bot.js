// ====================================================
// ФАЙЛ: telegram-bot.js
// НАЗНАЧЕНИЕ: Отправка уведомлений в Telegram
// РАЗМЕСТИТЕ: Рядом с index.html
// ====================================================

// 🔑 КЛЮЧЕВЫЕ НАСТРОЙКИ - ЗАМЕНИТЕ ЭТО НА СВОЁ!
const BOT_CONFIG = {
    // ⚠️ ПОЛУЧИТЕ У @BotFather в Telegram:
    // 1. Напишите /newbot
    // 2. Придумайте имя бота (например: XProjectBot)
    // 3. Получите токен вида: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
    BOT_TOKEN: "8493457836:AAGNrOGcaUcvIvXY6vi-SQ6vEcHsyKVWRbc",
    
    // ⚠️ ВАШ ID в Telegram:
    // 1. Напишите @userinfobot в Telegram
    // 2. Он покажет ваш ID (цифры)
    ADMIN_ID: "7020322752", // Ваш ID для уведомлений
    
    // Ссылки на ваши ресурсы
    SUPPORT_LINK: "https://t.me/x_project_support",
    NEWS_LINK: "https://t.me/x_project_news",
    BOT_LINK: "https://t.me/x_project_tg_bot"
};

// ====================================================
// ОСНОВНАЯ ФУНКЦИЯ ОТПРАВКИ УВЕДОМЛЕНИЙ
// ====================================================

/**
 * Отправляет уведомление в Telegram
 * @param {string} chatId - ID чата (админа или пользователя)
 * @param {string} message - Текст сообщения
 * @param {object} options - Дополнительные опции (кнопки и т.д.)
 * @returns {Promise<object>} - Результат отправки
 */
async function sendTelegramNotification(chatId, message, options = {}) {
    // ⚠️ ПРОВЕРКА: Если токен не настроен - пропускаем
    if (!BOT_CONFIG.BOT_TOKEN || BOT_CONFIG.BOT_TOKEN.includes("ВАШ_")) {
        console.warn("⚠️ Telegram токен не настроен! Уведомление не отправлено.");
        console.warn("Сообщение которое не было отправлено:", message);
        return { success: false, error: "Token not configured" };
    }
    
    try {
        const url = `https://api.telegram.org/bot${BOT_CONFIG.BOT_TOKEN}/sendMessage`;
        
        // Формируем данные для отправки
        const data = {
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML', // Поддержка HTML разметки
            disable_web_page_preview: false
        };
        
        // Добавляем дополнительные опции (кнопки и т.д.)
        if (options.reply_markup) {
            data.reply_markup = options.reply_markup;
        }
        
        // Отправляем запрос к Telegram API
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.ok) {
            console.log("✅ Уведомление отправлено в Telegram");
            return { success: true, data: result.result };
        } else {
            console.error("❌ Ошибка Telegram API:", result);
            return { success: false, error: result.description };
        }
        
    } catch (error) {
        console.error("❌ Ошибка сети при отправке:", error);
        return { success: false, error: error.message };
    }
}

// ====================================================
// ГОТОВЫЕ ШАБЛОНЫ УВЕДОМЛЕНИЙ
// ====================================================

/**
 * Уведомление о НОВОМ ПОЛЬЗОВАТЕЛЕ (админу)
 */
async function notifyNewUser(userData) {
    const message = `🎉 <b>НОВЫЙ ПОЛЬЗОВАТЕЛЬ!</b>\n\n` +
                   `👤 <b>Имя:</b> ${userData.firstName}\n` +
                   `🔗 <b>Username:</b> @${userData.username}\n` +
                   `🆔 <b>ID:</b> <code>${userData.id}</code>\n` +
                   `📅 <b>Время:</b> ${new Date().toLocaleString('ru-RU')}`;
    
    return await sendTelegramNotification(BOT_CONFIG.ADMIN_ID, message);
}

/**
 * Уведомление о ВЫПОЛНЕНИИ ЗАДАНИЯ (админу)
 */
async function notifyTaskCompleted(taskData, userData) {
    const message = `📋 <b>НОВОЕ ВЫПОЛНЕННОЕ ЗАДАНИЕ!</b>\n\n` +
                   `✅ <b>Задание:</b> ${taskData.name}\n` +
                   `💰 <b>Награда:</b> ${taskData.price} X\n` +
                   `👤 <b>Пользователь:</b> @${userData.username}\n` +
                   `🆔 <b>ID:</b> <code>${userData.id}</code>\n` +
                   `⏰ <b>Время:</b> ${new Date().toLocaleTimeString('ru-RU')}`;
    
    // Кнопки для админа (одобрить/отклонить)
    const options = {
        reply_markup: {
            inline_keyboard: [
                [
                    { 
                        text: '✅ ОДОБРИТЬ', 
                        callback_data: `approve_${taskData.id}_${userData.id}` 
                    },
                    { 
                        text: '❌ ОТКЛОНИТЬ', 
                        callback_data: `reject_${taskData.id}_${userData.id}` 
                    }
                ]
            ]
        }
    };
    
    return await sendTelegramNotification(BOT_CONFIG.ADMIN_ID, message, options);
}

/**
 * Уведомление о ЗАЯВКЕ НА ВЫВОД (админу)
 */
async function notifyWithdrawRequest(withdrawData, userData) {
    const cardLast4 = withdrawData.cardNumber.slice(-4);
    const message = `💳 <b>НОВАЯ ЗАЯВКА НА ВЫВОД!</b>\n\n` +
                   `👤 <b>Пользователь:</b> @${userData.username}\n` +
                   `💰 <b>Сумма:</b> ${withdrawData.amount} X (≈${(withdrawData.amount * 0.01).toFixed(2)} руб)\n` +
                   `💳 <b>Карта:</b> **** ${cardLast4}\n` +
                   `🆔 <b>ID заявки:</b> <code>${withdrawData.id}</code>\n` +
                   `📅 <b>Дата:</b> ${new Date().toLocaleDateString('ru-RU')}`;
    
    // Кнопки для админа
    const options = {
        reply_markup: {
            inline_keyboard: [
                [
                    { 
                        text: '✅ ВЫПЛАТИТЬ', 
                        callback_data: `pay_${withdrawData.id}` 
                    },
                    { 
                        text: '❌ ОТКЛОНИТЬ', 
                        callback_data: `cancel_${withdrawData.id}` 
                    }
                ]
            ]
        }
    };
    
    return await sendTelegramNotification(BOT_CONFIG.ADMIN_ID, message, options);
}

/**
 * Уведомление о НОВОМ РЕФЕРАЛЕ (админу и рефереру)
 */
async function notifyNewReferral(referrerData, referralData) {
    // 1. Уведомление админу
    const adminMessage = `👥 <b>НОВЫЙ РЕФЕРАЛ!</b>\n\n` +
                        `🎯 <b>Реферер:</b> @${referrerData.username}\n` +
                        `👤 <b>Новый пользователь:</b> @${referralData.username}\n` +
                        `💰 <b>Бонус рефереру:</b> 10 X\n` +
                        `📅 <b>Дата:</b> ${new Date().toLocaleDateString('ru-RU')}`;
    
    await sendTelegramNotification(BOT_CONFIG.ADMIN_ID, adminMessage);
    
    // 2. Уведомление рефереру
    const referrerMessage = `🎉 <b>У ВАС НОВЫЙ РЕФЕРАЛ!</b>\n\n` +
                           `👤 @${referralData.username} зарегистрировался по вашей ссылке!\n\n` +
                           `💰 Вы получите <b>10 X</b> когда он выполнит первое задание.\n\n` +
                           `📈 Приглашайте больше друзей чтобы зарабатывать больше!`;
    
    return await sendTelegramNotification(referrerData.id, referrerMessage);
}

/**
 * Уведомление пользователю об ОДОБРЕНИИ задания
 */
async function notifyUserTaskApproved(userData, taskData, reward) {
    const message = `✅ <b>ВАШЕ ЗАДАНИЕ ОДОБРЕНО!</b>\n\n` +
                   `📋 <b>Задание:</b> ${taskData.name}\n` +
                   `💰 <b>Вы получили:</b> ${reward} X\n` +
                   `🏦 <b>Ваш баланс:</b> ${(userData.balance || 0) + reward} X\n\n` +
                   `🎯 Продолжайте в том же духе!\n` +
                   `⚡ Выполняйте больше заданий чтобы зарабатывать больше.`;
    
    return await sendTelegramNotification(userData.id, message);
}

/**
 * Уведомление пользователю об ОТКЛОНЕНИИ задания
 */
async function notifyUserTaskRejected(userData, taskData, reason = "Не соответствие требованиям") {
    const message = `❌ <b>ВАШЕ ЗАДАНИЕ ОТКЛОНЕНО</b>\n\n` +
                   `📋 <b>Задание:</b> ${taskData.name}\n` +
                   `📝 <b>Причина:</b> ${reason}\n\n` +
                   `💡 <b>Совет:</b>\n` +
                   `1. Внимательно читайте требования задания\n` +
                   `2. Делайте качественные скриншоты\n` +
                   `3. Выполняйте задания полностью\n\n` +
                   `🔄 Вы можете выполнить это задание снова!`;
    
    return await sendTelegramNotification(userData.id, message);
}

/**
 * Уведомление пользователю о ВЫПЛАТЕ
 */
async function notifyUserWithdrawPaid(userData, withdrawData) {
    const message = `💰 <b>ВАША ВЫПЛАТА ОТПРАВЛЕНА!</b>\n\n` +
                   `✅ <b>Сумма:</b> ${withdrawData.amount} X (≈${(withdrawData.amount * 0.01).toFixed(2)} руб)\n` +
                   `💳 <b>На карту:</b> **** ${withdrawData.cardNumber.slice(-4)}\n` +
                   `📅 <b>Дата выплаты:</b> ${new Date().toLocaleDateString('ru-RU')}\n\n` +
                   `💸 <b>Деньги поступят в течение 24 часов</b>\n\n` +
                   `🙏 Спасибо что с нами!\n` +
                   `🚀 Продолжайте зарабатывать!`;
    
    return await sendTelegramNotification(userData.id, message);
}

/**
 * Уведомление о НИЗКОЙ ЭНЕРГИИ
 */
async function notifyLowEnergy(userData, energy) {
    const message = `⚡ <b>НИЗКИЙ УРОВЕНЬ ЭНЕРГИИ!</b>\n\n` +
                   `Ваша энергия: ${energy}/500\n\n` +
                   `💡 <b>Советы:</b>\n` +
                   `1. Энергия восстановится через 24 часа\n` +
                   `2. Выполняйте задания для бонусной энергии\n` +
                   `3. Приглашайте друзей по реферальной ссылке\n\n` +
                   `🎯 Возвращайтесь завтра для новых кликов!`;
    
    return await sendTelegramNotification(userData.id, message);
}

/**
 * Уведомление о ДОСТИЖЕНИИ
 */
async function notifyAchievement(userData, achievement, reward = 0) {
    const message = `🏆 <b>ПОЗДРАВЛЯЕМ С ДОСТИЖЕНИЕМ!</b>\n\n` +
                   `${achievement}\n\n` +
                   (reward > 0 ? `💰 <b>Бонус:</b> ${reward} X\n\n` : '') +
                   `🎯 Ваш прогресс вдохновляет!\n` +
                   `🚀 Продолжайте в том же духе!`;
    
    return await sendTelegramNotification(userData.id, message);
}

// ====================================================
// ЕЖЕДНЕВНЫЕ ОТЧЕТЫ АДМИНУ
// ====================================================

/**
 * Отправляет ежедневный отчет админу
 */
async function sendDailyReport(stats) {
    const message = `📊 <b>ЕЖЕДНЕВНЫЙ ОТЧЕТ</b>\n\n` +
                   `📅 <b>Дата:</b> ${new Date().toLocaleDateString('ru-RU')}\n\n` +
                   `👥 <b>Новых пользователей:</b> ${stats.newUsers || 0}\n` +
                   `📋 <b>Выполнено заданий:</b> ${stats.completedTasks || 0}\n` +
                   `⚡ <b>Всего кликов:</b> ${stats.totalClicks || 0}\n` +
                   `💳 <b>Заявок на вывод:</b> ${stats.withdrawRequests || 0}\n` +
                   `💰 <b>Сумма выводов:</b> ${stats.totalWithdrawAmount || 0} X\n` +
                   `👥 <b>Новых рефералов:</b> ${stats.newReferrals || 0}\n\n` +
                   `📈 <b>Общая статистика:</b>\n` +
                   `• Всего пользователей: ${stats.totalUsers || 0}\n` +
                   `• Активных сегодня: ${stats.activeUsers || 0}\n` +
                   `• Общий баланс: ${stats.totalBalance || 0} X`;
    
    return await sendTelegramNotification(BOT_CONFIG.ADMIN_ID, message);
}

// ====================================================
// КРИТИЧЕСКИЕ ОШИБКИ
// ====================================================

/**
 * Отправляет уведомление об ошибке админу
 */
async function notifyCriticalError(error, context = '') {
    const message = `🚨 <b>КРИТИЧЕСКАЯ ОШИБКА</b>\n\n` +
                   `⏰ <b>Время:</b> ${new Date().toLocaleTimeString('ru-RU')}\n` +
                   (context ? `📋 <b>Контекст:</b> ${context}\n` : '') +
                   `❌ <b>Ошибка:</b>\n<code>${error.substring(0, 500)}</code>\n\n` +
                   `⚠️ Требуется немедленное внимание!`;
    
    return await sendTelegramNotification(BOT_CONFIG.ADMIN_ID, message);
}

// ====================================================
// ИНИЦИАЛИЗАЦИЯ И ПРОВЕРКА
// ====================================================

/**
 * Проверяет настройки и инициализирует бота
 */
function initializeTelegramBot() {
    console.log("🤖 Инициализация Telegram бота...");
    
    // Проверяем токен
    if (!BOT_CONFIG.BOT_TOKEN || BOT_CONFIG.BOT_TOKEN.includes("ВАШ_")) {
        console.warn("⚠️ ВНИМАНИЕ: Telegram Bot Token не настроен!");
        console.warn("Уведомления не будут отправляться.");
        console.warn("");
        console.warn("📋 КАК ПОЛУЧИТЬ ТОКЕН:");
        console.warn("1. Откройте Telegram");
        console.warn("2. Найдите @BotFather");
        console.warn("3. Отправьте /newbot");
        console.warn("4. Следуйте инструкциям");
        console.warn("5. Скопируйте полученный токен");
        console.warn("6. Вставьте его в переменную BOT_TOKEN выше");
        console.warn("");
        console.warn("📋 КАК УЗНАТЬ СВОЙ ID:");
        console.warn("1. Откройте Telegram");
        console.warn("2. Найдите @userinfobot");
        console.warn("3. Он покажет ваш ID");
        console.warn("4. Вставьте его в переменную ADMIN_ID");
        
        return false;
    }
    
    // Проверяем ID админа
    if (!BOT_CONFIG.ADMIN_ID || BOT_CONFIG.ADMIN_ID === "7020322752") {
        console.warn("⚠️ ВНИМАНИЕ: ADMIN_ID не настроен!");
        console.warn("Уведомления будут отправляться на ID 7020322752");
    }
    
    console.log("✅ Telegram бот готов к работе!");
    console.log(`🤖 Токен: ${BOT_CONFIG.BOT_TOKEN.substring(0, 10)}...`);
    console.log(`👑 Админ: ${BOT_CONFIG.ADMIN_ID}`);
    
    return true;
}

// ====================================================
// ЭКСПОРТ ФУНКЦИЙ ДЛЯ ИСПОЛЬЗОВАНИЯ
// ====================================================

// Делаем функции доступными глобально
window.TelegramBot = {
    // Основная функция
    send: sendTelegramNotification,
    
    // Готовые шаблоны
    notifyNewUser,
    notifyTaskCompleted,
    notifyWithdrawRequest,
    notifyNewReferral,
    notifyUserTaskApproved,
    notifyUserTaskRejected,
    notifyUserWithdrawPaid,
    notifyLowEnergy,
    notifyAchievement,
    
    // Отчеты и ошибки
    sendDailyReport,
    notifyCriticalError,
    
    // Инициализация
    init: initializeTelegramBot,
    
    // Конфигурация
    config: BOT_CONFIG
};

// Автоматическая инициализация при загрузке
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const initialized = initializeTelegramBot();
        if (initialized) {
            console.log("🔔 Модуль Telegram уведомлений активен");
            
            // Пример: тестовое уведомление админу
            // sendTelegramNotification(
            //     BOT_CONFIG.ADMIN_ID, 
            //     "🤖 <b>Тестовое уведомление</b>\n\nБот X Project успешно запущен!"
            // );
        }
    });
}

// Для использования в Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        sendTelegramNotification,
        notifyNewUser,
        notifyTaskCompleted,
        notifyWithdrawRequest,
        notifyNewReferral,
        notifyUserTaskApproved,
        notifyUserTaskRejected,
        notifyUserWithdrawPaid,
        notifyLowEnergy,
        notifyAchievement,
        sendDailyReport,
        notifyCriticalError,
        initializeTelegramBot,
        BOT_CONFIG
    };
}

// ====================================================
// 📋 КАК ИСПОЛЬЗОВАТЬ В ВАШЕМ ПРОЕКТЕ
// ====================================================

/*
1. СОХРАНИТЕ ЭТОТ ФАЙЛ как telegram-bot.js

2. В ВАШЕМ HTML ДОБАВЬТЕ:
<script src="telegram-bot.js"></script>

3. В КОДЕ ПРИЛОЖЕНИЯ ИСПОЛЬЗУЙТЕ:

// Когда пользователь регистрируется:
TelegramBot.notifyNewUser({
    id: "123456789",
    username: "ivan_ivanov",
    firstName: "Иван"
});

// Когда задание выполнено:
TelegramBot.notifyTaskCompleted(
    { id: "task1", name: "Подписка на канал", price: 50 },
    { id: "123456789", username: "ivan_ivanov" }
);

// Когда заявка на вывод:
TelegramBot.notifyWithdrawRequest(
    { id: "withdraw_001", amount: 5000, cardNumber: "1234567890123456" },
    { id: "123456789", username: "ivan_ivanov" }
);
*/
