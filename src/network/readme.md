# Network Layer Documentation

## 📑 Table of Contents

- [🚨 CRITICAL: Security Architecture](#-critical-security-architecture)
  - [Security Rule](#security-rule)
  - [Why This Matters](#why-this-matters)
- [📚 Request Patterns](#-request-patterns)
  - [Response Types](#response-types)
  - [Import Statement](#import-statement)
- [🔄 GET Request Patterns](#-get-request-patterns)
  - [Pattern 1: Server-Side GET (Direct NetworkLayer)](#pattern-1-server-side-get-direct-networklayer)
  - [Pattern 2: Client-Side GET (Through API Route)](#pattern-2-client-side-get-through-api-route)
- [📝 POST/PUT/DELETE Request Pattern](#-postputdelete-request-pattern)
  - [Response Type](#response-type-1)
  - [Complete Example: Update Company](#complete-example-update-company)
  - [DELETE Request Example](#delete-request-example)
- [📨 Backend Message Extraction](#-backend-message-extraction)
  - [Supported Backend Response Formats](#supported-backend-response-formats)
  - [ApiResponse Type](#apiresponse-type)
- [🖥️ NetworkClient (Client-Side Requests)](#️-networkclient-client-side-requests)
  - [Import NetworkClient](#import-networkclient)
  - [NetworkClient Methods](#networkclient-methods)
  - [Disabling Modal Messages](#disabling-modal-messages)
- [❌ Common Mistakes to Avoid](#-common-mistakes-to-avoid)
  - [DON'T: Use NetworkLayer in Client Components](#dont-use-networklayer-in-client-components)
  - [DON'T: Wrong Response Types](#dont-wrong-response-types)
  - [DON'T: Use Direct NetworkLayer for Client-Side GET](#dont-use-direct-networklayer-for-client-side-get)
  - [DON'T: Manual Cookie Handling in Next.js 15+](#dont-manual-cookie-handling-in-nextjs-15)
- [🔧 Troubleshooting](#-troubleshooting)
  - [Next.js 15+ Headers Warning](#nextjs-15-headers-warning)
  - [Authentication Not Working](#authentication-not-working)
- [🚀 Best Practices](#-best-practices)
  - [Security](#security)
  - [Type Safety](#type-safety)
  - [Error Handling](#error-handling)
  - [User Experience](#user-experience)
  - [Code Organization](#code-organization)
- [❓ FAQ (Frequently Asked Questions)](#-faq-frequently-asked-questions)
- [📖 Summary](#-summary)
  - [Request Patterns Summary](#request-patterns-summary)
  - [Key Points](#key-points)

---

## 🚨 CRITICAL: Security Architecture

**NEVER use NetworkLayer directly in client components**

The NetworkLayer implements a security-first architecture that prevents external API URLs from being exposed in the browser's network tab.

### Security Rule

All client-side requests MUST follow this pattern:
```
Client Component → /api/route → NetworkLayer → External API
```

### Why This Matters

**Without this pattern:**
- ❌ External API URLs exposed in network tab
- ❌ API endpoints and structure visible
- ❌ Security vulnerabilities
- ❌ Backend infrastructure details leaked

**With NetworkLayer architecture:**
- ✅ Only your domain appears in network tab
- ✅ External API URLs completely hidden
- ✅ Centralized security and auth management
- ✅ Production-ready security

## 📚 Request Patterns

### Response Types

All service functions must return consistent response types:

- **GET Requests**: `Promise<ApiResponse<T> | null>`
  - The generic type `T` is imported from `@/lib/types/response`
  - Example: `Promise<ApiResponse<CompaniesData> | null>`

- **POST/PUT/DELETE Requests**: `Promise<ApiResponse<any> | null>`
  - Always return `ApiResponse<any>` for POST, PUT, and DELETE operations

### Import Statement

Always import the ApiResponse type:

```typescript
import type { ApiResponse } from '@/lib/types/response';
```

## 🔄 GET Request Patterns

GET requests have **two valid implementation approaches** depending on where they're called:

### Pattern 1: Server-Side GET (Direct NetworkLayer)

**Use when:** Called directly from server-side code (e.g., inside `page.tsx` without "use client")

**Example:** `getCompanies` function

```typescript
// src/lib/services/companies.ts
import { NetworkLayer } from '@/network';
import type { ApiResponse } from '@/lib/types/response';
import type { CompaniesData } from '@/lib/types/companies';

export async function getCompanies(
  page: number = 1, 
  keyword: string = ''
): Promise<ApiResponse<CompaniesData> | null> {
  try {
  const api = await NetworkLayer.createWithAutoConfig();
    const res = await api.get<ApiResponse<CompaniesData>>(
      `/companies?page=${page}&keyword=${keyword}`
    );
    return res.data;
  } catch (error: any) {
    console.error('Error fetching companies:', error);
    return null;
  }
}
```

**Usage in Server Component:**

```typescript
// src/app/(dashboard)/companies/page.tsx
import { getCompanies } from '@/lib/services/companies';

export default async function CompaniesPage() {
  const companies = await getCompanies(1, '');
  
  if (!companies) {
    return <div>Failed to load companies</div>;
  }
  
  return <div>{/* Render companies */}</div>;
}
```

### Pattern 2: Client-Side GET (Through API Route)

**Use when:** Called from client-side code (e.g., inside component with "use client")

**Example:** `getAllCompanies` function

**Step 1: Service Function (Client-Side)**

```typescript
// src/lib/services/companies.ts
import networkClient from '@/lib/networkClient';
import type { ApiResponse } from '@/lib/types/response';
import type { Company } from '@/lib/types/companies';

export async function getAllCompanies(
  keyword: string = ""
): Promise<ApiResponse<Company[]> | null> {
  try {
    // Client-side should call internal API route
    const query = keyword ? `?keyword=${encodeURIComponent(keyword)}` : '';
    const resp = await networkClient.get(`/api/companies${query}`);
    const result = await resp.json();

    if (!resp.ok) {
      throw new Error(result.error || 'Failed to fetch companies');
    }

    return result as ApiResponse<Company[]>;
  } catch (error: any) {
    console.error('Error fetching all companies:', error);
    return null;
  }
}
```

**Step 2: API Route**

```typescript
// src/app/api/companies/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { NetworkLayer } from '@/network';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword') || '';

    const api = await NetworkLayer.createWithAutoConfig();
    const res = await api.get(
      `/companies?return_all=1&keyword=${encodeURIComponent(keyword)}`
    );

    return NextResponse.json(res.data);
  } catch (error: any) {
    console.error('Error in /api/companies route:', error);
    return NextResponse.json(
      { 
        code: error.status || 500,
        status: error.status || 500,
        message: error.message || 'Server error',
        errors: null,
        data: null
      },
      { status: error.status || 500 }
    );
  }
}
```

**Step 3: Client Component Usage**

```typescript
// src/components/CompanyList.tsx
'use client';

import { getAllCompanies } from '@/lib/services/companies';
import { useState, useEffect } from 'react';

export default function CompanyList() {
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    getAllCompanies().then((result) => {
      if (result) {
        setCompanies(result.data);
      }
    });
  }, []);

  return <div>{/* Render companies */}</div>;
}
```

## 📝 POST/PUT/DELETE Request Pattern

**All POST, PUT, and DELETE requests are always made through API routes using networkClient.**

### Response Type

All POST/PUT/DELETE service functions must return:

```typescript
Promise<ApiResponse<any> | null>
```

### Complete Example: Update Company

**Step 1: Service Function**

```typescript
// src/lib/services/companies.ts
import networkClient from '@/lib/networkClient';
import type { ApiResponse } from '@/lib/types/response';
import type { Company } from '@/lib/types/companies';
import type { UpdateCompanyForm } from '@/lib/types/companies';

export async function updateCompany(
  companyId: string | number, 
  companyData: UpdateCompanyForm
): Promise<ApiResponse<any> | null> {
  try {
    // Create FormData for file uploads with _method override
    const formData = new FormData();
    formData.append('_method', companyData._method);
    formData.append('category_id', companyData.category_id.toString());
    formData.append('name', companyData.name);
    formData.append('description', companyData.description);
    formData.append('active', companyData.active.toString());
    formData.append('verified', companyData.verified.toString());
    formData.append('rejection_reason', companyData.rejection_reason);

    // Add file uploads
    if (companyData.logo) {
      formData.append('logo', companyData.logo);
    }
    if (companyData.banner) {
      formData.append('banner', companyData.banner);
    }
    if (companyData.portfolio) {
      formData.append('portfolio', companyData.portfolio);
    }

    // Add arrays
    companyData.services.forEach((serviceId, index) => {
      formData.append(`services[${index}]`, serviceId.toString());
    });

    companyData.sub_categories.forEach((subCategoryId, index) => {
      formData.append(`sub_categories[${index}]`, subCategoryId.toString());
    });

    const response = await networkClient.post(
      `/api/companies/${companyId}`, 
      formData
      // Optionally add { showMessage: false } to disable modal messages
    );
  const result = await response.json();
  
  if (!response.ok) {
      throw new Error(result.error || 'Failed to update company');
  }
  
  return result;
  } catch (error: any) {
    console.error(`Error updating company with ID ${companyId}:`, error);
    return null;
  }
}
```

**Step 2: API Route**

```typescript
// src/app/api/companies/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { NetworkLayer } from '@/network';
import type { ApiResponse } from '@/lib/types/response';
import type { Company } from '@/lib/types/companies';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Company> | ApiResponse<null>>> {
  try {
    const { id } = await params;
    const formData = await request.formData();
    
    const networkLayer = await NetworkLayer.createWithAutoConfig();
    const response = await networkLayer.post<ApiResponse<Company>>(
      `/companies/${id}`, 
      formData
    );
    
    // Return backend ApiResponse directly
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(`Error updating company with ID ${(await params).id}:`, error);

    // Extract backend message from error.details
    const d = error?.details;
    const backendMessage = (() => {
      if (!d) return error.message || 'Failed to update company';
      if (typeof d === 'string') return d;
      if (d.message) return d.message;
      if (d.error) {
        if (typeof d.error === 'string') return d.error;
        if (d.error.message) return d.error.message;
      }
      if (d.errors) {
        if (typeof d.errors === 'string') return d.errors;
        if (typeof d.errors === 'object') {
          const first = Object.values(d.errors)[0];
          if (Array.isArray(first) && first.length > 0) {
            return String(first[0]);
          }
        }
      }
      if (d.msg) return d.msg;
      return error.message || 'Failed to update company';
    })();

    return NextResponse.json(
      {
        code: error.status || 500,
        status: error.status || 500,
        message: backendMessage,
        errors: null,
        data: null
      },
      { status: error.status || 500 }
    );
  }
}
```

### DELETE Request Example

**Service Function:**

```typescript
// src/lib/services/companies.ts
export async function deleteCompany(
  companyId: string | number
): Promise<ApiResponse<any> | null> {
  try {
    const response = await networkClient.delete(`/api/companies/${companyId}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete company');
    }

    return result as ApiResponse<null>;
    } catch (error: any) {
    console.error(`Error deleting company with ID ${companyId}:`, error);
    return null;
  }
}
```

**API Route:**

```typescript
// src/app/api/companies/[id]/route.ts
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { id } = await params;
    const networkLayer = await NetworkLayer.createWithAutoConfig();
    const response = await networkLayer.delete<ApiResponse<null>>(
      `/companies/${id}`
    );

    // Return backend ApiResponse directly
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(`Error deleting company with ID ${(await params).id}:`, error);
    return NextResponse.json(
      {
        code: error.status || 500,
        status: error.status || 500,
        message: error.message || 'Failed to delete company',
        errors: null,
        data: null,
      },
      { status: error.status || 500 }
    );
  }
}
```

## 📨 Backend Message Extraction

When handling errors from NetworkLayer, the backend response is available in `error.details`. Use this pattern to extract meaningful error messages:

```typescript
// Extract backend message from error.details
const d = error?.details;
const backendMessage = (() => {
  if (!d) return error.message || 'Operation failed';
  if (typeof d === 'string') return d;
  if (d.message) return d.message;
  if (d.error) {
    if (typeof d.error === 'string') return d.error;
    if (d.error.message) return d.error.message;
  }
  if (d.errors) {
    if (typeof d.errors === 'string') return d.errors;
    if (typeof d.errors === 'object') {
      const first = Object.values(d.errors)[0];
      if (Array.isArray(first) && first.length > 0) {
        return String(first[0]);
      }
    }
  }
  if (d.msg) return d.msg;
  return error.message || 'Operation failed';
})();
```

### Supported Backend Response Formats

1. **String response**: `"Error message"`
2. **Standard object**: `{ message: "Error message" }`
3. **Error property**: `{ error: "Error message" }` or `{ error: { message: "Error message" } }`
4. **Laravel validation**: `{ errors: { field: ["First error", "Second error"] } }`
5. **Express.js style**: `{ msg: "Error message" }`

### ApiResponse Type

All API responses follow this structure:

```typescript
interface ApiResponse<T> {
  code: number;
  status: number;
  message: string;
  errors: null | string | string[];
  data: T;
}
```

## 🖥️ NetworkClient (Client-Side Requests)

NetworkClient is used for client-side requests to your own API routes. It provides automatic loading states, error handling, and UI feedback.

### Import NetworkClient

```typescript
import networkClient from '@/lib/networkClient';
```

### NetworkClient Methods

#### GET Requests

```typescript
const response = await networkClient.get('/api/companies?keyword=test');
const result = await response.json();
```

#### POST Requests

```typescript
// JSON data (with default modal messages)
const response = await networkClient.post('/api/companies', {
  name: 'Company Name',
  description: 'Description'
});

// JSON data (disable modal messages)
const response = await networkClient.post('/api/auth/signin', signInData, {
  showMessage: false
});

// FormData (automatic detection)
const formData = new FormData();
formData.append('name', 'Company Name');
formData.append('logo', file);
const response = await networkClient.post('/api/companies', formData);

// FormData with disabled messages
const formData = new FormData();
formData.append('name', 'Company Name');
const response = await networkClient.post('/api/auth/signin', formData, {
  showMessage: false
});
```

#### DELETE Requests

```typescript
// With default modal messages
const response = await networkClient.delete('/api/companies/123');
const result = await response.json();

// Disable modal messages
const response = await networkClient.delete('/api/companies/123', {
  showMessage: false
});
const result = await response.json();
```

### Disabling Modal Messages

By default, `networkClient` displays modal messages for success and error responses. For certain requests (like authentication flows), you may want to handle messages manually using the `{ showMessage: false }` option.

#### When to Disable Modal Messages

- **Authentication flows** (sign in, sign out) - Custom redirect handling
- **Background operations** - Silent updates that shouldn't interrupt UX
- **Custom error handling** - When you want to display errors in specific UI components

#### Example: Authentication Service

```typescript
// src/lib/services/auth.ts
import networkClient from '@/lib/networkClient';
import type { ApiResponse } from '@/lib/types/response';
import type { SignInRequest } from '@/lib/types/signin';
import { setToken, clearAuthCookies } from '@/lib/cookies';

/**
 * Sign in user with email/phone and password
 * @param signInData - User credentials (field and password)
 * @returns Promise with message from response
 */
export async function signIn(
  signInData: SignInRequest
): Promise<{ message: string; token?: string } | null> {
  try {
    // Disable modal messages for custom handling
    const response = await networkClient.post(
      '/api/auth/signin', 
      signInData, 
      { showMessage: false }
    );
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to sign in');
    }
    
    // Store the token in cookies if present in the response
    if (result.data?.token) {
      setToken(result.data.token);
    } else {
      console.warn('No token received in response');
    }
    
    // Return the full result from the API response
    return result;
  } catch (error: any) {
    console.error('Sign in service error:', error);
    return null;
  }
}

/**
 * Logout user and clear authentication cookies
 * @returns Promise with message from response
 */
export async function logout(): Promise<{ message: string } | null> {
  try {
    // Disable modal messages for custom handling
    const response = await networkClient.post(
      '/api/auth/logout', 
      {}, 
      { showMessage: false }
    );
    const result = await response.json();
    
    if (!response.ok) {
      // If the API returns an error, do not clear cookies - keep user authenticated
      throw new Error(result.message || 'Failed to logout');
    }
    
    // Clear authentication cookies only on successful logout (200 status)
    clearAuthCookies();
    
    // Return the message from the API response
    return result;
  } catch (error: any) {
    console.error('Logout service error:', error);
    // Do not clear cookies on any error - keep user authenticated
    return null;
  }
}
```

#### Example: Update with Disabled Messages

```typescript
// src/lib/services/companies.ts
export async function updateCompany(
  companyId: string | number, 
  companyData: UpdateCompanyForm
): Promise<ApiResponse<any> | null> {
  try {
    const formData = new FormData();
    formData.append('_method', companyData._method);
    formData.append('name', companyData.name);
    // ... other fields

    // Disable modal messages for silent update
    const response = await networkClient.post(
      `/api/companies/${companyId}`, 
      formData,
      { showMessage: false } // Disable automatic modal messages
    );
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to update company');
    }
    
    return result;
  } catch (error: any) {
    console.error(`Error updating company with ID ${companyId}:`, error);
    return null;
  }
}
```

#### NetworkClient Options

```typescript
interface RequestOptions {
  showMessage?: boolean;    // Show success/error modal messages (default: true)
  showLoading?: boolean;     // Show loading overlay (default: true for POST/PUT/DELETE)
  headers?: Record<string, string>; // Custom headers
}
```

**Notes:**
- `showMessage: false` disables automatic modal messages, but you still need to handle errors manually
- Response type remains the same: `Promise<ApiResponse<any> | null>`
- The request structure is identical - only the options parameter changes

## ❌ Common Mistakes to Avoid

### DON'T: Use NetworkLayer in Client Components

```typescript
// ❌ NEVER do this in client components
'use client';

function MyComponent() {
  useEffect(() => {
    const api = await NetworkLayer.createWithAutoConfig(); // WRONG
    api.get('/companies').then(setCompanies);
  }, []);
}
```

### DON'T: Wrong Response Types

```typescript
// ❌ WRONG - GET should return ApiResponse<T>
export async function getCompanies(): Promise<any> { }

// ✅ CORRECT - GET returns ApiResponse<T> | null
export async function getCompanies(): Promise<ApiResponse<CompaniesData> | null> { }

// ❌ WRONG - POST/PUT/DELETE should return ApiResponse<any>
export async function updateCompany(): Promise<ApiResponse<Company> | null> { }

// ✅ CORRECT - POST/PUT/DELETE returns ApiResponse<any> | null
export async function updateCompany(): Promise<ApiResponse<any> | null> { }
```

### DON'T: Use Direct NetworkLayer for Client-Side GET

```typescript
// ❌ WRONG - Using NetworkLayer directly in client-side service
'use client';
export async function getAllCompanies() {
  const api = await NetworkLayer.createWithAutoConfig(); // WRONG
  const res = await api.get('/companies');
  return res.data;
}

// ✅ CORRECT - Use networkClient for client-side GET
'use client';
export async function getAllCompanies() {
  const resp = await networkClient.get('/api/companies'); // CORRECT
  const result = await resp.json();
  return result;
}
```

### DON'T: Manual Cookie Handling in Next.js 15+

```typescript
// ❌ WRONG - causes warnings in Next.js 15+
export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie');
  const api = new NetworkLayer({}, cookieHeader);
}

// ✅ CORRECT - use createWithAutoConfig
export async function GET(request: NextRequest) {
  const api = await NetworkLayer.createWithAutoConfig();
}
```

## 🔧 Troubleshooting

### Next.js 15+ Headers Warning

**Error:**
```
Route "/api/users" used `headers().get('cookie')` without awaiting `headers()`
```

**Solution:**
Always use `await NetworkLayer.createWithAutoConfig()` in API routes.

### Authentication Not Working

**Check:**
1. Cookies are being set correctly
2. Using `createWithAutoConfig()` in Next.js 15+
3. Not overriding auth with `{ auth: false }`

## 🚀 Best Practices

### Security
- Always use the correct pattern for server-side vs client-side GET requests
- Never expose external API URLs to client-side
- Use NetworkLayer only in API routes or server components

### Type Safety
- Always use `ApiResponse<T>` type for GET responses
- Always use `ApiResponse<any>` type for POST/PUT/DELETE responses
- Import `ApiResponse` from `@/lib/types/response`

### Error Handling
- Always wrap NetworkLayer calls in try-catch
- Extract backend messages from `error.details` using the provided pattern
- Return consistent `ApiResponse<T>` structure for all responses
- Log errors for debugging

### User Experience
- Use `{ showMessage: false }` for authentication flows and background operations
- Use default modal messages for user-facing operations (create, update, delete)
- Handle errors manually when modal messages are disabled

### Code Organization
- Keep services in `/lib/services/`
- Keep types in `/lib/types/`
- Keep API routes in `/app/api/`
- One service per domain (users, companies, etc.)

## ❓ FAQ (Frequently Asked Questions)

### When should I use server-side GET vs client-side GET?

**Use server-side GET (direct NetworkLayer)** when:
- The request is made in a server component (no "use client" directive)
- You need to fetch data during server-side rendering (SSR)
- Example: Fetching initial page data in `page.tsx`

**Use client-side GET (through API route)** when:
- The request is made in a client component (with "use client" directive)
- You need to fetch data based on user interactions (clicks, searches, etc.)
- Example: Fetching filtered results based on user input

### What's the difference between NetworkLayer and networkClient?

**NetworkLayer:**
- Server-side only
- Communicates directly with external APIs
- Hides external API URLs from browser
- Used in API routes or server components

**networkClient:**
- Client-side only
- Communicates with your own `/api/*` routes
- Provides automatic loading states and modal messages
- Used in client components and services

### Why do I need to use `createWithAutoConfig()` in Next.js 15+?

Next.js 15+ requires async handling of headers and cookies. `createWithAutoConfig()` automatically handles:
- Async cookie extraction
- Proper header management
- Environment-specific configuration

**Always use:**
```typescript
const api = await NetworkLayer.createWithAutoConfig();
```

### When should I disable modal messages with `{ showMessage: false }`?

Disable modal messages for:
- **Authentication flows** (sign in, sign out) - where you handle redirects manually
- **Background operations** - silent updates that shouldn't interrupt the user
- **Custom error handling** - when you want to display errors in specific UI components (forms, etc.)

**Keep modal messages enabled for:**
- Standard CRUD operations (create, update, delete)
- Operations where users expect immediate feedback
- Error messages that should be globally visible

### What should I return when an error occurs in a service function?

Always return `null` on error and let the caller handle the error state:

```typescript
export async function getCompanies(): Promise<ApiResponse<CompaniesData> | null> {
  try {
    // ... request logic
    return result;
  } catch (error: any) {
    console.error('Error:', error);
    return null; // Return null, let caller handle
  }
}
```

The caller can then check:
```typescript
const result = await getCompanies();
if (!result) {
  // Handle error case
}
```

### How do I handle file uploads with FormData?

FormData is automatically detected by NetworkLayer. Just create and pass FormData:

```typescript
const formData = new FormData();
formData.append('name', companyData.name);
formData.append('logo', companyData.logo); // File object

// For updates with _method override
formData.append('_method', 'PUT');

const response = await networkClient.post('/api/companies/123', formData);
```

### Why do POST/PUT/DELETE return `ApiResponse<any>` instead of specific types?

POST/PUT/DELETE operations may return different data structures depending on the backend response. Using `any` provides flexibility while maintaining type safety through the `ApiResponse` wrapper:

```typescript
Promise<ApiResponse<any> | null>
```

The `data` property will contain the actual response, and you can type it when consuming:

```typescript
const result = await updateCompany(id, data);
if (result) {
  const company = result.data as Company; // Type assertion when needed
}
```

### How do I extract error messages from the backend?

Use the provided pattern in API routes to extract backend messages from `error.details`:

```typescript
const d = error?.details;
const backendMessage = (() => {
  if (!d) return error.message || 'Operation failed';
  if (typeof d === 'string') return d;
  if (d.message) return d.message;
  // ... rest of extraction logic
})();
```

This handles multiple backend response formats (Laravel, Express, custom formats).

### Can I use NetworkLayer directly in client components?

**NO! Never use NetworkLayer in client components.** This would expose your external API URLs in the browser's network tab, creating security vulnerabilities.

**Instead:**
- Use `networkClient` for client-side requests
- Use NetworkLayer only in API routes or server components

### What's the correct response type for GET requests?

GET requests should always return:

```typescript
Promise<ApiResponse<T> | null>
```

Where `T` is the specific data type you're fetching:

```typescript
Promise<ApiResponse<CompaniesData> | null>
Promise<ApiResponse<Company[]> | null>
Promise<ApiResponse<User> | null>
```

### Do I need to create an API route for every client-side GET request?

Yes. Client-side GET requests must go through an API route to hide external API URLs. The pattern is:

1. **Client service** calls `/api/your-endpoint` using `networkClient`
2. **API route** at `/app/api/your-endpoint/route.ts` uses NetworkLayer to call external API
3. **External API** receives the request (URL hidden from browser)

### How do I handle arrays in FormData?

For array fields, append each element with indexed keys:

```typescript
// Array of IDs
companyData.services.forEach((serviceId, index) => {
  formData.append(`services[${index}]`, serviceId.toString());
});

// Array of objects (if needed)
companyData.items.forEach((item, index) => {
  formData.append(`items[${index}][name]`, item.name);
  formData.append(`items[${index}][value]`, item.value);
});
```

### What happens if I forget to await `createWithAutoConfig()`?

If you forget `await`, you'll get a promise object instead of the NetworkLayer instance, causing errors. **Always use await:**

```typescript
// ✅ CORRECT
const api = await NetworkLayer.createWithAutoConfig();

// ❌ WRONG - Missing await
const api = NetworkLayer.createWithAutoConfig();
```

### Can I customize the error messages shown in modals?

Yes, when you disable automatic modal messages with `{ showMessage: false }`, you can:
- Handle errors manually in your components
- Display custom error messages in forms or specific UI elements
- Control exactly where and how errors are shown

```typescript
const response = await networkClient.post('/api/endpoint', data, {
  showMessage: false
});

if (!response.ok) {
  const result = await response.json();
  // Display custom error message
  setError(result.message);
}
```

### How do I handle authentication errors?

Authentication errors are handled through cookies automatically. The NetworkLayer:
- Extracts auth tokens from cookies
- Includes them in request headers
- Handles token expiration gracefully

For custom auth handling (like sign in), use `{ showMessage: false }` and handle the response manually:

```typescript
const result = await signIn(credentials);
if (result?.data?.token) {
  // Token is automatically stored via setToken()
  router.push('/dashboard');
}
```

### What's the difference between GET response types?

**Server-side GET:**
- Returns `Promise<ApiResponse<T> | null>`
- Direct NetworkLayer call
- No API route needed

**Client-side GET:**
- Returns `Promise<ApiResponse<T> | null>`
- Uses networkClient → API route → NetworkLayer
- API route required

Both use the same response type, only the implementation pattern differs.

---

## 📖 Summary

### Request Patterns Summary

| Request Type | Server-Side GET | Client-Side GET | POST/PUT/DELETE |
|-------------|----------------|-----------------|-----------------|
| **Called From** | Server component | Client component | Client component |
| **Service Uses** | `NetworkLayer.createWithAutoConfig()` | `networkClient.get('/api/...')` | `networkClient.post/delete('/api/...')` |
| **API Route Needed** | ❌ No | ✅ Yes | ✅ Yes |
| **Response Type** | `Promise<ApiResponse<T> \| null>` | `Promise<ApiResponse<T> \| null>` | `Promise<ApiResponse<any> \| null>` |

### Key Points

- **GET Requests**: Two valid patterns - direct NetworkLayer (server-side) or networkClient (client-side)
- **POST/PUT/DELETE**: Always through API route using networkClient
- **Response Types**: `ApiResponse<T>` for GET, `ApiResponse<any>` for POST/PUT/DELETE
- **Modal Messages**: Use `{ showMessage: false }` option to disable automatic modal messages (e.g., for auth flows)
- **Security**: External API URLs remain hidden through proper architecture
- **Type Safety**: Always import and use `ApiResponse` type from `@/lib/types/response`

Follow these patterns for secure, maintainable API communication in your Next.js applications.