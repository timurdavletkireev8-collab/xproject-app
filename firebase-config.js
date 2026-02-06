// Firebase configuration (ЗАМЕНИТЕ НА СВОИ КЛЮЧИ!)
const firebaseConfig = {
    apiKey: "AIzaSyC6b6K3k6Mi9vF0lSyl8z2JY1DycM-JbJA",
    authDomain: "xproject-1c0ff.firebaseapp.com",
    projectId: "xproject-1c0ff",
    storageBucket: "xproject-1c0ff.firebasestorage.app",
    messagingSenderId: "820697665436",
    appId: "1:820697665436:web:4858de7ce757d9d9fd4259",
    measurementId: "G-7B7KMC3XW9"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();
const messaging = firebase.messaging.isSupported() ? firebase.messaging() : null;

// VAPID key для Push-уведомлений (получите в Firebase Console -> Cloud Messaging)
const VAPID_KEY = "ВАШ_VAPID_KEY_ЗДЕСЬ";

// Настройка уведомлений
if (messaging) {
    messaging.usePublicVapidKey(VAPID_KEY);
    
    // Запрос разрешения на уведомления
    messaging.requestPermission().then(() => {
        console.log('Уведомления разрешены');
        return messaging.getToken();
    }).then((token) => {
        console.log('Токен уведомлений:', token);
        // Сохраните токен в базу данных для отправки уведомлений
    }).catch((error) => {
        console.log('Ошибка уведомлений:', error);
    });

    // Обработка входящих уведомлений
    messaging.onMessage((payload) => {
        console.log('Уведомление получено:', payload);
        showNotification(payload.notification.title, payload.notification.body);
    });
}

// Функция для показа уведомлений
function showNotification(title, body) {
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, {
            body: body,
            icon: "/icons/icon-192x192.png"
        });
    }
}

// Telegram Bot Token для уведомлений (получите у @BotFather)
const TELEGRAM_BOT_TOKEN = "8493457836:AAGNrOGcaUcvIvXY6vi-SQ6vEcHsyKVWRbc";

// Функция отправки уведомления в Telegram
async function sendTelegramNotification(userId, message) {
    if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN === "ВАШ_TELEGRAM_BOT_TOKEN") {
        console.warn('Telegram Bot Token не настроен');
        return;
    }
    
    try {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: userId,
                text: message,
                parse_mode: 'HTML'
            })
        });
        
        const data = await response.json();
        if (!data.ok) {
            console.error('Ошибка отправки Telegram уведомления:', data);
        }
    } catch (error) {
        console.error('Ошибка отправки Telegram уведомления:', error);
    }
}

// Экспортируем всё для использования в app.js
window.firebase = firebase;
window.db = db;
window.auth = auth;
window.storage = storage;
window.messaging = messaging;
window.sendTelegramNotification = sendTelegramNotification;

// Константы приложения
window.APP_CONFIG = {
    ADMIN_ID: "7020322752",
    DAILY_ENERGY: 500,
    MIN_WITHDRAW: 5000,
    REFERRAL_REWARD: 10,
    CLICK_REWARD: 1,
    SUPPORT_LINK: "https://t.me/x_project_support",
    NEWS_LINK: "https://t.me/x_project_news",
    BOT_LINK: "https://t.me/x_project_tg_bot",
    BOT_USERNAME: "@x_project_tg_bot"
};

console.log('Firebase инициализирован успешно');
