'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/components/providers/LanguageProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FileQuestion, Home, ArrowLeft } from 'lucide-react'

interface NotFoundProps {
  /** Custom title - defaults to translated "Not Found" */
  title?: string
  /** Custom description - defaults to translated description */
  description?: string
  /** Show back button - defaults to true */
  showBackButton?: boolean
  /** Show home button - defaults to true */
  showHomeButton?: boolean
  /** Custom back URL - defaults to router.back() */
  backUrl?: string
  /** Custom home URL - defaults to "/" */
  homeUrl?: string
  /** Custom icon - defaults to FileQuestion */
  icon?: React.ReactNode
}

export function NotFound({
  title,
  description,
  showBackButton = true,
  showHomeButton = true,
  backUrl,
  homeUrl = '/',
  icon,
}: NotFoundProps) {
  const { t } = useTranslation()
  const router = useRouter()

  const handleBack = () => {
    if (backUrl) {
      router.push(backUrl)
    } else {
      router.back()
    }
  }

  const handleHome = () => {
    router.push(homeUrl)
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="w-full max-w-md text-center border-none shadow-none bg-transparent">
        <CardContent className="pt-6 space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-muted p-6">
              {icon || <FileQuestion className="h-12 w-12 text-muted-foreground" />}
            </div>
          </div>

          {/* 404 Text */}
          <div className="space-y-2">
            <h1 className="text-6xl font-bold text-primary">404</h1>
            <h2 className="text-2xl font-semibold text-foreground">
              {title || t('notFound.title')}
            </h2>
            <p className="text-muted-foreground">
              {description || t('notFound.description')}
            </p>
          </div>

          {/* Action Buttons */}
          {(showBackButton || showHomeButton) && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {showBackButton && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t('notFound.backButton')}
                </Button>
              )}
              {showHomeButton && (
                <Button
                  onClick={handleHome}
                  className="gap-2"
                >
                  <Home className="h-4 w-4" />
                  {t('notFound.homeButton')}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default NotFound
