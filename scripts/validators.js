export const validators = {
  description: val => /^\S(?:.*\S)?$/.test(val) && !/\b(\w+)\s+\1\b/.test(val),
  amount: val => /^(0|[1-9]\d*)(\.\d{1,2})?$/.test(val),
  category: val => /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/.test(val),
  date: val => /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(val)
};
