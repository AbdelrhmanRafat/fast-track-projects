"use client"

import * as React from "react"
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useTranslation } from "@/components/providers/LanguageProvider"

interface DatePickerProps {
  value?: string
  onChange?: (date: string) => void
  placeholder?: string
  disabled?: boolean
  minDate?: string
  error?: boolean
  className?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  minDate,
  error = false,
  className,
}: DatePickerProps) {
  const { language, dir } = useTranslation()
  const [open, setOpen] = React.useState(false)
  const [currentMonth, setCurrentMonth] = React.useState(() => {
    if (value) {
      const date = new Date(value)
      return new Date(date.getFullYear(), date.getMonth(), 1)
    }
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  })

  const locale = language === 'ar' ? ar : enUS
  const isRTL = dir === 'rtl'

  const selectedDate = value ? new Date(value) : undefined
  const minDateObj = minDate ? new Date(minDate) : undefined

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  
  // Adjust for week starting on Sunday (0) or Saturday for Arabic
  const firstDayOfWeek = firstDayOfMonth.getDay()

  const weekDays = language === 'ar' 
    ? ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    )
  }

  const isDateDisabled = (date: Date) => {
    if (minDateObj) {
      const minDateNormalized = new Date(minDateObj)
      minDateNormalized.setHours(0, 0, 0, 0)
      const dateNormalized = new Date(date)
      dateNormalized.setHours(0, 0, 0, 0)
      return dateNormalized < minDateNormalized
    }
    return false
  }

  const handleDateClick = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    if (isDateDisabled(date)) return
    
    const formattedDate = format(date, 'yyyy-MM-dd')
    onChange?.(formattedDate)
    setOpen(false)
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const goToToday = () => {
    const todayDate = new Date()
    setCurrentMonth(new Date(todayDate.getFullYear(), todayDate.getMonth(), 1))
  }

  const renderDays = () => {
    const days: React.ReactNode[] = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 w-10" />)
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      const isDisabled = isDateDisabled(date)
      const isSelected = selectedDate && isSameDay(date, selectedDate)
      const isToday = isSameDay(date, today)

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateClick(day)}
          disabled={isDisabled}
          className={cn(
            "h-10 w-10 rounded-full text-sm font-medium transition-all duration-200",
            "hover:bg-primary/10 hover:text-primary",
            "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1",
            "active:scale-95",
            isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground shadow-md",
            isToday && !isSelected && "border-2 border-primary text-primary font-semibold",
            isDisabled && "opacity-30 cursor-not-allowed hover:bg-transparent hover:text-inherit"
          )}
        >
          {day}
        </button>
      )
    }

    return days
  }

  const displayValue = selectedDate
    ? format(selectedDate, 'PPP', { locale })
    : placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-start font-normal h-11",
            "bg-background hover:bg-accent/50",
            !value && "text-muted-foreground",
            error && "border-destructive focus:ring-destructive/50",
            className
          )}
        >
          <CalendarIcon className="h-4 w-4 me-2 opacity-50" />
          <span className="truncate">{displayValue}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={isRTL ? goToNextMonth : goToPreviousMonth}
              className="h-8 w-8 rounded-full hover:bg-primary/10"
            >
              {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            <div className="text-sm font-semibold">
              {format(currentMonth, 'MMMM yyyy', { locale })}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={isRTL ? goToPreviousMonth : goToNextMonth}
              className="h-8 w-8 rounded-full hover:bg-primary/10"
            >
              {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>

          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="h-10 w-10 flex items-center justify-center text-xs font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {renderDays()}
          </div>

          {/* Today Button */}
          <div className="mt-4 pt-3 border-t flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToToday}
              className="text-xs font-medium text-primary hover:text-primary hover:bg-primary/10"
            >
              {language === 'ar' ? 'اليوم' : 'Today'}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
