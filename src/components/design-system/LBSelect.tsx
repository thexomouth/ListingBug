import * as React from "react";
import { cn } from "../ui/utils";
import { ChevronDown, AlertCircle } from "lucide-react";

export interface LBSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface LBSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  options: LBSelectOption[];
  placeholder?: string;
  onChange?: (value: string) => void;
}

const LBSelect = React.forwardRef<HTMLSelectElement, LBSelectProps>(
  ({ className, label, error, helperText, options = [], placeholder, onChange, id, ...props }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange?.(e.target.value);
    };

    return (
      <div className="w-full space-y-1">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-[13px] dark:text-[#EBF2FA] text-[#ffffff]"
          >
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          <select
            id={selectId}
            className={cn(
              "flex h-8 w-full appearance-none rounded-none border bg-white dark:bg-[#0F1115] px-3 py-1 pr-10 text-sm transition-colors shadow-sm",
              "text-[#342e37] dark:text-white",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
              "disabled:cursor-not-allowed disabled:opacity-50",
              hasError && "border-destructive focus-visible:ring-destructive",
              !hasError && "border-gray-200 dark:border-white/20 focus-visible:ring-[#FFCE0A] focus-visible:border-[#FFCE0A]",
              className
            )}
            ref={ref}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined
            }
            onChange={handleChange}
            {...props}
          >
            {placeholder && (
              <option value="" disabled className="opacity-[0.33]">
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="bg-white dark:bg-[#0F1115] text-[#342e37] dark:text-white"
              >
                {option.label}
              </option>
            ))}
          </select>
          
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {hasError ? (
              <AlertCircle className="w-4 h-4 text-destructive" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground dark:text-white/60" />
            )}
          </div>
        </div>
        
        {error && (
          <p id={`${selectId}-error`} className="text-sm text-destructive flex items-center gap-1">
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p id={`${selectId}-helper`} className="text-sm text-muted-foreground">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

LBSelect.displayName = "LBSelect";

export { LBSelect };