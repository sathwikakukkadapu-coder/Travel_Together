/**
 * Client-side form validation helpers.
 * Each function returns an error string or null.
 */

export const validateName = (v) => {
  if (!v?.trim()) return 'Name is required';
  if (v.trim().length < 2) return 'Name must be at least 2 characters';
  if (v.trim().length > 100) return 'Name cannot exceed 100 characters';
  if (!/^[a-zA-Z\s'-]+$/.test(v.trim())) return 'Name contains invalid characters';
  return null;
};

export const validateEmail = (v) => {
  if (!v?.trim()) return 'Email is required';
  if (!/^\S+@\S+\.\S+$/.test(v.trim())) return 'Enter a valid email address';
  return null;
};

export const validatePassword = (v) => {
  if (!v) return 'Password is required';
  if (v.length < 6) return 'Password must be at least 6 characters';
  if (v.length > 128) return 'Password is too long';
  return null;
};

export const validateConfirmPassword = (password, confirm) => {
  if (!confirm) return 'Please confirm your password';
  if (password !== confirm) return 'Passwords do not match';
  return null;
};

export const validateRequired = (v, fieldName = 'This field') => {
  if (!v && v !== 0) return `${fieldName} is required`;
  if (typeof v === 'string' && !v.trim()) return `${fieldName} is required`;
  return null;
};

/**
 * Run a map of { fieldName: validatorFn } and return
 * { errors: {}, isValid: boolean }
 */
export const runValidations = (rules) => {
  const errors = {};
  for (const [field, fn] of Object.entries(rules)) {
    const err = fn();
    if (err) errors[field] = err;
  }
  return { errors, isValid: Object.keys(errors).length === 0 };
};
