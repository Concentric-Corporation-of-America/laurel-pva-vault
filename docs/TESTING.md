# PVA Vault Testing Guide

## Overview

This document provides comprehensive testing workflows for the Laurel County PVA Vault application, including manual testing procedures, automated test setup, and security compliance verification.

## Table of Contents

1. [Manual Testing Workflows](#manual-testing-workflows)
2. [Automated Testing Setup](#automated-testing-setup)
3. [Security & Compliance Testing](#security--compliance-testing)
4. [Performance Testing](#performance-testing)

---

## Manual Testing Workflows

### 1. Authentication Testing

#### 1.1 User Registration
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to https://pvacloud.ai | Redirects to auth page |
| 2 | Click "Sign Up" tab | Sign up form displays |
| 3 | Enter valid email | Email field accepts input |
| 4 | Enter password (min 6 chars) | Password field accepts input |
| 5 | Click "Sign Up" | Success toast, redirects to dashboard |
| 6 | Try duplicate email | Error toast: "User already registered" |

#### 1.2 User Login
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to /auth | Login form displays |
| 2 | Enter WorkHarder credentials | Fields accept input |
| 3 | Click "Sign In" | Success toast, redirects to /dashboard |
| 4 | Enter invalid credentials | Error toast with message |
| 5 | Refresh page while logged in | Session persists |

#### 1.3 Logout
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click logout button (top right) | Session cleared |
| 2 | Verify redirect | Returns to /auth page |
| 3 | Try accessing /dashboard directly | Redirects to /auth |

### 2. Role-Based Access Testing

Test each role's access to the 12 storage buckets:

#### Role Permission Matrix

| Role | Real Property | Tangible | Motor Vehicles | Exemptions | Appeals | Maps/GIS | Admin | Public Records | Legal | Financial | Technology | Archives |
|------|--------------|----------|----------------|------------|---------|----------|-------|----------------|-------|-----------|------------|----------|
| pva_admin | admin | admin | admin | admin | admin | admin | admin | admin | admin | admin | admin | admin |
| deputy_pva | admin | admin | admin | admin | admin | admin | admin | admin | admin | admin | admin | admin |
| senior_appraiser | write | write | write | write | write | write | read | read | read | read | read | read |
| appraiser | write | read | write | write | read | read | none | read | none | none | none | read |
| clerical_staff | read | none | read | write | none | none | none | write | none | none | none | none |
| it_staff | read | read | read | read | read | read | read | read | read | read | admin | read |
| board_member | read | none | none | read | write | none | none | read | read | none | none | none |
| taxpayer | none | none | none | none | none | none | none | read | none | none | none | none |
| public | none | none | none | none | none | none | none | read | none | none | none | none |

#### Testing Procedure for Each Role:
1. Log in with test account assigned the role
2. Navigate to Dashboard
3. Verify UserRoleBadge displays correct role
4. Check each bucket card shows correct permission badge
5. Attempt to access restricted buckets (should show "No Access")

### 3. Dashboard Functionality Testing

#### 3.1 Bucket Grid Display
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Load dashboard | Loading skeleton shows |
| 2 | Wait for load | 12 bucket cards display |
| 3 | Check responsive layout | 1 col mobile, 2 tablet, 3 desktop, 4 large |
| 4 | Hover over bucket | Visual hover effect |
| 5 | Check icons | Each bucket has unique icon |

#### 3.2 Search Functionality
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Type "property" in search | Filters to Real/Tangible Property |
| 2 | Type "motor" | Shows Motor Vehicles bucket |
| 3 | Clear search | All 12 buckets display |
| 4 | Search non-existent term | Empty results or message |

### 4. Settings Page Testing (Admin Only)

#### 4.1 Access Control
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as pva_admin | Settings accessible |
| 2 | Login as non-admin | "Access Restricted" message |

#### 4.2 User Management
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View user list | All users with roles display |
| 2 | Change user role | Role updates in database |
| 3 | Delete user role | User removed from list |
| 4 | Assign role to new user | User appears with role |

---

## Automated Testing Setup

### Installing Test Dependencies

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/coverage-v8
```

### Vitest Configuration

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

### Test Setup File

Create `src/test/setup.ts`:

```typescript
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn()
    })),
    rpc: vi.fn()
  }
}))
```

### Package.json Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

---

## Security & Compliance Testing

### Row-Level Security (RLS) Verification

Test that database policies enforce access correctly:

#### 1. Direct Database Access Test
```sql
-- Test as specific role (run in Supabase SQL Editor)

