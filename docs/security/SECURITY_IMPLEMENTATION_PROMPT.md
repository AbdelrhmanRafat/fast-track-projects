# Prompt: Secure All API Routes with Internal Request Validation

## Context
I have a Next.js 15+ application with API routes that are currently accessible via direct browser URLs. I need to secure these routes so they can only be accessed through my application's pages, not via direct URL navigation.

## Current Architecture
- **Framework**: Next.js 15+ with App Router
- **API Routes**: Located in `src/app/api/` directory
- **Network Layer**: Custom NetworkLayer class in `src/network/`
- **Client Network**: NetworkClient class in `src/lib/networkClient.ts`
- **Authentication**: Token-based auth stored in cookies
- **TypeScript**: Full TypeScript implementation

## Objective
Implement a security system that:
1. Prevents direct browser access to API endpoints (e.g., typing `http://localhost:3000/api/projects/5`)
2. Allows access only when requests come from the application's internal pages
3. Validates authentication for protected routes
4. Uses a custom header approach that can only be set via JavaScript fetch

## Required Implementation

### Step 1: Create Security Utility
Create `src/lib/utils/apiSecurity.ts` with the following features:
- Custom header constant (`x-internal-request`)
- `verifyInternalApiRequest(request, requireAuth)` function that:
  - Validates the custom header presence
  /* Lines 28-30 omitted */
  - Returns error object or null
- `getInternalApiHeaders()` function that returns headers for client-side requests

**Security Checks Required:**
1. Custom header must be present and match expected value
2. Authentication token must exist in cookies (for protected routes)
3. Origin/referer validation (same-origin check)

### Step 2: Update Network Client
Update `src/lib/networkClient.ts` to automatically inject internal API headers:
- Modify `get()`, `post()`, `put()`, `delete()` methods
- Add `...getInternalApiHeaders()` to all request headers
- Preserve existing headers (merge, don't override)
- Handle both FormData and JSON body types

**Important**: Headers should be added BEFORE any custom headers to allow overrides if needed.

### Step 3: Secure All API Routes
For EVERY file matching `src/app/api/**/route.ts`:

#### Protected Routes (require authentication):
```typescript
import { verifyInternalApiRequest } from '@/lib/utils/apiSecurity';

export async function [METHOD](request: NextRequest, ...params) {
  // Add this at the very start
  /* Lines 56-70 omitted */  
  // Existing code...
}
```

#### Public Routes (no authentication required):
For routes like signin, signup, public endpoints:
```typescript
const authError = verifyInternalApiRequest(request, false);
```

### Step 4: Identify All API Routes
Please scan the project and identify:
1. All API route files in `src/app/api/`
2. Categorize them as:
   - **Protected** (requires authentication): CRUD operations, user data, etc.
   - **Public** (no authentication): signin, signup, public content
3. Apply appropriate security checks to each

### Step 5: Create Documentation
Create `API_SECURITY.md` documenting:
- Security strategy and implementation
- How to use `verifyInternalApiRequest()`
- Updated files list
- Testing instructions
- Migration guide for future API routes

## Technical Requirements

### Import Statement Pattern
All API routes need:
```typescript
import { verifyInternalApiRequest } from '@/lib/utils/apiSecurity';
```

### Error Response Format
Use the existing error response format from the project:
```typescript
{
  code: number,
  /* Lines 109-112 omitted */
  data: null
}
```

### NetworkClient Method Updates
For each method (get, post, put, delete):
- FormData requests: Don't override Content-Type
- JSON requests: Include Content-Type: 'application/json'
- Always include internal API headers
- Maintain existing functionality

## Expected Deliverables

1. **Security Utility File**
   - `src/lib/utils/apiSecurity.ts` with full implementation
   /* Lines 127-128 omitted */
   - Comprehensive JSDoc comments

2. **Updated NetworkClient**
   - `src/lib/networkClient.ts` with header injection
   /* Lines 132-133 omitted */
   - Backward compatible with existing code
