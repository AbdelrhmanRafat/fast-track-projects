'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function Loading() {
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

      {/* Back button and actions */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      {/* Order Header Card */}
      <Card className="overflow-hidden p-0 gap-0">
        <div className="bg-[#5C1A1B] px-5 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg bg-white/20" />
            <div>
              <Skeleton className="h-6 w-40 bg-white/20" />
              <Skeleton className="h-4 w-24 mt-1 bg-white/20" />
            </div>
          </div>
          <Skeleton className="h-7 w-28 bg-white/20" />
        </div>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-5 w-28" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items Skeleton */}
        <Card className="lg:col-span-2 overflow-hidden p-0 gap-0">
          <div className="bg-[#5C1A1B] px-5 py-4 flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-lg bg-white/20" />
            <Skeleton className="h-5 w-28 bg-white/20" />
            <Skeleton className="h-6 w-8 ms-auto bg-white/20 rounded-full" />
          </div>
          <CardContent className="p-5 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-muted/40 rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-7 h-7 rounded-md" />
                    <div>
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-48 mt-1" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Sidebar Skeletons */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden p-0 gap-0">
              <div className="bg-[#5C1A1B] px-4 py-3">
                <Skeleton className="h-4 w-24 bg-white/20" />
              </div>
              <CardContent className="p-4 space-y-3">
                <div>
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-5 w-28" />
                </div>
                <div>
                  <Skeleton className="h-3 w-20 mb-1" />
                  <Skeleton className="h-5 w-36" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
