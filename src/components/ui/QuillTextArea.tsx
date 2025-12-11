"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type QuillTextAreaProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  isArabic?: boolean;
};

const QuillTextArea: React.FC<QuillTextAreaProps> = ({
  value = "",
  onChange,
  placeholder = "",
  className = "",
  id,
  isArabic = true,
}) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<any | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    let mounted = true;

    (async () => {
      const QuillModule = await import('quill');
      // @ts-ignore
      await import('quill/dist/quill.snow.css');
      if (!mounted) return;

      const QuillCtor = (QuillModule && (QuillModule.default || QuillModule)) as any;

      if (!quillRef.current && editorRef.current) {
        // Register font and size options
        const Font = QuillCtor.import('formats/font');
        Font.whitelist = ['serif', 'monospace', 'sans-serif'];
        QuillCtor.register(Font, true);

        const Size = QuillCtor.import('formats/size');
        Size.whitelist = ['small', false, 'large', 'huge'];
        QuillCtor.register(Size, true);

        quillRef.current = new QuillCtor(editorRef.current, {
          theme: 'snow',
          placeholder,
          modules: {
            toolbar: {
              container: [
                [{ 'font': ['serif', 'monospace', 'sans-serif'] }],
                [{ 'size': ['small', false, 'large', 'huge'] }],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'align': [] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['link'],
              ],
              handlers: {
                image: function() {
                  // Disable image upload
                  return false;
                }
              }
            },
          },
        });

        const editor = editorRef.current.querySelector('.ql-editor');
        if (editor) {
          (editor as HTMLElement).setAttribute('dir', isArabic ? 'rtl' : 'ltr');
        }

        try {
          quillRef.current.clipboard.dangerouslyPasteHTML(value || '');
        } catch (e) {
          // ignore
        }

        quillRef.current.on('text-change', () => {
          const html = editorRef.current?.querySelector('.ql-editor')?.innerHTML || '';
          onChange?.(html === '<p><br></p>' ? '' : html);
        });
      }
    })();

    return () => {
      mounted = false;
      if (quillRef.current) {
        quillRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const editor = editorRef.current?.querySelector(".ql-editor");
    if (!editor || !quillRef.current) return;
    const current = editor.innerHTML;
    if (value !== current) {
      quillRef.current.clipboard.dangerouslyPasteHTML(value || "");
    }
  }, [value]);

  useEffect(() => {
    const editor = editorRef.current?.querySelector(".ql-editor");
    if (editor) {
      (editor as HTMLElement).setAttribute('dir', isArabic ? 'rtl' : 'ltr');
    }
  }, [isArabic]);

  return (
    <div
      id={id}
      className={cn(
        "quill-shadcn flex flex-col rounded-md border border-input bg-transparent transition-all duration-200 overflow-hidden",
        "has-[.ql-editor:focus]:border-ring has-[.ql-editor:focus]:ring-ring/50 has-[.ql-editor:focus]:ring-[3px]",
        "dark:bg-input/30",
        className
      )}
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <div ref={editorRef} aria-multiline="true" />

      <style jsx global>{`
        /* Toolbar */
        .quill-shadcn .ql-toolbar.ql-snow {
          @apply bg-transparent border-0 border-b border-input px-3 py-2 flex items-center gap-1 flex-wrap;
          font-family: inherit;
        }

        /* RTL Support for Toolbar */
        [dir="rtl"] .quill-shadcn .ql-toolbar.ql-snow {
          direction: rtl;
        }

        /* Toolbar buttons */
        .quill-shadcn .ql-toolbar button {
          @apply w-8 h-8 p-0 rounded-lg transition-all duration-200 inline-flex items-center justify-center border-0 bg-transparent text-muted-foreground hover:bg-primary/10 hover:text-primary;
        }

        .quill-shadcn .ql-toolbar button.ql-active {
          @apply bg-primary/20 text-primary shadow-sm;
        }

        /* SVG colors */
        .quill-shadcn .ql-stroke {
          stroke: currentColor;
        }

        .quill-shadcn .ql-fill {
          fill: currentColor;
        }

        /* Pickers */
        .quill-shadcn .ql-picker {
          @apply rounded-lg transition-all duration-200 text-muted-foreground hover:bg-primary/10 hover:text-primary;
        }

        .quill-shadcn .ql-picker-label {
          @apply border-0 px-2.5 py-1.5;
        }

        .quill-shadcn .ql-picker.ql-expanded .ql-picker-label {
          @apply text-primary bg-primary/10;
        }

        /* RTL Support for Pickers */
        [dir="rtl"] .quill-shadcn .ql-picker-label {
          text-align: right;
        }

        [dir="rtl"] .quill-shadcn .ql-picker-label::before {
          text-align: right;
        }

        /* Color pickers - special styling */
        .quill-shadcn .ql-color-picker .ql-picker-label,
        .quill-shadcn .ql-background-picker .ql-picker-label {
          @apply w-8 h-8 p-1;
        }

        .quill-shadcn .ql-color-picker .ql-picker-label svg,
        .quill-shadcn .ql-background-picker .ql-picker-label svg {
          width: 100%;
          height: 100%;
        }

        .quill-shadcn .ql-picker-options {
          @apply bg-popover border-2 border-muted/60 rounded-lg shadow-lg p-2;
          left: 0;
        }

        /* RTL Support for Picker Options */
        [dir="rtl"] .quill-shadcn .ql-picker-options {
          left: auto !important;
          right: 0 !important;
          text-align: right;
        }

        [dir="rtl"] .quill-shadcn .ql-picker.ql-font .ql-picker-options,
        [dir="rtl"] .quill-shadcn .ql-picker.ql-size .ql-picker-options {
          left: auto !important;
          right: 0 !important;
        }

        .quill-shadcn .ql-picker-item {
          @apply text-popover-foreground px-3 py-2 rounded-md hover:bg-primary/10 hover:text-primary transition-colors;
        }

        /* RTL Support for Picker Items */
        [dir="rtl"] .quill-shadcn .ql-picker-item {
          text-align: right;
        }

        [dir="rtl"] .quill-shadcn .ql-picker-item::before {
          text-align: right;
        }

        /* Color picker options */
        .quill-shadcn .ql-color-picker .ql-picker-options,
        .quill-shadcn .ql-background-picker .ql-picker-options {
          @apply p-3 w-auto;
        }

        .quill-shadcn .ql-color-picker .ql-picker-item,
        .quill-shadcn .ql-background-picker .ql-picker-item {
          @apply w-7 h-7 rounded-md border-2 border-muted hover:ring-2 hover:ring-primary/50 hover:scale-110 transition-all;
          padding: 0;
          margin: 3px;
        }

        /* Align picker options */
        .quill-shadcn .ql-align .ql-picker-options {
          @apply p-2;
        }

        .quill-shadcn .ql-align .ql-picker-item {
          @apply w-9 h-9 p-1.5 flex items-center justify-center rounded-md hover:bg-primary/10 transition-colors;
        }

        /* Container */
        .quill-shadcn .ql-container.ql-snow {
          @apply bg-transparent border-0 text-sm;
        }

        /* Editor */
        .quill-shadcn .ql-editor {
          @apply px-3 py-1 bg-transparent text-base md:text-sm text-foreground leading-relaxed overflow-y-auto focus:outline-none;
          height: 200px;
          min-height: 200px;
        }

        /* RTL Support for Editor */
        [dir="rtl"] .quill-shadcn .ql-editor {
          text-align: right;
        }

        [dir="rtl"] .quill-shadcn .ql-editor * {
          direction: rtl;
        }

        @media (min-width: 768px) {
          .quill-shadcn .ql-editor {
            height: 240px;
          }
        }

        @media (min-width: 1024px) {
          .quill-shadcn .ql-editor {
            height: 280px;
          }
        }

        /* Placeholder */
        .quill-shadcn .ql-editor.ql-blank::before {
          @apply text-muted-foreground;
          font-style: normal;
          left: 0.75rem;
        }

        /* RTL Placeholder */
        [dir="rtl"] .quill-shadcn .ql-editor.ql-blank::before {
          left: auto;
          right: 0.75rem;
        }

        /* Content */
        .quill-shadcn .ql-editor p {
          @apply mb-3 text-foreground leading-relaxed;
        }

        .quill-shadcn .ql-editor p:last-child {
          @apply mb-0;
        }

        .quill-shadcn .ql-editor h1,
        .quill-shadcn .ql-editor h2,
        .quill-shadcn .ql-editor h3 {
          @apply text-foreground font-semibold mt-5 mb-3 leading-tight;
        }

        .quill-shadcn .ql-editor h1:first-child,
        .quill-shadcn .ql-editor h2:first-child,
        .quill-shadcn .ql-editor h3:first-child {
          @apply mt-0;
        }

        /* Font families */
        .quill-shadcn .ql-editor .ql-font-serif {
          font-family: Georgia, 'Times New Roman', serif;
        }

        .quill-shadcn .ql-editor .ql-font-monospace {
          font-family: 'Courier New', monospace;
        }

        .quill-shadcn .ql-editor .ql-font-sans-serif {
          font-family: Arial, Helvetica, sans-serif;
        }

        /* Font sizes */
        .quill-shadcn .ql-editor .ql-size-small {
          font-size: 0.75rem;
        }

        .quill-shadcn .ql-editor .ql-size-large {
          font-size: 1.125rem;
        }

        .quill-shadcn .ql-editor .ql-size-huge {
          font-size: 1.5rem;
        }

        /* Toolbar font picker labels */
        .quill-shadcn .ql-picker.ql-font .ql-picker-label[data-value="serif"]::before,
        .quill-shadcn .ql-picker.ql-font .ql-picker-item[data-value="serif"]::before {
          content: 'Serif';
          font-family: Georgia, serif;
        }

        .quill-shadcn .ql-picker.ql-font .ql-picker-label[data-value="monospace"]::before,
        .quill-shadcn .ql-picker.ql-font .ql-picker-item[data-value="monospace"]::before {
          content: 'Monospace';
          font-family: 'Courier New', monospace;
        }

        .quill-shadcn .ql-picker.ql-font .ql-picker-label[data-value="sans-serif"]::before,
        .quill-shadcn .ql-picker.ql-font .ql-picker-item[data-value="sans-serif"]::before {
          content: 'Sans Serif';
          font-family: Arial, sans-serif;
        }

        .quill-shadcn .ql-picker.ql-font .ql-picker-label:not([data-value])::before,
        .quill-shadcn .ql-picker.ql-font .ql-picker-item:not([data-value])::before {
          content: 'Default';
        }

        /* Toolbar size picker labels */
        .quill-shadcn .ql-picker.ql-size .ql-picker-label[data-value="small"]::before,
        .quill-shadcn .ql-picker.ql-size .ql-picker-item[data-value="small"]::before {
          content: 'Small';
          font-size: 0.75rem;
        }

        .quill-shadcn .ql-picker.ql-size .ql-picker-label[data-value="large"]::before,
        .quill-shadcn .ql-picker.ql-size .ql-picker-item[data-value="large"]::before {
          content: 'Large';
          font-size: 1.125rem;
        }

        .quill-shadcn .ql-picker.ql-size .ql-picker-label[data-value="huge"]::before,
        .quill-shadcn .ql-picker.ql-size .ql-picker-item[data-value="huge"]::before {
          content: 'Huge';
          font-size: 1.5rem;
        }

        .quill-shadcn .ql-picker.ql-size .ql-picker-label:not([data-value])::before,
        .quill-shadcn .ql-picker.ql-size .ql-picker-item:not([data-value])::before {
          content: 'Normal';
        }

        /* RTL Support for Font and Size Pickers - Fix dropdown alignment */
        [dir="rtl"] .quill-shadcn .ql-picker.ql-font .ql-picker-label::before,
        [dir="rtl"] .quill-shadcn .ql-picker.ql-size .ql-picker-label::before {
          text-align: right;
          display: block;
          width: 100%;
        }

        [dir="rtl"] .quill-shadcn .ql-picker.ql-font .ql-picker-item::before,
        [dir="rtl"] .quill-shadcn .ql-picker.ql-size .ql-picker-item::before {
          text-align: right;
          display: block;
          width: 100%;
        }

        /* RTL - Fix picker dropdown position relative to button */
        [dir="rtl"] .quill-shadcn .ql-picker.ql-expanded {
          position: relative;
        }

        [dir="rtl"] .quill-shadcn .ql-picker.ql-expanded .ql-picker-options {
          position: absolute;
          right: 0 !important;
          left: auto !important;
        }

        .quill-shadcn .ql-editor h1 {
          @apply text-2xl;
        }

        .quill-shadcn .ql-editor h2 {
          @apply text-xl;
        }

        .quill-shadcn .ql-editor h3 {
          @apply text-lg;
        }

        .quill-shadcn .ql-editor strong {
          @apply font-semibold text-foreground;
        }

        .quill-shadcn .ql-editor em {
          @apply italic text-foreground;
        }

        .quill-shadcn .ql-editor s {
          @apply line-through text-foreground;
        }

        .quill-shadcn .ql-editor a {
          @apply text-primary underline font-medium hover:opacity-80;
        }

        .quill-shadcn .ql-editor ul,
        .quill-shadcn .ql-editor ol {
          @apply pl-6 my-3;
        }

        /* RTL Support for Lists */
        [dir="rtl"] .quill-shadcn .ql-editor ul,
        [dir="rtl"] .quill-shadcn .ql-editor ol {
          @apply pl-0 pr-6;
        }

        .quill-shadcn .ql-editor li {
          @apply text-foreground my-1.5;
        }

        .quill-shadcn .ql-editor ul {
          @apply list-disc;
        }

        .quill-shadcn .ql-editor ol {
          @apply list-decimal;
        }

        /* Text alignment classes */
        .quill-shadcn .ql-editor .ql-align-left {
          text-align: left;
        }

        .quill-shadcn .ql-editor .ql-align-center {
          text-align: center;
        }

        .quill-shadcn .ql-editor .ql-align-right {
          text-align: right;
        }

        .quill-shadcn .ql-editor .ql-align-justify {
          text-align: justify;
        }

        /* RTL Text alignment override */
        [dir="rtl"] .quill-shadcn .ql-editor .ql-align-left {
          text-align: right;
        }

        [dir="rtl"] .quill-shadcn .ql-editor .ql-align-right {
          text-align: left;
        }

        /* Scrollbar */
        .quill-shadcn .ql-editor::-webkit-scrollbar {
          @apply w-2.5;
        }

        .quill-shadcn .ql-editor::-webkit-scrollbar-track {
          @apply bg-muted/20 rounded-full;
        }

        .quill-shadcn .ql-editor::-webkit-scrollbar-thumb {
          @apply bg-muted/60 rounded-full hover:bg-muted/80 transition-colors;
        }

        /* Tooltip */
        .quill-shadcn .ql-tooltip {
          @apply bg-popover border-2 border-muted/60 rounded-lg shadow-lg text-popover-foreground px-4 py-3;
        }

        /* RTL Support for Tooltip */
        [dir="rtl"] .quill-shadcn .ql-tooltip {
          direction: rtl;
          text-align: right;
        }

        .quill-shadcn .ql-tooltip input {
          @apply bg-background border-2 border-muted/60 rounded-md text-foreground px-3 py-2 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:outline-none transition-all;
        }

        [dir="rtl"] .quill-shadcn .ql-tooltip input {
          text-align: right;
        }

        .quill-shadcn .ql-tooltip .ql-action,
        .quill-shadcn .ql-tooltip .ql-remove {
          @apply text-primary hover:text-primary/80 transition-colors font-medium;
        }

        /* Button hover effects enhancement */
        .quill-shadcn .ql-toolbar button:hover {
          @apply shadow-sm;
        }

        .quill-shadcn .ql-toolbar button.ql-active {
          @apply ring-1 ring-primary/30;
        }

        /* Focus visible for accessibility */
        .quill-shadcn .ql-toolbar button:focus-visible,
        .quill-shadcn .ql-picker:focus-visible {
          @apply ring-2 ring-primary/50 outline-none;
        }
      `}</style>
    </div>
  );
};

export default QuillTextArea;