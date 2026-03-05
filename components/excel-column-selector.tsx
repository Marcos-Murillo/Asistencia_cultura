"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Download, Check, Plus } from "lucide-react"

export interface ExcelColumn {
  key: string
  label: string
}

interface ExcelColumnSelectorProps {
  availableColumns: ExcelColumn[]
  onDownload: (selectedColumns: string[]) => void
  buttonText?: string
  buttonClassName?: string
}

export function ExcelColumnSelector({
  availableColumns,
  onDownload,
  buttonText = "Descargar Excel",
  buttonClassName = "bg-green-600 hover:bg-green-700"
}: ExcelColumnSelectorProps) {
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    new Set(availableColumns.map(col => col.key))
  )
  const [open, setOpen] = useState(false)

  const toggleColumn = (key: string) => {
    const newSelected = new Set(selectedColumns)
    if (newSelected.has(key)) {
      newSelected.delete(key)
    } else {
      newSelected.add(key)
    }
    setSelectedColumns(newSelected)
  }

  const handleDownload = () => {
    // Siempre incluir "nombres" como primera columna
    const columnsToDownload = ["nombres", ...Array.from(selectedColumns)]
    onDownload(columnsToDownload)
    setOpen(false)
  }

  const selectAll = () => {
    setSelectedColumns(new Set(availableColumns.map(col => col.key)))
  }

  const deselectAll = () => {
    setSelectedColumns(new Set())
  }

  return (
    <Popover  open={open} onOpenChange={setOpen}>
      <PopoverTrigger  asChild>
        <Button className={buttonClassName}>
          <Download className="h-4 w-4 mr-2" />
          {buttonText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0 rounded-full" align="end">
        <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-r from-green-50 to-green-100">
            <CardTitle className="text-base font-semibold text-gray-800">
              Seleccionar Columnas
            </CardTitle>
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={selectAll}
                className="text-xs h-7"
              >
                Todas
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={deselectAll}
                className="text-xs h-7"
              >
                Ninguna
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-2 mb-4 max-h-[300px] overflow-y-auto pr-1">
              {availableColumns.map((column) => {
                const isSelected = selectedColumns.has(column.key)
                return (
                  <button
                    key={column.key}
                    onClick={() => toggleColumn(column.key)}
                    className={`
                      flex items-center justify-between px-3 py-2 rounded-full text-xs font-medium
                      transition-colors duration-200
                      ${
                        isSelected
                          ? "bg-green-500 text-white shadow-md"
                          : "bg-red-500 text-white hover:bg-red-600"
                      }
                    `}
                  >
                    <span className="truncate">{column.label}</span>
                    {isSelected ? (
                      <Check className="h-3 w-3 ml-1 flex-shrink-0" />
                    ) : (
                      <Plus className="h-3 w-3 ml-1 flex-shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleDownload}
                disabled={selectedColumns.size === 0}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar ({selectedColumns.size})
              </Button>
              <Button
                onClick={() => setOpen(false)}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}
