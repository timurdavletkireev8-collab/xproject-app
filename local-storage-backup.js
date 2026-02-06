// local-storage-backup.js - Локальное хранилище когда Firebase недоступен
// Подключается ТОЛЬКО если Firebase не работает

const LOCAL_STORAGE_KEYS = {
    USER_DATA: 'xproject_user_data',
    TASKS_DATA: 'xproject_tasks_data',
    SETTINGS: 'xproject_settings',
    CLICKS: 'xproject_clicks',
    BALANCE: 'xproject_balance',
    ENERGY: 'xproject_energy'
};

// Локальная база данных (если Firebase недоступен)
window.localDatabase = {
    // Получить данные
    get(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error(`Ошибка чтения из localStorage (${key}):`, error);
            return defaultValue;
        }
    },
    
    // Сохранить данные
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Ошибка записи в localStorage (${key}):`, error);
            return false;
        }
    },
    
    // Удалить данные
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Ошибка удаления из localStorage (${key}):`, error);
            return false;
        }
    },
    
    // Очистить все данные приложения
    clearAll() {
        Object.values(LOCAL_STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        console.log('🧹 Все данные приложения очищены');
    }
};

// Имитация Firestore при локальной работе
window.localFirestore = {
    // Получить пользователя
    async getUser(userId) {
        const users = window.localDatabase.get(LOCAL_STORAGE_KEYS.USER_DATA, {});
        return users[userId] || null;
    },
    
    // Сохранить пользователя
    async saveUser(userData) {
        const users = window.localDatabase.get(LOCAL_STORAGE_KEYS.USER_DATA, {});
        users[userData.userId] = {
            ...userData,
            lastActive: new Date().toISOString()
        };
        window.localDatabase.set(LOCAL_STORAGE_KEYS.USER_DATA, users);
        return true;
    },
    
    // Получить настройки
    async getSettings() {
        return window.localDatabase.get(LOCAL_STORAGE_KEYS.SETTINGS, {
            clickReward: 1,
            referralReward: 10,
            minWithdraw: 5000,
            dailyEnergy: 500,
            tasksForWithdraw: 5
        });
    },
    
    // Сохранить настройки
    async saveSettings(settings) {
        window.localDatabase.set(LOCAL_STORAGE_KEYS.SETTINGS, settings);
        return true;
    },
    
    // Получить задания
    async getTasks() {
        const defaultTasks = [
            {
                id: "local_task_1",
                name: "Подпишитесь на канал X Project",
                description: "Подпишитесь на наш новостной канал",
                price: 50,
                category: "subscriptions",
                imageUrl: "https://images.unsplash.com/photo-1611605698335-8b1569810432?w=400&h=200&fit=crop",
                active: true
            },
            {
                id: "local_task_2",
                name: "Вступите в группу поддержки",
                description: "Вступите в нашу группу поддержки",
                price: 30,
                category: "subscriptions",
                imageUrl: "https://images.unsplash.com/photo-1611605698323-b1e99cfd37ea?w=400&h=200&fit=crop",
                active: true
            }
        ];
        
        return window.localDatabase.get(LOCAL_STORAGE_KEYS.TASKS_DATA, defaultTasks);
    }
};

// Проверка доступности localStorage
function isLocalStorageAvailable() {
    try {
        const testKey = '__test__';
        localStorage.setItem(testKey, testKey);
        localStorage.removeItem(testKey);
        return true;
    } catch (error) {
        console.error('localStorage недоступен:', error);
        return false;
    }
}

// Инициализация локального хранилища
function initLocalStorage() {
    if (!isLocalStorageAvailable()) {
        console.error('❌ localStorage недоступен. Приложение не будет сохранять данные.');
        return false;
    }
    
    console.log('💾 Локальное хранилище доступно');
    
    // Инициализация начальных данных если их нет
    const settings = window.localDatabase.get(LOCAL_STORAGE_KEYS.SETTINGS);
    if (!settings) {
        window.localDatabase.set(LOCAL_STORAGE_KEYS.SETTINGS, {
            clickReward: 1,
            referralReward: 10,
            minWithdraw: 5000,
            dailyEnergy: 500,
            tasksForWithdraw: 5,
            version: "1.0.0"
        });
    }
    
    // Инициализация баланса если его нет
    if (window.localDatabase.get(LOCAL_STORAGE_KEYS.BALANCE) === null) {
        window.localDatabase.set(LOCAL_STORAGE_KEYS.BALANCE, 0);
    }
    
    // Инициализация энергии если её нет
    if (window.localDatabase.get(LOCAL_STORAGE_KEYS.ENERGY) === null) {
        window.localDatabase.set(LOCAL_STORAGE_KEYS.ENERGY, 500);
    }
    
    // Инициализация кликов если их нет
    if (window.localDatabase.get(LOCAL_STORAGE_KEYS.CLICKS) === null) {
        window.localDatabase.set(LOCAL_STORAGE_KEYS.CLICKS, 0);
    }
    
    return true;
}

// Экспорт функций
window.isLocalStorageAvailable = isLocalStorageAvailable;
window.initLocalStorage = initLocalStorage;
window.localStorageBackup = window.localDatabase;

// Автоматическая инициализация
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            const isAvailable = initLocalStorage();
            if (isAvailable) {
                console.log('✅ Локальное хранилище инициализировано');
            }
        }, 1000);
    });
}

console.log('💾 Модуль локального хранилища загружен');
