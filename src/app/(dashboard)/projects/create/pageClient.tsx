'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/components/providers/LanguageProvider';
import { RouteBasedPageHeader } from '@/components/SharedCustomComponents/RouteBasedPageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { z } from 'zod';
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
        project_type: ProjectType.SiteProject, // Default type
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
    <div className="space-y-6">
      <RouteBasedPageHeader />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Main Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">
              {t('projects.form.projectInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="project_name">
                {t('projects.fields.projectName')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="project_name"
                value={formData.project_name}
                onChange={(e) => handleInputChange('project_name', e.target.value)}
                placeholder={t('projects.fields.projectName')}
                className={errors.project_name ? 'border-destructive' : ''}
              />
              {errors.project_name && (
                <p className="text-sm text-destructive">{errors.project_name}</p>
              )}
            </div>

            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="company_name">
                {t('projects.fields.companyName')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                placeholder={t('projects.fields.companyName')}
                className={errors.company_name ? 'border-destructive' : ''}
              />
              {errors.company_name && (
                <p className="text-sm text-destructive">{errors.company_name}</p>
              )}
            </div>

            {/* Project Type */}
            <div className="space-y-2">
              <Label htmlFor="project_type">
                {t('projects.fields.projectType')} <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.project_type}
                onValueChange={(value) => handleInputChange('project_type', value as ProjectType)}
              >
                <SelectTrigger className={errors.project_type ? 'border-destructive' : ''}>
                  <SelectValue placeholder={t('projects.fields.projectType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ProjectType.SiteProject}>
                    {t('projects.types.siteProject')}
                  </SelectItem>
                  <SelectItem value={ProjectType.DesignProject}>
                    {t('projects.types.designProject')}
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.project_type && (
                <p className="text-sm text-destructive">{errors.project_type}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="project_description">
                {t('projects.fields.projectDescription')} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="project_description"
                value={formData.project_description}
                onChange={(e) => handleInputChange('project_description', e.target.value)}
                placeholder={t('projects.fields.projectDescription')}
                className={`min-h-[100px] ${errors.project_description ? 'border-destructive' : ''}`}
              />
              {errors.project_description && (
                <p className="text-sm text-destructive">{errors.project_description}</p>
              )}
            </div>

            {/* Duration (From - To) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration_from">
                  {t('projects.fields.durationFrom')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="duration_from"
                  type="date"
                  value={formData.duration_from}
                  onChange={(e) => handleInputChange('duration_from', e.target.value)}
                  className={errors.duration_from ? 'border-destructive' : ''}
                />
                {errors.duration_from && (
                  <p className="text-sm text-destructive">{errors.duration_from}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration_to">
                  {t('projects.fields.durationTo')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="duration_to"
                  type="date"
                  value={formData.duration_to}
                  onChange={(e) => handleInputChange('duration_to', e.target.value)}
                  min={formData.duration_from || undefined}
                  className={errors.duration_to ? 'border-destructive' : ''}
                />
                {errors.duration_to && (
                  <p className="text-sm text-destructive">{errors.duration_to}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Steps Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium">
                {t('projects.form.stepsSection')}
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addStep}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                {t('projects.form.addStepButton')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {errors.steps && (
              <p className="text-sm text-destructive">{errors.steps}</p>
            )}
            
            {formData.steps.map((step, index) => (
              <Card key={index} className="bg-muted/30">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    {/* Drag Handle (visual only for now) */}
                    <div className="pt-2 text-muted-foreground">
                      <GripVertical className="h-5 w-5" />
                    </div>

                    <div className="flex-1 space-y-4">
                      {/* Step Header with Number and Delete */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          {t('projects.steps.stepNumber').replace('{number}', String(index + 1))}
                        </span>
                        {formData.steps.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeStep(index)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {/* Step Title (Required) */}
                      <div className="space-y-2">
                        <Label htmlFor={`step_name_${index}`}>
                          {t('projects.steps.stepName')} <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`step_name_${index}`}
                          value={step.step_name}
                          onChange={(e) => handleStepChange(index, 'step_name', e.target.value)}
                          placeholder={t('projects.steps.stepName')}
                          className={errors[`steps.${index}.step_name`] ? 'border-destructive' : ''}
                        />
                        {errors[`steps.${index}.step_name`] && (
                          <p className="text-sm text-destructive">
                            {errors[`steps.${index}.step_name`]}
                          </p>
                        )}
                      </div>

                      {/* Step Description (Optional) */}
                      <div className="space-y-2">
                        <Label htmlFor={`step_description_${index}`}>
                          {t('projects.steps.stepDescription')}
                          <span className="text-muted-foreground text-xs"> ({t('form.optional')})</span>
                        </Label>
                        <Textarea
                          id={`step_description_${index}`}
                          value={step.step_description}
                          onChange={(e) => handleStepChange(index, 'step_description', e.target.value)}
                          placeholder={t('projects.steps.stepDescription')}
                          className="min-h-20"
                        />
                      </div>

                      {/* Step Duration (Optional) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`step_duration_from_${index}`}>
                            {t('projects.fields.durationFrom')}
                            <span className="text-muted-foreground text-xs"> ({t('form.optional')})</span>
                          </Label>
                          <Input
                            id={`step_duration_from_${index}`}
                            type="date"
                            value={step.duration_from}
                            onChange={(e) => handleStepChange(index, 'duration_from', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`step_duration_to_${index}`}>
                            {t('projects.fields.durationTo')}
                            <span className="text-muted-foreground text-xs"> ({t('form.optional')})</span>
                          </Label>
                          <Input
                            id={`step_duration_to_${index}`}
                            type="date"
                            value={step.duration_to}
                            onChange={(e) => handleStepChange(index, 'duration_to', e.target.value)}
                            min={step.duration_from || undefined}
                            className={errors[`steps.${index}.duration_to`] ? 'border-destructive' : ''}
                          />
                          {errors[`steps.${index}.duration_to`] && (
                            <p className="text-sm text-destructive">
                              {errors[`steps.${index}.duration_to`]}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add Step Button (Secondary) */}
            {formData.steps.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={addStep}
                className="w-full gap-2 border-dashed"
              >
                <Plus className="h-4 w-4" />
                {t('projects.steps.addStep')}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            {t('projects.form.cancel')}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? t('projects.form.saving') : t('projects.form.submit')}
          </Button>
        </div>
      </form>
    </div>
  );
}
