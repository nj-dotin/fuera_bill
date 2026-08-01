"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search, User, FileText, Receipt, Package, TrendingDown, ArrowRight } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { formatCurrency, formatDate, cn } from "@/lib/utils"

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter()
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<any>({
    customers: [],
    quotations: [],
    invoices: [],
    products: [],
    expenses: []
  })
  const [isLoading, setIsLoading] = React.useState(false)

  // Listen for Cmd+K or Ctrl+K globally
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        if (isOpen) onClose()
        else onClose() // Let the parent control the trigger (since parent toggle is safer)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  // Debounced search query fetching
  React.useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim()) {
        fetchResults()
      } else {
        setResults({
          customers: [],
          quotations: [],
          invoices: [],
          products: [],
          expenses: []
        })
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [query])

  const fetchResults = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const navigateTo = (path: string) => {
    onClose()
    setQuery("")
    router.push(path)
  }

  const totalResults =
    results.customers.length +
    results.quotations.length +
    results.invoices.length +
    results.products.length +
    results.expenses.length

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-card/90 backdrop-blur-xl border border-border/50 text-foreground overflow-hidden shadow-2xl p-0 gap-0">
        <DialogHeader className="p-4 border-b border-border/40">
          <DialogTitle className="sr-only">Search</DialogTitle>
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search customers, invoices, quotes, products, expenses..."
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-base h-9 px-0 w-full"
              autoFocus
            />
          </div>
        </DialogHeader>

        <div className="max-h-[400px] overflow-y-auto p-4 space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <span className="animate-spin mr-2 h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              Searching FUERA database...
            </div>
          )}

          {!isLoading && query.trim() && totalResults === 0 && (
            <div className="text-center py-12 text-sm text-muted-foreground">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}

          {!isLoading && !query.trim() && (
            <div className="text-center py-8 text-xs text-muted-foreground">
              Type to search globally. Use <kbd className="bg-secondary px-1 py-0.5 rounded text-[10px]">↑</kbd> and <kbd className="bg-secondary px-1 py-0.5 rounded text-[10px]">↓</kbd> to explore.
            </div>
          )}

          {!isLoading && (
            <>
              {/* Customers Section */}
              {results.customers.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <User className="h-3 w-3" /> Customers
                  </div>
                  <div className="space-y-1.5">
                    {results.customers.map((c: any) => (
                      <div
                        key={c.id}
                        onClick={() => navigateTo(`/customers?id=${c.id}`)}
                        className="flex justify-between items-center p-2.5 rounded-lg bg-secondary/20 hover:bg-secondary/40 border border-border/20 cursor-pointer group transition-all"
                      >
                        <div>
                          <div className="font-semibold text-sm group-hover:text-primary transition-colors">
                            {c.companyName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {c.contactPerson} &bull; {c.mobile}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 text-primary transition-all transform translate-x-[-4px] group-hover:translate-x-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quotations Section */}
              {results.quotations.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText className="h-3 w-3" /> Quotations
                  </div>
                  <div className="space-y-1.5">
                    {results.quotations.map((q: any) => (
                      <div
                        key={q.id}
                        onClick={() => navigateTo(`/quotations/${q.id}`)}
                        className="flex justify-between items-center p-2.5 rounded-lg bg-secondary/20 hover:bg-secondary/40 border border-border/20 cursor-pointer group transition-all"
                      >
                        <div>
                          <div className="font-semibold text-sm group-hover:text-primary transition-colors flex items-center gap-2">
                            {q.quotationNumber}
                            <span className={cn(
                              "text-[10px] px-1.5 py-0.2 rounded font-normal uppercase",
                              q.status === "ACCEPTED" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                              q.status === "DRAFT" ? "bg-gray-500/10 text-gray-400 border border-gray-500/20" :
                              "bg-primary/10 text-primary border border-primary/20"
                            )}>
                              {q.status.toLowerCase()}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {q.customer.companyName} &bull; Valid until {formatDate(q.validUntil)}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 text-primary transition-all transform translate-x-[-4px] group-hover:translate-x-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invoices Section */}
              {results.invoices.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Receipt className="h-3 w-3" /> Invoices
                  </div>
                  <div className="space-y-1.5">
                    {results.invoices.map((inv: any) => (
                      <div
                        key={inv.id}
                        onClick={() => navigateTo(`/invoices/${inv.id}`)}
                        className="flex justify-between items-center p-2.5 rounded-lg bg-secondary/20 hover:bg-secondary/40 border border-border/20 cursor-pointer group transition-all"
                      >
                        <div>
                          <div className="font-semibold text-sm group-hover:text-primary transition-colors flex items-center gap-2">
                            {inv.invoiceNumber}
                            <span className={cn(
                              "text-[10px] px-1.5 py-0.2 rounded font-normal uppercase",
                              inv.status === "PAID" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                              inv.status === "PARTIALLY_PAID" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" :
                              "bg-red-500/10 text-red-400 border border-red-500/20"
                            )}>
                              {inv.status.replace("_", " ").toLowerCase()}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {inv.customer.companyName} &bull; {formatDate(inv.invoiceDate)}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 text-primary transition-all transform translate-x-[-4px] group-hover:translate-x-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Products Section */}
              {results.products.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Package className="h-3 w-3" /> Products & Services
                  </div>
                  <div className="space-y-1.5">
                    {results.products.map((p: any) => (
                      <div
                        key={p.id}
                        onClick={() => navigateTo("/products")}
                        className="flex justify-between items-center p-2.5 rounded-lg bg-secondary/20 hover:bg-secondary/40 border border-border/20 cursor-pointer group transition-all"
                      >
                        <div>
                          <div className="font-semibold text-sm group-hover:text-primary transition-colors">
                            {p.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {p.category} &bull; HSN/SAC: {p.hsnSac} &bull; {p.unit}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-foreground">
                            {formatCurrency(p.price)}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            +{p.gstPercent}% GST
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expenses Section */}
              {results.expenses.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <TrendingDown className="h-3 w-3" /> Expenses
                  </div>
                  <div className="space-y-1.5">
                    {results.expenses.map((e: any) => (
                      <div
                        key={e.id}
                        onClick={() => navigateTo("/expenses")}
                        className="flex justify-between items-center p-2.5 rounded-lg bg-secondary/20 hover:bg-secondary/40 border border-border/20 cursor-pointer group transition-all"
                      >
                        <div>
                          <div className="font-semibold text-sm group-hover:text-primary transition-colors">
                            {e.category.toLowerCase()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {e.vendor} &bull; {formatDate(e.date)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-destructive">
                            -{formatCurrency(e.amount)}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            via {e.paymentMethod.replace("_", " ")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
