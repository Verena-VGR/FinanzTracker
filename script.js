/**
 * FinanzTracker - Standalone Logic
 */

// Constants
const CATEGORIES = [
    'Miete',
    'Strom / Gas',
    'Internet - Handy',
    'Versicherungen',
    'Mobilität - Auto',
    'Lebensmittel',
    'Drogerie & Beauty',
    'Shopping',
    'Freizeit',
    'Gastronomie',
    'Sonstiges',
    'Sparen'
];

const INCOME_CATEGORIES = ['Gehalt', 'Geschenke'];

const EXPENSE_COLORS = [
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', 
    '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308', 
    '#06b6d4', '#64748b', '#94a3b8'
];

const INCOME_COLORS = [
    '#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'
];

// State
let transactions = JSON.parse(localStorage.getItem('finanz_transactions')) || [];
let filterMonth = new Date().getMonth() + 1;
let filterYear = new Date().getFullYear();
let mainChart = null;

// DOM Elements
const form = document.getElementById('transactionForm');
const formContainer = document.getElementById('formContainer');
const toggleFormBtn = document.getElementById('toggleFormBtn');
const typeSelect = document.getElementById('type');
const categorySelect = document.getElementById('category');
const transactionList = document.getElementById('transactionList');
const incomeBreakdown = document.getElementById('incomeBreakdown');
const expenseBreakdown = document.getElementById('expenseBreakdown');
const filterMonthSelect = document.getElementById('filterMonth');
const filterYearSelect = document.getElementById('filterYear');

// Initialize
function init() {
    // Set default date
    document.getElementById('date').value = new Date().toISOString().split('T')[0];
    
    // Populate categories
    updateCategoryOptions();
    
    // Populate filters
    populateFilters();
    
    // Initial render
    render();
    
    // Lucide Icons
    lucide.createIcons();
}

function updateCategoryOptions() {
    const type = typeSelect.value;
    categorySelect.innerHTML = '';
    
    const cats = type === 'Einnahme' ? INCOME_CATEGORIES : CATEGORIES;
    cats.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });
}

function populateFilters() {
    // Months
    filterMonthSelect.innerHTML = '';
    for (let i = 1; i <= 12; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = new Date(2000, i - 1).toLocaleString('de-DE', { month: 'long' });
        if (i === filterMonth) option.selected = true;
        filterMonthSelect.appendChild(option);
    }
    
    // Years
    const years = [...new Set([new Date().getFullYear(), ...transactions.map(t => t.year)])].sort((a, b) => b - a);
    filterYearSelect.innerHTML = '';
    years.forEach(y => {
        const option = document.createElement('option');
        option.value = y;
        option.textContent = y;
        if (y === filterYear) option.selected = true;
        filterYearSelect.appendChild(option);
    });
}

function render() {
    const filtered = transactions
        .filter(t => t.month == filterMonth && t.year == filterYear)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Stats
    const income = filtered.filter(t => t.type === 'Einnahme').reduce((sum, t) => sum + t.amount, 0);
    const expenses = filtered.filter(t => t.type === 'Ausgabe').reduce((sum, t) => sum + t.amount, 0);
    const savings = filtered.filter(t => t.category === 'Sparen').reduce((sum, t) => sum + t.amount, 0);
    const realExpenses = expenses - savings;
    const balance = income - expenses;
    
    document.getElementById('statIncome').textContent = `+${income.toFixed(2)} €`;
    document.getElementById('statExpenses').textContent = `-${realExpenses.toFixed(2)} €`;
    document.getElementById('statSavings').textContent = `${savings.toFixed(2)} €`;
    document.getElementById('statBalance').textContent = `${balance >= 0 ? '+' : ''}${balance.toFixed(2)} €`;
    
    const balanceCard = document.getElementById('balanceCard');
    if (balance >= 0) {
        balanceCard.className = 'p-5 rounded-2xl border shadow-sm bg-emerald-50 border-emerald-100';
        document.getElementById('statBalance').className = 'text-2xl font-bold text-emerald-700';
    } else {
        balanceCard.className = 'p-5 rounded-2xl border shadow-sm bg-rose-50 border-rose-100';
        document.getElementById('statBalance').className = 'text-2xl font-bold text-rose-700';
    }
    
    // Breakdowns
    renderBreakdown(incomeBreakdown, INCOME_CATEGORIES, filtered, income, 'Einnahme');
    renderBreakdown(expenseBreakdown, CATEGORIES, filtered, expenses, 'Ausgabe');
    
    // List
    renderList(filtered);
    
    // Chart
    updateChart(filtered);
    
    // Save
    localStorage.setItem('finanz_transactions', JSON.stringify(transactions));
    
    // Refresh Icons
    lucide.createIcons();
}

