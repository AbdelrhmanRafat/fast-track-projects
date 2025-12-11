# Quick Start Prompt: API Security Implementation

Copy and paste this prompt to apply the same security implementation to any similar Next.js project:

---

I need to secure all API routes in my Next.js 15+ application to prevent direct browser access. The project uses:
- App Router with API routes in `src/app/api/`
- Custom NetworkLayer in `src/network/`
- NetworkClient in `src/lib/networkClient.ts`
- Token-based authentication with cookies

**Requirements:**

1. **Create `src/lib/utils/apiSecurity.ts`** with:
   - Custom header validation (`x-internal-request: true`)
   - `verifyInternalApiRequest(request, requireAuth = true)` function that checks:
     - Custom header presence (prevents direct browser access)
     - Authentication token in cookies (if requireAuth is true)
     - Origin/referer validation
   - `getInternalApiHeaders()` function returning `{ 'x-internal-request': 'true' }`
   - Returns `{ error: string, status: number } | null`

2. **Update `src/lib/networkClient.ts`** to inject headers automatically:
   ```typescript
   // Add import
   import { getInternalApiHeaders } from '@/lib/utils/apiSecurity';
   
   // Update all methods (get, post, put, delete) to include:
   headers: {
     ...getInternalApiHeaders(),
     ...existingHeaders,
   }
   ```

3. **Update ALL API routes** (`src/app/api/**/route.ts`):
   
   **For protected routes** (requires auth):
   ```typescript
   import { verifyInternalApiRequest } from '@/lib/utils/apiSecurity';
   
   export async function METHOD(request: NextRequest, ...params) {
     const authError = verifyInternalApiRequest(request);
     if (authError) {
       return NextResponse.json(
         {
           code: authError.status,
           status: authError.status,
           message: authError.error,
           errors: null,
           data: null
         },
         { status: authError.status }
       );
     }
     // existing code...
   }
   ```
   
   **For public routes** (signin, signup):
   ```typescript
   const authError = verifyInternalApiRequest(request, false);
   ```

4. **Create `API_SECURITY.md`** documenting the implementation

**Action Plan:**
1. Scan all files matching `src/app/api/**/route.ts`
2. Categorize as protected (CRUD, user data) or public (auth endpoints)
3. Apply security checks systematically
4. Test that direct browser access returns 403
5. Verify application pages still work normally

**Expected Result:**
- Typing `http://localhost:3000/api/projects/5` in browser → 403 Forbidden
- Using application normally → Works perfectly
- All API requests include `x-internal-request` header automatically

Please implement this security system across all API routes in the project.
