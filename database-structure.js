// database-structure.js - Структура Firestore для X Project
// ЭТО НЕ РАБОЧИЙ КОД! Это инструкция по созданию базы данных.

/*
📋 ИНСТРУКЦИЯ ПО СОЗДАНИЮ БАЗЫ ДАННЫХ В FIREBASE FIRESTORE:

1. Перейдите в Firebase Console: https://console.firebase.google.com/
2. Выберите ваш проект "xproject-1c0ff"
3. В меню слева выберите "Firestore Database"
4. Нажмите "Создать базу данных"
5. Выберите "Начать в тестовом режиме" (позже настроите правила)
6. Выберите регион (лучше europe-west3 для России)
7. Нажмите "Готово"

📁 СОЗДАЙТЕ СЛЕДУЮЩИЕ КОЛЛЕКЦИИ:
*/

// ===== КОЛЛЕКЦИЯ: users (Пользователи) =====
/*
Каждый документ = один пользователь
ID документа = Telegram ID пользователя

Поля:
- userId: string (Telegram ID)
- username: string
- firstName: string
- lastName: string (опционально)
- photoUrl: string
- balance: number (текущий баланс в X коинах)
- totalEarned: number (всего заработано)
- completedTasks: array (массив ID выполненных заданий)
- pendingTasks: array (массив ID заданий на проверке)
- clicks: number (всего кликов)
- dailyClicks: number (кликов сегодня)
- lastClickDate: timestamp
- referrals: array (массив ID рефералов)
- referralCount: number (количество рефералов)
- referralEarned: number (заработано на рефералах)
- referredBy: string (ID того, кто пригласил, или null)
- joinDate: timestamp
- isAdmin: boolean (true/false)
- lastActive: timestamp
- energy: number (текущая энергия, max 500)
- lastEnergyUpdate: timestamp
*/

// ===== КОЛЛЕКЦИЯ: tasks (Задания) =====
/*
Каждый документ = одно задание
ID документа = автоматически или task_123456

Поля:
- id: string
- name: string (название задания)
- description: string (подробное описание)
- link: string (ссылка для перехода)
- price: number (цена в X коинах)
- category: string (cheap/expensive/subscriptions/bots/registrations/other)
- imageUrl: string (URL изображения)
- active: boolean (активно/неактивно)
- createdAt: timestamp
- createdBy: string (ID админа)
- requirements: string (требования к выполнению, опционально)
- maxCompletions: number (максимум выполнений, опционально)
- currentCompletions: number (сколько раз выполнено, опционально)
*/

// ===== КОЛЛЕКЦИЯ: taskSubmissions (Отчеты по заданиям) =====
/*
Каждый документ = один отчет о выполнении
ID документа = userID_taskID_timestamp

Поля:
- id: string
- userId: string
- taskId: string
- taskName: string
- taskPrice: number
- userUsername: string
- userFirstName: string
- userPhotoUrl: string
- userTelegramId: string
- reportPhotoUrl: string (URL скриншота)
- status: string (pending/approved/rejected)
- submittedAt: timestamp
- reviewedBy: string (ID админа, опционально)
- reviewedAt: timestamp (опционально)
- adminComment: string (комментарий админа, опционально)
*/

// ===== КОЛЛЕКЦИЯ: withdrawRequests (Заявки на вывод) =====
/*
Каждый документ = одна заявка на вывод
ID документа = withdraw_timestamp_userID

Поля:
- id: string
- userId: string
- userUsername: string
- userFirstName: string
- amount: number (сумма в X коинах)
- rubAmount: number (сумма в рублях)
- cardNumber: string (номер карты)
- status: string (pending/approved/rejected/paid)
- createdAt: timestamp
- processedBy: string (ID админа, опционально)
- processedAt: timestamp (опционально)
- transactionId: string (ID транзакции, опционально)
*/

