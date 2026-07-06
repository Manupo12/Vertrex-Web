"use client";

import * as React from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type MultiSelectOption = {
  id: string;
  label: string;
  sublabel?: string;
  dividerBefore?: boolean;
};

type MultiSelectProps = {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  className?: string;
  emptyLabel?: string;
  triggerLabel?: string;
};

export function MultiSelect({
  options,
  selected,
  onChange,
  className,
  emptyLabel = "Todos",
  triggerLabel,
}: MultiSelectProps) {
  const toggle = (id: string) => {
    if (selected.includes(id)) onChange(selected.filter((s) => s !== id));
    else onChange([...selected, id]);
  };

  const label = (() => {
    if (selected.length === 0) return triggerLabel ?? emptyLabel;
    const opts = options.filter((o) => selected.includes(o.id));
    const names = opts.map((o) => o.label);
    if (names.length <= 2) return names.join(", ");
    return `${names.slice(0, 2).join(", ")} +${names.length - 2} más`;
  })();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-haspopup="listbox"
          className={cn(
            "h-9 w-full justify-between font-normal px-3",
            selected.length > 0 && "border-primary/40 bg-primary/5",
            className,
          )}
        >
          <span className="truncate text-left flex-1">{label}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <div className="max-h-72 overflow-y-auto py-1" role="listbox">
          {options.map((opt) => {
            const checked = selected.includes(opt.id);
            return (
              <React.Fragment key={opt.id}>
                {opt.dividerBefore && (
                  <div className="my-1 h-px bg-border" role="separator" />
                )}
                <button
                  type="button"
                  role="option"
                  aria-selected={checked}
                  onClick={() => toggle(opt.id)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent",
                    opt.dividerBefore && "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                      checked
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background",
                    )}
                  >
                    {checked && <Check className="h-3 w-3" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{opt.label}</div>
                    {opt.sublabel && (
                      <div className="truncate text-xs text-muted-foreground">
                        {opt.sublabel}
                      </div>
                    )}
                  </div>
                </button>
              </React.Fragment>
            );
          })}
        </div>
        {selected.length > 0 && (
          <div className="border-t border-border p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-center"
              onClick={() => onChange([])}
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              Limpiar
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
