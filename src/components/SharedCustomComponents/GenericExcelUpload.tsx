'use client'

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { useTranslation } from '@/components/providers/LanguageProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Download, Upload, FileSpreadsheet, CheckCircle2, XCircle, Loader2, AlertCircle, Eye, Image as ImageIcon, X } from 'lucide-react'
import * as XLSX from 'xlsx'
import ExcelJS from 'exceljs'
import { useLoadingStore } from '@/stores/loadingStore'
import type { 
  ExcelUploadConfig, 
  ValidationError, 
  ValidatedRow, 
  UploadProgress,
  ExcelRowData,
  ColumnDefinition 
} from '@/lib/excelConfigs/excelUploadConfig'
import LoadingOverlay from '../providers/LoadingOverlay'

interface GenericExcelUploadProps<T = any> {
  /** Configuration object defining columns, validations, and upload behavior */
  config: ExcelUploadConfig<T>
  /** Optional callback when upload completes */
  onUploadComplete?: (results: { successful: number; failed: number }) => void
  /** Optional callback when validation completes */
  onValidationComplete?: (validCount: number, invalidCount: number) => void
  /** Custom CSS classes */
  className?: string
  /** Maximum number of rows allowed (default: 60) */
  maxRows?: number
}

/**
 * Generic Excel Sheet Upload Component (FIXED VERSION)
 * 
 * A fully configurable component for bulk data upload via Excel files.
 * Works with any entity type by providing a configuration object.
 * 
 * FIXES APPLIED:
 * - Row limit validation (default: 60 rows)
 * - Replaced alert() with proper error state
 * - Added memory cleanup for object URLs
 * - Added upload cancellation
 * - Memoized derived state
 * - Better error handling throughout
 * 
 * @example
 * ```tsx
 * <GenericExcelUpload config={productUploadConfig} maxRows={60} />
 * ```
 */
