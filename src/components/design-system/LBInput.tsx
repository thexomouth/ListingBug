import * as React from "react";
import { cn } from "../ui/utils";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export interface LBInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

const LBInput = React.forwardRef<HTMLInputElement, LBInputProps>(
  ({ className, label, error, success, helperText, icon, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;
    const hasSuccess = !!success;
    const hasValue = !!(props.value && String(props.value).length > 0);

    return (
      <div className="w-full space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[13px] text-[#342e37] dark:text-[#EBF2FA]"
          >
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}
          
          <input
            id={inputId}
            className={cn(
              "flex h-8 w-full border-b-2 bg-transparent px-0 py-1 text-sm transition-colors",
              "placeholder:text-muted-foreground/33",
              "focus-visible:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "autofill:bg-transparent autofill:shadow-[inset_0_0_0px_1000px_transparent]",
              hasError && "border-red-500 focus-visible:border-red-500",
              hasSuccess && "border-green-600 focus-visible:border-green-600",
              !hasError && !hasSuccess && !hasValue && "border-gray-300/33 focus-visible:border-[#FFCE0A] hover:border-gray-400/50",
              !hasError && !hasSuccess && hasValue && "border-gray-300 focus-visible:border-[#FFCE0A] hover:border-gray-400",
              icon && "pl-10",
              (hasError || hasSuccess) && "pr-10",
              className
            )}
            ref={ref}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />
          
          {hasError && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-destructive">
              <AlertCircle className="w-4 h-4" />
            </div>
          )}
          
          {hasSuccess && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          )}
        </div>
        
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-destructive flex items-center gap-1">
            {error}
          </p>
        )}
        
        {success && !error && (
          <p className="text-sm text-green-600 flex items-center gap-1">
            {success}
          </p>
        )}
        
        {helperText && !error && !success && (
          <p id={`${inputId}-helper`} className="text-sm text-muted-foreground">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

LBInput.displayName = "LBInput";

export { LBInput };