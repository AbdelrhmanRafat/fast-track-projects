'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/components/providers/LanguageProvider';

// Zod validation schema
const signInSchema = z.object({
  email: z
    .string()
    .min(1, 'validation.required')
    .email('validation.email'),
  password: z
    .string()
    .min(1, 'validation.required')
    .min(6, 'validation.minLength'),
});

type SignInFormData = z.infer<typeof signInSchema>;

interface SignInFormProps {
  onSubmit: (data: SignInFormData) => Promise<void>;
  isLoading?: boolean;
}

export default function SignInForm({ onSubmit, isLoading = false }: SignInFormProps) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onFormSubmit = async (data: SignInFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      // Error handling - logged silently
    }
  };

  const isFormLoading = isLoading || isSubmitting;

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-foreground font-medium">{t('signin.email')}</Label>
        <div className="relative">
          <div className="absolute inset-y-0 end-0 flex items-center pe-3 pointer-events-none">
            <Mail className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            id="email"
            type="email"
            placeholder={t('signin.emailPlaceholder')}
            className="ps-10 h-12 bg-background/50 border-border/50 focus:border-primary focus:ring-primary"
            dir="ltr"
            disabled={isFormLoading}
            {...register('email')}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-destructive">
            {errors.email.message === 'validation.required' ? t('validation.required') : 
             errors.email.message === 'validation.email' ? t('validation.email') :
             t('validation.minLength')}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-foreground font-medium">{t('signin.password')}</Label>
        <div className="relative">
          <div className="absolute inset-y-0 end-0 flex items-center pe-3 pointer-events-none">
            <Lock className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder={t('signin.passwordPlaceholder')}
            className="pe-10 ps-10 h-12 bg-background/50 border-border/50 focus:border-primary focus:ring-primary"
            dir="ltr"
            disabled={isFormLoading}
            {...register('password')}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute inset-y-0 start-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isFormLoading}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
        {errors.password && (
          <p className="text-sm text-destructive">
            {errors.password.message === 'validation.required' ? t('validation.required') : 
             t('validation.minLength')}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button 
        type="submit" 
        className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200" 
        size="lg"
        disabled={isFormLoading}
      >
        {isFormLoading ? t('common.loading') : t('signin.button')}
      </Button>
    </form>
  );
}