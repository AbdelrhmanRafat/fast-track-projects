'use client';

import Link from 'next/link';
import { useTranslation } from '@/components/providers/LanguageProvider';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader className="space-y-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <FileQuestion className="h-10 w-10 text-muted-foreground" />
          </div>
          <CardTitle className="text-6xl font-bold text-primary">
            404
          </CardTitle>
          <CardDescription className="text-lg">
            {t('errors.notFound' as any) || 'Page Not Found'}
          </CardDescription>
          <p className="text-sm text-muted-foreground">
            {t('errors.notFoundDescription' as any) || "The page you're looking for doesn't exist or has been moved."}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="outline" onClick={() => history.back()}>
              <span className="flex items-center gap-2 cursor-pointer">
                <ArrowLeft className="h-4 w-4" />
                {t('common.goBack' as any) || 'Go Back'}
              </span>
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
