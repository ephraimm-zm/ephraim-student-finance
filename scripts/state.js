// scripts/state.js
import { load, save } from './storage.js';

export const state = {
  transactions: load(),
  settings: { cap: 0, currency: 'ZMW' }
};

export const addTransaction = (tx) => {
  tx.id = 'txn_' + Date.now();
  tx.createdAt = new Date().toISOString();
  tx.updatedAt = new Date().toISOString();
  state.transactions.push(tx);
  save(state.transactions);
};

export const editTransaction = (id, tx) => {
  const index = state.transactions.findIndex(t => t.id === id);
  if (index === -1) return;
  state.transactions[index] = { ...state.transactions[index], ...tx, updatedAt: new Date().toISOString() };
  save(state.transactions);
};

export const deleteTransaction = (id) => {
  state.transactions = state.transactions.filter(t => t.id !== id);
  save(state.transactions);
};
