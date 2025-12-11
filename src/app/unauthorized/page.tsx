'use client';

import Link from 'next/link';
import { useTranslation } from '@/components/providers/LanguageProvider';
import { ShieldX, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function UnauthorizedPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader className="space-y-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <ShieldX className="h-10 w-10 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {t('errors.unauthorized' as any) || 'Access Denied'}
          </CardTitle>
          <CardDescription className="text-base">
            {t('errors.unauthorizedDescription' as any) || "You don't have permission to access this page. Please contact your administrator if you believe this is an error."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="outline">
              <Link href="/home" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                {t('common.goBack' as any) || 'Go Back'}
              </Link>
            </Button>
            <Button asChild>
              <Link href="/home" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                {t('sidebar.home' as any) || 'Home'}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
