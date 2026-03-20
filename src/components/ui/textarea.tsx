import * as React from "react";

import { cn } from "./utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "resize-none placeholder:text-muted-foreground focus:border-[#FFCE0A] aria-invalid:border-red-500 flex field-sizing-content min-h-16 w-full border-b-2 border-gray-300 bg-transparent px-0 py-2 text-base transition-colors outline-none hover:border-gray-400 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };