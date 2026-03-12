import * as React from "react"
import { cn } from "@/lib/utils"

interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
  from: "user" | "assistant"
}

const Message = React.forwardRef<HTMLDivElement, MessageProps>(
  ({ className, from, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex w-full gap-3",
        from === "user" ? "justify-end" : "justify-start",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
Message.displayName = "Message"

const MessageContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-1", className)}
    {...props}
  />
))
MessageContent.displayName = "MessageContent"

export { Message, MessageContent }
