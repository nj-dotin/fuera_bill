"use client"

import React, { useState } from "react"
import { Sidebar } from "./sidebar"
import { SearchModal } from "./search-modal"

export function LayoutClientWrapper({ children }: { children: React.ReactNode }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <div className="flex min-h-screen w-full bg-[#070708] text-foreground">
      <Sidebar onSearchClick={() => setIsSearchOpen(true)} />
      <main className="flex-1 overflow-x-hidden min-h-screen pb-12">
        {children}
      </main>
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  )
}
