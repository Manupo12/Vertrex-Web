"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    const id = React.useId();
    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            error &&
              "border-destructive focus:ring-destructive",
            className
          )}
          ref={ref}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
        {error && (
          <p
            id={`${id}-error`}
            className="mt-1.5 text-xs text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export interface InputIconProps {
  children: React.ReactNode;
  className?: string;
}

function InputIcon({ children, className }: InputIconProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground",
        className
      )}
    >
      {children}
    </div>
  );
}
InputIcon.displayName = "InputIcon";

export interface InputWrapperProps {
  children: React.ReactNode;
  className?: string;
}

function InputWrapper({ children, className }: InputWrapperProps) {
  return (
    <div className={cn("relative w-full", className)}>
      {children}
    </div>
  );
}
InputWrapper.displayName = "InputWrapper";

export { Input, InputIcon, InputWrapper };
