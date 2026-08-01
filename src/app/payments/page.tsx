"use client"

import * as React from "react"
import Link from "next/link"
import { Search, CreditCard, Receipt, Trash2 } from "lucide-react"
import { getPayments } from "@/app/actions/payments"
import { deletePayment } from "@/app/actions/invoices"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatCurrency, formatDate } from "@/lib/utils"
import { toast } from "sonner"

export default function PaymentsPage() {
  const [payments, setPayments] = React.useState<any[]>([])
  const [query, setQuery] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [totalCount, setTotalCount] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(false)

  // Deletion Modal
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [selectedPayment, setSelectedPayment] = React.useState<any>(null)

  const loadPayments = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getPayments(query, page, 10)
      setPayments(data.payments)
      setTotalPages(data.totalPages)
      setTotalCount(data.totalCount)
    } catch (e) {
      toast.error("Failed to load payments history")
    } finally {
      setIsLoading(false)
    }
  }, [query, page])

  React.useEffect(() => {
    loadPayments()
  }, [loadPayments])

  const handleDeleteSubmit = async () => {
    if (!selectedPayment) return
    const res = await deletePayment(selectedPayment.id)
    if (res.success) {
      toast.success("Payment receipt removed")
      setIsDeleteOpen(false)
      setSelectedPayment(null)
      loadPayments()
    } else {
      toast.error(res.error || "Failed to remove receipt")
    }
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto dark">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
          Payment Tracking Ledger
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Review chronological accounts of invoice payments and track transaction IDs.
        </p>
      </div>

      {/* Search Bar */}
      <Card className="bg-card/40 border-border/40 backdrop-blur-md">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search reference UTR, invoice no..."
              className="pl-9 h-10 border-border/60 bg-secondary/10 focus-visible:ring-primary focus-visible:border-primary focus-visible:bg-secondary/20 w-full"
            />
          </div>
          <div className="text-xs text-muted-foreground shrink-0 w-full md:w-auto text-right">
            Total Collections: <strong className="text-foreground">{totalCount}</strong>
          </div>
        </CardContent>
      </Card>

      {/* Table grid */}
      <Card className="bg-card/40 border-border/40 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/20">
            <TableRow className="border-b border-border/20">
              <TableHead className="font-semibold text-muted-foreground">Receipt Date</TableHead>
              <TableHead className="font-semibold text-muted-foreground">Invoice Link</TableHead>
              <TableHead className="font-semibold text-muted-foreground">Client Company</TableHead>
              <TableHead className="font-semibold text-muted-foreground">Payment Method</TableHead>
              <TableHead className="font-semibold text-muted-foreground">Reference / UTR ID</TableHead>
              <TableHead className="font-semibold text-muted-foreground">Internal Notes</TableHead>
              <TableHead className="font-semibold text-muted-foreground text-right">Amount Collected</TableHead>
              <TableHead className="font-semibold text-muted-foreground text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center text-muted-foreground">
                  <span className="animate-spin inline-block mr-2 h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                  Loading payment collections...
                </TableCell>
              </TableRow>
            ) : payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center text-muted-foreground">
                  No payment collections logged.
                </TableCell>
              </TableRow>
            ) : (
              payments.map((p) => (
                <TableRow key={p.id} className="border-b border-border/10 hover:bg-secondary/10 transition-colors">
                  <TableCell className="text-sm">{formatDate(p.paymentDate)}</TableCell>
                  <TableCell className="font-semibold text-primary">
                    <Link href={`/invoices/${p.invoice.id}`} className="hover:underline flex items-center gap-1.5">
                      <Receipt className="h-4 w-4" /> {p.invoice.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-semibold text-foreground">{p.invoice.customer.companyName}</div>
                      <div className="text-[10px] text-muted-foreground">{p.invoice.customer.contactPerson}</div>
                    </div>
                  </TableCell>
                  <TableCell className="uppercase text-xs font-semibold">{p.paymentMethod.replace("_", " ")}</TableCell>
                  <TableCell className="font-mono text-xs text-foreground">{p.referenceNumber || "-"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs truncate" title={p.notes}>
                    {p.notes || "-"}
                  </TableCell>
                  <TableCell className="text-right font-bold text-emerald-400">
                    {formatCurrency(p.amountPaid)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/15"
                      onClick={() => { setSelectedPayment(p); setIsDeleteOpen(true); }}
                      title="Void payment receipt"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
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
            <DialogTitle className="text-destructive font-bold">Void Payment Receipt?</DialogTitle>
            <DialogDescription>
              Are you sure you want to void payment receipt of <strong className="text-foreground">{formatCurrency(selectedPayment?.amountPaid)}</strong> logged on {selectedPayment ? formatDate(selectedPayment.paymentDate) : ""}?
              Voiding this payment will increase the outstanding balance due of invoice {selectedPayment?.invoice.invoiceNumber}.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => { setIsDeleteOpen(false); setSelectedPayment(null); }}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteSubmit}>Void Receipt</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
