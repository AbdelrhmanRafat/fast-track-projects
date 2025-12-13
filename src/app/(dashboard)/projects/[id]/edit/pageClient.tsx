'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Reorder, useDragControls } from 'framer-motion';
import { useTranslation } from '@/components/providers/LanguageProvider';
import { RouteBasedPageHeader } from '@/components/SharedCustomComponents/RouteBasedPageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  FileText, 
  ListOrdered,
  Building2,
  Lock,
  CheckCircle2,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import type { Project, ProjectStep, ProjectType } from '@/lib/services/projects/types';
import { PROJECT_TYPE_BADGE_CLASSES } from '@/lib/services/projects/types';
import { updateProjectWithSteps } from '@/lib/services/projects';

interface EditProjectClientProps {
  project: Project;
  canEdit: boolean;
}

/**
 * Edit step form data with tracking
 */
interface EditStepFormData {
  _id: string; // Internal tracking ID
  id?: string; // Database ID (undefined for new steps)
  step_name: string;
  step_description: string;
  is_finalized: boolean;
  step_order: number;
}

/**
 * Convert ProjectStep to EditStepFormData
 */
function projectStepToFormData(step: ProjectStep): EditStepFormData {
  return {
    _id: step.id, // Use database ID as tracking ID for existing steps
    id: step.id,
    step_name: step.step_name,
    step_description: step.step_description || '',
    is_finalized: step.is_finalized,
    step_order: step.step_order,
  };
}

/**
 * Create a new empty step
 */
function createNewStep(order: number): EditStepFormData {
  return {
    _id: crypto.randomUUID(), // Generate unique tracking ID
    id: undefined, // No database ID for new steps
    step_name: '',
    step_description: '',
    is_finalized: false,
    step_order: order,
  };
}

/**
 * Editable Step Item Component
 */
interface EditableStepItemProps {
  step: EditStepFormData;
  index: number;
  errors: Record<string, string>;
  stepsLength: number;
  canDelete: boolean;
  onStepChange: (id: string, field: keyof EditStepFormData, value: string) => void;
  onRemoveStep: (id: string) => void;
  t: (key: any) => string;
}

function EditableStepItem({ 
  step, 
  index, 
  errors, 
  stepsLength, 
  canDelete,
  onStepChange, 
  onRemoveStep, 
  t 
}: EditableStepItemProps) {
  const dragControls = useDragControls();
  const isFinalized = step.is_finalized;

  // Finalized steps are locked - show read-only view
  if (isFinalized) {
    return (
      <div 
        className="relative bg-muted/20 rounded-xl p-3 sm:p-4 border border-border/50 opacity-75"
      >
        {/* Finalized Step Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-muted-foreground/30">
              <Lock className="h-5 w-5" />
            </div>
            <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-600 text-white text-xs font-bold shadow-sm">
              {index + 1}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              {t('projects.steps.stepNumber').replace('{number}', String(index + 1))}
            </span>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {t('projects.edit.finalizedLocked')}
            </Badge>
          </div>
        </div>

        {/* Locked Step Content */}
        <div className="space-y-2 ps-10">
          <p className="text-sm font-medium">{step.step_name}</p>
          {step.step_description && (
            <p className="text-sm text-muted-foreground">{step.step_description}</p>
          )}
        </div>
      </div>
    );
  }

  // Editable step
  return (
    <Reorder.Item
      value={step}
      dragListener={false}
      dragControls={dragControls}
      className="relative bg-muted/40 dark:bg-muted/20 rounded-xl p-3 sm:p-4 space-y-3 sm:space-y-4 border border-border/50"
      whileDrag={{ 
        scale: 1.02, 
        boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
        zIndex: 50,
      }}
      transition={{ duration: 0.2 }}
    >
      {/* Step Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Drag Handle */}
          <div 
            className="text-muted-foreground/50 cursor-grab active:cursor-grabbing touch-none select-none p-1 -m-1 hover:text-muted-foreground transition-colors"
            onPointerDown={(e) => dragControls.start(e)}
          >
            <GripVertical className="h-5 w-5" />
          </div>
          {/* Step Number Badge */}
          <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#5C1A1B] text-white text-xs font-bold shadow-sm">
            {index + 1}
          </span>
          <span className="text-sm font-medium text-muted-foreground">
            {t('projects.steps.stepNumber').replace('{number}', String(index + 1))}
          </span>
        </div>
        {canDelete && stepsLength > 1 && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemoveStep(step._id)}
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Step Fields */}
      <div className="space-y-3 sm:space-y-4">
        {/* Step Name */}
        <div className="space-y-1.5">
          <Label htmlFor={`step_name_${step._id}`} className="text-sm font-medium">
            {t('projects.steps.stepName')} <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`step_name_${step._id}`}
            value={step.step_name}
            onChange={(e) => onStepChange(step._id, 'step_name', e.target.value)}
            placeholder={t('projects.steps.stepName')}
            className={`h-11 ${errors[`steps.${step._id}.step_name`] ? 'border-destructive focus:ring-destructive/50' : ''}`}
          />
          {errors[`steps.${step._id}.step_name`] && (
            <p className="text-xs text-destructive">{errors[`steps.${step._id}.step_name`]}</p>
          )}
        </div>

        {/* Step Description */}
        <div className="space-y-1.5">
          <Label htmlFor={`step_description_${step._id}`} className="text-sm font-medium">
            {t('projects.steps.stepDescription')}
            <span className="text-muted-foreground text-xs ms-1">({t('form.optional')})</span>
          </Label>
          <Textarea
            id={`step_description_${step._id}`}
            value={step.step_description}
            onChange={(e) => onStepChange(step._id, 'step_description', e.target.value)}
            placeholder={t('projects.steps.stepDescription')}
            rows={2}
            className="resize-none"
          />
        </div>
      </div>
    </Reorder.Item>
  );
}

