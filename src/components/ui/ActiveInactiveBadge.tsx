"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/components/providers/LanguageProvider"
import { cn } from "@/lib/utils"

interface ActiveInactiveBadgeProps {
  value: number | string | boolean | null | undefined
  className?: string
  /** If true (default) show the colored dot to the left of the label */
  showDot?: boolean
  /** Optional custom labels to override translations */
  activeLabel?: string
  inactiveLabel?: string
  /** Optional aria-label override */
  ariaLabel?: string
}

export default function ActiveInactiveBadge({
  value,
  className,
  showDot = true,
  activeLabel,
  inactiveLabel,
  ariaLabel,
}: ActiveInactiveBadgeProps) {
  const { t } = useTranslation()

  const isActive = Number(value) === 1 || value === true

  const baseClasses = "flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-md"

  const stateClasses = isActive
    ? "border-emerald-600 text-emerald-700 dark:border-emerald-500 dark:text-emerald-400"
    : "border-red-600 text-red-700 dark:border-red-500 dark:text-red-400"

  const dotClasses = isActive
    ? "w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400"
    : "w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-400"

  const label = isActive
    ? activeLabel ?? t("common.active")
    : inactiveLabel ?? t("common.inactive")

  const computedAria = ariaLabel ?? label

  return (
    <Badge variant="outline" className={cn(baseClasses, stateClasses, className)} aria-label={computedAria}>
      {showDot && <span className={dotClasses} />}
      {label}
    </Badge>
  )
}

export { ActiveInactiveBadge }
