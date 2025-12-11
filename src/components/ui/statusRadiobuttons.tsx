"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

/* From Uiverse.io by Pankaj-Meharchandani */

export interface RadioOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  borderColor?: string;
  textColor?: string;
  checkedBorderColor?: string;
  checkedTextColor?: string;
  checkedBgColor?: string;
}

interface StatusRadioButtonsProps {
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  orientation?: "horizontal" | "vertical";
  tileWidth?: string;
}

export const StatusRadioButtons: React.FC<StatusRadioButtonsProps> = ({
  name,
  options,
  value,
  onChange,
  disabled = false,
      className,
      orientation = "horizontal",
      tileWidth = "200px",
    }) => {
  return (
    <div
      className={cn(
        "flex",
        orientation === "horizontal" 
          ? "flex-col sm:flex-row" 
          : "flex-col",
        "justify-center items-center",
        "max-w-full",
        "-webkit-user-select-none",
        "-moz-user-select-none",
        "-ms-user-select-none",
        "user-select-none",
        "gap-3",
        className
      )}
    >
      {options.map((option) => {
        const isChecked = value === option.value;
        const borderColor = isChecked 
          ? (option.checkedBorderColor || "hsl(var(--primary))")
          : (option.borderColor || "hsl(var(--border))");
        const textColor = isChecked
          ? (option.checkedTextColor || "hsl(var(--primary))")
          : (option.textColor || "hsl(var(--muted-foreground))");
        const bgColor = isChecked
          ? (option.checkedBgColor || "hsl(var(--primary) / 0.1)")
          : "transparent";
        
        return (
          <label key={option.value} className="cursor-pointer" aria-label={option.label}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={isChecked}
              onChange={(e) => !disabled && onChange(e.target.value)}
              disabled={disabled}
              className="radio-input"
              aria-label={option.label}
            />
            <span
              className={cn(
                "radio-tile",
                isChecked && "radio-tile-checked",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              style={{ 
                width: tileWidth,
                borderColor: borderColor,
                backgroundColor: bgColor,
                borderWidth: isChecked ? '3px' : '2px',
                '--text-color': textColor,
              } as React.CSSProperties & { '--text-color': string }}
            >
              <span className="radio-icon" style={{ color: textColor }}>
                {option.icon || (
                  <CheckCircle2 className="w-6 h-6" style={{ color: textColor }} />
                )}
              </span>
              <span className="radio-label" style={{ color: textColor }}>
                {option.label}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
};

