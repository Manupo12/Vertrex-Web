"use client";

import { useFormStatus } from "react-dom";
import { Button, ButtonProps } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AsyncSubmitButtonProps extends ButtonProps {
  loadingText?: string;
}

export function AsyncSubmitButton({ 
  children, 
  loadingText = "Guardando...", 
  className, 
  disabled, 
  ...props 
}: AsyncSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button 
      type="submit" 
      disabled={pending || disabled} 
      className={cn("gap-2", className)} 
      {...props}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
