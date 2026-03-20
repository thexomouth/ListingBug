import * as React from "react";
import { Slot } from "@radix-ui/react-slot@1.1.2";
import { cva, type VariantProps } from "class-variance-authority@0.7.1";
import { cn } from "../ui/utils";

const lbButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-bold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary shadow-[var(--elevation-sm)] hover:shadow-[var(--elevation-md)]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-secondary border border-border",
        ghost: "hover:bg-accent hover:text-accent-foreground focus-visible:ring-accent",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive shadow-[var(--elevation-sm)]",
        outline: "border border-border bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-primary",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface LBButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof lbButtonVariants> {
  asChild?: boolean;
}

const LBButton = React.forwardRef<HTMLButtonElement, LBButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(lbButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

LBButton.displayName = "LBButton";

export { LBButton, lbButtonVariants };