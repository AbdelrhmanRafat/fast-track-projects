import { Suspense } from 'react';
import StatsAdminClient from './pageClient';
import StatsAdminLoading from './loading';
import { getProjectStatistics } from '@/lib/services/statistics';

/**
 * Statistics Admin Page - Server Component
 * Fetches statistics data and passes to client component
 * Only accessible by Admin and Sub-Admin users (protected by middleware)
 */
export default async function StatsAdminPage() {
  // Fetch statistics for last 12 months
  const statsResponse = await getProjectStatistics(12);

  return (
    <Suspense fallback={<StatsAdminLoading />}>
      <StatsAdminClient stats={statsResponse?.data || null} />
    </Suspense>
  );
}
