// notifications.js - Уведомления для X Project

const NOTIFICATIONS_CONFIG = {
    ENABLED: false, // Поставьте true когда настроите бота
    BOT_TOKEN: 'YOUR_BOT_TOKEN_HERE',
    ADMIN_ID: '7020322752'
};

async function sendTelegramNotification(chatId, message) {
    if (!NOTIFICATIONS_CONFIG.ENABLED || !NOTIFICATIONS_CONFIG.BOT_TOKEN) {
        console.log('[Уведомление отключено]:', message);
        return { success: false };
    }
    
    try {
        const response = await fetch(`https://api.telegram.org/bot${NOTIFICATIONS_CONFIG.BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            })
        });
        
        return await response.json();
    } catch (error) {
        console.error('Ошибка отправки уведомления:', error);
        return { success: false, error: error.message };
    }
}

window.sendTelegramNotification = sendTelegramNotification;