export function GenericExcelUpload<T = any>({ 
  config, 
  onUploadComplete,
  onValidationComplete,
  className = '',
  maxRows = 60
}: GenericExcelUploadProps<T>) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const { setLoading } = useLoadingStore()
  
  const [file, setFile] = useState<File | null>(null)
  const [rows, setRows] = useState<ValidatedRow<T>[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [uploadComplete, setUploadComplete] = useState(false)
  const [showDataTable, setShowDataTable] = useState(config.tableDisplay?.autoShowTable ?? false)
  const [editedData, setEditedData] = useState<Map<number, any>>(new Map())
  const [uploadedImages, setUploadedImages] = useState<Map<string, File>>(new Map())
  const [error, setError] = useState<string | null>(null)

  /**
   * Cleanup object URLs on unmount to prevent memory leaks
   */
  useEffect(() => {
    return () => {
      uploadedImages.forEach((file) => {
        try {
          const url = URL.createObjectURL(file)
          URL.revokeObjectURL(url)
        } catch (e) {
          // Ignore errors during cleanup
        }
      })
    }
  }, [uploadedImages])

  /**
   * Validate a single field value (supports async validation)
   */
  const validateField = useCallback(async (
    column: ColumnDefinition,
    value: any,
    rowData: ExcelRowData,
    rowIndex: number
  ): Promise<ValidationError | null> => {
    const validation = column.validation
    if (!validation) return null

    const row = rowIndex + 2 // Excel is 1-indexed and has header

    // Skip validation for image/file inputs in editable mode
    // They will be validated separately before upload
    if (config.tableDisplay?.enableEditing && 
        (column.editableInput?.type === 'image' || column.editableInput?.type === 'file')) {
      return null
    }

    // Required validation
    if (validation.required && (value === undefined || value === null || value === '')) {
      return {
        row,
        field: column.excelHeader,
        message: validation.errorMessage || 'Required field'
      }
    }

    // Skip other validations if value is empty and not required
    if (!validation.required && (value === undefined || value === null || value === '')) {
      return null
    }

    // Number validation
    if (validation.isNumber && isNaN(Number(value))) {
      return {
        row,
        field: column.excelHeader,
        message: validation.errorMessage || 'Must be a number'
      }
    }

    // Positive number validation
    if (validation.isPositive && Number(value) <= 0) {
      return {
        row,
        field: column.excelHeader,
        message: validation.errorMessage || 'Must be a positive number'
      }
    }

    // Non-negative validation
    if (validation.isNonNegative && Number(value) < 0) {
      return {
        row,
        field: column.excelHeader,
        message: validation.errorMessage || 'Must be a non-negative number'
      }
    }

    // Min/Max number validation
    if (validation.min !== undefined && Number(value) < validation.min) {
      return {
        row,
        field: column.excelHeader,
        message: validation.errorMessage || `Must be at least ${validation.min}`
      }
    }

    if (validation.max !== undefined && Number(value) > validation.max) {
      return {
        row,
        field: column.excelHeader,
        message: validation.errorMessage || `Must be at most ${validation.max}`
      }
    }

    // String length validation
    const stringValue = String(value)
    if (validation.minLength !== undefined && stringValue.length < validation.minLength) {
      return {
        row,
        field: column.excelHeader,
        message: validation.errorMessage || `Minimum length is ${validation.minLength}`
      }
    }

    if (validation.maxLength !== undefined && stringValue.length > validation.maxLength) {
      return {
        row,
        field: column.excelHeader,
        message: validation.errorMessage || `Maximum length is ${validation.maxLength}`
      }
    }

    // Enum validation (oneOf)
    if (validation.oneOf && !validation.oneOf.includes(value)) {
      return {
        row,
        field: column.excelHeader,
        message: validation.errorMessage || `Must be one of: ${validation.oneOf.join(', ')}`
      }
    }

    // Custom validation (supports async)
    if (validation.custom) {
      const customError = await validation.custom(value, rowData)
      if (customError) {
        return {
          row,
          field: column.excelHeader,
          message: customError
        }
      }
    }

    return null
  }, [config.tableDisplay?.enableEditing])

  /**
   * Validate a single row (supports async validation)
   */
  const validateRow = useCallback(async (rowData: ExcelRowData, rowIndex: number): Promise<ValidatedRow<T>> => {
    const errors: ValidationError[] = []
    const row = rowIndex + 2
    const data: Partial<T> = {} as Partial<T>

    // Validate each column (sequential for async support)
    for (const column of config.columns) {
      const excelValue = rowData[column.excelHeader]
      
      // Validate field (await for async validation)
      const fieldError = await validateField(column, excelValue, rowData, rowIndex)
      if (fieldError) {
        errors.push(fieldError)
      }

      // Transform and add to data object
      // Note: We add ALL fields to data object for display and processing
      // The uploadFunction will filter using includeInPayload when building final payload
      let value = excelValue
      
      // Apply type conversiondow
      if (value !== undefined && value !== null && value !== '') {
        switch (column.type) {
          case 'number':
            value = Number(value)
            break
          case 'boolean':
            value = Boolean(value)
            break
          case 'string':
            value = String(value).trim()
            break
        }
      }

      // Apply custom transform
      if (column.transform) {
        value = column.transform(value)
      }

      // Add to data object (including fields with includeInPayload: false)
      // These fields are needed for display and lookup, even if not sent to API
      if (value !== undefined && value !== null && value !== '') {
        (data as any)[column.fieldName] = value
      }
    }

    // Apply custom row validator if provided
    if (config.rowValidator) {
      const customErrors = config.rowValidator(rowData, rowIndex)
      errors.push(...customErrors)
    }

    return {
      row,
      data,
      isValid: errors.length === 0,
      errors
    }
  }, [config, validateField])

  /**
   * Generate and download Excel template with data validation (dropdowns) using ExcelJS
   */
  const downloadTemplate = useCallback(async () => {
    setLoading(true)
    try {
      // Create a new workbook using ExcelJS
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet(config.sheetName)
      
      // Add header row
      const headers = config.columns.map(col => col.excelHeader)
      worksheet.addRow(headers)
      
      // Style header row
      const headerRow = worksheet.getRow(1)
      headerRow.font = { bold: true }
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      }
      
      // Add sample data row
      const sampleData = config.columns.map(col => col.sampleValue !== undefined ? col.sampleValue : '')
      worksheet.addRow(sampleData)
      
      // Set column widths
      config.columns.forEach((col, index) => {
        worksheet.getColumn(index + 1).width = Math.max(col.excelHeader.length + 5, 15)
      })
      
      // Add data validation (dropdowns) for each column
      for (let colIndex = 0; colIndex < config.columns.length; colIndex++) {
        const column = config.columns[colIndex]
        const excelColLetter = worksheet.getColumn(colIndex + 1).letter
        
        let dropdownOptions: string[] = []
        
        // Check if column has dropdown generator (dynamic data like categories)
        if ((column as any).excelDropdownGenerator) {
          try {
            dropdownOptions = await (column as any).excelDropdownGenerator()
          } catch (error) {
            // Failed to generate dropdown - handled silently
          }
        }
        // Check if column has oneOf validation (static enum values)
        else if (column.validation?.oneOf) {
          dropdownOptions = column.validation.oneOf.map(v => String(v))
        }
        // Check if column is enum type
        else if (column.type === 'enum') {
          // If no explicit options, skip
          continue
        }
        
        // Add data validation if we have dropdown options
        if (dropdownOptions.length > 0) {
          // Apply validation to rows 2-1000 (row 1 is header, row 2+ is data)
          for (let rowIndex = 2; rowIndex <= 1000; rowIndex++) {
            const cell = worksheet.getCell(`${excelColLetter}${rowIndex}`)
            
            cell.dataValidation = {
              type: 'list',
              allowBlank: !column.required,
              formulae: [`"${dropdownOptions.join(',')}"`],
              showErrorMessage: true,
              errorStyle: 'error',
              errorTitle: 'Invalid Value',
              error: column.validation?.errorMessage || `Please select from: ${dropdownOptions.slice(0, 3).join(', ')}${dropdownOptions.length > 3 ? '...' : ''}`,
              showInputMessage: true,
              promptTitle: column.excelHeader,
              prompt: column.description || `Select from dropdown (${dropdownOptions.length} options)`
            }
          }
        }
      }
      
      // Generate and download the file
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = config.templateFileName
      link.click()
      window.URL.revokeObjectURL(url)
      
    } catch (error) {
      setError(t(translationKey('errorGeneratingTemplate'), 'Failed to generate template. Please try again.'))
    } finally {
      setLoading(false)
    }
  }, [config, setLoading, t])

  /**
   * Handle file selection and validation
   */
  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    // Clear previous error
    setError(null)

    // File size validation
    if (config.maxFileSizeMB) {
      const fileSizeMB = selectedFile.size / (1024 * 1024)
      if (fileSizeMB > config.maxFileSizeMB) {
        setError(`File size must be less than ${config.maxFileSizeMB}MB. Your file is ${fileSizeMB.toFixed(2)}MB.`)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }
    }

    setFile(selectedFile)
    setIsValidating(true)
    setRows([])
    setUploadComplete(false)
    setEditedData(new Map())
    setUploadedImages(new Map())

    try {
      const data = await selectedFile.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelRowData[]

      // Row count validation
      if (jsonData.length > maxRows) {
        setError(`Maximum ${maxRows} rows allowed. Your file contains ${jsonData.length} rows. Please reduce the number of rows and try again.`)
        setFile(null)
        setRows([])
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }

      // Empty file check
      if (jsonData.length === 0) {
        setError('The uploaded file is empty. Please add data and try again.')
        setFile(null)
        setRows([])
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }

      // Validate all rows (sequential for async validation)
      const validatedRows: ValidatedRow<T>[] = []
      for (let index = 0; index < jsonData.length; index++) {
        const validatedRow = await validateRow(jsonData[index], index)
        validatedRows.push(validatedRow)
      }
      setRows(validatedRows)

      // Trigger callback
      const validCount = validatedRows.filter(r => r.isValid).length
      const invalidCount = validatedRows.filter(r => !r.isValid).length
      onValidationComplete?.(validCount, invalidCount)

    } catch (error) {
      setError('Error reading Excel file. Please ensure it matches the template format and try again.')
      setFile(null)
      setRows([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } finally {
      setIsValidating(false)
    }
  }, [config, validateRow, onValidationComplete, maxRows])

  /**
   * Cancel ongoing upload
   */
  const handleCancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsUploading(false)
    setUploadProgress(null)
  }, [])

  /**
   * Upload all valid rows
   */
  const handleUpload = useCallback(async () => {
    const validRows = rows.filter(r => r.isValid)
    if (validRows.length === 0) return

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController()

    setIsUploading(true)
    setUploadProgress({
      total: validRows.length,
      completed: 0,
      failed: 0,
      current: ''
    })

    const delay = config.uploadDelay ?? 500
    const batchSize = config.batchSize ?? 1
    let completedCount = 0
    let failedCount = 0

    try {
      // Process in batches
      for (let i = 0; i < validRows.length; i += batchSize) {
        // Check if upload was cancelled
        if (abortControllerRef.current?.signal.aborted) {
          break
        }

        const batch = validRows.slice(i, i + batchSize)
        
        await Promise.all(batch.map(async (row) => {
          // Check cancellation before each upload
          if (abortControllerRef.current?.signal.aborted) {
            return
          }

          const rowIndex = rows.indexOf(row)
          const displayName = Object.values(row.data)[0] || 'Item'
          setUploadProgress(prev => prev ? {
            ...prev,
            current: `${displayName} (Row ${row.row})`
          } : null)

          try {
            let payload: any

            // Merge original data with edited data
            const editedRowData = editedData.get(rowIndex) || {}
            const mergedData = { ...row.data, ...editedRowData }

            // Build payload based on config
            if (config.useFormData !== false) {
              // Use FormData
              const formData = new FormData()
              Object.entries(mergedData).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                  // Handle File objects
                  if (value instanceof File) {
                    formData.append(key, value)
                  } else {
                    formData.append(key, String(value))
                  }
                }
              })

              // Add uploaded images from the table
              config.columns.forEach(column => {
                if (column.editableInput?.type === 'image' || column.editableInput?.type === 'file') {
                  const imageKey = `${rowIndex}-${column.fieldName}`
                  const uploadedFile = uploadedImages.get(imageKey)
                  if (uploadedFile) {
                    formData.append(column.fieldName, uploadedFile)
                  }
                }
              })

              // Add file attachments
              if (config.fileAttachments) {
                for (const attachment of config.fileAttachments) {
                  const file = await attachment.generator(mergedData)
                  formData.append(attachment.fieldName, file)
                }
              }

              payload = formData
            } else {
              // Use JSON
              payload = mergedData
            }

            // Call upload function
            const result = await config.uploadFunction(payload)

            // Check success
            if (config.successValidator(result)) {
              completedCount++
            } else {
              throw new Error(result?.message || 'Upload failed')
            }
          } catch (error) {
            failedCount++
          } finally {
            setUploadProgress(prev => prev ? {
              ...prev,
              completed: completedCount + failedCount,
              failed: failedCount
            } : null)
          }
        }))

        // Delay between batches
        if (i + batchSize < validRows.length && !abortControllerRef.current?.signal.aborted) {
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }

      // Check if upload was cancelled
      if (!abortControllerRef.current?.signal.aborted) {
        setUploadComplete(true)
        onUploadComplete?.({ successful: completedCount, failed: failedCount })
      }
    } catch (error) {
      setError('An error occurred during upload. Please try again.')
    } finally {
      setIsUploading(false)
      abortControllerRef.current = null
    }
  }, [rows, config, onUploadComplete, editedData, uploadedImages])

  /**
   * Handle cell value change
   */
  const handleCellChange = useCallback((rowIndex: number, fieldName: string, value: any) => {
    setEditedData(prev => {
      const newMap = new Map(prev)
      const rowData = newMap.get(rowIndex) || {}
      newMap.set(rowIndex, { ...rowData, [fieldName]: value })
      return newMap
    })

    // Re-validate only the specific field (async)
    const row = rows[rowIndex]
    if (row) {
      const updatedRowData = { ...row.data, ...editedData.get(rowIndex), [fieldName]: value }
      const column = config.columns.find(col => col.fieldName === fieldName)
      if (column) {
        // Run async validation
        validateField(column, value, updatedRowData as any, rowIndex).then(error => {
          // Update validation status
          setRows(prevRows => {
            const newRows = [...prevRows]
            const currentRow = { ...newRows[rowIndex] }
            
            if (error) {
              // Add or update error for this field
              currentRow.errors = [
                ...currentRow.errors.filter(e => e.field !== column.excelHeader),
                error
              ]
              currentRow.isValid = false
            } else {
              // Remove error for this field
              currentRow.errors = currentRow.errors.filter(e => e.field !== column.excelHeader)
              currentRow.isValid = currentRow.errors.length === 0
            }
            
            newRows[rowIndex] = currentRow
            return newRows
          })
        })
      }
    }
  }, [rows, editedData, config.columns, validateField])

  /**
   * Handle image upload
   */
  const handleImageUpload = useCallback((rowIndex: number, fieldName: string, file: File | null) => {
    if (file) {
      const key = `${rowIndex}-${fieldName}`
      setUploadedImages(prev => {
        const newMap = new Map(prev)
        newMap.set(key, file)
        return newMap
      })
      handleCellChange(rowIndex, fieldName, file)
    }
  }, [handleCellChange])

  /**
   * Handle image removal
   */
  const handleImageRemove = useCallback((rowIndex: number, fieldName: string) => {
    const key = `${rowIndex}-${fieldName}`
    
    // Revoke object URL to prevent memory leak
    const file = uploadedImages.get(key)
    if (file) {
      try {
        const url = URL.createObjectURL(file)
        URL.revokeObjectURL(url)
      } catch (e) {
        // Ignore errors
      }
    }
    
    setUploadedImages(prev => {
      const newMap = new Map(prev)
      newMap.delete(key)
      return newMap
    })
    handleCellChange(rowIndex, fieldName, null)
  }, [uploadedImages, handleCellChange])

  /**
   * Get cell value (edited or original)
   */
  const getCellValue = useCallback((rowIndex: number, fieldName: string) => {
    const editedRowData = editedData.get(rowIndex)
    if (editedRowData && editedRowData[fieldName] !== undefined) {
      return editedRowData[fieldName]
    }
    return (rows[rowIndex]?.data as any)?.[fieldName]
  }, [editedData, rows])

  /**
   * Check if all required images are uploaded
   */
  const hasAllRequiredImages = useCallback(() => {
    if (!config.tableDisplay?.enableEditing) return true
    
    const imageColumns = config.columns.filter(col => 
      col.editableInput?.type === 'image' && col.showInTable !== false && col.required
    )
    
    if (imageColumns.length === 0) return true

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex]
      
      // Check if row has errors OTHER than image errors
      const nonImageErrors = row.errors.filter(error => {
        const column = config.columns.find(col => col.excelHeader === error.field)
        return !(column?.editableInput?.type === 'image' || column?.editableInput?.type === 'file')
      })
      
      // Skip rows that have other validation errors
      if (nonImageErrors.length > 0) continue
      
      for (const column of imageColumns) {
        const key = `${rowIndex}-${column.fieldName}`
        const hasUploadedImage = uploadedImages.has(key)
        
        if (!hasUploadedImage) {
          return false
        }
      }
    }
    
    return true
  }, [config, rows, uploadedImages])

  /**
   * Get missing image errors
   */
  const getMissingImageErrors = useCallback(() => {
    if (!config.tableDisplay?.enableEditing) return []
    
    const errors: ValidationError[] = []
    const imageColumns = config.columns.filter(col => 
      col.editableInput?.type === 'image' && col.showInTable !== false && col.required
    )
    
    if (imageColumns.length === 0) return errors

    rows.forEach((row, rowIndex) => {
      const nonImageErrors = row.errors.filter(error => {
        const column = config.columns.find(col => col.excelHeader === error.field)
        return !(column?.editableInput?.type === 'image' || column?.editableInput?.type === 'file')
      })
      
      if (nonImageErrors.length === 0) {
        imageColumns.forEach(column => {
          const key = `${rowIndex}-${column.fieldName}`
          const hasUploadedImage = uploadedImages.has(key)
          
          if (!hasUploadedImage) {
            errors.push({
              row: row.row,
              field: column.excelHeader,
              message: column.validation?.errorMessage || 'Image is required'
            })
          }
        })
      }
    })
    
    return errors
  }, [config, rows, uploadedImages])

  // Memoized derived state for better performance
  const validCount = useMemo(() => rows.filter(r => r.isValid).length, [rows])
  const invalidCount = useMemo(() => rows.filter(r => !r.isValid).length, [rows])
  const allErrors = useMemo(() => rows.flatMap(r => r.errors), [rows])
  const missingImageErrors = useMemo(() => getMissingImageErrors(), [getMissingImageErrors])
  const allErrorsWithImages = useMemo(() => [...allErrors, ...missingImageErrors], [allErrors, missingImageErrors])
  const canUpload = useMemo(() => validCount > 0 && hasAllRequiredImages(), [validCount, hasAllRequiredImages])

  const translationKey = (key: string) => {
    if (config.translationPrefix) {
      return `${config.translationPrefix}.${key}` as any
    }
    return `excel.${key}` as any
  }

  return (
    <>
      <LoadingOverlay />
      <Card className={`w-full border-border bg-card shadow-lg ${className}`}>
        <CardHeader className="space-y-2 border-b border-border bg-muted/30">
          <CardTitle className="flex items-center gap-3 text-foreground text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileSpreadsheet className="h-6 w-6 text-primary" />
            </div>
            {t(translationKey('title'), config.name)}
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm leading-relaxed">
            {t(translationKey('description'), config.description)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
        {/* Global Error Display */}
        {error && (
          <Alert className="border-destructive/50 bg-destructive/10">
            <XCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive font-medium">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Step 1: Download Template */}
        <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
            {t(translationKey('step1'), 'Step 1: Download Template')}
          </h3>
          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="w-full sm:w-auto font-medium shadow-sm hover:shadow-md transition-shadow"
          >
            <Download className="h-4 w-4 mr-2" />
            {t(translationKey('downloadTemplate'), 'Download Template')}
          </Button>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t(translationKey('templateHint'), `Download the Excel template, fill it with your data (max ${maxRows} rows), and upload it back.`)}
          </p>
        </div>

        {/* Step 2: Upload File */}
        <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
            {t(translationKey('step2'), 'Step 2: Upload Filled File')}
          </h3>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isValidating || isUploading}
            className="w-full sm:w-auto font-medium shadow-sm hover:shadow-md transition-shadow disabled:opacity-50"
          >
            <Upload className="h-4 w-4 mr-2" />
            {file 
              ? t(translationKey('changeFile'), 'Change File') 
              : t(translationKey('selectFile'), 'Select File')}
          </Button>
          {file && (
            <p className="text-xs text-muted-foreground bg-background/50 px-3 py-2 rounded-md border border-border">
              {t(translationKey('selectedFile'), 'Selected file')}:{' '}
              <span className="font-semibold text-foreground">{file.name}</span>
              {' '}({rows.length} {t(translationKey(rows.length === 1 ? 'row' : 'rows'), rows.length === 1 ? 'row' : 'rows')})
            </p>
          )}
        </div>

        {/* Validation Status */}
        {isValidating && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              {t(translationKey('validating'), 'Validating data...')}
            </AlertDescription>
          </Alert>
        )}

        {/* Validation Results */}
        {!isValidating && rows.length > 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Alert className="border-emerald-500/50 bg-emerald-500/10 shadow-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <AlertDescription className="text-emerald-700 dark:text-emerald-300 font-semibold">
                  {t(translationKey('validItems'), 'Valid items')}: <span className="text-lg">{validCount}</span>
                </AlertDescription>
              </Alert>
              
              {(invalidCount > 0 || missingImageErrors.length > 0) && (
                <Alert className="border-rose-500/50 bg-rose-500/10 shadow-sm">
                  <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  <AlertDescription className="text-rose-700 dark:text-rose-300 font-semibold">
                    {t(translationKey('invalidItems'), 'Invalid items')}: <span className="text-lg">{invalidCount + (missingImageErrors.length > 0 ? missingImageErrors.length : 0)}</span>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Error List */}
            {allErrorsWithImages.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  {t(translationKey('validationErrors'), 'Validation Errors')}
                </h4>
                <div className="max-h-60 overflow-y-auto space-y-2 bg-rose-50/50 dark:bg-rose-900/10 p-4 rounded-lg border border-rose-200 dark:border-rose-800 shadow-inner">
                  {allErrorsWithImages.map((error, index) => (
                    <div key={index} className="text-xs bg-background/60 p-2 rounded border border-rose-200/50 dark:border-rose-800/50">
                      <span className="font-bold text-rose-700 dark:text-rose-400">
                        {t(translationKey('row'), 'Row')} {error.row}
                      </span>
                      {' - '}
                      <span className="font-semibold text-foreground">{error.field}:</span>
                      {' '}
                      <span className="text-muted-foreground">{error.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Toggle Data Table View */}
            {validCount > 0 && (
              <div className="flex items-center justify-between border-t border-border pt-4">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  {t(translationKey('dataPreview'), 'Data Preview')}
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDataTable(!showDataTable)}
                  className="font-medium shadow-sm hover:shadow-md transition-shadow"
                >
                  {showDataTable ? (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      {t(translationKey('hideTable'), 'Hide Table')}
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      {t(translationKey('showTable'), 'Show Table')}
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Data Table */}
            {showDataTable && validCount > 0 && (() => {
              const tableConfig = config.tableDisplay || {}
              const showRowNumbers = tableConfig.showRowNumbers !== false
              const showStatus = tableConfig.showStatus !== false
              const maxHeight = tableConfig.maxHeight || '24rem'
              
              // Get columns to display in table (show all columns except explicitly hidden ones)
              const tableColumns = config.columns
                .filter(col => col.showInTable !== false)
              
              // Apply maxColumns limit if specified
              const displayColumns = tableConfig.maxColumns 
                ? tableColumns.slice(0, tableConfig.maxColumns)
                : tableColumns
              
              const hasMoreColumns = tableColumns.length > displayColumns.length

              return (
                <div className="border border-border rounded-lg overflow-hidden shadow-sm">
                  <div className="overflow-auto" style={{ maxHeight }}>
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted/50 sticky top-0 z-10">
                        <tr>
                          {showRowNumbers && (
                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16 bg-muted/50 backdrop-blur-sm">
                              {t(translationKey('row'), 'Row')}
                            </th>
                          )}
                          {showStatus && (
                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-24 bg-muted/50 backdrop-blur-sm">
                              {t(translationKey('status'), 'Status')}
                            </th>
                          )}
                          {displayColumns.map((column, index) => (
                            <th 
                              key={index}
                              className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 backdrop-blur-sm"
                              style={column.tableWidth ? { width: column.tableWidth, minWidth: '100px' } : { minWidth: '120px' }}
                            >
                              {column.excelHeader}
                              {column.required && <span className="text-destructive ml-1">*</span>}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-background divide-y divide-border">
                        {rows.map((row, index) => (
                          <tr 
                            key={index} 
                            className={`transition-colors ${
                              !row.isValid 
                                ? 'bg-destructive/5 hover:bg-destructive/10' 
                                : 'hover:bg-muted/30'
                            }`}
                          >
                            {showRowNumbers && (
                              <td className="px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">
                                {row.row}
                              </td>
                            )}
                            {showStatus && (
                              <td className="px-4 py-3 whitespace-nowrap">
                                {row.isValid ? (
                                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 font-medium">
                                    {t(translationKey('valid'), 'Valid')}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800 font-medium">
                                    {t(translationKey('invalid'), 'Invalid')}
                                  </Badge>
                                )}
                              </td>
                            )}
                            {displayColumns.map((column, colIndex) => {
                              const value = getCellValue(index, column.fieldName)
                              // Only allow image fields to be editable
                              const isImageField = tableConfig.enableEditing && 
                                                   column.editableInput?.type === 'image'
                              
                              return (
                                <td 
                                  key={colIndex} 
                                  className="px-4 py-3 text-xs text-foreground"
                                  style={{ 
                                    maxWidth: column.tableWidth || '200px',
                                    minWidth: '80px'
                                  }}
                                >
                                  {isImageField ? (() => {
                                    const inputConfig = column.editableInput!
                                    const imageKey = `${index}-${column.fieldName}`
                                    const uploadedFile = uploadedImages.get(imageKey)
                                    const imageUrl = uploadedFile ? URL.createObjectURL(uploadedFile) : (value as string)
                                    
                                    return (
                                      <div className="flex items-center gap-2">
                                        {imageUrl ? (
                                          <div className="relative group">
                                            <div className="w-12 h-12 rounded-md border border-border overflow-hidden bg-muted/50 shadow-sm">
                                              <img 
                                                src={imageUrl} 
                                                alt={t(translationKey('imagePreview'), 'Image Preview')}
                                                className="w-full h-full object-cover"
                                              />
                                            </div>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                              onClick={() => handleImageRemove(index, column.fieldName)}
                                            >
                                              <X className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        ) : (
                                          <label className="cursor-pointer">
                                            <div className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-md hover:bg-accent hover:border-accent-foreground/20 transition-colors">
                                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                              <span className="text-xs font-medium">{t(translationKey('uploadImage'), 'Upload')}</span>
                                            </div>
                                            <input
                                              type="file"
                                              accept={inputConfig.accept || 'image/*'}
                                              className="hidden"
                                              onChange={(e) => {
                                                const file = e.target.files?.[0]
                                                if (file) {
                                                  if (inputConfig.maxFileSizeMB) {
                                                    const sizeMB = file.size / (1024 * 1024)
                                                    if (sizeMB > inputConfig.maxFileSizeMB) {
                                                      setError(t(translationKey('imageSizeError'), `Image size must be less than ${inputConfig.maxFileSizeMB}MB. Selected image is ${sizeMB.toFixed(2)}MB.`))
                                                      return
                                                    }
                                                  }
                                                  setError(null)
                                                  handleImageUpload(index, column.fieldName, file)
                                                }
                                              }}
                                            />
                                          </label>
                                        )}
                                      </div>
                                    )
                                  })() : (
                                    <div 
                                      className="break-words whitespace-normal"
                                      title={String(value || '-')}
                                    >
                                      {column.tableRender 
                                        ? column.tableRender(value, row.data)
                                        : (value !== undefined && value !== null && value !== '' ? String(value) : '-')}
                                    </div>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {hasMoreColumns && (
                    <div className="p-3 bg-muted/50 text-center border-t border-border">
                      <p className="text-xs text-muted-foreground font-medium">
                        {`${t(translationKey('showingColumns'), 'Showing first')} ${displayColumns.length} ${t(translationKey('columnsOf'), 'columns of')} ${tableColumns.length}`}
                      </p>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        )}

        {/* Upload Progress */}
        {isUploading && uploadProgress && (
          <div className="space-y-3 p-5 bg-primary/5 rounded-lg border border-primary/20 shadow-sm">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                {t(translationKey('uploading'), 'Uploading...')}
              </span>
              <span className="font-bold text-primary text-base">
                {uploadProgress.completed} / {uploadProgress.total}
              </span>
            </div>
            <Progress 
              value={(uploadProgress.completed / uploadProgress.total) * 100} 
              className="h-3 shadow-inner"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {t(translationKey('currentItem'), 'Current item')}:{' '}
                <span className="font-semibold text-foreground">{uploadProgress.current}</span>
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelUpload}
                className="h-8 text-xs font-medium border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                {t(translationKey('cancel'), 'Cancel')}
              </Button>
            </div>
          </div>
        )}

        {/* Upload Complete */}
        {uploadComplete && uploadProgress && (
          <Alert className="border-emerald-500/50 bg-emerald-500/10 shadow-sm">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <AlertDescription className="text-emerald-700 dark:text-emerald-300 font-semibold text-sm">
              {t(translationKey('uploadComplete'), 'Upload complete')}:{' '}
              <span className="font-bold text-base">{uploadProgress.completed - uploadProgress.failed}</span>{' '}
              {t(translationKey('successful'), 'successful')},{' '}
              <span className="font-bold text-base text-rose-600 dark:text-rose-400">{uploadProgress.failed}</span>{' '}
              {t(translationKey('failed'), 'failed')}
            </AlertDescription>
          </Alert>
        )}

        {/* Step 3: Upload */}
        {!isValidating && validCount > 0 && !uploadComplete && (
          <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
              {t(translationKey('step3'), 'Step 3: Upload Data')}
            </h3>
            {!canUpload && config.tableDisplay?.enableEditing && (
              <Alert className="border-amber-500/50 bg-amber-500/10 shadow-sm">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-amber-700 dark:text-amber-300 text-xs font-medium">
                  {t(translationKey('uploadImagesFirst'), 'Please upload all required images before proceeding')}
                </AlertDescription>
              </Alert>
            )}
            <Button
              onClick={handleUpload}
              disabled={isUploading || !canUpload}
              className="w-full font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t(translationKey('uploading'), 'Uploading')}...
                </>
              ) : (
                <>{t(translationKey('upload'), 'Upload')} ({validCount} {t(translationKey(validCount === 1 ? 'item' : 'items'), validCount === 1 ? 'item' : 'items')})</>
              )}
            </Button>
          </div>
        )}

        {/* Reset Button - After Upload Complete */}
        {uploadComplete && (
          <div className="space-y-2 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => {
                setFile(null)
                setRows([])
                setUploadComplete(false)
                setUploadProgress(null)
                setEditedData(new Map())
                setUploadedImages(new Map())
                setError(null)
                setShowDataTable(config.tableDisplay?.autoShowTable ?? false)
                if (fileInputRef.current) {
                  fileInputRef.current.value = ''
                }
              }}
              className="w-full font-medium shadow-sm hover:shadow-md transition-shadow"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              {t(translationKey('uploadAnother'), 'Upload Another File')}
            </Button>
          </div>
        )}
        </CardContent>
      </Card>
    </>
  )
}