'use client'

import React, { useEffect, useState } from 'react'
import { useForm, Control } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Save } from 'lucide-react'
import { toast } from 'sonner'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { CustomSelect } from '@/components/ui/CustomSelect'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import QuillTextArea from '@/components/ui/QuillTextArea'
import ImageUpload from '@/components/ui/image-upload'
import { GenericFormProps, FormFieldConfig } from './types'
import { FieldValues, Path } from 'react-hook-form'
import { Label } from '@/components/ui/label'

/**
 * Default slug generator function
 */
const defaultSlugGenerator = (text: string): string => {
  if (!text) return ''
  
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Generic reusable form component
 */
export function GenericForm<TFieldValues extends FieldValues = FieldValues>({
  title,
  description,
  schema,
  sections,
  defaultValues,
  onSubmit,
  submitButtonText = 'common.save',
  submitButtonLoadingText = 'common.saving',
  successRedirect,
  customSubmitButton,
  formActions,
  showMissingFieldsAlert = true,
  getMissingFields,
  t,
  language = 'ar',
  onFormReady,
}: GenericFormProps<TFieldValues>) {
  const [submitting, setSubmitting] = useState(false)
  const [manuallyEditedFields, setManuallyEditedFields] = useState<Set<string>>(new Set())

  const form = useForm<TFieldValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: defaultValues as any,
    mode: 'onTouched',
    reValidateMode: 'onChange',
  })

  // Call onFormReady callback when form is initialized
  useEffect(() => {
    if (onFormReady) {
      onFormReady(form)
    }
  }, [form, onFormReady])

  // Watch all form values
  const watchedValues = form.watch()

  // Get missing required fields
  const getMissingFieldsInternal = (): string[] => {
    if (getMissingFields) {
      return getMissingFields(watchedValues)
    }

    const missing: string[] = []
    sections.forEach((section) => {
      section.fields.forEach((field) => {
        if (field.required) {
          const value = watchedValues[field.name as keyof typeof watchedValues]
          const isEmpty = 
            value === null || 
            value === undefined || 
            value === '' ||
            (typeof value === 'string' && value.trim() === '')
          
          if (isEmpty) {
            missing.push(t(field.label))
          }
        }
      })
    })
    return missing
  }

  const missingFields = getMissingFieldsInternal()
  const isFormValid = missingFields.length === 0

  // Handle submit click - show toast when form is incomplete
  const handleSubmitClick = (e: React.MouseEvent) => {
    if (!isFormValid && !submitting) {
      e.preventDefault()
      e.stopPropagation()
      // Trigger validation to show field-level errors
      form.trigger()
      // Show form-level error toast
      toast.error(t('common.formIncomplete') || 'The form is incomplete.')
    }
  }

  // Handle form submit
  const handleSubmit = async (data: TFieldValues) => {
    try {
      setSubmitting(true)
      await onSubmit(data)
      if (successRedirect) {
        // Redirect handled by parent component
      }
    } catch (error: any) {
      throw error
    } finally {
      setSubmitting(false)
    }
  }

  // Auto-slug generation
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      sections.forEach((section) => {
        section.fields.forEach((field) => {
          if (field.autoSlugFrom && name === field.autoSlugFrom) {
            const sourceValue = value[field.autoSlugFrom as keyof typeof value]
            if (sourceValue && typeof sourceValue === 'string') {
              const slugFieldName = field.name as Path<TFieldValues>
              const currentSlug = form.getValues(slugFieldName)
              
              // Only auto-generate if not manually edited
              if (!manuallyEditedFields.has(slugFieldName)) {
                const generator = field.slugGenerator || defaultSlugGenerator
                const newSlug = generator(sourceValue)
                form.setValue(slugFieldName as any, newSlug as any, { shouldValidate: false })
              }
            }
          }
        })
      })
    })
    return () => subscription.unsubscribe()
  }, [form, manuallyEditedFields, sections])

  // Load dependent field options
  const loadDependentOptions = async (field: FormFieldConfig<TFieldValues>, parentValue: string) => {
    if (field.dependentOptionsLoader && parentValue) {
      try {
        await field.dependentOptionsLoader(parentValue)
        // Options are handled by the field's selectOptions prop
      } catch (error) {
        // Error loading dependent options - handled silently
      }
    }
  }

  // Render field based on type
  const renderField = (field: FormFieldConfig<TFieldValues>, control: Control<TFieldValues>) => {
    if (field.customRender) {
      return field.customRender({ field, control }, control)
    }

    return (
      <FormField
        key={`${field.name}-${field.label}`}
        control={control}
        name={field.name}
        render={({ field: formField, fieldState }) => {
          const hasError = !!fieldState.error
          
          switch (field.type) {
            case 'text':
              return (
                <FormItem>
                  <FormLabel>{t(field.label)}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={field.placeholder ? t(field.placeholder) : ''}
                      aria-invalid={hasError}
                      {...formField}
                      onChange={(e) => {
                        formField.onChange(e)
                        if (field.trackManualEdit) {
                          setManuallyEditedFields((prev) => new Set(prev).add(field.name))
                          field.onManualEdit?.()
                        }
                      }}
                    />
                  </FormControl>
                  {field.description && (
                    <FormDescription>{t(field.description)}</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )

            case 'textarea':
              return (
                <FormItem>
                  <FormLabel>{t(field.label)}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={field.placeholder ? t(field.placeholder) : ''}
                      aria-invalid={hasError}
                      {...formField}
                    />
                  </FormControl>
                  {field.description && (
                    <FormDescription>{t(field.description)}</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )

            case 'select':
              // Determine the value to display in the Select component
              // If selectValue is provided, use it (it may transform the form value for display)
              // Otherwise, use the form field value directly
              const selectValue = field.selectValue 
                ? (typeof field.selectValue === 'function' 
                    ? field.selectValue(watchedValues) 
                    : field.selectValue)
                : (formField.value || '')
              
              // Ensure the selectValue matches one of the available options
              // If it doesn't match, fall back to empty string (which will show placeholder)
              const hasMatchingOption = field.selectOptions?.some(opt => opt.value === selectValue)
              const displayValue = hasMatchingOption ? selectValue : ''
              
              return (
                <FormItem>
                  <FormLabel>{t(field.label)}</FormLabel>
                  <FormControl>
                    <CustomSelect
                      options={(field.selectOptions || []).map(opt => ({ ...opt, value: String(opt.value) }))}
                      value={displayValue}
                      placeholder={field.placeholder ? t(field.placeholder) : ''}
                      disabled={field.selectDisabled}
                      className={hasError ? 'border-destructive' : ''}
                      onValueChange={async (value) => {
                        // If selectOnChange is provided, call it first (it may handle onChange)
                        if (field.selectOnChange) {
                          await field.selectOnChange(value, form)
                          // selectOnChange may have transformed the value (e.g., 'none' -> '')
                          const transformedValue = value === 'none' ? '' : value
                          formField.onChange(transformedValue as any)
                        } else {
                          formField.onChange(value)
                        }
                        // Trigger validation after value change
                        form.trigger(field.name)
                        // Load dependent options if needed
                        if (field.dependentOptionsLoader && field.dependsOn) {
                          loadDependentOptions(field, value)
                        }
                      }}
                    />
                  </FormControl>
                  {field.description && (
                    <FormDescription>{t(field.description)}</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )

            case 'quill':
              return (
                <FormItem>
                  <FormLabel>{t(field.label)}</FormLabel>
                  <FormControl>
                    <QuillTextArea
                      value={formField.value || ''}
                      onChange={(value) => {
                        formField.onChange(value)
                        form.trigger(field.name)
                      }}
                      placeholder={field.placeholder ? t(field.placeholder) : ''}
                      isArabic={language === 'ar'}
                      className={`${hasError ? 'border-destructive' : ''} ${field.quillClassName || ''}`}
                    />
                  </FormControl>
                  {field.description && (
                    <FormDescription>{t(field.description)}</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )

            case 'image':
              // Get the preview value from the Preview field (e.g., imagePreview for image field)
              const previewFieldName = `${field.name}Preview` as Path<TFieldValues>
              const previewValue = watchedValues[previewFieldName as keyof typeof watchedValues] as string | null | undefined
              return (
                <FormItem>
                  <FormLabel>{t(field.label)}</FormLabel>
                  <FormControl>
                    <ImageUpload
                      id={field.name}
                      initialPreview={previewValue || null}
                      onChange={(file, preview) => {
                        form.setValue(field.name, file as any, { shouldValidate: true })
                        form.setValue(previewFieldName, preview as any)
                      }}
                      maxSize={field.imageMaxSize}
                      accept={field.imageAccept}
                      className={hasError ? 'border-2 border-destructive rounded-lg p-1' : ''}
                    />
                  </FormControl>
                  {field.description && (
                    <FormDescription>{t(field.description)}</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )

            case 'radio':
              const radioOrientation = field.radioOrientation || 'vertical'
              // Find the original option value type for proper form value setting
              const findOriginalValue = (strValue: string) => {
                const opt = (field.radioOptions || []).find(o => String(o.value) === strValue)
                return opt ? opt.value : strValue
              }
              return (
                <FormItem className="space-y-3">
                  <FormLabel>{t(field.label)}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(val) => {
                        formField.onChange(findOriginalValue(val))
                        form.trigger(field.name)
                      }}
                      value={String(formField.value ?? '')}
                      className={radioOrientation === 'horizontal' ? 'flex flex-row gap-4' : 'flex flex-col space-y-1'}
                    >
                      {(field.radioOptions || []).map((option) => (
                        <div key={String(option.value)} className="flex items-center space-x-2 ">
                          <RadioGroupItem 
                            value={String(option.value)} 
                            id={`${field.name}-${option.value}`}
                            disabled={option.disabled}
                          />
                          <Label 
                            htmlFor={`${field.name}-${option.value}`}
                            className="font-normal cursor-pointer"
                          >
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  {field.description && (
                    <FormDescription>{t(field.description)}</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )

            case 'checkbox':
              // Single checkbox (boolean value)
              if (field.checkboxSingle) {
                return (
                  <FormItem className="flex flex-row items-start space-x-3  space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        isChecked={formField.value === (field.checkboxCheckedValue ?? true)}
                        onChange={(checked) => {
                          formField.onChange(
                            checked 
                              ? (field.checkboxCheckedValue ?? true)
                              : (field.checkboxUncheckedValue ?? false)
                          )
                          form.trigger(field.name)
                        }}
                        disabled={submitting}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>{t(field.label)}</FormLabel>
                      {field.description && (
                        <FormDescription>{t(field.description)}</FormDescription>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )
              }
              
              // Multiple checkboxes (array value)
              const checkboxOrientation = field.checkboxOrientation || 'vertical'
              const currentValues: (string | number)[] = Array.isArray(formField.value) ? formField.value : []
              
              return (
                <FormItem className="space-y-3">
                  <FormLabel>{t(field.label)}</FormLabel>
                  <div className={checkboxOrientation === 'horizontal' ? 'flex flex-row gap-4 flex-wrap' : 'flex flex-col space-y-2'}>
                    {(field.checkboxOptions || []).map((option) => {
                      const isChecked = currentValues.some(v => v === option.value || String(v) === String(option.value))
                      return (
                        <div key={String(option.value)} className="flex items-center space-x-2 ">
                          <Checkbox
                            isChecked={isChecked}
                            onChange={(checked) => {
                              if (checked) {
                                formField.onChange([...currentValues, option.value])
                              } else {
                                formField.onChange(currentValues.filter((v) => v !== option.value && String(v) !== String(option.value)))
                              }
                              form.trigger(field.name)
                            }}
                            disabled={option.disabled || submitting}
                          />
                          <Label 
                            className="font-normal cursor-pointer"
                          >
                            {option.label}
                          </Label>
                        </div>
                      )
                    })}
                  </div>
                  {field.description && (
                    <FormDescription>{t(field.description)}</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )

            case 'switch':
              return (
                <FormItem className="flex flex-row items-center gap-3">
                  <FormControl>
                    <Switch
                      checked={formField.value === (field.switchCheckedValue ?? true)}
                      onCheckedChange={(checked) => {
                        formField.onChange(
                          checked 
                            ? (field.switchCheckedValue ?? true)
                            : (field.switchUncheckedValue ?? false)
                        )
                        form.trigger(field.name)
                      }}
                      disabled={submitting}
                    />
                  </FormControl>
                  <div className="space-y-0.5">
                    <FormLabel>{t(field.label)}</FormLabel>
                    {field.description && (
                      <FormDescription>{t(field.description)}</FormDescription>
                    )}
                  </div>
                </FormItem>
              )

            default:
              return <></> // Return empty fragment for unsupported field types
          }
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <Card>
      
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
              {sections.map((section, sectionIndex) => (
                <div key={sectionIndex}>
                  {sectionIndex > 0 && <Separator className="my-8" />}
                  
                  <div className="space-y-6">
                  

                    <div className={`grid gap-6 ${section.gridCols === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                      {section.fields.map((field, fieldIndex) => {
                        // Determine grid column span
                        const colSpanClass = field.gridCols === 2 ? 'md:col-span-2' : field.gridCols === 1 ? 'md:col-span-1' : ''
                        return (
                          <div key={`${field.name}-${field.label}-${fieldIndex}`} className={colSpanClass}>
                            {renderField(field, form.control)}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))}

              <Separator />

              <div className="flex justify-end gap-4">
                {formActions}
                {customSubmitButton || (
                  <div onClick={handleSubmitClick}>
                    {!isFormValid ? (
                      <Button
                        type="button"
                        onClick={handleSubmitClick}
                        className="gap-2"
                        variant="default"
                      >
                        <Save className="h-4 w-4" />
                        {t(submitButtonText)}
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {submitting ? t(submitButtonLoadingText) : t(submitButtonText)}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