export default function EditProjectClient({ project, canEdit }: EditProjectClientProps) {
  const { t, language } = useTranslation();
  const router = useRouter();

  // Initialize form data from project
  const [projectName, setProjectName] = useState(project.project_name);
  const [companyName, setCompanyName] = useState(project.company_name || '');
  const [projectDescription, setProjectDescription] = useState(project.project_description || '');
  
  // Initialize steps from project, sorted by step_order
  const initialSteps = useMemo(() => {
    const sorted = [...(project.project_steps || [])].sort((a, b) => a.step_order - b.step_order);
    return sorted.map(projectStepToFormData);
  }, [project.project_steps]);
  
  const [steps, setSteps] = useState<EditStepFormData[]>(initialSteps);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get only editable (non-finalized) steps for reordering
  const editableSteps = useMemo(() => steps.filter(s => !s.is_finalized), [steps]);
  const finalizedSteps = useMemo(() => steps.filter(s => s.is_finalized), [steps]);

  /**
   * Handle step field change
   */
  const handleStepChange = useCallback((stepId: string, field: keyof EditStepFormData, value: string) => {
    setSteps(prev => prev.map(step => 
      step._id === stepId ? { ...step, [field]: value } : step
    ));
    // Clear error
    const errorKey = `steps.${stepId}.${field}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  }, [errors]);

  /**
   * Add a new step
   */
  const addStep = useCallback(() => {
    const newOrder = steps.length + 1;
    setSteps(prev => [...prev, createNewStep(newOrder)]);
  }, [steps.length]);

  /**
   * Remove a step (only non-finalized steps can be removed)
   */
  const removeStep = useCallback((stepId: string) => {
    setSteps(prev => {
      const step = prev.find(s => s._id === stepId);
      if (step?.is_finalized) return prev; // Cannot remove finalized steps
      return prev.filter(s => s._id !== stepId);
    });
    // Clear errors for this step
    setErrors(prev => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach(key => {
        if (key.includes(stepId)) {
          delete newErrors[key];
        }
      });
      return newErrors;
    });
  }, []);

  /**
   * Handle reordering of editable steps
   * Finalized steps maintain their positions
   */
  const handleReorder = useCallback((newEditableOrder: EditStepFormData[]) => {
    // Combine finalized steps (at their original positions) with reordered editable steps
    // For simplicity, put finalized steps first, then editable steps
    setSteps([...finalizedSteps, ...newEditableOrder]);
  }, [finalizedSteps]);

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate project name
    if (!projectName.trim()) {
      newErrors.project_name = t('projects.validation.projectNameRequired');
    }

    // Validate steps
    const editableStepsToValidate = steps.filter(s => !s.is_finalized);
    editableStepsToValidate.forEach(step => {
      if (!step.step_name.trim()) {
        newErrors[`steps.${step._id}.step_name`] = t('projects.validation.stepNameRequired');
      }
    });

    // Must have at least one step
    if (steps.length === 0) {
      newErrors.steps = t('projects.validation.atLeastOneStep');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error(t('form.validationError'));
      return;
    }

    setIsSubmitting(true);

    try {
      // Build the request payload
      // Only include non-finalized steps for editing
      // Finalized steps should be included with their ID to prevent deletion
      const stepsPayload = steps.map((step, index) => ({
        ...(step.id ? { id: step.id } : {}), // Include ID for existing steps
        step_name: step.step_name,
        step_description: step.step_description || undefined,
        step_order: index + 1, // Recalculate order based on current position
      }));

      const payload = {
        project_name: projectName,
        project_description: projectDescription || undefined,
        company_name: companyName || undefined,
        steps: stepsPayload,
      };

      await updateProjectWithSteps(project.id, payload);
      
      toast.success(t('projects.messages.updateSuccess'));
      router.push(`/projects/${project.id}`);
      router.refresh();
    } catch (error: any) {
      console.error('Failed to update project:', error);
      toast.error(error.message || t('projects.messages.updateError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle cancel/back
   */
  const handleBack = () => {
    router.back();
  };

  // Calculate if we can delete steps (must have at least one non-finalized step)
  const nonFinalizedCount = steps.filter(s => !s.is_finalized).length;
  const canDeleteSteps = nonFinalizedCount > 1;

  return (
    <div className="space-y-6">
      <RouteBasedPageHeader />


      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Project Main Information Card */}
        <Card className="overflow-hidden p-0 gap-0 shadow-sm">
          {/* Brand Header */}
          <div className="bg-[#5C1A1B] px-4 sm:px-5 py-3 sm:py-4 flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white/15">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-white text-sm sm:text-base">
              {t('projects.form.projectInfo')}
            </span>
          </div>
          <CardContent className="p-4 sm:p-5 space-y-4 sm:space-y-5">
            {/* Project Name */}
            <div className="space-y-1.5">
              <Label htmlFor="project_name" className="text-sm font-medium">
                {t('projects.fields.projectName')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="project_name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder={t('projects.fields.projectName')}
                className={`h-11 ${errors.project_name ? 'border-destructive focus:ring-destructive/50' : ''}`}
              />
              {errors.project_name && (
                <p className="text-xs text-destructive mt-1">{errors.project_name}</p>
              )}
            </div>

            {/* Company Name */}
            <div className="space-y-1.5">
              <Label htmlFor="company_name" className="text-sm font-medium">
                {t('projects.fields.companyName')}
              </Label>
              <div className="relative">
                <Building2 className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="company_name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder={t('projects.fields.companyName')}
                  className="h-11 ps-10"
                />
              </div>
            </div>

            {/* Project Type (Read-only) */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                {t('projects.fields.projectType')}
              </Label>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={PROJECT_TYPE_BADGE_CLASSES[project.project_type]}
                >
                  {t(`projects.types.${project.project_type}` as any)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  ({t('form.readOnly')})
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="project_description" className="text-sm font-medium">
                {t('projects.fields.projectDescription')}
              </Label>
              <Textarea
                id="project_description"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder={t('projects.fields.projectDescription')}
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Duration (Read-only) */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                {t('projects.view.duration')}
              </Label>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{new Date(project.duration_from).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</span>
                <span>→</span>
                <span>{project.duration_to ? new Date(project.duration_to).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US') : '-'}</span>
                <span className="text-xs">({t('form.readOnly')})</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Steps Card */}
        <Card className="overflow-hidden p-0 gap-0 shadow-sm">
          {/* Brand Header with Add Button */}
          <div className="bg-[#5C1A1B] px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white/15">
                <ListOrdered className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="font-semibold text-white text-sm sm:text-base block">
                  {t('projects.form.stepsSection')}
                </span>
                <span className="text-white/70 text-xs">
                  {steps.length} {steps.length === 1 ? 'step' : 'steps'} 
                  {finalizedSteps.length > 0 && ` (${finalizedSteps.length} finalized)`}
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addStep}
              className="bg-white/15 hover:bg-white/25 text-white border-0 gap-1.5 h-9 px-3"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{t('projects.form.addStepButton')}</span>
              <span className="sm:hidden">{t('form.add')}</span>
            </Button>
          </div>
          <CardContent className="p-4 sm:p-5 space-y-3 sm:space-y-4">
            {errors.steps && (
              <p className="text-xs text-destructive bg-destructive/10 p-2 rounded-md">{errors.steps}</p>
            )}

            {/* Edit Mode Notice */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm">
              <p className="text-amber-800 dark:text-amber-200">
                {t('projects.edit.editModeDescription')}
              </p>
            </div>

            {/* Finalized Steps (Locked - shown first) */}
            {finalizedSteps.length > 0 && (
              <div className="space-y-3">
                {finalizedSteps.map((step, idx) => {
                  const originalIndex = steps.findIndex(s => s._id === step._id);
                  return (
                    <EditableStepItem
                      key={step._id}
                      step={step}
                      index={originalIndex}
                      errors={errors}
                      stepsLength={steps.length}
                      canDelete={false}
                      onStepChange={handleStepChange}
                      onRemoveStep={removeStep}
                      t={t}
                    />
                  );
                })}
              </div>
            )}

            {/* Editable Steps (Drag and Drop) */}
            {editableSteps.length > 0 && (
              <Reorder.Group 
                axis="y" 
                values={editableSteps} 
                onReorder={handleReorder}
                className="space-y-3 sm:space-y-4"
              >
                {editableSteps.map((step) => {
                  const originalIndex = steps.findIndex(s => s._id === step._id);
                  return (
                    <EditableStepItem
                      key={step._id}
                      step={step}
                      index={originalIndex}
                      errors={errors}
                      stepsLength={steps.length}
                      canDelete={canDeleteSteps}
                      onStepChange={handleStepChange}
                      onRemoveStep={removeStep}
                      t={t}
                    />
                  );
                })}
              </Reorder.Group>
            )}

            {/* Add Step Button */}
            <Button
              type="button"
              variant="outline"
              onClick={addStep}
              className="w-full gap-2 border-dashed border-2 h-12 hover:bg-muted/50"
            >
              <Plus className="h-4 w-4" />
              {t('projects.steps.addStep')}
            </Button>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={isSubmitting}
            className="h-11 sm:h-10"
          >
            {t('form.cancel')}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 sm:h-10 sm:px-8 gap-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? t('projects.form.saving') : t('form.save')}
          </Button>
        </div>
      </form>
    </div>
  );
}
