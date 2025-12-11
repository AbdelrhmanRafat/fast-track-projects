"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { Check, X } from "lucide-react";

interface CustomSwitchProps {
  isChecked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  // Optional custom titles to display inside the slider
  activeTitle?: React.ReactNode;
  inactiveTitle?: React.ReactNode;
}

export const CustomSwitch: React.FC<CustomSwitchProps> = ({
  isChecked,
  onChange,
  disabled = false,
  className,
  activeTitle,
  inactiveTitle,
}) => {
  const { t } = useTranslation();

  return (
    <div className={cn("flex justify-center items-center", className)}>
      <label className="relative inline-block w-36 h-10 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          disabled={disabled}
          className="opacity-0 w-0 h-0"
        />
        
        {/* Slider Background */}
        <span 
          className={cn(
            "absolute top-0 left-0 right-0 bottom-0 rounded-full transition-all duration-400 ease-in-out",
            isChecked 
              ? "bg-primary" 
              : "bg-muted dark:bg-muted/80",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          {/* Title inside slider */}
          <span
            className={cn(
              "absolute top-1/2 transform -translate-y-1/2 font-medium transition-all duration-400 select-none text-sm",
              isChecked
                ? "left-[35%] -translate-x-1/2 text-primary-foreground"
                : "left-1/2 -translate-x-1/2 text-primary"
            )}
          >
            {isChecked ? (activeTitle ?? t("common.active")) : (inactiveTitle ?? t("common.inactive"))}
          </span>
          
          {/* Ball/Thumb with Icon */}
          <span 
            className={cn(
              "absolute bg-background h-9 w-9 rounded-full transition-all duration-400 ease-in-out flex items-center justify-center shadow-lg",
              isChecked 
        ? "left-[calc(100%-36px)] transform rotate-360 outline-primary/20" 
                : "left-0.5 shadow-md"
            )}
          >
            {/* Icon inside ball */}
            <span className="text-foreground text-xs flex items-center justify-center">
              {isChecked ? (
                <Check className="h-4 w-4 text-primary" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground" />
              )}
            </span>
          </span>
        </span>
      </label>
    </div>
  );
};