# Fast Track Purchasing - Design System Documentation

> **Version**: 1.0 | **Last Updated**: December 2025  
> **Based on Pages**: Create Order, Order Details, Order Edit, Admin/Engineering/Purchasing Views

---

## Table of Contents

1. [Brand Identity](#brand-identity)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [Forms Design](#forms-design)
5. [Cards Design](#cards-design)
6. [Components Library](#components-library)
7. [Spacing & Layout](#spacing--layout)
8. [Interaction States](#interaction-states)
9. [Status Badges](#status-badges)
10. [Reusable Patterns](#reusable-patterns)
11. [Consistency Guidelines](#consistency-guidelines)

---

## Brand Identity

### Brand Overview

**Fast Track** (المسار السريع) is a procurement management system designed for efficiency, clarity, and professional operation. The brand conveys:

| Attribute | Description |
|-----------|-------------|
| **Tone** | Professional, reliable, efficient |
| **Style** | Clean, modern, corporate |
| **Visual Personality** | Bold yet approachable, authoritative with warmth |
| **Target Audience** | Business professionals, procurement teams, administrators |

### Logo Usage

#### Primary Logo
- **File**: `/public/app-logo.svg`
- **App Icon**: `/public/app-Icon.jpg`
- **Default Dimensions**: 180×60 (width × height)
- **Display Height**: `h-12` (48px) with auto width

#### Logo Placement Rules

```tsx
// Standard Logo Implementation
<Image
  src="/app-logo.svg"
  alt="Fast-Track"
  width={180}
  height={60}
  className="h-12 w-auto"
  priority
/>
```

| Context | Placement | Size |
|---------|-----------|------|
| Page Header | Center, above main content | `h-12 w-auto` |
| Print Invoice | Top-left corner | `max-height: 50pt` |
| Sign-in Page | Center, prominent display | `h-12 w-auto` |

#### Logo Wrapper
```tsx
<div className="flex items-center justify-center py-4">
  <Image src="/app-logo.svg" ... />
</div>
```

### Brand Colors

The primary brand color is **Maroon/Burgundy** (`#5C1A1B`), representing:
- **Stability** and **trustworthiness**
- **Professional authority**
- **Arabic/Middle Eastern heritage warmth**

---

## Color Palette

### CSS Custom Properties (oklch format)

The application uses OKLCH color space for better color manipulation and accessibility.

#### Light Mode

| Variable | OKLCH Value | Use Case |
|----------|-------------|----------|
| `--background` | `oklch(1 0 0)` | Page background (pure white) |
| `--foreground` | `oklch(0.18 0 0)` | Primary text (near black) |
| `--card` | `oklch(1 0 0)` | Card backgrounds |
| `--card-foreground` | `oklch(0.18 0 0)` | Card text |
| `--primary` | `oklch(0.30 0.15 10)` | **Maroon** - Primary actions, headers |
| `--primary-foreground` | `oklch(0.99 0 0)` | Text on primary |
| `--secondary` | `oklch(0.96 0 0)` | Secondary backgrounds |
| `--muted` | `oklch(0.96 0 0)` | Muted backgrounds |
| `--muted-foreground` | `oklch(0.50 0 0)` | Muted text |
| `--accent` | `oklch(0.96 0.005 10)` | Accent with maroon tint |
| `--destructive` | `oklch(0.55 0.22 25)` | Error/danger states |
| `--border` | `oklch(0.90 0 0)` | Border color |
| `--input` | `oklch(0.90 0 0)` | Input borders |
| `--ring` | `oklch(0.30 0.15 10)` | Focus rings (maroon) |

#### Dark Mode

| Variable | OKLCH Value | Description |
|----------|-------------|-------------|
| `--background` | `oklch(0.13 0.008 10)` | Deep dark with maroon undertone |
| `--foreground` | `oklch(0.96 0 0)` | Light text |
| `--card` | `oklch(0.18 0.01 10)` | Dark cards with maroon warmth |
| `--primary` | `oklch(0.50 0.15 10)` | Lighter maroon for visibility |
| `--muted` | `oklch(0.24 0.008 10)` | Dark muted with maroon hint |
| `--border` | `oklch(0.28 0.01 10)` | Dark borders with maroon warmth |

### Hardcoded Brand Color

The brand maroon is also used as a hardcoded value in certain UI elements:

```css
/* Direct hex value for brand consistency */
background-color: #5C1A1B;
```

### Status Colors (Semantic)

| Status | Light Mode | Dark Mode |
|--------|------------|-----------|
| **Success/Approved** | `bg-emerald-100 text-emerald-700` | `bg-emerald-900/50 text-emerald-300` |
| **Warning/Pending** | `bg-amber-100 text-amber-700` | `bg-amber-900/50 text-amber-300` |
| **Error/Rejected** | `bg-red-100 text-red-700` | `bg-red-900/50 text-red-300` |
| **Info/In Progress** | `bg-blue-100 text-blue-700` | `bg-blue-900/50 text-blue-300` |
| **Neutral/Default** | `bg-slate-100 text-slate-700` | `bg-slate-800 text-slate-300` |
| **Cyan (Engineering)** | `bg-cyan-100 text-cyan-700` | `bg-cyan-900/50 text-cyan-300` |
| **Purple (Purchasing)** | `bg-purple-100 text-purple-700` | `bg-purple-900/50 text-purple-300` |

---

## Typography

### Font Family

The application uses **PingAR+LT** - a custom Arabic-optimized font with multiple weights.

#### Font Definition

```css
@font-face {
    font-family: "PingAR+LT";
    src: url("/fonts/PingAR+LT-Light.otf") format("opentype");
    font-weight: 300;
}

@font-face {
    font-family: "PingAR+LT";
    src: url("/fonts/PingAR+LT-Regular.otf") format("opentype");
    font-weight: 400;
}

@font-face {
    font-family: "PingAR+LT";
    src: url("/fonts/PingAR+LT-Medium.otf") format("opentype");
    font-weight: 500;
}

@font-face {
    font-family: "PingAR+LT";
    src: url("/fonts/PingAR+LT-Bold.otf") format("opentype");
    font-weight: 700;
}
```

#### Usage

```css
html[lang="ar"] body {
    font-family: "PingAR+LT", sans-serif !important;
}
```

### Font Weights

| Weight | Class | Use Case |
|--------|-------|----------|
| 300 (Light) | `font-light` | Subtle text |
| 400 (Regular) | `font-normal` | Body text |
| 500 (Medium) | `font-medium` | Labels, emphasized text |
| 600 (Semibold) | `font-semibold` | Card titles, headings |
| 700 (Bold) | `font-bold` | Page titles, important headings |

### Text Sizes

| Size | Class | Use Case |
|------|-------|----------|
| Extra Small | `text-xs` | Badges, helper text, file labels |
| Small | `text-sm` | Form labels, secondary info, descriptions |
| Base | `text-base` | Body text, inputs |
| Large | `text-lg` | Section titles |
| XL | `text-xl` | Card main titles |

### RTL Support

The application is **Arabic-first** with automatic RTL handling:

```tsx
// RTL is automatic - DO NOT add manual dir attributes
<div>Content here</div> // ✅ Correct

<div dir={isRTL ? 'rtl' : 'ltr'}> // ❌ Wrong
```

---

## Forms Design

### Form Structure

Forms follow a consistent pattern using React Hook Form with Zod validation:

```tsx
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
    {/* Form sections as Cards */}
  </form>
</Form>
```

### Form Field Pattern

```tsx
<FormField
  control={form.control}
  name="fieldName"
  render={({ field }) => (
    <FormItem>
      <FormLabel>
        {t('label.key')} <span className="text-destructive">*</span>
      </FormLabel>
      <FormControl>
        <Input placeholder={t('placeholder.key')} {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Input Styling

Base input classes from `input.tsx`:

```css
/* Input Base Styles */
border-input
placeholder:text-muted-foreground
selection:bg-primary selection:text-primary-foreground
dark:bg-input/30
border
h-9
w-full min-w-0
rounded-md
bg-transparent
px-3 py-1
text-base md:text-sm
shadow-xs
transition-[color,box-shadow]
outline-none

/* Focus State */
focus-visible:border-ring
focus-visible:ring-ring/50
focus-visible:ring-[3px]

/* Error State */
aria-invalid:ring-destructive/20
dark:aria-invalid:ring-destructive/40
aria-invalid:border-destructive
```

### Textarea Styling

```css
/* Textarea Base Styles */
border-input
placeholder:text-muted-foreground
dark:bg-input/30
min-h-16
rounded-md border
px-3 py-2
text-base md:text-sm
shadow-xs

/* Usage */
<Textarea
  placeholder={t('placeholder')}
  rows={2}
  className="resize-none"
  {...field}
/>
```

### Form Validation Visual Feedback

| State | Visual |
|-------|--------|
| Default | Gray border (`border-input`) |
| Focus | Primary ring with 3px width |
| Error | Red border + red ring |
| Disabled | 50% opacity, not-allowed cursor |

### Required Field Indicator

```tsx
<FormLabel>
  {t('fieldLabel')} <span className="text-destructive">*</span>
</FormLabel>
```

### Form Action Buttons

```tsx
<div className="flex items-center justify-end gap-3">
  <Button type="button" variant="outline" onClick={() => router.back()}>
    {t('common.cancel')}
  </Button>
  <Button type="submit" disabled={submitting}>
    {submitting ? (
      <>
        <Loader2 className="h-4 w-4 me-2 animate-spin" />
        {t('common.creating')}
      </>
    ) : (
      t('orders.createOrder')
    )}
  </Button>
</div>
```

---

## Cards Design

### Card Structure

Cards are the primary container for content sections:

```tsx
<Card className="overflow-hidden p-0 gap-0">
  {/* Colored Header */}
  <div className="bg-[#5C1A1B] px-5 py-4 flex items-center gap-3">
    {/* Icon Container */}
    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/15">
      <Icon className="h-4 w-4 text-white" />
    </div>
    <span className="font-semibold text-white">{title}</span>
  </div>
  <CardContent className="p-5 space-y-5">
    {/* Content */}
  </CardContent>
</Card>
```

### Card Variants

#### 1. Standard Card (Brand Header)

```tsx
<Card className="overflow-hidden p-0 gap-0">
  <div className="bg-[#5C1A1B] px-5 py-4 flex items-center gap-3">
    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/15">
      <FileText className="h-4 w-4 text-white" />
    </div>
    <span className="font-semibold text-white">{t('orders.form.orderInfo')}</span>
  </div>
  <CardContent className="p-5 space-y-5">
    {/* Content */}
  </CardContent>
</Card>
```

#### 2. Primary Color Header Card

Uses CSS variable `bg-primary` instead of hardcoded color:

```tsx
<Card className="overflow-hidden p-0 gap-0">
  <div className="bg-primary px-5 py-4 flex items-center gap-3">
    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/15">
      <Package className="h-5 w-5 text-primary-foreground" />
    </div>
    <div>
      <h2 className="text-xl font-bold text-primary-foreground">{title}</h2>
      <p className="text-primary-foreground/70 text-sm">{subtitle}</p>
    </div>
  </div>
  <CardContent className="p-5">
    {/* Content */}
  </CardContent>
</Card>
```

#### 3. Card with Header Actions

```tsx
<div className="bg-[#5C1A1B] px-5 py-4 flex items-center justify-between">
  <div className="flex items-center gap-3">
    {/* Title with icon */}
  </div>
  <Button 
    variant="secondary" 
    size="sm" 
    className="bg-white/15 hover:bg-white/25 text-white border-0"
  >
    <Plus className="h-4 w-4 me-1.5" />
    {t('orders.form.addItem')}
  </Button>
</div>
```

#### 4. Sidebar Info Card

```tsx
<Card className="overflow-hidden p-0 gap-0">
  <div className="bg-primary px-4 py-3 flex items-center gap-2">
    <Calendar className="h-4 w-4 text-primary-foreground" />
    <span className="font-medium text-primary-foreground text-sm">{title}</span>
  </div>
  <CardContent className="p-4 space-y-3">
    {/* Smaller padding for sidebar cards */}
  </CardContent>
</Card>
```

#### 5. Special Status Cards

**Rejection Card:**
```tsx
<Card className="overflow-hidden p-0 gap-0">
  <div className="bg-red-600 px-4 py-3 flex items-center gap-2">
    <XCircle className="h-4 w-4 text-white" />
    <span className="font-medium text-white text-sm">{t('orders.sidebar.rejectionReason')}</span>
  </div>
  <CardContent className="p-4">
    <p className="text-sm text-red-600 dark:text-red-400">{content}</p>
  </CardContent>
</Card>
```

**Warning/Notes Card:**
```tsx
<Card className="overflow-hidden p-0 gap-0">
  <div className="bg-amber-600 px-4 py-3 flex items-center gap-2">
    <FileText className="h-4 w-4 text-white" />
    <span className="font-medium text-white text-sm">{t('orders.sidebar.purchasingNotes')}</span>
  </div>
</Card>
```

### Card Base Styling

From `card.tsx`:

```css
bg-card text-card-foreground
flex flex-col gap-6
rounded-xl
border
py-6
shadow-sm
dir="rtl"
```

### Card Icon Containers

| Size | Class | Use |
|------|-------|-----|
| Small | `w-9 h-9 rounded-lg` | Standard card headers |
| Medium | `w-10 h-10 rounded-lg` | Prominent card headers |

Background: `bg-white/15` (15% opacity white overlay)

---

## Components Library

### Button Variants

```tsx
// Default (Primary)
<Button>Primary Action</Button>

// Outline
<Button variant="outline">Secondary Action</Button>

// Destructive
<Button variant="destructive">Delete</Button>

// Ghost
<Button variant="ghost">Subtle Action</Button>

// Secondary
<Button variant="secondary">Alternative Action</Button>

// Link
<Button variant="link">Link Style</Button>
```

### Button Sizes

```tsx
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">Icon Only</Button>
```

### Button with Icons

```tsx
// Icon before text (RTL: use me-* for spacing)
<Button>
  <Edit className="h-4 w-4 me-2" />
  {t('orders.edit')}
</Button>

// Loading state
<Button disabled>
  <Loader2 className="h-4 w-4 me-2 animate-spin" />
  {t('common.loading')}
</Button>
```

### Special Button Styles

```tsx
// Header action button (white on primary)
<Button 
  variant="secondary" 
  size="sm" 
  className="bg-white/15 hover:bg-white/25 text-white border-0"
>
  Action
</Button>

// Colored action buttons
<Button className="bg-purple-600 hover:bg-purple-700">Purchasing</Button>
<Button className="bg-amber-600 hover:bg-amber-700">Start Process</Button>
<Button className="bg-cyan-600 hover:bg-cyan-700">Engineering</Button>
```

### Badge Component

```tsx
// Variants
<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>

// With custom colors for status
<Badge 
  variant="outline" 
  className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
>
  Approved
</Badge>
```

### Item Number Badge

```tsx
<span className="w-6 h-6 flex items-center justify-center rounded-md bg-[#5C1A1B] text-white text-xs font-bold">
  {index + 1}
</span>

// Alternative using CSS variable
<span className="w-7 h-7 flex items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
  {index + 1}
</span>
```

---

## Spacing & Layout

### Spacing Scale

| Class | Size | Use Case |
|-------|------|----------|
| `gap-2` | 8px | Icon + text |
| `gap-3` | 12px | Related items |
| `gap-4` | 16px | Form fields |
| `gap-5` | 20px | Card padding |
| `gap-6` | 24px | Major sections |

### Page Layout Pattern

```tsx
<div className="space-y-6">
  <RouteBasedPageHeader />
  
  {/* Logo Section */}
  <div className="flex items-center justify-center py-4">
    <Image src="/app-logo.svg" ... />
  </div>
  
  {/* Main Content */}
  <Card>...</Card>
  
  {/* Action Buttons */}
  <div className="flex items-center justify-end gap-3">
    ...
  </div>
</div>
```

### Grid Layouts

**Order Details Grid:**
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* 4-column info grid */}
</div>
```

**Content + Sidebar:**
```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2 space-y-4">
    {/* Main content */}
  </div>
  <div className="space-y-4">
    {/* Sidebar */}
  </div>
</div>
```

### Item Container Pattern

```tsx
<div className="relative bg-muted/40 dark:bg-muted/20 rounded-lg p-4 space-y-4">
  {/* Item Header */}
  <div className="flex items-center justify-between">
    {/* Number badge + title */}
  </div>
  
  {/* Item Content */}
  <div className="grid gap-4">
    {/* Form fields or info */}
  </div>
</div>
```

---

## Interaction States

### Focus States

All interactive elements use consistent focus styling:

```css
focus-visible:border-ring
focus-visible:ring-ring/50
focus-visible:ring-[3px]
```

### Hover States

**Buttons:**
```css
hover:bg-primary/90      /* Primary */
hover:bg-accent          /* Outline */
hover:bg-secondary/80    /* Secondary */
hover:bg-accent          /* Ghost */
```

**Cards/Items:**
```css
hover:bg-accent         /* Interactive items */
hover:border-primary/30 /* Attachment cards */
```

### Disabled States

```css
disabled:pointer-events-none
disabled:opacity-50
disabled:cursor-not-allowed
```

### Loading States

```tsx
// Button loading
<Button disabled={loading}>
  <Loader2 className="h-4 w-4 me-2 animate-spin" />
  {loadingText}
</Button>

// Submission states
{submitting ? t('common.creating') : t('orders.createOrder')}
{isSubmittingReview ? t('orders.engineering.submitting') : t('orders.engineering.completeReview')}
```

---

## Status Badges

### Order Status Configuration

```tsx
const statusConfig: Record<string, { className: string; labelKey: string }> = {
  'تم اجراء الطلب': { 
    className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700', 
    labelKey: 'orders.status.requestCreated' 
  },
  'تمت المراجعة الهندسية': { 
    className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800', 
    labelKey: 'orders.status.engineeringReviewed' 
  },
  'مراجعة الطلب من الادارة': { 
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800', 
    labelKey: 'orders.status.underAdminReview' 
  },
  'تمت الموافقة من الادارة': { 
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', 
    labelKey: 'orders.status.ownerApproved' 
  },
  'تم الرفض من الادارة': { 
    className: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-800', 
    labelKey: 'orders.status.ownerRejected' 
  },
  'جاري الان عملية الشراء': { 
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-800', 
    labelKey: 'orders.status.purchasingInProgress' 
  },
  'تم غلق طلب الشراء': { 
    className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 border-purple-200 dark:border-purple-800', 
    labelKey: 'orders.status.closed' 
  },
};
```

### Item Status Badges

**Purchased:**
```tsx
<Badge variant="outline" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
  <CheckCircle2 className="h-3 w-3 me-1" />
  {t('orders.itemStatus.purchased')}
</Badge>
```

**Not Purchased:**
```tsx
<Badge variant="outline" className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-800">
  <XCircle className="h-3 w-3 me-1" />
  {t('orders.itemStatus.notPurchased')}
</Badge>
```

**Pending:**
```tsx
<Badge variant="outline" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700">
  <Clock className="h-3 w-3 me-1" />
  {t('orders.itemStatus.pending')}
</Badge>
```

---

## Reusable Patterns

### 1. Page Header Pattern

```tsx
<>
  <RouteBasedPageHeader />
  
  {/* Brand Logo */}
  <div className="flex items-center justify-center py-4">
    <Image src="/app-logo.svg" alt="Fast-Track" width={180} height={60} className="h-12 w-auto" priority />
  </div>
  
  {/* Action Buttons (optional) */}
  <div className="flex justify-end gap-2 flex-wrap">
    {actions}
  </div>
</>
```

### 2. Card with Branded Header

```tsx
<Card className="overflow-hidden p-0 gap-0">
  <div className="bg-[#5C1A1B] px-5 py-4 flex items-center gap-3">
    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/15">
      <Icon className="h-4 w-4 text-white" />
    </div>
    <span className="font-semibold text-white">{title}</span>
  </div>
  <CardContent className="p-5 space-y-5">
    {children}
  </CardContent>
</Card>
```

### 3. List Item Pattern

```tsx
<div className="relative bg-muted/40 dark:bg-muted/20 rounded-lg p-4 space-y-4">
  <div className="flex items-center justify-between">
    <div className="inline-flex items-center gap-2">
      <span className="w-6 h-6 flex items-center justify-center rounded-md bg-[#5C1A1B] text-white text-xs font-bold">
        {index + 1}
      </span>
      <span className="text-sm font-medium text-muted-foreground">
        {label}
      </span>
    </div>
    {/* Actions */}
  </div>
  {/* Content */}
</div>
```

### 4. Info Display Pattern

```tsx
<div>
  <p className="text-sm text-muted-foreground">{label}</p>
  <p className="font-medium">{value}</p>
</div>
```

### 5. Warning/Alert Pattern

```tsx
<div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-center gap-2">
  <Clock className="h-4 w-4 text-amber-600 shrink-0" />
  <p className="text-sm text-amber-700 dark:text-amber-400">
    {message}
  </p>
</div>
```

### 6. Attachment Preview Grid

```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
  {attachments.map((attachment) => (
    <div className="group relative bg-muted/30 dark:bg-muted/20 rounded-lg overflow-hidden border border-border/50 hover:border-primary/30 transition-all">
      <div className="aspect-square relative">
        {/* Preview content */}
      </div>
      <div className="p-2">
        <p className="text-xs text-muted-foreground truncate">{filename}</p>
      </div>
    </div>
  ))}
</div>
```

---

## Consistency Guidelines

### ✅ DO

1. **Use CSS variables** for colors when possible (`bg-primary`, `text-foreground`)
2. **Use translation keys** for all text (`t('key')`)
3. **Use gap utilities** for spacing (`gap-3`, `gap-4`)
4. **Use the shared components** from `/components/ui/`
5. **Follow RTL-first approach** - don't add manual `dir` attributes
6. **Use `me-*` and `ms-*`** for logical margins (RTL-aware)
7. **Include dark mode variants** for custom colors
8. **Use consistent icon sizes** (`h-4 w-4`, `h-5 w-5`)

### ❌ DON'T

1. Don't use hardcoded colors outside of brand maroon (`#5C1A1B`)
2. Don't use static text strings
3. Don't use margins (`m-*`) - use flex/grid with gap
4. Don't create custom components for existing UI patterns
5. Don't add manual RTL handling
6. Don't use `ml-*` or `mr-*` - use `ms-*` or `me-*`

### Icon Size Guidelines

| Context | Size |
|---------|------|
| Inline with text | `h-4 w-4` |
| Card header icons | `h-4 w-4` to `h-5 w-5` |
| Badge icons | `h-3 w-3` |
| Large feature icons | `h-10 w-10` |

### Border Radius

| Element | Class |
|---------|-------|
| Cards | `rounded-xl` |
| Buttons | `rounded-md` |
| Inputs | `rounded-md` |
| Badges | `rounded-md` |
| Icon containers | `rounded-lg` |
| Item containers | `rounded-lg` |

---

## Quick Reference

### Brand Colors (Copy-Paste)

```tsx
// Primary Brand Color (Maroon)
className="bg-[#5C1A1B]"
className="bg-primary"

// White on brand
className="text-white"
className="text-primary-foreground"

// Semi-transparent white
className="bg-white/15"
className="bg-white/25"
```

### Common Class Combinations

```tsx
// Card header
"bg-[#5C1A1B] px-5 py-4 flex items-center gap-3"

// Icon container in header
"flex items-center justify-center w-9 h-9 rounded-lg bg-white/15"

// Item container
"relative bg-muted/40 dark:bg-muted/20 rounded-lg p-4 space-y-4"

// Number badge
"w-6 h-6 flex items-center justify-center rounded-md bg-[#5C1A1B] text-white text-xs font-bold"

// Status badge base
"bg-[status]-100 text-[status]-700 dark:bg-[status]-900/50 dark:text-[status]-300 border-[status]-200 dark:border-[status]-800"
```

---

## Print Styles

For print functionality, the application includes comprehensive print styles in `globals.css`:

```css
@media print {
  /* Brand color for print headers */
  .print-invoice-header {
    border-bottom: 2pt solid #5C1A1B !important;
  }
  
  .print-invoice-title h1 {
    color: #5C1A1B !important;
  }
  
  .print-invoice-table th {
    background: #5C1A1B !important;
    color: white !important;
  }
}
```

---

*This design system documentation is based on the Create Order, Order Details, Admin View, Engineering View, and Purchasing View pages of the Fast Track Purchasing application.*