import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Building,
  Calendar,
  CreditCard,
  Printer,
  Trash2,
  Copy
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { getSettings } from "@/app/actions/settings"
import { formatCurrency, formatDate } from "@/lib/utils"
import { InvoiceStatus } from "@prisma/client"
import { InvoiceActions } from "./invoice-actions" // Interactive client component
import QRCode from "qrcode"

export const revalidate = 0 // force dynamic render

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id } = await params

  const [invoice, settings] = await Promise.all([
    db.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
        payments: true
      }
    }),
    getSettings()
  ])

  if (!invoice) {
    notFound()
  }

  // Calculate totals
  let subtotal = 0
  let totalGst = 0

  invoice.items.forEach((item) => {
    const q = item.quantity
    const p = item.price
    const d = item.discount || 0
    const g = item.gstPercent

    const itemRaw = q * p * (1 - d / 100)

    if (invoice.isGst) {
      totalGst += itemRaw * (g / 100)
    }
    subtotal += itemRaw
  })

  const grandTotal = Math.round(subtotal + totalGst + invoice.shippingCharges - invoice.discount + invoice.roundOff)
  const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amountPaid, 0)
  const remainingDue = Math.max(0, grandTotal - totalPaid)

  // Generate UPI QR Code data URL if UPI VPA is set in Settings
  let qrCodeDataUrl = ""
  if (settings?.accountNumber || settings?.upiQrCodeUrl) {
    const upiId = settings.upiQrCodeUrl
    if (upiId && remainingDue > 0) {
      try {
        const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(settings.companyName)}&am=${remainingDue}&cu=INR`
        qrCodeDataUrl = await QRCode.toDataURL(upiUrl)
      } catch (err) {
        console.error("Failed to generate UPI QR code:", err)
      }
    }
  }

  // Status mapping colors
  const statusColors: Record<InvoiceStatus, string> = {
    PAID: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    PARTIALLY_PAID: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
    PENDING: "bg-red-500/10 text-red-400 border border-red-500/20",
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-5xl mx-auto dark">
      {/* Top action bar - Hidden during print */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print border-b border-border/20 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/invoices" passHref>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              Invoice <span className="text-primary">{invoice.invoiceNumber}</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Customer: {invoice.customer.companyName}
            </p>
          </div>
        </div>

        {/* Dynamic client-side action buttons */}
        <InvoiceActions invoice={invoice} remainingDue={remainingDue} />
      </div>

      {/* Invoice Document Card */}
      <Card className="bg-card/45 border-border/40 backdrop-blur-md relative overflow-hidden shadow-2xl p-6 md:p-12 print-card">
        {/* Company watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden opacity-[0.03]">
          <div className="text-[120px] md:text-[200px] font-black tracking-widest uppercase transform -rotate-45 text-foreground">
            {settings?.companyName || "FUERA"}
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          {/* Header Row */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 pb-6 border-b border-border/20">
            {/* Vendor Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {settings?.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={settings.logoUrl} alt="Logo" className="h-10 max-w-[120px] object-contain" />
                ) : (
                  <Building className="h-8 w-8 text-primary" />
                )}
                <span className="font-black text-2xl tracking-wider text-foreground">
                  {settings?.companyName || "FUERA"}
                </span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="max-w-sm leading-relaxed whitespace-pre-line">{settings?.address}</p>
                {settings?.gstin && <p className="font-medium">GSTIN: <span className="font-mono">{settings.gstin}</span></p>}
                {settings?.pan && <p className="font-medium">PAN: <span className="font-mono">{settings.pan}</span></p>}
                {settings?.cin && <p className="font-medium">CIN: <span className="font-mono">{settings.cin}</span></p>}
              </div>
            </div>

            {/* Invoice Details */}
            <div className="text-left md:text-right space-y-2 self-stretch md:self-auto flex flex-col justify-between md:justify-start items-start md:items-end">
              <div className="text-3xl font-black tracking-widest text-primary uppercase">
                {invoice.isGst ? "TAX INVOICE" : "INVOICE"}
              </div>
              <div className="text-sm font-bold text-foreground">Number: <span className="font-mono">{invoice.invoiceNumber}</span></div>
              <div className="text-xs text-muted-foreground space-y-1 mt-1">
                <div className="flex items-center md:justify-end gap-1.5"><Calendar className="h-3.5 w-3.5" /> Date: {formatDate(invoice.invoiceDate)}</div>
                <div className="flex items-center md:justify-end gap-1.5"><Calendar className="h-3.5 w-3.5 text-rose-400" /> Due Date: {formatDate(invoice.dueDate)}</div>
                <div className="pt-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusColors[invoice.status]}`}>
                    {invoice.status.replace("_", " ").toLowerCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Client Details Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-secondary/10 p-4 rounded-xl border border-border/10">
            <div className="space-y-1.5 text-xs">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Invoice Issued To</span>
              <div className="font-extrabold text-sm text-foreground">{invoice.customer.companyName}</div>
              <div className="font-medium text-muted-foreground">Attn: {invoice.customer.contactPerson}</div>
              <div className="text-muted-foreground">{invoice.customer.email} &bull; {invoice.customer.mobile}</div>
              {invoice.customer.gstNumber && <div className="font-semibold text-muted-foreground">GSTIN: <span className="font-mono">{invoice.customer.gstNumber}</span></div>}
            </div>

            <div className="space-y-1.5 text-xs md:text-right flex flex-col items-start md:items-end">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Shipping & Billing Address</span>
              <div className="text-muted-foreground max-w-xs">{invoice.customer.address}</div>
              <div className="text-muted-foreground">{invoice.customer.city}, {invoice.customer.state} &bull; {invoice.customer.pin}</div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-border/30 rounded-xl overflow-hidden">
            <Table className="text-xs">
              <TableHeader className="bg-secondary/20">
                <TableRow className="border-b border-border/20">
                  <TableHead className="w-10 text-center font-semibold text-muted-foreground">#</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Description of Service/Goods</TableHead>
                  <TableHead className="w-20 font-semibold text-muted-foreground">HSN/SAC</TableHead>
                  <TableHead className="w-16 font-semibold text-muted-foreground text-center">Qty</TableHead>
                  <TableHead className="w-16 font-semibold text-muted-foreground">Unit</TableHead>
                  <TableHead className="w-24 font-semibold text-muted-foreground text-right">Rate</TableHead>
                  <TableHead className="w-16 font-semibold text-muted-foreground text-center">Disc %</TableHead>
                  <TableHead className="w-16 font-semibold text-muted-foreground text-center">GST %</TableHead>
                  <TableHead className="w-28 font-semibold text-muted-foreground text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item, index) => {
                  const itemRaw = item.quantity * item.price * (1 - (item.discount || 0) / 100)
                  return (
                    <TableRow key={item.id} className="border-b border-border/10 hover:bg-transparent">
                      <TableCell className="text-center text-muted-foreground font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div className="font-semibold text-foreground">{item.name}</div>
                        {item.description && <div className="text-[10px] text-muted-foreground leading-relaxed whitespace-pre-line mt-0.5">{item.description}</div>}
                      </TableCell>
                      <TableCell className="font-mono text-[10px]">{item.hsnSac}</TableCell>
                      <TableCell className="text-center font-medium">{item.quantity}</TableCell>
                      <TableCell className="uppercase">{item.unit}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.price)}</TableCell>
                      <TableCell className="text-center">{item.discount || 0}%</TableCell>
                      <TableCell className="text-center">{invoice.isGst ? `${item.gstPercent}%` : "0%"}</TableCell>
                      <TableCell className="text-right font-bold text-foreground">{formatCurrency(itemRaw)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Subtotal and Summary grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-border/10">
            {/* Terms and Spellings */}
            <div className="md:col-span-2 space-y-4">
              <div className="space-y-1">
                <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block">Total Amount in Words</span>
                <p className="text-xs text-foreground italic font-semibold">{invoice.amountInWords}</p>
              </div>

              {invoice.terms && (
                <div className="space-y-1">
                  <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block">Terms & Conditions</span>
                  <p className="text-[10px] text-muted-foreground/80 whitespace-pre-line leading-relaxed border border-border/10 bg-secondary/5 p-3 rounded-lg">
                    {invoice.terms}
                  </p>
                </div>
              )}
              {invoice.notes && (
                <div className="space-y-1 no-print">
                  <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block">Remarks (Private)</span>
                  <p className="text-[10px] text-yellow-300/80 bg-yellow-950/10 border border-yellow-500/10 p-2 rounded-lg">
                    {invoice.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Calculations column */}
            <div className="space-y-2 text-xs font-semibold text-muted-foreground">
              <div className="flex justify-between items-center pb-2 border-b border-border/10">
                <span>Subtotal Base</span>
                <span className="text-foreground">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border/10">
                <span>GST Tax Sum</span>
                <span className="text-foreground">{formatCurrency(totalGst)}</span>
              </div>
              {invoice.shippingCharges > 0 && (
                <div className="flex justify-between items-center pb-2 border-b border-border/10">
                  <span>Shipping Charges</span>
                  <span className="text-foreground">{formatCurrency(invoice.shippingCharges)}</span>
                </div>
              )}
              {invoice.discount > 0 && (
                <div className="flex justify-between items-center pb-2 border-b border-border/10 text-rose-400">
                  <span>Flat Discount</span>
                  <span>&minus;{formatCurrency(invoice.discount)}</span>
                </div>
              )}
              {invoice.roundOff !== 0 && (
                <div className="flex justify-between items-center pb-2 border-b border-border/10 font-normal">
                  <span>Round Off</span>
                  <span className="text-foreground">{invoice.roundOff > 0 ? "+" : ""}{formatCurrency(invoice.roundOff)}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 text-sm text-foreground font-extrabold">
                <span>Grand Total Invoice</span>
                <span className="text-lg text-primary font-black">{formatCurrency(grandTotal)}</span>
              </div>

              <div className="flex justify-between items-center pt-2 text-xs text-muted-foreground">
                <span>Total Paid History</span>
                <span className="text-emerald-400 font-bold">{formatCurrency(totalPaid)}</span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-dashed border-border/20 text-xs font-extrabold text-foreground">
                <span>Net Due Balance</span>
                <span className={`text-sm ${remainingDue > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                  {formatCurrency(remainingDue)}
                </span>
              </div>
            </div>
          </div>

          {/* Payments Receipt History Ledger */}
          {invoice.payments.length > 0 && (
            <div className="no-print border border-border/30 rounded-xl p-4 space-y-3 bg-secondary/5">
              <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-emerald-400" /> Recorded Payment Receipts History
              </h4>
              <div className="overflow-x-auto">
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow className="border-b border-border/15">
                      <TableHead className="font-semibold text-muted-foreground">Receipt Date</TableHead>
                      <TableHead className="font-semibold text-muted-foreground">Method</TableHead>
                      <TableHead className="font-semibold text-muted-foreground">Reference / Tx ID</TableHead>
                      <TableHead className="font-semibold text-muted-foreground">Internal Notes</TableHead>
                      <TableHead className="font-semibold text-muted-foreground text-right">Amount Paid</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.payments.map((p) => (
                      <TableRow key={p.id} className="border-b border-border/5">
                        <TableCell>{formatDate(p.paymentDate)}</TableCell>
                        <TableCell className="uppercase">{p.paymentMethod.replace("_", " ")}</TableCell>
                        <TableCell className="font-mono text-[10px]">{p.referenceNumber || "-"}</TableCell>
                        <TableCell className="max-w-[150px] truncate text-muted-foreground">{p.notes || "-"}</TableCell>
                        <TableCell className="text-right font-bold text-emerald-400">{formatCurrency(p.amountPaid)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Bank details, signature pad, and dynamic payment QR code */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-border/20 items-end">
            {/* Bank details */}
            <div className="text-[11px] text-muted-foreground space-y-1.5 md:col-span-1">
              <span className="text-[9px] font-semibold uppercase tracking-wider block text-muted-foreground mb-1">FUERA Corporate Bank Details</span>
              {settings?.bankName && <p><span className="font-semibold text-foreground">Bank:</span> {settings.bankName}</p>}
              {settings?.accountNumber && <p><span className="font-semibold text-foreground">Account Number:</span> {settings.accountNumber}</p>}
              {settings?.ifscCode && <p><span className="font-semibold text-foreground">IFSC Code:</span> <span className="font-mono font-medium">{settings.ifscCode}</span></p>}
            </div>

            {/* Payment UPI QR Code (Scannable for customer payments) */}
            <div className="flex flex-col items-center md:items-center justify-center p-3 border border-border/10 bg-secondary/5 rounded-xl text-center max-w-[200px] mx-auto md:mx-0">
              {qrCodeDataUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCodeDataUrl} alt="UPI Payment QR" className="h-28 w-28 object-contain" />
                  <span className="text-[8px] text-muted-foreground tracking-wider uppercase font-semibold mt-1.5">Scan to Pay via UPI QR</span>
                </>
              ) : (
                <div className="h-28 w-28 flex items-center justify-center border border-dashed border-border/40 text-muted-foreground text-[9px] p-2 leading-relaxed">
                  UPI VPA not set. Add VPA in Settings to show QR.
                </div>
              )}
            </div>

            {/* Signature Pad Details */}
            <div className="flex flex-col items-start md:items-end text-center md:text-right space-y-2 min-h-[90px] justify-between">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Authorized Signature</span>
              
              {settings?.signatureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={settings.signatureUrl} alt="Signature" className="h-10 max-w-[150px] object-contain mix-blend-multiply dark:mix-blend-normal opacity-90 invert-0 dark:invert" />
              ) : (
                <div className="w-36 border-b border-dashed border-border/60 h-10" />
              )}
              
              <div className="text-[10px] text-muted-foreground">
                <span className="font-bold text-foreground">For {settings?.companyName || "FUERA"}</span>
                <div>Authorized Signatory</div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
