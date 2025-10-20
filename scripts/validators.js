// scripts/validators.js

// Regex patterns
const patterns = {
  description: /^\S(?:.*\S)?$/, // no leading/trailing spaces
  amount: /^(0|[1-9]\d*)(\.\d{1,2})?$/, // numeric with 2 decimals max
  date: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, // YYYY-MM-DD
  category: /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/, // letters, spaces, hyphens
  duplicateWords: /\b(\w+)\s+\1\b/i // advanced: catch duplicate words
};

export const validateTransaction = ({ description, amount, date, category }) => {
  const errors = {};
  if (!patterns.description.test(description)) errors.description = 'Invalid description';
  if (!patterns.amount.test(amount)) errors.amount = 'Invalid amount';
  if (!patterns.date.test(date)) errors.date = 'Invalid date';
  if (!patterns.category.test(category)) errors.category = 'Invalid category';
  if (patterns.duplicateWords.test(description)) errors.description = 'Duplicate words found';
  return errors;
};
