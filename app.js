// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
let currentUser = null;
let userData = null;
let currentTask = null;
let tasks = [];
let pendingTasks = [];
let withdrawRequests = [];
let clickReward = window.APP_CONFIG.CLICK_REWARD;
let referralReward = window.APP_CONFIG.REFERRAL_REWARD;
let reportPhoto = null;
let taskImageFile = null;

// Telegram Web App
let tg = null;
if (window.telegram && window.telegram.WebApp) {
    tg = window.telegram.WebApp;
    tg.expand();
    tg.enableClosingConfirmation();
    tg.setHeaderColor('#0a192f');
    tg.setBackgroundColor('#0a192f');
}

// ===== ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ =====
document.addEventListener('DOMContentLoaded', async function() {
    console.log('X Project App starting...');
    
    try {
        await initUser();
        await loadAppData();
        initNavigation();
        initEventListeners();
        initTaskCategories();
        
        console.log('App initialized successfully');
        
        // Показать приветственное сообщение
        if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
            showMessage(`Добро пожаловать, ${tg.initDataUnsafe.user.first_name}!`, 'info');
        }
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showMessage('Ошибка запуска приложения', 'error');
    }
});

// ===== ИНИЦИАЛИЗАЦИЯ ПОЛЬЗОВАТЕЛЯ =====
async function initUser() {
    console.log('Initializing user...');
    
    try {
        // Получаем данные пользователя из Telegram
        let user = null;
        if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
            user = tg.initDataUnsafe.user;
            console.log('Telegram user found:', user);
        } else {
            // Тестовый пользователь для разработки
            user = {
                id: "test_user_" + Date.now(),
                username: "test_user",
                first_name: "Тестовый",
                last_name: "Пользователь",
                photo_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=test"
            };
            console.log('Using test user:', user);
        }
        
        if (!user) {
            throw new Error('No user data available');
        }
        
        // Создаем объект текущего пользователя
        currentUser = {
            id: user.id.toString(),
            username: user.username || `user_${user.id}`,
            firstName: user.first_name,
            lastName: user.last_name || "",
            photoUrl: user.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
        };
        
        console.log('Current user created:', currentUser);
        
        // Обновляем UI с данными пользователя
        updateUserUI();
        
        // Проверяем существование пользователя в базе данных
        const userRef = db.collection('users').doc(currentUser.id);
        const userDoc = await userRef.get();
        
        if (userDoc.exists) {
            // Пользователь существует
            userData = userDoc.data();
            console.log('User data loaded from DB:', userData);
            
            // Проверяем реферальную ссылку
            await checkReferral(userRef);
            
            // Обновляем энергию
            await updateDailyEnergy();
        } else {
            // Создаем нового пользователя
            console.log('Creating new user in DB...');
            await createNewUser(userRef);
        }
        
        // Обновляем время последней активности
        await userRef.update({
            lastActive: new Date().toISOString()
        });
        
        // Показываем админ меню если пользователь админ
        if (currentUser.id === window.APP_CONFIG.ADMIN_ID) {
            const adminMenuBtn = document.getElementById('adminMenuBtn');
            if (adminMenuBtn) {
                adminMenuBtn.style.display = 'block';
                console.log('Admin menu enabled');
            }
        }
        
        console.log('User initialization complete');
    } catch (error) {
        console.error('Error in initUser:', error);
        showMessage('Ошибка загрузки пользователя', 'error');
    }
}

// ===== ОБНОВЛЕНИЕ UI ПОЛЬЗОВАТЕЛЯ =====
function updateUserUI() {
    if (!currentUser) return;
    
    const elements = {
        userAvatar: document.getElementById('userAvatar'),
        username: document.getElementById('username'),
        profileAvatar: document.getElementById('profileAvatar'),
        profileName: document.getElementById('profileName'),
        profileUsername: document.getElementById('profileUsername'),
        profileId: document.getElementById('profileId')
    };
    
    if (elements.userAvatar) elements.userAvatar.src = currentUser.photoUrl;
    if (elements.username) elements.username.textContent = currentUser.firstName;
    if (elements.profileAvatar) elements.profileAvatar.src = currentUser.photoUrl;
    if (elements.profileName) elements.profileName.textContent = `${currentUser.firstName} ${currentUser.lastName}`.trim();
    if (elements.profileUsername) elements.profileUsername.textContent = `@${currentUser.username}`;
    if (elements.profileId) elements.profileId.textContent = `ID: ${currentUser.id}`;
}

// ===== СОЗДАНИЕ НОВОГО ПОЛЬЗОВАТЕЛЯ =====
async function createNewUser(userRef) {
    const urlParams = new URLSearchParams(window.location.search);
    const refId = urlParams.get('ref');
    
    userData = {
        userId: currentUser.id,
        username: currentUser.username,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        photoUrl: currentUser.photoUrl,
        balance: 0,
        totalEarned: 0,
        completedTasks: [],
        pendingTasks: [],
        clicks: 0,
        dailyClicks: 0,
        lastClickDate: new Date().toISOString(),
        referrals: [],
        referralCount: 0,
        referralEarned: 0,
        referredBy: refId || null,
        joinDate: new Date().toISOString(),
        isAdmin: currentUser.id === window.APP_CONFIG.ADMIN_ID,
        lastActive: new Date().toISOString(),
        energy: window.APP_CONFIG.DAILY_ENERGY,
        lastEnergyUpdate: new Date().toISOString()
    };
    
    await userRef.set(userData);
    console.log('New user created in DB');
    
    // Обновляем реферера если есть
    if (refId && refId !== currentUser.id) {
        try {
            const referrerRef = db.collection('users').doc(refId);
            await referrerRef.update({
                referrals: firebase.firestore.FieldValue.arrayUnion(currentUser.id),
                referralCount: firebase.firestore.FieldValue.increment(1)
            });
            
            // Отправляем уведомление рефереру
            if (window.sendTelegramNotification) {
                sendTelegramNotification(refId, `🎉 По вашей ссылке зарегистрировался новый пользователь: @${currentUser.username}`);
            }
        } catch (error) {
            console.error('Error updating referrer:', error);
        }
    }
}

