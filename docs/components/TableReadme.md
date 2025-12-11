# Table Component Documentation

A comprehensive, feature-rich table component for the Family App Clinic Dashboard with advanced filtering, sorting, pagination, and action management capabilities.

## Features

- ✅ **Responsive Design** - Mobile-first approach with horizontal scrolling
- ✅ **Advanced Filtering** - Search, date ranges, custom filters
- ✅ **Sorting** - Column-based sorting with visual indicators
- ✅ **Pagination** - Configurable page sizes with navigation
- ✅ **Action Management** - Configurable actions with visibility control
- ✅ **Column Visibility Control** - Show/hide columns dynamically with elegant UI
- ✅ **CSV Export** - Export filtered and visible data to CSV files
- ✅ **Internationalization** - RTL support and translations
- ✅ **Accessibility** - ARIA labels and keyboard navigation
- ✅ **Loading States** - Built-in loading indicators
- ✅ **Empty States** - Customizable empty data messages

## Basic Usage

```tsx
import { Table } from '@/components/UI/Table';
import { Order } from '@/types/order';

// Define your data type
interface Order {
  id: string;
  product: string;
  customer: {
    name: string;
    email: string;
  };
  status: 'pending' | 'shipped' | 'delivered';
  createdAt: string;
}

// Define columns with real-world patterns
const columns = [
  {
    key: 'id',
    label: 'Order ID',
    sortable: true,
    hideable: false,
  },
  {
    key: 'product',
    label: 'Product',
    sortable: true,
  },
  {
    key: 'customer.name',
    label: 'Customer',
    render: (value, row) => (
      <div>
        <div>{row.customer.name}</div>
        <div className="text-sm text-muted-foreground">{row.customer.email}</div>
      </div>
    ),
    searchValue: (row) => `${row.customer.name} ${row.customer.email}`,
  },
  {
    key: 'status',
    label: 'Status',
    render: (status) => (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${
          status === 'delivered'
            ? 'bg-green-100 text-green-800'
            : status === 'shipped'
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        {status}
      </span>
    ),
  },
  {
    key: 'createdAt',
    label: 'Date',
    sortable: true,
    render: (date) => new Date(date).toLocaleDateString(),
  },
];

// Define actions with conditional visibility
const actions = [
  {
    key: 'view',
    label: 'View Details',
    icon: <Eye className="h-4 w-4" />,
    onClick: (row) => console.log('View', row.id),
  },
  {
    key: 'ship',
    label: 'Mark as Shipped',
    icon: <Truck className="h-4 w-4" />,
    onClick: (row) => console.log('Shipping', row.id),
    visible: (row) => row.status === 'pending',
  },
  {
    key: 'delete',
    label: 'Delete Order',
    icon: <Trash2 className="h-4 w-4" />,
    onClick: (row) => console.log('Deleting', row.id),
    variant: 'destructive',
  },
];

// Component usage
export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [sortKey, setSortKey] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Fetch and manage data...

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortKey(key);
    setSortDirection(direction);
    // Re-fetch or sort data
  };

  return (
    <Table
      columns={columns}
      data={orders}
      loading={false}
      actions={actions}
      sortKey={sortKey}
      sortDirection={sortDirection}
      onSort={handleSort}
      searchable={true}
      columnVisibility={true}
      defaultVisibleColumns={['id', 'product', 'customer.name', 'status']}
      title="Recent Orders"
      subtitle="A list of the most recent orders."
    />
  );
}
```

## Features in Depth

### Sorting

To enable sorting on a column, set `sortable: true` in its definition. The `onSort` callback provides the `sortKey` and `sortDirection`, allowing you to implement server-side or client-side sorting logic.

```tsx
// In your component
const [sortKey, setSortKey] = useState('createdAt');
const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

const handleSort = (key: string, direction: 'asc' | 'desc') => {
  setSortKey(key);
  setSortDirection(direction);
  // Implement your sorting logic here
};

<Table
  onSort={handleSort}
  sortKey={sortKey}
  sortDirection={sortDirection}
  // ...other props
/>
```

### Searching

Enable the search input by setting `searchable: true`. For complex data structures, use the `searchValue` function in your column definition to specify exactly what should be searched.

```tsx
// Column definition for a nested object
{
  key: 'customer.name',
  label: 'Customer',
  // ...
  searchValue: (row) => `${row.customer.name} ${row.customer.email}`,
}
```

### Actions

