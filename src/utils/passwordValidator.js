/**
 * Password Strength & Validation Utility
 * Minimum 8 characters
 * Must contain uppercase, lowercase, and number
 */
export function calculatePasswordStrength(password = '') {
  if (!password) {
    return {
      score: 0,
      label: 'Too short',
      color: '#CBD5E1',
      rules: {
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false
      },
      isValid: false
    };
  }

  const rules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  };

  // Base requirement: length >= 8, uppercase, lowercase, number
  const baseValid = rules.length && rules.uppercase && rules.lowercase && rules.number;

  let score = 0;
  if (rules.length) score++;
  if (rules.uppercase) score++;
  if (rules.lowercase) score++;
  if (rules.number) score++;
  if (rules.special) score++;

  let label = 'Weak';
  let color = '#EF4444'; // Red

  if (score <= 2) {
    label = 'Weak';
    color = '#EF4444';
  } else if (score === 3) {
    label = 'Fair';
    color = '#F59E0B'; // Amber
  } else if (score === 4) {
    label = 'Good';
    color = '#B5642B'; // INDSTATE Bronze/Saffron
  } else if (score >= 5) {
    label = 'Strong';
    color = '#1F5F4A'; // INDSTATE Forest Green
  }

  return {
    score,
    label,
    color,
    rules,
    isValid: baseValid
  };
}
