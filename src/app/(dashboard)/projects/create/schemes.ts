import { z } from 'zod';
import { ProjectType } from '@/lib/services/projects/types';

/**
 * Validation message keys - mapped to translation keys in component
 */
export const validationMessages = {
  projectNameRequired: 'projectNameRequired',
  companyNameRequired: 'companyNameRequired',
  descriptionRequired: 'descriptionRequired',
  projectTypeRequired: 'projectTypeRequired',
  durationFromRequired: 'durationFromRequired',
  durationToRequired: 'durationToRequired',
  durationToAfterFrom: 'durationToAfterFrom',
  stepNameRequired: 'stepNameRequired',
  atLeastOneStep: 'atLeastOneStep',
  stepDurationToAfterFrom: 'stepDurationToAfterFrom',
};

/**
 * Project Step Schema
 * - Step Title: required
 * - Step Description: optional
 * - Step Duration (From - To): optional
 * - _id: internal unique identifier for drag and drop
 */
export const projectStepSchema = z.object({
  _id: z
    .string()
    .optional()
    .default(() => crypto.randomUUID()),
  step_name: z
    .string()
    .min(1, validationMessages.stepNameRequired),
  step_description: z
    .string()
    .optional()
    .default(''),
  duration_from: z
    .string()
    .optional()
    .default(''),
  duration_to: z
    .string()
    .optional()
    .default(''),
}).refine(
  (data) => {
    // If both dates are provided, validate that end date is after start date
    if (data.duration_from && data.duration_to) {
      return new Date(data.duration_to) >= new Date(data.duration_from);
    }
    return true;
  },
  {
    message: validationMessages.stepDurationToAfterFrom,
    path: ['duration_to'],
  }
);

/**
 * Create Project Schema
 * 
 * Project Main Information (All Mandatory):
 * - Project Name: required
 * - Company Name: required
 * - Description: required
 * - Duration (From - To): required
 * 
 * Project Steps:
 * - At least one step is required
 * - Each step has its own validation rules
 */
export const createProjectSchema = z.object({
  project_name: z
    .string()
    .min(1, validationMessages.projectNameRequired),
  company_name: z
    .string()
    .min(1, validationMessages.companyNameRequired),
  project_type: z
    .nativeEnum(ProjectType, {
      message: validationMessages.projectTypeRequired,
    }),
  project_description: z
    .string()
    .min(1, validationMessages.descriptionRequired),
  duration_from: z
    .string()
    .min(1, validationMessages.durationFromRequired),
  duration_to: z
    .string()
    .min(1, validationMessages.durationToRequired),
  steps: z
    .array(projectStepSchema)
    .min(1, validationMessages.atLeastOneStep),
}).refine(
  (data) => {
    // Validate that end date is after start date
    if (data.duration_from && data.duration_to) {
      return new Date(data.duration_to) >= new Date(data.duration_from);
    }
    return true;
  },
  {
    message: validationMessages.durationToAfterFrom,
    path: ['duration_to'],
  }
);

/**
 * Type inference for form data
 */
export type ProjectStepFormData = z.infer<typeof projectStepSchema>;
export type CreateProjectFormData = z.infer<typeof createProjectSchema>;

/**
 * Default empty step for adding new steps
 * Note: _id is generated at runtime for each new step
 */
export const createDefaultStep = (): ProjectStepFormData => ({
  _id: crypto.randomUUID(),
  step_name: '',
  step_description: '',
  duration_from: '',
  duration_to: '',
});

/**
 * @deprecated Use createDefaultStep() instead to ensure unique IDs
 */
export const defaultStep: ProjectStepFormData = {
  _id: '',
  step_name: '',
  step_description: '',
  duration_from: '',
  duration_to: '',
};

/**
 * Default form data for creating a new project
 * Note: steps are initialized with createDefaultStep() for unique IDs
 */
export const getDefaultFormData = (): CreateProjectFormData => ({
  project_name: '',
  company_name: '',
  project_type: ProjectType.SiteProject,
  project_description: '',
  duration_from: '',
  duration_to: '',
  steps: [createDefaultStep()],
});

/**
 * @deprecated Use getDefaultFormData() instead to ensure unique step IDs
 */
export const defaultFormData: CreateProjectFormData = {
  project_name: '',
  company_name: '',
  project_type: ProjectType.SiteProject,
  project_description: '',
  duration_from: '',
  duration_to: '',
  steps: [{ _id: '', step_name: '', step_description: '', duration_from: '', duration_to: '' }],
};
