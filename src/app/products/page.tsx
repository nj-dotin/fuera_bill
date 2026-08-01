"use client"

import * as React from "react"
import { Search, PlusCircle, Edit2, Trash2, Tag, Percent, ClipboardList, Layers } from "lucide-react"
import { getProducts, createProduct, updateProduct, deleteProduct, toggleProductStatus } from "@/app/actions/products"
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
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"
import { ProductUnit } from "@prisma/client"

export default function ProductsPage() {
  // State
  const [products, setProducts] = React.useState<any[]>([])
  const [categories, setCategories] = React.useState<string[]>(["ALL"])
  const [selectedCategory, setSelectedCategory] = React.useState("ALL")
  const [query, setQuery] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [totalCount, setTotalCount] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(false)

  // Modals
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [selectedProduct, setSelectedProduct] = React.useState<any>(null)

  // Form Fields
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [category, setCategory] = React.useState("")
  const [hsnSac, setHsnSac] = React.useState("")
  const [unit, setUnit] = React.useState<ProductUnit>(ProductUnit.PCS)
  const [price, setPrice] = React.useState("")
  const [gstPercent, setGstPercent] = React.useState("18")
  const [active, setActive] = React.useState(true)

  const loadProducts = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getProducts(query, selectedCategory, page, 8)
      setProducts(data.products)
      setCategories(data.categories)
      setTotalPages(data.totalPages)
      setTotalCount(data.totalCount)
    } catch (e) {
      toast.error("Failed to load catalog items")
    } finally {
      setIsLoading(false)
    }
  }, [query, selectedCategory, page])

  React.useEffect(() => {
    loadProducts()
  }, [loadProducts])

  // Reset form
  const resetForm = () => {
    setName("")
    setDescription("")
    setCategory("")
    setHsnSac("")
    setUnit(ProductUnit.PCS)
    setPrice("")
    setGstPercent("18")
    setActive(true)
    setSelectedProduct(null)
  }

  // Prepopulate
  const populateForm = (p: any) => {
    setSelectedProduct(p)
    setName(p.name)
    setDescription(p.description || "")
    setCategory(p.category)
    setHsnSac(p.hsnSac)
    setUnit(p.unit)
    setPrice(String(p.price))
    setGstPercent(String(p.gstPercent))
    setActive(p.active)
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      name,
      description: description || undefined,
      category,
      hsnSac,
      unit,
      price: parseFloat(price) || 0,
      gstPercent: parseFloat(gstPercent) || 0,
      active
    }

    const res = await createProduct(payload)
    if (res.success) {
      toast.success("Item registered successfully")
      setIsAddOpen(false)
      resetForm()
      loadProducts()
    } else {
      toast.error(res.error || "Failed to register item")
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return

    const payload = {
      name,
      description: description || undefined,
      category,
      hsnSac,
      unit,
      price: parseFloat(price) || 0,
      gstPercent: parseFloat(gstPercent) || 0,
      active
    }

    const res = await updateProduct(selectedProduct.id, payload)
    if (res.success) {
      toast.success("Item updated successfully")
      setIsEditOpen(false)
      resetForm()
      loadProducts()
    } else {
      toast.error(res.error || "Failed to update item")
    }
  }

  const handleDeleteSubmit = async () => {
    if (!selectedProduct) return

    const res = await deleteProduct(selectedProduct.id)
    if (res.success) {
      toast.success("Item deleted from catalog")
      setIsDeleteOpen(false)
      setSelectedProduct(null)
      loadProducts()
    } else {
      toast.error(res.error || "Failed to delete item")
    }
  }

  const handleToggleStatus = async (item: any) => {
    const res = await toggleProductStatus(item.id, item.active)
    if (res.success) {
      toast.success(`Item status set to ${!item.active ? "active" : "inactive"}`)
      loadProducts()
    } else {
      toast.error("Failed to update status")
    }
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto dark">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
            Services & Products
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Build and manage your service rates and physical product inventory.
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsAddOpen(true); }} className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold gap-1.5 self-start sm:self-auto shadow-lg shadow-primary/20">
          <PlusCircle className="h-4 w-4" /> Add Item
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
                placeholder="Search name, description, HSN..."
                className="pl-9 h-10 border-border/60 bg-secondary/10 focus-visible:ring-primary focus-visible:border-primary focus-visible:bg-secondary/20 w-full"
              />
            </div>

            {/* Category selection filter */}
            <div className="w-full md:w-48">
              <Select
                value={selectedCategory}
                onValueChange={(val) => { setSelectedCategory(val || "ALL"); setPage(1); }}
              >
                <SelectTrigger className="border-border/60 bg-secondary/10 h-10">
                  <SelectValue placeholder="Filter Category" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border/50 text-foreground">
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="capitalize">
                      {cat.toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-xs text-muted-foreground shrink-0 w-full md:w-auto text-right">
            Catalog Count: <strong className="text-foreground">{totalCount}</strong>
          </div>
        </CardContent>
      </Card>

      {/* Catalog Table */}
      <Card className="bg-card/40 border-border/40 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/20">
            <TableRow className="border-b border-border/20">
              <TableHead className="font-semibold text-muted-foreground">Name</TableHead>
              <TableHead className="font-semibold text-muted-foreground">Category</TableHead>
              <TableHead className="font-semibold text-muted-foreground">HSN/SAC Code</TableHead>
              <TableHead className="font-semibold text-muted-foreground">Unit</TableHead>
              <TableHead className="font-semibold text-muted-foreground text-right">Price Rate</TableHead>
              <TableHead className="font-semibold text-muted-foreground text-center">Tax GST</TableHead>
              <TableHead className="font-semibold text-muted-foreground text-center">Status</TableHead>
              <TableHead className="font-semibold text-muted-foreground text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center text-muted-foreground">
                  <span className="animate-spin inline-block mr-2 h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                  Loading catalog inventory...
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center text-muted-foreground">
                  No catalog items found.
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => (
                <TableRow key={p.id} className="border-b border-border/10 hover:bg-secondary/10 transition-colors">
                  <TableCell>
                    <div>
                      <div className="font-semibold text-foreground">{p.name}</div>
                      {p.description && <div className="text-xs text-muted-foreground line-clamp-1 max-w-xs">{p.description}</div>}
                    </div>
                  </TableCell>
                  <TableCell className="capitalize text-sm">{p.category.toLowerCase()}</TableCell>
                  <TableCell className="text-xs font-mono">{p.hsnSac}</TableCell>
                  <TableCell className="text-xs font-semibold">{p.unit}</TableCell>
                  <TableCell className="text-right font-bold text-foreground">
                    {formatCurrency(p.price)}
                  </TableCell>
                  <TableCell className="text-center text-xs font-semibold text-muted-foreground">
                    {p.gstPercent}%
                  </TableCell>
                  <TableCell className="text-center">
                    <button
                      onClick={() => handleToggleStatus(p)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase border transition-all ${
                        p.active
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                          : "bg-gray-500/10 text-gray-400 border-gray-500/20 hover:bg-gray-500/20"
                      }`}
                    >
                      {p.active ? "active" : "inactive"}
                    </button>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                        onClick={() => { populateForm(p); setIsEditOpen(true); }}
                        title="Edit Item"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => { setSelectedProduct(p); setIsDeleteOpen(true); }}
                        title="Delete Item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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

      {/* --- ADD MODAL --- */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg bg-card border border-border/50 text-foreground">
          <form onSubmit={handleAddSubmit}>
            <DialogHeader>
              <DialogTitle>Add Catalog Item</DialogTitle>
              <DialogDescription>Create a product or professional service in the ERP catalogue.</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="add_name">Item Name *</Label>
                <div className="relative">
                  <ClipboardList className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="add_name" value={name} onChange={(e) => setName(e.target.value)} className="pl-9" required />
                </div>
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="add_description">Description / Scope Details</Label>
                <Textarea id="add_description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Specify physical specs or scope of service details..." />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add_category">Category *</Label>
                <div className="relative">
                  <Layers className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="add_category" value={category} onChange={(e) => setCategory(e.target.value)} className="pl-9" placeholder="E.g. Consult, Hardware" required />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add_hsnSac">HSN/SAC Code *</Label>
                <Input id="add_hsnSac" value={hsnSac} onChange={(e) => setHsnSac(e.target.value)} placeholder="8-digit HSN or 6-digit SAC" required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add_unit">Unit of Measure *</Label>
                <Select
                  value={unit}
                  onValueChange={(val) => { if (val) setUnit(val as ProductUnit); }}
                >
                  <SelectTrigger className="border-border/60 bg-secondary/10">
                    <SelectValue placeholder="Select Unit" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/50 text-foreground">
                    <SelectItem value={ProductUnit.PCS}>PCS (Pieces)</SelectItem>
                    <SelectItem value={ProductUnit.NOS}>NOS (Numbers)</SelectItem>
                    <SelectItem value={ProductUnit.BOX}>BOX (Boxes)</SelectItem>
                    <SelectItem value={ProductUnit.KGS}>KGS (Kilograms)</SelectItem>
                    <SelectItem value={ProductUnit.LTRS}>LTRS (Litres)</SelectItem>
                    <SelectItem value={ProductUnit.MTRS}>MTRS (Metres)</SelectItem>
                    <SelectItem value={ProductUnit.HOURS}>HOURS (Services Hourly)</SelectItem>
                    <SelectItem value={ProductUnit.DAYS}>DAYS (Services Daily)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add_price">Unit Price (₹) *</Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="add_price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="pl-9" required />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add_gstPercent">GST Tax Rate (%) *</Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Select
                    value={gstPercent}
                    onValueChange={(val) => setGstPercent(val || "18")}
                  >
                    <SelectTrigger className="pl-9 border-border/60 bg-secondary/10">
                      <SelectValue placeholder="Select GST" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border/50 text-foreground">
                      <SelectItem value="0">0% Exempt</SelectItem>
                      <SelectItem value="5">5% SGST/CGST</SelectItem>
                      <SelectItem value="12">12% Standard</SelectItem>
                      <SelectItem value="18">18% Standard</SelectItem>
                      <SelectItem value="28">28% Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5 flex flex-col justify-end pb-1.5">
                <label className="flex items-center gap-2 text-sm font-semibold select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="h-4 w-4 accent-primary rounded border-border"
                  />
                  Set active on catalog
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => { setIsAddOpen(false); resetForm(); }}>Cancel</Button>
              <Button type="submit" className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold">Register Item</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- EDIT MODAL --- */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg bg-card border border-border/50 text-foreground">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Catalog Item</DialogTitle>
              <DialogDescription>Modify catalog configuration for item {name}.</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="edit_name">Item Name *</Label>
                <div className="relative">
                  <ClipboardList className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="edit_name" value={name} onChange={(e) => setName(e.target.value)} className="pl-9" required />
                </div>
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="edit_description">Description</Label>
                <Textarea id="edit_description" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit_category">Category *</Label>
                <div className="relative">
                  <Layers className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="edit_category" value={category} onChange={(e) => setCategory(e.target.value)} className="pl-9" required />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit_hsnSac">HSN/SAC Code *</Label>
                <Input id="edit_hsnSac" value={hsnSac} onChange={(e) => setHsnSac(e.target.value)} required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit_unit">Unit of Measure *</Label>
                <Select
                  value={unit}
                  onValueChange={(val) => { if (val) setUnit(val as ProductUnit); }}
                >
                  <SelectTrigger className="border-border/60 bg-secondary/10">
                    <SelectValue placeholder="Select Unit" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/50 text-foreground">
                    <SelectItem value={ProductUnit.PCS}>PCS (Pieces)</SelectItem>
                    <SelectItem value={ProductUnit.NOS}>NOS (Numbers)</SelectItem>
                    <SelectItem value={ProductUnit.BOX}>BOX (Boxes)</SelectItem>
                    <SelectItem value={ProductUnit.KGS}>KGS (Kilograms)</SelectItem>
                    <SelectItem value={ProductUnit.LTRS}>LTRS (Litres)</SelectItem>
                    <SelectItem value={ProductUnit.MTRS}>MTRS (Metres)</SelectItem>
                    <SelectItem value={ProductUnit.HOURS}>HOURS (Services Hourly)</SelectItem>
                    <SelectItem value={ProductUnit.DAYS}>DAYS (Services Daily)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit_price">Unit Price (₹) *</Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="edit_price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="pl-9" required />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit_gstPercent">GST Tax Rate (%) *</Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Select
                    value={gstPercent}
                    onValueChange={(val) => setGstPercent(val || "18")}
                  >
                    <SelectTrigger className="pl-9 border-border/60 bg-secondary/10">
                      <SelectValue placeholder="Select GST" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border/50 text-foreground">
                      <SelectItem value="0">0% Exempt</SelectItem>
                      <SelectItem value="5">5% SGST/CGST</SelectItem>
                      <SelectItem value="12">12% Standard</SelectItem>
                      <SelectItem value="18">18% Standard</SelectItem>
                      <SelectItem value="28">28% Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5 flex flex-col justify-end pb-1.5">
                <label className="flex items-center gap-2 text-sm font-semibold select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="h-4 w-4 accent-primary rounded border-border"
                  />
                  Set active on catalog
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => { setIsEditOpen(false); resetForm(); }}>Cancel</Button>
              <Button type="submit" className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold">Update Item</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- DELETE CONFIRM MODAL --- */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md bg-card border border-border/50 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-destructive font-bold">Remove Item from Catalog?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete item <strong className="text-foreground">{selectedProduct?.name}</strong>?
              This action will remove the item permanently from the inventory list.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => { setIsDeleteOpen(false); setSelectedProduct(null); }}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteSubmit}>Delete Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