// ===== КОЛЛЕКЦИЯ: settings (Настройки) =====
/*
Несколько документов с настройками приложения

Документы:
1. ID: clickReward
   Поля:
   - value: number (награда за клик, например 1)
   - updatedBy: string
   - updatedAt: timestamp

2. ID: referralReward
   Поля:
   - value: number (награда за реферала, например 10)
   - updatedBy: string
   - updatedAt: timestamp

3. ID: appSettings
   Поля:
   - minWithdraw: number (минимальный вывод, например 5000)
   - dailyEnergy: number (дневной лимит энергии, например 500)
   - tasksForWithdraw: number (заданий для вывода, например 5)
   - maintenanceMode: boolean
   - version: string
*/

// ===== КОЛЛЕКЦИЯ: adminLogs (Логи админа) =====
/*
Каждый документ = одно действие админа
ID документа = log_timestamp

Поля:
- id: string
- adminId: string
- adminUsername: string
- action: string (task_approved/task_rejected/withdraw_approved/settings_updated)
- targetId: string (ID задания/заявки)
- targetType: string (task/withdraw/settings)
- details: string (подробности)
- timestamp: timestamp
*/

// ===== ПРАВИЛА БЕЗОПАСНОСТИ (Firestore Rules) =====
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Все могут читать задания
    match /tasks/{taskId} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.auth.token.admin == true;
    }
    
    // Пользователи могут читать/писать свои данные
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.uid == userId;
    }
    
    // Отчеты: пользователь создает, админ читает/обновляет
    match /taskSubmissions/{submissionId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null && 
        (request.auth.token.admin == true || 
         resource.data.userId == request.auth.uid);
      allow update: if request.auth != null && 
        request.auth.token.admin == true;
    }
    
    // Заявки на вывод: аналогично
    match /withdrawRequests/{requestId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null && 
        (request.auth.token.admin == true || 
         resource.data.userId == request.auth.uid);
      allow update: if request.auth != null && 
        request.auth.token.admin == true;
    }
    
    // Настройки: только админ
    match /settings/{settingId} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.auth.token.admin == true;
    }
    
    // Логи: только админ
    match /adminLogs/{logId} {
      allow read, write: if request.auth != null && 
        request.auth.token.admin == true;
    }
  }
}
*/

// ===== СКРИПТ ДЛЯ СОЗДАНИЯ ТЕСТОВЫХ ДАННЫХ =====
async function createTestData() {
    console.log('🔄 Создание тестовых данных...');
    
    // Только для демонстрации - в реальности используйте Firebase Console
    const testData = {
        settings: {
            clickReward: { value: 1, updatedAt: new Date().toISOString() },
            referralReward: { value: 10, updatedAt: new Date().toISOString() },
            appSettings: {
                minWithdraw: 5000,
                dailyEnergy: 500,
                tasksForWithdraw: 5,
                maintenanceMode: false,
                version: "1.0.0"
            }
        },
        tasks: [
            {
                id: "task_1",
                name: "Подпишитесь на канал X Project",
                description: "Подпишитесь на наш новостной канал и получите 50 X коинов",
                link: "https://t.me/x_project_news",
                price: 50,
                category: "subscriptions",
                imageUrl: "https://images.unsplash.com/photo-1611605698335-8b1569810432?w=400&h=200&fit=crop",
                active: true,
                createdAt: new Date().toISOString(),
                createdBy: "admin"
            },
            {
                id: "task_2",
                name: "Вступите в группу поддержки",
                description: "Вступите в нашу группу поддержки и получите 30 X коинов",
                link: "https://t.me/x_project_support",
                price: 30,
                category: "subscriptions",
                imageUrl: "https://images.unsplash.com/photo-1611605698323-b1e99cfd37ea?w=400&h=200&fit=crop",
                active: true,
                createdAt: new Date().toISOString(),
                createdBy: "admin"
            }
        ]
    };
    
    console.log('✅ Структура тестовых данных готова');
    console.log('📝 Скопируйте эти данные в Firebase Console');
    console.log(JSON.stringify(testData, null, 2));
}

// Экспорт функции для ручного запуска
window.createTestData = createTestData;

console.log('🗄️ Инструкция по структуре базы данных загружена');
