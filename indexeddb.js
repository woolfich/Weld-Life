// Константы для базы данных
const DB_NAME = 'welder_pwa_db';
const DB_VERSION = 3; // Версия базы данных
const OBJECT_STORES = {
    WELDERS: 'welders',
    PRODUCTS: 'products',
    WELDER_RECORDS: 'welder_records',
    OPERATION_HISTORY: 'operation_history' // Хранилище для истории операций
};

let db; // Глобальная переменная для базы данных

// Функция для получения db с проверкой инициализации
function getDb() {
    if (!db) {
        throw new Error('База данных не инициализирована. Сначала вызовите openDatabase().');
    }
    return db;
}

// Открытие базы данных
function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            // Создаем хранилище для сварщиков
            if (!database.objectStoreNames.contains(OBJECT_STORES.WELDERS)) {
                database.createObjectStore(OBJECT_STORES.WELDERS, { keyPath: 'id', autoIncrement: true });
            }

            // Создаем хранилище для изделий
            if (!database.objectStoreNames.contains(OBJECT_STORES.PRODUCTS)) {
                database.createObjectStore(OBJECT_STORES.PRODUCTS, { keyPath: 'id', autoIncrement: true });
            }

            // Удаляем старое хранилище WELDER_RECORDS, если оно существует
            if (database.objectStoreNames.contains(OBJECT_STORES.WELDER_RECORDS)) {
                database.deleteObjectStore(OBJECT_STORES.WELDER_RECORDS);
            }

            // Создаем новое хранилище WELDER_RECORDS с индексами
            const welderRecordsStore = database.createObjectStore(OBJECT_STORES.WELDER_RECORDS, { keyPath: 'id', autoIncrement: true });
            welderRecordsStore.createIndex('byWelderArticleMonth', ['welderId', 'article', 'monthYear'], { unique: false });
            welderRecordsStore.createIndex('byWelderMonth', ['welderId', 'monthYear'], { unique: false });

            // Создаем хранилище для истории операций
            if (!database.objectStoreNames.contains(OBJECT_STORES.OPERATION_HISTORY)) {
                database.createObjectStore(OBJECT_STORES.OPERATION_HISTORY, { keyPath: 'id', autoIncrement: true });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };

        request.onerror = (event) => {
            console.error('Ошибка открытия IndexedDB:', event.target.error);
            reject(new Error(`Не удалось открыть базу данных: ${event.target.error.message}`));
        };
    });
}

// Добавление данных в хранилище
function addData(storeName, data) {
    return new Promise((resolve, reject) => {
        const database = getDb();
        const transaction = database.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(data);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = (event) => {
            console.error(`Ошибка добавления данных в ${storeName}:`, event.target.error);
            reject(new Error(`Не удалось добавить данные: ${event.target.error.message}`));
        };
    });
}

// Получение данных по ID
function getData(storeName, id) {
    return new Promise((resolve, reject) => {
        const database = getDb();
        const transaction = database.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = (event) => {
            console.error(`Ошибка получения данных из ${storeName}:`, event.target.error);
            reject(new Error(`Не удалось получить данные: ${event.target.error.message}`));
        };
    });
}

// Получение всех данных из хранилища
function getAllData(storeName) {
    return new Promise((resolve, reject) => {
        const database = getDb();
        const transaction = database.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = (event) => {
            console.error(`Ошибка получения всех данных из ${storeName}:`, event.target.error);
            reject(new Error(`Не удалось получить данные: ${event.target.error.message}`));
        };
    });
}

// Обновление данных в хранилище
function updateData(storeName, data) {
    return new Promise((resolve, reject) => {
        const database = getDb();
        const transaction = database.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = (event) => {
            console.error(`Ошибка обновления данных в ${storeName}:`, event.target.error);
            reject(new Error(`Не удалось обновить данные: ${event.target.error.message}`));
        };
    });
}

// Удаление данных из хранилища
function deleteData(storeName, id) {
    return new Promise((resolve, reject) => {
        const database = getDb();
        const transaction = database.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = (event) => {
            console.error(`Ошибка удаления данных из ${storeName}:`, event.target.error);
            reject(new Error(`Не удалось удалить данные: ${event.target.error.message}`));
        };
    });
}

// Экспортируем функции и константы
export { openDatabase, addData, getData, getAllData, updateData, deleteData, OBJECT_STORES };