
import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-muted animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

// Table Skeleton Component
function TableSkeleton({ 
  rows = 5, 
  columns = 4, 
  showHeader = true,
  showActions = true,
  className = ""
}: {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  showActions?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("bg-card rounded-lg shadow-sm border border-border overflow-hidden", className)}>
      {/* Header Skeleton */}
      <div className="p-6 border-b border-border">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Title Section */}
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>

          {/* Controls Section */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Skeleton */}
            <div className="relative">
              <Skeleton className="h-9 w-64" />
            </div>
            {/* Filter Button Skeleton */}
            <Skeleton className="h-9 w-20" />
            {/* Refresh Button Skeleton */}
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          {/* Table Header Skeleton */}
          {showHeader && (
            <thead className="bg-muted/50">
              <tr>
                {Array.from({ length: columns }).map((_, index) => (
                  <th key={index} className="px-6 py-4">
                    <Skeleton className="h-4 w-24" />
                  </th>
                ))}
                {showActions && (
                  <th className="px-6 py-4">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </th>
                )}
              </tr>
            </thead>
          )}
          
          {/* Table Body Skeleton */}
          <tbody className="bg-card divide-y divide-border">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-muted/30">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4">
                    <Skeleton className={cn(
                      "h-4",
                      colIndex === 0 ? "w-32" : colIndex === 1 ? "w-24" : "w-16"
                    )} />
                  </td>
                ))}
                {showActions && (
                  <td className="px-6 py-4 text-right">
                    <Skeleton className="h-8 w-8 ml-auto" />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Skeleton */}
      <div className="px-6 py-4 border-t border-border">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Skeleton className="h-4 w-48" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20" />
            <div className="flex items-center gap-1">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-8" />
              ))}
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Card Skeleton Component
function CardSkeleton({ 
  className = "",
  showHeader = true,
  showFooter = false,
  contentLines = 3
}: {
  className?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  contentLines?: number;
}) {
  return (
    <div className={cn("bg-card rounded-lg border border-border p-6", className)}>
      {showHeader && (
        <div className="space-y-2 mb-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      )}
      
      <div className="space-y-3">
        {Array.from({ length: contentLines }).map((_, index) => (
          <Skeleton 
            key={index} 
            className={cn(
              "h-4",
              index === contentLines - 1 ? "w-3/4" : "w-full"
            )} 
          />
        ))}
      </div>

      {showFooter && (
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      )}
    </div>
  );
}

// Form Skeleton Component
function FormSkeleton({ 
  className = "",
  fields = 4,
  showTitle = true,
  showSubmitButton = true
}: {
  className?: string;
  fields?: number;
  showTitle?: boolean;
  showSubmitButton?: boolean;
}) {
  return (
    <div className={cn("bg-card rounded-lg border border-border p-6", className)}>
      {showTitle && (
        <div className="space-y-2 mb-6">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      )}

      <div className="space-y-6">
        {Array.from({ length: fields }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}

        {showSubmitButton && (
          <div className="pt-4">
            <Skeleton className="h-10 w-32" />
          </div>
        )}
      </div>
    </div>
  );
}

// Stats Cards Skeleton
function StatsCardsSkeleton({ 
  count = 4,
  className = ""
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
          <div className="mt-4">
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Page Header Skeleton
function PageHeaderSkeleton({ 
  showButton = true,
  showIcon = false,
  className = ""
}: {
  showButton?: boolean;
  showIcon?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("", className)}>
      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl overflow-hidden p-8 shadow-lg">
        {/* Decorative blurred circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-16 -left-10 w-56 h-56 bg-primary/10 rounded-full blur-3xl"></div>

        {/* Content container */}
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Title + Subtitle with optional icon */}
          <div className="flex-grow">
            <div className="flex items-start justify-start gap-2">
              {showIcon && (
                <div className="flex-shrink-0 mt-1">
                  <Skeleton className="h-10 w-10 rounded-md" />
                </div>
              )}

              <div className="space-y-3">
                {/* Title skeleton - larger to match text-4xl md:text-5xl */}
                <Skeleton className="h-10 md:h-12 w-48 md:w-64" />
                {/* Subtitle skeleton */}
                <Skeleton className="h-4 w-64 md:w-80" />
              </div>
            </div>
          </div>

          {/* Button skeleton */}
          {showButton && (
            <div className="flex-shrink-0">
              <Skeleton className="h-9 w-32" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Tabbed Form Skeleton Component
function TabbedFormSkeleton({
  tabs = 6,
  showHeader = true,
  showActions = true,
  className = ""
}: {
  tabs?: number;
  showHeader?: boolean;
  showActions?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("bg-background", className)}>
      {/* Header */}
      {showHeader && (
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
      )}

      {/* Form Container */}
      <div className="space-y-8">
        {/* Tabs Navigation */}
        <div className="w-full">
          <div className="grid w-full grid-cols-6 bg-muted rounded-lg p-1">
            {Array.from({ length: tabs }).map((_, index) => (
              <div key={index} className="relative">
                <div className="flex items-center justify-center p-2 rounded-md">
                  {/* Desktop Tab Text */}
                  <div className="hidden md:block">
                    <Skeleton className="h-4 w-20" />
                  </div>
                  {/* Mobile Tab Icon */}
                  <div className="md:hidden">
                    <Skeleton className="h-4 w-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          <div className="bg-card rounded-xl shadow-sm border border-border p-6 lg:p-8">
            {/* Tab Header */}
            <div className="mb-6">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-11 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-11 w-full" />
                </div>
              </div>

              {/* Textarea Fields */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-32 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </div>

              {/* Single Column Fields */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-11 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-11 w-full" />
                </div>
              </div>

              {/* Select Fields */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-11 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-11 w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-6">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-36" />
          </div>
        )}
      </div>
    </div>
  );
}

// Accordion Skeleton Component
function AccordionSkeleton({
  items = 4,
  className = ""
}: {
  items?: number;
  className?: string;
}) {
  return (
    <div className={cn("", className)}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="border-b last:border-b-0">
          {/* Accordion Trigger Skeleton */}
          <div className="flex">
            <div className="flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium">
              <div className="flex-1">
                <Skeleton className="h-5 w-64" />
              </div>
              <Skeleton className="h-4 w-4 shrink-0 translate-y-0.5" />
            </div>
          </div>
          
          {/* Accordion Content Skeleton (show for first item only) */}
          {index === 0 && (
            <div className="overflow-hidden text-sm">
              <div className="pt-0 pb-4 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Dashboard Layout Skeleton
function DashboardSkeleton({ 
  showStats = true,
  showTable = true,
  showCards = false,
  className = ""
}: {
  showStats?: boolean;
  showTable?: boolean;
  showCards?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Page Header */}
      <PageHeaderSkeleton />

      {/* Stats Cards */}
      {showStats && <StatsCardsSkeleton />}

      {/* Main Content */}
      {showTable && <TableSkeleton />}

      {/* Additional Cards */}
      {showCards && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardSkeleton showFooter />
          <CardSkeleton contentLines={4} />
        </div>
      )}
    </div>
  );
}

export { 
  Skeleton, 
  TableSkeleton, 
  CardSkeleton, 
  FormSkeleton, 
  StatsCardsSkeleton, 
  PageHeaderSkeleton, 
  TabbedFormSkeleton,
  AccordionSkeleton,
  DashboardSkeleton 
};