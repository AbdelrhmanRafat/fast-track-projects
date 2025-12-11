"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface ImageUploadProps {
  id?: string;
  initialPreview?: string | null;
  accept?: string;
  onChange?: (file: File | null, preview?: string | null) => void;
  maxSize?: number; // in MB
  className?: string;
}

export default function ImageUpload({
  id = 'image',
  initialPreview = null,
  accept = 'image/*',
  onChange,
  maxSize = 5, // 5MB default
  className
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(initialPreview);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropZoneRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setPreview(initialPreview);
  }, [initialPreview]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const validateFile = (file: File): boolean => {
    setError(null);
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('يرجى اختيار ملف صورة صالح');
      return false;
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      setError(`حجم الصورة يجب أن يكون أقل من ${maxSize} ميجابايت`);
      return false;
    }

    return true;
  };

  const processFile = useCallback((file: File | null) => {
    if (!file) {
      setPreview(null);
      setSelectedFile(null);
      onChange?.(null, null);
      return;
    }

    if (!validateFile(file)) {
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string | null;
      setPreview(result);
      onChange?.(file, result);
    };
    reader.readAsDataURL(file);
  }, [maxSize, onChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    processFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0] ?? null;
    processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeImage = () => {
    setPreview(null);
    setSelectedFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
    onChange?.(null, null);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className={cn("space-y-3", className)}>
      {preview ? (
        <div className="relative group">
          <div className="relative w-full min-h-[120px] max-h-[200px] border-2 border-border rounded-lg overflow-hidden bg-muted/30 flex items-center justify-center">
            <img
              src={preview}
              alt="Preview"
              className="max-w-full max-h-[200px] object-contain rounded-lg"
            />
            
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleClick}
                className="gap-1.5 h-8 text-xs"
              >
                <Upload className="h-3 w-3" />
                تغيير
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={removeImage}
                className="gap-1.5 h-8 text-xs"
              >
                <X className="h-3 w-3" />
                إزالة
              </Button>
            </div>
          </div>

          {/* File info */}
          {selectedFile && (
            <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground bg-muted/50 rounded-md p-1.5">
              <div className="flex items-center gap-1.5">
                <FileImage className="h-3 w-3" />
                <span className="truncate max-w-[180px]">{selectedFile.name}</span>
              </div>
              <span>{formatFileSize(selectedFile.size)}</span>
            </div>
          )}
        </div>
      ) : (
        <div
          ref={dropZoneRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
          className={cn(
            "relative border-2 border-dashed rounded-lg p-4 text-center transition-all duration-200 cursor-pointer",
            isDragging
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-border bg-card hover:border-primary/50 hover:bg-muted/30",
            error && "border-destructive"
          )}
        >
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />
          
          <div className="flex flex-col items-center gap-2">
            <div className={cn(
              "rounded-full p-2.5 transition-colors",
              isDragging ? "bg-primary/10" : "bg-muted"
            )}>
              {isDragging ? (
                <Upload className="h-5 w-5 text-primary animate-bounce" />
              ) : (
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            
            <div className="space-y-0.5">
              <p className="text-xs font-medium">
                {isDragging 
                  ? 'أفلت الصورة هنا'
                  : 'انقر للرفع أو اسحب وأفلت'
                }
              </p>
              <p className="text-[10px] text-muted-foreground">
                PNG, JPG, GIF حتى {maxSize}MB
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-1 h-7 text-xs px-3"
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
            >
              <Upload className="h-3 w-3 mr-1.5" />
              اختر صورة
            </Button>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
          {error}
        </div>
      )}
    </div>
  );
}
