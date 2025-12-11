"use client"

import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useTranslation } from "@/components/providers/LanguageProvider"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"

interface DeleteAlertDialogProps {
  title: string
  subtitle: string
  onDelete: () => void
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  loading?: boolean
}

export function DeleteAlertDialog({
  title,
  subtitle,
  onDelete,
  children,
  open,
  onOpenChange,
  loading = false,
}: DeleteAlertDialogProps) {
  const { t } = useTranslation()

  const handleDelete = () => {
    if (loading) return
    onDelete()
    // Don't close dialog if loading - let the parent handle it
    if (onOpenChange && !loading) {
      onOpenChange(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader className="space-y-2">
          <AlertDialogTitle className="text-center text-xl">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {subtitle}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col items-center justify-center gap-5 py-6">
          {/* Trash Icon with modern styling */}
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <Trash2 className="h-6 w-6 text-red-600 dark:text-red-500" />
          </div>
          
          <div className="flex w-full justify-center items-center gap-3">
          <AlertDialogFooter>
            <AlertDialogCancel className="m-0 min-w-[100px]" disabled={loading}>
              {t("form.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className={cn(
                buttonVariants({ variant: "destructive" }),
                "m-0 min-w-[100px]"
              )}
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.loading") || "Deleting..."}
                </>
              ) : (
                t("form.delete")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}