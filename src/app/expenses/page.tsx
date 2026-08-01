"use client"

import * as React from "react"
import { Search, PlusCircle, Trash2, Tag, Calendar, User, CreditCard } from "lucide-react"
import { getExpenses, createExpense, deleteExpense } from "@/app/actions/expenses"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { ExpenseCategory, PaymentMethod } from "@prisma/client"

export default function ExpensesPage() {
  const [expenses, setExpenses] = React.useState<any[]>([])
  const [categoryTotals, setCategoryTotals] = React.useState<any[]>([])
  const [query, setQuery] = React.useState("")
  const [filterCategory, setFilterCategory] = React.useState("ALL")
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [totalCount, setTotalCount] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(false)

  // Modals
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [selectedExpense, setSelectedExpense] = React.useState<any>(null)

  // Form Fields
  const [category, setCategory] = React.useState<ExpenseCategory>(ExpenseCategory.OFFICE)
  const [amount, setAmount] = React.useState("")
  const [vendor, setVendor] = React.useState("")
  const [date, setDate] = React.useState(new Date().toISOString().split("T")[0])
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>(PaymentMethod.UPI)
  const [notes, setNotes] = React.useState("")

  const loadExpenses = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getExpenses(filterCategory, query, page, 10)
      setExpenses(data.expenses)
      setCategoryTotals(data.aggregates)
      setTotalPages(data.totalPages)
      setTotalCount(data.totalCount)
    } catch (e) {
      toast.error("Failed to load expenses")
    } finally {
      setIsLoading(false)
    }
  }, [filterCategory, query, page])

  React.useEffect(() => {
    loadExpenses()
  }, [loadExpenses])

  const resetForm = () => {
    setCategory(ExpenseCategory.OFFICE)
    setAmount("")
    setVendor("")
    setDate(new Date().toISOString().split("T")[0])
    setPaymentMethod(PaymentMethod.UPI)
    setNotes("")
    setSelectedExpense(null)
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid expense amount")
      return
    }

    const payload = {
      category,
      amount: amt,
      vendor,
      date: new Date(date),
      paymentMethod,
      notes: notes || undefined
    }

    const res = await createExpense(payload)
    if (res.success) {
      toast.success("Expense logged successfully")
      setIsAddOpen(false)
      resetForm()
      loadExpenses()
    } else {
      toast.error(res.error || "Failed to log expense")
    }
  }

  const handleDeleteSubmit = async () => {
    if (!selectedExpense) return
    const res = await deleteExpense(selectedExpense.id)
    if (res.success) {
      toast.success("Expense log deleted")
      setIsDeleteOpen(false)
      setSelectedExpense(null)
      loadExpenses()
    } else {
      toast.error(res.error || "Failed to delete expense")
    }
  }

  const totalExpenseSum = categoryTotals.reduce((sum, item) => sum + (item._sum.amount || 0), 0)

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto dark">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
            Expenses Tracker
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Log corporate expenditures, run filters by category, and review net profit margins.
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsAddOpen(true); }} className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold gap-1.5 self-start sm:self-auto shadow-lg shadow-primary/20">
          <PlusCircle className="h-4 w-4" /> Log Expense
        </Button>
      </div>

      {/* Overview Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/45 border-border/40 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">Total logged expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-rose-400">{formatCurrency(totalExpenseSum)}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Aggregated sum of all recorded items</p>
          </CardContent>
        </Card>

        {categoryTotals.slice(0, 2).map((item) => (
          <Card key={item.category} className="bg-card/45 border-border/40 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider capitalize">
                {item.category.toLowerCase()} Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(item._sum.amount || 0)}</div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {((item._sum.amount / (totalExpenseSum || 1)) * 100).toFixed(0)}% of total corporate spending
              </p>
            </CardContent>
          </Card>
        ))}
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
                placeholder="Search vendor, notes..."
                className="pl-9 h-10 border-border/60 bg-secondary/10 focus-visible:ring-primary focus-visible:border-primary focus-visible:bg-secondary/20 w-full"
              />
            </div>

            <div className="w-full md:w-48">
              <Select value={filterCategory} onValueChange={(val) => { setFilterCategory(val || "ALL"); setPage(1); }}>
                <SelectTrigger className="border-border/60 bg-secondary/10 h-10">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border/50 text-foreground">
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {Object.values(ExpenseCategory).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.replace("_", " ").toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="text-xs text-muted-foreground shrink-0 w-full md:w-auto text-right">
            Total Logs: <strong className="text-foreground">{totalCount}</strong>
          </div>
        </CardContent>
      </Card>

      {/* Table grid */}
      <Card className="bg-card/40 border-border/40 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/20">
            <TableRow className="border-b border-border/20">
              <TableHead className="font-semibold text-muted-foreground">Category</TableHead>
              <TableHead className="font-semibold text-muted-foreground">Vendor / Supplier</TableHead>
              <TableHead className="font-semibold text-muted-foreground">Receipt Date</TableHead>
              <TableHead className="font-semibold text-muted-foreground">Payment Method</TableHead>
              <TableHead className="font-semibold text-muted-foreground">Description / Notes</TableHead>
              <TableHead className="font-semibold text-muted-foreground text-right">Amount Spent</TableHead>
              <TableHead className="font-semibold text-muted-foreground text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                  <span className="animate-spin inline-block mr-2 h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                  Loading expense ledger...
                </TableCell>
              </TableRow>
            ) : expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                  No expense records logged.
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((e) => (
                <TableRow key={e.id} className="border-b border-border/10 hover:bg-secondary/10 transition-colors">
                  <TableCell className="capitalize text-sm font-semibold text-foreground">
                    {e.category.toLowerCase()}
                  </TableCell>
                  <TableCell className="text-sm">{e.vendor}</TableCell>
                  <TableCell className="text-sm">{formatDate(e.date)}</TableCell>
                  <TableCell className="uppercase text-xs">{e.paymentMethod.replace("_", " ")}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs truncate" title={e.notes}>
                    {e.notes || "-"}
                  </TableCell>
                  <TableCell className="text-right font-bold text-rose-400">
                    {formatCurrency(e.amount)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/15"
                      onClick={() => { setSelectedExpense(e); setIsDeleteOpen(true); }}
                      title="Delete log"
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

      {/* --- ADD EXPENSE MODAL --- */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md bg-card border border-border/50 text-foreground">
          <form onSubmit={handleAddSubmit}>
            <DialogHeader>
              <DialogTitle>Log Business Expense</DialogTitle>
              <DialogDescription>Record a new administrative or operational cost item.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4 text-xs font-semibold text-muted-foreground">
              <div className="space-y-1.5">
                <Label htmlFor="exp_category">Expense Category *</Label>
                <Select
                  value={category}
                  onValueChange={(val) => { if (val) setCategory(val as ExpenseCategory); }}
                >
                  <SelectTrigger className="border-border/60 bg-secondary/10 text-foreground text-xs h-10">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/50 text-foreground">
                    {Object.values(ExpenseCategory).map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.replace("_", " ").toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="exp_amount">Amount Spent (₹) *</Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="exp_amount"
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
                <Label htmlFor="exp_vendor">Paid To (Vendor/Supplier) *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="exp_vendor"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    className="pl-9 h-10 text-foreground"
                    placeholder="E.g. Amazon Web Services, Landlord"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="exp_date">Receipt Date *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="exp_date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="pl-9 h-10 text-foreground"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="exp_method">Payment Method *</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Select
                    value={paymentMethod}
                    onValueChange={(val) => { if (val) setPaymentMethod(val as PaymentMethod); }}
                  >
                    <SelectTrigger className="pl-9 border-border/60 bg-secondary/10 text-foreground text-xs h-10">
                      <SelectValue placeholder="Method" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border/50 text-foreground">
                      <SelectItem value={PaymentMethod.UPI}>UPI (GPay / QR)</SelectItem>
                      <SelectItem value={PaymentMethod.BANK_TRANSFER}>Bank Net Transfer</SelectItem>
                      <SelectItem value={PaymentMethod.CASH}>Cash payment</SelectItem>
                      <SelectItem value={PaymentMethod.CREDIT_CARD}>Credit Card</SelectItem>
                      <SelectItem value={PaymentMethod.DEBIT_CARD}>Debit Card</SelectItem>
                      <SelectItem value={PaymentMethod.CHEQUE}>Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="exp_notes">Remarks / Receipts details</Label>
                <Textarea
                  id="exp_notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Logs or descriptions..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => { setIsAddOpen(false); resetForm(); }}>Cancel</Button>
              <Button type="submit" className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold">Log Cost</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- DELETE CONFIRM MODAL --- */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md bg-card border border-border/50 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-destructive font-bold">Remove Expense Log?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense log of <strong className="text-foreground">{formatCurrency(selectedExpense?.amount)}</strong> paid to {selectedExpense?.vendor}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => { setIsDeleteOpen(false); setSelectedExpense(null); }}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteSubmit}>Delete Log</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
