// firebase-init.js - Инициализация Firebase

let firebaseInitialized = false;

async function initializeFirebase() {
    try {
        // Проверяем, инициализирован ли Firebase
        if (typeof firebase === 'undefined') {
            console.error('Firebase SDK не загружен');
            return false;
        }
        
        // Инициализируем Firebase
        firebase.initializeApp(APP_CONFIG.FIREBASE_CONFIG);
        
        console.log('✅ Firebase инициализирован');
        firebaseInitialized = true;
        return true;
        
    } catch (error) {
        console.error('❌ Ошибка инициализации Firebase:', error);
        firebaseInitialized = false;
        return false;
    }
}

window.firebaseInitialized = firebaseInitialized;
window.initializeFirebase = initializeFirebase;
