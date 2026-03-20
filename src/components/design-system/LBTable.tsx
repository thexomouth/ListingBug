import * as React from "react";
import { cn } from "../ui/utils";

const LBTable = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="w-full overflow-auto rounded-lg border border-border">
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
);

LBTable.displayName = "LBTable";

const LBTableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead
      ref={ref}
      className={cn("bg-muted/50 border-b border-border", className)}
      {...props}
    />
  )
);

LBTableHeader.displayName = "LBTableHeader";

const LBTableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody
      ref={ref}
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
);

LBTableBody.displayName = "LBTableBody";

const LBTableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={cn("border-t border-border bg-muted/50", className)}
      {...props}
    />
  )
);

LBTableFooter.displayName = "LBTableFooter";

const LBTableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement> & { hover?: boolean }>(
  ({ className, hover = true, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b border-border transition-colors",
        hover && "hover:bg-white/5 dark:hover:bg-white/5",
        className
      )}
      {...props}
    />
  )
);

LBTableRow.displayName = "LBTableRow";

const LBTableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-12 px-2 text-left align-middle text-muted-foreground",
        className
      )}
      {...props}
    />
  )
);

LBTableHead.displayName = "LBTableHead";

const LBTableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn("py-4 px-2 align-middle", className)}
      {...props}
    />
  )
);

LBTableCell.displayName = "LBTableCell";

const LBTableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption
      ref={ref}
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
);

LBTableCaption.displayName = "LBTableCaption";

export {
  LBTable,
  LBTableHeader,
  LBTableBody,
  LBTableFooter,
  LBTableHead,
  LBTableRow,
  LBTableCell,
  LBTableCaption,
};