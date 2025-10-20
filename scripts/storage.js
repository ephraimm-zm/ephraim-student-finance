// scripts/storage.js
const KEY = 'finance:data';

export const load = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
};

export const save = (data) => {
  localStorage.setItem(KEY, JSON.stringify(data));
};
