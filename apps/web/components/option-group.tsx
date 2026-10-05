"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string; hint?: string };

type OptionGroupProps = {
  name: string;
  legend: string;
  options: readonly Option[];
  value: string;
  onValueChange: (value: string) => void;
  disabledValues?: readonly string[];
  columns?: 2 | 3 | 4;
};

const COLUMN_CLASSES = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-2 sm:grid-cols-4" } as const;

export function OptionGroup({
  name,
  legend,
  options,
  value,
  onValueChange,
  disabledValues = [],
  columns = 3,
}: OptionGroupProps) {
  const legendId = `${name}-legend`;
  return (
    <fieldset className="space-y-2">
      <legend id={legendId} className="text-sm font-medium">
        {legend}
      </legend>
      <RadioGroup
        name={name}
        aria-labelledby={legendId}
        value={value}
        onValueChange={(next) => onValueChange(String(next))}
        className={cn("grid gap-2", COLUMN_CLASSES[columns])}
      >
        {options.map((option) => {
          const id = `${name}-${option.value}`;
          const disabled = disabledValues.includes(option.value);
          return (
            <label
              key={option.value}
              htmlFor={id}
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                "hover:bg-muted has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5",
                disabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
              )}
            >
              <RadioGroupItem id={id} value={option.value} disabled={disabled} />
              <span className="flex flex-col leading-tight">
                <span className="font-medium">{option.label}</span>
                {option.hint ? <span className="text-xs text-muted-foreground">{option.hint}</span> : null}
              </span>
            </label>
          );
        })}
      </RadioGroup>
    </fieldset>
  );
}
