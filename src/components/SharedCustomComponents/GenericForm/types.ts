import { z } from 'zod'
import { Control, FieldValues, Path, UseFormReturn } from 'react-hook-form'
import { ReactNode } from 'react'

/**
 * Form control type that includes setValue for selectOnChange callbacks
 */
export type FormControlWithMethods<TFieldValues extends FieldValues = FieldValues> = 
  Control<TFieldValues> & { setValue?: UseFormReturn<TFieldValues>['setValue'] }

/**
 * Field types supported by GenericForm
 */
export type FieldType = 
  | 'text' 
  | 'textarea' 
  | 'select' 
  | 'quill' 
  | 'image' 
  | 'switch' 
  | 'radio'
  | 'checkbox'
  | 'custom'

/**
 * Option type for select, radio, and checkbox fields
 */
export interface FieldOption {
  value: string | number
  label: string
  disabled?: boolean
}

/**
 * Field configuration for GenericForm
 */
export interface FormFieldConfig<TFieldValues extends FieldValues = FieldValues> {
  /** Field name (must match form schema key) */
  name: Path<TFieldValues>
  /** Field type */
  type: FieldType
  /** Field label (translation key or text) */
  label: string
  /** Field placeholder (translation key or text) */
  placeholder?: string
  /** Field description (translation key or text) */
  description?: string
  /** Whether field is required */
  required?: boolean
  /** Grid column span (1-12) */
  gridCols?: number
  
  // Select-specific
  selectOptions?: FieldOption[]
  selectOnChange?: (value: string, formControl: any) => void | Promise<void>
  selectDisabled?: boolean
  selectValue?: string | ((formValues: Partial<TFieldValues>) => string) // Custom value getter
  
  // Dependent select (for subcategories, etc.)
  dependsOn?: Path<TFieldValues>
  dependentOptionsLoader?: (parentValue: string) => Promise<FieldOption[]>
  dependentLoadingState?: boolean
  
  // Switch-specific
  switchCheckedValue?: any
  switchUncheckedValue?: any
  
  // Radio-specific
  radioOptions?: FieldOption[]
  radioOrientation?: 'horizontal' | 'vertical'
  
  // Checkbox-specific
  checkboxOptions?: FieldOption[]
  checkboxOrientation?: 'horizontal' | 'vertical'
  /** For single checkbox (boolean value) */
  checkboxSingle?: boolean
  checkboxCheckedValue?: any
  checkboxUncheckedValue?: any
  
  // Image-specific
  imageMaxSize?: number
  imageAccept?: string
  
  // Custom render function
  customRender?: (field: any, control: Control<TFieldValues>) => ReactNode
  
  // Custom className for the field wrapper or component
  className?: string
  
  // Quill-specific
  quillClassName?: string
  
  // Auto-slug generation
  autoSlugFrom?: Path<TFieldValues>
  slugGenerator?: (text: string) => string
  
  // Manual edit tracking (for slug fields)
  trackManualEdit?: boolean
  onManualEdit?: () => void
}

/**
 * Form section configuration
 */
export interface FormSection<TFieldValues extends FieldValues = FieldValues> {
  /** Section title (translation key or text) */
  title: string
  /** Section description (translation key or text) */
  description?: string
  /** Fields in this section */
  fields: FormFieldConfig<TFieldValues>[]
  /** Grid columns for this section (default: 1) */
  gridCols?: number
}

/**
 * GenericForm props
 */
export interface GenericFormProps<TFieldValues extends FieldValues = FieldValues> {
  /** Form title */
  title: string
  /** Form description */
  description?: string
  /** Zod validation schema */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: z.ZodType<TFieldValues, any, any>
  /** Form sections */
  sections: FormSection<TFieldValues>[]
  /** Default form values */
  defaultValues: Partial<TFieldValues>
  /** Submit handler */
  onSubmit: (data: TFieldValues) => Promise<void> | void
  /** Submit button text (translation key or text) */
  submitButtonText?: string
  /** Submit button loading text (translation key or text) */
  submitButtonLoadingText?: string
  /** Success redirect path */
  successRedirect?: string
  /** Custom submit button render */
  customSubmitButton?: ReactNode
  /** Additional form actions */
  formActions?: ReactNode
  /** Whether to show missing fields alert */
  showMissingFieldsAlert?: boolean
  /** Custom missing fields checker */
  getMissingFields?: (values: Partial<TFieldValues>) => string[]
  /** Translation function */
  t: (key: string) => string
  /** Language (for RTL support) */
  language?: string
  /** Callback when form is ready with form methods */
  onFormReady?: (formMethods: any) => void
}

