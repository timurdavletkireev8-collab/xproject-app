// local-storage-backup.js - Локальное хранилище

const STORAGE_KEYS = {
    BALANCE: 'x_balance',
    CLICKS: 'x_clicks',
    ENERGY: 'x_energy',
    COMPLETED_TASKS: 'x_completed_tasks',
    REFERRALS: 'x_referrals_count'
};

function saveToLocalStorage(key, value) {
    try {
        localStorage.setItem(key, value.toString());
        return true;
    } catch (error) {
        console.error('Ошибка сохранения в localStorage:', error);
        return false;
    }
}

function getFromLocalStorage(key, defaultValue = 0) {
    try {
        const value = localStorage.getItem(key);
        return value ? parseInt(value) : defaultValue;
    } catch (error) {
        console.error('Ошибка чтения из localStorage:', error);
        return defaultValue;
    }
}

window.saveToLocalStorage = saveToLocalStorage;
window.getFromLocalStorage = getFromLocalStorage;
