import { Suspense } from 'react';
import { getProjects } from '@/lib/services/projects';
import type { ProjectsListData } from '@/lib/services/projects/types';
import type { ApiResponse } from '@/lib/types/response';
import ProjectsTableClient from './pageClient';
import Loading from './loading';

interface ProjectsPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    project_type?: string;
    status?: string;
    project_opening_status?: string;
  }>;
}

/**
 * Server component that fetches projects data
 */
async function ProjectsContent({ searchParams }: ProjectsPageProps) {
  // Await searchParams (Next.js 15 requirement)
  const params = await searchParams;
  
  // Parse pagination params
  const page = parseInt(params.page || '1', 10);
  const limit = parseInt(params.limit || '10', 10);
  const search = params.search || '';
  const project_type = params.project_type || '';
  const status = params.status || '';
  const project_opening_status = params.project_opening_status || '';

  // Fetch projects from API (server-side)
  let projectsResponse: ApiResponse<ProjectsListData> | null = null;
  
  try {
    projectsResponse = await getProjects({
      page,
      limit,
      search: search || undefined,
      project_type: project_type as any || undefined,
      status: status as any || undefined,
      project_opening_status: project_opening_status as any || undefined,
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
  }

  return (
    <ProjectsTableClient
      initialData={projectsResponse?.data || null}
      searchParams={{
        page,
        limit,
        search,
        project_type,
        status,
        project_opening_status,
      }}
    />
  );
}

/**
 * Main Projects page with Suspense boundary
 */
export default function ProjectsPage({ searchParams }: ProjectsPageProps) {
  return (
    <Suspense fallback={<Loading />}>
      <ProjectsContent searchParams={searchParams} />
    </Suspense>
  );
}
