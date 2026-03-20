import * as React from "react";
import { cn } from "../ui/utils";

export interface LBCardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: "none" | "sm" | "md" | "lg" | "xl";
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
}

const LBCard = React.forwardRef<HTMLDivElement, LBCardProps>(
  ({ className, elevation = "sm", padding = "md", hover = false, ...props }, ref) => {
    const elevationClasses = {
      none: "",
      sm: "shadow-[var(--elevation-sm)]",
      md: "shadow-[var(--elevation-md)]",
      lg: "shadow-[var(--elevation-lg)]",
      xl: "shadow-[var(--elevation-xl)]",
    };

    const paddingClasses = {
      none: "",
      sm: "p-3",
      md: "p-6",
      lg: "p-8",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border border-border bg-card text-card-foreground transition-all",
          elevationClasses[elevation],
          paddingClasses[padding],
          hover && "hover:shadow-[var(--elevation-md)] hover:border-primary/20",
          className
        )}
        {...props}
      />
    );
  }
);

LBCard.displayName = "LBCard";

const LBCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 mb-4", className)}
      {...props}
    />
  )
);

LBCardHeader.displayName = "LBCardHeader";

const LBCardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("leading-none tracking-tight", className)}
      {...props}
    />
  )
);

LBCardTitle.displayName = "LBCardTitle";

const LBCardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
);

LBCardDescription.displayName = "LBCardDescription";

const LBCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("", className)} {...props} />
  )
);

LBCardContent.displayName = "LBCardContent";

const LBCardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center mt-4 pt-4 border-t border-border", className)}
      {...props}
    />
  )
);

LBCardFooter.displayName = "LBCardFooter";

export { LBCard, LBCardHeader, LBCardTitle, LBCardDescription, LBCardContent, LBCardFooter };
