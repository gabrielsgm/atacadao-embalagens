"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, label, error, hint, leftElement, rightElement, id, ...props },
    ref
  ) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, "-");

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-surface-50"
          >
            {label}
            {props.required && <span className="text-brand-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {leftElement && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-100 pointer-events-none">
              {leftElement}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full h-10 rounded-lg border bg-surface-700 text-white placeholder:text-surface-100",
              "transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              error
                ? "border-red-500/60 focus:ring-red-500/30 focus:border-red-500"
                : "border-surface-500 hover:border-surface-400",
              leftElement ? "pl-10 pr-4" : "px-4",
              rightElement ? "pr-10" : "",
              className
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-100">
              {rightElement}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-red-400 flex items-center gap-1">⚠ {error}</p>}
        {hint && !error && <p className="text-xs text-surface-100">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

// ── Textarea ─────────────────────────────────────────────────────────────────

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, "-");

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-surface-50">
            {label}
            {props.required && <span className="text-brand-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded-lg border bg-surface-700 text-white placeholder:text-surface-100",
            "px-4 py-3 min-h-[100px] resize-y",
            "transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error
              ? "border-red-500/60 focus:ring-red-500/30 focus:border-red-500"
              : "border-surface-500 hover:border-surface-400",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">⚠ {error}</p>}
        {hint && !error && <p className="text-xs text-surface-100">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
