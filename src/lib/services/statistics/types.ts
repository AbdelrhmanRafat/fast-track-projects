export interface StatsResponse {
    user_performance:                UserPerformance[];
    project_opening_status_overview: ProjectOpeningStatusOverview;
    project_status_distribution:     ProjectStatusDistribution;
    project_type_distribution:       ProjectTypeDistribution;
    completion_metrics:              CompletionMetrics;
    monthly_trends:                  MonthlyTrend[];
    top_performers:                  TopPerformers;
    recent_activity:                 RecentActivity;
    summary:                         Summary;
}

export interface CompletionMetrics {
    overall_completion_rate:  number;
    total_projects:           number;
    completed_projects:       number;
    active_projects:          number;
    total_steps:              number;
    finalized_steps:          number;
    steps_completion_rate:    number;
    avg_steps_per_project:    number;
    avg_completion_time_days: number;
}

export interface MonthlyTrend {
    month:               string;
    projects_created:    number;
    projects_completed?: number;
    steps_finalized:     number;
}

export interface ProjectOpeningStatusOverview {
    tinder:                number;
    inProgress:            number;
    tinder_percentage:     number;
    inProgress_percentage: number;
    trend_by_month:        TrendByMonth[];
}

export interface TrendByMonth {
    month:      string;
    tinder:     number;
    inProgress: number;
}

export interface ProjectStatusDistribution {
    active:               number;
    completed:            number;
    active_percentage:    number;
    completed_percentage: number;
    total:                number;
}

export interface ProjectTypeDistribution {
    siteProject:              number;
    designProject:            number;
    siteProject_percentage:   number;
    designProject_percentage: number;
}

export interface RecentActivity {
    recent_projects:           RecentProject[];
    recent_completions:        RecentCompletion[];
    recent_step_finalizations: RecentStepFinalization[];
}

export interface RecentCompletion {
    id:           string;
    project_name: string;
    completed_at: Date;
    creator_name: string;
}

export interface RecentProject {
    id:                     string;
    project_name:           string;
    created_at:             Date;
    creator_name:           string;
    status:                 string;
    project_opening_status: string;
}

export interface RecentStepFinalization {
    step_id:      string;
    step_name:    string;
    project_name: string;
    finalized_at: Date;
    finalized_by: string;
}

export interface Summary {
    total_projects:         number;
    total_users:            number;
    avg_projects_per_user:  number;
    projects_this_month:    number;
    completions_this_month: number;
}

export interface TopPerformers {
    most_projects_created:      Most[];
    most_steps_finalized:       Most[];
    fastest_project_completion: FastestProjectCompletion[];
}

export interface FastestProjectCompletion {
    project_id:   string;
    project_name: string;
    days:         number;
}

export interface Most {
    user_id:   string;
    user_name: string;
    count:     number;
}

export interface UserPerformance {
    user_id:           string;
    user_name:         string;
    projects_created:  number;
    projects_updated:  number;
    steps_finalized:   number;
    total_activity:    number;
    activity_by_month: MonthlyTrend[];
}