// notifications.js - Telegram уведомления для X Project
// Этот файл подключается к index.html

const NOTIFICATIONS_CONFIG = {
    TELEGRAM_BOT_TOKEN: '8493457836:AAGNrOGcaUcvIvXY6vi-SQ6vEcHsyKVWRbc', // Замените на свой токен
    ADMIN_ID: '7020322752',
    BOT_USERNAME: '@x_project_tg_bot',
    ENABLED: true
};

// Проверка доступности уведомлений
function isNotificationsEnabled() {
    return NOTIFICATIONS_CONFIG.ENABLED && 
           NOTIFICATIONS_CONFIG.TELEGRAM_BOT_TOKEN && 
           NOTIFICATIONS_CONFIG.TELEGRAM_BOT_TOKEN !== 'YOUR_BOT_TOKEN_HERE';
}

// Основная функция отправки уведомлений
async function sendNotification(type, data) {
    if (!isNotificationsEnabled()) {
        console.warn('Уведомления отключены. Токен не настроен.');
        return { success: false, error: 'Notifications disabled' };
    }
    
    try {
        let message = '';
        let chatId = NOTIFICATIONS_CONFIG.ADMIN_ID;
        
        switch(type) {
            case 'new_user':
                message = `👤 НОВЫЙ ПОЛЬЗОВАТЕЛЬ!\n\n` +
                         `Имя: ${data.firstName || 'Не указано'}\n` +
                         `Username: @${data.username || 'нет'}\n` +
                         `ID: ${data.id}\n` +
                         `Время: ${new Date().toLocaleString('ru-RU')}`;
                break;
                
            case 'task_submitted':
                message = `📋 НОВОЕ ЗАДАНИЕ НА ПРОВЕРКУ!\n\n` +
                         `Задание: ${data.taskName}\n` +
                         `Цена: ${data.taskPrice} X\n` +
                         `Пользователь: @${data.userUsername}\n` +
                         `ID пользователя: ${data.userId}\n` +
                         `Время: ${new Date().toLocaleString('ru-RU')}\n\n` +
                         `ID отчета: ${data.submissionId}`;
                break;
                
            case 'withdraw_request':
                message = `💳 НОВАЯ ЗАЯВКА НА ВЫВОД!\n\n` +
                         `Сумма: ${data.amount} X (${data.rubAmount} руб)\n` +
                         `Пользователь: @${data.username}\n` +
                         `Карта: ****${data.cardNumber.slice(-4)}\n` +
                         `ID заявки: ${data.requestId}\n` +
                         `Время: ${new Date().toLocaleString('ru-RU')}`;
                break;
                
            case 'task_approved':
                message = `✅ ВАШЕ ЗАДАНИЕ ОДОБРЕНО!\n\n` +
                         `Задание: ${data.taskName}\n` +
                         `Награда: +${data.reward} X\n` +
                         `Ваш баланс: ${data.newBalance} X\n` +
                         `Время: ${new Date().toLocaleString('ru-RU')}`;
                chatId = data.userId; // Отправляем пользователю
                break;
                
            case 'withdraw_approved':
                message = `💰 ВЫПЛАТА ОТПРАВЛЕНА!\n\n` +
                         `Сумма: ${data.amount} X (${data.rubAmount} руб)\n` +
                         `Карта: ****${data.cardNumber.slice(-4)}\n` +
                         `Статус: Успешно\n` +
                         `Деньги поступят в течение 24 часов\n` +
                         `Время: ${new Date().toLocaleString('ru-RU')}`;
                chatId = data.userId; // Отправляем пользователю
                break;
                
            case 'admin_message':
                message = data.message;
                break;
                
            default:
                console.warn('Неизвестный тип уведомления:', type);
                return { success: false, error: 'Unknown notification type' };
        }
        
        // Отправка через Telegram Bot API
        const response = await fetch(`https://api.telegram.org/bot${NOTIFICATIONS_CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            })
        });
        
        const result = await response.json();
        
        if (result.ok) {
            console.log(`✅ Уведомление "${type}" отправлено успешно`);
            return { success: true, data: result.result };
        } else {
            console.error(`❌ Ошибка отправки уведомления "${type}":`, result);
            return { success: false, error: result.description };
        }
        
    } catch (error) {
        console.error('❌ Ошибка сети при отправке уведомления:', error);
        return { success: false, error: error.message };
    }
}

// Уведомление для пользователя
async function notifyUser(userId, message) {
    return await sendNotification('admin_message', {
        message: `📨 УВЕДОМЛЕНИЕ ОТ X PROJECT\n\n${message}`,
        userId: userId
    });
}

// Ежедневная статистика для админа
async function sendDailyStats(stats) {
    const message = `📊 ЕЖЕДНЕВНАЯ СТАТИСТИКА\n\n` +
                   `📅 Дата: ${new Date().toLocaleDateString('ru-RU')}\n\n` +
                   `👥 Новых пользователей: ${stats.newUsers || 0}\n` +
                   `📋 Выполнено заданий: ${stats.completedTasks || 0}\n` +
                   `⚡ Всего кликов: ${stats.totalClicks || 0}\n` +
                   `💰 Выплачено: ${stats.paidOut || 0} X\n` +
                   `👥 Рефералов: ${stats.referrals || 0}\n\n` +
                   `🚀 Продолжаем в том же духе!`;
    
    return await sendNotification('admin_message', { message });
}

// Проверка настроек уведомлений
function checkNotificationsConfig() {
    if (!isNotificationsEnabled()) {
        console.log(`
⚠️ ВНИМАНИЕ: Уведомления не настроены!

Для включения уведомлений:
1. Создайте бота через @BotFather в Telegram
2. Получите токен бота
3. Замените 'YOUR_BOT_TOKEN_HERE' на ваш токен в файле notifications.js
4. Убедитесь, что бот может отправлять сообщения вашему ID (${NOTIFICATIONS_CONFIG.ADMIN_ID})

Текущий статус: ❌ Уведомления отключены
        `);
        return false;
    }
    
    console.log('✅ Уведомления настроены и готовы к работе!');
    return true;
}

// Экспорт функций для использования в основном коде
window.sendNotification = sendNotification;
window.notifyUser = notifyUser;
window.sendDailyStats = sendDailyStats;
window.checkNotificationsConfig = checkNotificationsConfig;
window.isNotificationsEnabled = isNotificationsEnabled;

// Автоматическая проверка при загрузке
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            const isEnabled = checkNotificationsConfig();
            if (isEnabled) {
                console.log('🔔 Модуль уведомлений активен');
            }
        }, 1000);
    });
}

console.log('📨 Модуль уведомлений загружен');
