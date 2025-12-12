'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/components/providers/LanguageProvider';
import { RouteBasedPageHeader } from '@/components/SharedCustomComponents/RouteBasedPageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SearchComponent, SearchComponentConfig } from '@/components/ui/SearchComponent';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type {
  Project,
  ProjectsListData,
  PaginationInfo,
  ProjectType,
  ProjectStatus,
} from '@/lib/services/projects/types';
import {
  PROJECT_TYPE_BADGE_CLASSES,
  PROJECT_STATUS_BADGE_CLASSES,
} from '@/lib/services/projects/types';

interface CurrentProjectsTableClientProps {
  initialData: ProjectsListData | null;
  searchParams: {
    page: number;
    limit: number;
    search: string;
    project_type: string;
  };
}

/**
 * Format date string to localized format
 */
function formatDate(dateString: string | null, language: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function CurrentProjectsTableClient({
  initialData,
  searchParams,
}: CurrentProjectsTableClientProps) {
  const { t, language } = useTranslation();
  const router = useRouter();

  // State for data and loading
  const [data, setData] = useState<ProjectsListData | null>(initialData);
  const [loading, setLoading] = useState(false);

  // Update data when server component re-renders with new data
  useEffect(() => {
    setData(initialData);
    setLoading(false);
  }, [initialData]);

  // Search component configuration
  const searchConfig: SearchComponentConfig = useMemo(() => ({
    title: t('projects.filters.filterByType'),
    clearButtonText: t('projects.filters.clearFilters'),
    fields: [
      {
        key: 'search',
        type: 'text',
        label: t('form.search'),
        placeholder: t('projects.filters.searchPlaceholder'),
      },
      {
        key: 'project_type',
        type: 'select',
        label: t('projects.filters.filterByType'),
        placeholder: t('projects.types.all'),
        options: [
          { value: 'siteProject', label: t('projects.types.siteProject') },
          { value: 'designProject', label: t('projects.types.designProject') },
        ],
      },
    ],
  }), [t]);

  // Initial values for search component from URL params
  const searchInitialValues = useMemo(() => ({
    search: searchParams.search || '',
    project_type: searchParams.project_type || '',
  }), [searchParams]);

  /**
   * Handle search/filter from SearchComponent
   */
  const handleSearch = (values: Record<string, any>) => {
    const urlParams = new URLSearchParams();

    // Always reset to page 1 when filters change
    if (values.search) urlParams.set('search', values.search);
    if (values.project_type) urlParams.set('project_type', values.project_type);

    const queryString = urlParams.toString();
    const url = queryString ? `/projects/current?${queryString}` : '/projects/current';

    setLoading(true);
    router.push(url);
  };

  /**
   * Handle clear filters
   */
  const handleClearFilters = () => {
    setLoading(true);
    router.push('/projects/current');
  };

  /**
   * Handle page change
   */
  const handlePageChange = (newPage: number) => {
    const urlParams = new URLSearchParams();

    if (newPage > 1) urlParams.set('page', newPage.toString());
    if (searchParams.search) urlParams.set('search', searchParams.search);
    if (searchParams.project_type) urlParams.set('project_type', searchParams.project_type);

    const queryString = urlParams.toString();
    const url = queryString ? `/projects/current?${queryString}` : '/projects/current';

    setLoading(true);
    router.push(url);
  };

  /**
   * Navigate to project details
   */
  const handleViewProject = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  /**
   * Navigate to edit project
   */
  const handleEditProject = (projectId: string) => {
    router.push(`/projects/${projectId}/edit`);
  };

  /**
   * Handle delete project (placeholder)
   */
  const handleDeleteProject = (projectId: string) => {
    // TODO: Implement delete confirmation dialog
    console.log('Delete project:', projectId);
  };

  // Extract pagination info
  const pagination: PaginationInfo = data?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasMore: false,
  };

  const projects = data?.data || [];

  return (
    <div className="space-y-6">
      <RouteBasedPageHeader />

      <Card>
        <CardContent className="p-6">
          {/* Search and Filters using SearchComponent */}
          <div className="pb-6">
            <SearchComponent
              config={searchConfig}
              onSearch={handleSearch}
              onClear={handleClearFilters}
              initialValues={searchInitialValues}
            />
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="h-12 px-4 text-start align-middle font-medium text-muted-foreground">
                    {t('projects.table.columns.projectName')}
                  </th>
                  <th className="h-12 px-4 text-start align-middle font-medium text-muted-foreground">
                    {t('projects.table.columns.companyName')}
                  </th>
                  <th className="h-12 px-4 text-start align-middle font-medium text-muted-foreground">
                    {t('projects.table.columns.projectType')}
                  </th>
                  <th className="h-12 px-4 text-start align-middle font-medium text-muted-foreground">
                    {t('projects.fields.durationFrom')} - {t('projects.fields.durationTo')}
                  </th>
                  <th className="h-12 px-4 text-start align-middle font-medium text-muted-foreground">
                    {t('projects.table.columns.status')}
                  </th>
                  <th className="h-12 px-4 text-start align-middle font-medium text-muted-foreground">
                    {t('projects.table.columns.creator')}
                  </th>
                  <th className="h-12 px-4 text-start align-middle font-medium text-muted-foreground">
                    {t('projects.table.columns.progress')}
                  </th>
                  <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">
                    {t('projects.table.columns.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  // Loading skeleton rows
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={`skeleton-${index}`} className="border-b">
                      <td className="p-4"><Skeleton className="h-5 w-32" /></td>
                      <td className="p-4"><Skeleton className="h-5 w-24" /></td>
                      <td className="p-4"><Skeleton className="h-6 w-20" /></td>
                      <td className="p-4"><Skeleton className="h-5 w-36" /></td>
                      <td className="p-4"><Skeleton className="h-6 w-16" /></td>
                      <td className="p-4"><Skeleton className="h-5 w-20" /></td>
                      <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="p-4"><Skeleton className="h-8 w-8 mx-auto" /></td>
                    </tr>
                  ))
                ) : projects.length === 0 ? (
                  // Empty state
                  <tr>
                    <td colSpan={8} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <p className="text-lg font-medium">{t('projects.noProjects')}</p>
                        <p className="text-sm">{t('projects.noProjectsDescription')}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  // Data rows
                  projects.map((project) => (
                    <tr key={project.id} className="border-b last:border-b-0 hover:bg-muted/50 transition-colors">
                      {/* Project Name */}
                      <td className="p-4 align-middle font-medium">
                        {project.project_name}
                      </td>

                      {/* Company Name */}
                      <td className="p-4 align-middle">
                        {project.company_name || '-'}
                      </td>

                      {/* Project Type */}
                      <td className="p-4 align-middle">
                        <Badge
                          variant="outline"
                          className={PROJECT_TYPE_BADGE_CLASSES[project.project_type as ProjectType] || ''}
                        >
                          {t(`projects.types.${project.project_type}` as any)}
                        </Badge>
                      </td>

                      {/* Duration (From - To) */}
                      <td className="p-4 align-middle text-sm">
                        <div className="flex flex-col gap-0.5">
                          <span>
                            {formatDate(project.duration_from, language)}
                          </span>
                          <span className="text-muted-foreground">
                            → {formatDate(project.duration_to, language)}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4 align-middle">
                        <Badge
                          variant="outline"
                          className={PROJECT_STATUS_BADGE_CLASSES[project.status as ProjectStatus] || ''}
                        >
                          {t(`projects.status.${project.status}` as any)}
                        </Badge>
                      </td>

                      {/* Creator */}
                      <td className="p-4 align-middle">
                        {project.creator?.name || '-'}
                      </td>

                      {/* Progress */}
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <Progress
                            value={project.progress?.percentage || 0}
                            className="h-2 flex-1"
                          />
                          <span className="text-sm text-muted-foreground w-10 text-end">
                            {project.progress?.percentage || 0}%
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-4 align-middle text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">{t('common.actions')}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewProject(project.id)}>
                              <Eye className="h-4 w-4 me-2" />
                              {t('common.viewDetails')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditProject(project.id)}>
                              <Edit className="h-4 w-4 me-2" />
                              {t('common.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteProject(project.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 me-2" />
                              {t('common.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && projects.length > 0 && (
            <div className="flex items-center justify-between pt-4">
              {/* Pagination Info */}
              <div className="text-sm text-muted-foreground">
                {t('table.showing')} {((pagination.page - 1) * pagination.limit) + 1}
                {' '}{t('table.to')}{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)}
                {' '}{t('table.of')}{' '}
                {pagination.total} {t('table.entries')}
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4 me-1" />
                  {t('table.previous')}
                </Button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => handlePageChange(pageNum)}
                        disabled={loading}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasMore || loading}
                >
                  {t('table.next')}
                  <ChevronRight className="h-4 w-4 ms-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
