import * as React from "react"
import { cn } from "@/lib/utils"

interface OrbProps extends React.HTMLAttributes<HTMLDivElement> {
  agentState?: "talking" | "listening" | null
}

const Orb = React.forwardRef<HTMLDivElement, OrbProps>(
  ({ className, agentState, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative flex items-center justify-center rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600 transition-all duration-300",
        agentState === "talking" && "animate-pulse scale-110",
        agentState === "listening" && "scale-105",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 rounded-full bg-white/20 blur-sm" />
      <div className="relative z-10 h-full w-full rounded-full bg-gradient-to-br from-purple-400/50 via-blue-400/50 to-indigo-500/50" />
    </div>
  )
)
Orb.displayName = "Orb"

export { Orb }
