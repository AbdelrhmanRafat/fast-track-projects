'use client'

import React from 'react'
import { PageHeaderSkeleton, StatsCardsSkeleton, TableSkeleton } from '@/components/SharedCustomComponents/DashboardSkelton'

export default function Loading() {
	return (
		<div >
			<div className="space-y-6">
				<PageHeaderSkeleton />
				<StatsCardsSkeleton count={8} />
				<StatsCardsSkeleton count={3} />
				<TableSkeleton rows={5} columns={5} showActions={false} />
			</div>
		</div>
	)
}

