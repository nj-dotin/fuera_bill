"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash, FileText, ArrowLeft, PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createQuotation, updateQuotation } from "@/app/actions/quotations"
import { QuotationStatus } from "@prisma/client"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"

interface QuotationFormProps {
  customers: any[]
  products: any[]
  nextNumber: string
  initialData?: any // For editing
}

export function QuotationForm({ customers, products, nextNumber, initialData }: QuotationFormProps) {
  const router = useRouter()
  const isEdit = !!initialData

  // State
  const [quotationNumber, setQuotationNumber] = React.useState(
    initialData?.quotationNumber || nextNumber
  )
  const [date, setDate] = React.useState(
    initialData?.date ? new Date(initialData.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
  )
  const [validUntil, setValidUntil] = React.useState(
    initialData?.validUntil
      ? new Date(initialData.validUntil).toISOString().split("T")[0]
      : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] // default 15 days validity
  )
  const [customerId, setCustomerId] = React.useState(initialData?.customerId || "")
  const [discount, setDiscount] = React.useState(initialData?.discount ? String(initialData.discount) : "0")
  const [gstInclusive, setGstInclusive] = React.useState(initialData?.gstInclusive ?? false)
  const [notes, setNotes] = React.useState(initialData?.notes || "")
  const [terms, setTerms] = React.useState(initialData?.terms || "")
  const [status, setStatus] = React.useState<QuotationStatus>(
    initialData?.status || QuotationStatus.DRAFT
  )

  // Line items state
  const [items, setItems] = React.useState<any[]>(
    initialData?.items?.map((item: any) => ({
      id: item.id || Math.random().toString(),
      name: item.name,
      description: item.description || "",
      hsnSac: item.hsnSac,
      quantity: String(item.quantity),
      unit: item.unit,
      price: String(item.price),
      gstPercent: String(item.gstPercent),
      discount: String(item.discount || 0)
    })) || [
      {
        id: "1",
        name: "",
        description: "",
        hsnSac: "",
        quantity: "1",
        unit: "PCS",
        price: "0",
        gstPercent: "18",
        discount: "0"
      }
    ]
  )

  const [isLoading, setIsLoading] = React.useState(false)

  // Get default company settings (terms) if creating new
  React.useEffect(() => {
    if (!isEdit && !terms) {
      fetch("/api/settings")
        .then((res) => res.json())
        .then((data) => {
          if (data && data.defaultTerms) {
            setTerms(data.defaultTerms)
          }
        })
        .catch(() => {})
    }
  }, [isEdit, terms])

  // Handle product selection to auto fill values
  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return

    const updated = [...items]
    updated[index] = {
      ...updated[index],
      name: product.name,
      description: product.description || "",
      hsnSac: product.hsnSac,
      unit: product.unit,
      price: String(product.price),
      gstPercent: String(product.gstPercent),
    }
    setItems(updated)
  }

  const handleItemChange = (index: number, field: string, value: string) => {
    const updated = [...items]
    updated[index] = {
      ...updated[index],
      [field]: value
    }
    setItems(updated)
  }

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Math.random().toString(),
        name: "",
        description: "",
        hsnSac: "",
        quantity: "1",
        unit: "PCS",
        price: "0",
        gstPercent: "18",
        discount: "0"
      }
    ])
  }

  const removeItem = (index: number) => {
    if (items.length === 1) {
      toast.warning("Quotation must have at least 1 item")
      return
    }
    setItems(items.filter((_, i) => i !== index))
  }

  // Calculate totals
  const calculateTotals = () => {
    let subtotal = 0
    let totalGst = 0

    items.forEach((item) => {
      const q = parseFloat(item.quantity) || 0
      const p = parseFloat(item.price) || 0
      const d = parseFloat(item.discount) || 0
      const g = parseFloat(item.gstPercent) || 0

      // Item total before tax and item-level discount
      const itemRawTotal = q * p * (1 - d / 100)

      if (gstInclusive) {
        // GST is baked into the price
        const baseAmount = itemRawTotal / (1 + g / 100)
        const taxAmount = itemRawTotal - baseAmount
        subtotal += baseAmount
        totalGst += taxAmount
      } else {
        // GST is added on top of the price
        subtotal += itemRawTotal
        totalGst += itemRawTotal * (g / 100)
      }
    })

    const flatDiscount = parseFloat(discount) || 0
    const grandTotal = Math.round(subtotal + totalGst - flatDiscount)

    return {
      subtotal,
      totalGst,
      grandTotal
    }
  }

  const totals = calculateTotals()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerId) {
      toast.error("Please select a customer")
      return
    }

    // Validate line items
    const invalidItem = items.find((item) => !item.name.trim() || !item.hsnSac.trim() || parseFloat(item.quantity) <= 0)
    if (invalidItem) {
      toast.error("Please fill in Name, HSN, and valid quantity for all items")
      return
    }

    setIsLoading(true)

    const formattedItems = items.map((item) => ({
      name: item.name,
      description: item.description || undefined,
      hsnSac: item.hsnSac,
      quantity: parseFloat(item.quantity) || 0,
      unit: item.unit,
      price: parseFloat(item.price) || 0,
      gstPercent: parseFloat(item.gstPercent) || 0,
      discount: parseFloat(item.discount) || 0
    }))

    const payload = {
      quotationNumber,
      date: new Date(date),
      validUntil: new Date(validUntil),
      customerId,
      discount: parseFloat(discount) || 0,
      gstInclusive,
      notes: notes || undefined,
      terms: terms || undefined,
      status,
      items: formattedItems
    }

    try {
      if (isEdit) {
        const res = await updateQuotation(initialData.id, payload)
        if (res.success) {
          toast.success("Quotation updated successfully")
          router.push(`/quotations/${initialData.id}`)
        } else {
          toast.error(res.error || "Failed to update quotation")
        }
      } else {
        const res = await createQuotation(payload)
        if (res.success) {
          toast.success("Quotation generated successfully")
          router.push("/quotations")
        } else {
          toast.error(res.error || "Failed to generate quotation")
        }
      }
    } catch (err) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => (isEdit ? router.push(`/quotations/${initialData.id}`) : router.push("/quotations"))}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold tracking-tight">
            {isEdit ? `Edit Quotation ${quotationNumber}` : "Build New Quotation"}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form builder */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card/45 border-border/40 backdrop-blur-md">
            <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="quotationNumber">Quotation Number</Label>
                <Input
                  id="quotationNumber"
                  value={quotationNumber}
                  onChange={(e) => setQuotationNumber(e.target.value)}
                  className="bg-secondary/10 border-border/50"
                  required
                  disabled={isEdit}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="customerId">Select Customer *</Label>
                <Select value={customerId} onValueChange={(val) => setCustomerId(val || "")} disabled={isEdit}>
                  <SelectTrigger className="border-border/60 bg-secondary/10 h-10">
                    <SelectValue placeholder="Choose client profile" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/50 text-foreground max-h-60 overflow-y-auto">
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.companyName} ({c.contactPerson})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="date">Quotation Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-secondary/10 border-border/50"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="validUntil">Valid Until</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="bg-secondary/10 border-border/50"
                  required
                />
              </div>

              <div className="sm:col-span-2 flex items-center justify-between py-2 border-t border-b border-border/10">
                <div className="space-y-0.5">
                  <span className="text-sm font-semibold text-foreground">GST Inclusive Pricing</span>
                  <p className="text-[10px] text-muted-foreground">Select if catalog prices are tax inclusive</p>
                </div>
                <input
                  type="checkbox"
                  checked={gstInclusive}
                  onChange={(e) => setGstInclusive(e.target.checked)}
                  className="h-4.5 w-4.5 accent-primary cursor-pointer"
                />
              </div>
            </CardContent>
          </Card>

          {/* Interactive Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Line Items Builder</h3>
              <Button type="button" size="xs" variant="outline" onClick={addItem} className="border-border/60 gap-1 h-7">
                <Plus className="h-3.5 w-3.5" /> Add Row
              </Button>
            </div>

            <Card className="bg-card/45 border-border/40 backdrop-blur-md overflow-x-auto">
              <Table className="min-w-[800px] text-xs">
                <TableHeader className="bg-secondary/20">
                  <TableRow className="border-b border-border/20">
                    <TableHead className="w-1/3">Item Catalog Selector / Details</TableHead>
                    <TableHead className="w-24">HSN/SAC</TableHead>
                    <TableHead className="w-16 text-center">Qty</TableHead>
                    <TableHead className="w-20">Unit</TableHead>
                    <TableHead className="w-28 text-right">Price Rate (₹)</TableHead>
                    <TableHead className="w-16 text-center">Disc%</TableHead>
                    <TableHead className="w-20 text-center">GST%</TableHead>
                    <TableHead className="w-28 text-right">Subtotal (₹)</TableHead>
                    <TableHead className="w-10 text-center"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => {
                    const q = parseFloat(item.quantity) || 0
                    const p = parseFloat(item.price) || 0
                    const d = parseFloat(item.discount) || 0
                    const sub = q * p * (1 - d / 100)

                    return (
                      <TableRow key={item.id} className="border-b border-border/10 hover:bg-secondary/5">
                        {/* Selector or name input */}
                        <TableCell className="align-top space-y-1.5 py-3">
                          <Select onValueChange={(val) => { if (val) handleProductSelect(index, val as string); }}>
                            <SelectTrigger className="h-8 border-border/40 bg-secondary/5 text-xs select-none">
                              <SelectValue placeholder="Autofill from catalog..." />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border/50 text-foreground max-h-52 overflow-y-auto">
                              {products.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name} (₹{p.price})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Item name / Title"
                            value={item.name}
                            onChange={(e) => handleItemChange(index, "name", e.target.value)}
                            className="h-8 text-xs"
                            required
                          />
                          <Textarea
                            placeholder="Detailed specifications / scope..."
                            value={item.description}
                            onChange={(e) => handleItemChange(index, "description", e.target.value)}
                            className="text-[10px] min-h-[50px] py-1 px-2.5"
                          />
                        </TableCell>

                        {/* HSN/SAC */}
                        <TableCell className="align-top py-3">
                          <Input
                            value={item.hsnSac}
                            onChange={(e) => handleItemChange(index, "hsnSac", e.target.value)}
                            className="h-8 text-xs font-mono"
                            placeholder="E.g. 9983"
                            required
                          />
                        </TableCell>

                        {/* Quantity */}
                        <TableCell className="align-top py-3">
                          <Input
                            type="number"
                            min="0.01"
                            step="any"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                            className="h-8 text-xs text-center px-1"
                            required
                          />
                        </TableCell>

                        {/* Unit */}
                        <TableCell className="align-top py-3">
                          <Input
                            value={item.unit}
                            onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                            className="h-8 text-xs uppercase"
                            placeholder="PCS"
                            required
                          />
                        </TableCell>

                        {/* Price */}
                        <TableCell className="align-top py-3">
                          <Input
                            type="number"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => handleItemChange(index, "price", e.target.value)}
                            className="h-8 text-xs text-right font-semibold"
                            required
                          />
                        </TableCell>

                        {/* Discount */}
                        <TableCell className="align-top py-3">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discount}
                            onChange={(e) => handleItemChange(index, "discount", e.target.value)}
                            className="h-8 text-xs text-center px-1"
                            required
                          />
                        </TableCell>

                        {/* GST % */}
                        <TableCell className="align-top py-3">
                          <Select
                            value={item.gstPercent}
                            onValueChange={(val) => handleItemChange(index, "gstPercent", val || "18")}
                          >
                            <SelectTrigger className="h-8 border-border/40 bg-secondary/5 text-xs text-center px-1">
                              <SelectValue placeholder="GST" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border/50 text-foreground">
                              <SelectItem value="0">0%</SelectItem>
                              <SelectItem value="5">5%</SelectItem>
                              <SelectItem value="12">12%</SelectItem>
                              <SelectItem value="18">18%</SelectItem>
                              <SelectItem value="28">28%</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>

                        {/* Subtotal */}
                        <TableCell className="align-top text-right py-3.5 font-bold text-foreground">
                          {formatCurrency(sub)}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="align-top text-center py-3">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
                            className="h-8 w-8 text-destructive hover:bg-destructive/15 rounded-md"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Card>
          </div>
        </div>

        {/* Sidebar panels */}
        <div className="space-y-6">
          {/* Summary Card */}
          <Card className="bg-card/45 border-border/40 backdrop-blur-md relative overflow-hidden">
            <div className="h-1.5 w-full bg-primary" />
            <CardHeader className="pb-3 pt-4">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Quotation Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs font-semibold text-muted-foreground">
              <div className="flex justify-between items-center pb-2 border-b border-border/10">
                <span>Subtotal Base</span>
                <span className="text-foreground">{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border/10">
                <span>GST Tax Sum</span>
                <span className="text-foreground">{formatCurrency(totals.totalGst)}</span>
              </div>

              {/* Discount field */}
              <div className="space-y-1.5 py-1">
                <Label htmlFor="discount" className="text-xs">Flat Discount Deduct (₹)</Label>
                <Input
                  id="discount"
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="h-8 text-right font-bold text-foreground bg-secondary/15"
                />
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-border/20">
                <span className="text-sm text-foreground font-bold">Estimated Grand Total</span>
                <span className="text-xl font-black text-primary">{formatCurrency(totals.grandTotal)}</span>
              </div>

              {/* Status input */}
              <div className="space-y-1.5 pt-3 border-t border-border/20">
                <Label htmlFor="status">Quotation Status</Label>
                <Select value={status} onValueChange={(val) => { if (val) setStatus(val as QuotationStatus); }}>
                  <SelectTrigger className="border-border/60 bg-secondary/10 h-9 text-xs text-foreground">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/50 text-foreground">
                    <SelectItem value={QuotationStatus.DRAFT}>Draft</SelectItem>
                    <SelectItem value={QuotationStatus.SENT}>Sent</SelectItem>
                    <SelectItem value={QuotationStatus.ACCEPTED}>Accepted</SelectItem>
                    <SelectItem value={QuotationStatus.REJECTED}>Rejected</SelectItem>
                    <SelectItem value={QuotationStatus.EXPIRED}>Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold h-10 mt-2 shadow-lg shadow-primary/20"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin mr-2 h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                    Saving...
                  </span>
                ) : isEdit ? (
                  "Update Quotation"
                ) : (
                  "Generate Quotation"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Terms & Notes Card */}
          <Card className="bg-card/45 border-border/40 backdrop-blur-md">
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="terms">Terms & Conditions</Label>
                <Textarea
                  id="terms"
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="Payment timelines, late fees, delivery clauses..."
                  className="min-h-[140px] text-xs leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Internal Remarks / Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Not visible on PDF, internal logistics details..."
                  className="min-h-[70px] text-xs"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  )
}
