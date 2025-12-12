/**
 * Statistics Services
 * API functions for Statistics module
 * 
 * Server-side GET uses NetworkLayer directly
 */

import { NetworkLayer } from '@/network';
import type { ApiResponse } from '@/lib/types/response';
import type { StatsResponse } from './types';

/**
 * Get project statistics (Server-Side)
 * Use this in server components (page.tsx)
 * 
 * @param months - Number of months for statistics data (default: 12)
 */
export async function getProjectStatistics(
  months: number = 12
): Promise<ApiResponse<StatsResponse> | null> {
  try {
    const api = await NetworkLayer.createWithAutoConfig();
    const res = await api.get<ApiResponse<StatsResponse>>(
      `/project-statistics?months=${months}`
    );
    return res.data;
  } catch (error: any) {
    console.error('Error fetching project statistics:', error);
    return null;
  }
}