function renderBreakdown(container, categories, filtered, total, type) {
    container.innerHTML = '';
    const totals = {};
    categories.forEach(cat => {
        totals[cat] = filtered.filter(t => t.category === cat).reduce((sum, t) => sum + t.amount, 0);
    });
    
    const activeCats = categories.filter(cat => totals[cat] > 0);
    
    if (activeCats.length === 0) {
        container.innerHTML = `<p class="text-sm text-slate-400 italic">Keine Einträge in diesem Zeitraum</p>`;
        return;
    }
    
    activeCats.forEach(cat => {
        const amount = totals[cat];
        const percentage = total > 0 ? (amount / total) * 100 : 0;
        const isSavings = cat === 'Sparen';
        
        const html = `
            <div class="space-y-1">
                <div class="flex justify-between text-sm">
                    <span class="font-medium ${isSavings ? 'text-indigo-600 font-bold' : 'text-slate-600'}">${cat}</span>
                    <span class="font-bold ${type === 'Einnahme' ? 'text-emerald-600' : (isSavings ? 'text-indigo-700' : 'text-slate-900')}">
                        ${type === 'Einnahme' ? '+' : '-'}${amount.toFixed(2)} €
                    </span>
                </div>
                <div class="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full rounded-full ${type === 'Einnahme' ? 'bg-emerald-500' : (isSavings ? 'bg-indigo-500' : 'bg-slate-400')}" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    });
}

function renderList(filtered) {
    transactionList.innerHTML = '';
    if (filtered.length === 0) {
        transactionList.innerHTML = `
            <div class="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
                <p class="text-slate-400 font-medium">Keine Einträge für diesen Zeitraum</p>
            </div>
        `;
        return;
    }
    
    filtered.forEach(t => {
        const isSavings = t.category === 'Sparen';
        const html = `
            <div class="transaction-item p-4 rounded-2xl border shadow-sm flex justify-between items-center group ${isSavings ? 'bg-indigo-50/50 border-indigo-100' : 'bg-white border-slate-200'}">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center ${t.type === 'Einnahme' ? 'bg-emerald-100 text-emerald-600' : (isSavings ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600')}">
                        <i data-lucide="${t.type === 'Einnahme' ? 'trending-up' : 'trending-down'}"></i>
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <p class="font-bold ${isSavings ? 'text-indigo-900' : 'text-slate-900'}">${t.description || t.category}</p>
                            ${t.isFixed ? '<span class="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded border border-slate-200">Fix</span>' : ''}
                        </div>
                        <div class="flex items-center gap-2 text-xs text-slate-400 font-medium">
                            <span>${new Date(t.date).toLocaleDateString('de-DE')}</span>
                            <span>•</span>
                            <span class="${isSavings ? 'text-indigo-400' : ''}">${t.category}</span>
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <p class="font-bold text-lg ${t.type === 'Einnahme' ? 'text-emerald-600' : (isSavings ? 'text-indigo-600' : 'text-slate-900')}">
                        ${t.type === 'Einnahme' ? '+' : '-'}${t.amount.toFixed(2)} €
                    </p>
                    <button onclick="deleteTransaction('${t.id}')" class="delete-btn p-2 text-slate-300 hover:text-rose-500 transition-colors">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `;
        transactionList.insertAdjacentHTML('beforeend', html);
    });
}

function updateChart(filtered) {
    const chartSection = document.getElementById('chartSection');
    const chartData = [];
    const colors = [];
    
    // Income
    INCOME_CATEGORIES.forEach((cat, i) => {
        const val = filtered.filter(t => t.category === cat).reduce((sum, t) => sum + t.amount, 0);
        if (val > 0) {
            chartData.push({ name: cat, value: val, type: 'Einnahme' });
            colors.push(INCOME_COLORS[i % INCOME_COLORS.length]);
        }
    });
    
    // Expenses
    CATEGORIES.forEach((cat, i) => {
        const val = filtered.filter(t => t.category === cat).reduce((sum, t) => sum + t.amount, 0);
        if (val > 0) {
            chartData.push({ name: cat, value: val, type: 'Ausgabe' });
            colors.push(EXPENSE_COLORS[i % EXPENSE_COLORS.length]);
        }
    });
    
    if (chartData.length === 0) {
        chartSection.classList.add('hidden');
        return;
    }
    
    chartSection.classList.remove('hidden');
    
    const ctx = document.getElementById('mainChart').getContext('2d');
    
    if (mainChart) mainChart.destroy();
    
    mainChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: chartData.map(d => `${d.name} (${d.type})`),
            datasets: [{
                data: chartData.map(d => d.value),
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: { size: 11 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.label}: ${context.raw.toFixed(2)} €`
                    }
                }
            },
            cutout: '70%'
        }
    });
}

// Actions
window.deleteTransaction = function(id) {
    transactions = transactions.filter(t => t.id !== id);
    render();
};

toggleFormBtn.addEventListener('click', () => {
    formContainer.classList.toggle('hidden');
    const icon = toggleFormBtn.querySelector('i');
    if (formContainer.classList.contains('hidden')) {
        icon.setAttribute('data-lucide', 'plus-circle');
    } else {
        icon.setAttribute('data-lucide', 'chevron-up');
    }
    lucide.createIcons();
});

typeSelect.addEventListener('change', updateCategoryOptions);

filterMonthSelect.addEventListener('change', (e) => {
    filterMonth = e.target.value;
    render();
});

filterYearSelect.addEventListener('change', (e) => {
    filterYear = e.target.value;
    render();
});

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const dateVal = document.getElementById('date').value;
    const dateObj = new Date(dateVal);
    
    const newTransaction = {
        id: crypto.randomUUID(),
        date: dateVal,
        type: typeSelect.value,
        category: categorySelect.value,
        description: document.getElementById('description').value,
        amount: parseFloat(document.getElementById('amount').value),
        month: dateObj.getMonth() + 1,
        year: dateObj.getFullYear(),
        isFixed: document.getElementById('isFixed').checked
    };
    
    transactions.unshift(newTransaction);
    
    if (newTransaction.isFixed) {
        const nextDate = new Date(dateObj);
        nextDate.setMonth(nextDate.getMonth() + 1);
        const nextTransaction = {
            ...newTransaction,
            id: crypto.randomUUID(),
            date: nextDate.toISOString().split('T')[0],
            month: nextDate.getMonth() + 1,
            year: nextDate.getFullYear()
        };
        transactions.unshift(nextTransaction);
    }
    
    form.reset();
    document.getElementById('date').value = new Date().toISOString().split('T')[0];
    updateCategoryOptions();
    formContainer.classList.add('hidden');
    toggleFormBtn.querySelector('i').setAttribute('data-lucide', 'plus-circle');
    
    populateFilters();
    render();
});

// Start
init();
