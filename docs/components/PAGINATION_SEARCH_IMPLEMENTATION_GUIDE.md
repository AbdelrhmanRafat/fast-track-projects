# Reusable Server-Side Pagination and Search Pattern for Next.js 15

## Overview
This guide explains how to implement a **reusable server-side pagination and search pattern** in Next.js 15 with the App Router. This powerful pattern allows you to build high-performance, data-driven UI components—such as tables, lists, cards, or dashboards—where filtering and pagination only re-render the specific data view, not the entire page. This preserves the surrounding UI and state, creating a seamless user experience.

---

## Architecture Pattern

### 🎯 Key Concept
The implementation uses **Next.js Server Components** with **URL-based state management** to achieve:
- Server-side data fetching (no client-side API calls)
- Automatic page revalidation on navigation
- Preserved UI state (headers, search forms, etc.)
- Only the data display (e.g., list, cards, dashboard widgets) re-renders on pagination/search

---

## File Structure

A typical implementation of this pattern involves three key files:

```
app/(dashboard)/items/       # Example route
├── page.tsx               # Server Component: Fetches data based on URL params.
├── ItemsList.tsx          # Client Component: Renders the UI (list, cards, etc.) and handles user interactions.
└── loading.tsx            # Loading UI: Displayed via a Suspense boundary during data fetching.
```

---

## Implementation Steps

### Step 1: Define TypeScript Types

Create types for your API request parameters and the expected response structure. This example uses a generic `Item` type.

```typescript
// lib/types/api.ts
export interface GetItemsParams {
  page: number;
  status?: string;
  search?: string;
  category?: string;
  // Add other filterable properties as needed
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  per_page: number;
  current_page: number;
  total_pages: number;
}

// Example of a specific item type
export interface Item {
  id: string;
  name: string;
  // ... other properties
}
```

---

### Step 2: Create a Reusable API Service Function

Create a generic service function that constructs a GET request with dynamic query parameters. This function can be reused for fetching different types of data.

```typescript
// lib/services/api.ts
import NetworkLayer from '@/network';
import { PaginatedResponse, GetItemsParams } from '../types/api';

export async function getItems<T>(endpoint: string, params: GetItemsParams): Promise<PaginatedResponse<T>> {
  try {
    const api = await NetworkLayer.createWithAutoConfig();

    // Build query params dynamically
    const query = new URLSearchParams();
    
    // Required parameter
    query.append("page", params.page.toString());
    
    // Optional parameters (only add if they exist)
    if (params.status) query.append("status", params.status);
    if (params.search) query.append("search", params.search);
    if (params.category) query.append("category", params.category);

    const response = await api.get<PaginatedResponse<T>>(`${endpoint}?${query.toString()}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}
```

**Key Points:**
- Use `URLSearchParams` to build clean query strings
- Only append parameters that have values (optional filtering)
- Handle errors appropriately

---

### Step 3: Create the Server Component (page.tsx)

This is the **Server Component** responsible for fetching data on the server based on the URL search parameters.

```typescript
// app/(dashboard)/items/page.tsx
import { Suspense } from 'react';
import { PaginatedResponse, GetItemsParams, Item } from '@/lib/types/api';
import ItemsList from './ItemsList';
import DataLoadingComponent from './loading';
import { getItems } from '@/lib/services/api';

interface ItemsPageProps {
  searchParams: Promise<{ 
    page?: string;
    status?: string;
    search?: string;
    category?: string;
  }>;
}

// Server component that fetches data
async function ItemsContent({ searchParams }: ItemsPageProps) {
  let itemsResponse: PaginatedResponse<Item> | null = null;
  
  try {
    // IMPORTANT: Await searchParams in Next.js 15
    const params = await searchParams;
    
    // Parse page number from URL, default to 1
    const page = parseInt(params.page || '1', 10);
    
    // Build search parameters object
    const searchItemsParams: GetItemsParams = {
      page: page,
    };
    
    // Add optional search filters if they exist in URL
    if (params.status) searchItemsParams.status = params.status;
    if (params.search) searchItemsParams.search = params.search;
    if (params.category) searchItemsParams.category = params.category;
    
    // Server-side API call
    itemsResponse = await getItems<Item>('/items', searchItemsParams);
    
    return (
      <ItemsList 
        initialData={itemsResponse} 
        currentPage={page}
        searchParams={searchItemsParams}
      />
    );
  } catch (error) {
    console.error('Failed to fetch items:', error);
    // Return the component with null data for error handling
    return (
      <ItemsList 
        initialData={null} 
        currentPage={1}
        searchParams={{ page: 1 }}
      />
    );
  }
}

