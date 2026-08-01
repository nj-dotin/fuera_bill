"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  Search,
  PlusCircle,
  Edit2,
  Trash2,
  History,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Receipt,
  FileSpreadsheet
} from "lucide-react"
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, getCustomerDetails } from "@/app/actions/customers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { formatCurrency, formatDate } from "@/lib/utils"
import { toast } from "sonner"

export default function CustomersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeCustomerId = searchParams.get("id")

  // State
  const [customers, setCustomers] = React.useState<any[]>([])
  const [query, setQuery] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [totalCount, setTotalCount] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(false)

  // Modals state
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false)

  // Selected active items
  const [selectedCustomer, setSelectedCustomer] = React.useState<any>(null)
  const [historyData, setHistoryData] = React.useState<any>(null)
  const [isHistoryLoading, setIsHistoryLoading] = React.useState(false)

  // Form Fields
  const [companyName, setCompanyName] = React.useState("")
  const [contactPerson, setContactPerson] = React.useState("")
  const [mobile, setMobile] = React.useState("")
  const [whatsapp, setWhatsapp] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [gstNumber, setGstNumber] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [city, setCity] = React.useState("")
  const [state, setState] = React.useState("")
  const [pin, setPin] = React.useState("")
  const [notes, setNotes] = React.useState("")

  // Fetch Customers
  const loadCustomers = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getCustomers(query, page, 8)
      setCustomers(data.customers)
      setTotalPages(data.totalPages)
      setTotalCount(data.totalCount)
    } catch (e) {
      toast.error("Failed to load customers")
    } finally {
      setIsLoading(false)
    }
  }, [query, page])

  React.useEffect(() => {
    loadCustomers()
  }, [loadCustomers])

  // Load history detail if ID in URL
  React.useEffect(() => {
    if (activeCustomerId) {
      loadHistory(activeCustomerId)
    }
  }, [activeCustomerId])

  const loadHistory = async (id: string) => {
    setIsHistoryLoading(true)
    setIsHistoryOpen(true)
    try {
      const details = await getCustomerDetails(id)
      if (details) {
        setHistoryData(details)
      } else {
        toast.error("Customer not found")
        setIsHistoryOpen(false)
        router.push("/customers")
      }
    } catch (e) {
      toast.error("Failed to load customer history")
      setIsHistoryOpen(false)
    } finally {
      setIsHistoryLoading(false)
    }
  }

  // Resets
  const resetForm = () => {
    setCompanyName("")
    setContactPerson("")
    setMobile("")
    setWhatsapp("")
    setEmail("")
    setGstNumber("")
    setAddress("")
    setCity("")
    setState("")
    setPin("")
    setNotes("")
    setSelectedCustomer(null)
  }

  // Prepopulate form
  const populateForm = (c: any) => {
    setSelectedCustomer(c)
    setCompanyName(c.companyName)
    setContactPerson(c.contactPerson)
    setMobile(c.mobile)
    setWhatsapp(c.whatsapp || "")
    setEmail(c.email)
    setGstNumber(c.gstNumber || "")
    setAddress(c.address)
    setCity(c.city)
    setState(c.state)
    setPin(c.pin)
    setNotes(c.notes || "")
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      companyName,
      contactPerson,
      mobile,
      whatsapp: whatsapp || undefined,
      email,
      gstNumber: gstNumber || undefined,
      address,
      city,
      state,
      pin,
      notes: notes || undefined
    }

    const res = await createCustomer(payload)
    if (res.success) {
      toast.success("Customer registered successfully")
      setIsAddOpen(false)
      resetForm()
      loadCustomers()
    } else {
      toast.error(res.error || "Failed to create customer")
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer) return

    const payload = {
      companyName,
      contactPerson,
      mobile,
      whatsapp: whatsapp || undefined,
      email,
      gstNumber: gstNumber || undefined,
      address,
      city,
      state,
      pin,
      notes: notes || undefined
    }

    const res = await updateCustomer(selectedCustomer.id, payload)
    if (res.success) {
      toast.success("Customer updated successfully")
      setIsEditOpen(false)
      resetForm()
      loadCustomers()
    } else {
      toast.error(res.error || "Failed to update customer")
    }
  }

  const handleDeleteSubmit = async () => {
    if (!selectedCustomer) return

    const res = await deleteCustomer(selectedCustomer.id)
    if (res.success) {
      toast.success("Customer profile deleted")
      setIsDeleteOpen(false)
      setSelectedCustomer(null)
      loadCustomers()
      if (activeCustomerId === selectedCustomer.id) {
        router.push("/customers")
      }
    } else {
      toast.error(res.error || "Failed to delete customer")
    }
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto dark">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
            Customer Directory
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your client CRM records, contact profiles, and transaction logs.
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsAddOpen(true); }} className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold gap-1.5 self-start sm:self-auto shadow-lg shadow-primary/20">
          <PlusCircle className="h-4 w-4" /> Register Customer
        </Button>
      </div>

      {/* Search and Stats bar */}
      <Card className="bg-card/40 border-border/40 backdrop-blur-md">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search company, person, mobile, email..."
              className="pl-9 h-10 border-border/60 bg-secondary/10 focus-visible:ring-primary focus-visible:border-primary focus-visible:bg-secondary/20 w-full"
            />
          </div>
          <div className="text-xs text-muted-foreground flex gap-4 shrink-0">
            <span>Total Records: <strong className="text-foreground">{totalCount}</strong></span>
          </div>
        </CardContent>
      </Card>

      {/* Customer Directory Table */}
      <Card className="bg-card/40 border-border/40 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/20">
            <TableRow className="border-b border-border/20">
              <TableHead className="font-semibold text-muted-foreground">Company Name</TableHead>
              <TableHead className="font-semibold text-muted-foreground">Contact Person</TableHead>
              <TableHead className="font-semibold text-muted-foreground">Phone & WhatsApp</TableHead>
              <TableHead className="font-semibold text-muted-foreground">Email</TableHead>
              <TableHead className="font-semibold text-muted-foreground">GSTIN</TableHead>
              <TableHead className="font-semibold text-muted-foreground text-right">LTV Revenue</TableHead>
              <TableHead className="font-semibold text-muted-foreground text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                  <span className="animate-spin inline-block mr-2 h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                  Loading customers list...
                </TableCell>
              </TableRow>
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                  No customers found matching &ldquo;{query}&rdquo;
                </TableCell>
              </TableRow>
            ) : (
              customers.map((c) => (
                <TableRow key={c.id} className="border-b border-border/10 hover:bg-secondary/10 transition-colors">
                  <TableCell className="font-semibold text-foreground">{c.companyName}</TableCell>
                  <TableCell className="text-sm">{c.contactPerson}</TableCell>
                  <TableCell className="text-sm">
                    <div>{c.mobile}</div>
                    {c.whatsapp && <div className="text-[10px] text-green-400">WA: {c.whatsapp}</div>}
                  </TableCell>
                  <TableCell className="text-sm">{c.email}</TableCell>
                  <TableCell className="text-xs font-mono">{c.gstNumber || "-"}</TableCell>
                  <TableCell className="text-right font-bold text-emerald-400">
                    {formatCurrency(c.totalRevenue)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary hover:bg-primary/10"
                        onClick={() => router.push(`/customers?id=${c.id}`)}
                        title="View History"
                      >
                        <History className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                        onClick={() => { populateForm(c); setIsEditOpen(true); }}
                        title="Edit Customer"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => { setSelectedCustomer(c); setIsDeleteOpen(true); }}
                        title="Delete Customer"
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
        <DialogContent className="max-w-xl bg-card border border-border/50 text-foreground overflow-y-auto max-h-[90vh]">
          <form onSubmit={handleAddSubmit}>
            <DialogHeader>
              <DialogTitle>Register Customer</DialogTitle>
              <DialogDescription>Add a new company profile to your database.</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="add_companyName">Company Name *</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="add_companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="pl-9" required />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add_contactPerson">Contact Person *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="add_contactPerson" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className="pl-9" required />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add_email">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="add_email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" required />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add_mobile">Mobile Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="add_mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} className="pl-9" placeholder="E.g. +91 9876543210" required />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add_whatsapp">WhatsApp Number</Label>
                <Input id="add_whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="If different from mobile" />
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="add_gstNumber">GSTIN (Optional)</Label>
                <Input id="add_gstNumber" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} placeholder="15-digit GSTIN format" />
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="add_address">Billing Address *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea id="add_address" value={address} onChange={(e) => setAddress(e.target.value)} className="pl-9 min-h-[70px]" required />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add_city">City *</Label>
                <Input id="add_city" value={city} onChange={(e) => setCity(e.target.value)} required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add_state">State *</Label>
                <Input id="add_state" value={state} onChange={(e) => setState(e.target.value)} required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add_pin">PIN Code *</Label>
                <Input id="add_pin" value={pin} onChange={(e) => setPin(e.target.value)} required />
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="add_notes">Notes / Requirements</Label>
                <Textarea id="add_notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special requests or details..." />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => { setIsAddOpen(false); resetForm(); }}>Cancel</Button>
              <Button type="submit" className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold">Save Customer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- EDIT MODAL --- */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-xl bg-card border border-border/50 text-foreground overflow-y-auto max-h-[90vh]">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Customer Profile</DialogTitle>
              <DialogDescription>Modify info for company {companyName}.</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="edit_companyName">Company Name *</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="edit_companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="pl-9" required />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit_contactPerson">Contact Person *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="edit_contactPerson" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className="pl-9" required />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit_email">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="edit_email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" required />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit_mobile">Mobile Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="edit_mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} className="pl-9" required />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit_whatsapp">WhatsApp Number</Label>
                <Input id="edit_whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="edit_gstNumber">GSTIN</Label>
                <Input id="edit_gstNumber" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} />
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="edit_address">Billing Address *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea id="edit_address" value={address} onChange={(e) => setAddress(e.target.value)} className="pl-9 min-h-[70px]" required />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit_city">City *</Label>
                <Input id="edit_city" value={city} onChange={(e) => setCity(e.target.value)} required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit_state">State *</Label>
                <Input id="edit_state" value={state} onChange={(e) => setState(e.target.value)} required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit_pin">PIN Code *</Label>
                <Input id="edit_pin" value={pin} onChange={(e) => setPin(e.target.value)} required />
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="edit_notes">Notes</Label>
                <Textarea id="edit_notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => { setIsEditOpen(false); resetForm(); }}>Cancel</Button>
              <Button type="submit" className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold">Update Profile</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- DELETE CONFIRM MODAL --- */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md bg-card border border-border/50 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-destructive font-bold">Delete Customer Profile?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete customer <strong className="text-foreground">{selectedCustomer?.companyName}</strong>?
              This action will remove their contact info and notes permanently. Their invoices and quotes will be deleted recursively.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => { setIsDeleteOpen(false); setSelectedCustomer(null); }}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteSubmit}>Delete Profile</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- HISTORY & LTV LEDGER DIALOG --- */}
      <Dialog open={isHistoryOpen} onOpenChange={(open) => {
        if (!open) {
          setIsHistoryOpen(false);
          setHistoryData(null);
          router.push("/customers");
        }
      }}>
        <DialogContent className="max-w-4xl bg-card border border-border/50 text-foreground overflow-y-auto max-h-[90vh] p-6">
          {isHistoryLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-sm text-muted-foreground">
              <span className="animate-spin mb-4 h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
              Loading client history ledger...
            </div>
          ) : !historyData ? (
            <div className="text-center py-10 text-muted-foreground">History unavailable.</div>
          ) : (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <DialogTitle className="text-2xl font-bold">{historyData.companyName}</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                      Client History Ledger & LTV aggregates.
                    </DialogDescription>
                  </div>
                  <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-right self-stretch md:self-auto flex md:flex-col justify-between md:justify-center items-center md:items-end">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">LTV Lifetime Revenue</span>
                    <span className="text-2xl font-extrabold text-emerald-400">{formatCurrency(historyData.totalRevenue)}</span>
                  </div>
                </div>
              </DialogHeader>

              {/* Client Contact Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-secondary/15 p-4 rounded-xl border border-border/20 text-xs">
                <div className="space-y-2">
                  <div className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> <span className="font-semibold text-foreground">Contact:</span> {historyData.contactPerson}</div>
                  <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> <span className="font-semibold text-foreground">Phone:</span> {historyData.mobile} {historyData.whatsapp && <span className="text-emerald-400">(WA: {historyData.whatsapp})</span>}</div>
                  <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> <span className="font-semibold text-foreground">Email:</span> {historyData.email}</div>
                  <div className="flex items-center gap-2"><FileSpreadsheet className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> <span className="font-semibold text-foreground">GSTIN:</span> <span className="font-mono">{historyData.gstNumber || "-"}</span></div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground">Billing Address:</span>
                      <div>{historyData.address}</div>
                      <div>{historyData.city}, {historyData.state} &bull; PIN {historyData.pin}</div>
                    </div>
                  </div>
                  {historyData.notes && (
                    <div className="border-t border-border/10 pt-2 mt-2">
                      <span className="font-semibold text-foreground">Internal Notes:</span>
                      <p className="text-muted-foreground mt-0.5">{historyData.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Transaction lists (Quotes & Invoices) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Invoices List */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-primary" /> Invoice History ({historyData.invoices?.length || 0})
                  </h4>
                  <div className="border border-border/30 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                    {historyData.invoices?.length === 0 ? (
                      <div className="p-4 text-center text-xs text-muted-foreground">No invoices generated yet.</div>
                    ) : (
                      <Table className="text-xs">
                        <TableHeader className="bg-secondary/10">
                          <TableRow className="border-b border-border/10">
                            <TableHead className="font-semibold">Invoice No</TableHead>
                            <TableHead className="font-semibold">Date</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="font-semibold text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {historyData.invoices.map((inv: any) => {
                            // Calculate invoice totals
                            let subtotal = 0
                            let tax = 0
                            inv.items.forEach((item: any) => {
                              const itemSub = item.price * item.quantity * (1 - item.discount / 100)
                              subtotal += itemSub
                              if (inv.isGst) {
                                tax += itemSub * (item.gstPercent / 100)
                              }
                            })
                            const total = Math.round(subtotal + tax + inv.shippingCharges - inv.discount + inv.roundOff)
                            return (
                              <TableRow key={inv.id} className="border-b border-border/5 hover:bg-secondary/5 transition-colors cursor-pointer" onClick={() => navigateTo(`/invoices/${inv.id}`)}>
                                <TableCell className="font-semibold hover:underline text-primary">{inv.invoiceNumber}</TableCell>
                                <TableCell>{formatDate(inv.invoiceDate)}</TableCell>
                                <TableCell>
                                  <span className={`px-1 py-0.2 rounded text-[9px] uppercase ${
                                    inv.status === "PAID" ? "bg-green-500/10 text-green-400" :
                                    inv.status === "PARTIALLY_PAID" ? "bg-yellow-500/10 text-yellow-400" :
                                    "bg-red-500/10 text-red-400"
                                  }`}>
                                    {inv.status.replace("_", " ").toLowerCase()}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right font-bold">{formatCurrency(total)}</TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </div>

                {/* Quotations List */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" /> Quotation History ({historyData.quotations?.length || 0})
                  </h4>
                  <div className="border border-border/30 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                    {historyData.quotations?.length === 0 ? (
                      <div className="p-4 text-center text-xs text-muted-foreground">No quotations built yet.</div>
                    ) : (
                      <Table className="text-xs">
                        <TableHeader className="bg-secondary/10">
                          <TableRow className="border-b border-border/10">
                            <TableHead className="font-semibold">Quote No</TableHead>
                            <TableHead className="font-semibold">Valid Until</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {historyData.quotations.map((q: any) => (
                            <TableRow key={q.id} className="border-b border-border/5 hover:bg-secondary/5 transition-colors cursor-pointer" onClick={() => navigateTo(`/quotations/${q.id}`)}>
                              <TableCell className="font-semibold hover:underline text-primary">{q.quotationNumber}</TableCell>
                              <TableCell>{formatDate(q.validUntil)}</TableCell>
                              <TableCell>
                                <span className={`px-1 py-0.2 rounded text-[9px] uppercase ${
                                  q.status === "ACCEPTED" ? "bg-green-500/10 text-green-400" :
                                  q.status === "DRAFT" ? "bg-gray-500/10 text-gray-400" :
                                  q.status === "REJECTED" ? "bg-red-500/10 text-red-400" :
                                  "bg-primary/10 text-primary"
                                }`}>
                                  {q.status.toLowerCase()}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-border/20">
                <Button variant="outline" onClick={() => { setIsHistoryOpen(false); setHistoryData(null); router.push("/customers"); }}>Close Ledger</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )

  function navigateTo(path: string) {
    setIsHistoryOpen(false)
    setHistoryData(null)
    router.push(path)
  }
}
