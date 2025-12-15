/**
 * Yup Validation Schemas Repository
 * 
 * Pre-built Yup schemas for common form fields and form types.
 * All schemas are built from validationConfig to ensure consistency.
 * 
 * Usage:
 *   import { registerSchema, loginSchema, nameSchema, emailSchema } from '../validation';
 */

import * as Yup from 'yup';
import { validationConfig } from './validationConfig';
import { validatePasswordRules } from './validationUtils';

/**
 * Build Yup schema for name field
 */
export const nameSchema = () => {
  const nameConfig = validationConfig.name;
  return Yup.string()
    .required(nameConfig.messages.required)
    .min(nameConfig.minLength, nameConfig.messages.minLength(nameConfig.minLength))
    .max(nameConfig.maxLength, nameConfig.messages.maxLength(nameConfig.maxLength))
    .matches(nameConfig.pattern, nameConfig.messages.pattern);
};

/**
 * Build Yup schema for email field
 */
export const emailSchema = () => {
  const emailConfig = validationConfig.email;
  return Yup.string()
    .required(emailConfig.messages.required)
    .max(emailConfig.maxLength, emailConfig.messages.maxLength(emailConfig.maxLength))
    .test('email-format', emailConfig.messages.invalid(emailConfig.example), function(value) {
      if (!value) return true; // Required check is handled by .required() above
      return emailConfig.pattern.test(value);
    });
};

/**
 * Build Yup schema for password field (with complexity rules)
 */
export const passwordSchema = () => {
  return Yup.string()
    .required(validationConfig.password.messages.required)
    .test('password-rules', function(value) {
      if (!value || value.length === 0) {
        return true; // Required check is handled by .required() above
      }
      const brokenRules = validatePasswordRules(value);
      if (brokenRules) {
        return this.createError({ message: brokenRules });
      }
      return true;
    });
};

/**
 * Build Yup schema for simple password field (no complexity rules)
 * Useful for login forms where password complexity isn't checked
 */
export const simplePasswordSchema = () => {
  return Yup.string()
    .required('Password is required');
};

/**
 * Build complete registration schema (name, email, password)
 */
export const registerSchema = () => {
  return Yup.object().shape({
    name: nameSchema(),
    email: emailSchema(),
    password: passwordSchema(),
  });
};

/**
 * Build login schema (email, password - no complexity rules)
 */
export const loginSchema = () => {
  return Yup.object().shape({
    email: emailSchema(),
    password: simplePasswordSchema(),
  });
};

/**
 * Build profile update schema (name, email - no password)
 */
export const profileUpdateSchema = () => {
  return Yup.object().shape({
    name: nameSchema(),
    email: emailSchema(),
  });
};

/**
 * Build custom schema from field names
 * @param {string[]} fields - Array of field names to include (e.g., ['name', 'email'])
 * @returns {Yup.ObjectSchema}
 */
export const buildCustomSchema = (fields) => {
  const schemaFields = {};
  
  fields.forEach(field => {
    switch (field) {
      case 'name':
        schemaFields.name = nameSchema();
        break;
      case 'email':
        schemaFields.email = emailSchema();
        break;
      case 'password':
        schemaFields.password = passwordSchema();
        break;
      case 'simplePassword':
        schemaFields.password = simplePasswordSchema();
        break;
      default:
        console.warn(`Unknown field: ${field}. Skipping validation.`);
    }
  });
  
  return Yup.object().shape(schemaFields);
};

