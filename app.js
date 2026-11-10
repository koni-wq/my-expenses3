
// ===================================
// МОИ РАСХОДЫ — JAVASCRIPT
// ===================================

// Цвета для новых расходов
const colors = [
    "#7567E8",
    "#FF8B8B",
    "#39BFA0",
    "#F4B942",
    "#55A6E8",
    "#D77AE8",
    "#F28B50",
    "#4ECDC4",
    "#9B8AFB",
    "#E76F9A",
    "#83B96C",
    "#E6A23C"
];

// Начальные вкладки
const defaultTabs = [
    { id: "daily", name: "Ежедневные покупки" },
    { id: "big", name: "Крупные покупки" }
];

// Загружаем сохранённые данные
function loadData(key, fallback) {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : fallback;
    } catch {
        return fallback;
    }
}

let tabs = loadData("expenseTabs", defaultTabs);
let expenses = loadData("myExpenses", []);
let activeTab = "all";

// Сохраняем данные
function saveData() {
    localStorage.setItem("expenseTabs", JSON.stringify(tabs));
    localStorage.setItem("myExpenses", JSON.stringify(expenses));
}

// Получаем HTML-элементы
const tabsContainer = document.getElementById("tabs");
const expenseForm = document.getElementById("expenseForm");
const expensesList = document.getElementById("expensesList");
const tabForm = document.getElementById("tabForm");

// Форматирование суммы
function formatMoney(value) {
    return new Intl.NumberFormat("ru-RU", {
        maximumFractionDigits: 2
    }).format(value) + " ₸";
}

// Получаем случайный цвет
function getRandomColor() {
    const previousColor = expenses.length
        ? expenses[expenses.length - 1].color
        : null;

    let availableColors = colors.filter(
        color => color !== previousColor
    );

    return availableColors[
        Math.floor(Math.random() * availableColors.length)
    ];
}

// ===================================
// СОЗДАНИЕ ВКЛАДОК
// ===================================

function renderTabs() {
    tabsContainer.innerHTML = "";

    const allButton = document.createElement("button");
    allButton.className =
        "tab" + (activeTab === "all" ? " active" : "");

    allButton.textContent = "Все расходы";

    allButton.addEventListener("click", () => {
        activeTab = "all";
        renderAll();
    });

    tabsContainer.appendChild(allButton);

    tabs.forEach(tab => {
        const button = document.createElement("button");

        button.className =
            "tab" + (activeTab === tab.id ? " active" : "");

        button.textContent = tab.name;

        button.addEventListener("click", () => {
            activeTab = tab.id;
            renderAll();
        });

        tabsContainer.appendChild(button);
    });
}

// Показать форму новой вкладки
document.getElementById("showTabForm").addEventListener(
    "click",
    () => {
        tabForm.classList.toggle("hidden");
        document.getElementById("tabName").focus();
    }
);

// Создать новую вкладку
tabForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const name = document.getElementById("tabName")
        .value.trim();

    if (!name) return;

    const newTab = {
        id: "tab_" + Date.now(),
        name: name
    };

    tabs.push(newTab);

    activeTab = newTab.id;

    saveData();

    tabForm.reset();
    tabForm.classList.add("hidden");

    renderAll();
});

// ===================================
// ДОБАВЛЕНИЕ РАСХОДОВ
// ===================================

document.getElementById("expenseDate").value =
    new Date().toLocaleDateString("en-CA");

expenseForm.addEventListener("submit", function(event) {
    event.preventDefault();

    if (activeTab === "all") {
        alert("Сначала выбери категорию для покупки.");
        return;
    }

    const name = document.getElementById("expenseName")
        .value.trim();

    const amount = Number(
        document.getElementById("expenseAmount").value
    );

    const date = document.getElementById("expenseDate").value;

    if (!name || !Number.isFinite(amount) || amount <= 0 || !date) {
        alert("Проверь правильность введённых данных.");
        return;
    }

    
// Проверяем, есть ли такая покупка в этой вкладке
const existingExpense = expenses.find(item =>
    item.tabId === activeTab &&
    item.name.trim().toLowerCase() === name.toLowerCase()
);

if (existingExpense) {

    // Если покупка уже существует — прибавляем сумму
    existingExpense.amount += amount;

    // Обновляем дату последней покупки
    existingExpense.date = date;

} else {

    // Если покупки ещё нет — создаём новую
    const newExpense = {
        id: Date.now(),
        name: name,
        amount: amount,
        date: date,
        tabId: activeTab,
        color: getRandomColor()
    };

    expenses.push(newExpense);
}


    saveData();

    expenseForm.reset();

    document.getElementById("expenseDate").value =
        new Date().toLocaleDateString("en-CA");

    renderAll();
});

