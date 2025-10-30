(function () {
  const $ = sel => document.querySelector(sel);
  const safeParse = (v, f) => { try { return JSON.parse(v) || f; } catch { return f; } };

  const LS = { TX: 'sft_transactions_v1', SETTINGS: 'sft_settings_v1' };
  let tx = [], settings = { cap: 0, currency: 'ZMW' }, chart = null, editIndex = -1;

  const els = {
    form: $('#transaction-form'),
    desc: $('#description'),
    amt: $('#amount'),
    cat: $('#category'),
    date: $('#date'),
    body: $('#records-body'),
    totalRecords: $('#total-records'),
    totalAmount: $('#total-amount'),
    topCategory: $('#top-category'),
    capRemaining: $('#cap-remaining'),
    search: $('#search'),
    importBtn: $('#import-json'),
    exportBtn: $('#export-json'),
    settingsForm: $('#settings-form'),
    cap: $('#cap'),
    currency: $('#currency'),
    chart: $('#trend-chart'),
    status: $('.status-line'),
    menuToggle: $('#menu-toggle'),
    navList: document.querySelector('nav ul')
  };

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    load();
    renderAll();
    bindEvents();
    els.date.value ||= new Date().toISOString().slice(0, 10);
  }

  function bindEvents() {
    els.form.addEventListener('submit', onSave);
    els.body.addEventListener('click', onTable);
    els.search.addEventListener('input', onSearch);
    els.importBtn.addEventListener('click', importJSON);
    els.exportBtn.addEventListener('click', exportJSON);
    els.settingsForm.addEventListener('submit', onSettings);
    els.menuToggle.addEventListener('click', () => els.navList.classList.toggle('show'));

    document.addEventListener('keydown', e => {
      if (e.key === 'i') els.status.textContent = '-- INSERT MODE --';
      if (e.key === 'Escape') els.status.textContent = '-- NORMAL MODE --';
    });
  }

  function onSave(e) {
    e.preventDefault();
    const t = {
      description: els.desc.value.trim(),
      amount: Number(els.amt.value) || 0,
      category: els.cat.value,
      date: els.date.value
    };
    if (!t.description || !t.amount || !t.category || !t.date) return;
    if (editIndex >= 0) tx[editIndex] = t; else tx.push(t);
    editIndex = -1;
    save(); renderAll(); els.form.reset();
  }

  function onTable(e) {
    if (e.target.classList.contains('delete-btn')) {
      tx.splice(e.target.dataset.i, 1);
      save(); renderAll();
    } else if (e.target.classList.contains('edit-btn')) {
      const t = tx[e.target.dataset.i];
      els.desc.value = t.description; els.amt.value = t.amount;
      els.cat.value = t.category; els.date.value = t.date;
      editIndex = e.target.dataset.i;
    }
  }

  function onSearch(e) {
    const q = e.target.value.trim();
    let filtered = tx;
    if (q) {
      try {
        const re = new RegExp(q, 'i');
        filtered = tx.filter(t => re.test(t.description) || re.test(t.category));
      } catch {
        filtered = tx.filter(t =>
          t.description.toLowerCase().includes(q.toLowerCase()) ||
          t.category.toLowerCase().includes(q.toLowerCase())
        );
      }
    }
    renderTable(filtered);
  }

  function onSettings(e) {
    e.preventDefault();
    settings.cap = Number(els.cap.value) || 0;
    settings.currency = els.currency.value || 'ZMW';
    save(); renderStats();
  }

  function load() {
    tx = safeParse(localStorage.getItem(LS.TX), []);
    settings = Object.assign(settings, safeParse(localStorage.getItem(LS.SETTINGS), {}));
    els.cap.value = settings.cap;
    els.currency.value = settings.currency;
  }

  function save() {
    localStorage.setItem(LS.TX, JSON.stringify(tx));
    localStorage.setItem(LS.SETTINGS, JSON.stringify(settings));
  }

  function renderAll() {
    renderTable(tx);
    renderStats();
    renderChart();
  }

  function renderTable(list) {
    els.body.innerHTML = list.map((t, i) => `
      <tr>
        <td>${t.date}</td>
        <td>${t.description}</td>
        <td>${t.category}</td>
        <td>${settings.currency} ${t.amount.toFixed(2)}</td>
        <td>
          <button class="edit-btn" data-i="${i}">Edit</button>
          <button class="delete-btn" data-i="${i}">Delete</button>
        </td>
      </tr>`).join('');
  }

  function renderStats() {
    const total = tx.reduce((s, t) => s + t.amount, 0);
    els.totalRecords.textContent = tx.length;
    els.totalAmount.textContent = `${settings.currency} ${total.toFixed(2)}`;
    const catSum = {};
    tx.forEach(t => catSum[t.category] = (catSum[t.category] || 0) + t.amount);
    const top = Object.entries(catSum).sort((a, b) => b[1] - a[1])[0];
    els.topCategory.textContent = top ? top[0] : 'N/A';
    els.capRemaining.textContent = `${settings.currency} ${(settings.cap - total).toFixed(2)}`;
  }

  function renderChart() {
    if (!els.chart) return;
    const ctx = els.chart.getContext('2d');
    if (chart) chart.destroy();
    const labels = lastNDates(7);
    const data = labels.map(d =>
      tx.filter(t => t.date === d).reduce((s, t) => s + t.amount, 0)
    );
    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Spending',
          data,
          borderColor: '#58a6ff',
          backgroundColor: 'rgba(88,166,255,0.1)',
          tension: 0.25,
          pointRadius: 3
        }]
      },
      options: {
        plugins: { legend: { labels: { color: '#c9d1d9' } } },
        scales: {
          x: { ticks: { color: '#8b949e' }, grid: { color: '#21262d' } },
          y: { ticks: { color: '#8b949e' }, grid: { color: '#21262d' } }
        },
        maintainAspectRatio: false
      }
    });
  }

  function lastNDates(n) {
    const arr = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      arr.push(d.toISOString().slice(0, 10));
    }
    return arr;
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify({ tx, settings }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'sft-data.json'; a.click();
    URL.revokeObjectURL(url);
  }

  function importJSON() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          if (data.tx) tx = data.tx;
          if (data.settings) settings = Object.assign(settings, data.settings);
          save(); renderAll();
        } catch { alert('Invalid JSON'); }
      };
      reader.readAsText(file);
    };
    input.click();
  }
})();
