// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
let currentUser = null;
let userData = null;
let currentTask = null;
let tasks = [];
let pendingTasks = [];
let withdrawRequests = [];
let clickReward = window.APP_CONFIG ? window.APP_CONFIG.CLICK_REWARD : 1;
let referralReward = window.APP_CONFIG ? window.APP_CONFIG.REFERRAL_REWARD : 10;
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
        const ADMIN_ID = window.APP_CONFIG ? window.APP_CONFIG.ADMIN_ID : "7020322752";
        if (currentUser.id === ADMIN_ID) {
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
    const ADMIN_ID = window.APP_CONFIG ? window.APP_CONFIG.ADMIN_ID : "7020322752";
    const DAILY_ENERGY = window.APP_CONFIG ? window.APP_CONFIG.DAILY_ENERGY : 500;
    
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
        isAdmin: currentUser.id === ADMIN_ID,
        lastActive: new Date().toISOString(),
        energy: DAILY_ENERGY,
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
        const DAILY_ENERGY = window.APP_CONFIG ? window.APP_CONFIG.DAILY_ENERGY : 500;
        
        // Если прошло больше 24 часов
        if (diffHours >= 24) {
            const daysPassed = Math.floor(diffHours / 24);
            const energyToAdd = Math.min(daysPassed * DAILY_ENERGY, DAILY_ENERGY);
            const newEnergy = Math.min((userData.energy || 0) + energyToAdd, DAILY_ENERGY);
            
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
    
    const DAILY_ENERGY = window.APP_CONFIG ? window.APP_CONFIG.DAILY_ENERGY : 500;
    const energy = userData.energy || 0;
    const percent = (energy / DAILY_ENERGY) * 100;
    
    energyText.textContent = `${energy}/${DAILY_ENERGY}`;
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
        
        const ADMIN_ID = window.APP_CONFIG ? window.APP_CONFIG.ADMIN_ID : "7020322752";
        if (currentUser.id === ADMIN_ID) {
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

// ===== СОЗДАНИЕ ТЕСТОВЫХ ЗАДАНИЙ =====
async function createTestTasks() {
    const NEWS_LINK = window.APP_CONFIG ? window.APP_CONFIG.NEWS_LINK : "https://t.me/x_project_news";
    const SUPPORT_LINK = window.APP_CONFIG ? window.APP_CONFIG.SUPPORT_LINK : "https://t.me/x_project_support";
    
    const testTasks = [
        {
            name: "Подпишитесь на канал X Project",
            description: "Подпишитесь на наш новостной канал и получите 50 X коинов. Подписка должна быть активна минимум 3 дня.",
            link: NEWS_LINK,
            price: 50,
            category: "subscriptions",
            imageUrl: "https://images.unsplash.com/photo-1611605698335-8b1569810432?w=400&h=200&fit=crop",
            active: true,
            createdAt: new Date().toISOString(),
            createdBy: "system"
        },
        {
            name: "Вступите в группу поддержки",
            description: "Вступите в нашу группу поддержки и получите 30 X коинов. Задайте вопрос или оставьте отзыв.",
            link: SUPPORT_LINK,
            price: 30,
            category: "subscriptions",
            imageUrl: "https://images.unsplash.com/photo-1611605698323-b1e99cfd37ea?w=400&h=200&fit=crop",
            active: true,
            createdAt: new Date().toISOString(),
            createdBy: "system"
        },
        {
            name: "Пригласите 3 друзей",
            description: "Пригласите 3 друзей по своей реферальной ссылке и получите 150 X коинов. Друзья должны выполнить первое задание.",
            link: "#",
            price: 150,
            category: "registrations",
            imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop",
            active: true,
            createdAt: new Date().toISOString(),
            createdBy: "system"
        },
        {
            name: "Подпишитесь на 3 YouTube канала",
            description: "Подпишитесь на 3 наших партнерских YouTube канала. Подписки должны быть активны минимум 7 дней.",
            link: "https://youtube.com",
            price: 80,
            category: "subscriptions",
            imageUrl: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=200&fit=crop",
            active: true,
            createdAt: new Date().toISOString(),
            createdBy: "system"
        },
        {
            name: "Создайте аккаунт на сайте",
            description: "Зарегистрируйтесь на партнерском сайте и подтвердите email. Используйте реальные данные.",
            link: "https://example.com/register",
            price: 100,
            category: "registrations",
            imageUrl: "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=200&fit=crop",
            active: true,
            createdAt: new Date().toISOString(),
            createdBy: "system"
        }
    ];
    
    for (const task of testTasks) {
        try {
            await db.collection('tasks').add(task);
            console.log('Created test task:', task.name);
        } catch (error) {
            console.error('Error creating test task:', error);
        }
    }
}

// ===== ОТОБРАЖЕНИЕ ЗАДАНИЙ ПО КАТЕГОРИЯМ =====
function renderTasks(category) {
    const tasksList = document.getElementById('tasksList');
    if (!tasksList) return;
    
    let filteredTasks = tasks;
    if (category !== 'all') {
        filteredTasks = tasks.filter(task => task.category === category);
    }
    
    if (filteredTasks.length === 0) {
        tasksList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tasks"></i>
                <div>Нет заданий в этой категории</div>
            </div>
        `;
        return;
    }
    
    let html = '';
    filteredTasks.forEach(task => {
        const isCompleted = userData?.completedTasks?.includes(task.id);
        const isPending = userData?.pendingTasks?.includes(task.id);
        
        let statusHtml = '';
        if (isCompleted) {
            statusHtml = '<span class="task-status status-completed">Выполнено</span>';
        } else if (isPending) {
            statusHtml = '<span class="task-status status-pending">На проверке</span>';
        } else {
            statusHtml = '<span class="task-status status-available">Доступно</span>';
        }
        
        html += `
            <div class="task-card" onclick="openTaskModal('${task.id}')">
                <div class="task-header">
                    <img src="${task.imageUrl || 'https://via.placeholder.com/400x200?text=No+Image'}" alt="${task.name}" class="task-image">
                    <div class="task-price">${task.price} X</div>
                </div>
                <div class="task-content">
                    <h3 class="task-title">${task.name}</h3>
                    <p class="task-description">${task.description.substring(0, 80)}${task.description.length > 80 ? '...' : ''}</p>
                    ${statusHtml}
                </div>
            </div>
        `;
    });
    
    tasksList.innerHTML = html;
}

// ===== ИНИЦИАЛИЗАЦИЯ КАТЕГОРИЙ ЗАДАНИЙ =====
function initTaskCategories() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Убираем активный класс у всех кнопок
            categoryButtons.forEach(b => b.classList.remove('active'));
            // Добавляем активный класс нажатой кнопке
            this.classList.add('active');
            // Отображаем задания выбранной категории
            const category = this.getAttribute('data-category');
            renderTasks(category);
        });
    });
}

// ===== ОТКРЫТИЕ МОДАЛЬНОГО ОКНА ЗАДАНИЯ =====
async function openTaskModal(taskId) {
    console.log('Opening task modal for:', taskId);
    
    // Находим задание
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
        showMessage('Задание не найдено', 'error');
        return;
    }
    
    currentTask = task;
    
    // Проверяем, выполнено ли задание уже
    if (userData?.completedTasks?.includes(task.id)) {
        showMessage('Вы уже выполнили это задание', 'info');
        return;
    }
    
    // Проверяем, находится ли задание на проверке
    if (userData?.pendingTasks?.includes(task.id)) {
        showMessage('Это задание уже на проверке', 'info');
        return;
    }
    
    // Обновляем содержимое модального окна
    document.getElementById('modalTaskImage').src = task.imageUrl;
    document.getElementById('modalTaskTitle').textContent = task.name;
    document.getElementById('modalTaskDescription').textContent = task.description;
    
    // Показываем первый шаг
    document.getElementById('taskModalStep1').style.display = 'block';
    document.getElementById('taskModalStep2').style.display = 'none';
    
    // Сбрасываем фото
    document.getElementById('reportPhoto').value = '';
    document.getElementById('photoPreview').src = '';
    document.getElementById('photoPreview').style.display = 'none';
    reportPhoto = null;
    
    // Показываем модальное окно
    document.getElementById('taskModal').classList.add('active');
}

// ===== ЗАКРЫТИЕ МОДАЛЬНОГО ОКНА ЗАДАНИЯ =====
function closeTaskModal() {
    document.getElementById('taskModal').classList.remove('active');
    currentTask = null;
    reportPhoto = null;
}

// ===== НАЧАЛО ВЫПОЛНЕНИЯ ЗАДАНИЯ =====
function startTask() {
    if (!currentTask) return;
    
    // Открываем ссылку задания в новой вкладке
    window.open(currentTask.link, '_blank');
    
    // Показываем второй шаг
    document.getElementById('taskModalStep1').style.display = 'none';
    document.getElementById('taskModalStep2').style.display = 'block';
    
    // Настраиваем загрузку фото
    setupPhotoUpload();
}

// ===== НАСТРОЙКА ЗАГРУЗКИ ФОТО =====
function setupPhotoUpload() {
    const reportPhotoInput = document.getElementById('reportPhoto');
    const photoPreview = document.getElementById('photoPreview');
    
    if (!reportPhotoInput) return;
    
    reportPhotoInput.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                photoPreview.src = e.target.result;
                photoPreview.style.display = 'block';
                reportPhoto = file;
            };
            reader.readAsDataURL(file);
        }
    };
}

// ===== ВОЗВРАТ К ПЕРВОМУ ШАГУ =====
function backToStep1() {
    document.getElementById('taskModalStep1').style.display = 'block';
    document.getElementById('taskModalStep2').style.display = 'none';
}

// ===== ОТПРАВКА ОТЧЕТА ПО ЗАДАНИЮ =====
async function submitTaskReport() {
    if (!currentTask || !currentUser || !reportPhoto) {
        showMessage('Пожалуйста, загрузите фото отчета', 'error');
        return;
    }
    
    const submitBtn = document.getElementById('submitReportBtn');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
    
    try {
        // Загружаем фото в Firebase Storage
        const storageRef = storage.ref();
        const photoRef = storageRef.child(`task_reports/${currentUser.id}_${Date.now()}_${reportPhoto.name}`);
        const snapshot = await photoRef.put(reportPhoto);
        const photoUrl = await snapshot.ref.getDownloadURL();
        
        // Обновляем задания пользователя на проверке
        await db.collection('users').doc(currentUser.id).update({
            pendingTasks: firebase.firestore.FieldValue.arrayUnion(currentTask.id)
        });
        
        // Создаем запись о выполнении задания
        const submissionId = `${currentUser.id}_${currentTask.id}_${Date.now()}`;
        await db.collection('taskSubmissions').doc(submissionId).set({
            id: submissionId,
            userId: currentUser.id,
            taskId: currentTask.id,
            taskName: currentTask.name,
            taskPrice: currentTask.price,
            userUsername: currentUser.username,
            userFirstName: currentUser.firstName,
            userPhotoUrl: currentUser.photoUrl,
            userTelegramId: currentUser.id,
            reportPhotoUrl: photoUrl,
            status: 'pending',
            submittedAt: new Date().toISOString()
        });
        
        // Обновляем локальные данные
        if (!userData.pendingTasks) userData.pendingTasks = [];
        userData.pendingTasks.push(currentTask.id);
        
        // Отправляем уведомление админу
        const ADMIN_ID = window.APP_CONFIG ? window.APP_CONFIG.ADMIN_ID : "7020322752";
        if (currentUser.id !== ADMIN_ID && window.sendTelegramNotification) {
            const adminMessage = `📋 Новый отчет по заданию!\n\n` +
                               `Задание: ${currentTask.name}\n` +
                               `Пользователь: @${currentUser.username}\n` +
                               `Цена: ${currentTask.price} X\n` +
                               `ID отчета: ${submissionId}`;
            
            sendTelegramNotification(ADMIN_ID, adminMessage);
        }
        
        showMessage('✅ Отчет отправлен на проверку!', 'success');
        closeTaskModal();
        
        // Перерисовываем задания
        const activeBtn = document.querySelector('.category-btn.active');
        if (activeBtn) {
            renderTasks(activeBtn.getAttribute('data-category'));
        }
        
    } catch (error) {
        console.error('Error submitting report:', error);
        showMessage('❌ Ошибка отправки отчета', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// ===== ЗАГРУЗКА ДАННЫХ ПОЛЬЗОВАТЕЛЯ =====
async function loadUserData() {
    if (!currentUser) return;
    
    try {
        const doc = await db.collection('users').doc(currentUser.id).get();
        if (doc.exists) {
            userData = doc.data();
            updateBalanceUI();
            updateEnergyUI();
            updateProfileStats();
            updateReferralsUI();
            checkWithdrawButton();
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// ===== ОБНОВЛЕНИЕ БАЛАНСА В UI =====
function updateBalanceUI() {
    if (!userData) return;
    
    const balance = userData.balance || 0;
    const rub = (balance * 0.01).toFixed(2);
    
    // Обновляем все отображения баланса
    const balanceElements = [
        'balanceAmount', 'balanceRub',
        'clickerBalance', 'clickerBalanceRub',
        'referralBalance', 'referralBalanceRub'
    ];
    
    balanceElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (id.includes('Amount') || id.includes('Balance')) {
                element.textContent = `${balance} X`;
            } else if (id.includes('Rub')) {
                element.textContent = `≈ ${rub} ₽`;
            }
        }
    });
}

// ===== ОБНОВЛЕНИЕ СТАТИСТИКИ ПРОФИЛЯ =====
function updateProfileStats() {
    if (!userData) return;
    
    const elements = {
        completedTasks: document.getElementById('completedTasks'),
        totalClicksStat: document.getElementById('totalClicksStat'),
        referralsCountStat: document.getElementById('referralsCountStat'),
        totalEarned: document.getElementById('totalEarned'),
        totalClicks: document.getElementById('totalClicks'),
        dailyClicks: document.getElementById('dailyClicks')
    };
    
    if (elements.completedTasks) elements.completedTasks.textContent = userData.completedTasks?.length || 0;
    if (elements.totalClicksStat) elements.totalClicksStat.textContent = userData.clicks || 0;
    if (elements.totalClicks) elements.totalClicks.textContent = userData.clicks || 0;
    if (elements.dailyClicks) elements.dailyClicks.textContent = userData.dailyClicks || 0;
    if (elements.referralsCountStat) elements.referralsCountStat.textContent = userData.referralCount || 0;
    if (elements.totalEarned) elements.totalEarned.textContent = (userData.totalEarned || 0) + ' X';
}

// ===== ЗАГРУЗКА НАСТРОЕК =====
async function loadSettings() {
    try {
        // Награда за клик
        const clickDoc = await db.collection('settings').doc('clickReward').get();
        if (clickDoc.exists) {
            clickReward = clickDoc.data().value || 1;
            const perClickAmount = document.getElementById('perClickAmount');
            if (perClickAmount) perClickAmount.textContent = `${clickReward} X`;
            const clickRewardInput = document.getElementById('clickReward');
            if (clickRewardInput) clickRewardInput.value = clickReward;
        }
        
        // Награда за реферала
        const refDoc = await db.collection('settings').doc('referralReward').get();
        if (refDoc.exists) {
            referralReward = refDoc.data().value || 10;
            const referralRewardElement = document.getElementById('referralReward');
            if (referralRewardElement) referralRewardElement.textContent = referralReward;
            const referralRewardInput = document.getElementById('referralRewardInput');
            if (referralRewardInput) referralRewardInput.value = referralReward;
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// ===== ОБНОВЛЕНИЕ UI РЕФЕРАЛОВ =====
async function updateReferralsUI() {
    if (!currentUser) return;
    
    // Генерируем реферальную ссылку
    const BOT_LINK = window.APP_CONFIG ? window.APP_CONFIG.BOT_LINK : "https://t.me/x_project_tg_bot";
    const referralUrl = `${BOT_LINK}?startapp=${currentUser.id}`;
    const referralLinkElement = document.getElementById('referralLink');
    if (referralLinkElement) referralLinkElement.textContent = referralUrl;
    
    // Обновляем статистику
    const referralsCount = document.getElementById('referralsCount');
    const referralsEarned = document.getElementById('referralsEarned');
    
    if (referralsCount) referralsCount.textContent = userData?.referralCount || 0;
    if (referralsEarned) referralsEarned.textContent = (userData?.referralEarned || 0) + ' X';
    
    // Загружаем список рефералов
    await loadReferralsList();
}

// ===== ЗАГРУЗКА СПИСКА РЕФЕРАЛОВ =====
async function loadReferralsList() {
    const referralsList = document.getElementById('referralsList');
    if (!referralsList) return;
    
    if (!userData?.referrals || userData.referrals.length === 0) {
        referralsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-friends"></i>
                <div>У вас пока нет рефералов</div>
            </div>
        `;
        return;
    }
    
    try {
        referralsList.innerHTML = '<div class="loading"><div class="spinner"></div><div>Загрузка...</div></div>';
        
        const referralsData = [];
        for (const refId of userData.referrals.slice(0, 20)) {
            try {
                const doc = await db.collection('users').doc(refId).get();
                if (doc.exists) {
                    const data = doc.data();
                    referralsData.push({
                        id: refId,
                        username: data.username,
                        firstName: data.firstName,
                        joinDate: data.joinDate
                    });
                }
            } catch (error) {
                console.error('Error loading referral:', error);
            }
        }
        
        if (referralsData.length === 0) {
            referralsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-friends"></i>
                    <div>Ошибка загрузки рефералов</div>
                </div>
            `;
            return;
        }
        
        let html = '';
        referralsData.forEach((ref, index) => {
            const joinDate = ref.joinDate ? new Date(ref.joinDate).toLocaleDateString('ru-RU') : 'Неизвестно';
            html += `
                <div class="referral-item">
                    <div class="referral-avatar">
                        ${index + 1}
                    </div>
                    <div class="referral-info">
                        <div class="referral-name">${ref.firstName || 'Пользователь'}</div>
                        <div class="referral-id">@${ref.username} • Зарегистрирован: ${joinDate}</div>
                    </div>
                </div>
            `;
        });
        
        referralsList.innerHTML = html;
    } catch (error) {
        console.error('Error loading referrals list:', error);
        referralsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <div>Ошибка загрузки списка рефералов</div>
            </div>
        `;
    }
}

// ===== КОПИРОВАНИЕ РЕФЕРАЛЬНОЙ ССЫЛКИ =====
function copyReferralLink() {
    const referralLinkElement = document.getElementById('referralLink');
    if (!referralLinkElement) return;
    
    const link = referralLinkElement.textContent;
    
    // Используем Clipboard API если доступен
    if (navigator.clipboard) {
        navigator.clipboard.writeText(link).then(() => {
            showMessage('Ссылка скопирована в буфер обмена!', 'success');
        }).catch(err => {
            console.error('Failed to copy: ', err);
            fallbackCopy(link);
        });
    } else {
        fallbackCopy(link);
    }
}

// ===== РЕЗЕРВНОЕ КОПИРОВАНИЕ =====
function fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
        document.execCommand('copy');
        showMessage('Ссылка скопирована в буфер обмена!', 'success');
    } catch (err) {
        console.error('Fallback copy failed: ', err);
        showMessage('Не удалось скопировать ссылку', 'error');
    }
    
    document.body.removeChild(textArea);
}

// ===== ПРОВЕРКА КНОПКИ ВЫВОДА =====
function checkWithdrawButton() {
    const withdrawButton = document.getElementById('withdrawButton');
    const withdrawMessage = document.getElementById('withdrawMessage');
    
    if (!withdrawButton || !withdrawMessage) return;
    
    const MIN_WITHDRAW = window.APP_CONFIG ? window.APP_CONFIG.MIN_WITHDRAW : 5000;
    const completedCount = userData?.completedTasks?.length || 0;
    const balance = userData?.balance || 0;
    
    if (completedCount >= 5 && balance >= MIN_WITHDRAW) {
        withdrawButton.innerHTML = '<i class="fas fa-credit-card"></i> Вывести средства';
        withdrawButton.classList.remove('btn-disabled');
        withdrawMessage.style.display = 'none';
    } else {
        withdrawButton.innerHTML = '<i class="fas fa-lock"></i> Выполните 5 заданий';
        withdrawButton.classList.add('btn-disabled');
        withdrawMessage.style.display = 'block';
    }
}

// ===== ПРОВЕРКА ДОСТУПНОСТИ ВЫВОДА =====
function checkWithdrawAvailability() {
    const MIN_WITHDRAW = window.APP_CONFIG ? window.APP_CONFIG.MIN_WITHDRAW : 5000;
    const completedCount = userData?.completedTasks?.length || 0;
    const balance = userData?.balance || 0;
    
    if (completedCount < 5) {
        showMessage('Выполните 5 заданий чтобы вывести средства', 'error');
        return;
    }
    
    if (balance < MIN_WITHDRAW) {
        showMessage(`Минимальная сумма для вывода: ${MIN_WITHDRAW} X (50 рублей)`, 'error');
        return;
    }
    
    openWithdrawModal();
}

// ===== ОТКРЫТИЕ МОДАЛЬНОГО ОКНА ВЫВОДА =====
function openWithdrawModal() {
    const MIN_WITHDRAW = window.APP_CONFIG ? window.APP_CONFIG.MIN_WITHDRAW : 5000;
    const balance = userData?.balance || 0;
    
    if (balance < MIN_WITHDRAW) {
        showMessage(`Минимальная сумма для вывода: ${MIN_WITHDRAW} X (50 рублей)`, 'error');
        return;
    }
    
    const withdrawAmount = document.getElementById('withdrawAmount');
    if (withdrawAmount) {
        withdrawAmount.value = Math.min(balance, MIN_WITHDRAW);
        updateWithdrawRub();
    }
    
    document.getElementById('withdrawModal').classList.add('active');
}

// ===== ЗАКРЫТИЕ МОДАЛЬНОГО ОКНА ВЫВОДА =====
function closeWithdrawModal() {
    document.getElementById('withdrawModal').classList.remove('active');
}

// ===== ОБНОВЛЕНИЕ СУММЫ В РУБЛЯХ =====
function updateWithdrawRub() {
    const amountInput = document.getElementById('withdrawAmount');
    const rubAmount = document.getElementById('withdrawRubAmount');
    
    if (!amountInput || !rubAmount) return;
    
    const amount = parseInt(amountInput.value) || 0;
    const rub = (amount * 0.01).toFixed(2);
    rubAmount.textContent = rub;
}

// ===== ОТПРАВКА ЗАЯВКИ НА ВЫВОД =====
async function submitWithdrawRequest() {
    if (!currentUser) return;
    
    const MIN_WITHDRAW = window.APP_CONFIG ? window.APP_CONFIG.MIN_WITHDRAW : 5000;
    const ADMIN_ID = window.APP_CONFIG ? window.APP_CONFIG.ADMIN_ID : "7020322752";
    
    const amount = parseInt(document.getElementById('withdrawAmount').value);
    const cardNumber = document.getElementById('withdrawCard').value.trim();
    const balance = userData?.balance || 0;
    
    // Валидация
    if (!amount || amount < MIN_WITHDRAW) {
        showMessage(`Минимальная сумма: ${MIN_WITHDRAW} X`, 'error');
        return;
    }
    
    if (amount > balance) {
        showMessage('Недостаточно средств', 'error');
        return;
    }
    
    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
        showMessage('Введите корректный номер карты', 'error');
        return;
    }
    
    try {
        // Создаем заявку
        const requestId = `withdraw_${Date.now()}_${currentUser.id}`;
        await db.collection('withdrawRequests').doc(requestId).set({
            id: requestId,
            userId: currentUser.id,
            userUsername: currentUser.username,
            userFirstName: currentUser.firstName,
            amount: amount,
            rubAmount: amount * 0.01,
            cardNumber: cardNumber.replace(/\s/g, ''),
            status: 'pending',
            createdAt: new Date().toISOString()
        });
        
        // Списание баланса
        await db.collection('users').doc(currentUser.id).update({
            balance: firebase.firestore.FieldValue.increment(-amount)
        });
        
        // Обновление локальных данных
        userData.balance = balance - amount;
        updateBalanceUI();
        
        // Отправляем уведомление админу
        if (window.sendTelegramNotification) {
            const adminMessage = `💳 Новая заявка на вывод!\n\n` +
                               `Пользователь: @${currentUser.username}\n` +
                               `Сумма: ${amount} X (${amount * 0.01} руб)\n` +
                               `Карта: ****${cardNumber.slice(-4)}\n` +
                               `ID заявки: ${requestId}`;
            
            sendTelegramNotification(ADMIN_ID, adminMessage);
        }
        
        // Отправляем уведомление пользователю
        if (window.sendTelegramNotification) {
            const userMessage = `✅ Ваша заявка на вывод ${amount} X (${amount * 0.01} руб) принята в обработку!\n\n` +
                              `Ожидайте выплаты в течение 24 часов.`;
            
            sendTelegramNotification(currentUser.id, userMessage);
        }
        
        closeWithdrawModal();
        showMessage('✅ Заявка на вывод отправлена! Ожидайте выплаты в течение 24 часов.', 'success');
        
        // Обновляем кнопку вывода
        checkWithdrawButton();
        
    } catch (error) {
        console.error('Error submitting withdraw:', error);
        showMessage('❌ Ошибка отправки заявки', 'error');
    }
}

// ===== ОБРАБОТКА КЛИКА В КЛИКЕРЕ =====
async function handleClick(e) {
    if (!currentUser || !userData) return;
    
    // Проверяем энергию
    if (userData.energy <= 0) {
        showMessage('Недостаточно энергии! Энергия восстановится завтра.', 'error');
        return;
    }
    
    // Создаем частицы
    createParticles(e);
    
    // Обновляем значения
    const newClicks = (userData.clicks || 0) + 1;
    const newDailyClicks = (userData.dailyClicks || 0) + 1;
    const newEnergy = (userData.energy || 0) - 1;
    const newBalance = (userData.balance || 0) + clickReward;
    const newTotalEarned = (userData.totalEarned || 0) + clickReward;
    
    try {
        // Обновляем в базе данных
        await db.collection('users').doc(currentUser.id).update({
            clicks: newClicks,
            dailyClicks: newDailyClicks,
            energy: newEnergy,
            balance: newBalance,
            totalEarned: newTotalEarned,
            lastClickDate: new Date().toISOString()
        });
        
        // Обновляем локальные данные
        userData.clicks = newClicks;
        userData.dailyClicks = newDailyClicks;
        userData.energy = newEnergy;
        userData.balance = newBalance;
        userData.totalEarned = newTotalEarned;
        
        // Обновляем UI
        updateBalanceUI();
        updateEnergyUI();
        updateProfileStats();
        
        // Показываем анимацию награды
        showClickRewardAnimation(e, clickReward);
        
    } catch (error) {
        console.error('Error updating click:', error);
    }
}

// ===== СОЗДАНИЕ ЧАСТИЦ ДЛЯ КЛИКЕРА =====
function createParticles(e) {
    const clickParticles = document.getElementById('clickParticles');
    if (!clickParticles) return;
    
    const rect = clickParticles.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Создаем 8-10 частиц
    const particleCount = 8 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'click-particle';
        
        const angle = Math.random() * Math.PI * 2;
        const distance = 80 + Math.random() * 70;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        
        const size = 20 + Math.random() * 20;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        const rotation = Math.random() * 360;
        
        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);
        particle.style.left = `${x - size/2}px`;
        particle.style.top = `${y - size/2}px`;
        particle.style.transform = `rotate(${rotation}deg)`;
        
        clickParticles.appendChild(particle);
        
        // Удаляем частицу через 1 секунду
        setTimeout(() => {
            if (particle.parentNode === clickParticles) {
                particle.remove();
            }
        }, 1000);
    }
}

