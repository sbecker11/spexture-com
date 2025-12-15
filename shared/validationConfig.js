/**
 * Shared Validation Configuration
 * 
 * This is the SINGLE SOURCE OF TRUTH for all validation rules.
 * Used by both client-side (React) and server-side (Express).
 * 
 * Update rules here and they apply everywhere automatically.
 */

const validationConfig = {
  name: {
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9\s'-]+$/,
    patternString: '^[a-zA-Z0-9\\s\'-]+$', // String version for express-validator
    messages: {
      required: 'Name is required',
      minLength: (min) => `Name must be at least ${min} characters`,
      maxLength: (max) => `Name must be less than ${max} characters`,
      pattern: 'Name can only contain letters, numbers, spaces, hyphens, and apostrophes',
    },
  },
  email: {
    example: 'user@example.com',
    pattern: /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/,
    patternString: '^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\\.[a-zA-Z]{2,}$',
    maxLength: 254, // RFC 5321 limit
    messages: {
      required: 'Email is required',
      invalid: (example) => `Invalid email address. Example: ${example}`,
      maxLength: (max) => `Email must be less than ${max} characters`,
    },
  },
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecialChar: true,
    specialChars: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
    specialCharsString: '[!@#$%^&*()_+\\-=\\[\\]{};\':"\\\\|,.<>\\/?]',
    messages: {
      required: 'Password is required',
      rules: {
        minLength: (min) => `At least ${min} characters`,
        uppercase: '1 uppercase letter',
        lowercase: '1 lowercase letter',
        number: '1 digit',
        specialChar: '1 symbol',
      },
    },
  },
};

// Export for CommonJS (server-side)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = validationConfig;
}

// Export for ES6 (client-side)
if (typeof window !== 'undefined' || (typeof process !== 'undefined' && process.env)) {
  // Will be re-exported by client-side validationConfig.js
}
