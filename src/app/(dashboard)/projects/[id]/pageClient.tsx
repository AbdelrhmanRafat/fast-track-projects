'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/components/providers/LanguageProvider';
import { RouteBasedPageHeader } from '@/components/SharedCustomComponents/RouteBasedPageHeader';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Calendar,
  Building2,
  User,
  CheckCircle2,
  Clock,
  FileText,
  ListChecks,
  MessageSquare,
  AlertTriangle,
  Lock,
  StickyNote,
} from 'lucide-react';
import type { Project, ProjectType, ProjectStatus, ProjectStep, FinalizedNote } from '@/lib/services/projects/types';
import {
  PROJECT_TYPE_BADGE_CLASSES,
  PROJECT_STATUS_BADGE_CLASSES,
} from '@/lib/services/projects/types';
import { updateStepAction } from '@/lib/services/projects';
import { toast } from 'sonner';

interface ProjectViewClientProps {
  project: Project;
}

/**
 * Format date string to localized format
 */
function formatDate(dateString: string | null | undefined, language: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format date and time string to localized format
 */
function formatDateTime(dateString: string | null | undefined, language: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculate days remaining or overdue
 */
function calculateDaysInfo(durationTo: string | null | undefined): { diffDays: number; isOverdue: boolean } | null {
  if (!durationTo) return null;
  
  const now = new Date();
  const endDate = new Date(durationTo);
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return { diffDays, isOverdue: diffDays < 0 };
}

export default function ProjectViewClient({ project }: ProjectViewClientProps) {
  const { t, language } = useTranslation();
  const router = useRouter();

  // Dialog states
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [confirmFinalizeDialogOpen, setConfirmFinalizeDialogOpen] = useState(false);
  const [selectedStep, setSelectedStep] = useState<ProjectStep | null>(null);
  const [noteText, setNoteText] = useState('');
  const [pendingFinalizeWithNote, setPendingFinalizeWithNote] = useState(false);

  // Calculate progress
  const totalSteps = project.project_steps?.length || 0;
  const finalizedSteps = project.project_steps?.filter(step => step.is_finalized).length || 0;
  const progressPercentage = totalSteps > 0 ? Math.round((finalizedSteps / totalSteps) * 100) : 0;

  // Get days info
  const daysCalc = calculateDaysInfo(project.duration_to);
  const daysInfo = daysCalc ? {
    text: daysCalc.diffDays < 0 
      ? (t('projects.view.daysOverdue' as any) as string).replace('{days}', String(Math.abs(daysCalc.diffDays)))
      : daysCalc.diffDays === 0 
        ? t('projects.view.dueToday' as any)
        : (t('projects.view.daysRemaining' as any) as string).replace('{days}', String(daysCalc.diffDays)),
    isOverdue: daysCalc.isOverdue
  } : null;

  // Sort steps by step_order
  const sortedSteps = [...(project.project_steps || [])].sort((a, b) => a.step_order - b.step_order);

  /**
   * Open note dialog for a step
   */
  const handleOpenNoteDialog = (step: ProjectStep) => {
    setSelectedStep(step);
    setNoteText('');
    setNoteDialogOpen(true);
  };

  /**
   * Close note dialog and reset state
   */
  const handleCloseNoteDialog = () => {
    setNoteDialogOpen(false);
    setSelectedStep(null);
    setNoteText('');
    setPendingFinalizeWithNote(false);
  };

  /**
   * Open finalization confirmation dialog
   * @param withNote - if true, will finalize with the current note after confirmation
   */
  const handleOpenFinalizeConfirmation = (withNote: boolean = false) => {
    setPendingFinalizeWithNote(withNote);
    setConfirmFinalizeDialogOpen(true);
  };

  /**
   * Close finalization confirmation dialog
   */
  const handleCloseFinalizeConfirmation = () => {
    setConfirmFinalizeDialogOpen(false);
    setPendingFinalizeWithNote(false);
  };

  /**
   * Submit action: Add note only (no finalization)
   */
  const handleAddNoteOnly = async () => {
    if (!selectedStep || !noteText.trim()) {
      toast.error(t('projects.steps.finalizeDialog.noteRequired' as any));
      return;
    }

    try {
      const result = await updateStepAction({
        id: selectedStep.id,
        finalized_notes: [{ note: noteText.trim() }],
      });

      if (result) {
        toast.success(t('projects.messages.noteAddedSuccess' as any));
        handleCloseNoteDialog();
        router.refresh();
      } else {
        toast.error(t('projects.messages.updateError' as any));
      }
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error(t('projects.messages.updateError' as any));
    }
  };

  /**
   * Confirmed finalization action - called after user confirms
   */
  const handleConfirmedFinalize = async () => {
    if (!selectedStep) return;

    try {
      const payload: { id: string; is_finalized: true; finalized_notes?: [{ note: string }] } = {
        id: selectedStep.id,
        is_finalized: true,
      };

      // If finalizing with note, include the note
      if (pendingFinalizeWithNote && noteText.trim()) {
        payload.finalized_notes = [{ note: noteText.trim() }];
      }

      const result = await updateStepAction(payload);

      if (result) {
        toast.success(
          pendingFinalizeWithNote
            ? t('projects.messages.stepFinalizedWithNoteSuccess' as any)
            : t('projects.messages.stepFinalizedSuccess' as any)
        );
        handleCloseFinalizeConfirmation();
        handleCloseNoteDialog();
        router.refresh();
      } else {
        toast.error(t('projects.messages.updateError' as any));
      }
    } catch (error) {
      console.error('Error finalizing step:', error);
      toast.error(t('projects.messages.updateError' as any));
    }
  };

  /**
   * Request to finalize step (opens confirmation dialog)
   */
  const handleRequestFinalize = () => {
    handleOpenFinalizeConfirmation(false);
  };

  /**
   * Request to add note AND finalize step (opens confirmation dialog)
   */
  const handleRequestFinalizeWithNote = () => {
    if (!noteText.trim()) {
      toast.error(t('projects.steps.finalizeDialog.noteRequired' as any));
      return;
    }
    handleOpenFinalizeConfirmation(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <RouteBasedPageHeader />

      {/* Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2 h-9"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('common.back')}
        </Button>
      </div>

      {/* Project Header - Mobile Optimized */}
      <div className="space-y-4">
        {/* Title Row */}
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#5C1A1B] shrink-0">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-lg sm:text-xl truncate">{project.project_name}</h1>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <Badge
                variant="outline"
                className={`text-xs ${PROJECT_TYPE_BADGE_CLASSES[project.project_type as ProjectType] || ''}`}
              >
                {t(`projects.types.${project.project_type}` as any)}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs ${PROJECT_STATUS_BADGE_CLASSES[project.status as ProjectStatus] || ''}`}
              >
                {t(`projects.status.${project.status}` as any)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Description */}
        {project.project_description && (
          <p className="text-sm text-muted-foreground">
            {project.project_description}
          </p>
        )}

        {/* Progress Bar */}
        <div className="space-y-2 bg-muted/30 rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{t('projects.view.overallProgress')}</span>
            <span className="text-muted-foreground text-xs sm:text-sm">
              {finalizedSteps}/{totalSteps} {t('projects.view.stepsCompleted')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={progressPercentage} className="h-2 sm:h-3 flex-1" />
            <span className="text-sm font-semibold w-10 text-end">{progressPercentage}%</span>
          </div>
        </div>
      </div>

      {/* Project Info Cards - Mobile Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Company Name */}
        <div className="bg-card rounded-xl border p-3 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span className="text-xs">{t('projects.fields.companyName')}</span>
          </div>
          <p className="font-medium text-sm truncate">{project.company_name || '-'}</p>
        </div>

        {/* Creator */}
        <div className="bg-card rounded-xl border p-3 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4" />
            <span className="text-xs">{t('projects.fields.creator')}</span>
          </div>
          <p className="font-medium text-sm truncate">{project.creator?.name || '-'}</p>
        </div>

        {/* Duration */}
        <div className="bg-card rounded-xl border p-3 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-xs">{t('projects.view.duration')}</span>
          </div>
          <p className="font-medium text-xs sm:text-sm">
            {formatDate(project.duration_from, language)}
          </p>
          <p className="text-xs text-muted-foreground">
            → {formatDate(project.duration_to, language)}
          </p>
        </div>

        {/* Days Remaining/Overdue */}
        {daysInfo && (
          <div className={`rounded-xl border p-3 space-y-1 ${
            daysInfo.isOverdue 
              ? 'bg-destructive/5 border-destructive/20' 
              : 'bg-card'
          }`}>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className={`h-4 w-4 ${daysInfo.isOverdue ? 'text-destructive' : ''}`} />
              <span className="text-xs">{t('projects.view.timeStatus')}</span>
            </div>
            <p className={`font-medium text-sm ${daysInfo.isOverdue ? 'text-destructive' : ''}`}>
              {daysInfo.text}
            </p>
          </div>
        )}
      </div>

      {/* Created/Updated Info */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-xs text-muted-foreground px-1">
        <span>
          {t('projects.fields.createdAt')}: {formatDateTime(project.created_at, language)}
        </span>
        <span>
          {t('projects.fields.updatedAt')}: {formatDateTime(project.updated_at, language)}
        </span>
      </div>

      {/* Project Steps Section */}
      <div className="space-y-3">
        {/* Steps Header */}
        <div className="flex items-center gap-3 px-1">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#5C1A1B]">
            <ListChecks className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold">{t('projects.steps.title')}</h2>
            <p className="text-xs text-muted-foreground">
              {totalSteps} {t('projects.view.totalSteps')} • {finalizedSteps} {t('projects.view.finalized')}
            </p>
          </div>
        </div>

        {/* Steps List */}
        {sortedSteps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/20 rounded-xl">
            <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="font-medium text-muted-foreground">{t('projects.steps.noSteps')}</p>
            <p className="text-xs text-muted-foreground">{t('projects.steps.addFirstStep')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedSteps.map((step, index) => (
              <StepCard
                key={step.id}
                step={step}
                stepNumber={index + 1}
                language={language}
                t={t as (key: string) => string}
                onOpenActions={() => handleOpenNoteDialog(step)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Step Actions Dialog - For adding notes and initiating finalization */}
      <AlertDialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <StickyNote className="h-5 w-5 text-primary" />
              {t('projects.steps.finalizeDialog.title' as any)}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {selectedStep && (
                  <div className="bg-muted/50 rounded-lg p-3 mt-2 mb-1">
                    <span className="text-sm text-muted-foreground">{t('projects.steps.stepName' as any)}:</span>
                    <span className="block font-semibold text-foreground">
                      {selectedStep.step_name}
                    </span>
                  </div>
                )}
                <p className="text-sm mt-3">
                  {t('projects.steps.finalizeDialog.description' as any)}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Note Input */}
          <div className="space-y-2 my-2">
            <Label htmlFor="finalize-note" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              {t('projects.steps.finalizeDialog.noteLabel' as any)}
            </Label>
            <Textarea
              id="finalize-note"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={t('projects.steps.finalizeDialog.notePlaceholder' as any)}
              rows={3}
              className="resize-none"
            />
          </div>

          <AlertDialogFooter className="flex-col gap-3 sm:flex-col mt-4">
            {/* Action buttons - redesigned for clarity */}
            <div className="flex flex-col gap-3 w-full">
              {/* Add Note Only - Safe action, clearly labeled */}
              <Button
                variant="outline"
                onClick={handleAddNoteOnly}
                disabled={!noteText.trim()}
                className="w-full justify-center gap-2 h-11 border-primary/30 hover:border-primary hover:bg-primary/5"
              >
                <StickyNote className="h-4 w-4" />
                <span>{t('projects.steps.finalizeDialog.addNoteOnly' as any)}</span>
              </Button>

              {/* Separator with "or" text */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    {t('common.or' as any) || 'or'}
                  </span>
                </div>
              </div>

              {/* Finalize Only - Requires confirmation, styled as warning */}
              <Button
                variant="outline"
                onClick={handleRequestFinalize}
                className="w-full justify-center gap-2 h-11 border-amber-500/50 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 dark:text-amber-400 dark:border-amber-700"
              >
                <Lock className="h-4 w-4" />
                <span>{t('projects.steps.finalizeDialog.finalizeOnly' as any)}</span>
              </Button>

              {/* Add Note & Finalize - Requires note and confirmation */}
              <Button
                variant="default"
                onClick={handleRequestFinalizeWithNote}
                disabled={!noteText.trim()}
                className="w-full justify-center gap-2 h-11 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{t('projects.steps.finalizeDialog.addNoteAndFinalize' as any)}</span>
              </Button>
            </div>

            {/* Cancel button */}
            <AlertDialogCancel 
              onClick={handleCloseNoteDialog}
              className="w-full mt-1"
            >
              {t('common.cancel')}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Finalization Confirmation Dialog - Strong warning before finalizing */}
      <AlertDialog open={confirmFinalizeDialogOpen} onOpenChange={setConfirmFinalizeDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/50 mx-auto mb-4">
              <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <AlertDialogTitle className="text-center text-xl">
              {t('projects.steps.confirmDialog.title' as any)}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-center space-y-3">
                <p className="text-base">
                  {t('projects.steps.confirmDialog.message' as any)}
                </p>
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-amber-800 dark:text-amber-300 text-start">
                      {t('projects.steps.confirmDialog.warning' as any)}
                    </p>
                  </div>
                </div>
                {selectedStep && (
                  <p className="text-sm text-muted-foreground">
                    {t('projects.steps.confirmDialog.stepLabel' as any)}: <strong className="text-foreground">{selectedStep.step_name}</strong>
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex-col gap-2 sm:flex-col mt-4">
            {/* Confirm button - Destructive style for emphasis */}
            <AlertDialogAction
              onClick={handleConfirmedFinalize}
              className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-700 dark:hover:bg-amber-800"
            >
              <Lock className="h-4 w-4 me-2" />
              {t('projects.steps.confirmDialog.confirm' as any)}
            </AlertDialogAction>

            {/* Cancel button */}
            <AlertDialogCancel 
              onClick={handleCloseFinalizeConfirmation}
              className="w-full"
            >
              {t('projects.steps.confirmDialog.cancel' as any)}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/**
 * Step Card Component - Mobile-optimized read-only display with actions
 * Following brand design system
 */
interface StepCardProps {
  step: ProjectStep;
  stepNumber: number;
  language: string;
  t: (key: string) => string;
  onOpenActions: () => void;
}

function StepCard({ step, stepNumber, language, t, onOpenActions }: StepCardProps) {
  const isFinalized = step.is_finalized;
  const hasNotes = step.finalized_notes && step.finalized_notes.length > 0;

  return (
    <div
      className={`relative rounded-xl p-3 sm:p-4 transition-colors ${
        isFinalized 
          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800' 
          : 'bg-muted/40 dark:bg-muted/20 border border-transparent'
      }`}
    >
      {/* Step Header - Mobile Optimized */}
      <div className="flex items-start gap-3 mb-3">
        {/* Step Number Badge */}
        <span
          className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold shrink-0 ${
            isFinalized
              ? 'bg-emerald-500 text-white'
              : 'bg-[#5C1A1B] text-white'
          }`}
        >
          {isFinalized ? <CheckCircle2 className="h-4 w-4" /> : stepNumber}
        </span>
        
        {/* Step Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm sm:text-base">{step.step_name}</h4>
            {/* Status Badge - Compact on mobile */}
            <Badge 
              variant="outline" 
              className={`text-xs shrink-0 ${
                isFinalized 
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-800'
              }`}
            >
              {isFinalized ? (
                <span className="flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  <span className="hidden sm:inline">{t('projects.steps.finalized')}</span>
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span className="hidden sm:inline">{t('projects.steps.pending')}</span>
                </span>
              )}
            </Badge>
          </div>
          
          {step.step_description && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">{step.step_description}</p>
          )}
        </div>
      </div>

      {/* Step Timeline - Compact for mobile */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-3 ps-11">
        {(step.duration_from || step.duration_to) && (
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {formatDate(step.duration_from, language)}
              {step.duration_to && ` → ${formatDate(step.duration_to, language)}`}
            </span>
          </div>
        )}
        {isFinalized && step.finalized_at && (
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>{formatDateTime(step.finalized_at, language)}</span>
          </div>
        )}
      </div>

      {/* Actions Button - Only for non-finalized steps */}
      {!isFinalized && (
        <div className="ps-11">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenActions}
            className="gap-2 h-9 text-xs border-primary/50 hover:border-primary hover:bg-primary/5"
          >
            <StickyNote className="h-3.5 w-3.5" />
            {t('projects.steps.actions' as any)}
          </Button>
        </div>
      )}

      {/* Finalized Notes - Compact display */}
      {hasNotes && (
        <div className="ps-11 mt-3">
          <div className="flex items-center gap-1.5 mb-2">
            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium">{t('projects.view.finalizedNotes')}</span>
          </div>
          <div className="space-y-2">
            {step.finalized_notes.map((note: FinalizedNote, noteIndex: number) => (
              <div
                key={noteIndex}
                className="rounded-lg bg-muted/50 p-2.5 text-xs"
              >
                <p className="mb-1.5">{note.note}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
                  <span>{note.created_by}</span>
                  <span>{formatDateTime(note.timestamp, language)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
