'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/components/providers/LanguageProvider';
import { RouteBasedPageHeader } from '@/components/SharedCustomComponents/RouteBasedPageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DatePicker } from '@/components/ui/date-picker';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  FileText, 
  ListOrdered,
  Building2,
  Briefcase,
  PenLine,
} from 'lucide-react';
import {
  createProjectSchema,
  CreateProjectFormData,
  ProjectStepFormData,
  defaultStep,
  defaultFormData,
  validationMessages,
} from './schemes';
import { createProject } from '@/lib/services/projects';
import { ProjectType } from '@/lib/services/projects/types';

/**
 * Validation translation keys mapping
 */
const validationTranslationKeys: Record<string, string> = {
  [validationMessages.projectNameRequired]: 'projects.validation.projectNameRequired',
  [validationMessages.companyNameRequired]: 'projects.validation.companyNameRequired',
  [validationMessages.projectTypeRequired]: 'projects.validation.projectTypeRequired',
  [validationMessages.descriptionRequired]: 'projects.validation.descriptionRequired',
  [validationMessages.durationFromRequired]: 'projects.validation.durationFromRequired',
  [validationMessages.durationToRequired]: 'projects.validation.durationToRequired',
  [validationMessages.durationToAfterFrom]: 'projects.validation.durationToAfterFrom',
  [validationMessages.stepNameRequired]: 'projects.validation.stepNameRequired',
  [validationMessages.atLeastOneStep]: 'projects.validation.atLeastOneStep',
  [validationMessages.stepDurationToAfterFrom]: 'projects.validation.stepDurationToAfterFrom',
};

