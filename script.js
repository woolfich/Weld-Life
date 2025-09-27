import { openDatabase, addData, getAllData, updateData, deleteData, getData, OBJECT_STORES } from './indexeddb.js';

let db; // Глобальная переменная для IndexedDB

const appDiv = document.getElementById('app');

// Функция для отображения главного экрана
async function renderMainScreen() {
    appDiv.innerHTML = `
    <div class="main-screen">
        <h2>Список сварщиков</h2>
        <div class="add-welder-section">
            <input type="text" id="newWelderName" placeholder="Введите фамилию сварщика">
            <button id="addWelderBtn">Добавить сварщика</button>
        </div>
        <div id="welderList"></div>
        <div class="navigation-buttons">
            <button id="goToDbBtn">База данных</button>
            <button id="goToSummaryBtn">Сводка</button>
        </div>
    </div>
    `;
    const welderListDiv = document.getElementById('welderList');
    const addWelderBtn = document.getElementById('addWelderBtn');
    const newWelderNameInput = document.getElementById('newWelderName');
    const goToDbBtn = document.getElementById('goToDbBtn');
    const goToSummaryBtn = document.getElementById('goToSummaryBtn');

    // Загрузка и отображение сварщиков
    await loadWelders();

    addWelderBtn.addEventListener('click', async () => {
        const welderName = newWelderNameInput.value.trim();
        if (welderName) {
            await addWelder(welderName);
            newWelderNameInput.value = ''; // Очищаем поле ввода
            await loadWelders(); // Обновляем список сварщиков
        } else {
            alert('Пожалуйста, введите фамилию сварщика.');
        }
    });

    goToDbBtn.addEventListener('click', () => {
        renderScreen('database');
    });

    goToSummaryBtn.addEventListener('click', () => {
        renderScreen('summary');
    });
}

// Функция для отображения экрана Базы данных
async function renderDatabaseScreen() {
    appDiv.innerHTML = `
    <div class="database-screen">
        <h2>База данных изделий</h2>
        <div class="add-product-section">
            <input type="text" id="newProductArticle" placeholder="Введите артикул изделия">
            <button id="addProductBtn">Добавить изделие</button>
        </div>
        <div id="productList"></div>
        <button id="backToMainBtn">На главный экран</button>
    </div>
    `;
    const newProductArticleInput = document.getElementById('newProductArticle');
    const addProductBtn = document.getElementById('addProductBtn');
    const productListDiv = document.getElementById('productList');

    await loadProducts();

    addProductBtn.addEventListener('click', async () => {
        const article = newProductArticleInput.value.trim();
        if (article) {
            await addProduct(article);
            newProductArticleInput.value = '';
            await loadProducts();
        } else {
            alert('Пожалуйста, введите артикул изделия.');
        }
    });

    document.getElementById('backToMainBtn').addEventListener('click', () => {
        renderScreen('main');
    });
}

// Функция для отображения экрана Сводки
async function renderSummaryScreen() {
    appDiv.innerHTML = `
    <div class="summary-screen">
        <h2>Сводка по изделиям</h2>
        <div id="overallSummaryList"></div>
        <button id="backToMainBtn">На главный экран</button>
    </div>
    `;
    const overallSummaryListDiv = document.getElementById('overallSummaryList');
    await loadOverallSummary();

    document.getElementById('backToMainBtn').addEventListener('click', () => {
        renderScreen('main');
    });
}

