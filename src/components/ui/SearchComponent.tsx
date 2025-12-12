"use client";

import React, { useState } from "react";
import { Input } from "./input";
import { CustomSelect, SelectOption } from "./CustomSelect";
import { Button } from "./button";
import { CalendarIcon, Search, X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Calendar } from "./calendar";
import { format } from "date-fns";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "./drawer";
import { useTranslation } from "@/components/providers/LanguageProvider";

// Generic field types for the search component
export type SearchFieldType = 'text' | 'select' | 'date' | 'dateRange' | 'dependentSelect';

export interface SearchField {
  key: string;
  type: SearchFieldType;
  label?: string;
  placeholder?: string;
  options?: SelectOption[];
  required?: boolean;
  gridCols?: number; // For responsive grid layout (1-4)
  // For dependentSelect type - subcategory depends on category
  dependsOn?: string; // The field key that this depends on
  disabled?: boolean; // When parent field is not selected
  loading?: boolean; // Loading state when fetching options
  disabledPlaceholder?: string; // Placeholder when disabled
  loadingPlaceholder?: string; // Placeholder when loading
  emptyPlaceholder?: string; // Placeholder when no options
}

export interface SearchComponentConfig {
  title?: string;
  fields: SearchField[];
  showClearButton?: boolean;
  showSearchButton?: boolean;
  searchButtonText?: string;
  clearButtonText?: string;
  gridCols?: number; // Default grid columns for the layout
  className?: string;
}

export interface SearchComponentProps {
  config: SearchComponentConfig;
  onSearch: (values: Record<string, any>) => void;
  onClear?: () => void;
  initialValues?: Record<string, any>;
  className?: string;
}

