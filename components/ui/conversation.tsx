import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ArrowDown } from "lucide-react"

const Conversation = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative flex h-full flex-col", className)}
    {...props}
  />
))
Conversation.displayName = "Conversation"

const ConversationContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const [showScrollButton, setShowScrollButton] = React.useState(false)
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useImperativeHandle(ref, () => contentRef.current!)

  const scrollToBottom = () => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight
    }
  }

  const handleScroll = () => {
    if (contentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      setShowScrollButton(!isNearBottom)
    }
  }

  React.useEffect(() => {
    scrollToBottom()
  }, [props.children])

  return (
    <>
      <div
        ref={contentRef}
        onScroll={handleScroll}
        className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden px-4 py-4",
          className
        )}
        {...props}
      />
      {showScrollButton && (
        <Button
          onClick={scrollToBottom}
          size="icon"
          variant="secondary"
          className="absolute bottom-4 right-4 rounded-full shadow-lg"
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      )}
    </>
  )
})
ConversationContent.displayName = "ConversationContent"

const ConversationEmptyState = ({
  icon,
  title,
  description,
}: {
  icon?: React.ReactNode
  title: string
  description?: string
}) => (
  <div className="flex h-full flex-col items-center justify-center text-center">
    {icon && <div className="mb-4">{icon}</div>}
    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    {description && <p className="mt-2 text-sm text-gray-500">{description}</p>}
  </div>
)

const ConversationScrollButton = () => null

export {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
}