// Main page component with Suspense boundary
export default function ItemsPage({ searchParams }: ItemsPageProps) {
  return (
    <Suspense fallback={<DataLoadingComponent />}>
      <ItemsContent searchParams={searchParams} />
    </Suspense>
  );
}
```

**Critical Points:**

1. **Next.js 15 Breaking Change:** `searchParams` is now a Promise and MUST be awaited
2. **Server Component:** This component runs on the server, not the client
3. **Suspense Boundary:** Wraps async component to show loading state
4. **Error Handling:** Returns table with null data if fetch fails
5. **URL-Based State:** All filters come from URL parameters

---

### Step 4: Create the Client Component (e.g., `ItemsList.tsx`)

This is the **Client Component** that renders the UI and handles all user interactions, such as pagination and search form submissions.

```typescript
// app/(dashboard)/items/ItemsList.tsx
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PaginatedResponse, GetItemsParams, Item } from '@/lib/types/api';
import { Pagination } from '@/components/ui/Pagination';
import SearchComponent from '@/components/ui/SearchComponent';
import { Card, CardContent } from '@/components/ui/card'; // Example UI component

interface ItemsListProps {
  initialData: PaginatedResponse<Item> | null;
  currentPage: number;
  searchParams: Partial<GetItemsParams>;
}

