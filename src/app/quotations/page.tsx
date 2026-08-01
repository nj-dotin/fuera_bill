"use client"

import * as React from "react"
import Link from "next/link"
import { Search, PlusCircle, Eye, Copy, Trash2, FileText, ChevronRight } from "lucide-react"
import { getQuotations, deleteQuotation, duplicateQuotation } from "@/app/actions/quotations"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function QuotationsPage() {
  const router = useRouter()
  const [quotations, setQuotations] = React.useState<any[]>([])
  const [query, setQuery] = React.useState("")
  const [status, setStatus] = React.useState("ALL")
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [totalCount, setTotalCount] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(false)

  // Deletion Modal
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
  const [selectedQuote, setSelectedQuote] = React.useState<any>(null)

  const loadQuotations = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getQuotations(query, status, page, 8)
      setQuotations(data.quotations)
      setTotalPages(data.totalPages)
      setTotalCount(data.totalCount)
    } catch (e) {
      toast.error("Failed to load quotations")
    } finally {
      setIsLoading(false)
    }
  }, [query, status, page])

  React.useEffect(() => {
    loadQuotations()
  }, [loadQuotations])

  const handleDeleteSubmit = async () => {
    if (!selectedQuote) return
    const res = await deleteQuotation(selectedQuote.id)
    if (res.success) {
      toast.success("Quotation deleted")
      setIsDeleteOpen(false)
      setSelectedQuote(null)
      loadQuotations()
    } else {
      toast.error(res.error || "Failed to delete quotation")
    }
  }

  const handleDuplicate = async (id: string) => {
    toast.info("Cloning quotation...")
    const res = await duplicateQuotation(id)
    if (res.success) {
      toast.success("Quotation cloned successfully")
      router.push(`/quotations/${res.quotationId}`)
    } else {
      toast.error(res.error || "Failed to clone quotation")
    }
  }

  const getStatusBadgeClass = (s: string) => {
    switch (s) {
      case "ACCEPTED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      case "REJECTED":
        return "bg-red-500/10 text-red-400 border-red-500/20"
      case "DRAFT":
        return "bg-gray-500/10 text-gray-400 border-gray-500/20"
      case "SENT":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      case "EXPIRED":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20"
      default:
        return "bg-secondary text-secondary-foreground"
    }
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto dark">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
            Quotations Builder
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Build, track status, and convert customer proposals into invoices.
          </p>
        </div>
        <Link href="/quotations/new" passHref>
          <Button className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold gap-1.5 self-start sm:self-auto shadow-lg shadow-primary/20">
            <PlusCircle className="h-4 w-4" /> Build Quotation
          </Button>
        </Link>
      </div>

      {/* Filters Bar */}
      <Card className="bg-card/40 border-border/40 backdrop-blur-md">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4 w-full items-center">
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                placeholder="Search quote number, company name..."
                className="pl-9 h-10 border-border/60 bg-secondary/10 focus-visible:ring-primary focus-visible:border-primary focus-visible:bg-secondary/20 w-full"
              />
            </div>

            <div className="w-full md:w-48">
              <Select value={status} onValueChange={(val) => { setStatus(val || "ALL"); setPage(1); }}>
                <SelectTrigger className="border-border/60 bg-secondary/10 h-10">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border/50 text-foreground">
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="ACCEPTED">Accepted</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="text-xs text-muted-foreground shrink-0 w-full md:w-auto text-right">
            Total Quotes: <strong className="text-foreground">{totalCount}</strong>
          </div>
        </CardContent>
      </Card>

      {/* Directory Table */}
      <Card className="bg-card/40 border-border/40 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/20">
            <TableRow className="border-b border-border/20">
              <TableHead className="font-semibold text-muted-foreground">Quote Number</TableHead>
              <TableHead className="font-semibold text-muted-foreground">Customer Company</TableHead>
              <TableHead className="font-semibold text-muted-foreground">Date Generated</TableHead>
              <TableHead className="font-semibold text-muted-foreground">Valid Until</TableHead>
              <TableHead className="font-semibold text-muted-foreground text-center">Status</TableHead>
              <TableHead className="font-semibold text-muted-foreground text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                  <span className="animate-spin inline-block mr-2 h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                  Loading quotations...
                </TableCell>
              </TableRow>
            ) : quotations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                  No quotations created yet. Click &ldquo;Build Quotation&rdquo; to start.
                </TableCell>
              </TableRow>
            ) : (
              quotations.map((q) => (
                <TableRow key={q.id} className="border-b border-border/10 hover:bg-secondary/10 transition-colors">
                  <TableCell className="font-semibold text-primary">
                    <Link href={`/quotations/${q.id}`} className="hover:underline flex items-center gap-1.5">
                      <FileText className="h-4 w-4" /> {q.quotationNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-semibold text-foreground">{q.customer.companyName}</div>
                      <div className="text-xs text-muted-foreground">{q.customer.contactPerson}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(q.date)}</TableCell>
                  <TableCell className="text-sm">
                    <span className={new Date(q.validUntil) < new Date() && q.status === "SENT" ? "text-amber-500 font-semibold" : ""}>
                      {formatDate(q.validUntil)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${getStatusBadgeClass(q.status)}`}>
                      {q.status.toLowerCase()}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Link href={`/quotations/${q.id}`} passHref>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" title="View details">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                        onClick={() => handleDuplicate(q.id)}
                        title="Duplicate Quote"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => { setSelectedQuote(q); setIsDeleteOpen(true); }}
                        title="Delete Quote"
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

      {/* --- DELETE CONFIRM MODAL --- */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md bg-card border border-border/50 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-destructive font-bold">Remove Quotation?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete quotation <strong className="text-foreground">{selectedQuote?.quotationNumber}</strong>?
              This action is permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => { setIsDeleteOpen(false); setSelectedQuote(null); }}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteSubmit}>Delete Quotation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
