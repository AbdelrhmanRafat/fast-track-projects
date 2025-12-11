'use client'

import React from 'react'
import { TableSkeleton, PageHeaderSkeleton } from '@/components/SharedCustomComponents/DashboardSkelton'

export default function Loading() {
	return (
		<div >
			<div className="space-y-6">
				<PageHeaderSkeleton />
				<TableSkeleton rows={10} columns={6} showActions={true} />
			</div>
		</div>
	)
}