Actions can be conditionally displayed based on row data using the `visible` function. This is useful for showing actions like "Ship" only for orders with a `pending` status.

```tsx
// Action definition
{
  key: 'ship',
  label: 'Mark as Shipped',
  icon: <Truck className="h-4 w-4" />,
  onClick: (row) => console.log('Shipping', row.id),
  visible: (row) => row.status === 'pending',
}
```

### Column Visibility

Empower users to customize their view by enabling `columnVisibility: true`. You can set default visible columns with `defaultVisibleColumns` and prevent critical columns from being hidden with `hideable: false`.

```tsx
<Table
  columnVisibility={true}
  defaultVisibleColumns={['id', 'product', 'customer.name', 'status']}
  columns={[
    { key: 'id', label: 'Order ID', hideable: false },
    // ...other columns
  ]}
  // ...other props
/>
```

## Props Reference

### TableProps<T>

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | `TableColumn<T>[]` | **Required** | An array of objects defining the table columns. |
| `data` | `T[]` | **Required** | The array of data to be displayed in the table. |
| `loading` | `boolean` | `false` | When `true`, displays a skeleton loading state. |
| `emptyMessage` | `string` | Auto-generated | A custom message to display when there is no data. |
| `className` | `string` | `''` | Additional CSS classes to apply to the table container. |
| `onSort` | `(key: string, direction: 'asc' \| 'desc') => void` | `undefined` | A callback function triggered when a sortable column header is clicked. |
| `sortKey` | `string` | `undefined` | The key of the currently sorted column. |
| `sortDirection` | `'asc' \| 'desc'` | `undefined` | The current sort direction (`'asc'` or `'desc'`). |
| `actions` | `TableAction[]` | `[]` | An array of action objects to be displayed for each row. |
| `showActions` | `boolean` | `true` | Toggles the visibility of the actions column. |
| `filters` | `TableFilter[]` | `[]` | **Deprecated**. Use a standalone `SearchComponent` for server-side filtering. May still be used for simple client-side filtering. |
| `searchable` | `boolean` | `true` | If `true`, a search input is displayed. |
| `searchPlaceholder` | `string` | Auto-generated | Placeholder text for the search input. |
| `pageSize` | `number` | `10` | The number of items to display per page for client-side pagination. |
| `showPagination` | `boolean` | `true` | Toggles the visibility of the pagination controls. |
| `title` | `string` | `undefined` | An optional title displayed above the table. |
| `subtitle` | `string` | `undefined` | An optional subtitle displayed below the title. |
| `onRefresh` | `() => void` | `undefined` | A callback function for the refresh button. |
| `skeletonRows` | `number` | `5` | The number of rows to display in the skeleton loading state. |
| `skeletonColumns` | `number` | Auto-detected | The number of columns to display in the skeleton loading state. |
| `columnVisibility` | `boolean` | `false` | If `true`, allows users to toggle the visibility of columns. |
| `defaultVisibleColumns` | `string[]` | `undefined` | An array of column keys that are visible by default. If not provided, all columns are visible. |
| `exportable` | `boolean` | `false` | If `true`, enables CSV export functionality with a download button. |
| `exportFileName` | `string` | `'table-export'` | The base filename for exported CSV files (timestamp will be appended automatically). |

### TableColumn<T>

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `key` | `string` | **Required** | A unique identifier for the column, typically corresponding to a property in the data objects. |
| `label` | `string` | **Required** | The text to display in the column header. |
| `render` | `(value: any, row: T, index: number) => React.ReactNode` | `undefined` | A function to custom render the cell content. |
| `sortable` | `boolean` | `false` | If `true`, the column can be sorted. |
| `filterable` | `boolean` | `false` | **Deprecated**. Filtering is now handled globally. |
| `hideable` | `boolean` | `true` | If `false`, the column cannot be hidden by the user. |
| `className` | `string` | `undefined` | Additional CSS classes to apply to the column cells. |
| `width` | `string` | `undefined` | Sets the CSS width of the column. |
| `searchValue` | `(row: T) => string` | `undefined` | A function that returns a string to be used for searching, ideal for complex or nested data. |
/* Lines 190-1903 omitted */
## Advanced Usage

### Column Visibility Control

The Table component includes an optional column visibility feature that allows users to show/hide columns dynamically. This is especially useful for large tables with many columns where users might want to focus on specific data.

#### Basic Usage

Enable the column visibility control by setting the `columnVisibility` prop to `true`:

