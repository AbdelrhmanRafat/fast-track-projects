"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Upload, FileIcon, FileText, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface FileUploadProps {
  id?: string;
  initialPreview?: string | null;
  accept?: string;
  onChange?: (file: File | null, preview?: string | null) => void;
}

export default function FileUpload({
  id = 'file',
  initialPreview = null,
  accept = '.jpeg,.jpg,.png,.pdf,.doc,.docx,.ppt,.pptx',
  onChange
}: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(initialPreview);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const labelText = "رفع";
  const hintText = "";

  useEffect(() => {
    setPreview(initialPreview);
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [initialPreview]);

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <FileImage className="w-12 h-12 text-blue-500" />;
    } else if (fileType.includes('pdf')) {
      return <FileText className="w-12 h-12 text-red-500" />;
    } else if (fileType.includes('document') || fileType.includes('word')) {
      return <FileText className="w-12 h-12 text-blue-600" />;
    } else if (fileType.includes('presentation') || fileType.includes('powerpoint')) {
      return <FileText className="w-12 h-12 text-orange-500" />;
    }
    return <FileIcon className="w-12 h-12 text-muted-foreground" />;
  };

  const truncateFileName = (fileName: string, maxLength: number = 14) => {
    // If filename is within the limit, return as is
    if (fileName.length <= maxLength) return fileName;
    
    // Filename exceeds limit, need to truncate
    const extension = fileName.split('.').pop() || '';
    const extLength = extension ? extension.length + 1 : 0; // +1 for the dot
    const availableLength = maxLength - extLength - 3; // -3 for "..."
    
    // If not enough space even for truncation, just cut at maxLength
    if (availableLength <= 0) return fileName.substring(0, maxLength);
    
    // Truncate the name part and keep the extension
    const namePart = fileName.substring(0, fileName.lastIndexOf('.'));
    return `${namePart.substring(0, availableLength)}...${extension ? '.' + extension : ''}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setPreview(null);
      setSelectedFile(null);
      onChange?.(null, null);
      return;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string | null;
        setPreview(result);
        onChange?.(file, result);
      };
      reader.readAsDataURL(file);
    } else {
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      setPreview(null);
      onChange?.(file, null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4 w-full">
      <Input 
        ref={inputRef} 
        id={id} 
        type="file" 
        accept={accept} 
        onChange={handleFileChange} 
        className="hidden" 
      />
      
      {selectedFile || preview ? (
        <div className="relative w-full border rounded-lg bg-card overflow-hidden">
          {preview && (preview.startsWith('data:') || /\.(jpeg|jpg|png|gif|webp)(\?|$)/i.test(preview)) ? (
            <div className="relative w-full h-48 flex items-center justify-center p-2">
              <img
                src={preview}
                alt="preview"
                className="max-w-full max-h-full object-contain rounded-lg cursor-pointer"
                onClick={() => {
                  if (preview) window.open(preview, '_blank');
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute top-2 left-2"
                onClick={() => {
                  if (inputRef.current) {
                    inputRef.current.value = '';
                    inputRef.current.click();
                  }
                }}
              >
                تغيير الصورة
              </Button>
            </div>
          ) : selectedFile ? (
            <div className="flex items-start gap-3 p-3 lg:p-4 w-full">
              <div className="shrink-0">{getFileIcon(selectedFile.type)}</div>
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-sm font-medium truncate" title={selectedFile.name}>
                  {truncateFileName(selectedFile.name)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs h-7 px-2 whitespace-nowrap" 
                  onClick={() => {
                    if (objectUrlRef.current) window.open(objectUrlRef.current, '_blank');
                  }}
                >
                  عرض التفاصيل
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs h-7 px-2 whitespace-nowrap" 
                  onClick={() => {
                    if (inputRef.current) {
                      inputRef.current.value = '';
                      inputRef.current.click();
                    }
                  }}
                >
                  اختر ملف
                </Button>
              </div>
            </div>
          ) : preview ? (
            <div className="flex items-start gap-3 p-3 lg:p-4 w-full">
              <div className="shrink-0">{getFileIcon('application/pdf')}</div>
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-sm font-medium truncate" title={preview ? preview.split('/').pop() || 'Selected file' : 'عرض التفاصيل'}>
                  {preview ? truncateFileName(preview.split('/').pop() || 'Selected file') : 'عرض التفاصيل'}
                </p>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                {preview && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs h-7 px-2 whitespace-nowrap" 
                    onClick={() => preview && window.open(preview, '_blank')}
                  >
                    عرض التفاصيل
                  </Button>
                )}
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs h-7 px-2 whitespace-nowrap" 
                  onClick={() => {
                    if (inputRef.current) {
                      inputRef.current.value = '';
                      inputRef.current.click();
                    }
                  }}
                >
                  اختر ملف
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center bg-card">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
          <div className="mt-4">
            <Label
              htmlFor={id}
              className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-primary-foreground bg-primary hover:bg-primary/90"
            >
              {labelText}
            </Label>
          </div>
          {hintText && <p className="mt-2 text-sm text-muted-foreground">{hintText}</p>}
        </div>
      )}
    </div>
  );
}