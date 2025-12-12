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
import { Table, TableColumn, TableAction } from '@/components/ui/Table';
import {
  Eye,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
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

interface ProjectsTableClientProps {
  initialData: ProjectsListData | null;
  searchParams: {
    page: number;
    limit: number;
    search: string;
    project_type: string;
    status: string;
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

export default function ProjectsTableClient({
  initialData,
  searchParams,
}: ProjectsTableClientProps) {
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
      {
        key: 'status',
        type: 'select',
        label: t('projects.filters.filterByStatus'),
        placeholder: t('projects.status.all'),
        options: [
          { value: 'active', label: t('projects.status.active') },
          { value: 'completed', label: t('projects.status.completed') },
          { value: 'overdue', label: t('projects.status.overdue') },
        ],
      },
    ],
  }), [t]);

  // Initial values for search component from URL params
  const searchInitialValues = useMemo(() => ({
    search: searchParams.search || '',
    project_type: searchParams.project_type || '',
    status: searchParams.status || '',
  }), [searchParams]);

  /**
   * Handle search/filter from SearchComponent
   */
  const handleSearch = (values: Record<string, any>) => {
    const urlParams = new URLSearchParams();

    // Always reset to page 1 when filters change
    if (values.search) urlParams.set('search', values.search);
    if (values.project_type) urlParams.set('project_type', values.project_type);
    if (values.status) urlParams.set('status', values.status);

    const queryString = urlParams.toString();
    const url = queryString ? `/projects/all?${queryString}` : '/projects/all';

    setLoading(true);
    router.push(url);
  };

  /**
   * Handle clear filters
   */
  const handleClearFilters = () => {
    setLoading(true);
    router.push('/projects/all');
  };

  /**
   * Handle page change
   */
  const handlePageChange = (newPage: number) => {
    const urlParams = new URLSearchParams();

    if (newPage > 1) urlParams.set('page', newPage.toString());
    if (searchParams.search) urlParams.set('search', searchParams.search);
    if (searchParams.project_type) urlParams.set('project_type', searchParams.project_type);
    if (searchParams.status) urlParams.set('status', searchParams.status);

    const queryString = urlParams.toString();
    const url = queryString ? `/projects/all?${queryString}` : '/projects/all';

    setLoading(true);
    router.push(url);
  };

  /**
   * Navigate to project details
   */
  const handleViewProject = (projectId: string) => {
    router.push(`/projects/${projectId}`);
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

  // Table columns configuration
  const columns: TableColumn<Project>[] = useMemo(() => [
    {
      key: 'project_name',
      label: t('projects.table.columns.projectName'),
      render: (value) => <span className="font-medium">{value}</span>,
    },
    {
      key: 'company_name',
      label: t('projects.table.columns.companyName'),
      render: (value) => value || '-',
    },
    {
      key: 'project_type',
      label: t('projects.table.columns.projectType'),
      render: (value: ProjectType) => (
        <Badge
          variant="outline"
          className={PROJECT_TYPE_BADGE_CLASSES[value] || ''}
        >
          {t(`projects.types.${value}` as any)}
        </Badge>
      ),
    },
    {
      key: 'duration_from',
      label: `${t('projects.fields.durationFrom')} - ${t('projects.fields.durationTo')}`,
      render: (value, row) => (
        <div className="flex flex-col gap-0.5">
          <span>{formatDate(row.duration_from, language)}</span>
          <span className="text-muted-foreground">
            → {formatDate(row.duration_to, language)}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      label: t('projects.table.columns.status'),
      render: (value: ProjectStatus) => (
        <Badge
          variant="outline"
          className={PROJECT_STATUS_BADGE_CLASSES[value] || ''}
        >
          {t(`projects.status.${value}` as any)}
        </Badge>
      ),
    },
    {
      key: 'creator',
      label: t('projects.table.columns.creator'),
      render: (value) => value?.name || '-',
    },
    {
      key: 'progress',
      label: t('projects.table.columns.progress'),
      render: (value) => (
        <div className="flex items-center gap-2 min-w-[100px]">
          <Progress
            value={value?.percentage || 0}
            className="h-2 flex-1"
          />
          <span className="text-sm text-muted-foreground w-10 text-end">
            {value?.percentage || 0}%
          </span>
        </div>
      ),
    },
  ], [t, language]);

  // Table actions configuration
  const actions: TableAction[] = useMemo(() => [
    {
      key: 'view',
      label: t('common.viewDetails'),
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: Project) => handleViewProject(row.id),
      variant: 'default',
    },
  ], [t]);

  return (
    <div className="space-y-6">
      <RouteBasedPageHeader />

      <Card className="overflow-hidden p-0 gap-0">
        {/* Brand Header */}
        <div className="bg-[#5C1A1B] px-5 py-4 flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/15">
            <FolderKanban className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-white">{t('projects.allProjects')}</span>
        </div>
        <CardContent className="p-5 space-y-5">
          {/* Search and Filters using SearchComponent */}
          <div className="pb-4">
            <SearchComponent
              config={searchConfig}
              onSearch={handleSearch}
              onClear={handleClearFilters}
              initialValues={searchInitialValues}
            />
          </div>

          {/* Table Component */}
          <Table<Project>
            columns={columns}
            data={projects}
            loading={loading}
            actions={actions}
            showActions={true}
            searchable={false}
            showPagination={false}
            emptyMessage={t('projects.noProjects')}
          />

          {/* Server-Side Pagination */}
          {!loading && projects.length > 0 && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
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
