import { load, save } from './storage.js';

export let transactions = load();

export let settings = {
  cap: 0,
  currency: 'ZMW'
};

export const updateState = () => {
  save(transactions);
};