// ===================================
// ОТОБРАЖЕНИЕ РАСХОДОВ
// ===================================

function renderExpenses() {
    expensesList.innerHTML = "";

    let filteredExpenses = activeTab === "all"
        ? expenses
        : expenses.filter(item => item.tabId === activeTab);

    const title = activeTab === "all"
        ? "Все расходы"
        : tabs.find(tab => tab.id === activeTab)?.name
          || "Мои расходы";

    document.getElementById("expensesTitle").textContent = title;

    if (filteredExpenses.length === 0) {
        expensesList.innerHTML =
            '<p class="empty-text">Здесь пока ничего нет. Добавь первую покупку!</p>';
        return;
    }

    // Последние покупки показываем первыми
    [...filteredExpenses].reverse().forEach(item => {
        const row = document.createElement("div");
        row.className = "expense-item";

        const left = document.createElement("div");
        left.className = "expense-left";

        const color = document.createElement("div");
        color.className = "expense-color";
        color.style.background = item.color;

        const info = document.createElement("div");
        info.className = "expense-info";

        const name = document.createElement("strong");
        name.textContent = item.name;

        const date = document.createElement("span");
        date.textContent = new Date(
            item.date + "T00:00:00"
        ).toLocaleDateString("ru-RU");

        info.append(name, date);
        left.append(color, info);

        const right = document.createElement("div");
        right.className = "expense-right";

        const amount = document.createElement("span");
        amount.className = "expense-amount";
        amount.textContent = formatMoney(item.amount);

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-button";
        deleteButton.textContent = "×";
        deleteButton.title = "Удалить расход";

        deleteButton.addEventListener("click", () => {
            if (confirm("Удалить этот расход?")) {
                expenses = expenses.filter(
                    expense => expense.id !== item.id
                );

                saveData();
                renderAll();
            }
        });

        right.append(amount, deleteButton);
        row.append(left, right);

        expensesList.appendChild(row);
    });
}

// ===================================
// КОЛЬЦЕВАЯ ДИАГРАММА
// ===================================

function renderChart() {
    const filteredExpenses = activeTab === "all"
    ? expenses
    : expenses.filter(item => item.tabId === activeTab);

const total = filteredExpenses.reduce(
    (sum, item) => sum + item.amount,
    0
);

    const chart = document.getElementById("donutChart");
    const legend = document.getElementById("legend");

    document.getElementById("chartTotal").textContent =
        formatMoney(total);

    if (filteredExpenses.length === 0 || total === 0) {
        chart.style.background =
            "conic-gradient(#e9eaf0 0deg 360deg)";

        legend.innerHTML =
            '<p class="empty-text">Пока нет расходов</p>';

        return;
    }

    // Считаем долю каждого расхода
    let currentAngle = 0;

    const gradientParts = [];

    expenses.forEach(item => {
        const percentage = item.amount / total * 360;

        const start = currentAngle;
        const end = currentAngle + percentage;

        gradientParts.push(
            `${item.color} ${start}deg ${end}deg`
        );

        currentAngle = end;
    });

    chart.style.background =
        `conic-gradient(${gradientParts.join(", ")})`;

    // Создаём легенду
    legend.innerHTML = "";

    expenses.forEach(item => {
        const line = document.createElement("div");
        line.className = "legend-item";

        const left = document.createElement("div");
        left.className = "legend-name";

        const dot = document.createElement("span");
        dot.className = "legend-color";
        dot.style.background = item.color;

        const name = document.createElement("span");
        name.textContent = item.name;

        const amount = document.createElement("strong");
        amount.textContent = formatMoney(item.amount);

        left.append(dot, name);
        line.append(left, amount);

        legend.appendChild(line);
    });
}

// ===================================
// ОБЩАЯ СТАТИСТИКА
// ===================================

function renderSummary() {
    const total = expenses.reduce(
        (sum, item) => sum + item.amount,
        0
    );

    document.getElementById("totalAmount").textContent =
        formatMoney(total);

    document.getElementById("expenseCount").textContent =
        expenses.length;
}

// ===================================
// ОБНОВЛЕНИЕ ПРИЛОЖЕНИЯ
// ===================================

function renderAll() {
    renderTabs();
    renderExpenses();
    renderChart();
    renderSummary();
}

// Первый запуск
renderAll();
