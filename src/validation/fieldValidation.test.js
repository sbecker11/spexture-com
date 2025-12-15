/**
 * Field Validation Tests
 */

import {
  getFieldValidationConfig,
  validateFieldByType,
  getAvailableFieldTypes,
} from './fieldValidation';

describe('Field Validation', () => {
  describe('getFieldValidationConfig', () => {
    it('should return config for valid field type', () => {
      const config = getFieldValidationConfig('name');
      expect(config).toBeDefined();
      expect(config).toHaveProperty('minLength');
      expect(config).toHaveProperty('maxLength');
      expect(config).toHaveProperty('pattern');
    });

    it('should return config for email field type', () => {
      const config = getFieldValidationConfig('email');
      expect(config).toBeDefined();
      expect(config).toHaveProperty('pattern');
      expect(config).toHaveProperty('maxLength');
    });

    it('should return config for password field type', () => {
      const config = getFieldValidationConfig('password');
      expect(config).toBeDefined();
      expect(config).toHaveProperty('minLength');
    });

    it('should return null for unknown field type', () => {
      const config = getFieldValidationConfig('unknown');
      expect(config).toBeNull();
    });

    it('should return null for null field type', () => {
      const config = getFieldValidationConfig(null);
      expect(config).toBeNull();
    });

    it('should return null for undefined field type', () => {
      const config = getFieldValidationConfig(undefined);
      expect(config).toBeNull();
    });
  });

  describe('validateFieldByType - name', () => {
      it('should validate valid name', () => {
        const result = validateFieldByType('name', 'John Doe');
        expect(result.isValid).toBe(true);
        expect(result.error).toBeNull();
      });

      it('should reject empty name', () => {
        const result = validateFieldByType('name', '');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Name is required');
    });

    it('should reject name with only whitespace', () => {
      const result = validateFieldByType('name', '   ');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Name is required');
      });

      it('should reject name shorter than minLength', () => {
        const result = validateFieldByType('name', 'A');
        expect(result.isValid).toBe(false);
      expect(result.error).toContain('at least');
      });

      it('should reject name longer than maxLength', () => {
        const longName = 'A'.repeat(51);
        const result = validateFieldByType('name', longName);
        expect(result.isValid).toBe(false);
      expect(result.error).toContain('less than');
      });

      it('should reject name with invalid characters', () => {
        const result = validateFieldByType('name', 'John@Doe');
        expect(result.isValid).toBe(false);
      expect(result.error).toContain('letters, numbers, spaces');
      });

    it('should accept name with hyphens and apostrophes', () => {
      const result = validateFieldByType('name', "O'Brien-Smith");
        expect(result.isValid).toBe(true);
        expect(result.error).toBeNull();
      });

    it('should accept name with numbers', () => {
      const result = validateFieldByType('name', 'John2');
        expect(result.isValid).toBe(true);
        expect(result.error).toBeNull();
      });
  });

  describe('validateFieldByType - email', () => {
      it('should validate valid email', () => {
        const result = validateFieldByType('email', 'user@example.com');
        expect(result.isValid).toBe(true);
        expect(result.error).toBeNull();
      });

      it('should reject empty email', () => {
        const result = validateFieldByType('email', '');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Email is required');
    });

    it('should reject email with only whitespace', () => {
      const result = validateFieldByType('email', '   ');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Email is required');
      });

      it('should reject invalid email format', () => {
      const result = validateFieldByType('email', 'not-an-email');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid email');
    });

    it('should reject email without @', () => {
      const result = validateFieldByType('email', 'userexample.com');
      expect(result.isValid).toBe(false);
    });

    it('should reject email without domain', () => {
      const result = validateFieldByType('email', 'user@');
        expect(result.isValid).toBe(false);
      });

      it('should reject email longer than maxLength', () => {
        const longEmail = 'a'.repeat(250) + '@example.com';
        const result = validateFieldByType('email', longEmail);
        expect(result.isValid).toBe(false);
      expect(result.error).toContain('less than');
      });

    it('should accept valid email with subdomain', () => {
      const result = validateFieldByType('email', 'user@mail.example.com');
      expect(result.isValid).toBe(true);
    });

    it('should accept valid email with numbers', () => {
      const result = validateFieldByType('email', 'user123@example.com');
          expect(result.isValid).toBe(true);
        });
      });

  describe('validateFieldByType - password', () => {
      it('should validate password with minimum length', () => {
      const result = validateFieldByType('password', '12345678');
        expect(result.isValid).toBe(true);
        expect(result.error).toBeNull();
      });

      it('should reject empty password', () => {
        const result = validateFieldByType('password', '');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password is required');
    });

    it('should reject password with only whitespace', () => {
      const result = validateFieldByType('password', '   ');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Password is required');
      });

      it('should reject password shorter than minLength', () => {
        const result = validateFieldByType('password', 'short');
        expect(result.isValid).toBe(false);
      expect(result.error).toContain('At least');
      });

    it('should accept password with 8 characters', () => {
      const result = validateFieldByType('password', '12345678');
        expect(result.isValid).toBe(true);
      });

    it('should accept password longer than minimum', () => {
      const result = validateFieldByType('password', 'verylongpassword123');
      expect(result.isValid).toBe(true);
      });
    });

  describe('validateFieldByType - unknown types', () => {
    it('should reject unknown field type', () => {
        const result = validateFieldByType('unknown', 'value');
        expect(result.isValid).toBe(false);
      expect(result.error).toContain('Unknown field type');
      });

    it('should reject null field type', () => {
      const result = validateFieldByType(null, 'value');
        expect(result.isValid).toBe(false);
      expect(result.error).toContain('Unknown field type');
      });

    it('should reject undefined field type', () => {
      const result = validateFieldByType(undefined, 'value');
        expect(result.isValid).toBe(false);
      expect(result.error).toContain('Unknown field type');
    });
  });

  describe('getAvailableFieldTypes', () => {
    it('should return array of available field types', () => {
      const types = getAvailableFieldTypes();
      expect(Array.isArray(types)).toBe(true);
      expect(types.length).toBeGreaterThan(0);
    });

    it('should include name field type', () => {
      const types = getAvailableFieldTypes();
      expect(types).toContain('name');
    });

    it('should include email field type', () => {
      const types = getAvailableFieldTypes();
      expect(types).toContain('email');
    });

    it('should include password field type', () => {
      const types = getAvailableFieldTypes();
      expect(types).toContain('password');
    });

    it('should return consistent results', () => {
      const types1 = getAvailableFieldTypes();
      const types2 = getAvailableFieldTypes();
      expect(types1).toEqual(types2);
    });
  });
});
