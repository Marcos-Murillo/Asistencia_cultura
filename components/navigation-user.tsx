"use client"

import { usePathname } from "next/navigation"


export function NavigationUser() {
  const pathname = usePathname()

   return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900">Sistema Cultural UV</h1>
          </div>
          </div>
        </div>
    </nav>
  )
}