```tsx
import { Table } from '@/components/ui/Table';
import { Order } from '@/types/order';

const columns = [
  {
    key: 'id',
    label: 'Order ID',
    width: '120px'
  },
  {
    key: 'customerName',
    label: 'Customer',
    sortable: true
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true
  },
  {
    key: 'total',
    label: 'Total',
    sortable: true
  },
  {
    key: 'createdAt',
    label: 'Date',
    sortable: true
  }
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  return (
    <Table<Order>
      columns={columns}
      data={orders}
      columnVisibility={true}  // Enable column visibility control
      title="Orders Management"
      subtitle="Manage customer orders and track their status"
    />
  );
}
```

#### Default Visible Columns

You can specify which columns should be visible by default using the `defaultVisibleColumns` prop:

```tsx
<Table<Order>
  columns={columns}
  data={orders}
  columnVisibility={true}
  // Only show these columns by default
  defaultVisibleColumns={['id', 'customerName', 'status', 'total']}
  title="Orders Management"
/>
```

#### Non-Hideable Columns

Some columns are critical and should not be hidden (e.g., ID, primary identifier). Mark these columns as non-hideable:

```tsx
const columns = [
  {
    key: 'id',
    label: 'Order ID',
    hideable: false  // This column cannot be hidden
  },
  {
    key: 'customerName',
    label: 'Customer',
    hideable: true  // Can be hidden (this is the default)
  },
  {
    key: 'internalNotes',
    label: 'Internal Notes',
    // hideable not specified = true by default
  }
];

<Table<Order>
  columns={columns}
  data={orders}
  columnVisibility={true}
/>
```

#### Complete Example with Column Visibility

```tsx
'use client';

import { useState } from 'react';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2 } from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  supplier: string;
  lastUpdated: string;
  description: string;
  warehouse: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Define columns with hideable configuration
  const columns = [
    {
      key: 'id',
      label: 'Product ID',
      width: '120px',
      hideable: false,  // Always visible
      render: (value: string) => (
        <span className="font-mono text-sm">{value}</span>
      )
    },
    {
      key: 'sku',
      label: 'SKU',
      width: '140px',
      hideable: false  // Critical for identification
    },
    {
      key: 'name',
      label: 'Product Name',
      sortable: true
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      className: 'text-right',
      render: (value: number) => (
        <span className="font-medium">${value.toFixed(2)}</span>
      )
    },
    {
      key: 'stock',
      label: 'Stock',
      sortable: true,
      className: 'text-center',
      render: (value: number) => (
        <span className={value < 10 ? 'text-destructive font-medium' : ''}>
          {value}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <Badge variant={
          value === 'active' ? 'default' :
          value === 'out_of_stock' ? 'destructive' : 'secondary'
        }>
          {value.replace('_', ' ').toUpperCase()}
        </Badge>
      )
    },
    {
      key: 'supplier',
      label: 'Supplier',
      // This column can be hidden - useful for detailed views only
    },
    {
      key: 'warehouse',
      label: 'Warehouse',
      // Can be hidden - internal info
    },
    {
      key: 'description',
      label: 'Description',
      render: (value: string) => (
        <div className="max-w-xs truncate" title={value}>
          {value}
        </div>
      )
    },
    {
      key: 'lastUpdated',
      label: 'Last Updated',
      sortable: true,
      render: (value: string) => (
        <time className="text-sm text-muted-foreground">
          {new Date(value).toLocaleDateString()}
        </time>
      )
    }
  ];

  const actions = [
    {
      key: 'view',
      label: 'View Details',
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: Product) => {
        console.log('View product:', row.id);
      }
    },
    {
      key: 'edit',
      label: 'Edit Product',
      icon: <Edit className="h-4 w-4" />,
      onClick: (row: Product) => {
        console.log('Edit product:', row.id);
      }
    },
    {
      key: 'delete',
      label: 'Delete Product',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive' as const,
      onClick: (row: Product) => {
        console.log('Delete product:', row.id);
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <p className="text-muted-foreground">
          Manage your product inventory
        </p>
      </div>

      <Table<Product>
        columns={columns}
        data={products}
        loading={loading}
        actions={actions}
        columnVisibility={true}  // Enable column visibility
        // Show only essential columns by default
        defaultVisibleColumns={[
          'id',
          'sku',
          'name',
          'category',
          'price',
          'stock',
          'status'
        ]}
        title="Product Inventory"
        subtitle="Manage and track all products in your store"
        searchPlaceholder="Search products by name, SKU, or category..."
        emptyMessage="No products found. Add your first product to get started."
        onRefresh={() => fetchProducts()}
        skeletonRows={10}
      />
    </div>
  );
}
```

