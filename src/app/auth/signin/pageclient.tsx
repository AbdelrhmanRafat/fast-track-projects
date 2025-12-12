'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SignInForm from '@/components/forms/SignInForm';
import { useTranslation } from '@/components/providers/LanguageProvider';
import { signIn } from '@/lib/services/auth/services';

export default function SignInPageClient() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSignIn = async (data: { email: string; password: string }) => {
    setIsLoading(true);
    
    try {
      const result = await signIn({
        account_name: data.email,
        password: data.password
      });
      if (result?.data) {
        // Use hard navigation to ensure cookie is sent with the request
        // router.push doesn't wait for cookies to be set before navigating
        window.location.href = '/home';
        return;
      } 
    } catch (error: any) {
      // Error handling - logged silently
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: 'url(/sign-in-background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      
      <div className="w-full max-w-md relative z-10">
        <Card className="shadow-2xl border-0 bg-card/95 backdrop-blur-md">
          <CardHeader className="space-y-1 text-center pb-6">
            {/* Logo */}
            <div className="mx-auto mb-4">
              <Image
                src="/app-logo.svg"
                alt="Fast Track Projects"
                width={80}
                height={80}
                className="h-20 w-20"
                priority
              />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              {t('auth.welcomeBack')}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {t('auth.signInDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-6 pb-8">
            <SignInForm onSubmit={handleSignIn} isLoading={isLoading} />
          </CardContent>
        </Card>
        
        {/* Footer branding */}
        <p className="text-center text-white/70 text-sm mt-6">
          © {new Date().getFullYear()} Fast Track Projects
        </p>
      </div>
    </div>
  );
}