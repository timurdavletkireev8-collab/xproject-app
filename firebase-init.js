// firebase-init.js - Простая инициализация Firebase
// Подключается к index.html перед основным скриптом

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyC6b6K3k6Mi9vF0lSyl8z2JY1DycM-JbJA",
    authDomain: "xproject-1c0ff.firebaseapp.com",
    projectId: "xproject-1c0ff",
    storageBucket: "xproject-1c0ff.firebasestorage.app",
    messagingSenderId: "820697665436",
    appId: "1:820697665436:web:4858de7ce757d9d9fd4259",
    measurementId: "G-7B7KMC3XW9"
};

// Глобальные переменные Firebase
window.firebaseConfig = FIREBASE_CONFIG;
window.firebaseModules = {};

// Функция инициализации Firebase
async function initializeFirebase() {
    console.log('🔥 Инициализация Firebase...');
    
    try {
        // Проверяем, загружена ли Firebase
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase SDK не загружен');
        }
        
        // Инициализируем приложение
        const app = firebase.initializeApp(FIREBASE_CONFIG);
        
        // Инициализируем сервисы
        window.firebaseModules.db = firebase.firestore();
        window.firebaseModules.auth = firebase.auth();
        window.firebaseModules.storage = firebase.storage();
        
        // Настройки для разработки
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            window.firebaseModules.db.useEmulator('localhost', 8080);
            window.firebaseModules.auth.useEmulator('http://localhost:9099');
            console.log('🔧 Используется Firebase Emulator');
        }
        
        console.log('✅ Firebase успешно инициализирован');
        
        // Проверяем подключение
        const testConnection = async () => {
            try {
                const settingsRef = window.firebaseModules.db.collection('settings').doc('clickReward');
                const doc = await settingsRef.get();
                
                if (doc.exists) {
                    console.log('📡 Подключение к Firestore: OK');
                    window.firebaseInitialized = true;
                } else {
                    console.warn('⚠️ Коллекция settings не найдена. Создайте базу данных.');
                    window.firebaseInitialized = false;
                }
            } catch (error) {
                console.error('❌ Ошибка подключения к Firestore:', error.message);
                window.firebaseInitialized = false;
                
                // Показываем пользовательское сообщение
                showFirebaseError(error);
            }
        };
        
        await testConnection();
        return true;
        
    } catch (error) {
        console.error('❌ Ошибка инициализации Firebase:', error);
        window.firebaseInitialized = false;
        showFirebaseError(error);
        return false;
    }
}

// Функция показа ошибки Firebase
function showFirebaseError(error) {
    const errorContainer = document.getElementById('firebase-error') || createErrorContainer();
    
    errorContainer.innerHTML = `
        <div style="
            background: rgba(220, 53, 69, 0.1);
            border: 1px solid #dc3545;
            border-radius: 10px;
            padding: 15px;
            margin: 10px 0;
            color: #dc3545;
        ">
            <strong>⚠️ Ошибка подключения к базе данных</strong>
            <p style="margin: 10px 0 5px 0; font-size: 14px;">
                ${error.message || 'Не удалось подключиться к серверу'}
            </p>
            <p style="font-size: 12px; opacity: 0.8; margin-bottom: 10px;">
                Приложение работает в демо-режиме. Данные будут сохранены локально.
            </p>
            <button onclick="location.reload()" style="
                background: #dc3545;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
            ">
                Попробовать снова
            </button>
        </div>
    `;
}

// Создание контейнера для ошибок
function createErrorContainer() {
    const container = document.createElement('div');
    container.id = 'firebase-error';
    container.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        width: 90%;
        max-width: 400px;
        z-index: 9999;
    `;
    document.body.appendChild(container);
    return container;
}

// Утилиты для работы с Firestore
window.firebaseUtils = {
    // Получить настройку
    async getSetting(settingId, defaultValue = null) {
        if (!window.firebaseInitialized) return defaultValue;
        
        try {
            const doc = await window.firebaseModules.db
                .collection('settings')
                .doc(settingId)
                .get();
            
            return doc.exists ? doc.data().value : defaultValue;
        } catch (error) {
            console.error(`Ошибка получения настройки ${settingId}:`, error);
            return defaultValue;
        }
    },
    
    // Сохранить настройку (только админ)
    async saveSetting(settingId, value, userId = 'admin') {
        if (!window.firebaseInitialized) return false;
        
        try {
            await window.firebaseModules.db
                .collection('settings')
                .doc(settingId)
                .set({
                    value: value,
                    updatedBy: userId,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            
            return true;
        } catch (error) {
            console.error(`Ошибка сохранения настройки ${settingId}:`, error);
            return false;
        }
    },
    
    // Получить пользователя
    async getUser(userId) {
        if (!window.firebaseInitialized) return null;
        
        try {
            const doc = await window.firebaseModules.db
                .collection('users')
                .doc(userId)
                .get();
            
            return doc.exists ? { id: doc.id, ...doc.data() } : null;
        } catch (error) {
            console.error(`Ошибка получения пользователя ${userId}:`, error);
            return null;
        }
    },
    
    // Сохранить/обновить пользователя
    async saveUser(userData) {
        if (!window.firebaseInitialized) return false;
        
        try {
            await window.firebaseModules.db
                .collection('users')
                .doc(userData.userId)
                .set({
                    ...userData,
                    lastActive: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            
            return true;
        } catch (error) {
            console.error('Ошибка сохранения пользователя:', error);
            return false;
        }
    },
    
    // Получить активные задания
    async getActiveTasks(limit = 50) {
        if (!window.firebaseInitialized) return [];
        
        try {
            const snapshot = await window.firebaseModules.db
                .collection('tasks')
                .where('active', '==', true)
                .limit(limit)
                .get();
            
            const tasks = [];
            snapshot.forEach(doc => {
                tasks.push({ id: doc.id, ...doc.data() });
            });
            
            return tasks;
        } catch (error) {
            console.error('Ошибка получения заданий:', error);
            return [];
        }
    },
    
    // Загрузить файл в Storage
    async uploadFile(file, path = 'uploads/') {
        if (!window.firebaseInitialized) throw new Error('Firebase не инициализирован');
        
        try {
            const storageRef = window.firebaseModules.storage.ref();
            const fileRef = storageRef.child(`${path}${Date.now()}_${file.name}`);
            const snapshot = await fileRef.put(file);
            const downloadURL = await snapshot.ref.getDownloadURL();
            
            return { success: true, url: downloadURL };
        } catch (error) {
            console.error('Ошибка загрузки файла:', error);
            return { success: false, error: error.message };
        }
    }
};

// Автоматическая инициализация при загрузке
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Даем время на загрузку Firebase SDK
        setTimeout(() => {
            initializeFirebase().then(success => {
                if (success) {
                    console.log('🚀 Приложение готово к работе с Firebase');
                } else {
                    console.log('🔶 Приложение работает в локальном режиме');
                }
            });
        }, 500);
    });
}

console.log('🔥 Модуль инициализации Firebase загружен');
