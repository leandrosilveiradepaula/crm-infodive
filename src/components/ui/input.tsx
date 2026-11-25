import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-surface-raised border-input h-[var(--ds-control-height-default)] w-full min-w-0 rounded-[var(--radius-control)] border bg-surface-raised px-[var(--ds-control-padding-field)] py-[var(--ds-control-padding-y)] ds-type-control shadow-control-ui transition-[color,box-shadow,border-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent  disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 ",
        "focus:border-primary focus:outline-2 focus:outline-offset-2 focus:[outline-color:var(--primary)]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
