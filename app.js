
const colors = [
    "#766CE0",
    "#F29B72",
    "#65BFA5",
    "#E47C9A",
    "#E7BD62",
    "#65A5D8",
    "#A88BD8",
    "#7EBB78"
];

const defaultTabs = [
    { id: "daily", name: "Ежедневные покупки" },
    { id: "big", name: "Крупные покупки" }
];

let expenses = JSON.parse(localStorage.getItem("myExpenses")) || [];
let tabs = JSON.parse(localStorage.getItem("expenseTabs")) || defaultTabs;
let activeTab = "all";

const expenseForm = document.getElementById("expenseForm");
const expenseName = document.getElementById("expenseName");
const expenseAmount = document.getElementById("expenseAmount");
const expenseDate = document.getElementById("expenseDate");

const totalAmount = document.getElementById("totalAmount");
const expenseCount = document.getElementById("expenseCount");
const chartTotal = document.getElementById("chartTotal");
const chart = document.getElementById("chart");
const chartLegend = document.getElementById("chartLegend");
const tabsContainer = document.getElementById("tabsContainer");
const expensesList = document.getElementById("expensesList");
const addTabBtn = document.getElementById("addTabBtn");

// Получение одного и того же цвета для одинаковых продуктов
function getProductColor(name) {
    let hash = 0;
    const text = name.trim().toLowerCase();

    for (let i = 0; i < text.length; i++) {
        hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
}

// Сохранение данных
function saveData() {
    localStorage.setItem("myExpenses", JSON.stringify(expenses));
    localStorage.setItem("expenseTabs", JSON.stringify(tabs));
}

// Форматирование суммы
function formatMoney(amount) {
    return amount.toLocaleString("ru-RU") + " ₸";
}

// Получение расходов выбранной категории
function getFilteredExpenses() {
    if (activeTab === "all") {
        return expenses;
    }

    return expenses.filter(item => item.tabId === activeTab);
}

// Отображение вкладок
function renderTabs() {
    tabsContainer.innerHTML = "";

    const allTab = document.createElement("button");
    allTab.className = "tab" + (activeTab === "all" ? " active" : "");
    allTab.textContent = "Все расходы";

    allTab.addEventListener("click", () => {
        activeTab = "all";
        renderAll();
    });

    tabsContainer.appendChild(allTab);

    tabs.forEach(tab => {
        const button = document.createElement("button");

        button.className = "tab" + (activeTab === tab.id ? " active" : "");
        button.textContent = tab.name;

        button.addEventListener("click", () => {
            activeTab = tab.id;
            renderAll();
        });

        tabsContainer.appendChild(button);
    });
}

// Общая сумма
function renderSummary() {
    const filteredExpenses = getFilteredExpenses();

    const total = filteredExpenses.reduce(
        (sum, item) => sum + item.amount,
        0
    );

    totalAmount.textContent = formatMoney(total);
    chartTotal.textContent = formatMoney(total);
    expenseCount.textContent = filteredExpenses.length + " расходов";
}

// Список расходов
function renderExpenses() {
    const filteredExpenses = getFilteredExpenses();

    expensesList.innerHTML = "";

    if (filteredExpenses.length === 0) {
        expensesList.innerHTML =
            '<div class="empty-message">Пока расходов нет</div>';
        return;
    }

    const sortedExpenses = [...filteredExpenses].sort(
        (a, b) => b.date.localeCompare(a.date)
    );

    sortedExpenses.forEach(item => {
        const expenseItem = document.createElement("div");
        expenseItem.className = "expense-item";

        const info = document.createElement("div");
        info.className = "expense-info";

        const name = document.createElement("div");
        name.className = "expense-name";
        name.textContent = item.name;

        const date = document.createElement("div");
        date.className = "expense-date";
        date.textContent = item.date;

        info.appendChild(name);
        info.appendChild(date);

        const right = document.createElement("div");
        right.className = "expense-right";

        const amount = document.createElement("div");
        amount.className = "expense-amount";
        amount.textContent = formatMoney(item.amount);

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "×";
        deleteBtn.title = "Удалить расход";

        deleteBtn.addEventListener("click", () => {
            expenses = expenses.filter(
                expense => expense.id !== item.id
            );

            saveData();
            renderAll();
        });

        right.appendChild(amount);
        right.appendChild(deleteBtn);

        expenseItem.appendChild(info);
        expenseItem.appendChild(right);

        expensesList.appendChild(expenseItem);
    });
}

// Диаграмма расходов
function renderChart() {
    const filteredExpenses = getFilteredExpenses();

    chartLegend.innerHTML = "";

    // Объединяем суммы одинаковых продуктов для диаграммы
    const grouped = {};

    filteredExpenses.forEach(item => {
        const key = item.name.trim().toLowerCase();

        if (!grouped[key]) {
            grouped[key] = {
                name: item.name,
                amount: 0,
                color: getProductColor(item.name)
            };
        }

        grouped[key].amount += item.amount;
    });

    const chartItems = Object.values(grouped);

    const total = chartItems.reduce(
        (sum, item) => sum + item.amount,
        0
    );

    if (total === 0) {
        chart.style.background =
            "conic-gradient(#e9e9ef 0deg 360deg)";
        return;
    }

    let currentDegree = 0;
    const gradients = [];

    chartItems.forEach(item => {
        const degree = (item.amount / total) * 360;

        gradients.push(
            `${item.color} ${currentDegree}deg ${currentDegree + degree}deg`
        );

        currentDegree += degree;
    });

    chart.style.background =
        `conic-gradient(${gradients.join(", ")})`;

    chartItems.forEach(item => {
        const legendItem = document.createElement("div");
        legendItem.className = "legend-item";

        const color = document.createElement("span");
        color.className = "legend-color";
        color.style.background = item.color;

        const text = document.createElement("span");
        text.textContent =
            `${item.name} — ${formatMoney(item.amount)}`;

        legendItem.appendChild(color);
        legendItem.appendChild(text);

        chartLegend.appendChild(legendItem);
    });
}

// Обновление всего приложения
function renderAll() {
    renderTabs();
    renderSummary();
    renderExpenses();
    renderChart();
}

// Добавление расхода
expenseForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const name = expenseName.value.trim();
    const amount = Number(expenseAmount.value);
    const date = expenseDate.value;

    if (!name || !Number.isFinite(amount) || amount <= 0 || !date) {
        alert("Заполни все поля правильно");
        return;
    }

    if (activeTab === "all") {
        alert("Сначала выбери категорию для расхода");
        return;
    }

    const normalizedName = name.toLowerCase();

    // Ищем продукт с таким же названием,
    // в той же категории и в тот же день
    const existingExpense = expenses.find(item =>
        item.tabId === activeTab &&
        item.name.trim().toLowerCase() === normalizedName &&
        item.date === date
    );

    if (existingExpense) {
        existingExpense.amount += amount;
    } else {
        const newExpense = {
            id: Date.now(),
            name: name,
            amount: amount,
            date: date,
            tabId: activeTab,
            color: getProductColor(name)
        };

        expenses.push(newExpense);
    }

    saveData();

    expenseForm.reset();
    expenseDate.value = new Date().toLocaleDateString("en-CA");

    renderAll();
});

// Создание новой категории
addTabBtn.addEventListener("click", function() {
    const name = prompt("Введи название новой категории:");

    if (!name || !name.trim()) {
        return;
    }

    const cleanName = name.trim();

    const alreadyExists = tabs.some(
        tab => tab.name.toLowerCase() === cleanName.toLowerCase()
    );

    if (alreadyExists) {
        alert("Такая категория уже существует");
        return;
    }

    const newTab = {
        id: "tab-" + Date.now(),
        name: cleanName
    };

    tabs.push(newTab);
    activeTab = newTab.id;

    saveData();
    renderAll();
});

// Установка сегодняшней даты
expenseDate.value = new Date().toLocaleDateString("en-CA");

// Запуск приложения
saveData();
renderAll();
