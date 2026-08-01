"use client"

import * as React from "react"
import Link from "next/link"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import {
  BarChart3,
  Calendar,
  FileDown,
  Printer,
  TrendingUp,
  TrendingDown,
  Percent,
  Users,
  AlertCircle
} from "lucide-react"
import { getReportsData } from "@/app/actions/reports"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency, formatDate } from "@/lib/utils"
import { toast } from "sonner"

export default function ReportsPage() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = React.useState(currentYear)
  const [data, setData] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  const loadReports = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const reportData = await getReportsData(year)
      setData(reportData)
    } catch (e) {
      toast.error("Failed to load reports")
    } finally {
      setIsLoading(false)
    }
  }, [year])

  React.useEffect(() => {
    loadReports()
  }, [loadReports])

  // Helpers to download CSV files
  const downloadCSV = (filename: string, csvContent: string) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 1. Export Customer Performance to CSV
  const exportCustomersToCSV = () => {
    if (!data?.customerPerformance) return
    let csv = "Company Name,Contact Person,Total Sales (INR),Total Collected (INR),Outstanding (INR)\n"
    data.customerPerformance.forEach((c: any) => {
      csv += `"${c.companyName}","${c.contactPerson}",${c.salesAmount},${c.collectedAmount},${c.outstandingAmount}\n`
    })
    downloadCSV(`FUERA_Customer_Report_${year}.csv`, csv)
    toast.success("Customer report downloaded")
  }

  // 2. Export Expenses Summary to CSV
  const exportExpensesToCSV = () => {
    if (!data?.expenseBreakdown) return
    let csv = "Expense Category,Amount Spent (INR)\n"
    data.expenseBreakdown.forEach((e: any) => {
      csv += `"${e.category}",${e.amount}\n`
    })
    downloadCSV(`FUERA_Expense_Report_${year}.csv`, csv)
    toast.success("Expense report downloaded")
  }

  // 3. Export Monthly Performance to CSV
  const exportMonthlyToCSV = () => {
    if (!data?.monthlySummary) return
    let csv = "Month,Sales (INR),Collected (INR),Expenses (INR),Purchases (INR),Net Margin (INR)\n"
    data.monthlySummary.forEach((m: any) => {
      const margin = m.collected - m.expenses
      csv += `"${m.month}",${m.sales},${m.collected},${m.expenses},${m.purchases},${margin}\n`
    })
    downloadCSV(`FUERA_Performance_Report_${year}.csv`, csv)
    toast.success("Performance report downloaded")
  }

  // Aggregate stats
  const totalSales = data?.monthlySummary?.reduce((sum: number, m: any) => sum + m.sales, 0) || 0
  const totalCollected = data?.monthlySummary?.reduce((sum: number, m: any) => sum + m.collected, 0) || 0
  const totalExpenses = data?.monthlySummary?.reduce((sum: number, m: any) => sum + m.expenses, 0) || 0
  const netOperatingProfit = totalCollected - totalExpenses

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto dark">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/20 pb-4 no-print">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
            Business Reports
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review detailed reports on sales, collections, taxes, outstanding dues, and expenses.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="w-32">
            <Select value={String(year)} onValueChange={(val) => { if (val) setYear(Number(val)); }}>
              <SelectTrigger className="border-border/60 bg-secondary/10 h-9 text-xs">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border/50 text-foreground">
                <SelectItem value={String(currentYear)}>{currentYear}</SelectItem>
                <SelectItem value={String(currentYear - 1)}>{currentYear - 1}</SelectItem>
                <SelectItem value={String(currentYear - 2)}>{currentYear - 2}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.print()} className="border-border/60 gap-1.5 h-9 font-semibold">
            <Printer className="h-4 w-4" /> Print PDF
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-40 text-sm text-muted-foreground">
          <span className="animate-spin mb-4 h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          Compiling business reports...
        </div>
      ) : !data ? (
        <div className="text-center py-20 text-muted-foreground">Reports compilation failed.</div>
      ) : (
        <>
          {/* Print Title Block */}
          <div className="hidden print-only text-center pb-6 border-b border-border/30 mb-8">
            <h1 className="text-3xl font-black tracking-widest text-foreground">FUERA BUSINESS REPORT</h1>
            <h2 className="text-lg text-primary font-bold tracking-wider mt-1">FINANCIAL PERFORMANCE YEAR {year}</h2>
          </div>

          {/* Core Analytics Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-card/45 border-border/40 backdrop-blur-md">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Invoice Sales</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight text-primary">{formatCurrency(totalSales)}</div>
                <p className="text-[10px] text-muted-foreground mt-1">Sum of all generated invoice values</p>
              </CardContent>
            </Card>

            <Card className="bg-card/45 border-border/40 backdrop-blur-md">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payments Collected</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight text-emerald-400">{formatCurrency(totalCollected)}</div>
                <p className="text-[10px] text-muted-foreground mt-1">Cash flow input received</p>
              </CardContent>
            </Card>

            <Card className="bg-card/45 border-border/40 backdrop-blur-md">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight text-rose-400">{formatCurrency(totalExpenses)}</div>
                <p className="text-[10px] text-muted-foreground mt-1">Administrative and operation costs</p>
              </CardContent>
            </Card>

            <Card className="bg-card/45 border-border/40 backdrop-blur-md">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Net Operating Surplus</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold tracking-tight ${netOperatingProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {formatCurrency(netOperatingProfit)}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Calculated as: Collections &minus; Expenses</p>
              </CardContent>
            </Card>
          </div>

          {/* Interactive Report Tabs - Tab controls hidden in print */}
          <Tabs defaultValue="monthly" className="space-y-6">
            <TabsList className="bg-secondary/20 border border-border/40 p-1 rounded-lg no-print">
              <TabsTrigger value="monthly" className="text-xs py-1.5 px-3">Monthly Summary</TabsTrigger>
              <TabsTrigger value="customers" className="text-xs py-1.5 px-3">Client CRM Sales</TabsTrigger>
              <TabsTrigger value="gst" className="text-xs py-1.5 px-3">GST Tax Ledger</TabsTrigger>
              <TabsTrigger value="expenses" className="text-xs py-1.5 px-3">Expense Ledgers</TabsTrigger>
              <TabsTrigger value="outstanding" className="text-xs py-1.5 px-3">Receivables</TabsTrigger>
            </TabsList>

            {/* TAB: Monthly Summary */}
            <TabsContent value="monthly" className="space-y-6">
              {/* Sales vs Expenses chart */}
              <div className="no-print">
                <Card className="bg-card/45 border-border/40 backdrop-blur-md p-4">
                  <CardHeader className="px-1 pb-4">
                    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Collections vs Expenses Trend</CardTitle>
                  </CardHeader>
                  <div className="w-full h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.monthlySummary}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} />
                        <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: "#1e1e20", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px" }} />
                        <Legend iconType="circle" formatter={(v) => <span className="text-xs capitalize">{v}</span>} />
                        <Bar dataKey="collected" name="collections" fill="oklch(0.58 0.23 24)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expenses" name="expenses" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              {/* Monthly Ledger Table */}
              <Card className="bg-card/45 border-border/40 backdrop-blur-md overflow-hidden print-card">
                <CardHeader className="flex flex-row items-center justify-between no-print border-b border-border/10 pb-3">
                  <div>
                    <CardTitle className="text-sm font-bold uppercase tracking-wider">Annual Monthly Performance</CardTitle>
                    <CardDescription className="text-xs">Timeline log of monthly transactions.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={exportMonthlyToCSV} className="border-border/60 gap-1.5 text-xs h-8">
                    <FileDown className="h-4 w-4" /> Export CSV
                  </Button>
                </CardHeader>

                <Table className="text-xs">
                  <TableHeader className="bg-secondary/20">
                    <TableRow className="border-b border-border/20">
                      <TableHead className="font-semibold text-muted-foreground">Month</TableHead>
                      <TableHead className="font-semibold text-muted-foreground text-right">Invoiced Sales</TableHead>
                      <TableHead className="font-semibold text-muted-foreground text-right">Collected Payments</TableHead>
                      <TableHead className="font-semibold text-muted-foreground text-right">Expenses</TableHead>
                      <TableHead className="font-semibold text-muted-foreground text-right">Purchases</TableHead>
                      <TableHead className="font-semibold text-muted-foreground text-right">Net Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.monthlySummary.map((m: any) => {
                      const margin = m.collected - m.expenses
                      return (
                        <TableRow key={m.monthIndex} className="border-b border-border/10">
                          <TableCell className="font-semibold text-foreground">{m.month} {year}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(m.sales)}</TableCell>
                          <TableCell className="text-right font-medium text-emerald-400">{formatCurrency(m.collected)}</TableCell>
                          <TableCell className="text-right font-medium text-rose-400">{formatCurrency(m.expenses)}</TableCell>
                          <TableCell className="text-right font-medium text-muted-foreground">{formatCurrency(m.purchases)}</TableCell>
                          <TableCell className={`text-right font-bold ${margin >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {formatCurrency(margin)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            {/* TAB: Client CRM Sales */}
            <TabsContent value="customers" className="space-y-6">
              <Card className="bg-card/45 border-border/40 backdrop-blur-md overflow-hidden print-card">
                <CardHeader className="flex flex-row items-center justify-between no-print border-b border-border/10 pb-3">
                  <div>
                    <CardTitle className="text-sm font-bold uppercase tracking-wider">Client LTV Ledger</CardTitle>
                    <CardDescription className="text-xs">Ranked analysis of client lifetime purchases.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={exportCustomersToCSV} className="border-border/60 gap-1.5 text-xs h-8">
                    <FileDown className="h-4 w-4" /> Export CSV
                  </Button>
                </CardHeader>

                <Table className="text-xs">
                  <TableHeader className="bg-secondary/20">
                    <TableRow className="border-b border-border/20">
                      <TableHead className="font-semibold text-muted-foreground">Customer Company</TableHead>
                      <TableHead className="font-semibold text-muted-foreground">Contact Person</TableHead>
                      <TableHead className="font-semibold text-muted-foreground text-right">Invoiced Sales</TableHead>
                      <TableHead className="font-semibold text-muted-foreground text-right">Collected Sum</TableHead>
                      <TableHead className="font-semibold text-muted-foreground text-right">Outstanding Dues</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.customerPerformance.map((c: any) => (
                      <TableRow key={c.customerId} className="border-b border-border/10">
                        <TableCell className="font-semibold text-foreground">{c.companyName}</TableCell>
                        <TableCell>{c.contactPerson}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(c.salesAmount)}</TableCell>
                        <TableCell className="text-right font-medium text-emerald-400">{formatCurrency(c.collectedAmount)}</TableCell>
                        <TableCell className={`text-right font-bold ${c.outstandingAmount > 0 ? "text-yellow-400" : "text-muted-foreground"}`}>
                          {formatCurrency(c.outstandingAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            {/* TAB: GST Ledger */}
            <TabsContent value="gst" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-card/45 border-border/40 backdrop-blur-md">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">GST Output Tax (Invoices)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{formatCurrency(data.gstSummary.gstCollected)}</div>
                    <p className="text-[10px] text-muted-foreground mt-1">Tax collected on sales</p>
                  </CardContent>
                </Card>

                <Card className="bg-card/45 border-border/40 backdrop-blur-md">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">GST Input Tax Credit (ITC)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{formatCurrency(data.gstSummary.gstPaid)}</div>
                    <p className="text-[10px] text-muted-foreground mt-1">Tax paid on purchases/expenses</p>
                  </CardContent>
                </Card>

                <Card className="bg-card/45 border-border/40 backdrop-blur-md">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Net Liability</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-black ${data.gstSummary.netGstLiability >= 0 ? "text-primary" : "text-emerald-400"}`}>
                      {formatCurrency(Math.abs(data.gstSummary.netGstLiability))}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {data.gstSummary.netGstLiability >= 0 ? "Liability payable to government" : "Eligible refunds credit"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Informative GST banner */}
              <div className="flex items-start gap-3 bg-secondary/10 border border-border/30 rounded-xl p-4 text-xs no-print">
                <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="text-muted-foreground space-y-1">
                  <span className="font-semibold text-foreground">Tax Input Credit Warning</span>
                  <p>
                    Values are aggregated solely from invoices and logged purchase bills containing valid GST variables.
                    Ensure PAN/GSTIN numbers are updated inside company settings to ensure compliance on PDFs.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* TAB: Expenses breakdown */}
            <TabsContent value="expenses" className="space-y-6">
              <Card className="bg-card/45 border-border/40 backdrop-blur-md overflow-hidden print-card">
                <CardHeader className="flex flex-row items-center justify-between no-print border-b border-border/10 pb-3">
                  <div>
                    <CardTitle className="text-sm font-bold uppercase tracking-wider">Expense Categories Breakdown</CardTitle>
                    <CardDescription className="text-xs">Category aggregations ranking corporate costs.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={exportExpensesToCSV} className="border-border/60 gap-1.5 text-xs h-8">
                    <FileDown className="h-4 w-4" /> Export CSV
                  </Button>
                </CardHeader>

                <Table className="text-xs">
                  <TableHeader className="bg-secondary/20">
                    <TableRow className="border-b border-border/20">
                      <TableHead className="font-semibold text-muted-foreground">Expense Category</TableHead>
                      <TableHead className="font-semibold text-muted-foreground text-right">Sum Spent (INR)</TableHead>
                      <TableHead className="font-semibold text-muted-foreground text-right">Share Ratio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.expenseBreakdown.map((e: any) => (
                      <TableRow key={e.category} className="border-b border-border/10">
                        <TableCell className="capitalize font-semibold text-foreground">
                          {e.category.replace("_", " ").toLowerCase()}
                        </TableCell>
                        <TableCell className="text-right font-bold text-rose-400">{formatCurrency(e.amount)}</TableCell>
                        <TableCell className="text-right font-medium text-muted-foreground">
                          {((e.amount / (totalExpenses || 1)) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            {/* TAB: Outstanding receivables */}
            <TabsContent value="outstanding" className="space-y-6">
              <Card className="bg-card/45 border-border/40 backdrop-blur-md overflow-hidden print-card">
                <CardHeader className="border-b border-border/10 pb-3">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider">Overdue Accounts Receivables</CardTitle>
                  <CardDescription className="text-xs">Unpaid client invoices logs.</CardDescription>
                </CardHeader>

                <Table className="text-xs">
                  <TableHeader className="bg-secondary/20">
                    <TableRow className="border-b border-border/20">
                      <TableHead className="font-semibold text-muted-foreground">Invoice No</TableHead>
                      <TableHead className="font-semibold text-muted-foreground">Client Company</TableHead>
                      <TableHead className="font-semibold text-muted-foreground">Issued Date</TableHead>
                      <TableHead className="font-semibold text-muted-foreground">Due Date</TableHead>
                      <TableHead className="font-semibold text-muted-foreground text-right">Grand Total</TableHead>
                      <TableHead className="font-semibold text-muted-foreground text-right">Outstanding Dues</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.outstandingInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                          Great! No outstanding balances. All accounts are settled.
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.outstandingInvoices.map((inv: any) => (
                        <TableRow key={inv.invoiceId} className="border-b border-border/10">
                          <TableCell className="font-semibold text-primary">
                            <Link href={`/invoices/${inv.invoiceId}`} className="hover:underline">
                              {inv.invoiceNumber}
                            </Link>
                          </TableCell>
                          <TableCell className="font-semibold text-foreground">{inv.companyName}</TableCell>
                          <TableCell>{formatDate(inv.invoiceDate)}</TableCell>
                          <TableCell className="text-rose-400 font-semibold">{formatDate(inv.dueDate)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(inv.grandTotal)}</TableCell>
                          <TableCell className="text-right font-bold text-rose-400">{formatCurrency(inv.dueAmount)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
