import * as React from "react"
import { cn } from "@/lib/utils"

const Response = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
      className
    )}
    {...props}
  />
))
Response.displayName = "Response"

export { Response }