export default function CreateProjectClient() {
  const { t } = useTranslation();
  const router = useRouter();
  
  const [formData, setFormData] = useState<CreateProjectFormData>(defaultFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handle input change for main project fields
   */
  const handleInputChange = (field: keyof Omit<CreateProjectFormData, 'steps'>, value: string | ProjectType) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  /**
   * Handle input change for step fields
   */
  const handleStepChange = (index: number, field: keyof ProjectStepFormData, value: string) => {
    setFormData(prev => {
      const newSteps = [...prev.steps];
      newSteps[index] = { ...newSteps[index], [field]: value };
      return { ...prev, steps: newSteps };
    });
    // Clear step-specific error
    const errorKey = `steps.${index}.${field}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  /**
   * Add a new step to the form
   */
  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, { ...defaultStep }],
    }));
  };

  /**
   * Remove a step from the form
   */
  const removeStep = (index: number) => {
    if (formData.steps.length <= 1) return; // Keep at least one step
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index),
    }));
    // Clear any errors related to this step
    setErrors(prev => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith(`steps.${index}.`)) {
          delete newErrors[key];
        }
      });
      return newErrors;
    });
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      // Validate form data
      const result = createProjectSchema.safeParse(formData);
      
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.issues.forEach((issue) => {
          const path = issue.path.join('.');
          const messageKey = issue.message;
          const translationKey = validationTranslationKeys[messageKey] || messageKey;
          fieldErrors[path] = t(translationKey as any);
        });
        setErrors(fieldErrors);
        setIsSubmitting(false);
        return;
      }

      // Prepare API payload
      const payload = {
        project_name: formData.project_name,
        project_type: formData.project_type as ProjectType,
        project_description: formData.project_description,
        company_name: formData.company_name,
        duration_from: formData.duration_from,
        duration_to: formData.duration_to,
        steps: formData.steps.map((step, index) => ({
          step_name: step.step_name,
          step_description: step.step_description || undefined,
          duration_from: step.duration_from || undefined,
          duration_to: step.duration_to || undefined,
          step_order: index + 1,
        })),
      };

      // Call API
      await createProject(payload);
      
      // Navigate to projects list on success
      router.push('/projects/all');
      router.refresh();
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle cancel action
   */
  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-6">
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
                value={formData.project_name}
                onChange={(e) => handleInputChange('project_name', e.target.value)}
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
                {t('projects.fields.companyName')} <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Building2 className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  placeholder={t('projects.fields.companyName')}
                  className={`h-11 ps-10 ${errors.company_name ? 'border-destructive focus:ring-destructive/50' : ''}`}
                />
              </div>
              {errors.company_name && (
                <p className="text-xs text-destructive mt-1">{errors.company_name}</p>
              )}
            </div>

            {/* Project Type - Modern Card Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t('projects.fields.projectType')} <span className="text-destructive">*</span>
              </Label>
              <RadioGroup
                value={formData.project_type}
                onValueChange={(value) => handleInputChange('project_type', value as ProjectType)}
                className="grid grid-cols-2 gap-3"
              >
                {/* Site Project Option */}
                <label
                  htmlFor="project_type_site"
                  className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    formData.project_type === ProjectType.SiteProject
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <RadioGroupItem 
                    value={ProjectType.SiteProject} 
                    id="project_type_site" 
                    className="sr-only"
                  />
                  <div className={`p-2.5 rounded-full mb-2 transition-colors ${
                    formData.project_type === ProjectType.SiteProject
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <span className={`text-sm font-medium text-center ${
                    formData.project_type === ProjectType.SiteProject
                      ? 'text-primary'
                      : 'text-foreground'
                  }`}>
                    {t('projects.types.siteProject')}
                  </span>
                  {formData.project_type === ProjectType.SiteProject && (
                    <div className="absolute top-2 end-2 w-2 h-2 rounded-full bg-primary" />
                  )}
                </label>

                {/* Design Project Option */}
                <label
                  htmlFor="project_type_design"
                  className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    formData.project_type === ProjectType.DesignProject
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <RadioGroupItem 
                    value={ProjectType.DesignProject} 
                    id="project_type_design" 
                    className="sr-only"
                  />
                  <div className={`p-2.5 rounded-full mb-2 transition-colors ${
                    formData.project_type === ProjectType.DesignProject
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    <PenLine className="h-5 w-5" />
                  </div>
                  <span className={`text-sm font-medium text-center ${
                    formData.project_type === ProjectType.DesignProject
                      ? 'text-primary'
                      : 'text-foreground'
                  }`}>
                    {t('projects.types.designProject')}
                  </span>
                  {formData.project_type === ProjectType.DesignProject && (
                    <div className="absolute top-2 end-2 w-2 h-2 rounded-full bg-primary" />
                  )}
                </label>
              </RadioGroup>
              {errors.project_type && (
                <p className="text-xs text-destructive mt-1">{errors.project_type}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="project_description" className="text-sm font-medium">
                {t('projects.fields.projectDescription')} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="project_description"
                value={formData.project_description}
                onChange={(e) => handleInputChange('project_description', e.target.value)}
                placeholder={t('projects.fields.projectDescription')}
                rows={3}
                className={`resize-none ${errors.project_description ? 'border-destructive focus:ring-destructive/50' : ''}`}
              />
              {errors.project_description && (
                <p className="text-xs text-destructive mt-1">{errors.project_description}</p>
              )}
            </div>

            {/* Duration - Stacked on Mobile */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                {t('projects.view.duration')} <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="duration_from" className="text-xs text-muted-foreground">
                    {t('projects.fields.durationFrom')}
                  </Label>
                  <DatePicker
                    value={formData.duration_from}
                    onChange={(date) => handleInputChange('duration_from', date)}
                    placeholder={t('projects.fields.durationFrom')}
                    error={!!errors.duration_from}
                  />
                  {errors.duration_from && (
                    <p className="text-xs text-destructive">{errors.duration_from}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="duration_to" className="text-xs text-muted-foreground">
                    {t('projects.fields.durationTo')}
                  </Label>
                  <DatePicker
                    value={formData.duration_to}
                    onChange={(date) => handleInputChange('duration_to', date)}
                    placeholder={t('projects.fields.durationTo')}
                    minDate={formData.duration_from}
                    error={!!errors.duration_to}
                  />
                  {errors.duration_to && (
                    <p className="text-xs text-destructive">{errors.duration_to}</p>
                  )}
                </div>
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
                  {formData.steps.length} {formData.steps.length === 1 ? 'step' : 'steps'}
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
            
            {formData.steps.map((step, index) => (
              <div 
                key={index} 
                className="relative bg-muted/40 dark:bg-muted/20 rounded-xl p-3 sm:p-4 space-y-3 sm:space-y-4 border border-border/50"
              >
                {/* Step Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* Drag Handle */}
                    <div className="text-muted-foreground/50 cursor-grab active:cursor-grabbing">
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
                  {formData.steps.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeStep(index)}
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
                    <Label htmlFor={`step_name_${index}`} className="text-sm font-medium">
                      {t('projects.steps.stepName')} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={`step_name_${index}`}
                      value={step.step_name}
                      onChange={(e) => handleStepChange(index, 'step_name', e.target.value)}
                      placeholder={t('projects.steps.stepName')}
                      className={`h-11 ${errors[`steps.${index}.step_name`] ? 'border-destructive focus:ring-destructive/50' : ''}`}
                    />
                    {errors[`steps.${index}.step_name`] && (
                      <p className="text-xs text-destructive">{errors[`steps.${index}.step_name`]}</p>
                    )}
                  </div>

                  {/* Step Description */}
                  <div className="space-y-1.5">
                    <Label htmlFor={`step_description_${index}`} className="text-sm font-medium">
                      {t('projects.steps.stepDescription')}
                      <span className="text-muted-foreground text-xs ms-1">({t('form.optional')})</span>
                    </Label>
                    <Textarea
                      id={`step_description_${index}`}
                      value={step.step_description}
                      onChange={(e) => handleStepChange(index, 'step_description', e.target.value)}
                      placeholder={t('projects.steps.stepDescription')}
                      rows={2}
                      className="resize-none"
                    />
                  </div>

                  {/* Step Duration */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor={`step_duration_from_${index}`} className="text-xs text-muted-foreground">
                        {t('projects.fields.durationFrom')}
                        <span className="ms-1">({t('form.optional')})</span>
                      </Label>
                      <DatePicker
                        value={step.duration_from}
                        onChange={(date) => handleStepChange(index, 'duration_from', date)}
                        placeholder={t('projects.fields.durationFrom')}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`step_duration_to_${index}`} className="text-xs text-muted-foreground">
                        {t('projects.fields.durationTo')}
                        <span className="ms-1">({t('form.optional')})</span>
                      </Label>
                      <DatePicker
                        value={step.duration_to}
                        onChange={(date) => handleStepChange(index, 'duration_to', date)}
                        placeholder={t('projects.fields.durationTo')}
                        minDate={step.duration_from}
                        error={!!errors[`steps.${index}.duration_to`]}
                      />
                      {errors[`steps.${index}.duration_to`] && (
                        <p className="text-xs text-destructive">{errors[`steps.${index}.duration_to`]}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Step Button */}
            {formData.steps.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={addStep}
                className="w-full gap-2 border-dashed border-2 h-12 hover:bg-muted/50"
              >
                <Plus className="h-4 w-4" />
                {t('projects.steps.addStep')}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Form Actions - Sticky on Mobile */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t sm:border-t-0 -mx-4 sm:mx-0 px-4 sm:px-0 py-4 sm:py-0 sm:static sm:bg-transparent sm:backdrop-blur-none">
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="h-11 sm:h-10"
            >
              {t('projects.form.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 sm:h-10"
            >
              {isSubmitting ? t('projects.form.saving') : t('projects.form.submit')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
