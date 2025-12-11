"use client";

import React, { useRef, useCallback } from 'react';
import { X, Paperclip, FileImage, FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/components/providers/LanguageProvider';

export interface ItemAttachmentsProps {
  /** Unique identifier for the input */
  id?: string;
  /** Current list of files */
  files: File[];
  /** Callback when files change */
  onChange: (files: File[]) => void;
  /** Maximum number of files allowed */
  maxFiles?: number;
  /** Accepted file types */
  accept?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Custom class name */
  className?: string;
  /** Show file previews for images */
  showPreviews?: boolean;
  /** Error state */
  hasError?: boolean;
}

/**
 * ItemAttachments - A component for uploading multiple images/PDFs per item
 * Supports drag & drop and file selection with preview
 */
export function ItemAttachments({
  id = 'item-attachments',
  files = [],
  onChange,
  maxFiles = 5,
  accept = 'image/*,.pdf',
  disabled = false,
  className,
  showPreviews = true,
  hasError = false,
}: ItemAttachmentsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const newFiles = Array.from(selectedFiles);
    const remainingSlots = maxFiles - files.length;
    const filesToAdd = newFiles.slice(0, remainingSlots);

    if (filesToAdd.length > 0) {
      onChange([...files, ...filesToAdd]);
    }

    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [files, maxFiles, onChange]);

  const handleRemove = useCallback((index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    onChange(updatedFiles);
  }, [files, onChange]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    const remainingSlots = maxFiles - files.length;
    const filesToAdd = droppedFiles.slice(0, remainingSlots);

    if (filesToAdd.length > 0) {
      onChange([...files, ...filesToAdd]);
    }
  }, [files, maxFiles, disabled, onChange]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const openFilePicker = () => {
    inputRef.current?.click();
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <FileImage className="h-5 w-5 text-blue-500" />;
    }
    if (file.type === 'application/pdf') {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    return <Paperclip className="h-5 w-5 text-muted-foreground" />;
  };

  const truncateFileName = (name: string, maxLength: number = 20) => {
    if (name.length <= maxLength) return name;
    const extension = name.split('.').pop() || '';
    const baseName = name.slice(0, name.lastIndexOf('.'));
    const truncatedBase = baseName.slice(0, maxLength - extension.length - 4);
    return `${truncatedBase}...${extension}`;
  };

  const getFilePreview = (file: File) => {
    if (showPreviews && file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  const canAddMore = files.length < maxFiles;
  const remainingCount = maxFiles - files.length;

  return (
    <div className={cn('space-y-3', className)}>
      {/* File List */}
      {files.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {files.map((file, index) => {
            const preview = getFilePreview(file);
            return (
              <div
                key={`${file.name}-${index}`}
                className={cn(
                  'relative flex items-center gap-2 p-2 rounded-lg border bg-card',
                  'transition-colors hover:bg-accent/50',
                  hasError && 'border-destructive'
                )}
              >
                {/* Preview or Icon */}
                <div className="shrink-0">
                  {preview ? (
                    <div className="relative w-10 h-10 rounded overflow-hidden bg-muted">
                      <img
                        src={preview}
                        alt={file.name}
                        className="w-full h-full object-cover"
                        onLoad={() => URL.revokeObjectURL(preview)}
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                      {getFileIcon(file)}
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" title={file.name}>
                    {truncateFileName(file.name)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>

                {/* Remove Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleRemove(index)}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Button / Drop Zone */}
      {canAddMore && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={cn(
            'flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed',
            'transition-colors cursor-pointer',
            disabled
              ? 'bg-muted cursor-not-allowed opacity-50'
              : 'hover:border-primary hover:bg-accent/30',
            hasError && 'border-destructive'
          )}
          onClick={disabled ? undefined : openFilePicker}
        >
          <Plus className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {t('orders.form.addAttachment')}
          </span>
          <span className="text-xs text-muted-foreground">
            ({remainingCount} {t('orders.form.remaining')})
          </span>
        </div>
      )}

      {/* Hidden Input */}
      <input
        ref={inputRef}
        id={id}
        type="file"
        multiple
        accept={accept}
        onChange={handleFileSelect}
        disabled={disabled}
        className="hidden"
      />

      {/* Max files reached message */}
      {!canAddMore && (
        <p className="text-xs text-muted-foreground text-center">
          {t('orders.form.maxReached')} ({maxFiles} {t('orders.form.attachmentsUnit')})
        </p>
      )}
    </div>
  );
}

export default ItemAttachments;