// ===== АНИМАЦИЯ НАГРАДЫ ЗА КЛИК =====
function showClickRewardAnimation(e, reward) {
    const rewardElement = document.createElement('div');
    rewardElement.className = 'click-reward-animation';
    rewardElement.textContent = `+${reward} X`;
    rewardElement.style.cssText = `
        position: absolute;
        color: var(--bright-green);
        font-weight: bold;
        font-size: 18px;
        pointer-events: none;
        z-index: 1000;
        animation: floatUp 1s ease-out forwards;
        text-shadow: 0 2px 4px rgba(0,0,0,0.5);
    `;
    
    const rect = document.getElementById('clickerButton').getBoundingClientRect();
    rewardElement.style.left = `${e.clientX - rect.left}px`;
    rewardElement.style.top = `${e.clientY - rect.top}px`;
    
    document.getElementById('clickerButton').appendChild(rewardElement);
    
    // Удаляем через 1 секунду
    setTimeout(() => {
        rewardElement.remove();
    }, 1000);
}

// Добавляем стили для анимации награды
const style = document.createElement('style');
style.textContent = `
    @keyframes floatUp {
        0% {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
        100% {
            opacity: 0;
            transform: translateY(-50px) scale(1.2);
        }
    }
`;
document.head.appendChild(style);

