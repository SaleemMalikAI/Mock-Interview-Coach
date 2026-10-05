"use client";

import type { ReactNode } from "react";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string; hint?: string };

type OptionGroupProps = {
  name: string;
  legend: string;
  description?: string;
  options: readonly Option[];
  value: string;
  onValueChange: (value: string) => void;
  disabledValues?: readonly string[];
  /** "cards": roomy tiles with optional icon; "segmented": compact equal-width choices. */
  variant?: "cards" | "segmented";
  columns?: 2 | 3 | 4;
  renderIcon?: (value: string) => ReactNode;
};

const COLUMN_CLASSES = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-1 min-[420px]:grid-cols-2" } as const;

export function OptionGroup({
  name,
  legend,
  description,
  options,
  value,
  onValueChange,
  disabledValues = [],
  variant = "segmented",
  columns = 3,
  renderIcon,
}: OptionGroupProps) {
  const legendId = `${name}-legend`;
  return (
    <fieldset className="space-y-3">
      <div>
        <legend id={legendId} className="text-sm font-semibold">
          {legend}
        </legend>
        {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <RadioGroup
        name={name}
        aria-labelledby={legendId}
        value={value}
        onValueChange={(next) => onValueChange(String(next))}
        className={cn("grid gap-2.5", COLUMN_CLASSES[columns])}
      >
        {options.map((option) => {
          const id = `${name}-${option.value}`;
          const disabled = disabledValues.includes(option.value);
          return (
            <label
              key={option.value}
              htmlFor={id}
              className={cn(
                "relative flex cursor-pointer rounded-xl border bg-card transition-[border-color,background-color,box-shadow] duration-150",
                "hover:border-primary/40 has-[[data-checked]]:border-primary has-[[data-checked]]:bg-brand-subtle/60 has-[[data-checked]]:shadow-[0_0_0_1px_var(--primary)]",
                "has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/40",
                variant === "cards" ? "items-start gap-3 p-4" : "min-h-14 flex-col justify-center px-3 py-2.5",
                disabled && "cursor-not-allowed opacity-45 hover:border-border",
              )}
            >
              <RadioGroupItem
                id={id}
                value={option.value}
                disabled={disabled}
                className={variant === "cards" ? "mt-0.5" : "absolute inset-0 size-full rounded-xl opacity-0"}
              />
              {variant === "cards" && renderIcon ? (
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-foreground [label:has([data-checked])_&]:bg-primary [label:has([data-checked])_&]:text-primary-foreground">
                  {renderIcon(option.value)}
                </span>
              ) : null}
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="text-sm font-semibold">{option.label}</span>
                {option.hint ? <span className="mt-1 text-xs text-muted-foreground">{option.hint}</span> : null}
              </span>
            </label>
          );
        })}
      </RadioGroup>
    </fieldset>
  );
}