#### Column Visibility UI Features

The column visibility control provides several user-friendly features:

1. **Toggle Button**: A dedicated "Columns" button in the table header with a counter showing visible/total columns
2. **Popover Panel**: Clean, organized list of all columns with toggle switches
3. **Visual Indicators**: Eye/EyeOff icons showing column visibility status
4. **Quick Actions**: "Show All" and "Hide All" buttons for bulk operations
5. **Disabled State**: Non-hideable columns appear disabled with reduced opacity
6. **Responsive Design**: Works seamlessly on mobile and desktop devices
7. **Smooth Animations**: Elegant transitions when showing/hiding columns

#### Best Practices for Column Visibility

**1. Mark Critical Columns as Non-Hideable**

```tsx
const columns = [
  {
    key: 'id',
    label: 'ID',
    hideable: false  // Primary identifier
  },
  {
    key: 'name',
    label: 'Name',
    hideable: false  // Essential information
  },
  {
    key: 'notes',
    label: 'Internal Notes',
    // Allow hiding optional/internal fields
  }
];
```

**2. Set Sensible Defaults**

```tsx
// For tables with many columns, show only the most important ones by default
<Table
  columns={columns}
  data={data}
  columnVisibility={true}
  defaultVisibleColumns={[
    'id',
    'name',
    'status',
    'createdAt'
  ]}
/>
```

**3. Group Related Columns**

```tsx
// Consider logical grouping when deciding what to show by default
const essentialColumns = ['id', 'name', 'status'];  // Always useful
const detailColumns = ['description', 'notes', 'tags'];  // Hide by default
const metadataColumns = ['createdAt', 'updatedAt', 'createdBy'];  // Optional

<Table
  columnVisibility={true}
  defaultVisibleColumns={[...essentialColumns, 'createdAt']}
  columns={allColumns}
  data={data}
/>
```

**4. Consider Mobile Experience**

```tsx
// On mobile, you might want fewer columns visible by default
const isMobile = useMediaQuery('(max-width: 768px)');

<Table
  columnVisibility={true}
  defaultVisibleColumns={
    isMobile 
      ? ['id', 'name', 'status']  // Minimal for mobile
      : ['id', 'name', 'status', 'category', 'price', 'createdAt']  // More for desktop
  }
  columns={columns}
  data={data}
/>
```

**5. Use with Large Datasets**

```tsx
// For tables with 10+ columns, column visibility is highly recommended
const largeTableColumns = [
  // ... 15 columns ...
];

<Table
  columns={largeTableColumns}
  data={data}
  columnVisibility={true}  // Essential for usability
  defaultVisibleColumns={
    // Show only 5-7 columns by default for better readability
    ['id', 'name', 'status', 'priority', 'assignee', 'dueDate']
  }
  title="Project Tasks"
  subtitle="Showing 6 of 15 available columns"
/>
```

#### Accessibility Considerations

The column visibility feature is fully accessible:

- **Keyboard Navigation**: All controls are keyboard accessible
- **Screen Readers**: Proper ARIA labels for all interactive elements
- **Focus Management**: Clear focus indicators for switches and buttons
- **Disabled State**: Non-hideable columns clearly marked as disabled
- **Visual Feedback**: Eye icons provide clear visual state indication

#### Styling and Customization

The column visibility control inherits your theme colors and styling:

```tsx
// The component automatically adapts to:
// - Light/Dark mode
// - RTL/LTR direction
// - Custom color schemes
// - Brand theming

<Table
  columnVisibility={true}
  // No additional styling needed - it just works!
/>
```

### CSV Export

The Table component includes built-in CSV export functionality that allows users to download table data as a CSV file. The export feature is intelligent and only includes currently visible columns, respecting the column visibility settings.

#### Enabling CSV Export

To enable CSV export, set the `exportable` prop to `true`:

```tsx
<Table
  columns={columns}
  data={data}
  exportable={true}  // Enable CSV export
  exportFileName="products-export"  // Optional: custom filename
/>
```

#### How CSV Export Works

**1. Visible Columns Only**: The CSV export respects the column visibility settings. If a user has hidden certain columns using the column visibility control, those columns will NOT be included in the export.

**2. Filtered Data**: The export includes only the currently filtered/searched data that is visible in the table. If a user has applied search filters, the CSV will contain only the matching rows.