// Функция для отображения карточки сварщика
async function renderWelderCardScreen(welderId) {
    const welder = await getData(OBJECT_STORES.WELDERS, welderId);
    if (!welder) {
        console.error('Сварщик не найден:', welderId);
        renderScreen('main');
        return;
    }

    appDiv.innerHTML = `
    <div class="welder-card-screen">
        <h2>Карточка сварщика: ${welder.name}</h2>
        <div class="input-record-section">
            <input type="text" id="productArticleInput" placeholder="Артикул изделия">
            <input type="number" id="productQuantityInput" placeholder="Количество" step="0.1">
            <button id="addRecordBtn">Добавить запись</button>
        </div>
        <h3>Личная сводка:</h3>
        <div id="welderRecordsList"></div>
        <button id="backToMainBtn">На главный экран</button>
    </div>
    `;

    // Проверяем наличие элементов перед привязкой обработчиков
    const productArticleInput = document.getElementById('productArticleInput');
    const productQuantityInput = document.getElementById('productQuantityInput');
    const addRecordBtn = document.getElementById('addRecordBtn');
    const backToMainBtn = document.getElementById('backToMainBtn');

    if (!addRecordBtn || !backToMainBtn) {
        console.error('Ошибка: Не найдены кнопки addRecordBtn или backToMainBtn');
        return;
    }

    // Загрузка записей сварщика
    await loadWelderRecords(welderId);

    // Привязка обработчика для кнопки "Добавить"
    addRecordBtn.addEventListener('click', async () => {
        const article = productArticleInput.value.trim();
        const quantity = parseFloat(productQuantityInput.value);
        if (article && !isNaN(quantity) && quantity > 0) {
            await addProductRecord(welderId, article, quantity);
            productArticleInput.value = '';
            productQuantityInput.value = '';
        } else {
            alert('Пожалуйста, введите корректные артикул и количество.');
        }
    });

    // Привязка обработчика для кнопки "На главный экран"
    backToMainBtn.addEventListener('click', () => {
        renderScreen('main');
    });

    // Автодополнение для артикула
    productArticleInput.addEventListener('input', async () => {
        const query = productArticleInput.value.trim().toLowerCase();
        if (query.length > 0) {
            const products = await getAllData(OBJECT_STORES.PRODUCTS);
            const suggestions = products.filter(p => p.article.toLowerCase().includes(query));
            console.log('Подсказки:', suggestions.map(s => s.article));
        }
    });
}

// Функция для переключения экранов
async function renderScreen(screenName, data = null) {
    switch (screenName) {
        case 'main':
            await renderMainScreen();
            break;
        case 'database':
            await renderDatabaseScreen();
            break;
        case 'summary':
            await renderSummaryScreen();
            break;
        case 'welderCard':
            if (data && data.welderId) {
                await renderWelderCardScreen(data.welderId);
            } else {
                console.error('Не указан ID сварщика для карточки.');
                await renderMainScreen();
            }
            break;
        default:
            console.error('Неизвестный экран:', screenName);
            await renderMainScreen();
    }
}

// Функция для добавления нового сварщика в IndexedDB
async function addWelder(name) {
    try {
        const id = await addData(OBJECT_STORES.WELDERS, { name: name });
        console.log(`Сварщик ${name} добавлен с ID: ${id}`);
    } catch (error) {
        console.error('Ошибка при добавлении сварщика:', error);
        alert('Не удалось добавить сварщика. Пожалуйста, попробуйте еще раз.');
    }
}

// Функция для загрузки и отображения списка сварщиков
async function loadWelders() {
    const welderListDiv = document.getElementById('welderList');
    welderListDiv.innerHTML = ''; // Очищаем список перед загрузкой
    const welders = await getAllData(OBJECT_STORES.WELDERS);
    if (welders.length === 0) {
        welderListDiv.innerHTML = '<p>Сварщики не найдены. Добавьте первого сварщика!</p>';
    } else {
        welders.forEach(welder => {
            const welderItem = document.createElement('button');
            welderItem.className = 'welder-item';
            welderItem.textContent = welder.name;
            welderItem.dataset.id = welder.id; // Сохраняем ID сварщика
            welderItem.addEventListener('click', () => {
                renderScreen('welderCard', { welderId: welder.id });
            });
            welderListDiv.appendChild(welderItem);
        });
    }
}

// Функция для добавления нового изделия в IndexedDB
async function addProduct(article) {
    try {
        // Проверяем, существует ли уже такой артикул
        const existingProducts = await getAllData(OBJECT_STORES.PRODUCTS);
        const productExists = existingProducts.some(p => p.article.toLowerCase() === article.toLowerCase());
        if (productExists) {
            alert(`Изделие с артикулом "${article}" уже существует.`);
            return;
        }
        const id = await addData(OBJECT_STORES.PRODUCTS, { article: article });
        console.log(`Изделие ${article} добавлено с ID: ${id}`);
        alert(`Изделие "${article}" успешно добавлено.`);
    } catch (error) {
        console.error('Ошибка при добавлении изделия:', error);
        alert('Не удалось добавить изделие. Пожалуйста, попробуйте еще раз.');
    }
}

