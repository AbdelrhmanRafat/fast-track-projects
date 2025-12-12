import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import ProjectViewClient from './pageClient';
import ProjectViewLoading from './loading';
import { getProject } from '@/lib/services/projects';

interface ProjectViewPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Project View Page - Server Component
 * Fetches project data and passes to client component
 */
export default async function ProjectViewPage({ params }: ProjectViewPageProps) {
  const { id } = await params;

  // Fetch project data
  const projectResponse = await getProject(id);

  // Handle not found
  if (!projectResponse || !projectResponse.data) {
    notFound();
  }

  return (
    <Suspense fallback={<ProjectViewLoading />}>
      <ProjectViewClient project={projectResponse.data} />
    </Suspense>
  );
}

