import * as React from "react";
import { cn } from "../ui/utils";

export interface LBToggleProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

const LBToggle = React.forwardRef<HTMLButtonElement, LBToggleProps>(
  ({ checked = false, onCheckedChange, label, description, disabled = false, size = "md" }, ref) => {
    const handleToggle = () => {
      if (!disabled) {
        onCheckedChange?.(!checked);
      }
    };

    const sizeClasses = {
      sm: "h-5 w-9",
      md: "h-6 w-11",
      lg: "h-7 w-14",
    };

    const thumbSizeClasses = {
      sm: "h-4 w-4",
      md: "h-5 w-5",
      lg: "h-6 w-6",
    };

    const translateClasses = {
      sm: checked ? "translate-x-4" : "translate-x-0",
      md: checked ? "translate-x-5" : "translate-x-0",
      lg: checked ? "translate-x-7" : "translate-x-0",
    };

    return (
      <div className="flex items-center gap-3">
        <button
          ref={ref}
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={handleToggle}
          className={cn(
            "relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            sizeClasses[size],
            checked ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out",
              thumbSizeClasses[size],
              translateClasses[size]
            )}
          />
        </button>
        
        {(label || description) && (
          <div className="flex flex-col min-w-0">
            {label && (
              <span className={cn(
                "text-sm text-foreground truncate",
                disabled && "opacity-50"
              )}>
                {label}
              </span>
            )}
            {description && (
              <span className={cn(
                "text-xs text-muted-foreground truncate",
                disabled && "opacity-50"
              )}>
                {description}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

LBToggle.displayName = "LBToggle";

export { LBToggle };