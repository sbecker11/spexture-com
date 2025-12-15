# Validation Repository

This is the **centralized validation repository** for the entire application. All validation rules, schemas, and utilities are defined here and can be used across any page or component.

## 📁 Structure

```
src/validation/
├── index.js              # Main export file - import from here
├── validationConfig.js   # Configuration (rules, patterns, messages)
├── validationSchemas.js  # Pre-built Yup schemas
├── validationUtils.js    # Helper functions
└── README.md            # This file
```

## 🚀 Quick Start

### Import from the repository:

```javascript
// Import everything you need
import { 
  validationConfig,      // Configuration object
  registerSchema,        // Pre-built Yup schemas
  loginSchema,
  validateField,        // Utility functions
  getPasswordRequirements
} from '../validation';
```

## 📚 Available Exports

### Configuration
- `validationConfig` - Complete configuration object with all rules and messages

### Yup Schemas (ready to use)
- `nameSchema()` - Name field validation
- `emailSchema()` - Email field validation  
- `passwordSchema()` - Password with complexity rules
- `simplePasswordSchema()` - Password without complexity (for login)
- `registerSchema()` - Complete registration form (name, email, password)
- `loginSchema()` - Complete login form (email, password)
- `profileUpdateSchema()` - Profile update form (name, email)
- `buildCustomSchema(fields)` - Build custom schema from field names

### Utility Functions
- `validateField(fieldName, value)` - Client-side field validation
- `validatePasswordRules(password)` - Check password complexity
- `getPasswordRequirements()` - Get password requirements for UI
- `getPasswordRuleStatus(password)` - Get password rule status object

## 💡 Usage Examples

### Example 1: Using Pre-built Schemas

```javascript
import { registerSchema, loginSchema } from '../validation';

// Use in form validation
const schema = registerSchema();
await schema.validate(formData);
```

### Example 2: Using Configuration

```javascript
import { validationConfig } from '../validation';

const nameConfig = validationConfig.name;
const minLength = nameConfig.minLength; // 2
const pattern = nameConfig.pattern;   // /^[a-zA-Z0-9\s'-]+$/
```

### Example 3: Client-Side Validation

```javascript
import { validateField } from '../validation';

const error = validateField('email', 'user@example.com');
if (error) {
  console.log(error); // null if valid, error message if invalid
}
```

### Example 4: Password Requirements Display

```javascript
import { getPasswordRequirements } from '../validation';

const requirements = getPasswordRequirements();
// Returns: ['At least 8 characters', '1 uppercase letter', ...]
```

### Example 5: Custom Schema

```javascript
import { buildCustomSchema } from '../validation';

// Build schema with only name and email
const schema = buildCustomSchema(['name', 'email']);
```

## 🔧 Adding New Validation Rules

1. **Add configuration** in `validationConfig.js`:
```javascript
export const validationConfig = {
  // ... existing rules
  phone: {
    pattern: /^\+?[1-9]\d{1,14}$/,
    messages: {
      required: 'Phone is required',
      invalid: 'Invalid phone number',
    },
  },
};
```

2. **Add schema builder** in `validationSchemas.js`:
```javascript
export const phoneSchema = () => {
  const phoneConfig = validationConfig.phone;
  return Yup.string()
    .required(phoneConfig.messages.required)
    .matches(phoneConfig.pattern, phoneConfig.messages.invalid);
};
```

3. **Export** in `index.js`:
```javascript
export { phoneSchema } from './validationSchemas';
```

4. **Use** in components:
```javascript
import { phoneSchema } from '../validation';
```

## ✅ Benefits

- ✅ **Single Source of Truth** - All rules in one place
- ✅ **Consistency** - Same rules across all pages
- ✅ **Reusability** - Use anywhere in the app
- ✅ **Maintainability** - Update once, applies everywhere
- ✅ **Type Safety** - Yup schemas provide type validation
- ✅ **Easy Testing** - Centralized rules are easy to test

## 📝 Current Validation Rules

### Name
- Required
- 2-50 characters
- Letters, numbers, spaces, hyphens, apostrophes only

### Email
- Required
- Max 254 characters (RFC 5321)
- Realistic email format validation
- Proper TLD required (2+ letters)

### Password
- Required
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

## 🔄 Migration from Old Location

If you're updating existing code, change imports from:
```javascript
// Old
import { validationConfig } from './validationConfig';

// New
import { validationConfig } from '../validation';
```