export function SearchComponent({
  config,
  onSearch,
  onClear,
  initialValues = {},
  className,
}: SearchComponentProps) {
  const { t } = useTranslation();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Initialize form values with initial values or empty strings
  const [formValues, setFormValues] = useState<Record<string, any>>(() => {
    const values: Record<string, any> = {};
    config.fields.forEach(field => {
      if (field.type === 'dateRange') {
        values[`${field.key}_from`] = initialValues[`${field.key}_from`] || '';
        values[`${field.key}_to`] = initialValues[`${field.key}_to`] || '';
      } else {
        values[field.key] = initialValues[field.key] || '';
      }
    });
    return values;
  });

  const handleFieldChange = (fieldKey: string, value: any) => {
    setFormValues({
      ...formValues,
      [fieldKey]: value
    });
  };

  const handleSearch = () => {
    // Filter out empty values
    const searchValues: Record<string, any> = {};
    Object.entries(formValues).forEach(([key, val]) => {
      if (val && val.toString().trim() !== '') {
        searchValues[key] = val;
      }
    });
    
    onSearch(searchValues);
    setIsMobileDrawerOpen(false);
  };

  const handleClear = () => {
    // Reset all form values
    const clearedValues: Record<string, any> = {};
    config.fields.forEach(field => {
      if (field.type === 'dateRange') {
        clearedValues[`${field.key}_from`] = '';
        clearedValues[`${field.key}_to`] = '';
      } else {
        clearedValues[field.key] = '';
      }
    });
    setFormValues(clearedValues);
    
    if (onClear) {
      onClear();
    } else {
      onSearch({});
    }
    setIsMobileDrawerOpen(false);
  };

  const clearFilter = (fieldKey: string, fieldType?: SearchFieldType) => {
    // Create updated values
    const updatedValues = { ...formValues };
    
    if (fieldType === 'dateRange') {
      // Handle dateRange clearing - clear both from and to
      updatedValues[`${fieldKey}_from`] = '';
      updatedValues[`${fieldKey}_to`] = '';
    } else if (fieldKey.includes('_from') || fieldKey.includes('_to')) {
      // Handle individual dateRange field clearing
      const baseKey = fieldKey.replace('_from', '').replace('_to', '');
      updatedValues[`${baseKey}_from`] = '';
      updatedValues[`${baseKey}_to`] = '';
    } else {
      updatedValues[fieldKey] = '';
    }
    
    // Update state
    setFormValues(updatedValues);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    config.fields.forEach(field => {
      if (field.type === 'dateRange') {
        const fromValue = formValues[`${field.key}_from`];
        const toValue = formValues[`${field.key}_to`];
        if ((fromValue && fromValue.toString().trim()) || (toValue && toValue.toString().trim())) {
          count++;
        }
      } else {
        const value = formValues[field.key];
        if (value && value.toString().trim() !== '') {
          count++;
        }
      }
    });
    return count;
  };

  const isFieldActive = (field: SearchField) => {
    if (field.type === 'dateRange') {
      const fromValue = formValues[`${field.key}_from`];
      const toValue = formValues[`${field.key}_to`];
      return (fromValue && fromValue.toString().trim()) || (toValue && toValue.toString().trim());
    }
    const value = formValues[field.key];
    return value && value.toString().trim() !== '';
  };

  const hasActiveFilters = getActiveFiltersCount() > 0;

  const renderField = (field: SearchField, fieldId?: string) => {
    const value = formValues[field.key] || '';
    
    switch (field.type) {
      case 'text':
        return (
          <Input
            id={fieldId}
            type="text"
            placeholder={field.placeholder || t('search.enterValue')}
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className="w-full"
            dir="ltr"
          />
        );
        
      case 'select':
        return (
          <CustomSelect
            options={[
              { value: "", label: t('search.allOptions') },
              ...(field.options || [])
            ]}
            value={value}
            onValueChange={(newValue) => handleFieldChange(field.key, newValue)}
            placeholder={field.placeholder || t('search.chooseValue')}
            className="w-full"
          />
        );
        
      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id={fieldId}
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !value && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="h-4 w-4 me-2" />
                {value ? format(new Date(value), "PPP") : <span>{field.placeholder || t('search.pickDate')}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => handleFieldChange(field.key, date ? format(date, "yyyy-MM-dd") : "")}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );
        
      case 'dateRange':
        const fromKey = `${field.key}_from`;
        const toKey = `${field.key}_to`;
        const fromValue = formValues[fromKey] || '';
        const toValue = formValues[toKey] || '';
        
        return (
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-3">
              <label htmlFor={`${fieldId}-from`} className="text-xs font-medium text-muted-foreground">
                {t('search.fromDate')}
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id={`${fieldId}-from`}
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal text-xs",
                      !fromValue && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="h-3 w-3 me-1.5" />
                    {fromValue ? format(new Date(fromValue), "PP") : <span>{t('search.fromDate')}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fromValue ? new Date(fromValue) : undefined}
                    onSelect={(date) => handleFieldChange(fromKey, date ? format(date, "yyyy-MM-dd") : "")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-col gap-3">
              <label htmlFor={`${fieldId}-to`} className="text-xs font-medium text-muted-foreground">
                {t('search.toDate')}
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id={`${fieldId}-to`}
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal text-xs",
                      !toValue && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="h-3 w-3 me-1.5" />
                    {toValue ? format(new Date(toValue), "PP") : <span>{t('search.toDate')}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={toValue ? new Date(toValue) : undefined}
                    onSelect={(date) => handleFieldChange(toKey, date ? format(date, "yyyy-MM-dd") : "")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        );
      
      case 'dependentSelect':
        // Dependent select - disabled until parent is selected
        if (field.disabled) {
          return (
            <CustomSelect
              options={[{ value: "", label: field.disabledPlaceholder || t('search.selectMainFieldFirst') }]}
              value=""
              onValueChange={() => {}}
              placeholder={field.disabledPlaceholder || t('search.selectMainFieldFirst')}
              className="w-full opacity-50"
              disabled
            />
          );
        }
        if (field.loading) {
          return (
            <CustomSelect
              options={[{ value: "", label: field.loadingPlaceholder || t('search.loading') }]}
              value=""
              onValueChange={() => {}}
              placeholder={field.loadingPlaceholder || t('search.loading')}
              className="w-full opacity-50"
              disabled
            />
          );
        }
        if (!field.options || field.options.length === 0) {
          return (
            <CustomSelect
              options={[{ value: "", label: field.emptyPlaceholder || t('search.noOptions') }]}
              value=""
              onValueChange={() => {}}
              placeholder={field.emptyPlaceholder || t('search.noOptions')}
              className="w-full opacity-50"
              disabled
            />
          );
        }
        return (
          <CustomSelect
            options={[
              { value: "", label: t('search.allOptions') },
              ...(field.options || [])
            ]}
            value={value}
            onValueChange={(newValue) => handleFieldChange(field.key, newValue)}
            placeholder={field.placeholder || t('search.chooseValue')}
            className="w-full"
          />
        );
        
      default:
        return null;
    }
  };

  const activeCount = getActiveFiltersCount();

  // Find the text field for main search input
  const textField = config.fields.find(f => f.type === 'text');
  const otherFields = config.fields.filter(f => f.type !== 'text');

  // Get display value for active filter
  const getDisplayValue = (field: SearchField) => {
    if (field.type === 'dateRange') {
      const fromValue = formValues[`${field.key}_from`];
      const toValue = formValues[`${field.key}_to`];
      if (fromValue && toValue) {
        return `${format(new Date(fromValue), "MMM dd")} - ${format(new Date(toValue), "MMM dd")}`;
      } else if (fromValue) {
        return `From ${format(new Date(fromValue), "MMM dd")}`;
      } else if (toValue) {
        return `To ${format(new Date(toValue), "MMM dd")}`;
      }
    }

    const value = formValues[field.key];
    
    if (field.type === 'date' && value) {
      return format(new Date(value), "MMM dd, yyyy");
    }

    if ((field.type === 'select' || field.type === 'dependentSelect') && field.options && value) {
      const option = field.options.find(opt => opt.value === value);
      return option?.label || value;
    }

    return value;
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Mobile: Bottom Drawer */}
      <div className="md:hidden space-y-3">
        {/* Mobile Search Input */}
        {textField && (
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={textField.placeholder || t('search.enterValue')}
              value={formValues[textField.key] || ''}
              onChange={(e) => handleFieldChange(textField.key, e.target.value)}
              className="ps-10 h-11 rounded-xl bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
              dir="ltr"
            />
          </div>
        )}

        {/* Mobile Filter Button */}
        {otherFields.length > 0 && (
          <Drawer open={isMobileDrawerOpen} onOpenChange={setIsMobileDrawerOpen}>
            <DrawerTrigger asChild>
              <Button 
                variant="outline" 
                className={cn(
                  "w-full h-11 rounded-xl justify-between",
                  activeCount > 0 && "border-primary bg-primary/5"
                )} 
                size="default"
              >
                <span className="flex items-center">
                  <SlidersHorizontal className="h-4 w-4 me-2" />
                  {config.title || t('search.filters')}
                </span>
                {activeCount > 0 && (
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">
                    {activeCount}
                  </span>
                )}
              </Button>
            </DrawerTrigger>
            <DrawerContent dir="ltr" className="max-h-[85vh]">
              <DrawerHeader className="px-6 pb-2">
                <DrawerTitle className="flex items-center justify-between text-lg">
                  <span className="font-semibold">{config.title || t('search.filters')}</span>
                  {activeCount > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleClear}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 -me-2"
                    >
                      <X className="h-4 w-4 me-1" />
                      {config.clearButtonText || t('search.clearFilters')}
                    </Button>
                  )}
                </DrawerTitle>
              </DrawerHeader>
              <div className="px-6 pb-4 space-y-6 overflow-y-auto flex-1">
                {config.fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <label 
                      htmlFor={`mobile-${field.key}`} 
                      className="text-sm font-medium text-foreground"
                    >
                      {field.label || field.key}
                      {field.required && <span className="text-destructive ms-1">*</span>}
                    </label>
                    {renderField(field, `mobile-${field.key}`)}
                  </div>
                ))}
              </div>
              {/* Apply Button for Mobile */}
              <div className="px-6 pb-6 pt-4 border-t">
                <Button 
                  onClick={handleSearch}
                  className="w-full h-11"
                  size="default"
                >
                  {config.searchButtonText || t('search.applyFilters')}
                </Button>
              </div>
            </DrawerContent>
          </Drawer>
        )}

        {/* Mobile Active Filter Chips */}
        {activeCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {config.fields.map((field) => {
              if (!isFieldActive(field)) return null;
              return (
                <span 
                  key={field.key}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary border border-primary/20 rounded-full"
                >
                  {getDisplayValue(field)}
                  <button
                    onClick={() => clearFilter(field.key, field.type)}
                    className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop: Badge/Pill Style Filters */}
      <div className="hidden md:flex md:flex-wrap md:items-center md:gap-2">
        {/* Search Input */}
        {textField && (
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={textField.placeholder || t('search.enterValue')}
              value={formValues[textField.key] || ''}
              onChange={(e) => handleFieldChange(textField.key, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              className="ps-9 h-9 w-64 rounded-full bg-secondary/80 border-0 focus-visible:ring-2 focus-visible:ring-primary/30 text-sm"
              dir="ltr"
            />
          </div>
        )}

        {/* Filter Pills */}
        {otherFields.map((field) => {
          const isActive = isFieldActive(field);
          
          // Handle dependentSelect - show disabled state when parent not selected
          if (field.type === 'dependentSelect') {
            if (field.disabled || field.loading || !field.options || field.options.length === 0) {
              return (
                <div key={field.key} className="flex items-center">
                  <Button 
                    variant="ghost"
                    size="sm" 
                    disabled
                    className="h-9 text-sm font-medium bg-secondary/80 text-secondary-foreground rounded-full opacity-50 cursor-not-allowed"
                  >
                    {field.disabled 
                      ? (field.disabledPlaceholder || field.label || field.key)
                      : field.loading 
                        ? (field.loadingPlaceholder || t('search.loading'))
                        : (field.emptyPlaceholder || t('search.noOptions'))
                    }
                  </Button>
                </div>
              );
            }
          }
          
          return (
            <div key={field.key} className="flex items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost"
                    size="sm" 
                    className={cn(
                      "h-9 text-sm font-medium transition-all",
                      isActive 
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground rounded-s-full rounded-e-none" 
                        : "bg-secondary/80 text-secondary-foreground hover:bg-secondary rounded-full"
                    )}
                  >
                    {isActive ? getDisplayValue(field) : (field.label || field.key)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto min-w-[200px] p-3" align="start">
                <div className="space-y-3">
                  <div className="text-sm font-medium text-foreground">
                    {field.label || field.key}
                  </div>
                  {(field.type === 'select' || field.type === 'dependentSelect') && field.options ? (
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleFieldChange(field.key, '')}
                        className={cn(
                          "px-3 py-2 text-sm text-start rounded-md transition-colors",
                          !formValues[field.key] || formValues[field.key] === ''
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        )}
                      >
                        {t('search.allOptions')}
                      </button>
                      {field.options.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleFieldChange(field.key, option.value)}
                          className={cn(
                            "px-3 py-2 text-sm text-start rounded-md transition-colors",
                            formValues[field.key] === option.value
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  ) : field.type === 'date' ? (
                    <Calendar
                      mode="single"
                      selected={formValues[field.key] ? new Date(formValues[field.key]) : undefined}
                      onSelect={(date) => handleFieldChange(field.key, date ? format(date, "yyyy-MM-dd") : "")}
                      initialFocus
                    />
                  ) : field.type === 'dateRange' ? (
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-muted-foreground mb-2">{t('search.fromDate')}</div>
                        <Calendar
                          mode="single"
                          selected={formValues[`${field.key}_from`] ? new Date(formValues[`${field.key}_from`]) : undefined}
                          onSelect={(date) => handleFieldChange(`${field.key}_from`, date ? format(date, "yyyy-MM-dd") : "")}
                        />
                      </div>
                      <div className="border-t pt-3">
                        <div className="text-xs text-muted-foreground mb-2">{t('search.toDate')}</div>
                        <Calendar
                          mode="single"
                          selected={formValues[`${field.key}_to`] ? new Date(formValues[`${field.key}_to`]) : undefined}
                          onSelect={(date) => handleFieldChange(`${field.key}_to`, date ? format(date, "yyyy-MM-dd") : "")}
                        />
                      </div>
                    </div>
                  ) : (
                    renderField(field, `desktop-${field.key}`)
                  )}
                </div>
              </PopoverContent>
            </Popover>
              {isActive && (
                <button
                  onClick={() => clearFilter(field.key, field.type)}
                  className="h-9 w-7 flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/80 rounded-e-full -ms-1 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}

        {/* Apply Button for Desktop */}
        <Button
          onClick={handleSearch}
          size="sm"
          className="h-9 rounded-full"
        >
          {config.searchButtonText || t('search.applyFilters')}
        </Button>

        {/* Clear All Button */}
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-9 rounded-full text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <X className="h-3.5 w-3.5 me-1" />
            {config.clearButtonText || t('search.clearFilters')}
          </Button>
        )}
      </div>
    </div>
  );
}