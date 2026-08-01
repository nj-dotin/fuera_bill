"use client"

import * as React from "react"
import { Search, PlusCircle, Trash2, Calendar, FileText, User, Receipt, Tag } from "lucide-react"
import { getPurchases, createPurchase, deletePurchase, updatePurchaseStatus } from "@/app/actions/purchases"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrency, formatDate } from "@/lib/utils"
import { toast } from "sonner"
import { PurchaseBillStatus } from "@prisma/client"

export default function PurchasesPage() {
  // State
  const [purchases, setPurchases] = React.useState<any[]>([])
  const [query, setQuery] = React.useState("")
  const [filterStatus, setFilterStatus] = React.useState("ALL")
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [totalCount, setTotalCount] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(false)

  // Modals
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [selectedBill, setSelectedBill] = React.useState<any>(null)

  // Form Fields
  const [vendor, setVendor] = React.useState("")
  const [billNumber, setBillNumber] = React.useState("")
  const [date, setDate] = React.useState(new Date().toISOString().split("T")[0])
  const [amount, setAmount] = React.useState("")
  const [gst, setGst] = React.useState("0")
  const [notes, setNotes] = React.useState("")
  const [status, setStatus] = React.useState<PurchaseBillStatus>(PurchaseBillStatus.PENDING)

  const loadPurchases = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getPurchases(filterStatus, query, page, 10)
      setPurchases(data.purchases)
      setTotalPages(data.totalPages)
      setTotalCount(data.totalCount)
    } catch (e) {
      toast.error("Failed to load purchase bills")
    } finally {
      setIsLoading(false)
    }
  }, [filterStatus, query, page])

  React.useEffect(() => {
    loadPurchases()
  }, [loadPurchases])

  const resetForm = () => {
    setVendor("")
    setBillNumber("")
    setDate(new Date().toISOString().split("T")[0])
    setAmount("")
    setGst("0")
    setNotes("")
    setStatus(PurchaseBillStatus.PENDING)
    setSelectedBill(null)
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(amount)
    const gstAmt = parseFloat(gst)
    if (isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid bill amount")
      return
    }

    const payload = {
      vendor,
      billNumber,
      date: new Date(date),
      amount: amt,
      gst: isNaN(gstAmt) ? 0 : gstAmt,
      notes: notes || undefined,
      status
    }

    const res = await createPurchase(payload)
    if (res.success) {
      toast.success("Purchase bill logged successfully")
      setIsAddOpen(false)
      resetForm()
      loadPurchases()
    } else {
      toast.error(res.error || "Failed to log purchase bill")
    }
  }

  const handleToggleStatus = async (bill: any) => {
    const nextStatus = bill.status === PurchaseBillStatus.PAID ? PurchaseBillStatus.PENDING : PurchaseBillStatus.PAID
    const res = await updatePurchaseStatus(bill.id, nextStatus)
    if (res.success) {
      toast.success(`Purchase bill status set to ${nextStatus.toLowerCase()}`)
      loadPurchases()
    } else {
      toast.error("Failed to toggle status")
    }
  }

  const handleDeleteSubmit = async () => {
    if (!selectedBill) return
    const res = await deletePurchase(selectedBill.id)
    if (res.success) {
      toast.success("Purchase bill deleted")
      setIsDeleteOpen(false)
      setSelectedBill(null)
      loadPurchases()
    } else {
      toast.error(res.error || "Failed to delete bill")
    }
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto dark">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
            Purchase Bills
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Log vendor invoices, track outstanding balances, and check input credit tax summaries.
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsAddOpen(true); }} className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold gap-1.5 self-start sm:self-auto shadow-lg shadow-primary/20">
          <PlusCircle className="h-4 w-4" /> Log Purchase Bill
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="bg-card/40 border-border/40 backdrop-blur-md">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4 w-full items-center">
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                placeholder="Search vendor, bill number, notes..."
                className="pl-9 h-10 border-border/60 bg-secondary/10 focus-visible:ring-primary focus-visible:border-primary focus-visible:bg-secondary/20 w-full"
              />
            </div>

            <div className="w-full md:w-48">
              <Select value={filterStatus} onValueChange={(val) => { setFilterStatus(val || "ALL"); setPage(1); }}>
                <SelectTrigger className="border-border/60 bg-secondary/10 h-10">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border/50 text-foreground">
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="text-xs text-muted-foreground shrink-0 w-full md:w-auto text-right">
            Total Bills: <strong className="text-foreground">{totalCount}</strong>
          </div>
        </CardContent>
      </Card>

      {/* Table grid */}
      <Card className="bg-card/40 border-border/40 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/20">
            <TableRow className="border-b border-border/20">
              <TableHead className="font-semibold text-muted-foreground">Vendor / Supplier</TableHead>
              <TableHead className="font-semibold text-muted-foreground">Bill Number</TableHead>
              <TableHead className="font-semibold text-muted-foreground">Bill Date</TableHead>
              <TableHead className="font-semibold text-muted-foreground text-center font-mono">ITC GST Credit</TableHead>
              <TableHead className="font-semibold text-muted-foreground text-center">Status</TableHead>
              <TableHead className="font-semibold text-muted-foreground text-right">Total Amount</TableHead>
              <TableHead className="font-semibold text-muted-foreground text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                  <span className="animate-spin inline-block mr-2 h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                  Loading bills...
                </TableCell>
              </TableRow>
            ) : purchases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                  No vendor bills logged.
                </TableCell>
              </TableRow>
            ) : (
              purchases.map((bill) => (
                <TableRow key={bill.id} className="border-b border-border/10 hover:bg-secondary/10 transition-colors">
                  <TableCell className="font-semibold text-foreground">{bill.vendor}</TableCell>
                  <TableCell className="font-mono text-sm">{bill.billNumber}</TableCell>
                  <TableCell className="text-sm">{formatDate(bill.date)}</TableCell>
                  <TableCell className="text-center font-mono text-xs text-muted-foreground">
                    {bill.gst > 0 ? formatCurrency(bill.gst) : "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    <button
                      onClick={() => handleToggleStatus(bill)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase border transition-all ${
                        bill.status === PurchaseBillStatus.PAID
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                      }`}
                    >
                      {bill.status.toLowerCase()}
                    </button>
                  </TableCell>
                  <TableCell className="text-right font-bold text-foreground">
                    {formatCurrency(bill.amount)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/15"
                      onClick={() => { setSelectedBill(bill); setIsDeleteOpen(true); }}
                      title="Delete bill"
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

      {/* --- ADD BILL MODAL --- */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md bg-card border border-border/50 text-foreground">
          <form onSubmit={handleAddSubmit}>
            <DialogHeader>
              <DialogTitle>Log Purchase Bill</DialogTitle>
              <DialogDescription>Add a vendor bill to log expenses and check GST credits.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4 text-xs font-semibold text-muted-foreground">
              <div className="space-y-1.5">
                <Label htmlFor="pur_vendor">Vendor Company Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="pur_vendor"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    className="pl-9 h-10 text-foreground"
                    placeholder="E.g. Steel Suppliers, Digital Services Ltd."
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pur_billNo">Vendor Bill Number *</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="pur_billNo"
                    value={billNumber}
                    onChange={(e) => setBillNumber(e.target.value)}
                    className="pl-9 h-10 text-foreground font-mono"
                    placeholder="E.g. INV/2026/089"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pur_date">Bill Date *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="pur_date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="pl-9 h-10 text-foreground"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pur_amount">Total Bill Amount (₹) *</Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="pur_amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-9 h-10 text-foreground font-bold text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pur_gst">GST Included in Bill (₹)</Label>
                <Input
                  id="pur_gst"
                  type="number"
                  step="0.01"
                  value={gst}
                  onChange={(e) => setGst(e.target.value)}
                  className="h-10 text-foreground font-mono"
                  placeholder="Total GST amount paid for tax credit"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pur_status">Payment Status</Label>
                <Select
                  value={status}
                  onValueChange={(val) => { if (val) setStatus(val as PurchaseBillStatus); }}
                >
                  <SelectTrigger className="border-border/60 bg-secondary/10 text-foreground text-xs h-10">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/50 text-foreground">
                    <SelectItem value={PurchaseBillStatus.PENDING}>Pending Balance</SelectItem>
                    <SelectItem value={PurchaseBillStatus.PAID}>Paid In Full</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pur_notes">Notes / Remarks</Label>
                <Textarea
                  id="pur_notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Item details or bank reference details..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => { setIsAddOpen(false); resetForm(); }}>Cancel</Button>
              <Button type="submit" className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold">Save Bill</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- DELETE CONFIRM MODAL --- */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md bg-card border border-border/50 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-destructive font-bold">Delete Purchase Bill Log?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete vendor bill <strong className="text-foreground">{selectedBill?.billNumber}</strong> from {selectedBill?.vendor}?
              This action is permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => { setIsDeleteOpen(false); setSelectedBill(null); }}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteSubmit}>Delete Bill</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