// ===== ПРОВЕРКА РЕФЕРАЛЬНОЙ ССЫЛКИ =====
async function checkReferral(userRef) {
    const urlParams = new URLSearchParams(window.location.search);
    const refId = urlParams.get('ref');
    
    if (refId && !userData.referredBy && refId !== currentUser.id) {
        try {
            await userRef.update({
                referredBy: refId,
                joinDate: new Date().toISOString()
            });
            
            userData.referredBy = refId;
            
            // Обновляем данные реферера
            const referrerRef = db.collection('users').doc(refId);
            await referrerRef.update({
                referrals: firebase.firestore.FieldValue.arrayUnion(currentUser.id),
                referralCount: firebase.firestore.FieldValue.increment(1)
            });
            
            console.log('Referral link processed:', refId);
        } catch (error) {
            console.error('Error updating referral:', error);
        }
    }
}

// ===== ОБНОВЛЕНИЕ ЭНЕРГИИ =====
async function updateDailyEnergy() {
    if (!userData || !userData.lastEnergyUpdate) return;
    
    try {
        const lastUpdate = new Date(userData.lastEnergyUpdate);
        const now = new Date();
        const diffHours = (now - lastUpdate) / (1000 * 60 * 60);
        
        // Если прошло больше 24 часов
        if (diffHours >= 24) {
            const daysPassed = Math.floor(diffHours / 24);
            const energyToAdd = Math.min(daysPassed * window.APP_CONFIG.DAILY_ENERGY, window.APP_CONFIG.DAILY_ENERGY);
            const newEnergy = Math.min((userData.energy || 0) + energyToAdd, window.APP_CONFIG.DAILY_ENERGY);
            
            await db.collection('users').doc(currentUser.id).update({
                energy: newEnergy,
                lastEnergyUpdate: now.toISOString(),
                dailyClicks: 0
            });
            
            userData.energy = newEnergy;
            userData.dailyClicks = 0;
            userData.lastEnergyUpdate = now.toISOString();
            
            console.log('Energy updated:', newEnergy);
            
            // Показываем сообщение об обновлении энергии
            if (energyToAdd > 0) {
                showMessage(`⚡ Ваша энергия восстановлена! +${energyToAdd} энергии`, 'success');
            }
        }
        
        updateEnergyUI();
    } catch (error) {
        console.error('Error updating energy:', error);
    }
}

// ===== ОБНОВЛЕНИЕ UI ЭНЕРГИИ =====
function updateEnergyUI() {
    const energyText = document.getElementById('energyText');
    const energyFill = document.getElementById('energyFill');
    
    if (!energyText || !energyFill || !userData) return;
    
    const energy = userData.energy || 0;
    const percent = (energy / window.APP_CONFIG.DAILY_ENERGY) * 100;
    
    energyText.textContent = `${energy}/${window.APP_CONFIG.DAILY_ENERGY}`;
    energyFill.style.width = `${percent}%`;
    
    // Меняем цвет в зависимости от уровня энергии
    if (energy < 100) {
        energyFill.style.background = 'linear-gradient(135deg, #ff6b6b, #ffa726)';
    } else if (energy < 300) {
        energyFill.style.background = 'linear-gradient(135deg, #4cc9f0, #2a9d8f)';
    } else {
        energyFill.style.background = 'linear-gradient(135deg, #8ac926, #2a9d8f)';
    }
}

// ===== ЗАГРУЗКА ДАННЫХ ПРИЛОЖЕНИЯ =====
async function loadAppData() {
    console.log('Loading app data...');
    
    try {
        await loadTasks();
        await loadUserData();
        await loadSettings();
        
        if (currentUser.id === window.APP_CONFIG.ADMIN_ID) {
            await loadAdminData();
        }
        
        console.log('App data loaded successfully');
    } catch (error) {
        console.error('Error loading app data:', error);
        showMessage('Ошибка загрузки данных', 'error');
    }
}

// ===== ЗАГРУЗКА ЗАДАНИЙ =====
async function loadTasks() {
    console.log('Loading tasks...');
    
    const tasksList = document.getElementById('tasksList');
    if (!tasksList) return;
    
    try {
        // Показываем загрузку
        tasksList.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <div>Загрузка заданий...</div>
            </div>
        `;
        
        // Получаем активные задания
        const snapshot = await db.collection('tasks')
            .where('active', '==', true)
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();
        
        console.log(`Found ${snapshot.size} active tasks`);
        
        tasks = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            tasks.push({
                id: doc.id,
                ...data
            });
        });
        
        // Если заданий нет, создаем тестовые
        if (tasks.length === 0) {
            console.log('No tasks found, creating test tasks...');
            await createTestTasks();
            return loadTasks(); // Перезагружаем
        }
        
        console.log('Tasks loaded:', tasks.length);
        renderTasks('all');
    } catch (error) {
        console.error('Error loading tasks:', error);
        tasksList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <div>Ошибка загрузки заданий</div>
                <button onclick="loadTasks()" style="margin-top: 10px; padding: 8px 16px; background: var(--teal); color: white; border: none; border-radius: 8px;">
                    Повторить загрузку
                </button>
            </div>
        `;
    }
}
