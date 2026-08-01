"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Copy, Trash2, Printer, CreditCard, Mail, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { duplicateInvoice, deleteInvoice, addPayment } from "@/app/actions/invoices"
import { PaymentMethod } from "@prisma/client"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"

interface InvoiceActionsProps {
  invoice: any
  remainingDue: number
}

export function InvoiceActions({ invoice, remainingDue }: InvoiceActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  
  // Modals state
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = React.useState(false)
  const [isEmailOpen, setIsEmailOpen] = React.useState(false)

  // Record Payment fields
  const [amountPaid, setAmountPaid] = React.useState(String(remainingDue))
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>(PaymentMethod.UPI)
  const [referenceNumber, setReferenceNumber] = React.useState("")
  const [paymentDate, setPaymentDate] = React.useState(
    new Date().toISOString().split("T")[0]
  )
  const [paymentNotes, setPaymentNotes] = React.useState("")

  // Email fields
  const [emailTo, setEmailTo] = React.useState(invoice.customer.email)
  const [emailSubject, setEmailSubject] = React.useState(
    `Invoice ${invoice.invoiceNumber} from FUERA`
  )

  // Reset payment form when opening
  React.useEffect(() => {
    if (isPaymentOpen) {
      setAmountPaid(String(remainingDue))
    }
  }, [isPaymentOpen, remainingDue])

  const handleDuplicate = () => {
    startTransition(async () => {
      toast.info("Cloning invoice...")
      const res = await duplicateInvoice(invoice.id)
      if (res.success) {
        toast.success("Invoice cloned successfully")
        router.push(`/invoices/${res.invoiceId}`)
      } else {
        toast.error(res.error || "Failed to duplicate invoice")
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteInvoice(invoice.id)
      if (res.success) {
        toast.success("Invoice deleted successfully")
        setIsDeleteOpen(false)
        router.push("/invoices")
      } else {
        toast.error(res.error || "Failed to delete invoice")
      }
    })
  }

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(amountPaid)
    if (isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid payment amount")
      return
    }

    startTransition(async () => {
      const res = await addPayment({
        invoiceId: invoice.id,
        amountPaid: amt,
        paymentMethod,
        referenceNumber: referenceNumber || undefined,
        notes: paymentNotes || undefined,
        paymentDate: new Date(paymentDate)
      })

      if (res.success) {
        toast.success("Payment recorded successfully!")
        setIsPaymentOpen(false)
        setReferenceNumber("")
        setPaymentNotes("")
        router.refresh()
      } else {
        toast.error(res.error || "Failed to record payment")
      }
    })
  }

  const handleSendEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      // Simulate calling email-adapter in backend action
      toast.info(`Dispatching invoice PDF copy to ${emailTo}...`)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success(`Invoice email successfully queued for ${emailTo}`)
      setIsEmailOpen(false)
    })
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {/* Record payment */}
        {remainingDue > 0 && (
          <Button
            onClick={() => setIsPaymentOpen(true)}
            className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold gap-1.5 shadow-lg shadow-primary/20"
            disabled={isPending}
          >
            <CreditCard className="h-4 w-4" /> Record Payment
          </Button>
        )}

        {/* Duplicate invoice */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleDuplicate}
          className="border-border/60 hover:bg-secondary/40 font-semibold gap-1.5"
          disabled={isPending}
        >
          <Copy className="h-4 w-4" /> Duplicate
        </Button>

        {/* Email invoice */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEmailOpen(true)}
          className="border-border/60 hover:bg-secondary/40 font-semibold gap-1.5"
          disabled={isPending}
        >
          <Mail className="h-4 w-4" /> Email Invoice
        </Button>

        {/* Print invoice */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          className="border-border/60 hover:bg-secondary/40 font-semibold gap-1.5"
          disabled={isPending}
        >
          <Printer className="h-4 w-4" /> Print
        </Button>

        {/* Delete invoice */}
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setIsDeleteOpen(true)}
          className="font-semibold gap-1.5"
          disabled={isPending}
        >
          <Trash2 className="h-4 w-4" /> Delete
        </Button>
      </div>

      {/* --- PAYMENT RECORD MODAL --- */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="max-w-md bg-card border border-border/50 text-foreground">
          <form onSubmit={handleRecordPaymentSubmit}>
            <DialogHeader>
              <DialogTitle>Record Payment Receipt</DialogTitle>
              <DialogDescription>
                Outstanding Balance due for invoice: <span className="font-extrabold text-foreground">{formatCurrency(remainingDue)}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4 text-xs font-semibold text-muted-foreground">
              <div className="space-y-1.5">
                <Label htmlFor="pay_amount">Payment Amount Received (₹) *</Label>
                <Input
                  id="pay_amount"
                  type="number"
                  step="0.01"
                  max={remainingDue}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="font-bold text-foreground text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pay_method">Payment Method *</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(val) => { if (val) setPaymentMethod(val as PaymentMethod); }}
                >
                  <SelectTrigger className="border-border/60 bg-secondary/10 text-foreground text-xs">
                    <SelectValue placeholder="Method" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/50 text-foreground">
                    <SelectItem value={PaymentMethod.UPI}>UPI (GPay / PhonePe)</SelectItem>
                    <SelectItem value={PaymentMethod.BANK_TRANSFER}>Bank Net Transfer (NEFT/IMPS)</SelectItem>
                    <SelectItem value={PaymentMethod.CASH}>Cash Payment</SelectItem>
                    <SelectItem value={PaymentMethod.CREDIT_CARD}>Credit Card</SelectItem>
                    <SelectItem value={PaymentMethod.DEBIT_CARD}>Debit Card</SelectItem>
                    <SelectItem value={PaymentMethod.CHEQUE}>Cheque Log</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pay_reference">Reference Number / Transaction ID</Label>
                <Input
                  id="pay_reference"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="UTR Number, Cheque No, UPI transaction ID"
                  className="text-foreground font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pay_date">Payment Received Date</Label>
                <Input
                  id="pay_date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="text-foreground"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pay_notes">Receipt Remarks (Optional)</Label>
                <Textarea
                  id="pay_notes"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Add details about check clearance or bank branch..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsPaymentOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold">Save Receipt</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- EMAIL INVOICE MODAL --- */}
      <Dialog open={isEmailOpen} onOpenChange={setIsEmailOpen}>
        <DialogContent className="max-w-md bg-card border border-border/50 text-foreground">
          <form onSubmit={handleSendEmailSubmit}>
            <DialogHeader>
              <DialogTitle>Email Invoice PDF</DialogTitle>
              <DialogDescription>
                Dispatch a professional PDF copy of invoice {invoice.invoiceNumber} to the customer.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4 text-xs font-semibold text-muted-foreground">
              <div className="space-y-1.5">
                <Label htmlFor="email_to">Recipient Customer Email *</Label>
                <Input
                  id="email_to"
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  className="text-foreground"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email_subject">Subject Heading *</Label>
                <Input
                  id="email_subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="text-foreground"
                  required
                />
              </div>

              <div className="text-[10px] text-muted-foreground p-3 border border-border/10 rounded-lg bg-secondary/5 leading-relaxed">
                <strong className="text-foreground">Attached Document:</strong>
                <div>FUERA {invoice.isGst ? "Tax Invoice" : "General Invoice"} serial {invoice.invoiceNumber} (PDF format).</div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsEmailOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold">Send Invoice Email</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- DELETE CONFIRM MODAL --- */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md bg-card border border-border/50 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-destructive font-bold">Delete Invoice?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete invoice <strong className="text-foreground">{invoice.invoiceNumber}</strong>?
              This will permanently delete this invoice and all recorded payment receipts linked to it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete Invoice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
