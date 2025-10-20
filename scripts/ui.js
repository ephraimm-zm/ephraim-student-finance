// scripts/ui.js
import { state, addTransaction, editTransaction, deleteTransaction } from './state.js';
import { validateTransaction } from './validators.js';
import { filterTransactions, highlight } from './search.js';

const form = document.getElementById('transaction-form');
const tbody = document.getElementById('records-body');
const searchInput = document.getElementById('search');
const totalRecordsEl = document.getElementById('total-records');
const totalAmountEl = document.getElementById('total-amount');
const topCategoryEl = document.getElementById('top-category');
const capRemainingEl = document.getElementById('cap-remaining');
const capInput = document.getElementById('cap');
const currencySelect = document.getElementById('currency');

let editingId = null;

// --- Render Transactions Table ---
export const renderTransactions = (pattern = '') => {
  const list = pattern ? filterTransactions(pattern) : state.transactions;
  tbody.innerHTML = '';

  list.forEach(tx => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${highlight(tx.date, compileRegex(pattern))}</td>
      <td>${highlight(tx.description, compileRegex(pattern))}</td>
      <td>${highlight(tx.category, compileRegex(pattern))}</td>
      <td>${highlight(tx.amount.toFixed(2), compileRegex(pattern))}</td>
      <td>
        <button class="edit" data-id="${tx.id}">Edit</button>
        <button class="delete" data-id="${tx.id}">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
};

// --- Render Dashboard Stats ---
export const renderStats = () => {
  const total = state.transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  totalRecordsEl.textContent = state.transactions.length;
  totalAmountEl.textContent = total.toFixed(2);

  // Top category
  const counts = {};
  state.transactions.forEach(t => counts[t.category] = (counts[t.category] || 0) + 1);
  const top = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, 'N/A');
  topCategoryEl.textContent = top;

  // Cap remaining
  const cap = Number(capInput.value) || 0;
  const remaining = cap - total;
  capRemainingEl.textContent = remaining.toFixed(2);
};

// --- Form Submit ---
form.addEventListener('submit', e => {
  e.preventDefault();

  const data = {
    description: form.description.value.trim(),
    amount: form.amount.value,
    date: form.date.value,
    category: form.category.value
  };

  const errors = validateTransaction(data);
  // Clear previous errors
  form.querySelectorAll('.error').forEach(el => el.textContent = '');
  if (Object.keys(errors).length > 0) {
    Object.keys(errors).forEach(key => {
      const errorEl = form.querySelector(`.error-${key}`);
      if (errorEl) errorEl.textContent = errors[key];
    });
    return;
  }

  if (editingId) {
    editTransaction(editingId, data);
    editingId = null;
  } else {
    addTransaction(data);
  }

  form.reset();
  renderTransactions();
  renderStats();
});

// --- Edit / Delete Buttons ---
tbody.addEventListener('click', e => {
  if (e.target.classList.contains('edit')) {
    const id = e.target.dataset.id;
    const tx = state.transactions.find(t => t.id === id);
    if (!tx) return;
    editingId = id;
    form.description.value = tx.description;
    form.amount.value = tx.amount;
    form.date.value = tx.date;
    form.category.value = tx.category;
  } else if (e.target.classList.contains('delete')) {
    const id = e.target.dataset.id;
    if (confirm('Delete this transaction?')) {
      deleteTransaction(id);
      renderTransactions();
      renderStats();
    }
  }
});

// --- Search ---
searchInput.addEventListener('input', e => {
  renderTransactions(e.target.value);
});

// --- Settings ---
document.getElementById('settings-form').addEventListener('submit', e => {
  e.preventDefault();
  state.settings.cap = Number(capInput.value) || 0;
  state.settings.currency = currencySelect.value;
  renderStats();
});

// --- Import / Export JSON ---
document.getElementById('export-json').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state.transactions, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'transactions.json';
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('import-json').addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = e => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        if (Array.isArray(imported)) {
          imported.forEach(tx => {
            if (!tx.id) tx.id = 'txn_' + Date.now() + Math.random();
            state.transactions.push(tx);
          });
          renderTransactions();
          renderStats();
        } else {
          alert('Invalid JSON format.');
        }
      } catch {
        alert('Error parsing JSON.');
      }
    };
    reader.readAsText(file);
  };
  input.click();
});

// --- Initial render ---
renderTransactions();
renderStats();