export default function ItemsList({ 
  initialData, 
  currentPage, 
  searchParams 
}: ItemsListProps) {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<Item> | null>(initialData);
  const [loading, setLoading] = useState(false);

  // Update data when prop changes (after server-side refetch)
  useEffect(() => {
    setData(initialData);
    setLoading(false); // Reset loading state
  }, [initialData]);

  // Handle search submission
  const handleSearch = (values: Record<string, any>) => {
    setLoading(true);
    
    // Build URL with new search parameters
    const url = new URL(window.location.href);
    
    // Clear existing search params before adding new ones
    url.searchParams.delete('status');
    url.searchParams.delete('search');
    url.searchParams.delete('category');
    
    // Add new search params (only if they have values)
    if (values.status) url.searchParams.set('status', values.status);
    if (values.search) url.searchParams.set('search', values.search);
    if (values.category) url.searchParams.set('category', values.category);
    
    // Reset to page 1 for new searches
    url.searchParams.set('page', '1');
    
    // Navigate to trigger server-side refetch
    router.push(url.pathname + url.search);
  };

  // Handle pagination change
  const handlePageChange = (page: number) => {
    setLoading(true);
    
    // Navigate to the new page
    const url = new URL(window.location.href);
    url.searchParams.set('page', page.toString());
    router.push(url.pathname + url.search);
  };

  // Handle error state
  if (!data) {
    return <ErrorDisplay message="Could not load items." />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header - Remains static */}
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Items</h1>
        <p className="text-sm text-muted-foreground">Browse and manage items</p>
      </div>

      {/* Search Component - Remains static */}
      <SearchComponent
        config={searchConfig} // Defined elsewhere
        onSearch={handleSearch}
        initialValues={searchParams}
      />

      {/* Data Display - This is the part that re-renders */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${loading ? 'opacity-50' : ''}`}>
        {data.data.map(item => (
          <Card key={item.id}>
            <CardContent>{item.name}</CardContent>
          </Card>
        ))}
      </div>
      {data.data.length === 0 && <p>No items found.</p>}

      {/* Pagination - Remains static */}
      <Pagination
        currentPage={currentPage}
        totalPages={data.total_pages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
```

**Critical Points:**

1. **"use client" Directive:** Required for interactive components
2. **Loading State:** Set when user triggers navigation
3. **useEffect Hook:** Updates data when server component re-renders
4. **URL Navigation:** Use `router.push()` to update URL parameters
5. **Preserved UI:** Header, search form, and pagination UI stay intact

---

### Step 5: Create a Generic Loading Component

Create a loading component that will be displayed as a fallback by the Suspense boundary. This can be a skeleton version of your data display.

```typescript
// app/(dashboard)/items/loading.tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function DataLoadingComponent() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  );
}
```

---

## How It Works: The Complete Flow

The magic of this pattern is in how Next.js handles navigation.

### Initial Page Load
```
User visits /items
    ↓
Server Component (`page.tsx`) runs on the server
    ↓
Fetches initial data using `getItems()`
    ↓
Passes data as props to the Client Component (`ItemsList.tsx`)
    ↓
Client Component renders the initial list of items
```

### Pagination Click
```
User clicks "Page 2"
    ↓
`handlePageChange()` in the client sets a local `loading` state to true
    ↓
`router.push('/items?page=2')` updates the URL
    ↓
Next.js automatically re-runs the Server Component on the server with the new `searchParams`
    ↓
Server Component fetches page 2 data via `getItems({ page: 2 })`
    ↓
Client Component receives the new data via props
    ↓
`useEffect` hook updates the component's state, re-rendering the list and setting `loading` to false
    ↓
Only the item list re-renders; the header, search form, and pagination controls remain unchanged
```

### Search Submission
```
User submits a search (e.g., status = "active")
    ↓
`handleSearch()` builds the new URL
    ↓
`router.push('/items?status=active&page=1')` updates the URL
    ↓
Server Component re-runs with the new `searchParams`
    ↓
Fetches filtered data via `getItems({ page: 1, status: 'active' })`
    ↓
Client Component receives the filtered data
    ↓
The item list updates with the filtered results
```

---

## Key Principles

### ✅ DO:
- Use Server Components for all data fetching.
- Store all filter and pagination state in URL parameters.
- Use `router.push()` to trigger navigation and server-side data refetching.
- Use a `useEffect` hook in the Client Component to update its state when new data is passed as props.
- Implement a local `loading` state in the Client Component to provide immediate UI feedback.
- Handle data fetching errors gracefully and display a fallback UI.

### ❌ DON'T:
- Make API calls directly from Client Components.
- Store pagination or filter state exclusively in React state (`useState`).
- Use `router.refresh()`, as it causes a full-page reload, defeating the purpose of this pattern.
- Forget to `await searchParams` in Next.js 15 Server Components.
- Ignore error states; always have a fallback.

---

## Advanced: Search Component Integration

For complex filtering, you can use a dedicated `SearchComponent`. The configuration should match the parameters your API expects.

### Search Field Configuration
```typescript
const searchConfig: SearchComponentConfig = {
  title: "Filter Items",
  gridCols: 3, // Example layout
  fields: [
    {
      key: 'search',
      type: 'text',
      label: "Search",
      placeholder: 'Search by name or description...',
      gridCols: 1,
    },
    {
      key: 'status',
      type: 'select',
      label: "Status",
      placeholder: 'Any Status',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
      gridCols: 1,
    },
    {
      key: 'category',
      type: 'select',
      label: "Category",
      placeholder: 'Any Category',
      options: [
        { value: 'electronics', label: 'Electronics' },
        { value: 'clothing', label: 'Clothing' },
      ],
      gridCols: 1,
    },
  ],
};
```

### Important Notes:
- Match the `key` of each field to the corresponding parameter in your `GetItemsParams` type and API endpoint.
- The `initialValues` for the search component should be populated from the `searchParams` prop passed to your Client Component.

---

## Troubleshooting

### Issue: The entire page reloads on filter or pagination.
**Solution:** You are likely using `router.refresh()`. Switch to `router.push()` to update the URL and trigger a soft navigation.

### Issue: Data doesn't update after navigation.
**Solution:** Check the `useEffect` dependency array in your Client Component. It must include the prop that carries the initial data (e.g., `initialData`).
```typescript
useEffect(() => {
  setData(initialData);
  setLoading(false);
}, [initialData]); // ← This dependency is crucial!
```

### Issue: `searchParams` is undefined or causes an error.
**Solution:** In Next.js 15, the `searchParams` object in Server Components is a `Promise`. You must `await` it before accessing its properties.
```typescript
const params = await searchParams; // ← Don't forget to await!
```

### Issue: The loading indicator gets stuck.
**Solution:** Ensure you are resetting the `loading` state to `false` inside the `useEffect` hook that runs after the data has been updated.

---

## Benefits of This Pattern

1.  **High Performance:** Minimizes client-side JavaScript and leverages server-side rendering for speed.
2.  **Excellent UX:** The UI remains stable and responsive, as only the necessary data components re-render.
3.  **SEO Friendly:** Content is rendered on the server, and stateful URLs are easily indexable.
4.  **Sharable & Bookmarkable State:** URLs with query parameters capture the exact state of the view, making it easy to share and bookmark.
5.  **Robust and Scalable:** The pattern is type-safe, easy to debug, and scales well as you add more filters and complexity.

---

## Checklist for Implementation

- [ ] Define TypeScript types for API parameters (`GetItemsParams`) and the response (`PaginatedResponse<T>`).
- [ ] Create a reusable API service function (`getItems`) that builds the query dynamically.
- [ ] Create the main page as a Server Component that `await`s `searchParams`.
- [ ] Wrap the data-fetching logic in a `<Suspense>` boundary with a `loading.tsx` fallback.
- [ ] Create a Client Component (`"use client"`) to render the UI and handle interactions.
- [ ] Implement `handleSearch` and `handlePageChange` functions that use `router.push()` to update the URL.
- [ ] Add a `useEffect` hook to sync the data prop with the component's state.
- [ ] Test pagination, searching, and combined filters to ensure only the data view re-renders.

---

## Example API Request Flow

### Request 1: Initial Load
`GET /api/items?page=1`

### Request 2: After a Search
`GET /api/items?page=1&status=active&search=laptop`

### Request 3: After Paginating on the Searched Results
`GET /api/items?page=2&status=active&search=laptop`

---

## Conclusion

This server-centric pattern fully leverages the power of Next.js 15 and the App Router to create fast, scalable, and user-friendly interfaces for paginated and searchable data. By keeping state in the URL and letting Server Components handle data fetching, you achieve an optimal balance of performance and modern UX.

Apply this exact pattern to any data-driven component with pagination and filtering needs in Next.js 15!