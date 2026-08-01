"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash, Receipt, ArrowLeft, Truck } from "lucide-react"
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
import { createInvoice } from "@/app/actions/invoices"
import { formatCurrency, numberToWords } from "@/lib/utils"
import { toast } from "sonner"

interface InvoiceFormProps {
  customers: any[]
  products: any[]
  nextNumber: string
}

export function InvoiceForm({ customers, products, nextNumber }: InvoiceFormProps) {
  const router = useRouter()

  // State
  const [invoiceNumber, setInvoiceNumber] = React.useState(nextNumber)
  const [invoiceDate, setInvoiceDate] = React.useState(
    new Date().toISOString().split("T")[0]
  )
  const [dueDate, setDueDate] = React.useState(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] // default 15 days due date
  )
  const [customerId, setCustomerId] = React.useState("")
  const [discount, setDiscount] = React.useState("0")
  const [shippingCharges, setShippingCharges] = React.useState("0")
  const [isGst, setIsGst] = React.useState(true)
  const [notes, setNotes] = React.useState("")
  const [terms, setTerms] = React.useState("")

  // Line items state
  const [items, setItems] = React.useState<any[]>([
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
  ])

  const [isLoading, setIsLoading] = React.useState(false)

  // Fetch default terms
  React.useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.defaultTerms) {
          setTerms(data.defaultTerms)
        }
      })
      .catch(() => {})
  }, [])

  // Auto fill details from catalog item
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
      toast.warning("Invoice must have at least 1 item")
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

      // Subtotal before tax and discount
      const itemSub = q * p * (1 - d / 100)
      subtotal += itemSub

      if (isGst) {
        totalGst += itemSub * (g / 100)
      }
    })

    const flatDiscount = parseFloat(discount) || 0
    const shipping = parseFloat(shippingCharges) || 0

    const rawTotal = subtotal + totalGst + shipping - flatDiscount
    const grandTotal = Math.round(rawTotal)
    const roundOff = grandTotal - rawTotal

    return {
      subtotal,
      totalGst,
      roundOff,
      grandTotal,
      words: numberToWords(grandTotal)
    }
  }

  const totals = calculateTotals()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerId) {
      toast.error("Please select a customer")
      return
    }

    // Validate
    const invalidItem = items.find((item) => !item.name.trim() || !item.hsnSac.trim() || parseFloat(item.quantity) <= 0)
    if (invalidItem) {
      toast.error("Please fill Name, HSN, and valid quantity for all items")
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
      invoiceNumber,
      invoiceDate: new Date(invoiceDate),
      dueDate: new Date(dueDate),
      customerId,
      discount: parseFloat(discount) || 0,
      shippingCharges: parseFloat(shippingCharges) || 0,
      isGst,
      notes: notes || undefined,
      terms: terms || undefined,
      items: formattedItems
    }

    try {
      const res = await createInvoice(payload)
      if (res.success) {
        toast.success("Invoice generated successfully!")
        router.push("/invoices")
      } else {
        toast.error(res.error || "Failed to create invoice")
      }
    } catch (err) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => router.push("/invoices")}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold tracking-tight">Generate New Invoice</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice configuration details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card/45 border-border/40 backdrop-blur-md">
            <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="bg-secondary/10 border-border/50 font-semibold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="customerId">Select Customer *</Label>
                <Select value={customerId} onValueChange={(val) => setCustomerId(val || "")}>
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
                <Label htmlFor="invoiceDate">Invoice Date</Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="bg-secondary/10 border-border/50"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="bg-secondary/10 border-border/50"
                  required
                />
              </div>

              <div className="sm:col-span-2 flex items-center justify-between py-2 border-t border-b border-border/10">
                <div className="space-y-0.5">
                  <span className="text-sm font-semibold text-foreground">GST Tax Calculation</span>
                  <p className="text-[10px] text-muted-foreground">Disable for Non-GST invoicing layouts</p>
                </div>
                <input
                  type="checkbox"
                  checked={isGst}
                  onChange={(e) => setIsGst(e.target.checked)}
                  className="h-4.5 w-4.5 accent-primary cursor-pointer"
                />
              </div>
            </CardContent>
          </Card>

          {/* Line items list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Line Items</h3>
              <Button type="button" size="xs" variant="outline" onClick={addItem} className="border-border/60 gap-1 h-7">
                <Plus className="h-3.5 w-3.5" /> Add Row
              </Button>
            </div>

            <Card className="bg-card/45 border-border/40 backdrop-blur-md overflow-x-auto">
              <Table className="min-w-[800px] text-xs">
                <TableHeader className="bg-secondary/20">
                  <TableRow className="border-b border-border/20">
                    <TableHead className="w-1/3">Catalogue Auto-fill / Title</TableHead>
                    <TableHead className="w-24">HSN/SAC</TableHead>
                    <TableHead className="w-16 text-center">Qty</TableHead>
                    <TableHead className="w-20">Unit</TableHead>
                    <TableHead className="w-28 text-right">Rate (₹)</TableHead>
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
                            placeholder="Specifications..."
                            value={item.description}
                            onChange={(e) => handleItemChange(index, "description", e.target.value)}
                            className="text-[10px] min-h-[50px] py-1 px-2.5"
                          />
                        </TableCell>

                        <TableCell className="align-top py-3">
                          <Input
                            value={item.hsnSac}
                            onChange={(e) => handleItemChange(index, "hsnSac", e.target.value)}
                            className="h-8 text-xs font-mono"
                            placeholder="E.g. 9983"
                            required
                          />
                        </TableCell>

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

                        <TableCell className="align-top py-3">
                          <Input
                            value={item.unit}
                            onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                            className="h-8 text-xs uppercase"
                            placeholder="PCS"
                            required
                          />
                        </TableCell>

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

                        <TableCell className="align-top py-3">
                          <Select
                            value={item.gstPercent}
                            onValueChange={(val) => handleItemChange(index, "gstPercent", val || "18")}
                            disabled={!isGst}
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

                        <TableCell className="align-top text-right py-3.5 font-bold text-foreground">
                          {formatCurrency(sub)}
                        </TableCell>

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

        {/* Sidebar Summary details */}
        <div className="space-y-6">
          <Card className="bg-card/45 border-border/40 backdrop-blur-md relative overflow-hidden">
            <div className="h-1.5 w-full bg-primary" />
            <CardHeader className="pb-3 pt-4">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Invoice Summary</CardTitle>
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

              {/* Shipping Charges */}
              <div className="space-y-1.5 py-1">
                <Label htmlFor="shippingCharges" className="text-xs flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" /> Shipping Charges (₹)</Label>
                <Input
                  id="shippingCharges"
                  type="number"
                  value={shippingCharges}
                  onChange={(e) => setShippingCharges(e.target.value)}
                  className="h-8 text-right font-bold text-foreground bg-secondary/15"
                />
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

              {totals.roundOff !== 0 && (
                <div className="flex justify-between items-center pb-2 border-b border-border/10 text-muted-foreground font-normal">
                  <span>Round Off Adjustment</span>
                  <span>{totals.roundOff > 0 ? "+" : ""}{formatCurrency(totals.roundOff)}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t border-border/20">
                <span className="text-sm text-foreground font-bold">Grand Total Invoice</span>
                <span className="text-xl font-black text-primary">{formatCurrency(totals.grandTotal)}</span>
              </div>

              <div className="pt-2 text-[10px] text-muted-foreground leading-normal">
                <span className="font-semibold block text-foreground uppercase tracking-wider text-[8px] mb-0.5">Amount in words:</span>
                <span className="italic">{totals.words}</span>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold h-10 mt-3 shadow-lg shadow-primary/20"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin mr-2 h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                    Creating...
                  </span>
                ) : (
                  "Create Invoice"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Terms & Conditions notes */}
          <Card className="bg-card/45 border-border/40 backdrop-blur-md">
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="terms">Terms & Conditions</Label>
                <Textarea
                  id="terms"
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="Banking terms, late fee schedules, standard terms..."
                  className="min-h-[140px] text-xs leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Internal Remarks (Private)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes about logistics or delivery details..."
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