// Функция для загрузки и отображения списка изделий
async function loadProducts() {
    const productListDiv = document.getElementById('productList');
    productListDiv.innerHTML = ''; // Очищаем список перед загрузкой
    const products = await getAllData(OBJECT_STORES.PRODUCTS);
    if (products.length === 0) {
        productListDiv.innerHTML = '<p>Изделия не найдены. Добавьте первое изделие!</p>';
    } else {
        products.forEach(product => {
            const productItem = document.createElement('div');
            productItem.className = 'product-item';
            productItem.textContent = product.article;
            productItem.dataset.id = product.id; // Сохраняем ID изделия
            productListDiv.appendChild(productItem);
        });
    }
}

// Функция для добавления записи о работе сварщика
async function addProductRecord(welderId, article, quantity) {
    try {
        const now = new Date();
        const dateString = now.toISOString().split("T")[0]; // "2025-09-26"
        const timeString = now.toTimeString().split(" ")[0]; // "10:30:00"
        const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`; // "2025-09"

        // Используем транзакцию для атомарности операций
        const transaction = db.transaction([OBJECT_STORES.WELDER_RECORDS, OBJECT_STORES.OPERATION_HISTORY], "readwrite");
        const welderRecordsStore = transaction.objectStore(OBJECT_STORES.WELDER_RECORDS);
        const operationHistoryStore = transaction.objectStore(OBJECT_STORES.OPERATION_HISTORY);
        const index = welderRecordsStore.index("byWelderArticleMonth");

        // Пытаемся найти существующую запись
        const getRequest = index.get([welderId, article, monthYear]);

        getRequest.onsuccess = async () => {
            let existingRecord = getRequest.result;
            let oldQuantity = 0;

            if (existingRecord) {
                oldQuantity = existingRecord.quantity;
                existingRecord.quantity += quantity;
                existingRecord.lastUpdated = now.toISOString();
                welderRecordsStore.put(existingRecord);
            } else {
                welderRecordsStore.add({
                    welderId: welderId,
                    article: article,
                    quantity: quantity,
                    monthYear: monthYear,
                    lastUpdated: now.toISOString()
                });
            }

            // Добавляем запись в историю операций
            operationHistoryStore.add({
                welderId: welderId,
                article: article,
                quantity: quantity,
                oldQuantity: oldQuantity,
                newQuantity: oldQuantity + quantity,
                date: dateString,
                time: timeString,
                type: existingRecord ? "add" : "initial_add",
                monthYear: monthYear
            });

            transaction.oncomplete = () => {
                console.log("Запись и история операций успешно добавлены/обновлены.");
                alert("Запись успешно добавлена/обновлена!");
                renderScreen("welderCard", { welderId: welderId });
            };

            transaction.onerror = (event) => {
                console.error("Ошибка транзакции:", event.target.error);
                alert("Произошла ошибка при сохранении данных.");
            };
        };

        getRequest.onerror = (event) => {
            console.error("Ошибка получения записи по индексу:", event.target.error);
            alert("Не удалось найти или создать запись.");
        };
    } catch (error) {
        console.error("Ошибка при добавлении/обновлении записи:", error);
        alert("Произошла критическая ошибка.");
    }
}

// Функция для редактирования количества
async function editQuantity(record, welderId) {
    const newQuantity = prompt(`Введите новое количество для ${record.article} (текущее: ${record.quantity}):`);
    if (newQuantity === null || newQuantity.trim() === '') return;

    const quantity = parseFloat(newQuantity);
    if (isNaN(quantity) || quantity < 0) {
        alert('Пожалуйста, введите корректное количество.');
        return;
    }

    try {
        const now = new Date();
        const dateString = now.toISOString().split("T")[0];
        const timeString = now.toTimeString().split(" ")[0];

        const transaction = db.transaction([OBJECT_STORES.WELDER_RECORDS, OBJECT_STORES.OPERATION_HISTORY], "readwrite");
        const welderRecordsStore = transaction.objectStore(OBJECT_STORES.WELDER_RECORDS);
        const operationHistoryStore = transaction.objectStore(OBJECT_STORES.OPERATION_HISTORY);

        const existingRecord = await new Promise((resolve, reject) => {
            const request = welderRecordsStore.get(record.id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        if (existingRecord) {
            const oldQuantity = existingRecord.quantity;
            existingRecord.quantity = quantity;
            existingRecord.lastUpdated = now.toISOString();
            welderRecordsStore.put(existingRecord);

            operationHistoryStore.add({
                welderId: welderId,
                article: record.article,
                quantity: quantity,
                oldQuantity: oldQuantity,
                newQuantity: quantity,
                date: dateString,
                time: timeString,
                type: "edit",
                monthYear: record.monthYear
            });

            transaction.oncomplete = () => {
                console.log("Количество успешно обновлено.");
                alert("Количество успешно обновлено!");
                renderScreen("welderCard", { welderId: welderId });
            };

            transaction.onerror = (event) => {
                console.error("Ошибка транзакции:", event.target.error);
                alert("Произошла ошибка при обновлении количества.");
            };
        }
    } catch (error) {
        console.error("Ошибка при редактировании количества:", error);
        alert("Произошла критическая ошибка.");
    }
}

// Функция для загрузки и отображения личной сводки сварщика
async function loadWelderRecords(welderId) {
    const welderRecordsListDiv = document.getElementById("welderRecordsList");
    welderRecordsListDiv.innerHTML = "";

    const allRecords = await getAllData(OBJECT_STORES.WELDER_RECORDS);
    const welderRecords = allRecords.filter(record => record.welderId === welderId);

    if (welderRecords.length === 0) {
        welderRecordsListDiv.innerHTML = "<p>Записей о работе пока нет.</p>";
        return;
    }

    const recordsByMonth = welderRecords.reduce((acc, record) => {
        const monthYear = record.monthYear;
        if (!acc[monthYear]) {
            acc[monthYear] = [];
        }
        acc[monthYear].push(record);
        return acc;
    }, {});

    const sortedMonths = Object.keys(recordsByMonth).sort().reverse();

    sortedMonths.forEach(monthYear => {
        const monthHeader = document.createElement("h3");
        monthHeader.className = "month-header";
        const [year, month] = monthYear.split("-");
        const monthName = new Date(year, parseInt(month) - 1, 1).toLocaleString("ru-RU", { month: "long", year: "numeric" });
        monthHeader.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);
        welderRecordsListDiv.appendChild(monthHeader);

        const recordsInMonth = recordsByMonth[monthYear].sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));

        recordsInMonth.forEach(record => {
            const recordItem = document.createElement("div");
            recordItem.className = "welder-record-item";
            recordItem.textContent = `${record.article}: ${record.quantity} шт`;

            let longPressTimer;
            let isLongPress = false;

            const startPress = (e) => {
                isLongPress = false;
                longPressTimer = setTimeout(() => {
                    isLongPress = true;
                    showContextMenu(record, welderId);
                }, 500);
            };

            const endPress = (e) => {
                clearTimeout(longPressTimer);
                if (!isLongPress) {
                    const productArticleInput = document.getElementById("productArticleInput");
                    if (productArticleInput) {
                        productArticleInput.value = record.article;
                        const productQuantityInput = document.getElementById("productQuantityInput");
                        if (productQuantityInput) {
                            productQuantityInput.focus();
                        }
                    }
                }
            };

            recordItem.addEventListener("mousedown", startPress);
            recordItem.addEventListener("mouseup", endPress);
            recordItem.addEventListener("mouseleave", () => clearTimeout(longPressTimer));
            recordItem.addEventListener("touchstart", startPress);
            recordItem.addEventListener("touchend", endPress);

            welderRecordsListDiv.appendChild(recordItem);
        });
    });
}

// Функция для показа контекстного меню
function showContextMenu(record, welderId) {
    const modal = document.createElement("div");
    modal.className = "context-modal";
    modal.innerHTML = `
        <div class="context-modal-content">
            <h3>Артикул: ${record.article}</h3>
            <p>Текущее количество: ${record.quantity} шт</p>
            <div class="context-buttons">
                <button id="editQuantityBtn">Редактировать количество</button>
                <button id="showHistoryBtn">История за месяц</button>
                <button id="closeModalBtn">Закрыть</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("editQuantityBtn").addEventListener("click", () => {
        editQuantity(record, welderId);
        document.body.removeChild(modal);
    });

    document.getElementById("showHistoryBtn").addEventListener("click", () => {
        showArticleHistory(record.article, welderId);
        document.body.removeChild(modal);
    });

    document.getElementById("closeModalBtn").addEventListener("click", () => {
        document.body.removeChild(modal);
    });
}

// Функция для показа истории изменений артикула
async function showArticleHistory(article, welderId) {
    const allOperations = await getAllData(OBJECT_STORES.OPERATION_HISTORY);
    const articleHistory = allOperations.filter(op => op.welderId === welderId && op.article.toLowerCase() === article.toLowerCase());

    if (articleHistory.length === 0) {
        alert(`Истории изменений для артикула ${article} пока нет.`);
        return;
    }

    let historyText = `История для артикула ${article}:\n\n`;
    articleHistory.sort((a, b) => new Date(a.date + " " + a.time) - new Date(b.date + " " + b.time));

    articleHistory.forEach(op => {
        if (op.type === 'add' || op.type === 'initial_add') {
            historyText += `${op.date} ${op.time}: Добавлено ${op.quantity} шт\n`;
        } else if (op.type === 'edit') {
            historyText += `${op.date} ${op.time}: Изменено с ${op.oldQuantity} на ${op.newQuantity} шт\n`;
        }
    });

    alert(historyText);
}

// Функция для загрузки и отображения общей сводки по изделиям
async function loadOverallSummary() {
    const overallSummaryListDiv = document.getElementById('overallSummaryList');
    overallSummaryListDiv.innerHTML = ''; // Очищаем список перед загрузкой
    const allRecords = await getAllData(OBJECT_STORES.WELDER_RECORDS);

    if (allRecords.length === 0) {
        overallSummaryListDiv.innerHTML = '<p>Сводка пока пуста. Добавьте записи о работе сварщиков.</p>';
        return;
    }

    // Группируем записи по месяцам
    const recordsByMonth = allRecords.reduce((acc, record) => {
        const monthYear = record.monthYear;
        if (!acc[monthYear]) {
            acc[monthYear] = {};
        }
        const article = record.article.toLowerCase();
        if (acc[monthYear][article]) {
            acc[monthYear][article] += record.quantity;
        } else {
            acc[monthYear][article] = record.quantity;
        }
        return acc;
    }, {});

    // Сортируем месяцы в обратном хронологическом порядке
    const sortedMonths = Object.keys(recordsByMonth).sort().reverse();

    // Отображаем блоки для каждого месяца
    sortedMonths.forEach(monthYear => {
        const monthHeader = document.createElement('h3');
        monthHeader.className = 'month-header';
        const [year, month] = monthYear.split('-');
        const monthName = new Date(year, parseInt(month) - 1, 1).toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
        monthHeader.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);
        overallSummaryListDiv.appendChild(monthHeader);

        // Сортируем артикулы внутри месяца
        const articles = Object.keys(recordsByMonth[monthYear]).sort();
        articles.forEach(article => {
            const summaryItem = document.createElement('div');
            summaryItem.className = 'summary-item';
            summaryItem.textContent = `${article}: ${recordsByMonth[monthYear][article].toFixed(1)} шт`;
            overallSummaryListDiv.appendChild(summaryItem);
        });
    });
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', async () => {
    try {
        db = await openDatabase();
        console.log('IndexedDB успешно открыта и готова к работе.');
        await renderScreen('main');
    } catch (error) {
        console.error('Ошибка при открытии IndexedDB:', error);
    }
});