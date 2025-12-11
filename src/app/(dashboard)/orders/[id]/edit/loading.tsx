'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function EditOrderLoading() {
  return (
    <div className="space-y-6">
      {/* Page Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Logo Skeleton */}
      <div className="flex items-center justify-center py-4">
        <Skeleton className="h-12 w-44" />
      </div>

      {/* Order Info Card */}
      <Card className="overflow-hidden p-0 gap-0">
        <div className="bg-primary px-5 py-4 flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-lg bg-white/20" />
          <Skeleton className="h-5 w-32 bg-white/20" />
        </div>
        <CardContent className="p-5 space-y-5">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Items Card */}
      <Card className="overflow-hidden p-0 gap-0">
        <div className="bg-primary px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-lg bg-white/20" />
            <Skeleton className="h-5 w-28 bg-white/20" />
          </div>
          <Skeleton className="h-8 w-28 bg-white/20 rounded-md" />
        </div>
        <CardContent className="p-5 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-muted/40 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-6 h-6 rounded-md" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-16 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}
