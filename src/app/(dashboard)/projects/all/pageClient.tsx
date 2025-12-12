'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/components/providers/LanguageProvider';
import { RouteBasedPageHeader } from '@/components/SharedCustomComponents/RouteBasedPageHeader';
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
  Download,
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

  // Table columns configuration - optimized for mobile
  const columns: TableColumn<Project>[] = useMemo(() => [
    {
      key: 'project_name',
      label: t('projects.table.columns.projectName'),
      width: 'min-w-[140px]',
      render: (value, row) => (
        <div className="space-y-1">
          <span className="font-medium text-sm block">{value}</span>
          <span className="text-xs text-muted-foreground block sm:hidden">
            {row.company_name || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'company_name',
      label: t('projects.table.columns.companyName'),
      className: 'hidden sm:table-cell',
      render: (value) => <span className="text-sm">{value || '-'}</span>,
    },
    {
      key: 'project_type',
      label: t('projects.table.columns.projectType'),
      width: 'w-[90px]',
      render: (value: ProjectType) => (
        <Badge
          variant="outline"
          className={`text-xs ${PROJECT_TYPE_BADGE_CLASSES[value] || ''}`}
        >
          {t(`projects.types.${value}` as any)}
        </Badge>
      ),
    },
    {
      key: 'duration_from',
      label: t('projects.view.duration'),
      className: 'hidden md:table-cell',
      render: (value, row) => (
        <div className="text-xs space-y-0.5">
          <span className="block">{formatDate(row.duration_from, language)}</span>
          <span className="text-muted-foreground block">
            → {formatDate(row.duration_to, language)}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      label: t('projects.table.columns.status'),
      width: 'w-[80px]',
      render: (value: ProjectStatus) => (
        <Badge
          variant="outline"
          className={`text-xs ${PROJECT_STATUS_BADGE_CLASSES[value] || ''}`}
        >
          {t(`projects.status.${value}` as any)}
        </Badge>
      ),
    },
    {
      key: 'creator',
      label: t('projects.table.columns.creator'),
      className: 'hidden lg:table-cell',
      render: (value) => <span className="text-sm">{value?.name || '-'}</span>,
    },
    {
      key: 'progress',
      label: t('projects.table.columns.progress'),
      width: 'w-[100px]',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Progress
            value={value?.percentage || 0}
            className="h-1.5 flex-1 min-w-[50px]"
          />
          <span className="text-xs text-muted-foreground w-8 text-end">
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
    <div className="space-y-4 sm:space-y-6">
      <RouteBasedPageHeader />

      {/* Page Title with Icon */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#5C1A1B]">
            <FolderKanban className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">{t('projects.allProjects')}</h2>
            <p className="text-xs text-muted-foreground">
              {pagination.total} {t('projects.title')}
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <SearchComponent
          config={searchConfig}
          onSearch={handleSearch}
          onClear={handleClearFilters}
          initialValues={searchInitialValues}
        />
      </div>

      {/* Table Component - No Card Wrapper */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <Table<Project>
          columns={columns}
          data={projects}
          loading={loading}
          actions={actions}
          showActions={true}
          searchable={false}
          showPagination={false}
          emptyMessage={t('projects.noProjects')}
          exportable={true}
          exportFileName="all-projects"
          className="border-0 shadow-none"
        />
      </div>

      {/* Mobile-Optimized Pagination */}
      {!loading && projects.length > 0 && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
          {/* Pagination Info */}
          <div className="text-xs text-muted-foreground order-2 sm:order-1">
            {t('table.showing')} {((pagination.page - 1) * pagination.limit) + 1}
            {' '}-{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)}
            {' '}{t('table.of')}{' '}
            {pagination.total}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-1.5 order-1 sm:order-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              className="h-9 px-3"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline ms-1">{t('table.previous')}</span>
            </Button>

            {/* Page Numbers - Simplified for Mobile */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(3, pagination.totalPages) }, (_, i) => {
                let pageNum: number;
                if (pagination.totalPages <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page <= 2) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 1) {
                  pageNum = pagination.totalPages - 2 + i;
                } else {
                  pageNum = pagination.page - 1 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={pagination.page === pageNum ? 'default' : 'outline'}
                    size="sm"
                    className="w-9 h-9 p-0"
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
              className="h-9 px-3"
            >
              <span className="hidden sm:inline me-1">{t('table.next')}</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
