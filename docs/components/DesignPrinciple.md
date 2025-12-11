# Design Principles & Guidelines - Family App Dashboard

> **Version**: 3.0 | **Last Updated**: December 2025

This document outlines the design principles and implementation guidelines for the Family App Dashboard, ensuring consistency across all components.

---

## Table of Contents

1. [Quick Start - Essential Rules](#quick-start---essential-rules)
2. [Translation & Internationalization](#translation--internationalization)
3. [Design Rules](#design-rules)
4. [Page Creation Rules](#page-creation-rules)
5. [Component Standards](#component-standards)
6. [Middleware & Route Protection](#middleware--route-protection)
7. [NotFound Component Pattern](#notfound-component-pattern)
8. [Quick Reference Tables](#quick-reference-tables)

---

## Quick Start - Essential Rules

### ⚡ The 10 Golden Rules

| # | Rule | Details |
|---|------|---------|
| 1 | **No Static Text** | All UI text must use `t('key')` from `useTranslation` |
| 2 | **No Margins** | Use `flex`, `gap`, `space-y-*`, `space-x-*` only |
| 3 | **No Custom Colors** | Only use colors from `globals.css` |
| 4 | **No Custom Components** | Use shared components from `src/components/ui` |
| 5 | **No Extra Containers** | Layout handles all containers and padding |
| 6 | **No Layout Files** | Don't create `layout.tsx` for individual pages |
| 7 | **Use `public_id`** | For edit/delete/update operations, never use `id` |
| 8 | **SSR First** | Server-side data fetching in `page.tsx` |
| 9 | **Middleware Only** | Route protection via `src/middleware.ts` only |
| 10 | **RTL is Automatic** | No manual `dir` attributes needed |

---

## Translation & Internationalization

### ⚠️ CRITICAL: All Text Must Be Translated

**Every visible text in the UI must come from translation files. No exceptions.**

```tsx
// ❌ NEVER DO THIS
<h1>Products Management</h1>
<Button>Save</Button>

// ✅ ALWAYS DO THIS
<h1>{t('products.page.title')}</h1>
<Button>{t('common.save')}</Button>
```

### Using the Translation System

#### Step 1: Import the Hook

```tsx
import { useTranslation } from '@/components/providers/LanguageProvider';

export function MyComponent() {
  const { t, language, isRTL, switchLanguage } = useTranslation();
  
  return (
    <div>
      <h1>{t('myPage.title')}</h1>
      <p>{t('myPage.description')}</p>
    </div>
  );
}
```

#### Step 2: Add Keys to Translation File

> **Note**: This project uses Arabic-only translations. The `LanguageProvider` is configured with Arabic as the sole language and `isRTL` is always `true`.

**`src/lib/translations/ar.json`** (Single translation file)
```json
{
  "myPage": {
    "title": "عنوان صفحتي",
    "description": "وصف الصفحة هنا"
  }
}
```

### Translation Key Naming Convention

Follow this hierarchical pattern: `pageName.scope.key`

| Scope | Pattern | Example |
|-------|---------|---------|
| Page | `pageName.page.*` | `users.page.title`, `users.page.subtitle` |
| Form | `pageName.form.*` | `users.form.name.label`, `users.form.name.placeholder` |
| Table | `pageName.table.*` | `users.table.columns.name`, `users.table.empty` |
| Validation | `pageName.validation.*` | `users.validation.nameRequired` |
| Actions | `pageName.actions.*` | `users.actions.create`, `users.actions.delete` |
| Messages | `pageName.messages.*` | `users.messages.success`, `users.messages.error` |

### Common Reusable Keys

Check these namespaces before creating new keys:

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "create": "Create",
    "search": "Search",
    "loading": "Loading...",
    "noData": "No data available"
  },
  "validation": {
    "required": "This field is required",
    "email": "Please enter a valid email",
    "minLength": "Minimum {min} characters required"
  }
}
```

### RTL Support

RTL is handled **automatically** at the global level. Do NOT add manual RTL handling:

```tsx
// ❌ DON'T DO THIS
<div dir={isRTL ? 'rtl' : 'ltr'}>

// ✅ CORRECT - RTL is automatic
<div>
```

### Dynamic Content Localization

For API data with language variants:

```tsx
const { language } = useTranslation();

{items.map((item) => (
  <span key={item.id}>
    {language === 'ar' ? item.name_ar : item.name_en}
  </span>
))}
```

### Translation Rules Summary

| Rule | Description |
|------|-------------|
| ✅ Use `useTranslation` hook | Import from `@/components/providers/LanguageProvider` |
| ✅ Add to ar.json | Update `src/lib/translations/ar.json` |
| ✅ Follow naming convention | Use `pageName.scope.key` pattern |
| ✅ Reuse common keys | Check `common.*` and `validation.*` first |
| ❌ No hardcoded text | Every visible string must use `t()` |
| ❌ No fallback text | Don't use `t('key') \|\| 'fallback'` |
| ❌ No manual RTL | RTL is handled globally (always true) |

### ⚠️ MANDATORY: Configuration Files Update

**When creating or modifying any page, you MUST update these files:**

| File | Purpose | Required For |
|------|---------|--------------|
| `src/lib/translations/ar.json` | Arabic translations | All pages - every UI text |
| `src/lib/BreadCrumbRouteConfig/routeConfig.ts` | Breadcrumb navigation | All pages - navigation trail |
| `src/lib/pageHeaderConfig/pageHeaderRouteConfig.ts` | Page headers (title, subtitle, actions) | All pages - page header display |

#### ar.json Update Requirements

Every UI string must be in `ar.json`. Follow the naming convention:

```json
{
  "moduleName": {
    "title": "عنوان الوحدة",
    "subtitle": "وصف الوحدة",
    "messages": {
      "createSuccess": "تم الإنشاء بنجاح",
      "updateSuccess": "تم التحديث بنجاح",
      "deleteSuccess": "تم الحذف بنجاح"
    },
    "form": {
      "createTitle": "إنشاء عنصر",
      "editTitle": "تعديل العنصر",
      "viewTitle": "عرض العنصر",
      "errors": {
        "fieldRequired": "الحقل مطلوب"
      }
    }
  }
}
```

#### routeConfig.ts Update Requirements

Add entries for ALL page routes, including dynamic routes:

```typescript
// Static routes
'/news/all': {
  titleKey: 'sidebar.allNews',
  parent: '/home',
  showInBreadcrumb: true,
},
// Dynamic routes - use [param] pattern
'/news/[id]': {
  titleKey: 'news.viewTitle',
  parent: '/news/all',
  showInBreadcrumb: true,
},
'/news/[id]/edit': {
  titleKey: 'news.form.editTitle',
  parent: '/news/all',
  showInBreadcrumb: true,
},
```

Update `getRouteConfig()` function to match dynamic patterns:

```typescript
// Match /news/[id]/edit
const editMatch = pathname.match(/^\/news\/([^/]+)\/edit$/);
if (editMatch && editMatch[1] !== 'categories') {
  return routeConfig['/news/[id]/edit'] || null;
}
```

#### pageHeaderRouteConfig.ts Update Requirements

Add header configuration for ALL pages:

```typescript
// List page with action button
"/news/all": {
  titleKey: "news.subtitle",
  showHeader: true,
  primaryAction: {
    labelKey: "news.addNews",
    href: "/news/add",
    icon: Plus,
    variant: "default",
  },
},
// Form pages - no action button
"/news/add": {
  titleKey: "pageHeaders.addNews",
  showHeader: true,
},
```

Update `getPageHeaderRouteConfig()` for dynamic routes.

**Failure to update these files will result in:**
- Missing or broken breadcrumbs
- Empty page headers
- Untranslated text appearing as keys

---

## Design Rules

### 1. Shared Components Only

**Always use components from `src/components/ui`**

```tsx
// ✅ CORRECT
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// ❌ FORBIDDEN - Custom components without approval
import { MyCustomButton } from './MyCustomButton';
```

### 1b. Specialized Upload & Dialog Components

**For file uploads and delete confirmations, use these dedicated components:**

| Use Case | Component | Import Path |
|----------|-----------|-------------|
| Single Image Upload | `ImageUpload` | `@/components/ui/image-upload` |
| Single File Upload | `FileUpload` | `@/components/ui/file-upload` |
| Multiple Images/Gallery | `GalleryUpload` | `@/components/ui/gallery-upload` |
| Delete Confirmation | `DeleteAlertDialog` | `@/components/ui/delete-alert-dialog` |

```tsx
// ✅ CORRECT - Use dedicated upload components
import { ImageUpload } from '@/components/ui/image-upload';
import { FileUpload } from '@/components/ui/file-upload';
import { GalleryUpload } from '@/components/ui/gallery-upload';
import { DeleteAlertDialog } from '@/components/ui/delete-alert-dialog';

// ❌ FORBIDDEN - Custom upload implementations
import { MyCustomUploader } from './MyCustomUploader';
```

**Usage Guidelines:**

| Component | When to Use |
|-----------|-------------|
| `ImageUpload` | Profile pictures, thumbnails, single image fields |
| `FileUpload` | Documents, PDFs, single file attachments |
| `GalleryUpload` | Photo galleries, multiple image uploads |
| `DeleteAlertDialog` | All delete confirmations (records, files, etc.) |

### 2. Spacing & Layout - No Margins

**Never use margins. Use flex utilities and gap instead.**

```tsx
// ✅ CORRECT - Using flex and space utilities
<div className="flex flex-col space-y-6">
  <Card>Section 1</Card>
  <Card>Section 2</Card>
</div>

<div className="flex flex-row space-x-4">
  <Button>Action 1</Button>
  <Button>Action 2</Button>
</div>

<div className="grid grid-cols-3 gap-6">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</div>

// ❌ FORBIDDEN - Using margins
<div className="mt-4 mb-6">
<Card className="mr-4">
<Button className="ml-2">
```

#### Why No Margins?

1. **RTL Support**: Flex/gap automatically handles RTL layouts
2. **Consistency**: Predictable spacing behavior
3. **Maintainability**: Clear layout intent

### 3. Colors - Dashboard Colors Only

**Only use colors defined in `src/app/globals.css`**

```tsx
// ✅ CORRECT - Semantic color classes
<div className="bg-background text-foreground">
<p className="text-muted-foreground">Secondary text</p>
<Button className="bg-primary text-primary-foreground">Action</Button>
<p className="text-destructive">Error message</p>

// ❌ FORBIDDEN - Custom or hardcoded colors
<div className="bg-white text-black">
<p className="text-gray-500">
<Button className="bg-blue-600 text-white">
<p className="text-red-500">
```

#### Color Reference

| Purpose | Class |
|---------|-------|
| Background | `bg-background` |
| Primary Text | `text-foreground` |
| Secondary Text | `text-muted-foreground` |
| Error | `text-destructive` |
| Primary Button | `bg-primary text-primary-foreground` |
| Secondary Button | `bg-secondary text-secondary-foreground` |
| Card | `bg-card text-card-foreground` |
| Border | `border-border` |
| Input Border | `border-input` |
| Focus Ring | `ring-ring` |

### 4. Typography Standards

**Use consistent text sizes across the application:**

| Element | Class | Size |
|---------|-------|------|
| Page Titles | `text-xl` | 20px |
| Subtitles / Card Titles | `text-lg` | 18px |
| Body / Paragraphs | `text-md` | 16px |
| Small Text / Labels | `text-sm` | 14px |
| Captions | `text-xs` | 12px |

```tsx
// ✅ CORRECT
<h1 className="text-xl font-semibold">{t('page.title')}</h1>
<h2 className="text-lg font-medium">{t('section.title')}</h2>
<p className="text-md text-muted-foreground">{t('page.description')}</p>

// ❌ INCORRECT
<h1 className="text-5xl">  // Too large
<p className="text-base">  // Use text-md instead
```

### 5. No Extra Containers

**The layout handles all containers and padding. Start directly with content.**

```tsx
// ✅ CORRECT - Start directly with content
export default function MyPage() {
  return (
    <>
      <RouteBasedPageHeader />
      <Card>Content</Card>
    </>
  );
}

// ❌ INCORRECT - Extra containers
export default function MyPage() {
  return (
    <div className="container mx-auto p-6">  {/* ❌ */}
      <div className="max-w-7xl">  {/* ❌ */}
        <RouteBasedPageHeader />
        <Card>Content</Card>
      </div>
    </div>
  );
}
```

---

## Page Creation Rules

### File Structure

Every page must have this structure:

```
src/app/(dashboard)/[page-name]/
├── page.tsx          # Server component - data fetching
├── pageClient.tsx    # Client component - UI and interactions
├── loading.tsx       # Loading skeleton
├── add/
│   ├── page.tsx
│   ├── pageClient.tsx
│   ├── loading.tsx
│   └── schemes.ts    # Zod schema for CREATE form only
├── [id]/
│   ├── page.tsx      # View page
│   ├── pageClient.tsx
│   ├── loading.tsx
│   └── edit/
│       ├── page.tsx
│       ├── pageClient.tsx
│       ├── loading.tsx
│       └── schemes.ts  # Zod schema for EDIT form only
└── forms/            # Shared form components (if needed)
    └── ComponentForm.tsx
```

### ⚠️ CRITICAL: Separate Zod Schemas per Form

**Each page with a form MUST have its own `schemes.ts` file. Do NOT share schemas between Create and Edit pages.**

```
src/app/(dashboard)/[page-name]/
├── add/
│   └── schemes.ts    # ✅ Schema for CREATE - createXxxSchema
└── [id]/
    └── edit/
        └── schemes.ts  # ✅ Schema for EDIT - editXxxSchema
```

**Why separate schemas?**
- Create and Edit forms may have different required fields
- Edit forms may need additional fields (e.g., `existingImageUrl`)
- Validation rules may differ between create and update operations
- Easier to maintain and modify independently

```tsx
// ❌ FORBIDDEN - Single shared schema
src/app/(dashboard)/news/schemes.ts  // Shared between add and edit

// ✅ CORRECT - Separate schemas per form
src/app/(dashboard)/news/add/schemes.ts       // createNewsSchema
src/app/(dashboard)/news/[id]/edit/schemes.ts // editNewsSchema
```

### The 5 Core Rules

#### Rule 1: Service Layer - Server-Side Data Fetching

**If the service uses network layer with `autoConfig`, the GET request MUST be executed server-side in `page.tsx`**

```tsx
// src/app/(dashboard)/users/page.tsx
import { Suspense } from 'react';
import PageClient from './PageClient';
import Loading from './loading';
import { UsersService } from '@/lib/services/users';

export default async function UsersPage() {
  // ✅ Server-side data fetching
  const data = await UsersService.getAll();
  
  return (
    <Suspense fallback={<Loading />}>
      <PageClient initialData={data} />
    </Suspense>
  );
}
```

#### Rule 2: PageClient Structure

**Every `PageClient.tsx` must start with this exact structure:**

```tsx
// src/app/(dashboard)/users/PageClient.tsx
'use client';

import { useTranslation } from '@/components/providers/LanguageProvider';
import { RouteBasedPageHeader } from '@/components/SharedCustomComponents/RouteBasedPageHeader';

export default function PageClient({ initialData }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <RouteBasedPageHeader />
      
      {/* Content goes directly here - NO back buttons, NO extra wrappers */}
      <Card>...</Card>
    </div>
  );
}
```

**⚠️ CRITICAL Layout Rules:**
- Start with `<div className="space-y-6">`
- `<RouteBasedPageHeader />` must be the first child
- Content follows directly after the header
- **NO back buttons** - navigation is handled by breadcrumbs
- **NO extra wrapper divs** - content goes directly in the main div

```tsx
// ❌ FORBIDDEN
<div className="space-y-6">
  <RouteBasedPageHeader />
  <div className="flex items-center gap-4">
    <Button onClick={handleBack}>  {/* ❌ NO back buttons */}
      <ArrowLeft /> Back
    </Button>
  </div>
  <Card>...</Card>
</div>

// ✅ CORRECT
<div className="space-y-6">
  <RouteBasedPageHeader />
  <Card>...</Card>  {/* Content directly after header */}
</div>
```

**Configure headers and breadcrumbs in:**
- `src/lib/pageHeaderConfig/pageHeaderRouteConfig.ts`
- `src/lib/BreadCrumbRouteConfig/routeConfig.ts`

#### Rule 3: Pagination & Search Implementation

**If API response contains pagination structure (current_page, last_page, total, per_page, data), you MUST implement server-side pagination and search.**

**📖 Full Guide:** `docs/components/PAGINATION_SEARCH_IMPLEMENTATION_GUIDE.md`

**✅ Reference Implementation:** `src/app/(dashboard)/news/all/` - This is the canonical example that demonstrates all pagination and search patterns correctly. Use it as your template when implementing list pages.

##### The Pagination Process

**Understanding the Flow:**

1. **URL is the Source of Truth** - All filter values, search terms, and page numbers are stored in the URL query parameters. This enables bookmarking, sharing links, and browser back/forward navigation.

2. **Server Fetches Data** - The server component reads URL parameters and fetches data from the API with those parameters. The server always has the current state.

3. **Client Handles User Interaction** - The client component displays the data and handles user actions (search, filter, page change). When the user interacts, the client updates the URL.

4. **URL Change Triggers Refetch** - When the URL changes via `router.push()`, Next.js re-renders the server component, which fetches fresh data with the new parameters.

##### Implementation Steps

**Step 1: Server Component (`page.tsx`)**

- Accept `searchParams` as a prop (this is a Promise in Next.js 15, so you must await it)
- Parse the URL parameters (page, keyword, status, filters, etc.)
- Call the service function with these parameters to fetch data from the API
- Pass the fetched data, current page number, and search params to the client component
- Wrap the content in Suspense with a Loading fallback

**Step 2: Client Component (`pageClient.tsx`)**

- Receive `initialData`, `currentPage`, and `searchParams` as props
- Store `initialData` in state and sync it when props change using `useEffect`
- Use `useRouter()` from `next/navigation` for URL updates
- Implement `handleSearch()` that builds a new URL with filter values and calls `router.push()`
- Implement `handlePageChange()` that updates the page parameter in the URL and calls `router.push()`
- Always reset page to 1 when search/filter criteria change
- Set a loading state before calling `router.push()` and clear it when new data arrives via props

**Step 3: Loading State (`loading.tsx`)**

- Create a loading skeleton that matches the page layout
- Use `DashboardSkelton` components for consistent loading experience
- This file is automatically used by Suspense during server-side data fetching

##### Key Principles

| ✅ DO | ❌ DON'T |
|-------|----------|
| Use Server Components for data fetching | Make API calls from Client Components |
| Store filter/pagination state in URL params | Store state only in React useState |
| Use `router.push()` to trigger navigation | Use `router.refresh()` (causes full reload) |
| `await searchParams` in Next.js 15 | Access searchParams without awaiting |
| Use `useEffect` to sync props to state | Ignore prop changes after initial render |
| Reset to page 1 when filters change | Keep the same page when search criteria change |
| Use separate SearchComponent for filters | Use the Table's built-in search feature |
| Build pagination using shadcn primitives | Expect a ready-made Pagination component |

##### Pagination Component

The shadcn `Pagination` component is a set of building blocks (Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis), not a ready-to-use component with props like `currentPage` and `onPageChange`.

You must compose these primitives together:
- Wrap everything in `Pagination` and `PaginationContent`
- Use `PaginationPrevious` and `PaginationNext` for navigation arrows
- Use `PaginationItem` and `PaginationLink` for each page number
- Attach `onClick` handlers that call your `handlePageChange` function
- Use `isActive` prop on `PaginationLink` to highlight the current page
- Add `pointer-events-none opacity-50` classes to disable prev/next when at bounds

##### SearchComponent Usage

**All filtering and searching MUST use the shared `SearchComponent` from `@/components/ui/SearchComponent`. Do NOT use the Table's built-in search.**

**Reference Implementation:** `src/app/(dashboard)/news/all/pageClient.tsx`

###### SearchComponent Configuration

The SearchComponent requires a configuration object that defines the filter fields:

**Step 1: Define the Search Configuration**

Create a `SearchComponentConfig` object with:
- `title`: Optional title for the search section (translated)
- `gridCols`: Number of columns for desktop layout (1-4)
- `fields`: Array of field definitions

**Step 2: Define Fields**

Each field in the `fields` array requires:
- `key`: The URL parameter name (must match what the API expects)
- `type`: One of `'text'`, `'select'`, `'date'`, `'dateRange'`, or `'dependentSelect'`
- `label`: Translated label text
- `placeholder`: Translated placeholder text
- `options`: For select/dependentSelect fields, array of `{ value, label }` objects
- `gridCols`: Optional, controls field width in grid

**Supported Field Types:**

| Type | Use Case | Props Required |
|------|----------|----------------|
| `text` | Keyword search, free text input | `placeholder` |
| `select` | Dropdown with predefined options | `options` array |
| `date` | Single date picker | `placeholder` |
| `dateRange` | From/To date range | Creates `key_from` and `key_to` params |
| `dependentSelect` | Dropdown that depends on another field | `dependsOn`, `disabled`, `loading`, `options` |

**dependentSelect Props:**

| Prop | Type | Description |
|------|------|-------------|
| `dependsOn` | string | Key of the parent field this depends on |
| `disabled` | boolean | Set true when parent field has no value |
| `loading` | boolean | Set true while fetching options |
| `options` | SelectOption[] | Dynamic options fetched based on parent |
| `disabledPlaceholder` | string | Text shown when disabled |
| `loadingPlaceholder` | string | Text shown while loading |
| `emptyPlaceholder` | string | Text shown when no options available |

###### Implementing Search Handler

The `handleSearch` function must:

1. Set loading state to true
2. Build a new URL from the current window location
3. Clear all existing filter parameters
4. Add new parameters only if they have values
5. Reset page to 1 (new search = start from beginning)
6. Call `router.push()` with the new URL

###### Implementing Clear Handler

The `handleClearFilters` function must:

1. Set loading state to true
2. Navigate to the base path without any query parameters

###### Passing Initial Values

The SearchComponent needs `initialValues` prop to maintain state across page navigations:
- Pass the current `searchParams` values
- Use empty string as default for missing values
- This ensures filters persist when paginating

###### Key Principles for SearchComponent

| ✅ DO | ❌ DON'T |
|-------|----------|
| Use SearchComponent for all filtering | Use Table's built-in `searchable` prop |
| Define fields with translated labels | Hardcode field labels or placeholders |
| Match field keys to API parameter names | Use different keys than what API expects |
| Reset to page 1 when filters change | Keep current page on filter change |
| Pass initialValues from searchParams | Ignore URL state in initialValues |
| Use `useCallback` for handlers | Define handlers inline (causes re-renders) |
| Clear all params then set new ones | Append to existing params |

###### Dynamic Select Options

When select options depend on data (e.g., categories from API):
- Pass the data as a prop to PageClient from the server component
- Filter or transform the data as needed
- Map to `{ value, label }` format for the options array
- Use `public_id` for values (not numeric `id`)

##### Category & Subcategory Filter Pattern

**⚠️ IMPORTANT: API Naming Convention**

The API uses a confusing but consistent naming pattern:
- `parent_category_id` = **Category** (main/parent category)
- `category_id` = **Subcategory** (child category)

**This naming must be followed exactly in all API calls and URL parameters.**

###### Implementation Requirements

1. **Category Dropdown (parent_category_id)**
   - Fetched server-side using `getAllCategoriesServer(type)`
   - Passed as `categories` prop to PageClient
   - Uses `parent_category_id` as the field key in SearchComponent
   - Value is the category's `public_id`
   - Type: `select`

2. **Subcategory Dropdown (category_id)**
   - Uses the new `dependentSelect` type in SearchComponent
   - **Disabled by default** until a category is selected
   - Fetched client-side using `getAllSubcategories(parent_category_id)`
   - Called when `selectedCategoryId` state changes
   - Shows appropriate placeholder based on state:
     - `disabledPlaceholder`: "اختر الفئة أولاً" (Select category first) when no category selected
     - `loadingPlaceholder`: "جاري التحميل..." (Loading) while fetching
     - `emptyPlaceholder`: "لا توجد فئات فرعية" (No subcategories) when empty
     - `placeholder`: "جميع الفئات الفرعية" (All subcategories) when ready

###### dependentSelect Field Type

SearchComponent now supports a new field type `dependentSelect` for dependent dropdowns:

**Field Configuration:**
| Property | Type | Description |
|----------|------|-------------|
| `key` | string | Field key (e.g., `category_id`) |
| `type` | `'dependentSelect'` | Field type |
| `label` | string | Display label |
| `placeholder` | string | Placeholder when options available |
| `dependsOn` | string | Key of the parent field (e.g., `parent_category_id`) |
| `disabled` | boolean | When parent field is not selected |
| `loading` | boolean | When fetching options |
| `options` | SelectOption[] | Dynamic options from parent |
| `disabledPlaceholder` | string | Text when disabled |
| `loadingPlaceholder` | string | Text when loading |
| `emptyPlaceholder` | string | Text when no options |

###### State Management

```
// Required state for category/subcategory filters
const [subcategories, setSubcategories] = useState<CategoryItem[]>([])
const [subcategoriesLoading, setSubcategoriesLoading] = useState(false)
const [selectedCategoryId, setSelectedCategoryId] = useState<string>(searchParams.parent_category_id || '')
const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>(searchParams.category_id || '')
```

###### URL Parameters

| UI Label | URL Parameter | API Field |
|----------|---------------|-----------|
| Category (main) | `parent_category_id` | `parent_category_id` |
| Subcategory | `category_id` | `category_id` |

##### Sorting Behavior

**Default Sort Order: ASC (Ascending)**

When implementing sorting filters:

1. Define a constant for the default sort type:
   ```tsx
   const DEFAULT_SORT_TYPE = sortType.Ascending
   ```

2. Apply default when sort_by is set but sort_type is not:
   ```tsx
   if (values.sort_by && !values.sort_type) {
     url.searchParams.set('sort_type', DEFAULT_SORT_TYPE)
   }
   ```

3. Use default in initialValues:
   ```tsx
   initialValues={{
     sort_type: searchParams.sort_type || DEFAULT_SORT_TYPE,
   }}
   ```

**Sort Type Enum:**
```tsx
export enum sortType {
  Ascending = 'ASC',
  Descending = 'DESC',
}
```

#### Rule 3b: Table Usage

**Tables are for displaying data only. Do NOT enable optional features unless explicitly requested.**

```tsx
// ✅ CORRECT - Minimal table configuration
<Table
  columns={columns}
  data={data.data}
  emptyMessage={t('module.emptyMessage')}
  loading={loading}
  actions={actions}
  showActions={true}
  showPagination={false}   // Use external Pagination component
  searchable={false}       // ❌ Do NOT enable search in table
  exportable={false}       // ❌ Do NOT enable CSV export
  columnVisibility={false} // ❌ Do NOT enable column visibility
/>

// For columns - disable sorting
const columns = [
  {
    key: 'name',
    label: t('module.columns.name'),
    sortable: false,  // ❌ Do NOT enable sorting
  },
  // ...
];
```

**⚠️ FORBIDDEN Table Features (unless explicitly requested):**

| Feature | Prop | Status |
|---------|------|--------|
| Table Title | `title` | ❌ FORBIDDEN - Use RouteBasedPageHeader |
| Table Subtitle | `subtitle` | ❌ FORBIDDEN - Use RouteBasedPageHeader |
| Column Sorting | `sortable: true` | ❌ FORBIDDEN |
| Table Search | `searchable: true` | ❌ FORBIDDEN |
| CSV Export | `exportable: true` | ❌ FORBIDDEN |
| Column Visibility | `columnVisibility: true` | ❌ FORBIDDEN |
| Built-in Pagination | `showPagination: true` | ❌ FORBIDDEN - Use external Pagination |
| Custom Filters | `filters: [...]` | ❌ FORBIDDEN |

**Default Table Behavior:**
- Tables display data in a clean, read-only format
- **No title or subtitle** - page header is handled by `RouteBasedPageHeader`
- Use external `Pagination` component for navigation
- Use server-side pagination for large datasets
- Use a separate `SearchComponent` for filtering (not table's built-in search)
- Actions column for view/edit/delete operations only

**Reference Implementation:** `src/app/(dashboard)/news/all/pageClient.tsx`

**Reference:** See `docs/components/TableReadme.md` for component API, but **ignore all optional feature examples** unless explicitly instructed.

#### Rule 4: Form Pages

**Form spacing and validation requirements:**

```tsx
// Form structure
<form className="space-y-6">
  {/* Each field group */}
  <div className="space-y-3">  {/* ✅ space-y-3 between label and input */}
    <Label>{t('form.field.label')}</Label>
    <Input />
    {errors.field && (
      <p className="text-sm text-destructive">{errors.field}</p>
    )}
  </div>
  
  {/* Button group */}
  <div className="flex flex-row space-x-2">
    <Button type="submit">{t('common.save')}</Button>
    <Button type="button" variant="outline">{t('common.cancel')}</Button>
  </div>
</form>
```

**Each form must have its own `schemes.ts` file:**

```tsx
// src/app/(dashboard)/users/schemes.ts
import { z } from 'zod';

export const createUserSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(1, t('users.validation.nameRequired')),
  email: z.string().email(t('users.validation.emailInvalid')),
  phone: z.string().min(1, t('users.validation.phoneRequired')),
});

export type UserFormData = z.infer<ReturnType<typeof createUserSchema>>;
```

#### Rule 5: Pages Over Dialogs

**Prefer creating new pages for create/edit actions.**

```tsx
// ✅ PREFERRED - Separate pages
/users/create    → Create user page
/users/[id]/edit → Edit user page

// ⚠️ EXCEPTION ONLY - Alert dialogs for simple confirmations
<AlertDialog>  // Only for delete confirmations, etc.
```

### Loading Components

Use one of these approaches:

**Option 1: Dashboard Skeleton (Recommended)**
```tsx
// src/app/(dashboard)/users/loading.tsx
import { DashboardSkelton } from '@/components/SharedCustomComponents/DashboardSkelton';

export default function Loading() {
  return <DashboardSkelton />;
}
```

**Option 2: Custom Skeleton**
```tsx
// src/app/(dashboard)/users/loading.tsx
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      
      {/* Content skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    </div>
  );
}
```

### Global Rules

| Rule | Description |
|------|-------------|
| Use `public_id` | For edit/delete/update operations, never use `id` |
| Unified Search | Search components must be consistent across pages |
| No `layout.tsx` | Don't create layout files for individual pages |
| SSR Data Fetching | GET requests with autoConfig must be server-side |

---

## Component Standards

### Required Imports - Client Components

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/components/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
```

### Required Imports - Server Components

```tsx
import { Suspense } from 'react';
import { getServerLanguage } from '@/lib/language-utils';
```

### State Management Patterns

```tsx
// Local state
const [data, setData] = useState(initialData);
const [isLoading, setIsLoading] = useState(false);
const [errors, setErrors] = useState<Record<string, string>>({});

// Global state (Zustand)
import { useStore } from '@/stores/storeName';
const { value, setValue } = useStore();
```

### Form Validation Pattern

```tsx
import { z } from 'zod';
import { createUserSchema, UserFormData } from './schemes';

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setErrors({});
  setIsLoading(true);

  try {
    const schema = createUserSchema(t);
    const validatedData = schema.parse(formData);
    await onSubmit(validatedData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {};
      error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as string] = issue.message;
        }
      });
      setErrors(fieldErrors);
    }
  } finally {
    setIsLoading(false);
  }
};
```

### Interactive Elements

All interactive elements must have:
- `cursor-pointer` class
- Proper hover states
- Focus-visible states for keyboard navigation

```tsx
// Clickable elements
<div 
  onClick={handleClick}
  className="p-4 hover:bg-accent cursor-pointer focus-visible:ring-2"
  tabIndex={0}
  role="button"
>

// Buttons (cursor-pointer is built-in)
<Button variant="default">Action</Button>
```

---

## Middleware & Route Protection

### ⚠️ CRITICAL: Middleware is the ONLY Route Protection Method

**Do NOT implement any alternative route protection:**

| ❌ Forbidden | ✅ Required |
|--------------|-------------|
| Client-side `AuthProvider` | Middleware in `src/middleware.ts` |
| `ProtectedRoute` components | Add route to `ROUTE_PATTERNS.protected` |
| `useEffect` auth checks | Server-side token validation |
| HOC authentication patterns | Centralized middleware logic |

### File Location

```
src/middleware.ts  ← Must be in src/ directory
```

### Adding Protected Routes

```tsx
// src/middleware.ts
const ROUTE_PATTERNS = {
  protected: [
    '/home',
    '/users',
    '/products',
    '/your-new-route', // ← Add new protected routes here
  ],
  auth: ['/auth/signin', '/auth/signup'],
  public: ['/about', '/contact'],
};
```

### Route Protection Flow

```
Request → Middleware → Token Check → Route Match → Allow/Redirect
```

| Route Type | Has Token | Action |
|------------|-----------|--------|
| Protected | ✅ Yes | Allow access |
| Protected | ❌ No | Redirect to `/auth/signin` |
| Auth | ✅ Yes | Redirect to `/home` |
| Auth | ❌ No | Allow access |
| Public | Any | Allow access |

---

## NotFound Component Pattern

### ⚠️ CRITICAL: Use Shared NotFound Component for All Not Found States

**When a resource is not found (e.g., news item, user, etc.), use the shared `NotFound` component instead of redirecting.**

**Component Location:** `@/components/ui/NotFound`

### When to Use NotFound

| Scenario | Use NotFound |
|----------|--------------|
| API returns null/undefined for requested resource | ✅ Yes |
| Resource ID doesn't exist | ✅ Yes |
| Corrupted or invalid response | ✅ Yes |
| Empty list (no results) | ❌ No - Use empty state in Table |

### Implementation Pattern

**In Server Component (page.tsx):**

```tsx
import { NotFound } from '@/components/ui/NotFound'
import { getResourceByIdServer } from '@/lib/services/resource'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const response = await getResourceByIdServer(id)
  
  // Show NotFound if data not found
  if (!response?.data) {
    return <NotFound backUrl="/resource/all" />
  }

  return <ResourceClient initialData={response.data} />
}
```

### NotFound Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | string | `t('notFound.title')` | Custom title text |
| `description` | string | `t('notFound.description')` | Custom description text |
| `showBackButton` | boolean | `true` | Show "Go Back" button |
| `showHomeButton` | boolean | `true` | Show "Home" button |
| `backUrl` | string | `router.back()` | Custom back navigation URL |
| `homeUrl` | string | `'/'` | Custom home navigation URL |
| `icon` | ReactNode | `<FileQuestion />` | Custom icon component |

### Translations Required

The NotFound component uses these translation keys:

```json
{
  "notFound": {
    "title": "الصفحة غير موجودة",
    "description": "عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.",
    "backButton": "العودة",
    "homeButton": "الصفحة الرئيسية"
  }
}
```

### Key Principles

| ✅ DO | ❌ DON'T |
|-------|----------|
| Use `NotFound` component for missing resources | Redirect to list page silently |
| Provide custom `backUrl` for context | Use generic back navigation |
| Keep NotFound in the page flow | Show error toast and redirect |

**Reference Implementation:** `src/app/(dashboard)/news/[id]/page.tsx`

---

## Quick Reference Tables

### Spacing Classes

| Class | Size | Usage |
|-------|------|-------|
| `space-y-2` | 8px | Tight spacing |
| `space-y-3` | 12px | Label to input |
| `space-y-4` | 16px | Standard spacing |
| `space-y-6` | 24px | Section spacing |
| `space-x-2` | 8px | Button groups |
| `space-x-4` | 16px | Horizontal items |
| `gap-4` | 16px | Grid gap |
| `gap-6` | 24px | Large grid gap |

### Typography Classes

| Element | Class | Weight |
|---------|-------|--------|
| Page Title | `text-xl` | `font-semibold` |
| Section Title | `text-lg` | `font-medium` |
| Body Text | `text-md` | `font-normal` |
| Labels | `text-sm` | `font-medium` |
| Captions | `text-xs` | `font-normal` |

### Color Classes

| Purpose | Background | Text |
|---------|------------|------|
| Default | `bg-background` | `text-foreground` |
| Muted | `bg-muted` | `text-muted-foreground` |
| Primary | `bg-primary` | `text-primary-foreground` |
| Secondary | `bg-secondary` | `text-secondary-foreground` |
| Destructive | `bg-destructive` | `text-destructive` |
| Card | `bg-card` | `text-card-foreground` |

### Translation Key Patterns

| Pattern | Example |
|---------|---------|
| Page title | `pageName.page.title` |
| Form label | `pageName.form.fieldName.label` |
| Form placeholder | `pageName.form.fieldName.placeholder` |
| Validation | `pageName.validation.fieldRequired` |
| Table column | `pageName.table.columns.columnName` |
| Actions | `pageName.actions.create` |
| Common | `common.save`, `common.cancel` |

### File Structure

```
src/app/(dashboard)/[page-name]/
├── page.tsx           # Server component
├── PageClient.tsx     # Client component
├── loading.tsx        # Loading skeleton
├── schemes.ts         # Zod schemas
└── forms/
    └── Form.tsx       # Form components
```

---

## Page Creation Checklist

### Before Starting

- [ ] Review existing similar pages
- [ ] Plan translation keys
- [ ] Identify if pagination/search is needed
- [ ] Determine forms and validation needs

### Implementation

- [ ] Create `page.tsx` with server-side data fetching
- [ ] Create `PageClient.tsx` starting with `<div className="space-y-6"><RouteBasedPageHeader />`
- [ ] Create `loading.tsx` with skeleton
- [ ] Create `schemes.ts` if forms exist

### ⚠️ MANDATORY Configuration Updates

- [ ] **Add translations to `src/lib/translations/ar.json`**
- [ ] **Configure breadcrumbs in `src/lib/BreadCrumbRouteConfig/routeConfig.ts`**
- [ ] **Configure page header in `src/lib/pageHeaderConfig/pageHeaderRouteConfig.ts`**
- [ ] Add route to middleware if protected

### Validation

- [ ] No static text - all using `t()`
- [ ] No margins - using flex/gap/space utilities
- [ ] No custom colors - using design system
- [ ] No extra containers - starting directly with content
- [ ] Using `public_id` for mutations
- [ ] Form spacing is `space-y-3` for label/input
- [ ] Responsive design tested

---

**This document is the single source of truth for the Family App Dashboard development standards.**
