# GenericForm Component

A reusable, configurable form component that can be used across different forms with different fields and validations.

## Features

- ✅ **Type-safe** - Full TypeScript support with generic types
- ✅ **Flexible field types** - Supports text, textarea, select, quill editor, image upload, switch, radio, checkbox, and custom fields
- ✅ **Auto-validation** - Built-in validation with Zod schemas
- ✅ **Sonner toast notifications** - Shows toast message when form is incomplete
- ✅ **Shadcn error styling** - Uses default Shadcn FormMessage for field-level errors
- ✅ **Auto-slug generation** - Automatically generates slugs from other fields
- ✅ **Dependent fields** - Supports dependent selects (e.g., subcategories based on category)
- ✅ **Manual edit tracking** - Tracks when fields are manually edited (useful for slug fields)
- ✅ **CustomSelect component** - Uses CustomSelect instead of default Select for better UX
- ✅ **Responsive grid** - Flexible grid layout for fields

## Basic Usage

```tsx
import { GenericForm } from '@/components/SharedCustomComponents/GenericForm'
import { z } from 'zod'
import { useTranslation } from '@/components/providers/LanguageProvider'

const MyFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  status: z.enum(['active', 'inactive']),
})

export function MyForm() {
  const { t, language } = useTranslation()

  const sections = [
    {
      title: 'form.sections.basicInfo',
      description: 'form.sections.basicInfoDesc',
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'form.title',
          placeholder: 'form.titlePlaceholder',
          description: 'form.titleDescription',
          required: true,
        },
        {
          name: 'description',
          type: 'quill',
          label: 'form.description',
          placeholder: 'form.descriptionPlaceholder',
          required: true,
        },
        {
          name: 'status',
          type: 'select',
          label: 'form.status',
          selectOptions: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ],
          required: true,
        },
      ],
    },
  ]

  const handleSubmit = async (data: z.infer<typeof MyFormSchema>) => {
    // Handle form submission
    console.log(data)
  }

  return (
    <GenericForm
      title="form.createTitle"
      description="form.createDescription"
      schema={MyFormSchema}
      sections={sections}
      defaultValues={{
        title: '',
        description: '',
        status: 'active',
      }}
      onSubmit={handleSubmit}
      submitButtonText="common.save"
      submitButtonLoadingText="common.saving"
      t={t}
      language={language}
    />
  )
}
```

## Field Types

### Text Field
```tsx
{
  name: 'title',
  type: 'text',
  label: 'form.title',
  placeholder: 'form.titlePlaceholder',
  required: true,
  gridCols: 2, // Optional: grid column span
}
```

### Textarea Field
```tsx
{
  name: 'description',
  type: 'textarea',
  label: 'form.description',
  required: true,
}
```

### Select Field
```tsx
{
  name: 'category',
  type: 'select',
  label: 'form.category',
  selectOptions: [
    { value: '1', label: 'Category 1' },
    { value: '2', label: 'Category 2' },
  ],
  selectOnChange: async (value) => {
    // Handle category change (e.g., load subcategories)
  },
  required: true,
}
```

### Dependent Select (Subcategory)
```tsx
{
  name: 'subcategory',
  type: 'select',
  label: 'form.subcategory',
  dependsOn: 'category', // Parent field name
  dependentOptionsLoader: async (categoryId) => {
    // Load subcategories based on category
    const response = await fetchSubcategories(categoryId)
    return response.map(cat => ({ value: cat.id, label: cat.name }))
  },
  required: true,
}
```

### Quill Editor Field
```tsx
{
  name: 'content',
  type: 'quill',
  label: 'form.content',
  placeholder: 'form.contentPlaceholder',
  required: true,
}
```

### Image Upload Field
```tsx
{
  name: 'image',
  type: 'image',
  label: 'form.image',
  description: 'form.imageDescription',
  imageMaxSize: 5, // MB
  imageAccept: 'image/*',
  required: true,
}
```

### Switch Field
```tsx
{
  name: 'is_active',
  type: 'switch',
  label: 'form.isActive',
  description: 'form.isActiveDescription',
  switchCheckedValue: 'active',
  switchUncheckedValue: 'inactive',
}
```

### Radio Group Field
```tsx
{
  name: 'gender',
  type: 'radio',
  label: 'form.gender',
  radioOptions: [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ],
  radioOrientation: 'horizontal', // 'horizontal' | 'vertical' (default: 'vertical')
  required: true,
}
```

### Checkbox Field (Single - Boolean)
```tsx
{
  name: 'agree_terms',
  type: 'checkbox',
  label: 'form.agreeTerms',
  description: 'form.agreeTermsDescription',
  checkboxSingle: true, // Single checkbox for boolean value
  checkboxCheckedValue: true,
  checkboxUncheckedValue: false,
  required: true,
}
```

