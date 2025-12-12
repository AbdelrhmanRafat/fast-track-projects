import { Suspense } from 'react';
import { getProjects } from '@/lib/services/projects';
import type { ProjectsListData } from '@/lib/services/projects/types';
import type { ApiResponse } from '@/lib/types/response';
import CurrentProjectsTableClient from './pageClient';
import Loading from './loading';

interface CurrentProjectsPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    project_type?: string;
  }>;
}

/**
 * Server component that fetches current (active) projects data
 */
async function CurrentProjectsContent({ searchParams }: CurrentProjectsPageProps) {
  // Await searchParams (Next.js 15 requirement)
  const params = await searchParams;
  
  // Parse pagination params
  const page = parseInt(params.page || '1', 10);
  const limit = parseInt(params.limit || '10', 10);
  const search = params.search || '';
  const project_type = params.project_type || '';

  // Fetch current projects (status=active) from API (server-side)
  let projectsResponse: ApiResponse<ProjectsListData> | null = null;
  
  try {
    projectsResponse = await getProjects({
      page,
      limit,
      search: search || undefined,
      project_type: project_type as any || undefined,
      status: 'active', // Always filter for active projects
    });
  } catch (error) {
    console.error('Error fetching current projects:', error);
  }

  return (
    <CurrentProjectsTableClient
      initialData={projectsResponse?.data || null}
      searchParams={{
        page,
        limit,
        search,
        project_type,
      }}
    />
  );
}

/**
 * Main Current Projects page with Suspense boundary
 */
export default function CurrentProjectsPage({ searchParams }: CurrentProjectsPageProps) {
  return (
    <Suspense fallback={<Loading />}>
      <CurrentProjectsContent searchParams={searchParams} />
    </Suspense>
  );
}
