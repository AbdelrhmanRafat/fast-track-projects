"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FolderKanban,
  Users,
  Plus,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  FileCheck,
  GitBranch,
  Lock,
  MessageSquarePlus,
  CheckCircle2,
  PlayCircle,
  ArrowRightCircle,
  XCircle,
  BarChart3,
  Workflow,
  Shield,
  Zap,
} from "lucide-react";
import Link from "next/link";
import gsap from "gsap";
import { getUserData, type UserData } from "@/lib/cookies";
import { UserRole } from "@/lib/types/userRoles";

// Permission helper functions
const canCreateProject = (role: string | undefined) => {
  return role === UserRole.Admin || role === UserRole.SubAdmin || role === UserRole.ProjectEngineers;
};

const canManageUsers = (role: string | undefined) => {
  return role === UserRole.Admin || role === UserRole.SubAdmin;
};

const canViewStatistics = (role: string | undefined) => {
  return role === UserRole.Admin || role === UserRole.SubAdmin;
};

export default function HomePage() {
  const { t, isRTL } = useTranslation();
  const [userData, setUserData] = useState<UserData | null>(null);
  
  // Refs for GSAP animations
  const heroRef = useRef<HTMLDivElement>(null);
  const workflowRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  // Get user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      const data = await getUserData();
      setUserData(data);
    };
    loadUserData();
  }, []);

  // GSAP Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero section animation
      if (heroRef.current) {
        gsap.fromTo(
          heroRef.current.querySelectorAll(".hero-animate"),
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: "power3.out",
          }
        );
      }

      // Workflow steps animation
      if (workflowRef.current) {
        gsap.fromTo(
          workflowRef.current.querySelectorAll(".workflow-step"),
          { opacity: 0, x: isRTL ? 50 : -50 },
          {
            opacity: 1,
            x: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: "power2.out",
            delay: 0.3,
          }
        );
      }

      // Quick actions animation
      if (actionsRef.current) {
        gsap.fromTo(
          actionsRef.current.querySelectorAll(".action-card"),
          { opacity: 0, scale: 0.9 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.5,
            stagger: 0.1,
            ease: "back.out(1.7)",
            delay: 0.5,
          }
        );
      }

      // Features animation
      if (featuresRef.current) {
        gsap.fromTo(
          featuresRef.current.querySelectorAll(".feature-card"),
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.15,
            ease: "power2.out",
            delay: 0.7,
          }
        );
      }
    });

    return () => ctx.revert();
  }, [isRTL]);

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("home.greeting.morning");
    if (hour < 18) return t("home.greeting.afternoon");
    return t("home.greeting.evening");
  };

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  // Workflow steps representing the project lifecycle
  const workflowSteps = [
    {
      icon: Plus,
      title: t("home.workflow.step1.title"),
      description: t("home.workflow.step1.description"),
      color: "from-blue-500 to-indigo-600",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Lock,
      title: t("home.workflow.step2.title"),
      description: t("home.workflow.step2.description"),
      color: "from-amber-500 to-orange-600",
      bgColor: "bg-amber-500/10",
    },
    {
      icon: MessageSquarePlus,
      title: t("home.workflow.step3.title"),
      description: t("home.workflow.step3.description"),
      color: "from-violet-500 to-purple-600",
      bgColor: "bg-violet-500/10",
    },
    {
      icon: GitBranch,
      title: t("home.workflow.step4.title"),
      description: t("home.workflow.step4.description"),
      color: "from-emerald-500 to-teal-600",
      bgColor: "bg-emerald-500/10",
    },
    {
      icon: CheckCircle2,
      title: t("home.workflow.step5.title"),
      description: t("home.workflow.step5.description"),
      color: "from-green-500 to-emerald-600",
      bgColor: "bg-green-500/10",
    },
  ];

  // Decision options after tendering
  const decisionOptions = [
    {
      icon: PlayCircle,
      title: t("home.decisions.progress.title"),
      description: t("home.decisions.progress.description"),
      color: "from-emerald-500 to-green-600",
    },
    {
      icon: XCircle,
      title: t("home.decisions.finalize.title"),
      description: t("home.decisions.finalize.description"),
      color: "from-slate-500 to-gray-600",
    },
  ];

  // Key features
  const features = [
    {
      icon: Shield,
      title: t("home.features.security.title"),
      description: t("home.features.security.description"),
      color: "text-blue-500",
    },
    {
      icon: Workflow,
      title: t("home.features.workflow.title"),
      description: t("home.features.workflow.description"),
      color: "text-emerald-500",
    },
    {
      icon: Zap,
      title: t("home.features.efficiency.title"),
      description: t("home.features.efficiency.description"),
      color: "text-amber-500",
    },
  ];

  // Quick actions based on user permissions
  const getQuickActions = () => {
    const actions = [];

    // View Projects - everyone can see
    actions.push({
      title: t("home.quickActions.viewProjects"),
      description: t("home.quickActions.viewProjectsDesc"),
      icon: FolderKanban,
      href: "/projects/all",
      gradient: "from-blue-500 to-indigo-600",
    });

    // Create Project - only for permitted roles
    if (canCreateProject(userData?.role)) {
      actions.push({
        title: t("home.quickActions.createProject"),
        description: t("home.quickActions.createProjectDesc"),
        icon: Plus,
        href: "/projects/create",
        gradient: "from-emerald-500 to-teal-600",
      });
    }

    // Statistics - only for admin/sub-admin
    if (canViewStatistics(userData?.role)) {
      actions.push({
        title: t("home.quickActions.viewReports"),
        description: t("home.quickActions.viewReportsDesc"),
        icon: BarChart3,
        href: "/stats-admin",
        gradient: "from-violet-500 to-purple-600",
      });
    }

    // Manage Users - only for admin/sub-admin
    if (canManageUsers(userData?.role)) {
      actions.push({
        title: t("home.quickActions.manageTeam"),
        description: t("home.quickActions.manageTeamDesc"),
        icon: Users,
        href: "/users",
        gradient: "from-rose-500 to-pink-600",
      });
    }

    return actions;
  };

  const quickActions = getQuickActions();

  return (
    <div className="min-h-screen pb-8 space-y-8">
      {/* Hero Section */}
      <div
        ref={heroRef}
        className="relative overflow-hidden rounded-2xl bg-linear-to-br from-[#5C1A1B] via-[#7a2324] to-[#5C1A1B] p-6 md:p-10"
      >
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -end-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -start-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-linear-to-r from-white/5 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="hero-animate flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <span className="text-white/90 text-sm font-medium">
              {getGreeting()}
              {userData?.name && `, ${userData.name}`}
            </span>
          </div>

          <h1 className="hero-animate text-2xl md:text-4xl font-bold text-white mb-3">
            {t("home.hero.title")}
          </h1>

          <p className="hero-animate text-white/80 text-sm md:text-base max-w-2xl mb-6 leading-relaxed">
            {t("home.hero.subtitle")}
          </p>

          <div className="hero-animate flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="bg-white text-[#5C1A1B] hover:bg-white/90 shadow-lg shadow-black/20"
            >
              <Link href="/projects/all">
                <FolderKanban className="w-4 h-4" />
                {t("home.quickActions.viewProjects")}
              </Link>
            </Button>
            {canCreateProject(userData?.role) && (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm"
              >
                <Link href="/projects/create">
                  <Plus className="w-4 h-4" />
                  {t("home.quickActions.createProject")}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Project Workflow Section */}
      <div ref={workflowRef} className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-[#5C1A1B] to-[#7a2324]">
            <Workflow className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-semibold">
              {t("home.workflow.title")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("home.workflow.subtitle")}
            </p>
          </div>
        </div>

        {/* Workflow Timeline */}
        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-linear-to-r from-blue-500/20 via-emerald-500/20 to-green-500/20 -translate-y-1/2" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {workflowSteps.map((step, index) => (
              <div
                key={index}
                className="workflow-step relative"
              >
                <Card className="h-full border-0 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group">
                  <div className={`absolute inset-0 ${step.bgColor} opacity-50`} />
                  <CardContent className="relative p-4 text-center">
                    {/* Step number */}
                    <div className="absolute top-2 end-2 w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs font-bold text-muted-foreground">
                        {index + 1}
                      </span>
                    </div>

                    <div
                      className={`w-12 h-12 mx-auto rounded-xl bg-linear-to-br ${step.color} flex items-center justify-center shadow-lg mb-3 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <step.icon className="w-6 h-6 text-white" />
                    </div>

                    <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>

                {/* Arrow connector for larger screens */}
                {index < workflowSteps.length - 1 && (
                  <div className="hidden lg:flex absolute -end-2 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRightCircle className="w-4 h-4 text-muted-foreground/50" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Decision Point Section */}
        <Card className="border-0 shadow-md bg-linear-to-br from-muted/30 to-muted/50 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">{t("home.decisions.title")}</h3>
                <p className="text-xs text-muted-foreground">
                  {t("home.decisions.subtitle")}
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {decisionOptions.map((option, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-xl bg-background/80 backdrop-blur-sm border border-border/50 hover:border-border transition-colors"
                >
                  <div
                    className={`w-10 h-10 rounded-lg bg-linear-to-br ${option.color} flex items-center justify-center shrink-0`}
                  >
                    <option.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">{option.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {option.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

    

      {/* Key Features */}
      <div ref={featuresRef} className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600">
            <FileCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-semibold">
              {t("home.features.title")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("home.features.subtitle")}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="feature-card border-0 shadow-md hover:shadow-lg transition-all duration-300"
            >
              <CardContent className="p-5">
                <feature.icon className={`w-8 h-8 ${feature.color} mb-3`} />
                <h3 className="font-semibold text-sm mb-2">{feature.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      {canCreateProject(userData?.role) && (
        <Card className="border-0 shadow-md bg-linear-to-br from-[#5C1A1B]/5 to-[#5C1A1B]/10 overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-[#5C1A1B] to-[#7a2324] flex items-center justify-center shadow-xl shrink-0">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 text-center md:text-start">
                <h3 className="text-lg md:text-xl font-bold mb-2">
                  {t("home.emptyState.title")}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  {t("home.emptyState.description")}
                </p>
              </div>
              <Button asChild size="lg" className="shadow-lg bg-[#5C1A1B] hover:bg-[#7a2324]">
                <Link href="/projects/create">
                  <Plus className="w-4 h-4" />
                  {t("home.emptyState.buttonText")}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground pt-4">
        <p>
          {t("home.footer.copyright")} © {new Date().getFullYear()} •{" "}
          {t("home.footer.version")} 1.0.0
        </p>
      </div>
    </div>
  );
}
