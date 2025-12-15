/**
 * Server-Side Validation Helpers
 * 
 * Uses the shared validation config to build express-validator rules.
 * This ensures server-side validation matches client-side validation.
 */

const { body } = require('express-validator');
const validationConfig = require('../../../shared/validationConfig.js');

/**
 * Get express-validator rules for a field type
 * @param {string} fieldType - Field type ('name', 'email', 'password')
 * @param {Object} options - Options like { required: true, optional: false }
 * @returns {Array} Array of express-validator middleware
 */
function getFieldValidators(fieldType, options = {}) {
  const { required = true, optional = false } = options;
  const config = validationConfig[fieldType];
  
  if (!config) {
    throw new Error(`Unknown field type: ${fieldType}`);
  }
  
  const validators = [];
  
  // Apply field-specific validators
  switch (fieldType) {
    case 'name':
      if (optional) {
        // For optional fields, chain validators with .optional() to skip if not present
        validators.push(
          body('name')
            .optional()
            .trim()
            .isLength({ min: config.minLength, max: config.maxLength })
            .withMessage(config.messages.minLength(config.minLength) + ' and ' + config.messages.maxLength(config.maxLength).replace('less than', 'at most'))
            .matches(new RegExp(config.patternString))
            .withMessage(config.messages.pattern)
        );
      } else {
        validators.push(
          body('name')
            .trim()
            .isLength({ min: config.minLength, max: config.maxLength })
            .withMessage(config.messages.minLength(config.minLength) + ' and ' + config.messages.maxLength(config.maxLength).replace('less than', 'at most'))
            .matches(new RegExp(config.patternString))
            .withMessage(config.messages.pattern)
        );
      }
      break;
      
    case 'email':
      if (optional) {
        // For optional fields, chain validators with .optional() to skip if not present
        validators.push(
          body('email')
            .optional()
            .trim()
            .isLength({ max: config.maxLength })
            .withMessage(config.messages.maxLength(config.maxLength))
            .matches(new RegExp(config.patternString))
            .withMessage(config.messages.invalid(config.example))
        );
      } else {
        validators.push(
          body('email')
            .trim()
            .isLength({ max: config.maxLength })
            .withMessage(config.messages.maxLength(config.maxLength))
            .matches(new RegExp(config.patternString))
            .withMessage(config.messages.invalid(config.example))
        );
      }
      // Note: express-validator's .isEmail() is less strict, so we use our pattern
      break;
      
    case 'password':
      validators.push(
        body('password')
          .isLength({ min: config.minLength })
          .withMessage(`Password ${config.messages.rules.minLength(config.minLength)}`)
          .matches(/[A-Z]/)
          .withMessage(`Password must contain ${config.messages.rules.uppercase}`)
          .matches(/[a-z]/)
          .withMessage(`Password must contain ${config.messages.rules.lowercase}`)
          .matches(/[0-9]/)
          .withMessage(`Password must contain ${config.messages.rules.number}`)
          .matches(new RegExp(config.specialCharsString))
          .withMessage(`Password must contain ${config.messages.rules.specialChar}`)
      );
      break;
      
    default:
      throw new Error(`No validators defined for field type: ${fieldType}`);
  }
  
  return validators;
}

/**
 * Get validation rules for registration form
 */
function getRegisterValidators() {
  return [
    ...getFieldValidators('name', { required: true }),
    ...getFieldValidators('email', { required: true }),
    ...getFieldValidators('password', { required: true }),
  ];
}

/**
 * Get validation rules for profile update form
 */
function getProfileUpdateValidators() {
  return [
    ...getFieldValidators('name', { optional: true }),
    ...getFieldValidators('email', { optional: true }),
  ];
}

module.exports = {
  getFieldValidators,
  getRegisterValidators,
  getProfileUpdateValidators,
  validationConfig,
};

