/**
 * Generic Excel Upload Configuration Types
 * These types define the structure for configuring the ExcelSheetUpload component
 * to work with any entity type (products, users, orders, etc.)
 */

/**
 * Validation rule for a field
 */
export interface FieldValidation {
  /** Whether the field is required */
  required?: boolean
  /** Field must be a valid number */
  isNumber?: boolean
  /** Field must be a positive number */
  isPositive?: boolean
  /** Field must be non-negative (>= 0) */
  isNonNegative?: boolean
  /** Minimum value for numbers */
  min?: number
  /** Maximum value for numbers */
  max?: number
  /** Minimum length for strings */
  minLength?: number
  /** Maximum length for strings */
  maxLength?: number
  /** Must be one of these values (enum) */
  oneOf?: (string | number)[]
  /** Custom validation function (can be async) */
  custom?: (value: any, rowData: any) => string | null | Promise<string | null>
  /** Error message to display if validation fails */
  errorMessage?: string
}

/**
 * Editable input configuration for table cells
 */
export interface EditableInputConfig {
  /** Input type */
  type: 'text' | 'number' | 'email' | 'url' | 'date' | 'select' | 'file' | 'image'
  /** Placeholder text */
  placeholder?: string
  /** Options for select type */
  options?: Array<{ value: any; label: string }>
  /** Accept attribute for file inputs (e.g., 'image/*') */
  accept?: string
  /** Maximum file size in MB */
  maxFileSizeMB?: number
  /** Custom onChange handler */
  onChange?: (value: any, rowIndex: number, fieldName: string) => void
  /** Whether this field is editable (default: true) */
  disabled?: boolean
  /** Input attributes */
  attributes?: Record<string, any>
}

/**
 * Column definition for Excel template
 */
export interface ColumnDefinition {
  /** Display name in Excel header */
  excelHeader: string
  /** Field name in the API/form data */
  fieldName: string
  /** Whether this field is required */
  required: boolean
  /** Data type of the field */
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum'
  /** Sample value for template */
  sampleValue?: any
  /** Validation rules for this field */
  validation?: FieldValidation
  /** Tooltip/description for the field */
  description?: string
  /** Transform function to convert Excel value to API value */
  transform?: (value: any) => any
  /** Whether this field should be included in API request (default: true) */
  includeInPayload?: boolean
  /** Whether to show this column in the preview table (default: true) */
  showInTable?: boolean
  /** Custom render function for table display */
  tableRender?: (value: any, rowData: any) => React.ReactNode
  /** Column width in table (e.g., '100px', '20%') */
  tableWidth?: string
  /** Editable input configuration for table cells */
  editableInput?: EditableInputConfig
  /** Dynamic dropdown generator for Excel cells (async function that returns array of options) */
  excelDropdownGenerator?: () => Promise<string[]>
}

/**
 * Validation error structure
 */
export interface ValidationError {
  row: number
  field: string
  message: string
}

/**
 * Validated row result
 */
export interface ValidatedRow<T = any> {
  row: number
  data: Partial<T>
  isValid: boolean
  errors: ValidationError[]
}

/**
 * Upload progress tracking
 */
export interface UploadProgress {
  total: number
  completed: number
  failed: number
  current: string
}

/**
 * Upload result for a single item
 */
export interface UploadResult {
  success: boolean
  row: number
  message?: string
  error?: string
}

/**
 * File attachment configuration
 */
export interface FileAttachment {
  /** Field name in the form data */
  fieldName: string
  /** File generator function or static file */
  generator: (rowData: any) => File | Promise<File>
}

/**
 * Table display configuration
 */
export interface TableDisplayConfig {
  /** Maximum number of columns to show (default: show all) */
  maxColumns?: number
  /** Maximum table height (default: '24rem' / 384px) */
  maxHeight?: string
  /** Show row numbers (default: true) */
  showRowNumbers?: boolean
  /** Show status column (default: true) */
  showStatus?: boolean
  /** Enable table by default when data loads (default: false) */
  autoShowTable?: boolean
  /** Enable editable inputs in table cells (default: false) */
  enableEditing?: boolean
}

/**
 * Main Excel Upload Configuration
 */
export interface ExcelUploadConfig<T = any> {
  /** Unique identifier for this configuration */
  id: string
  
  /** Display name for the upload feature */
  name: string
  
  /** Description shown to users */
  description: string
  
  /** Column definitions for the Excel template */
  columns: ColumnDefinition[]
  
  /** Template filename (e.g., 'products_template.xlsx') */
  templateFileName: string
  
  /** Sheet name in the workbook */
  sheetName: string
  
  /** Upload function that handles creating/updating records */
  uploadFunction: (data: FormData | Partial<T>) => Promise<any>
  
  /** Expected success response indicator (e.g., status === 1) */
  successValidator: (response: any) => boolean
  
  /** File attachments to include with each upload */
  fileAttachments?: FileAttachment[]
  
  /** Delay between uploads in milliseconds (default: 500) */
  uploadDelay?: number
  
  /** Custom validation function for entire row */
  rowValidator?: (rowData: any, rowIndex: number) => ValidationError[]
  
  /** Translation key prefix (e.g., 'products.excel') */
  translationPrefix?: string
  
  /** Whether to use FormData (true) or JSON (false) for upload */
  useFormData?: boolean
  
  /** Maximum file size in MB */
  maxFileSizeMB?: number
  
  /** Batch size for parallel uploads (default: 1 for sequential) */
  batchSize?: number
  
  /** Table display configuration */
  tableDisplay?: TableDisplayConfig
}

/**
 * Generic Excel row data structure
 */
export type ExcelRowData = Record<string, any>

/**
 * Helper type for extracting field names from columns
 */
export type ExtractFieldNames<Config extends ExcelUploadConfig> = 
  Config['columns'][number]['fieldName']
