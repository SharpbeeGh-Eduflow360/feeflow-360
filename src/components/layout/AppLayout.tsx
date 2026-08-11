import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { SidebarNav } from './SidebarNav'
import { TopBar } from './TopBar'
import { Sheet, SheetContent } from '@/components/ui/sheet'

export function AppLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar — always visible on large screens */}
      <aside className="hidden w-64 shrink-0 border-r bg-background lg:block print:hidden">
        <div className="flex h-16 items-center border-b px-4">
          <Link to="/dashboard" className="text-lg font-bold text-brand-navy dark:text-white">
            FeeFlow<span className="text-brand-gold">-360</span>
          </Link>
        </div>
        <SidebarNav />
      </aside>

      {/* Mobile sidebar — slides in as a drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-16 items-center border-b px-4">
            <Link to="/dashboard" className="text-lg font-bold text-brand-navy dark:text-white">
              FeeFlow<span className="text-brand-gold">-360</span>
            </Link>
          </div>
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content area */}
      <div className="flex flex-1 flex-col">
        <div className="print:hidden">
          <TopBar onMenuClick={() => setMobileOpen(true)} />
        </div>
        <main className="flex-1 bg-muted/30 p-4 md:p-6 print:p-0 print:bg-white">
          {children}
        </main>
      </div>
    </div>
  )
}