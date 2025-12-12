'use client';

import * as React from 'react';
import { useTranslation } from '@/components/providers/LanguageProvider';
import { RouteBasedPageHeader } from '@/components/SharedCustomComponents/RouteBasedPageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
} from '@/components/ui/chart';
import * as Recharts from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  FolderKanban,
  CheckCircle2,
  Clock,
  Target,
  BarChart3,
  Activity,
  Award,
  Zap,
  Calendar,
  FileText,
  ArrowRight,
} from 'lucide-react';
import type { StatsResponse } from '@/lib/services/statistics/types';
import { cn } from '@/lib/utils';

interface StatsAdminClientProps {
  stats: StatsResponse | null;
}

/**
 * Format date to localized string
 */
function formatDate(date: Date | string, language: string): string {
  const d = new Date(date);
  return d.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format number with locale
 */
function formatNumber(num: number, language: string): string {
  return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US').format(num);
}

/**
 * Statistics Admin Client Component
 * Luxury, mobile-first statistics dashboard
 */
export default function StatsAdminClient({ stats }: StatsAdminClientProps) {
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';

  // Handle no data state
  if (!stats) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <RouteBasedPageHeader />
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BarChart3 className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {t('statistics.noData' as any)}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { summary, completion_metrics, project_status_distribution, project_type_distribution, project_opening_status_overview, monthly_trends, top_performers, user_performance, recent_activity } = stats;

  // Chart colors
  const chartColors = {
    primary: 'hsl(var(--primary))',
    secondary: 'hsl(210 70% 50%)',
    success: 'hsl(142 76% 36%)',
    warning: 'hsl(38 92% 50%)',
    danger: 'hsl(0 84% 60%)',
    purple: 'hsl(262 83% 58%)',
    cyan: 'hsl(189 94% 43%)',
    orange: 'hsl(25 95% 53%)',
  };

  // Prepare chart data for monthly trends
  const monthlyTrendsData = monthly_trends?.map(trend => ({
    month: trend.month,
    created: trend.projects_created,
    completed: trend.projects_completed || 0,
    steps: trend.steps_finalized,
  })) || [];

  // Prepare opening status trend data
  const openingStatusTrendData = project_opening_status_overview?.trend_by_month?.map(trend => ({
    month: trend.month,
    tinder: trend.tinder,
    inProgress: trend.inProgress,
  })) || [];

  // Prepare status distribution for pie chart
  const statusDistributionData = [
    { name: t('statistics.projectStatus.active' as any), value: project_status_distribution?.active || 0, fill: chartColors.success },
    { name: t('statistics.projectStatus.completed' as any), value: project_status_distribution?.completed || 0, fill: chartColors.primary },
  ];

  // Prepare type distribution for pie chart
  const typeDistributionData = [
    { name: t('statistics.projectType.siteProject' as any), value: project_type_distribution?.siteProject || 0, fill: chartColors.purple },
    { name: t('statistics.projectType.designProject' as any), value: project_type_distribution?.designProject || 0, fill: chartColors.cyan },
  ];

  // Prepare opening status for pie chart
  const openingStatusData = [
    { name: t('statistics.openingStatus.tinder' as any), value: project_opening_status_overview?.tinder || 0, fill: chartColors.orange },
    { name: t('statistics.openingStatus.inProgress' as any), value: project_opening_status_overview?.inProgress || 0, fill: chartColors.secondary },
  ];

  return (
    <div className="space-y-6">
      <RouteBasedPageHeader />

      {/* Page Title & Description */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          {t('statistics.title' as any)}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('statistics.description' as any)}
        </p>
      </div>

      {/* Summary Cards - Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <SummaryCard
          title={t('statistics.summary.totalProjects' as any)}
          value={summary?.total_projects || 0}
          icon={FolderKanban}
          trend={summary?.projects_this_month > 0 ? 'up' : undefined}
          trendValue={summary?.projects_this_month}
          trendLabel={t('statistics.summary.projectsThisMonth' as any)}
          language={language}
        />
        <SummaryCard
          title={t('statistics.summary.totalUsers' as any)}
          value={summary?.total_users || 0}
          icon={Users}
          language={language}
        />
        <SummaryCard
          title={t('statistics.summary.avgProjectsPerUser' as any)}
          value={summary?.avg_projects_per_user?.toFixed(1) || '0'}
          icon={Target}
          language={language}
        />
        <SummaryCard
          title={t('statistics.summary.projectsThisMonth' as any)}
          value={summary?.projects_this_month || 0}
          icon={Calendar}
          accentColor="bg-blue-500"
          language={language}
        />
        <SummaryCard
          title={t('statistics.summary.completionsThisMonth' as any)}
          value={summary?.completions_this_month || 0}
          icon={CheckCircle2}
          accentColor="bg-emerald-500"
          language={language}
        />
      </div>

      {/* Completion Metrics - Hero Card */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            {t('statistics.completion.title' as any)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Progress Ring */}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative flex items-center justify-center">
              <svg className="w-32 h-32 sm:w-40 sm:h-40 -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-muted/20"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  className="text-primary"
                  strokeDasharray={`${(completion_metrics?.overall_completion_rate || 0) * 2.83} 283`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl sm:text-4xl font-bold">
                  {Math.round(completion_metrics?.overall_completion_rate || 0)}%
                </span>
                <span className="text-xs text-muted-foreground">
                  {t('statistics.completion.overallRate' as any)}
                </span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
              <MetricItem
                label={t('statistics.completion.completedProjects' as any)}
                value={completion_metrics?.completed_projects || 0}
                total={completion_metrics?.total_projects || 0}
                color="text-emerald-500"
                language={language}
              />
              <MetricItem
                label={t('statistics.completion.activeProjects' as any)}
                value={completion_metrics?.active_projects || 0}
                total={completion_metrics?.total_projects || 0}
                color="text-blue-500"
                language={language}
              />
              <MetricItem
                label={t('statistics.completion.finalizedSteps' as any)}
                value={completion_metrics?.finalized_steps || 0}
                total={completion_metrics?.total_steps || 0}
                color="text-purple-500"
                language={language}
              />
              <MetricItem
                label={t('statistics.completion.avgCompletionTime' as any)}
                value={`${Math.round(completion_metrics?.avg_completion_time_days || 0)}`}
                suffix={t('statistics.completion.days' as any)}
                color="text-orange-500"
                language={language}
              />
            </div>
          </div>

          {/* Steps Progress */}
          <div className="space-y-2 bg-background/50 rounded-xl p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{t('statistics.completion.stepsCompletionRate' as any)}</span>
              <span className="text-muted-foreground">
                {completion_metrics?.finalized_steps || 0} / {completion_metrics?.total_steps || 0}
              </span>
            </div>
            <Progress value={completion_metrics?.steps_completion_rate || 0} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t('statistics.completion.avgStepsPerProject' as any)}: {completion_metrics?.avg_steps_per_project?.toFixed(1) || 0}</span>
              <span>{Math.round(completion_metrics?.steps_completion_rate || 0)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row - Monthly Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Trends Line Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              {t('statistics.monthlyTrends.title' as any)}
            </CardTitle>
            <CardDescription>
              {t('statistics.monthlyTrends.description' as any)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                created: { label: t('statistics.monthlyTrends.projectsCreated' as any), color: chartColors.primary },
                completed: { label: t('statistics.monthlyTrends.projectsCompleted' as any), color: chartColors.success },
                steps: { label: t('statistics.monthlyTrends.stepsFinalized' as any), color: chartColors.purple },
              }}
              className="h-64 w-full"
            >
              <Recharts.ResponsiveContainer width="100%" height="100%">
                <Recharts.AreaChart
                  data={monthlyTrendsData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.success} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={chartColors.success} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Recharts.CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <Recharts.XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    reversed={isRTL}
                  />
                  <Recharts.YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    orientation={isRTL ? 'right' : 'left'}
                  />
                  <Recharts.Tooltip content={<ChartTooltipContent />} />
                  <Recharts.Area
                    type="monotone"
                    dataKey="created"
                    stroke={chartColors.primary}
                    strokeWidth={2}
                    fill="url(#colorCreated)"
                  />
                  <Recharts.Area
                    type="monotone"
                    dataKey="completed"
                    stroke={chartColors.success}
                    strokeWidth={2}
                    fill="url(#colorCompleted)"
                  />
                  <Recharts.Legend content={<ChartLegendContent />} />
                </Recharts.AreaChart>
              </Recharts.ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Opening Status Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              {t('statistics.charts.openingStatusTrend' as any)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                tinder: { label: t('statistics.openingStatus.tinder' as any), color: chartColors.orange },
                inProgress: { label: t('statistics.openingStatus.inProgress' as any), color: chartColors.secondary },
              }}
              className="h-64 w-full"
            >
              <Recharts.ResponsiveContainer width="100%" height="100%">
                <Recharts.BarChart
                  data={openingStatusTrendData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <Recharts.CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <Recharts.XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    reversed={isRTL}
                  />
                  <Recharts.YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    orientation={isRTL ? 'right' : 'left'}
                  />
                  <Recharts.Tooltip content={<ChartTooltipContent />} />
                  <Recharts.Bar dataKey="tinder" fill={chartColors.orange} radius={[4, 4, 0, 0]} />
                  <Recharts.Bar dataKey="inProgress" fill={chartColors.secondary} radius={[4, 4, 0, 0]} />
                  <Recharts.Legend content={<ChartLegendContent />} />
                </Recharts.BarChart>
              </Recharts.ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Project Status Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('statistics.projectStatus.title' as any)}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                active: { label: t('statistics.projectStatus.active' as any), color: chartColors.success },
                completed: { label: t('statistics.projectStatus.completed' as any), color: chartColors.primary },
              }}
              className="h-48 w-full"
            >
              <Recharts.ResponsiveContainer width="100%" height="100%">
                <Recharts.PieChart>
                  <Recharts.Pie
                    data={statusDistributionData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {statusDistributionData.map((entry, index) => (
                      <Recharts.Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Recharts.Pie>
                  <Recharts.Tooltip content={<ChartTooltipContent />} />
                  <Recharts.Legend content={<ChartLegendContent />} />
                </Recharts.PieChart>
              </Recharts.ResponsiveContainer>
            </ChartContainer>
            <div className="flex justify-center gap-6 mt-2 text-sm">
              <div className="text-center">
                <span className="text-2xl font-bold text-emerald-500">{project_status_distribution?.active || 0}</span>
                <p className="text-xs text-muted-foreground">{t('statistics.projectStatus.active' as any)}</p>
              </div>
              <div className="text-center">
                <span className="text-2xl font-bold text-primary">{project_status_distribution?.completed || 0}</span>
                <p className="text-xs text-muted-foreground">{t('statistics.projectStatus.completed' as any)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Type Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('statistics.projectType.title' as any)}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                siteProject: { label: t('statistics.projectType.siteProject' as any), color: chartColors.purple },
                designProject: { label: t('statistics.projectType.designProject' as any), color: chartColors.cyan },
              }}
              className="h-48 w-full"
            >
              <Recharts.ResponsiveContainer width="100%" height="100%">
                <Recharts.PieChart>
                  <Recharts.Pie
                    data={typeDistributionData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {typeDistributionData.map((entry, index) => (
                      <Recharts.Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Recharts.Pie>
                  <Recharts.Tooltip content={<ChartTooltipContent />} />
                  <Recharts.Legend content={<ChartLegendContent />} />
                </Recharts.PieChart>
              </Recharts.ResponsiveContainer>
            </ChartContainer>
            <div className="flex justify-center gap-6 mt-2 text-sm">
              <div className="text-center">
                <span className="text-2xl font-bold text-purple-500">{project_type_distribution?.siteProject || 0}</span>
                <p className="text-xs text-muted-foreground">{t('statistics.projectType.siteProject' as any)}</p>
              </div>
              <div className="text-center">
                <span className="text-2xl font-bold text-cyan-500">{project_type_distribution?.designProject || 0}</span>
                <p className="text-xs text-muted-foreground">{t('statistics.projectType.designProject' as any)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Opening Status Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('statistics.openingStatus.title' as any)}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                tinder: { label: t('statistics.openingStatus.tinder' as any), color: chartColors.orange },
                inProgress: { label: t('statistics.openingStatus.inProgress' as any), color: chartColors.secondary },
              }}
              className="h-48 w-full"
            >
              <Recharts.ResponsiveContainer width="100%" height="100%">
                <Recharts.PieChart>
                  <Recharts.Pie
                    data={openingStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {openingStatusData.map((entry, index) => (
                      <Recharts.Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Recharts.Pie>
                  <Recharts.Tooltip content={<ChartTooltipContent />} />
                  <Recharts.Legend content={<ChartLegendContent />} />
                </Recharts.PieChart>
              </Recharts.ResponsiveContainer>
            </ChartContainer>
            <div className="flex justify-center gap-6 mt-2 text-sm">
              <div className="text-center">
                <span className="text-2xl font-bold text-orange-500">{project_opening_status_overview?.tinder || 0}</span>
                <p className="text-xs text-muted-foreground">{t('statistics.openingStatus.tinder' as any)}</p>
              </div>
              <div className="text-center">
                <span className="text-2xl font-bold text-blue-500">{project_opening_status_overview?.inProgress || 0}</span>
                <p className="text-xs text-muted-foreground">{t('statistics.openingStatus.inProgress' as any)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Award className="h-5 w-5 text-amber-500" />
            {t('statistics.topPerformers.title' as any)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Most Projects Created */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FolderKanban className="h-4 w-4" />
                {t('statistics.topPerformers.mostProjectsCreated' as any)}
              </h4>
              <div className="space-y-2">
                {top_performers?.most_projects_created?.slice(0, 3).map((performer, index) => (
                  <div key={performer.user_id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                    <span className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                      index === 0 ? 'bg-amber-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      'bg-amber-700 text-white'
                    )}>
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{performer.user_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {performer.count} {t('statistics.topPerformers.projects' as any)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Steps Finalized */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {t('statistics.topPerformers.mostStepsFinalized' as any)}
              </h4>
              <div className="space-y-2">
                {top_performers?.most_steps_finalized?.slice(0, 3).map((performer, index) => (
                  <div key={performer.user_id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                    <span className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                      index === 0 ? 'bg-emerald-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      'bg-emerald-700 text-white'
                    )}>
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{performer.user_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {performer.count} {t('statistics.topPerformers.steps' as any)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fastest Completion */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Zap className="h-4 w-4" />
                {t('statistics.topPerformers.fastestCompletion' as any)}
              </h4>
              <div className="space-y-2">
                {top_performers?.fastest_project_completion?.slice(0, 3).map((project, index) => (
                  <div key={project.project_id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                    <span className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                      index === 0 ? 'bg-blue-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      'bg-blue-700 text-white'
                    )}>
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{project.project_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(t('statistics.topPerformers.inDays' as any) as string).replace('{days}', String(project.days))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Performance Table */}
      {user_performance && user_performance.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              {t('statistics.userPerformance.title' as any)}
            </CardTitle>
            <CardDescription>
              {t('statistics.userPerformance.description' as any)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-start py-3 px-4 text-sm font-medium text-muted-foreground">
                      {t('statistics.userPerformance.user' as any)}
                    </th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">
                      {t('statistics.userPerformance.projectsCreated' as any)}
                    </th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">
                      {t('statistics.userPerformance.projectsUpdated' as any)}
                    </th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">
                      {t('statistics.userPerformance.stepsFinalized' as any)}
                    </th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">
                      {t('statistics.userPerformance.totalActivity' as any)}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {user_performance.slice(0, 10).map((user) => (
                    <tr key={user.user_id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {user.user_name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <span className="font-medium text-sm">{user.user_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Badge variant="outline" className="bg-primary/10">
                          {user.projects_created}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-600">
                          {user.projects_updated}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600">
                          {user.steps_finalized}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="font-semibold">{user.total_activity}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-primary" />
            {t('statistics.recentActivity.title' as any)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Projects */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t('statistics.recentActivity.recentProjects' as any)}
              </h4>
              <div className="space-y-2">
                {recent_activity?.recent_projects?.slice(0, 5).map((project) => (
                  <div key={project.id} className="p-3 rounded-lg bg-muted/30 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium line-clamp-1">{project.project_name}</p>
                      <Badge variant="outline" className={cn(
                        'text-xs shrink-0',
                        project.status === 'active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                        'bg-blue-100 text-blue-700 border-blue-200'
                      )}>
                        {project.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('statistics.recentActivity.by' as any)} {project.creator_name} • {formatDate(project.created_at, language)}
                    </p>
                  </div>
                ))}
                {(!recent_activity?.recent_projects || recent_activity.recent_projects.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t('statistics.recentActivity.noData' as any)}
                  </p>
                )}
              </div>
            </div>

            {/* Recent Completions */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {t('statistics.recentActivity.recentCompletions' as any)}
              </h4>
              <div className="space-y-2">
                {recent_activity?.recent_completions?.slice(0, 5).map((completion) => (
                  <div key={completion.id} className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 space-y-1">
                    <p className="text-sm font-medium line-clamp-1">{completion.project_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('statistics.recentActivity.by' as any)} {completion.creator_name} • {formatDate(completion.completed_at, language)}
                    </p>
                  </div>
                ))}
                {(!recent_activity?.recent_completions || recent_activity.recent_completions.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t('statistics.recentActivity.noData' as any)}
                  </p>
                )}
              </div>
            </div>

            {/* Recent Step Finalizations */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ArrowRight className="h-4 w-4" />
                {t('statistics.recentActivity.recentSteps' as any)}
              </h4>
              <div className="space-y-2">
                {recent_activity?.recent_step_finalizations?.slice(0, 5).map((step) => (
                  <div key={step.step_id} className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 space-y-1">
                    <p className="text-sm font-medium line-clamp-1">{step.step_name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {step.project_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('statistics.recentActivity.by' as any)} {step.finalized_by} • {formatDate(step.finalized_at, language)}
                    </p>
                  </div>
                ))}
                {(!recent_activity?.recent_step_finalizations || recent_activity.recent_step_finalizations.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t('statistics.recentActivity.noData' as any)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Summary Card Component
 */
interface SummaryCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  trend?: 'up' | 'down';
  trendValue?: number;
  trendLabel?: string;
  accentColor?: string;
  language: string;
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  trendLabel,
  accentColor = 'bg-primary',
  language,
}: SummaryCardProps) {
  return (
    <Card className="relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className={cn('absolute top-0 start-0 w-1 h-full', accentColor)} />
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className={cn('p-2 rounded-lg', `${accentColor}/10`)}>
            <Icon className={cn('h-4 w-4', accentColor.replace('bg-', 'text-'))} />
          </div>
          {trend && trendValue !== undefined && (
            <div className={cn(
              'flex items-center gap-1 text-xs',
              trend === 'up' ? 'text-emerald-500' : 'text-red-500'
            )}>
              {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>+{trendValue}</span>
            </div>
          )}
        </div>
        <p className="text-2xl sm:text-3xl font-bold tracking-tight">
          {typeof value === 'number' ? formatNumber(value, language) : value}
        </p>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{title}</p>
      </CardContent>
    </Card>
  );
}

/**
 * Metric Item Component
 */
interface MetricItemProps {
  label: string;
  value: number | string;
  total?: number;
  suffix?: string;
  color: string;
  language: string;
}

function MetricItem({ label, value, total, suffix, color, language }: MetricItemProps) {
  return (
    <div className="text-center space-y-1">
      <p className="text-xs text-muted-foreground line-clamp-1">{label}</p>
      <p className={cn('text-xl sm:text-2xl font-bold', color)}>
        {typeof value === 'number' ? formatNumber(value, language) : value}
        {suffix && <span className="text-sm font-normal ms-1">{suffix}</span>}
      </p>
      {total !== undefined && (
        <p className="text-xs text-muted-foreground">
          / {formatNumber(total, language)}
        </p>
      )}
    </div>
  );
}
