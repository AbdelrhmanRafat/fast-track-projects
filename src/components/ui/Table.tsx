'use client';

import React, { useState, useMemo } from 'react';
import { useTranslation } from "@/components/providers/LanguageProvider"
import { Search, Filter, ChevronUp, ChevronDown, MoreHorizontal, X, RefreshCw, Columns, Eye, EyeOff, Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { TableSkeleton } from '@/components/SharedCustomComponents/DashboardSkelton';
import { cn } from "@/lib/utils";

export interface TableAction {
  key: string;
  label: string;
  icon: React.ReactNode | ((row: any, disabled: boolean) => React.ReactNode);
  onClick: (row: any, index: number) => void;
  variant?: 'default' | 'destructive' | 'secondary';
  disabled?: (row: any) => boolean;
  visible?: (row: any) => boolean;
}

export interface TableFilter {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'daterange' | 'number';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface TableColumn<T = any> {
  key: string;
  label: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  className?: string;
  width?: string;
  searchValue?: (row: T) => string; // Custom search logic for nested or complex data
  hideable?: boolean; // Whether the column can be hidden (default: true)
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  actions?: TableAction[];
  showActions?: boolean;
  filters?: TableFilter[];
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  showPagination?: boolean;
  title?: string;
  subtitle?: string;
  onRefresh?: () => void;
  // Skeleton configuration
  skeletonRows?: number;
  skeletonColumns?: number;
  // Column visibility configuration
  columnVisibility?: boolean; // Enable/disable column visibility control (default: false)
  defaultVisibleColumns?: string[]; // Array of column keys that should be visible by default (if not provided, all columns are visible)
  // CSV Export configuration
  exportable?: boolean; // Enable/disable CSV export functionality (default: false)
  exportFileName?: string; // Custom filename for the CSV export (default: 'table-export')
}

export function Table<T = any>({
  columns,
  data,
  loading = false,
  emptyMessage,
  className = '',
  onSort,
  sortKey,
  sortDirection,
  actions = [],
  showActions = true,
  filters = [],
  searchable = true,
  searchPlaceholder,
  pageSize = 10,
  showPagination = true,
  title,
  subtitle,
  onRefresh,
  skeletonRows = 5,
  skeletonColumns,
  columnVisibility = false,
  defaultVisibleColumns,
  exportable = false,
  exportFileName = 'table-export'
}: TableProps<T>) {
  const { t, language } = useTranslation();
  
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    columns.forEach(col => {
      if (defaultVisibleColumns) {
        initial[col.key] = defaultVisibleColumns.includes(col.key);
      } else {
        initial[col.key] = true; // All columns visible by default
      }
    });
    return initial;
  });

  // Auto-detect skeleton columns if not provided
  const detectedSkeletonColumns = skeletonColumns || columns.length;

  // Filter visible columns
  const displayColumns = useMemo(() => {
    if (!columnVisibility) return columns;
    return columns.filter(col => visibleColumns[col.key]);
  }, [columns, visibleColumns, columnVisibility]);

  // Column visibility handlers
  const toggleColumnVisibility = (columnKey: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
  };

  const showAllColumns = () => {
    const allVisible: Record<string, boolean> = {};
    columns.forEach(col => {
      allVisible[col.key] = true;
    });
    setVisibleColumns(allVisible);
  };

  const hideAllColumns = () => {
    const allHidden: Record<string, boolean> = {};
    columns.forEach(col => {
      allHidden[col.key] = false;
    });
    setVisibleColumns(allHidden);
  };

  const visibleColumnsCount = Object.values(visibleColumns).filter(Boolean).length;

  // CSV Export functionality
  const exportToCSV = () => {
    // Get only visible columns
    const columnsToExport = displayColumns;
    
    // Escape CSV values to handle commas, quotes, and newlines
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      // If the value contains comma, quote, or newline, wrap it in quotes and escape quotes
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Extract text content from React nodes
    const extractTextFromNode = (node: React.ReactNode): string => {
      if (node === null || node === undefined) return '';
      if (typeof node === 'string' || typeof node === 'number') return String(node);
      if (typeof node === 'boolean') return '';
      if (React.isValidElement(node)) {
        // Try to extract text content from React element
        const props = node.props as any;
        if (props.children) {
          return extractTextFromNode(props.children);
        }
        // Check for common prop patterns
        if (props.value) return String(props.value);
        if (props.title) return String(props.title);
      }
      if (Array.isArray(node)) {
        return node.map(extractTextFromNode).join(' ');
      }
      return '';
    };

    // Create CSV header
    const headers = columnsToExport.map(col => escapeCSV(col.label));
    const csvRows = [headers.join(',')];

    // Process data rows efficiently
    // Use filteredData to include search/filter results
    const dataToExport = filteredData;
    
    dataToExport.forEach((row) => {
      const rowData = columnsToExport.map(column => {
        let cellValue: any;
        
        // If column has custom render, use it and extract text
        if (column.render) {
          const rendered = column.render((row as any)[column.key], row, 0);
          cellValue = extractTextFromNode(rendered);
        } else {
          // Get the raw value
          cellValue = (row as any)[column.key];
        }
        
        return escapeCSV(cellValue);
      });
      
      csvRows.push(rowData.join(','));
    });

    // Create blob and download
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `${exportFileName}-${timestamp}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
  };

  // Filter and search logic
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search
    if (searchTerm) {
      result = result.filter(row =>
        columns.some(column => {
          // Check if column has custom search logic
          if (column.searchValue) {
            const searchableValue = column.searchValue(row);
            return searchableValue?.toLowerCase().includes(searchTerm.toLowerCase());
          }
          
          // Fallback to original logic for simple fields
          const value = (row as any)[column.key];
          return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Apply filters
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        const filter = filters.find(f => f.key === key);
        if (filter) {
          switch (filter.type) {
            case 'text':
            case 'select':
              result = result.filter(row => {
                const rowValue = (row as any)[key];
                return rowValue?.toString().toLowerCase().includes(value.toLowerCase());
              });
              break;
            case 'date':
              result = result.filter(row => {
                const rowValue = new Date((row as any)[key]);
                const filterValue = new Date(value);
                return rowValue.toDateString() === filterValue.toDateString();
              });
              break;
            case 'daterange':
              if (value.start && value.end) {
                result = result.filter(row => {
                  const rowValue = new Date((row as any)[key]);
                  return rowValue >= new Date(value.start) && rowValue <= new Date(value.end);
                });
              }
              break;
            case 'number':
              result = result.filter(row => {
                const rowValue = parseFloat((row as any)[key]);
                return rowValue === parseFloat(value);
              });
              break;
          }
        }
      }
    });

    return result;
  }, [data, searchTerm, activeFilters, columns, filters]);

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = useMemo(() => {
    if (!showPagination) return filteredData;
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize, showPagination]);

  const handleSort = (column: TableColumn<T>) => {
    if (!column.sortable || !onSort) return;
    const newDirection = sortKey === column.key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(column.key, newDirection);
  };

  const handleFilterChange = (key: string, value: any) => {
    setActiveFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setActiveFilters({});
    setSearchTerm('');
    setCurrentPage(1);
  };

  const getSortIcon = (column: TableColumn<T>) => {
    if (!column.sortable) return null;
    
    if (sortKey !== column.key) {
      return <ChevronUp className="w-4 h-4 ml-1 text-muted-foreground opacity-50" />;
    }
    
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 ml-1 text-foreground" />
    ) : (
      <ChevronDown className="w-4 h-4 ml-1 text-foreground" />
    );
  };

  const renderCellValue = (column: TableColumn<T>, row: T, index: number) => {
    const value = (row as any)[column.key];
    
    if (column.render) {
      return column.render(value, row, index);
    }
    
    return value?.toString() || '-';
  };

  const renderFilterInput = (filter: TableFilter) => {
    const value = activeFilters[filter.key] || '';
    
    switch (filter.type) {
      case 'text':
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            placeholder={filter.placeholder || filter.label}
          />
        );
      
      case 'select':
        return (
          <Select
            value={value}
            onValueChange={(val) => handleFilterChange(filter.key, val)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('table.all')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t('table.all')}</SelectItem>
              {filter.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
          />
        );
      
      case 'daterange':
        return (
          <div className="flex gap-2">
            <Input
              type="date"
              value={value.start || ''}
              onChange={(e) => handleFilterChange(filter.key, { ...value, start: e.target.value })}
              placeholder={t('table.from')}
              className="flex-1"
            />
            <Input
              type="date"
              value={value.end || ''}
              onChange={(e) => handleFilterChange(filter.key, { ...value, end: e.target.value })}
              placeholder={t('table.to')}
              className="flex-1"
            />
          </div>
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            placeholder={filter.placeholder || filter.label}
          />
        );
      
      default:
        return null;
    }
  };

  const getActionButtonVariant = (variant?: string) => {
    switch (variant) {
      case 'destructive':
        return 'destructive';
      case 'secondary':
        return 'secondary';
      default:
        return 'ghost';
    }
  };

  // Show skeleton loading state
  if (loading) {
    return (
      <TableSkeleton
        rows={skeletonRows}
        columns={detectedSkeletonColumns}
        showActions={showActions && actions.length > 0}
        className={className}
      />
    );
  }

  return (
    <div className={cn("bg-card rounded-lg shadow-sm border border-border overflow-hidden", className)}>
      {/* Header */}
      {(title || subtitle || searchable || filters.length > 0 || onRefresh || exportable || columnVisibility) && (
        <div className="p-6 border-b border-border">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Title Section */}
            {(title || subtitle) && (
              <div className="space-y-1">
                {title && (
                  <h2 className="text-xl font-semibold text-foreground">{title}</h2>
                )}
                {subtitle && (
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
                )}
              </div>
            )}

            {/* Controls Section */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search */}
              {searchable && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={searchPlaceholder || t('table.search')}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
              )}

              {/* Filter Toggle */}
              {filters.length > 0 && (
                <Button
                  variant={showFilters || Object.keys(activeFilters).some(key => activeFilters[key]) ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {t('table.filter')}
                  {Object.keys(activeFilters).some(key => activeFilters[key]) && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary/20 rounded-full">
                      {Object.keys(activeFilters).filter(key => activeFilters[key]).length}
                    </span>
                  )}
                </Button>
              )}

              {/* Column Visibility Toggle */}
              {columnVisibility && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Columns className="h-4 w-4 mr-2" />
                      {t('table.columns')}
                      <span className="ml-2 px-1.5 py-0.5 text-xs bg-muted rounded-full">
                        {visibleColumnsCount}/{columns.length}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-64">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm text-foreground">
                          {t('table.toggleColumns')}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {t('table.selectColumnsToDisplay')}
                        </p>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={showAllColumns}
                          className="flex-1 h-8 text-xs"
                        >
                          {t('table.showAll')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={hideAllColumns}
                          className="flex-1 h-8 text-xs"
                        >
                          {t('table.hideAll')}
                        </Button>
                      </div>

                      {/* Column List */}
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {columns.map((column) => {
                          const isHideable = column.hideable !== false;
                          return (
                            <div
                              key={column.key}
                              className={cn(
                                "flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors",
                                !isHideable && "opacity-50 cursor-not-allowed"
                              )}
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {visibleColumns[column.key] ? (
                                  <Eye className="h-4 w-4 text-primary shrink-0" />
                                ) : (
                                  <EyeOff className="h-4 w-4 text-muted-foreground shrink-0" />
                                )}
                                <span className="text-sm truncate">
                                  {column.label}
                                </span>
                              </div>
                              <Switch
                                dir={language === 'ar' ? 'rtl' : 'ltr'}
                                checked={visibleColumns[column.key]}
                                onCheckedChange={() => toggleColumnVisibility(column.key)}
                                disabled={!isHideable}
                                className="shrink-0"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {/* CSV Export Button */}
              {exportable && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={exportToCSV}
                  disabled={filteredData.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                 Export CSV
                </Button>
              )}

              {/* Refresh Button */}
              {onRefresh && (
                <Button variant="outline" size="sm" onClick={onRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t('table.refresh')}
                </Button>
              )}
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && filters.length > 0 && (
            <div className="mt-6 p-4 bg-muted/50 rounded-md border border-border">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-sm font-medium text-foreground">
                  {t('table.filterOptions')}
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3 mr-1" />
                  {t('table.clearAll')}
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filters.map(filter => (
                  <div key={filter.key} className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                      {filter.label}
                    </Label>
                    {renderFilterInput(filter)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              {displayColumns.map((column) => (
                <th
                  key={column.key}
                  style={{ width: column.width }}
                  className={`px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-muted select-none' : ''
                  } ${column.className || ''}`}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center">
                    {column.label}
                    {getSortIcon(column)}
                  </div>
                </th>
              ))}
              {showActions && actions.length > 0 && (
                <th className="px-6 py-4 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('table.actions')}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={displayColumns.length + (showActions && actions.length > 0 ? 1 : 0)} className="px-6 py-12 text-center">
                  <div className="text-muted-foreground">
                    <div className="mx-auto w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                      <Search className="h-8 w-8" />
                    </div>
                    <p className="text-sm font-medium mb-1">
                      {emptyMessage || t('table.noDataToDisplay')}
                    </p>
                    {(searchTerm || Object.keys(activeFilters).some(key => activeFilters[key])) && (
                      <p className="text-xs">
                        {t('table.tryChangingCriteria')}
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => (
                <tr key={index} className="hover:bg-muted/50 transition-colors">
                  {displayColumns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-6 py-4 text-sm text-foreground ${column.className || ''}`}
                    >
                      {renderCellValue(column, row, index)}
                    </td>
                  ))}
                  {showActions && actions.length > 0 && (
                    <td className="px-6 py-4 text-center">
                      {(() => {
                        // Filter visible actions for this row
                        const visibleActions = actions.filter(action => 
                          action.visible ? action.visible(row) : true
                        );
                        
                        if (visibleActions.length === 0) {
                          return <span className="text-muted-foreground text-sm">-</span>;
                        }
                        
                        // Always show individual action buttons
                        return (
                          <div className="flex items-center justify-center gap-2">
                            {visibleActions.map((action) => {
                              const isDisabled = action.disabled?.(row) || false
                              // Check if this action has a loading state by checking if icon is a function
                              const iconElement = typeof action.icon === 'function' 
                                ? action.icon(row, isDisabled)
                                : action.icon
                              
                              return (
                                <Button
                                  key={action.key}
                                  className='cursor-pointer'
                                  variant={getActionButtonVariant(action.variant)}
                                  size="sm"
                                  onClick={() => action.onClick(row, index)}
                                  disabled={isDisabled}
                                  title={action.label}
                                >
                                  {iconElement}
                                </Button>
                              )
                            })}
                          </div>
                        );
                      })()}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="px-6 py-4 border-t border-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              {`${t('table.showing')} ${((currentPage - 1) * pageSize) + 1} ${t('table.to')} ${Math.min(currentPage * pageSize, filteredData.length)} ${t('table.of')} ${filteredData.length} ${t('table.entries')}`}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                {t('table.previous')}
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                {t('table.next')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}