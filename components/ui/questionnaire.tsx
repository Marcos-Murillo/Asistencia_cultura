"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export function QuestionnaireChoices({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("grid gap-2", className)} {...props} />
}

interface QuestionnaireChoiceProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
  multiple?: boolean
}

export function QuestionnaireChoice({
  selected = false,
  multiple = false,
  className,
  children,
  ...props
}: QuestionnaireChoiceProps) {
  return (
    <button
      type="button"
      data-selected={selected}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border bg-white px-4 py-3 text-left text-sm text-slate-800 shadow-sm transition",
        "hover:border-violet-300 hover:bg-violet-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400",
        selected && "border-violet-500 bg-violet-50 ring-1 ring-violet-300",
        props.disabled && "cursor-not-allowed opacity-60",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center border-2",
          multiple ? "rounded-md" : "rounded-full",
          selected ? "border-violet-600 bg-violet-600 text-white" : "border-slate-300 bg-white text-transparent",
        )}
      >
        <Check className="h-3 w-3" />
      </span>
      <span className="font-medium leading-snug">{children}</span>
    </button>
  )
}
