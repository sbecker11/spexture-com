/**
 * Field Validation Utilities
 * 
 * Provides utilities for validating fields based on data-validation-field-type attribute.
 * This allows forms to declare validation rules via HTML attributes.
 * 
 * Usage:
 *   <input data-validation-field-type="name" ... />
 *   <input data-validation-field-type="email" ... />
 *   <input data-validation-field-type="password" ... />
 */

import { validationConfig } from './validationConfig';

/**
 * Get validation config for a field type
 * @param {string} fieldType - Field type from data-validation-field-type attribute
 * @returns {Object|null} Validation config or null if unknown type
 */
export function getFieldValidationConfig(fieldType) {
  return validationConfig[fieldType] || null;
}

/**
 * Validate a field value based on its field type
 * @param {string} fieldType - Field type ('name', 'email', 'password')
 * @param {string} value - Value to validate
 * @returns {Object} { isValid: boolean, error: string|null }
 */
export function validateFieldByType(fieldType, value) {
  const config = getFieldValidationConfig(fieldType);
  
  if (!config) {
    return { isValid: false, error: `Unknown field type: ${fieldType}` };
  }
  
  const trimmedValue = value.trim();
  
  // Check required
  if (trimmedValue.length === 0) {
    return { isValid: false, error: config.messages.required };
  }
  
  // Field-specific validation
  switch (fieldType) {
    case 'name':
      if (trimmedValue.length < config.minLength) {
        return { isValid: false, error: config.messages.minLength(config.minLength) };
      }
      if (trimmedValue.length > config.maxLength) {
        return { isValid: false, error: config.messages.maxLength(config.maxLength) };
      }
      if (!config.pattern.test(trimmedValue)) {
        return { isValid: false, error: config.messages.pattern };
      }
      break;
      
    case 'email':
      if (trimmedValue.length > config.maxLength) {
        return { isValid: false, error: config.messages.maxLength(config.maxLength) };
      }
      if (!config.pattern.test(trimmedValue)) {
        return { isValid: false, error: config.messages.invalid(config.example) };
      }
      break;
      
    case 'password':
      // Password validation is more complex, handled separately
      // This is a basic check - full validation should use passwordSchema
      if (trimmedValue.length < config.minLength) {
        return { isValid: false, error: `Password ${config.messages.rules.minLength(config.minLength)}` };
      }
      break;
      
    default:
      return { isValid: false, error: `No validation defined for: ${fieldType}` };
  }
  
  return { isValid: true, error: null };
}

/**
 * Get all field types that have validation config
 * @returns {string[]} Array of field type names
 */
export function getAvailableFieldTypes() {
  return Object.keys(validationConfig);
}

