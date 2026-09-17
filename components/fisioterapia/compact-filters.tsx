"use client"

import { CalendarDays, Filter, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Combobox } from "@/components/ui/combobox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const chip =
  "h-8 shrink-0 rounded-full border border-teal-200 bg-white px-2.5 text-[11px] font-medium text-teal-900 shadow-sm"

export function MobileRecordCard({
  title,
  subtitle,
  onClick,
}: {
  title: string
  subtitle?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full overflow-hidden rounded-xl bg-white px-3 py-2 text-left shadow-sm"
    >
      <p className="truncate text-[12px] font-bold uppercase leading-tight tracking-wide text-slate-800">
        {title || "SIN GRUPO"}
      </p>
      {subtitle ? (
        <p className="mt-0.5 line-clamp-1 text-[11px] leading-tight text-slate-500">{subtitle}</p>
      ) : null}
    </button>
  )
}

export function CompactDateButton({
  from,
  to,
  onFrom,
  onTo,
}: {
  from: string
  to: string
  onFrom: (value: string) => void
  onTo: (value: string) => void
}) {
  const active = Boolean(from || to)
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className={cn(chip, "inline-flex items-center gap-1", active && "bg-teal-800 text-white border-teal-800")}>
          <CalendarDays className="h-3 w-3" />
          Fecha
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 space-y-2 p-3">
        <p className="text-[11px] font-medium text-slate-500">Desde</p>
        <Input type="date" className="h-8 text-xs" value={from} onChange={(e) => onFrom(e.target.value)} />
        <p className="text-[11px] font-medium text-slate-500">Hasta</p>
        <Input type="date" className="h-8 text-xs" value={to} onChange={(e) => onTo(e.target.value)} />
        {(from || to) && (
          <Button
            variant="ghost"
            className="h-7 w-full justify-center text-[11px]"
            onClick={() => {
              onFrom("")
              onTo("")
            }}
          >
            Limpiar
          </Button>
        )}
      </PopoverContent>
    </Popover>
  )
}

export function CompactGroupButton({
  groups,
  value,
  onChange,
}: {
  groups: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className={cn(chip, "inline-flex items-center gap-1", value && "bg-teal-800 text-white border-teal-800")}>
          <Users className="h-3 w-3" />
          Grupo
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-3">
        <Combobox
          options={[{ value: "", label: "Todos los grupos" }, ...groups]}
          value={value}
          onValueChange={onChange}
          placeholder="Grupo"
        />
      </PopoverContent>
    </Popover>
  )
}

export function CompactFiltersButton({
  options,
  value,
  onChange,
  label = "Filtros",
}: {
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  label?: string
}) {
  const active = value && value !== "todos" && value !== ""
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className={cn(chip, "inline-flex items-center gap-1", active && "bg-teal-800 text-white border-teal-800")}>
          <Filter className="h-3 w-3" />
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 space-y-1 p-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "flex h-8 w-full items-center rounded-md px-2 text-left text-xs",
              value === option.value ? "bg-teal-800 text-white" : "hover:bg-slate-100",
            )}
          >
            {option.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}