### Checkbox Field (Multiple - Array)
```tsx
{
  name: 'interests',
  type: 'checkbox',
  label: 'form.interests',
  checkboxOptions: [
    { value: 'sports', label: 'Sports' },
    { value: 'music', label: 'Music' },
    { value: 'reading', label: 'Reading' },
    { value: 'travel', label: 'Travel' },
  ],
  checkboxOrientation: 'horizontal', // 'horizontal' | 'vertical' (default: 'vertical')
  required: true,
}
```

### Auto-Slug Generation
```tsx
{
  name: 'slug',
  type: 'text',
  label: 'form.slug',
  autoSlugFrom: 'title', // Field to generate slug from
  slugGenerator: (text) => {
    // Custom slug generator (optional, uses default if not provided)
    return text.toLowerCase().replace(/\s+/g, '-')
  },
  trackManualEdit: true, // Track if user manually edits slug
  onManualEdit: () => {
    // Callback when slug is manually edited
  },
  required: true,
}
```

### Custom Field Render
```tsx
{
  name: 'customField',
  type: 'custom',
  label: 'form.customField',
  customRender: (field, control) => {
    // Custom render function
    return <MyCustomComponent {...field} />
  },
}
```

## Advanced Features

### Custom Missing Fields Checker
```tsx
<GenericForm
  // ... other props
  getMissingFields={(values) => {
    const missing: string[] = []
    if (!values.title) missing.push(t('form.title'))
    if (!values.image && !values.existingImage) missing.push(t('form.image'))
    return missing
  }}
/>
```

### Custom Submit Button
```tsx
<GenericForm
  // ... other props
  customSubmitButton={
    <div className="flex gap-2">
      <Button type="button" variant="outline">Cancel</Button>
      <Button type="submit">Save</Button>
    </div>
  }
/>
```

### Form Actions
```tsx
<GenericForm
  // ... other props
  formActions={
    <Button type="button" variant="outline">
      Preview
    </Button>
  }
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | `string` | Yes | Form title (translation key) |
| `description` | `string` | No | Form description (translation key) |
| `schema` | `z.ZodSchema` | Yes | Zod validation schema |
| `sections` | `FormSection[]` | Yes | Form sections configuration |
| `defaultValues` | `Partial<TFieldValues>` | Yes | Default form values |
| `onSubmit` | `(data: TFieldValues) => Promise<void>` | Yes | Submit handler |
| `submitButtonText` | `string` | No | Submit button text (default: 'common.save') |
| `submitButtonLoadingText` | `string` | No | Loading text (default: 'common.saving') |
| `successRedirect` | `string` | No | Redirect path after success |
| `customSubmitButton` | `ReactNode` | No | Custom submit button |
| `formActions` | `ReactNode` | No | Additional form actions |
| `showMissingFieldsAlert` | `boolean` | No | Show missing fields alert (default: true) |
| `getMissingFields` | `(values) => string[]` | No | Custom missing fields checker |
| `t` | `(key: string) => string` | Yes | Translation function |
| `language` | `string` | No | Language code (default: 'ar') |

## Field Configuration

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | `string` | Yes | Field name (must match schema key) |
| `type` | `FieldType` | Yes | Field type (`text`, `textarea`, `select`, `quill`, `image`, `switch`, `radio`, `checkbox`, `custom`) |
| `label` | `string` | Yes | Field label (translation key) |
| `placeholder` | `string` | No | Placeholder text |
| `description` | `string` | No | Field description |
| `required` | `boolean` | No | Whether field is required |
| `gridCols` | `number` | No | Grid column span (1-12) |
| `selectOptions` | `FieldOption[]` | No | Options for select field |
| `selectOnChange` | `(value) => void` | No | Callback when select changes |
| `selectDisabled` | `boolean` | No | Disable the select field |
| `dependsOn` | `string` | No | Parent field for dependent select |
| `dependentOptionsLoader` | `(parentValue) => Promise<FieldOption[]>` | No | Loader for dependent options |
| `radioOptions` | `FieldOption[]` | No | Options for radio group |
| `radioOrientation` | `'horizontal' \| 'vertical'` | No | Radio group layout (default: 'vertical') |
| `checkboxOptions` | `FieldOption[]` | No | Options for multiple checkboxes |
| `checkboxOrientation` | `'horizontal' \| 'vertical'` | No | Checkbox group layout (default: 'vertical') |
| `checkboxSingle` | `boolean` | No | Use single checkbox for boolean value |
| `checkboxCheckedValue` | `any` | No | Value when checkbox is checked |
| `checkboxUncheckedValue` | `any` | No | Value when checkbox is unchecked |
| `switchCheckedValue` | `any` | No | Value when switch is on |
| `switchUncheckedValue` | `any` | No | Value when switch is off |
| `autoSlugFrom` | `string` | No | Field to generate slug from |
| `slugGenerator` | `(text) => string` | No | Custom slug generator |
| `trackManualEdit` | `boolean` | No | Track manual edits |
| `customRender` | `(field, control) => ReactNode` | No | Custom render function |

## FieldOption Type

```tsx
interface FieldOption {
  value: string
  label: string
  disabled?: boolean
}
```

## Examples

See `examples/newsFormConfig.ts` for a complete example of using GenericForm with the news form.



