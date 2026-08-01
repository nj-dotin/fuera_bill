"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Edit2, Copy, Trash2, Printer, ArrowRightLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { duplicateQuotation, deleteQuotation, convertQuotationToInvoice } from "@/app/actions/quotations"
import { toast } from "sonner"

interface QuotationActionsProps {
  quotation: any
}

export function QuotationActions({ quotation }: QuotationActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [isConvertOpen, setIsConvertOpen] = React.useState(false)

  const handleDuplicate = () => {
    startTransition(async () => {
      toast.info("Cloning quotation...")
      const res = await duplicateQuotation(quotation.id)
      if (res.success) {
        toast.success("Quotation duplicated successfully")
        router.push(`/quotations/${res.quotationId}`)
      } else {
        toast.error(res.error || "Failed to duplicate quotation")
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteQuotation(quotation.id)
      if (res.success) {
        toast.success("Quotation deleted successfully")
        setIsDeleteOpen(false)
        router.push("/quotations")
      } else {
        toast.error(res.error || "Failed to delete quotation")
      }
    })
  }

  const handleConvert = () => {
    startTransition(async () => {
      toast.info("Converting quotation to invoice...")
      const res = await convertQuotationToInvoice(quotation.id)
      if (res.success) {
        toast.success("Quotation successfully converted to Invoice!")
        setIsConvertOpen(false)
        router.push(`/invoices/${res.invoiceId}`)
      } else {
        toast.error(res.error || "Failed to convert to invoice")
      }
    })
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {/* Edit quote */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/quotations/${quotation.id}/edit`)}
          className="border-border/60 hover:bg-secondary/40 font-semibold gap-1.5"
          disabled={isPending || quotation.invoice}
        >
          <Edit2 className="h-4 w-4" /> Edit
        </Button>

        {/* Duplicate quote */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleDuplicate}
          className="border-border/60 hover:bg-secondary/40 font-semibold gap-1.5"
          disabled={isPending}
        >
          <Copy className="h-4 w-4" /> Duplicate
        </Button>

        {/* Convert directly to invoice */}
        {!quotation.invoice && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsConvertOpen(true)}
            className="border-primary/40 hover:bg-primary/10 text-primary font-semibold gap-1.5"
            disabled={isPending}
          >
            <ArrowRightLeft className="h-4 w-4" /> Convert to Invoice
          </Button>
        )}

        {/* Print document */}
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="border-border/60 hover:bg-secondary/40 font-semibold gap-1.5"
          disabled={isPending}
        >
          <Printer className="h-4 w-4" /> Print
        </Button>

        {/* Delete quote */}
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

      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md bg-card border border-border/50 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-destructive font-bold">Remove Quotation?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete quotation <strong className="text-foreground">{quotation.quotationNumber}</strong>?
              This action is permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete Quotation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert confirmation dialog */}
      <Dialog open={isConvertOpen} onOpenChange={setIsConvertOpen}>
        <DialogContent className="max-w-md bg-card border border-border/50 text-foreground">
          <DialogHeader>
            <DialogTitle>Convert Quotation to Invoice?</DialogTitle>
            <DialogDescription>
              This will create a new GST Invoice draft using the client details and item rates specified in quotation <strong className="text-foreground">{quotation.quotationNumber}</strong>. The quotation status will be updated to Accepted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setIsConvertOpen(false)}>Cancel</Button>
            <Button className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold" onClick={handleConvert}>Convert to Invoice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
