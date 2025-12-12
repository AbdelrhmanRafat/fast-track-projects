'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/components/providers/LanguageProvider';
import { RouteBasedPageHeader } from '@/components/SharedCustomComponents/RouteBasedPageHeader';
import { Card, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
    <div className="space-y-6">
      <RouteBasedPageHeader />

      {/* Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('common.back')}
        </Button>
      </div>

      {/* Project Header Card */}
      <Card className="overflow-hidden p-0 gap-0">
        {/* Brand Header */}
        <div className="bg-[#5C1A1B] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/15">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-white">{project.project_name}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={`border-white/30 ${PROJECT_TYPE_BADGE_CLASSES[project.project_type as ProjectType] || ''}`}
            >
              {t(`projects.types.${project.project_type}` as any)}
            </Badge>
            <Badge
              variant="outline"
              className={`border-white/30 ${PROJECT_STATUS_BADGE_CLASSES[project.status as ProjectStatus] || ''}`}
            >
              {t(`projects.status.${project.status}` as any)}
            </Badge>
          </div>
        </div>
        <CardContent className="p-5 space-y-5">
          {/* Project Description */}
          {project.project_description && (
            <CardDescription className="text-base">
              {project.project_description}
            </CardDescription>
          )}
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{t('projects.view.overallProgress')}</span>
              <span className="text-muted-foreground">
                {finalizedSteps} / {totalSteps} {t('projects.view.stepsCompleted')}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Progress value={progressPercentage} className="h-3 flex-1" />
              <span className="text-sm font-medium w-12 text-end">{progressPercentage}%</span>
            </div>
          </div>

          <Separator />

          {/* Project Info Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Company Name */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Building2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t('projects.fields.companyName')}</p>
                <p className="font-medium">{project.company_name || '-'}</p>
              </div>
            </div>

            {/* Creator */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t('projects.fields.creator')}</p>
                <p className="font-medium">{project.creator?.name || '-'}</p>
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t('projects.view.duration')}</p>
                <p className="font-medium text-sm">
                  {formatDate(project.duration_from, language)}
                  <span className="text-muted-foreground mx-1">→</span>
                  {formatDate(project.duration_to, language)}
                </p>
              </div>
            </div>

            {/* Days Remaining/Overdue */}
            {daysInfo && (
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${daysInfo.isOverdue ? 'bg-destructive/10' : 'bg-muted'}`}>
                  <Clock className={`h-5 w-5 ${daysInfo.isOverdue ? 'text-destructive' : 'text-muted-foreground'}`} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{t('projects.view.timeStatus')}</p>
                  <p className={`font-medium ${daysInfo.isOverdue ? 'text-destructive' : ''}`}>
                    {daysInfo.text}
                  </p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Created/Updated Info */}
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <span>
              {t('projects.fields.createdAt')}: {formatDateTime(project.created_at, language)}
            </span>
            <span>
              {t('projects.fields.updatedAt')}: {formatDateTime(project.updated_at, language)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Project Steps Section */}
      <Card className="overflow-hidden p-0 gap-0">
        {/* Brand Header */}
        <div className="bg-[#5C1A1B] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/15">
              <ListChecks className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="font-semibold text-white">{t('projects.steps.title')}</span>
              <p className="text-white/70 text-sm">
                {totalSteps} {t('projects.view.totalSteps')} • {finalizedSteps} {t('projects.view.finalized')}
              </p>
            </div>
          </div>
        </div>
        <CardContent className="p-5">
          {sortedSteps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium text-muted-foreground">{t('projects.steps.noSteps')}</p>
              <p className="text-sm text-muted-foreground">{t('projects.steps.addFirstStep')}</p>
            </div>
          ) : (
            <div className="space-y-4">
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
        </CardContent>
      </Card>

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
 * Step Card Component - Read-only display with actions button
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
      className={`relative bg-muted/40 dark:bg-muted/20 rounded-lg p-4 transition-colors ${
        isFinalized ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800' : ''
      }`}
    >
      {/* Step Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-start gap-3">
          {/* Step Number Badge - Brand styled */}
          <span
            className={`w-7 h-7 flex items-center justify-center rounded-md text-sm font-bold ${
              isFinalized
                ? 'bg-emerald-500 text-white'
                : 'bg-[#5C1A1B] text-white'
            }`}
          >
            {isFinalized ? <CheckCircle2 className="h-4 w-4" /> : stepNumber}
          </span>
          <div>
            <h4 className="font-medium">{step.step_name}</h4>
            {step.step_description && (
              <p className="text-sm text-muted-foreground mt-1">{step.step_description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Actions Button - Only for non-finalized steps */}
          {!isFinalized && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenActions}
              className="gap-2 border-primary/50 hover:border-primary hover:bg-primary/5"
            >
              <StickyNote className="h-4 w-4" />
              {t('projects.steps.actions' as any)}
            </Button>
          )}
          {/* Status Badge - Following brand design system */}
          <Badge 
            variant="outline" 
            className={
              isFinalized 
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-800'
            }
          >
            {isFinalized ? (
              <span className="flex items-center gap-1">
                <Lock className="h-3 w-3" />
                {t('projects.steps.finalized')}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {t('projects.steps.pending')}
              </span>
            )}
          </Badge>
        </div>
      </div>

      {/* Step Timeline */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground mb-3 ps-10">
        {(step.duration_from || step.duration_to) && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              {formatDate(step.duration_from, language)}
              {step.duration_to && (
                <>
                  <span className="mx-1">→</span>
                  {formatDate(step.duration_to, language)}
                </>
              )}
            </span>
          </div>
        )}
        {isFinalized && step.finalized_at && (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>
              {t('projects.steps.finalizedAt')}: {formatDateTime(step.finalized_at, language)}
            </span>
          </div>
        )}
      </div>

      {/* Finalized Notes */}
      {hasNotes && (
        <div className="ps-10 mt-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{t('projects.view.finalizedNotes')}</span>
          </div>
          <div className="space-y-2">
            {step.finalized_notes.map((note: FinalizedNote, noteIndex: number) => (
              <div
                key={noteIndex}
                className="rounded-md bg-muted/50 p-3 text-sm"
              >
                <p className="mb-2">{note.note}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
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
