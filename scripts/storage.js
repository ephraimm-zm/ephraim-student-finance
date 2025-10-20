export const KEY = 'finance:data';

export const load = () => {
  const data = localStorage.getItem(KEY);
  return data ? JSON.parse(data) : [];
};

export const save = (data) => {
  localStorage.setItem(KEY, JSON.stringify(data));
};
