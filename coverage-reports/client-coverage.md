## Overall Coverage

| Metric | Covered | Total | Percentage |
|--------|---------|-------|------------|
| **Lines** | 810 | 1012 | 🟢 **80.03%** |
| **Statements** | 845 | 1058 | 🟡 **79.86%** |
| **Functions** | 192 | 242 | 🟡 **79.33%** |
| **Branches** | 544 | 803 | 🟠 **67.74%** |

### Coverage Status: 🟡 Good

Overall coverage: **76.74%**

---

## File Coverage Details

| File | Lines | Statements | Functions | Branches |
|------|-------|------------|-----------|----------|
| `src/App.js` | 🟢 100.0% | 🟢 100.0% | 🟢 100.0% | 🟢 100.0% |
| `src/setupTests.integration.js` | 🔴 0.0% | 🔴 0.0% | 🔴 0.0% | 🔴 0.0% |
| `src/test-utils.js` | 🟠 50.0% | 🟠 50.0% | 🔴 28.6% | 🔴 33.3% |
| `src/components/About.js` | 🟢 100.0% | 🟢 100.0% | 🟢 100.0% | 🟢 100.0% |
| `src/components/AdminAuthModal.js` | 🟡 78.9% | 🟢 80.5% | 🟢 88.9% | 🟠 65.5% |
| `src/components/AdminDashboard.js` | 🟢 100.0% | 🟢 100.0% | 🟢 100.0% | 🟢 100.0% |
| `src/components/DevTools.js` | 🟢 100.0% | 🟢 100.0% | 🟢 100.0% | 🟢 100.0% |
| `src/components/ErrorBoundary.js` | 🟢 100.0% | 🟢 100.0% | 🟢 100.0% | 🔴 45.5% |
| `src/components/Footer.js` | 🟢 100.0% | 🟢 100.0% | 🟢 100.0% | 🟢 100.0% |
| `src/components/Header.js` | 🟠 51.2% | 🟠 50.0% | 🟠 50.0% | 🟠 68.0% |
| `src/components/Home.js` | 🟢 100.0% | 🟢 100.0% | 🟢 100.0% | 🟢 100.0% |
| `src/components/JDAnalyzer.js` | 🟢 100.0% | 🟢 98.2% | 🟢 100.0% | 🟢 89.6% |
| `src/components/Left.js` | 🟢 100.0% | 🟢 100.0% | 🟢 100.0% | 🟡 77.8% |
| `src/components/Loading.js` | 🟢 100.0% | 🟢 100.0% | 🟢 100.0% | 🟢 100.0% |
| `src/components/LoginRegister.js` | 🟢 87.7% | 🟢 87.5% | 🟢 89.3% | 🟡 73.1% |
| `src/components/NotFound.js` | 🟢 100.0% | 🟢 100.0% | 🟢 100.0% | 🟢 100.0% |
| `src/components/PageContainer.js` | 🟢 100.0% | 🟢 100.0% | 🟢 100.0% | 🟢 100.0% |
| `src/components/Profile.js` | 🟢 90.0% | 🟢 88.6% | 🟡 73.3% | 🟠 61.4% |
| `src/components/ProtectedRoute.js` | 🟢 100.0% | 🟢 100.0% | 🟢 100.0% | 🟢 100.0% |
| `src/components/TestPage.js` | 🔴 0.0% | 🔴 0.0% | 🔴 0.0% | 🟢 100.0% |
| `src/components/UserEditModal.js` | 🟢 85.2% | 🟢 87.0% | 🟢 82.6% | 🟡 73.8% |
| `src/components/UserManagement.js` | 🟠 59.1% | 🟠 58.3% | 🟠 51.2% | 🟠 50.6% |
| `src/contexts/AuthContext.js` | 🟢 100.0% | 🟢 100.0% | 🟢 100.0% | 🟢 85.7% |
| `src/contexts/ThemeContext.js` | 🟢 85.7% | 🟢 86.4% | 🟢 100.0% | 🟠 50.0% |
| `src/services/adminAPI.js` | 🟢 93.0% | 🟢 93.0% | 🟢 90.0% | 🟢 88.9% |
| `src/services/api.js` | 🟢 98.5% | 🟢 98.6% | 🟢 100.0% | 🟢 90.9% |
| `src/utils/serverCheck.js` | 🟠 51.6% | 🟠 50.0% | 🟠 50.0% | 🔴 38.5% |
| `src/validation/fieldValidation.js` | 🟢 96.2% | 🟢 96.2% | 🟢 100.0% | 🟢 95.5% |
| `src/validation/index.js` | 🟢 100.0% | 🟢 100.0% | 🟢 100.0% | 🟢 100.0% |
| `src/validation/validationConfig.js` | 🟢 100.0% | 🟢 100.0% | 🟢 100.0% | 🟢 100.0% |
| `src/validation/validationSchemas.js` | 🟠 63.1% | 🟠 64.1% | 🟡 72.7% | 🟠 61.5% |
| `src/validation/validationUtils.js` | 🟠 61.8% | 🟠 61.8% | 🟠 50.0% | 🟠 66.7% |
| **OVERALL** | 🟢 **80.0%** | 🟡 **79.9%** | 🟡 **79.3%** | 🟠 **67.7%** |

---

## Legend

- 🟢 **Excellent** (≥80%)
- 🟡 **Good** (70-79%)
- 🟠 **Fair** (50-69%)
- 🔴 **Poor** (<50%)

---

## Recommendations

- ⚠️ **Branch coverage is low (67.7%)** - Add more tests for conditional logic and edge cases
