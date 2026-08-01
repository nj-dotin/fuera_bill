"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  Receipt,
  CreditCard,
  TrendingDown,
  ShoppingBag,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Building,
  Bell
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface SidebarProps {
  className?: string
  onSearchClick: () => void
}

export function Sidebar({ className, onSearchClick }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = React.useState(true)
  const [isMobileOpen, setIsMobileOpen] = React.useState(false)
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null)
  const [companyName, setCompanyName] = React.useState("FUERA")

  React.useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          if (data.logoUrl) setLogoUrl(data.logoUrl)
          if (data.companyName) setCompanyName(data.companyName)
        }
      })
      .catch(() => {})
  }, [])

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Customers", href: "/customers", icon: Users },
    { name: "Products & Services", href: "/products", icon: Package },
    { name: "Quotations", href: "/quotations", icon: FileText },
    { name: "Invoices", href: "/invoices", icon: Receipt },
    { name: "Payments Track", href: "/payments", icon: CreditCard },
    { name: "Expenses", href: "/expenses", icon: TrendingDown },
    { name: "Purchase Bills", href: "/purchases", icon: ShoppingBag },
    { name: "Reports", href: "/reports", icon: BarChart3 },
    { name: "Settings", href: "/settings", icon: Settings },
  ]

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" })
      if (response.ok) {
        router.refresh()
        router.push("/login")
      }
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  // Effect to close mobile menu on path changes
  React.useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden h-16 border-b border-border/40 bg-card/60 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-40 w-full no-print">
        <div className="flex items-center gap-2">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Logo" className="h-6 max-w-[80px] object-contain" />
          ) : (
            <>
              <Building className="h-5 w-5 text-primary" />
              <span className="font-bold tracking-wider text-lg text-foreground">{companyName}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onSearchClick} aria-label="Search">
            <Search className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            aria-label="Toggle Menu"
          >
            {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Mobile Drawer Backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 bottom-0 left-0 w-72 bg-card border-r border-border/40 z-50 p-4 flex flex-col justify-between lg:hidden"
          >
            <div>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <Building className="h-6 w-6 text-primary" />
                  <span className="font-bold tracking-wider text-xl">FUERA ERP</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-1">
                {menuItems.map((item) => {
                  const isActive = pathname.startsWith(item.href)
                  return (
                    <Link key={item.href} href={item.href} passHref>
                      <span
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                            : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {item.name}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>

            <Button
              variant="ghost"
              className="w-full flex items-center justify-start gap-3 px-3 py-2.5 text-destructive hover:bg-destructive/10 hover:text-destructive-foreground rounded-lg"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Sign Out
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: isOpen ? "260px" : "78px" }}
        transition={{ type: "spring", damping: 20, stiffness: 120 }}
        className={cn(
          "hidden lg:flex flex-col justify-between min-h-screen bg-card/60 backdrop-blur-md border-r border-border/40 p-4 sticky top-0 z-30 no-print shrink-0",
          className
        )}
      >
        <div>
          {/* Header & Logo */}
          <div className="flex items-center justify-between mb-8 h-10 px-2">
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 overflow-hidden animate-in fade-in duration-300"
                  key="open-logo"
                >
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="Logo" className="h-6 max-w-[80px] object-contain shrink-0" />
                  ) : (
                    <Building className="h-6 w-6 text-primary shrink-0 animate-pulse" />
                  )}
                  <span className="font-extrabold tracking-widest text-base bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
                    {companyName}
                  </span>
                  <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground border border-border">
                    ERP
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mx-auto"
                  key="collapsed-logo"
                >
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="Logo" className="h-6 w-6 object-contain" />
                  ) : (
                    <Building className="h-6 w-6 text-primary" />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-secondary/40 shrink-0"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Minimize Menu"
            >
              <Menu className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>

          {/* Quick Search Shortcut Trigger */}
          <div className="mb-6 px-1">
            <Button
              variant="outline"
              className={cn(
                "w-full bg-secondary/20 hover:bg-secondary/40 border-border/40 text-muted-foreground text-xs flex justify-between items-center px-3 h-9 rounded-lg font-normal",
                !isOpen && "justify-center"
              )}
              onClick={onSearchClick}
            >
              <div className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5" />
                {isOpen && <span>Global Search...</span>}
              </div>
              {isOpen && (
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-card px-1.5 font-mono text-[9px] font-medium opacity-70">
                  <span className="text-[8px]">⌘</span>K
                </kbd>
              )}
            </Button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link key={item.href} href={item.href} passHref>
                  <span
                    className={cn(
                      "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group relative",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        : "text-muted-foreground hover:bg-secondary/30 hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {isOpen ? (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="ml-3 truncate"
                      >
                        {item.name}
                      </motion.span>
                    ) : (
                      // Tooltip
                      <span className="absolute left-full ml-4 px-2 py-1 bg-popover text-popover-foreground border border-border text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50 whitespace-nowrap">
                        {item.name}
                      </span>
                    )}
                  </span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="space-y-2">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center text-destructive hover:bg-destructive/10 hover:text-destructive-foreground rounded-lg justify-start px-3 py-2.5",
              !isOpen && "justify-center"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {isOpen && <span className="ml-3">Sign Out</span>}
          </Button>
        </div>
      </motion.aside>
    </>
  )
}
