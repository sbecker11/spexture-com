/**
 * Validation Utility Functions
 * 
 * Helper functions for validation that can be used across components.
 * These functions work with validationConfig to provide consistent validation.
 * 
 * Usage:
 *   import { validateField, validatePasswordRules, getPasswordRequirements } from '../validation';
 */

import { validationConfig } from './validationConfig';

/**
 * Get password requirements as an array for UI display
 * @returns {string[]} Array of password requirement descriptions
 */
export const getPasswordRequirements = () => {
  const config = validationConfig.password;
  const rules = [];
  
  if (config.requireUppercase) {
    rules.push(config.messages.rules.uppercase);
  }
  if (config.requireLowercase) {
    rules.push(config.messages.rules.lowercase);
  }
  if (config.requireNumber) {
    rules.push(config.messages.rules.number);
  }
  if (config.requireSpecialChar) {
    rules.push(config.messages.rules.specialChar);
  }
  
  // Add min length first
  return [
    config.messages.rules.minLength(config.minLength),
    ...rules,
  ];
};

/**
 * Validate password and return all broken rules
 * @param {string} password - Password to validate
 * @returns {string|null} Error message with broken rules, or null if valid
 */
export const validatePasswordRules = (password) => {
  const config = validationConfig.password;
  const brokenRules = [];
  
  if (!password || password.length < config.minLength) {
    brokenRules.push(config.messages.rules.minLength(config.minLength).replace('At least ', 'at least '));
  }
  
  if (config.requireUppercase && !/[A-Z]/.test(password)) {
    brokenRules.push(config.messages.rules.uppercase);
  }
  
  if (config.requireLowercase && !/[a-z]/.test(password)) {
    brokenRules.push(config.messages.rules.lowercase);
  }
  
  if (config.requireNumber && !/[0-9]/.test(password)) {
    brokenRules.push(config.messages.rules.number);
  }
  
  if (config.requireSpecialChar && !config.specialChars.test(password)) {
    brokenRules.push(config.messages.rules.specialChar);
  }
  
  if (brokenRules.length === 0) {
    return null; // No broken rules
  }
  
  return `requires ${brokenRules.join(', ')}`;
};

/**
 * Validate a single field value (client-side validation without Yup)
 * Useful for real-time validation in forms
 * @param {string} fieldName - Name of the field ('name' or 'email')
 * @param {string} value - Value to validate
 * @returns {string|null} Error message or null if valid
 */
export const validateField = (fieldName, value) => {
  if (fieldName === 'name') {
    const nameConfig = validationConfig.name;
    const trimmedValue = value.trim();
    
    if (trimmedValue.length === 0) {
      return nameConfig.messages.required;
    }
    
    if (trimmedValue.length < nameConfig.minLength) {
      return nameConfig.messages.minLength(nameConfig.minLength);
    }
    
    if (trimmedValue.length > nameConfig.maxLength) {
      return nameConfig.messages.maxLength(nameConfig.maxLength);
    }
    
    if (!nameConfig.pattern.test(trimmedValue)) {
      return nameConfig.messages.pattern;
    }
    
    return null; // Valid
  }
  
  if (fieldName === 'email') {
    const emailConfig = validationConfig.email;
    const trimmedValue = value.trim();
    
    if (trimmedValue.length === 0) {
      return emailConfig.messages.required;
    }
    
    if (trimmedValue.length > emailConfig.maxLength) {
      return emailConfig.messages.maxLength(emailConfig.maxLength);
    }
    
    if (!emailConfig.pattern.test(trimmedValue)) {
      return emailConfig.messages.invalid(emailConfig.example);
    }
    
    return null; // Valid
  }
  
  return null; // Unknown field, no validation
};

/**
 * Get password rule status for UI feedback
 * @param {string} password - Password to check
 * @returns {Object} Object with boolean status for each rule
 */
export const getPasswordRuleStatus = (password) => {
  const config = validationConfig.password;
  
  return {
    minLength: password.length >= config.minLength,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    specialChar: config.specialChars.test(password),
  };
};

