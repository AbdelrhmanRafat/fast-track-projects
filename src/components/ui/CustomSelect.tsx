"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDownIcon, CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface CustomSelectProps {
  options: SelectOption[];
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "default";
  onValueChange?: (value: string) => void;
  name?: string;
  id?: string;
}

export function CustomSelect({
  options,
  value,
  placeholder = "Select an option",
  disabled = false,
  className,
  size = "default",
  onValueChange,
  name,
  id,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || "");
  const selectRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update selected value when prop changes
  useEffect(() => {
    setSelectedValue(value || "");
  }, [value]);

  const handleSelect = (optionValue: string) => {
    setSelectedValue(optionValue);
    setIsOpen(false);
    onValueChange?.(optionValue);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case "Enter":
      case " ":
        event.preventDefault();
        setIsOpen(!isOpen);
        break;
      case "Escape":
        setIsOpen(false);
        break;
      case "ArrowDown":
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          // Focus next option
          const currentIndex = options.findIndex(opt => opt.value === selectedValue);
          const nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
          const nextOption = options[nextIndex];
          if (nextOption && !nextOption.disabled) {
            handleSelect(nextOption.value);
          }
        }
        break;
      case "ArrowUp":
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          // Focus previous option
          const currentIndex = options.findIndex(opt => opt.value === selectedValue);
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
          const prevOption = options[prevIndex];
          if (prevOption && !prevOption.disabled) {
            handleSelect(prevOption.value);
          }
        }
        break;
    }
  };

  const selectedOption = options.find(option => option.value === selectedValue);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  return (
    <div className="relative w-full" ref={selectRef}>
      {/* Hidden input for form submission */}
      <input
        type="hidden"
        name={name}
        value={selectedValue}
      />
      
      {/* Select Trigger */}
      <button
        type="button"
        id={id}
        className={cn(
          // Base styles matching Input/Textarea components exactly
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          // Custom select specific styles
          "items-center justify-between gap-2 whitespace-nowrap",
          // Size variants
          size === "sm" ? "h-8" : "h-9",
          // RTL support
          "rtl:text-right ltr:text-left",
          className
        )}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={id}
      >
        <span className={cn(
          "block truncate",
          !selectedOption && "text-muted-foreground"
        )}>
          {displayText}
        </span>
        <ChevronDownIcon 
          className={cn(
            "size-4 opacity-50 shrink-0 transition-transform duration-200",
            isOpen && "rotate-180"
          )} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full z-50 mt-1 w-full">
          <ul
            ref={listRef}
            className={cn(
              "bg-popover text-popover-foreground relative z-50 max-h-60 min-w-[8rem] overflow-x-hidden overflow-y-auto rounded-md border shadow-xs p-1",
              "animate-in fade-in-0 zoom-in-95"
            )}
            role="listbox"
          >
            {options.map((option) => (
              <li
                key={option.value}
                className={cn(
                  "focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                  "hover:bg-accent hover:text-accent-foreground",
                  option.disabled && "cursor-not-allowed opacity-50",
                  selectedValue === option.value && "bg-accent text-accent-foreground",
                  // RTL support
                  "rtl:pr-2 rtl:pl-8 rtl:text-right ltr:text-left"
                )}
                onClick={() => !option.disabled && handleSelect(option.value)}
                role="option"
                aria-selected={selectedValue === option.value}
              >
                <span className="block truncate">{option.label}</span>
                {selectedValue === option.value && (
                  <span className="absolute right-2 flex size-3.5 items-center justify-center rtl:right-auto rtl:left-2">
                    <CheckIcon className="size-4" />
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Export default for easier imports
export default CustomSelect;