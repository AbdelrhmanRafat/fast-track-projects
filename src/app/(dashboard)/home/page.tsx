"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FolderKanban,
  Users,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Target,
  TrendingUp,
  Lightbulb,
  Calendar,
  BarChart3,
  Building2,
  Palette,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const { t, isRTL } = useTranslation();

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("home.greeting.morning");
    if (hour < 18) return t("home.greeting.afternoon");
    return t("home.greeting.evening");
  };

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  // Stats data
  const stats = [
    {
      title: t("home.stats.totalProjects"),
      value: "24",
      change: "+12%",
      changeType: "increase" as const,
      icon: FolderKanban,
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-500/10 to-blue-600/10",
    },
    {
      title: t("home.stats.activeProjects"),
      value: "8",
      change: "+3",
      changeType: "increase" as const,
      icon: Clock,
      gradient: "from-amber-500 to-orange-500",
      bgGradient: "from-amber-500/10 to-orange-500/10",
    },
    {
      title: t("home.stats.completedProjects"),
      value: "16",
      change: "+5",
      changeType: "increase" as const,
      icon: CheckCircle2,
      gradient: "from-emerald-500 to-green-500",
      bgGradient: "from-emerald-500/10 to-green-500/10",
    },
    {
      title: t("home.stats.teamMembers"),
      value: "12",
      change: "+2",
      changeType: "increase" as const,
      icon: Users,
      gradient: "from-violet-500 to-purple-500",
      bgGradient: "from-violet-500/10 to-purple-500/10",
    },
  ];

  // Quick actions
  const quickActions = [
    {
      title: t("home.quickActions.createProject"),
      description: t("home.quickActions.createProjectDesc"),
      icon: Plus,
      href: "/projects/create",
      gradient: "from-blue-500 to-indigo-500",
    },
    {
      title: t("home.quickActions.viewProjects"),
      description: t("home.quickActions.viewProjectsDesc"),
      icon: FolderKanban,
      href: "/projects",
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      title: t("home.quickActions.manageTeam"),
      description: t("home.quickActions.manageTeamDesc"),
      icon: Users,
      href: "/users",
      gradient: "from-violet-500 to-purple-500",
    },
    {
      title: t("home.quickActions.viewReports"),
      description: t("home.quickActions.viewReportsDesc"),
      icon: BarChart3,
      href: "/reports",
      gradient: "from-amber-500 to-orange-500",
    },
  ];

  // Project types
  const projectTypes = [
    {
      title: t("home.projectTypes.siteProject"),
      description: t("home.projectTypes.siteProjectDesc"),
      icon: Building2,
      count: 15,
      gradient: "from-sky-500 to-blue-500",
    },
    {
      title: t("home.projectTypes.designProject"),
      description: t("home.projectTypes.designProjectDesc"),
      icon: Palette,
      count: 9,
      gradient: "from-pink-500 to-rose-500",
    },
  ];

  // Tips
  const tips = [
    {
      title: t("home.tips.tip1.title"),
      description: t("home.tips.tip1.description"),
      icon: Target,
    },
    {
      title: t("home.tips.tip2.title"),
      description: t("home.tips.tip2.description"),
      icon: Calendar,
    },
    {
      title: t("home.tips.tip3.title"),
      description: t("home.tips.tip3.description"),
      icon: TrendingUp,
    },
  ];

  return (
    <div className="min-h-screen pb-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary/90 via-primary to-primary/80 p-6 md:p-10 mb-8">
        <div className="absolute inset-0 bg-grid-white/10 mask-[linear-gradient(0deg,transparent,rgba(255,255,255,0.5))]" />
        <div className="absolute -top-24 -end-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -start-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <span className="text-white/90 text-sm font-medium">{getGreeting()}</span>
          </div>
          
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-3">
            {t("home.hero.title")}
          </h1>
          
          <p className="text-white/80 text-sm md:text-base max-w-2xl mb-6 leading-relaxed">
            {t("home.hero.subtitle")}
          </p>
          
          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="bg-white text-primary hover:bg-white/90 shadow-lg shadow-black/20"
            >
              <Link href="/projects/create">
                <Plus className="w-4 h-4" />
                {t("home.quickActions.createProject")}
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm"
            >
              <Link href="/projects">
                {t("home.quickActions.viewProjects")}
                <ArrowIcon className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 group"
          >
            <div className={`absolute inset-0 bg-linear-to-br ${stat.bgGradient} opacity-50`} />
            <CardContent className="relative p-4 md:p-6">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl bg-linear-to-br ${stat.gradient} shadow-lg`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <Badge
                  variant="secondary"
                  className={`text-xs font-semibold ${
                    stat.changeType === "increase"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  {stat.change}
                </Badge>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                {stat.value}
              </p>
              <p className="text-xs md:text-sm text-muted-foreground">
                {stat.title}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-lg md:text-xl font-semibold">{t("home.quickActions.title")}</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Card className="h-full border-0 shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer hover:-translate-y-1">
                <CardContent className="p-4 md:p-5">
                  <div
                    className={`w-12 h-12 rounded-xl bg-linear-to-br ${action.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm md:text-base mb-1 group-hover:text-primary transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {action.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Project Types & Tips Row */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Project Types */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FolderKanban className="w-5 h-5 text-primary" />
              {t("home.projectTypes.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {projectTypes.map((type, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-linear-to-br ${type.gradient} flex items-center justify-center shadow-lg shrink-0`}
                >
                  <type.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-sm">{type.title}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {type.count} {t("home.recentProjects.steps")}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {type.description}
                  </p>
                  <Progress value={(type.count / 24) * 100} className="h-1.5 mt-2" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Tips & Guidelines */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              {t("home.tips.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tips.map((tip, index) => (
              <div
                key={index}
                className="flex gap-4 p-4 rounded-xl bg-linear-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-100 dark:border-amber-900/30"
              >
                <div className="w-10 h-10 rounded-lg bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shrink-0">
                  <tip.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">{tip.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {tip.description}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Empty State / CTA */}
      <Card className="border-0 shadow-md bg-linear-to-br from-muted/30 to-muted/50">
        <CardContent className="p-6 md:p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-linear-to-br from-primary to-primary/80 flex items-center justify-center shadow-xl">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg md:text-xl font-bold mb-2">
            {t("home.emptyState.title")}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            {t("home.emptyState.description")}
          </p>
          <Button asChild size="lg" className="shadow-lg">
            <Link href="/projects/create">
              <Plus className="w-4 h-4" />
              {t("home.emptyState.buttonText")}
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-muted-foreground">
        <p>
          {t("home.footer.copyright")} © {new Date().getFullYear()} •{" "}
          {t("home.footer.version")} 1.0.0
        </p>
      </div>
    </div>
  );
}