import { load, save } from './storage.js';

export let transactions = load();

export let settings = JSON.parse(localStorage.getItem('finance:settings')) || {
  cap: 0,
  currency: 'ZMW'
};

export const updateState = () => {
  save(transactions);
};

export const saveSettings = () => {
  localStorage.setItem('finance:settings', JSON.stringify(settings));
};
