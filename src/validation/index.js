/**
 * Validation Repository - Main Export
 * 
 * This is the central repository for all validation rules, schemas, and utilities.
 * Import from this file to use validation across any page or component.
 * 
 * Usage Examples:
 * 
 * // Import everything
 * import { validationConfig, registerSchema, validateField } from '../validation';
 * 
 * // Import specific items
 * import { validationConfig } from '../validation';
 * import { registerSchema, loginSchema } from '../validation';
 * import { validateField, getPasswordRequirements } from '../validation';
 */

// Export configuration
export { validationConfig } from './validationConfig';

// Export Yup schemas
export {
  nameSchema,
  emailSchema,
  passwordSchema,
  simplePasswordSchema,
  registerSchema,
  loginSchema,
  profileUpdateSchema,
  buildCustomSchema,
} from './validationSchemas';

// Export utility functions
export {
  validateField,
  validatePasswordRules,
  getPasswordRequirements,
  getPasswordRuleStatus,
} from './validationUtils';

// Export field validation utilities
export {
  getFieldValidationConfig,
  validateFieldByType,
  getAvailableFieldTypes,
} from './fieldValidation';