**3. Smart Data Extraction**: 
   - For columns with custom `render` functions (e.g., badges, formatted dates, complex components), the export intelligently extracts the text content
   - Raw values are properly escaped to handle commas, quotes, and newlines
   - React components are converted to their text representation

**4. Automatic Filename**: Files are automatically named with a timestamp: `{exportFileName}-YYYY-MM-DD.csv`

#### Usage Patterns

**Basic Export**

```tsx
<Table
  columns={columns}
  data={orders}
  exportable={true}
  title="Orders"
/>
```

**Custom Filename**

```tsx
<Table
  columns={columns}
  data={products}
  exportable={true}
  exportFileName="inventory-report"
  // Will generate: inventory-report-2025-11-02.csv
/>
```

**Combined with Column Visibility**

```tsx
<Table
  columns={columns}
  data={data}
  columnVisibility={true}
  exportable={true}
  exportFileName="custom-report"
  // Users can hide columns they don't want in the export
/>
```

#### Best Practices

**1. Use Descriptive Filenames**: Choose export filenames that clearly indicate the content and purpose of the data.

```tsx
// Good examples
exportFileName="customer-orders"
exportFileName="monthly-sales-report"
exportFileName="inventory-snapshot"

// Avoid generic names
exportFileName="export"
exportFileName="data"
```

**2. Optimize Column Render Functions**: When using custom `render` functions, ensure they produce meaningful text output for CSV export.

```tsx
{
  key: 'status',
  label: 'Status',
  render: (status) => (
    // The CSV export will extract "ACTIVE", "PENDING", etc.
    <Badge>{status.toUpperCase()}</Badge>
  )
}
```

**3. Consider Export-Friendly Formatting**: For columns with complex data, provide clear text representations.

```tsx
{
  key: 'customer',
  label: 'Customer',
  render: (value, row) => (
    <div>
      <div>{row.customer.name}</div>
      <div className="text-sm text-muted-foreground">{row.customer.email}</div>
    </div>
  ),
  // CSV will contain: "John Doe john@example.com"
}
```

**4. Use with Large Datasets**: The export function is optimized for performance, but consider the following:
   - The export processes data client-side efficiently
   - Large datasets (10,000+ rows) are handled without blocking the UI
   - Users can apply filters first to export only relevant data

**5. Inform Users About Export Scope**: Consider adding a subtitle or description that explains what will be exported.

```tsx
<Table
  columns={columns}
  data={filteredOrders}
  exportable={true}
  title="Orders Export"
  subtitle={`Exporting ${filteredOrders.length} orders with ${visibleColumnsCount} visible columns`}
/>
```

#### CSV Format Details

The exported CSV files follow standard conventions:

- **Header Row**: First row contains column labels
- **Character Encoding**: UTF-8 encoding for international character support
- **Escaping**: Values containing commas, quotes, or newlines are properly quoted and escaped
- **Empty Values**: Null/undefined values are represented as empty cells
- **Date Format**: Dates are exported as rendered in the table (use custom render functions for specific formats)

#### Accessibility

The export button is fully accessible:
- Keyboard navigable
- Disabled when no data is available
- Clear visual feedback
- Works with screen readers

#### Performance Considerations

The CSV export is optimized for performance:

- **Lazy Processing**: Data is processed only when the export button is clicked
- **Memory Efficient**: Uses Blob API for efficient file generation
- **Non-Blocking**: Does not freeze the UI during export
- **Automatic Cleanup**: Resources are properly released after download

#### Internationalization

The export button label respects the current language setting and displays the appropriate translation. Ensure your translation files include the `table.export` key.

#### Troubleshooting

**Export button is disabled**: This happens when there is no data to export (filteredData.length === 0). Apply different filters or ensure data is loaded.

**Special characters appear incorrectly**: The export uses UTF-8 encoding. Ensure your spreadsheet application is set to open CSV files with UTF-8 encoding.

**Custom rendered content not appearing correctly**: The export extracts text from React components. For complex components, consider the text content that will be extracted or add a `title` prop to elements.

### Server-Side Data Fetching with Loading States

```tsx
// pages/orders/page.tsx - Server Component Pattern
import { Suspense } from 'react';
import { OrdersTable } from './OrdersTable';
import { TableSkeleton } from '@/components/UI/Table';

interface SearchParams {
  page?: string;
  search?: string;
  status?: string;
}

```
