import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Loading skeleton for Edit Project page
 */
export default function EditProjectLoading() {
  return (
    <div className="space-y-6">
      {/* Page Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-64" />
      </div>

      {/* Project Info Card Skeleton */}
      <Card className="overflow-hidden p-0 gap-0">
        <Skeleton className="h-14 w-full" />
        <CardContent className="p-5 space-y-5">
          {/* Project Name */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-11 w-full" />
          </div>

          {/* Company Name */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-11 w-full" />
          </div>

          {/* Project Type */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <div className="flex gap-3">
              <Skeleton className="h-20 flex-1 rounded-xl" />
              <Skeleton className="h-20 flex-1 rounded-xl" />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-24 w-full" />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Steps Card Skeleton */}
      <Card className="overflow-hidden p-0 gap-0">
        <Skeleton className="h-14 w-full" />
        <CardContent className="p-5 space-y-4">
          {/* Step 1 */}
          <div className="bg-muted/40 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-7 w-7 rounded-lg" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-muted/40 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-7 w-7 rounded-lg" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>

          {/* Add Step Button */}
          <Skeleton className="h-12 w-full rounded-lg" />
        </CardContent>
      </Card>

      {/* Submit Button Skeleton */}
      <div className="flex justify-end">
        <Skeleton className="h-11 w-40" />
      </div>
    </div>
  );
}
