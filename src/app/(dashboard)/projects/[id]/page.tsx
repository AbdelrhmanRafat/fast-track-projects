import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import ProjectViewClient from './pageClient';
import ProjectViewLoading from './loading';
import { getProject, checkEditPermission } from '@/lib/services/projects';

interface ProjectViewPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Project View Page - Server Component
 * Fetches project data and checks edit permission, then passes to client component
 */
export default async function ProjectViewPage({ params }: ProjectViewPageProps) {
  const { id } = await params;

  // Fetch project data and check permission in parallel
  const [projectResponse, permissionResponse] = await Promise.all([
    getProject(id),
    checkEditPermission(id),
  ]);

  // Handle not found
  if (!projectResponse || !projectResponse.data) {
    notFound();
  }

  // Extract can_edit flag, default to false if permission check fails
  const canEdit = permissionResponse?.data?.can_edit ?? false;

  return (
    <Suspense fallback={<ProjectViewLoading />}>
      <ProjectViewClient project={projectResponse.data} canEdit={canEdit} />
    </Suspense>
  );
}

