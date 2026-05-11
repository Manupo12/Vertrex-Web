"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const labelVariants = cva(
  "text-[13px] font-semibold leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
  {
    variants: {
      required: {
        true: "after:ml-0.5 after:text-destructive after:content-['*']",
        false: "",
      },
    },
    defaultVariants: {
      required: false,
    },
  }
);

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(labelVariants({ required }), className)}
        {...props}
      />
    );
  }
);
Label.displayName = "Label";

export { Label };
