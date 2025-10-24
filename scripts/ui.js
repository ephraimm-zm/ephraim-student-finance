import { transactions, updateState, settings } from './state.js';
import { validators } from './validators.js';
import { compileRegex, highlight } from './search.js';
import { save as saveToStorage, load as loadFromStorage } from './storage.js';

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const form = document.getElementById('transaction-form');
  const tbody = document.getElementById('records-body');
  const totalRecords = document.getElementById('total-records');
  const totalAmount = document.getElementById('total-amount');
  const topCategory = document.getElementById('top-category');
  const capRemaining = document.getElementById('cap-remaining');
  const searchInput = document.getElementById('search');

  const settingsForm = document.getElementById('settings-form');
  const importBtn = document.getElementById('import-json');
  const exportBtn = document.getElementById('export-json');

  // Load saved data
  const savedData = loadFromStorage();
  if (savedData.length) {
    transactions.push(...savedData);
  }

  // Render function
  const render = () => {
    tbody.innerHTML = '';
    let sum = 0;
    let categoryCount = {};

    transactions.forEach(tx => {
      sum += parseFloat(tx.amount);
      categoryCount[tx.category] = (categoryCount[tx.category] || 0) + 1;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${tx.date}</td>
        <td>${tx.description}</td>
        <td>${tx.category}</td>
        <td>${parseFloat(tx.amount).toFixed(2)}</td>
        <td>
          <button class="edit" data-id="${tx.id}">Edit</button>
          <button class="delete" data-id="${tx.id}">Delete</button>
        </td>`;
      tbody.appendChild(tr);
    });

    totalRecords.textContent = transactions.length;
    totalAmount.textContent = sum.toFixed(2);
    topCategory.textContent = Object.keys(categoryCount)
      .sort((a, b) => categoryCount[b] - categoryCount[a])[0] || 'N/A';
    capRemaining.textContent = (settings.cap - sum).toFixed(2);

    updateState();
    saveToStorage(transactions);
  };

  render();
  const ctx = document.getElementById('trend-chart').getContext('2d');
let trendChart = null;

const updateChart = () => {
  // Get last 7 days
  const last7Days = Array.from({length:7}, (_,i)=>{
    const d = new Date();
    d.setDate(d.getDate() - (6-i));
    return d.toISOString().split('T')[0];
  });

  const amounts = last7Days.map(day=>{
    return transactions
      .filter(tx => tx.date === day)
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
  });

  if(trendChart) trendChart.destroy(); // clear previous chart

  trendChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: last7Days,
      datasets: [{
        label: 'Spending per Day',
        data: amounts,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
};
  
  // Transaction Form Submit
  form.addEventListener('submit', e => {
    e.preventDefault();

    const description = document.getElementById('description').value.trim();
    const amount = document.getElementById('amount').value.trim();
    const category = document.getElementById('category').value.trim();
    const date = document.getElementById('date').value.trim();

    let valid = true;
    if (!validators.description(description)) { document.querySelector('.error-description').textContent = 'Invalid'; valid=false;} else {document.querySelector('.error-description').textContent='';}
    if (!validators.amount(amount)) { document.querySelector('.error-amount').textContent = 'Invalid'; valid=false;} else {document.querySelector('.error-amount').textContent='';}
    if (!validators.category(category)) { document.querySelector('.error-category').textContent = 'Invalid'; valid=false;} else {document.querySelector('.error-category').textContent='';}
    if (!validators.date(date)) { document.querySelector('.error-date').textContent = 'Invalid'; valid=false;} else {document.querySelector('.error-date').textContent='';}

    if (!valid) return;

    const newTx = {
      id: 'txn_' + Date.now(),
      description,
      amount: parseFloat(amount),
      category,
      date,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    transactions.push(newTx);
    render();
    form.reset();
  });

  // Edit / Delete Buttons
  tbody.addEventListener('click', e => {
    const id = e.target.dataset.id;
    if (e.target.classList.contains('delete')) {
      const idx = transactions.findIndex(t => t.id === id);
      if (idx > -1) { transactions.splice(idx, 1); render(); }
    } else if (e.target.classList.contains('edit')) {
      const tx = transactions.find(t => t.id === id);
      if (tx) {
        document.getElementById('description').value = tx.description;
        document.getElementById('amount').value = tx.amount;
        document.getElementById('category').value = tx.category;
        document.getElementById('date').value = tx.date;
      }
    }
  });

  // Search
  searchInput.addEventListener('input', e => {
    const pattern = compileRegex(e.target.value);
    tbody.innerHTML = '';
    transactions.forEach(tx => {
      const matches = pattern ? [tx.description, tx.category, tx.date, tx.amount.toString()].some(f => pattern.test(f)) : true;
      if (matches) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${highlight(tx.date, pattern)}</td>
          <td>${highlight(tx.description, pattern)}</td>
          <td>${highlight(tx.category, pattern)}</td>
          <td>${highlight(tx.amount.toFixed(2), pattern)}</td>
          <td>
            <button class="edit" data-id="${tx.id}">Edit</button>
            <button class="delete" data-id="${tx.id}">Delete</button>
          </td>`;
        tbody.appendChild(tr);
      }
    });
  });

  // Settings Form
  settingsForm.cap.value = settings.cap || 0;
  settingsForm.currency.value = settings.currency;

  settingsForm.addEventListener('submit', e => {
    e.preventDefault();
    settings.cap = parseFloat(settingsForm.cap.value) || 0;
    settings.currency = settingsForm.currency.value;
    updateState();
    render();
  });

  // Import JSON
  importBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const data = JSON.parse(ev.target.result);
          if (!Array.isArray(data)) throw new Error('Invalid JSON structure');
          data.forEach(tx => { if (!tx.id) tx.id = 'txn_' + Date.now(); });
          transactions.push(...data);
          updateState();
          render();
          console.log('Import successful!');
        } catch (err) {
          console.error('Failed to import JSON:', err);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });

  // Export JSON
  exportBtn.addEventListener('click', () => {
    const dataStr = JSON.stringify(transactions, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.json';
    a.click();
    URL.revokeObjectURL(url);
  });
});

