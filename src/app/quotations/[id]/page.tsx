import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Edit2,
  Copy,
  Trash2,
  Printer,
  ArrowRightLeft,
  Building,
  FileCheck,
  Calendar,
  AlertCircle
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
import { QuotationStatus } from "@prisma/client"
import { QuotationActions } from "./quotation-actions" // Client-side client actions component

export const revalidate = 0 // force dynamic render

interface QuotationDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function QuotationDetailPage({ params }: QuotationDetailPageProps) {
  const { id } = await params

  const [quotation, settings] = await Promise.all([
    db.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
        invoice: true
      }
    }),
    getSettings()
  ])

  if (!quotation) {
    notFound()
  }

  // Calculate totals
  let subtotal = 0
  let totalGst = 0

  quotation.items.forEach((item) => {
    const q = item.quantity
    const p = item.price
    const d = item.discount || 0
    const g = item.gstPercent

    const itemRaw = q * p * (1 - d / 100)

    if (quotation.gstInclusive) {
      const base = itemRaw / (1 + g / 100)
      const tax = itemRaw - base
      subtotal += base
      totalGst += tax
    } else {
      subtotal += itemRaw
      totalGst += itemRaw * (g / 100)
    }
  })

  const grandTotal = Math.round(subtotal + totalGst - quotation.discount)

  // Status mapping colors
  const statusColors: Record<QuotationStatus, string> = {
    DRAFT: "bg-gray-500/10 text-gray-400 border border-gray-500/20",
    SENT: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    ACCEPTED: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    REJECTED: "bg-red-500/10 text-red-400 border border-red-500/20",
    EXPIRED: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-5xl mx-auto dark">
      {/* Top action bar - Hidden during print */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print border-b border-border/20 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/quotations" passHref>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              Quotation <span className="text-primary">{quotation.quotationNumber}</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Customer: {quotation.customer.companyName}
            </p>
          </div>
        </div>

        {/* Action components linking to backend operations */}
        <QuotationActions quotation={quotation} />
      </div>

      {/* Already Converted Warning Info Panel */}
      {quotation.invoice && (
        <div className="flex items-center gap-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-4 no-print text-xs">
          <FileCheck className="h-5 w-5 text-emerald-500 shrink-0" />
          <div className="flex-1">
            <span className="font-semibold text-emerald-400">Converted to Invoice</span>
            <p className="text-muted-foreground/80 mt-0.5">
              This quotation was converted into Invoice{" "}
              <Link href={`/invoices/${quotation.invoice.id}`} className="font-bold hover:underline text-primary">
                {quotation.invoice.invoiceNumber}
              </Link>{" "}
              on {formatDate(quotation.invoice.createdAt)}.
            </p>
          </div>
        </div>
      )}

      {/* Printable Quotation Document */}
      <Card className="bg-card/45 border-border/40 backdrop-blur-md relative overflow-hidden shadow-2xl p-6 md:p-12 print-card">
        {/* FUERA diagonal watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden opacity-[0.03]">
          <div className="text-[120px] md:text-[200px] font-black tracking-widest uppercase transform -rotate-45 text-foreground">
            {settings?.companyName || "FUERA"}
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          {/* Header Row */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 pb-6 border-b border-border/20">
            {/* Seller info */}
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

            {/* Document stats */}
            <div className="text-left md:text-right space-y-2 self-stretch md:self-auto flex flex-col justify-between md:justify-start items-start md:items-end">
              <div className="text-3xl font-black tracking-widest text-primary uppercase">QUOTATION</div>
              <div className="text-sm font-bold text-foreground">Number: <span className="font-mono">{quotation.quotationNumber}</span></div>
              <div className="text-xs text-muted-foreground space-y-1 mt-1">
                <div className="flex items-center md:justify-end gap-1.5"><Calendar className="h-3.5 w-3.5" /> Date: {formatDate(quotation.date)}</div>
                <div className="flex items-center md:justify-end gap-1.5"><Calendar className="h-3.5 w-3.5 text-rose-400" /> Valid Until: {formatDate(quotation.validUntil)}</div>
                <div className="pt-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusColors[quotation.status]}`}>
                    {quotation.status.toLowerCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Billing Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-secondary/10 p-4 rounded-xl border border-border/10">
            <div className="space-y-1.5 text-xs">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Quotation Issued To</span>
              <div className="font-extrabold text-sm text-foreground">{quotation.customer.companyName}</div>
              <div className="font-medium text-muted-foreground">Attn: {quotation.customer.contactPerson}</div>
              <div className="text-muted-foreground">{quotation.customer.email} &bull; {quotation.customer.mobile}</div>
              {quotation.customer.gstNumber && <div className="font-semibold text-muted-foreground">GSTIN: <span className="font-mono">{quotation.customer.gstNumber}</span></div>}
            </div>

            <div className="space-y-1.5 text-xs md:text-right flex flex-col items-start md:items-end">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Billing Details Address</span>
              <div className="text-muted-foreground max-w-xs">{quotation.customer.address}</div>
              <div className="text-muted-foreground">{quotation.customer.city}, {quotation.customer.state} &bull; {quotation.customer.pin}</div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-border/30 rounded-xl overflow-hidden">
            <Table className="text-xs">
              <TableHeader className="bg-secondary/20">
                <TableRow className="border-b border-border/20">
                  <TableHead className="w-10 text-center font-semibold text-muted-foreground">#</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Item & Scope Description</TableHead>
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
                {quotation.items.map((item, index) => {
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
                      <TableCell className="text-center">{item.gstPercent}%</TableCell>
                      <TableCell className="text-right font-bold text-foreground">{formatCurrency(itemRaw)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Subtotal and Summary grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-border/10">
            {/* Terms Column */}
            <div className="md:col-span-2 space-y-4">
              {quotation.terms && (
                <div className="space-y-1.5">
                  <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block">Terms & Conditions</span>
                  <p className="text-[10px] text-muted-foreground/80 whitespace-pre-line leading-relaxed border border-border/10 bg-secondary/5 p-3 rounded-lg">
                    {quotation.terms}
                  </p>
                </div>
              )}
              {quotation.notes && (
                <div className="space-y-1.5 no-print">
                  <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block">Internal Remarks (Hidden in Print)</span>
                  <p className="text-[10px] text-yellow-300/80 bg-yellow-950/10 border border-yellow-500/10 p-2.5 rounded-lg whitespace-pre-line">
                    {quotation.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Calculations Column */}
            <div className="space-y-2 text-xs font-semibold text-muted-foreground">
              <div className="flex justify-between items-center pb-2 border-b border-border/10">
                <span>Subtotal Base</span>
                <span className="text-foreground">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border/10">
                <span>GST Tax Sum</span>
                <span className="text-foreground">{formatCurrency(totalGst)}</span>
              </div>
              {quotation.discount > 0 && (
                <div className="flex justify-between items-center pb-2 border-b border-border/10 text-rose-400">
                  <span>Flat Discount</span>
                  <span>&minus;{formatCurrency(quotation.discount)}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 text-sm text-foreground font-extrabold">
                <span className="text-foreground">Grand Total Due</span>
                <span className="text-lg text-primary font-black">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Bank Details, QR code, and Signature Pad details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-border/20 items-end">
            {/* Bank details info */}
            <div className="text-[11px] text-muted-foreground space-y-1.5 md:col-span-2">
              <span className="text-[9px] font-semibold uppercase tracking-wider block text-muted-foreground mb-1">FUERA Corporate Bank Details</span>
              {settings?.bankName && <p><span className="font-semibold text-foreground">Bank:</span> {settings.bankName}</p>}
              {settings?.accountNumber && <p><span className="font-semibold text-foreground">Account Number:</span> {settings.accountNumber}</p>}
              {settings?.ifscCode && <p><span className="font-semibold text-foreground">IFSC Code:</span> <span className="font-mono font-medium">{settings.ifscCode}</span></p>}
            </div>

            {/* Signature sign off */}
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
