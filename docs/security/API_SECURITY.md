# API Security Implementation Guide

## Overview
This document explains the API security measures implemented to prevent unauthorized direct access to API endpoints.

## Security Strategy

### Problem
By default, Next.js API routes are accessible via direct browser URLs (e.g., `http://localhost:3000/api/projects/5`). This allows users to bypass the application's UI and directly interact with the API, which can be a security concern.

### Solution
We've implemented a multi-layered security approach:

1. **Custom Header Validation**: A special header (`x-internal-request`) that can only be set via JavaScript fetch/XMLHttpRequest
2. **Authentication Check**: Verification of user authentication tokens
3. **Origin Validation**: Optional check of referer/origin headers

## Implementation

### 1. Security Utility (`src/lib/utils/apiSecurity.ts`)

The `apiSecurity.ts` file provides two main functions:

#### `verifyInternalApiRequest(request, requireAuth)`
Validates that a request is coming from the application's pages.

**Parameters:**
- `request`: NextRequest object
- `requireAuth`: boolean (default: true) - whether authentication is required

**Returns:**
- `null` if valid
- `{ error: string, status: number }` if invalid

**Example:**
```typescript
import { verifyInternalApiRequest } from '@/lib/utils/apiSecurity';

export async function GET(request: NextRequest) {
  const authError = verifyInternalApiRequest(request);
  /* Lines 41-54 omitted */  
  // Continue with API logic...
}
```

#### `getInternalApiHeaders()`
Returns headers to be included in client-side API requests.

**Returns:** 
```typescript
{ 'x-internal-request': 'true' }
```

### 2. Network Client Update (`src/lib/networkClient.ts`)

The networkClient automatically includes the internal API headers in all requests (GET, POST, PUT, DELETE).

**Before:**
```typescript
async get(url: string, options: RequestOptions = {}): Promise<Response> {
  return this.request(url, {/* Lines 74-76 omitted */});
}
```

**After:**
```typescript
async get(url: string, options: RequestOptions = {}): Promise<Response> {
  return this.request(url, {/* Lines 84-90 omitted */});
}
```

### 3. API Route Updates

All API routes should include the security check at the beginning of each handler function.

**Example - Standard Protected Route:**
```typescript
import { verifyInternalApiRequest } from '@/lib/utils/apiSecurity';

export async function POST(request: NextRequest) {
  // Verify internal API request (requires authentication)
  /* Lines 104-118 omitted */  
  // API logic...
}
```

**Example - Public Route (no auth required):**
```typescript
import { verifyInternalApiRequest } from '@/lib/utils/apiSecurity';

export async function POST(request: NextRequest) {
  // Verify internal API request (no authentication required)
  /* Lines 128-142 omitted */  
  // API logic...
}
```

## Updated Files

### Core Security Files
- ✅ `src/lib/utils/apiSecurity.ts` - Security utility functions
- ✅ `src/lib/networkClient.ts` - Automatic header injection

### Protected API Routes
- ✅ `src/app/api/projects/route.ts`
- ✅ `src/app/api/projects/[id]/route.ts`

### Routes That Need Update
All other API routes should be updated with the same pattern. Priority routes include:

**High Priority (Data Modification):**
- `src/app/api/sliders/[id]/route.ts`
- `src/app/api/sliders/route.ts`
- `src/app/api/services/[id]/route.ts`
- `src/app/api/services/route.ts`
- `src/app/api/categories/[id]/route.ts`
- `src/app/api/categories/route.ts`
- `src/app/api/support-topics/[id]/route.ts`
- `src/app/api/support-topics/route.ts`
- `src/app/api/bank-transfers/[id]/route.ts`
- `src/app/api/regions/[id]/route.ts`
- `src/app/api/regions/route.ts`
- `src/app/api/payment-methods/[id]/route.ts`
- `src/app/api/banks/[id]/route.ts`
- `src/app/api/pages/[id]/route.ts`

**Auth Routes (use `requireAuth: false`):**
- ✅ `src/app/api/auth/signin/route.ts` (should use `verifyInternalApiRequest(request, false)`)
- `src/app/api/auth/logout/route.ts`

## Security Benefits

### What This Prevents