-- Test bucket visibility
SELECT * FROM storage_buckets;  -- Should return all 12

-- Test permission enforcement
SELECT * FROM bucket_permissions WHERE role = 'taxpayer';
-- Should only show 'read' permission for public_records

-- Test audit logging
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;
```

#### 2. API Security Test
| Test | Method | Expected |
|------|--------|----------|
| Access without auth | GET /dashboard | Redirect to /auth |
| Expired token | Any request | 401 Unauthorized |
| Invalid role claim | Access admin route | 403 Forbidden |

### Federal Compliance Checklist

#### NIST 800-53 Controls
- [ ] AC-2: Account Management (user roles)
- [ ] AC-3: Access Enforcement (RLS policies)
- [ ] AC-6: Least Privilege (role hierarchy)
- [ ] AU-2: Audit Events (audit_logs table)
- [ ] AU-3: Content of Audit Records (details column)
- [ ] IA-2: Identification and Authentication (Supabase Auth)
- [ ] SC-8: Transmission Confidentiality (HTTPS)

#### Data Retention Verification
| Bucket | Retention | Verify |
|--------|-----------|--------|
| Real Property | Permanent | No auto-delete |
| Motor Vehicles | 7 years | Delete policy active |
| Appeals | 10 years | Delete policy active |
| Financial | 7 years | Delete policy active |

---

## Performance Testing

### Load Testing Scenarios

#### 1. Concurrent User Test
- Target: 100 concurrent users
- Actions: Login, view dashboard, search buckets
- Expected: Response time < 2 seconds

#### 2. Database Query Performance
```sql
-- Test bucket query performance
EXPLAIN ANALYZE SELECT * FROM storage_buckets;

-- Test permission lookup performance
EXPLAIN ANALYZE SELECT * FROM bucket_permissions WHERE role = 'appraiser';
```

### Lighthouse Audit Targets

| Metric | Target | Current |
|--------|--------|---------|
| Performance | > 90 | TBD |
| Accessibility | > 95 | TBD |
| Best Practices | > 90 | TBD |
| SEO | > 80 | TBD |

---

## Test Data Setup

### Creating Test Users

Use Supabase Auth to create test accounts:

```sql
-- After creating auth users, assign roles
INSERT INTO user_roles (user_id, role) VALUES
  ('uuid-admin', 'pva_admin'),
  ('uuid-deputy', 'deputy_pva'),
  ('uuid-senior', 'senior_appraiser'),
  ('uuid-appraiser', 'appraiser'),
  ('uuid-clerical', 'clerical_staff'),
  ('uuid-it', 'it_staff'),
  ('uuid-board', 'board_member'),
  ('uuid-taxpayer', 'taxpayer');
```

### Test Credentials

| Role | Email | Notes |
|------|-------|-------|
| pva_admin | admin@test.pvacloud.ai | Full access |
| taxpayer | taxpayer@test.pvacloud.ai | Public records only |

---

## Troubleshooting

### Common Issues

1. **Auth redirect loop**
   - Check Supabase URL/Key in environment
   - Clear localStorage and retry

2. **Buckets not loading**
   - Verify RLS policies are enabled
   - Check network tab for errors

3. **Role not displaying**
   - Ensure user has entry in user_roles table
   - Check get_user_role function exists

### Debug Commands

```bash
# Check build
npm run build

# Check types
npx tsc --noEmit

# Run linter
npm run lint
```
