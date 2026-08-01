"use client"

import * as React from "react"
import Link from "next/link"
import { Search, PlusCircle, Eye, Copy, Trash2, Receipt } from "lucide-react"
import { getInvoices, deleteInvoice, duplicateInvoice } from "@/app/actions/invoices"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatCurrency, formatDate } from "@/lib/utils"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function InvoicesPage() {
  const router = useRouter()
  const [invoices, setInvoices] = React.useState<any[]>([])
  const [query, setQuery] = React.useState("")
  const [status, setStatus] = React.useState("ALL")
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [totalCount, setTotalCount] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(false)

  // Deletion Modal
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [selectedInvoice, setSelectedInvoice] = React.useState<any>(null)

  const loadInvoices = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getInvoices(query, status, page, 8)
      setInvoices(data.invoices)
      setTotalPages(data.totalPages)
      setTotalCount(data.totalCount)
    } catch (e) {
      toast.error("Failed to load invoices")
    } finally {
      setIsLoading(false)
    }
  }, [query, status, page])

  React.useEffect(() => {
    loadInvoices()
  }, [loadInvoices])

  const handleDeleteSubmit = async () => {
    if (!selectedInvoice) return
    const res = await deleteInvoice(selectedInvoice.id)
    if (res.success) {
      toast.success("Invoice deleted successfully")
      setIsDeleteOpen(false)
      setSelectedInvoice(null)
      loadInvoices()
    } else {
      toast.error(res.error || "Failed to delete invoice")
    }
  }

  const handleDuplicate = async (id: string) => {
    toast.info("Cloning invoice...")
    const res = await duplicateInvoice(id)
    if (res.success) {
      toast.success("Invoice duplicated successfully")
      router.push(`/invoices/${res.invoiceId}`)
    } else {
      toast.error(res.error || "Failed to duplicate invoice")
    }
  }

  const calculateInvoiceTotal = (inv: any) => {
    let subtotal = 0
    let tax = 0
    inv.items.forEach((item: any) => {
      const itemSub = item.price * item.quantity * (1 - item.discount / 100)
      subtotal += itemSub
      if (inv.isGst) {
        tax += itemSub * (item.gstPercent / 100)
      }
    })
    return Math.round(subtotal + tax + inv.shippingCharges - inv.discount + inv.roundOff)
  }

  const getStatusBadgeClass = (s: string) => {
    switch (s) {
      case "PAID":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      case "PARTIALLY_PAID":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      case "PENDING":
        return "bg-red-500/10 text-red-400 border-red-500/20"
      default:
        return "bg-secondary text-secondary-foreground"
    }
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto dark">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
            GST & General Invoices
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Build GST/Non-GST invoices, record payments, and track customer dues.
          </p>
        </div>
        <Link href="/invoices/new" passHref>
          <Button className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold gap-1.5 self-start sm:self-auto shadow-lg shadow-primary/20">
            <PlusCircle className="h-4 w-4" /> Create Invoice
          </Button>
        </Link>
      </div>

      {/* Filters Bar */}
      <Card className="bg-card/40 border-border/40 backdrop-blur-md">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4 w-full items-center">
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                placeholder="Search invoice number, client company..."
                className="pl-9 h-10 border-border/60 bg-secondary/10 focus-visible:ring-primary focus-visible:border-primary focus-visible:bg-secondary/20 w-full"
              />
            </div>

            <div className="w-full md:w-48">
              <Select value={status} onValueChange={(val) => { setStatus(val || "ALL"); setPage(1); }}>
                <SelectTrigger className="border-border/60 bg-secondary/10 h-10">
                  <SelectValue placeholder="All Payments" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border/50 text-foreground">
                  <SelectItem value="ALL">All Payments</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="text-xs text-muted-foreground shrink-0 w-full md:w-auto text-right">
            Total Invoices: <strong className="text-foreground">{totalCount}</strong>
          </div>
        </CardContent>
      </Card>

      {/* Table grid */}
      <Card className="bg-card/40 border-border/40 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/20">
            <TableRow className="border-b border-border/20">
              <TableHead className="font-semibold text-muted-foreground">Invoice Number</TableHead>
              <TableHead className="font-semibold text-muted-foreground">Customer Company</TableHead>
              <TableHead className="font-semibold text-muted-foreground">Date Issued</TableHead>
              <TableHead className="font-semibold text-muted-foreground">Due Date</TableHead>
              <TableHead className="font-semibold text-muted-foreground text-center">Tax Type</TableHead>
              <TableHead className="font-semibold text-muted-foreground text-center">Payment Status</TableHead>
              <TableHead className="font-semibold text-muted-foreground text-right">Grand Total</TableHead>
              <TableHead className="font-semibold text-muted-foreground text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center text-muted-foreground">
                  <span className="animate-spin inline-block mr-2 h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                  Loading invoices...
                </TableCell>
              </TableRow>
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center text-muted-foreground">
                  No invoices created yet. Click &ldquo;Create Invoice&rdquo; to start.
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => {
                const total = calculateInvoiceTotal(inv)
                return (
                  <TableRow key={inv.id} className="border-b border-border/10 hover:bg-secondary/10 transition-colors">
                    <TableCell className="font-semibold text-primary">
                      <Link href={`/invoices/${inv.id}`} className="hover:underline flex items-center gap-1.5">
                        <Receipt className="h-4 w-4" /> {inv.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-semibold text-foreground">{inv.customer.companyName}</div>
                        <div className="text-xs text-muted-foreground">{inv.customer.contactPerson}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(inv.invoiceDate)}</TableCell>
                    <TableCell className="text-sm">
                      <span className={new Date(inv.dueDate) < new Date() && inv.status !== "PAID" ? "text-red-500 font-semibold" : ""}>
                        {formatDate(inv.dueDate)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-xs font-semibold text-muted-foreground">
                      {inv.isGst ? "GST Invoice" : "Non-GST"}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${getStatusBadgeClass(inv.status)}`}>
                        {inv.status.replace("_", " ").toLowerCase()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-foreground">
                      {formatCurrency(total)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`/invoices/${inv.id}`} passHref>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" title="View Details">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                          onClick={() => handleDuplicate(inv.id)}
                          title="Duplicate Invoice"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => { setSelectedInvoice(inv); setIsDeleteOpen(true); }}
                          title="Delete Invoice"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-end p-4 border-t border-border/20 gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground px-2">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        )}
      </Card>

      {/* --- DELETE CONFIRM MODAL --- */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md bg-card border border-border/50 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-destructive font-bold">Remove Invoice?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete invoice <strong className="text-foreground">{selectedInvoice?.invoiceNumber}</strong>?
              Deleting this invoice will automatically remove all recorded payment receipts linked to it.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => { setIsDeleteOpen(false); setSelectedInvoice(null); }}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteSubmit}>Delete Invoice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