// ===== АДМИНКА =====
async function loadAdminData() {
    await loadPendingTasks();
    await loadWithdrawRequests();
    await loadAllTasks();
    await loadActionHistory();
}

// ===== ПОКАЗ АДМИН МЕНЮ =====
function showAdminMenu() {
    document.querySelectorAll('.section').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });
    
    document.getElementById('adminSection').style.display = 'block';
    document.getElementById('adminSection').classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
}

// ===== ЗАГРУЗКА ЗАДАНИЙ НА ПРОВЕРКУ =====
async function loadPendingTasks() {
    try {
        const snapshot = await db.collection('taskSubmissions')
            .where('status', '==', 'pending')
            .orderBy('submittedAt', 'desc')
            .limit(50)
            .get();
        
        pendingTasks = [];
        snapshot.forEach(doc => {
            pendingTasks.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        renderPendingTasks();
    } catch (error) {
        console.error('Error loading pending tasks:', error);
    }
}

// ===== ОТОБРАЖЕНИЕ ЗАДАНИЙ НА ПРОВЕРКЕ =====
function renderPendingTasks() {
    const pendingTasksList = document.getElementById('pendingTasksList');
    if (!pendingTasksList) return;
    
    if (pendingTasks.length === 0) {
        pendingTasksList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tasks"></i>
                <div>Нет заданий на проверке</div>
            </div>
        `;
        return;
    }
    
    let html = '';
    pendingTasks.forEach(task => {
        const date = new Date(task.submittedAt);
        const formattedDate = date.toLocaleDateString('ru-RU') + ' ' + date.toLocaleTimeString('ru-RU');
        
        html += `
            <div class="admin-item">
                <div class="admin-item-info">
                    <div class="admin-item-title">${task.taskName}</div>
                    <div class="admin-item-details">
                        ${task.taskPrice} X • ${formattedDate}
                    </div>
                    <div class="admin-item-user">
                        ID: ${task.userTelegramId} • @${task.userUsername}
                    </div>
                </div>
                <div class="admin-actions">
                    <button class="btn btn-small btn-approve" onclick="reviewTask('${task.id}', 'approved')">
                        <i class="fas fa-check"></i> Одобрить
                    </button>
                    <button class="btn btn-small btn-reject" onclick="reviewTask('${task.id}', 'rejected')">
                        <i class="fas fa-times"></i> Отклонить
                    </button>
                </div>
            </div>
        `;
    });
    
    pendingTasksList.innerHTML = html;
}

// ===== ПРОВЕРКА ЗАДАНИЯ (АДМИН) =====
async function reviewTask(submissionId, status) {
    const ADMIN_ID = window.APP_CONFIG ? window.APP_CONFIG.ADMIN_ID : "7020322752";
    
    if (currentUser.id !== ADMIN_ID) {
        showMessage('Доступ запрещен', 'error');
        return;
    }
    
    try {
        const submissionRef = db.collection('taskSubmissions').doc(submissionId);
        const submissionDoc = await submissionRef.get();
        
        if (!submissionDoc.exists) {
            showMessage('Отчет не найден', 'error');
            return;
        }
        
        const submission = submissionDoc.data();
        
        // Обновляем статус отчета
        await submissionRef.update({
            status: status,
            reviewedBy: currentUser.id,
            reviewedAt: new Date().toISOString()
        });
        
        const userRef = db.collection('users').doc(submission.userId);
        
        if (status === 'approved') {
            // Добавляем в выполненные и обновляем баланс
            await userRef.update({
                pendingTasks: firebase.firestore.FieldValue.arrayRemove(submission.taskId),
                completedTasks: firebase.firestore.FieldValue.arrayUnion(submission.taskId),
                balance: firebase.firestore.FieldValue.increment(submission.taskPrice),
                totalEarned: firebase.firestore.FieldValue.increment(submission.taskPrice)
            });
            
            // Проверяем реферальный бонус (первое выполненное задание)
            const userDoc = await userRef.get();
            const userData = userDoc.data();
            
            if (userData.referredBy && userData.completedTasks?.length === 1) {
                // Награда рефереру
                await db.collection('users').doc(userData.referredBy).update({
                    referralEarned: firebase.firestore.FieldValue.increment(referralReward),
                    balance: firebase.firestore.FieldValue.increment(referralReward)
                });
                
                // Уведомление рефереру
                if (window.sendTelegramNotification) {
                    const referrerMessage = `🎉 Ваш реферал @${submission.userUsername} выполнил первое задание!\n\n` +
                                          `Вы получили ${referralReward} X реферального бонуса!`;
                    
                    sendTelegramNotification(userData.referredBy, referrerMessage);
                }
            }
            
            // Уведомление пользователю
            if (window.sendTelegramNotification) {
                const userMessage = `✅ Ваше задание "${submission.taskName}" одобрено!\n\n` +
                                  `Вы получили ${submission.taskPrice} X на баланс.`;
                
                sendTelegramNotification(submission.userId, userMessage);
            }
            
        } else {
            // Удаляем из pending
            await userRef.update({
                pendingTasks: firebase.firestore.FieldValue.arrayRemove(submission.taskId)
            });
            
            // Уведомление пользователю
            if (window.sendTelegramNotification) {
                const userMessage = `❌ Ваше задание "${submission.taskName}" отклонено.\n\n` +
                                  `Проверьте выполнение задания и попробуйте снова.`;
                
                sendTelegramNotification(submission.userId, userMessage);
            }
        }
        
        // Перезагружаем
        await loadPendingTasks();
        await loadUserData(); // Обновляем данные пользователя
        
        showMessage(`Задание ${status === 'approved' ? 'одобрено' : 'отклонено'}`, 'success');
        
    } catch (error) {
        console.error('Error reviewing task:', error);
        showMessage('Ошибка проверки задания', 'error');
    }
}

// ===== ОБНОВЛЕНИЕ НАСТРОЕК =====
async function updateSettings() {
    const ADMIN_ID = window.APP_CONFIG ? window.APP_CONFIG.ADMIN_ID : "7020322752";
    
    if (currentUser.id !== ADMIN_ID) {
        showMessage('Доступ запрещен', 'error');
        return;
    }
    
    const newClickReward = parseFloat(document.getElementById('clickReward').value);
    const newReferralReward = parseInt(document.getElementById('referralRewardInput').value);
    
    if (isNaN(newClickReward) || newClickReward < 0.1) {
        showMessage('Некорректная награда за клик', 'error');
        return;
    }
    
    if (isNaN(newReferralReward) || newReferralReward < 1) {
        showMessage('Некорректная награда за реферала', 'error');
        return;
    }
    
    try {
        await db.collection('settings').doc('clickReward').set({
            value: newClickReward,
            updatedBy: currentUser.id,
            updatedAt: new Date().toISOString()
        });
        
        await db.collection('settings').doc('referralReward').set({
            value: newReferralReward,
            updatedBy: currentUser.id,
            updatedAt: new Date().toISOString()
        });
        
        clickReward = newClickReward;
        referralReward = newReferralReward;
        
        document.getElementById('perClickAmount').textContent = `${clickReward} X`;
        document.getElementById('referralReward').textContent = referralReward;
        
        showMessage('Настройки сохранены', 'success');
        
    } catch (error) {
        console.error('Error updating settings:', error);
        showMessage('Ошибка сохранения настроек', 'error');
    }
}

// ===== ДОБАВЛЕНИЕ ЗАДАНИЯ (АДМИН) =====
async function addTask(e) {
    e.preventDefault();
    
    const ADMIN_ID = window.APP_CONFIG ? window.APP_CONFIG.ADMIN_ID : "7020322752";
    
    if (currentUser.id !== ADMIN_ID) {
        showMessage('Доступ запрещен', 'error');
        return;
    }
    
    const name = document.getElementById('taskName').value;
    const description = document.getElementById('taskDescription').value;
    const link = document.getElementById('taskLink').value;
    const price = parseInt(document.getElementById('taskPrice').value);
    const category = document.getElementById('taskCategory').value;
    
    if (!name || !description || !link || !price || !taskImageFile) {
        showMessage('Заполните все поля и выберите фото', 'error');
        return;
    }
    
    try {
        // Загружаем изображение
        const storageRef = storage.ref();
        const imageRef = storageRef.child(`task_images/${Date.now()}_${taskImageFile.name}`);
        const snapshot = await imageRef.put(taskImageFile);
        const imageUrl = await snapshot.ref.getDownloadURL();
        
        // Создаем задание
        const taskId = `task_${Date.now()}`;
        await db.collection('tasks').doc(taskId).set({
            id: taskId,
            name: name,
            description: description,
            link: link,
            price: price,
            category: category,
            imageUrl: imageUrl,
            active: true,
            createdAt: new Date().toISOString(),
            createdBy: currentUser.id
        });
        
        // Сбрасываем форму
        document.getElementById('addTaskForm').reset();
        taskImageFile = null;
        
        // Перезагружаем задания
        await loadTasks();
        await loadAllTasks();
        
        showMessage('Задание добавлено', 'success');
        
    } catch (error) {
        console.error('Error adding task:', error);
        showMessage('Ошибка добавления задания', 'error');
    }
}

// ===== НАВИГАЦИЯ =====
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            
            // Обновляем активную кнопку
            navButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Скрываем все разделы
            document.querySelectorAll('.section').forEach(s => {
                s.classList.remove('active');
                s.style.display = 'none';
            });
            
            // Показываем выбранный раздел
            const sectionId = section + 'Section';
            const sectionElement = document.getElementById(sectionId);
            
            if (sectionElement) {
                sectionElement.style.display = 'block';
                sectionElement.classList.add('active');
                
                // Если это кликер, обновляем энергию
                if (section === 'clicker') {
                    updateEnergyUI();
                }
                
                // Если это админка и пользователь админ
                if (section === 'admin' && currentUser.id === (window.APP_CONFIG ? window.APP_CONFIG.ADMIN_ID : "7020322752")) {
                    showAdminMenu();
                }
            }
        });
    });
}

// ===== ИНИЦИАЛИЗАЦИЯ СОБЫТИЙ =====
function initEventListeners() {
    // Кнопка кликера
    const clickerButton = document.getElementById('clickerButton');
    if (clickerButton) {
        clickerButton.addEventListener('click', handleClick);
    }
    
    // Поле суммы вывода
    const withdrawAmount = document.getElementById('withdrawAmount');
    if (withdrawAmount) {
        withdrawAmount.addEventListener('input', updateWithdrawRub);
    }
    
    // Форма добавления задания
    const addTaskForm = document.getElementById('addTaskForm');
    if (addTaskForm) {
        addTaskForm.addEventListener('submit', addTask);
    }
    
    // Загрузка изображения для задания
    const taskImageInput = document.getElementById('taskImageInput');
    if (taskImageInput) {
        taskImageInput.addEventListener('change', function(e) {
            taskImageFile = e.target.files[0];
        });
    }
}

// ===== ПОКАЗ СООБЩЕНИЙ =====
function showMessage(text, type = 'info') {
    let messageContainer = document.getElementById('messageContainer');
    
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.id = 'messageContainer';
        messageContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 300px;
        `;
        document.body.appendChild(messageContainer);
    }
    
    const message = document.createElement('div');
    message.className = `message ${type} active`;
    message.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <div style="font-size: 20px;">
                ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
            </div>
            <div style="flex: 1;">${text}</div>
        </div>
    `;
    
    messageContainer.appendChild(message);
    
    // Удаляем сообщение через 3 секунды
    setTimeout(() => {
        message.classList.remove('active');
        setTimeout(() => message.remove(), 300);
    }, 3000);
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====

// Загрузка всех задач (админ)
async function loadAllTasks() {
    // Реализация при необходимости
}

// Загрузка заявок на вывод (админ)
async function loadWithdrawRequests() {
    // Реализация при необходимости
}

// Загрузка истории действий (админ)
async function loadActionHistory() {
    // Реализация при необходимости
}

// Экспортируем функции для использования в HTML
window.copyReferralLink = copyReferralLink;
window.checkWithdrawAvailability = checkWithdrawAvailability;
window.openTaskModal = openTaskModal;
window.closeTaskModal = closeTaskModal;
window.startTask = startTask;
window.backToStep1 = backToStep1;
window.submitTaskReport = submitTaskReport;
window.openWithdrawModal = openWithdrawModal;
window.closeWithdrawModal = closeWithdrawModal;
window.updateWithdrawRub = updateWithdrawRub;
window.submitWithdrawRequest = submitWithdrawRequest;
window.showAdminMenu = showAdminMenu;
window.reviewTask = reviewTask;
window.updateSettings = updateSettings;

console.log('App.js loaded successfully');
