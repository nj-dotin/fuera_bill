import * as React from "react"
import Link from "next/link"
import {
  TrendingUp,
  TrendingDown,
  CreditCard,
  Users,
  FileText,
  Receipt,
  PlusCircle,
  Clock,
  AlertTriangle,
  ArrowUpRight
} from "lucide-react"
import { getDashboardData } from "@/app/actions/dashboard"
import { DashboardCharts } from "@/components/dashboard-charts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"

export const revalidate = 0 // force dynamic render

export default async function DashboardPage() {
  const { metrics, recentActivities, chartData, overdueInvoices } = await getDashboardData()

  // Calculate quick notification counts
  const showNotifications = overdueInvoices.length > 0 || metrics.pendingQuotesCount > 0

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto dark">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
            FUERA Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time business insights and quick administrative operations.
          </p>
        </div>

        {/* Quick actions panel */}
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/quotations/new" passHref>
            <Button size="sm" className="bg-primary hover:bg-primary/90 font-semibold gap-1.5 shadow-lg shadow-primary/20">
              <PlusCircle className="h-4 w-4" /> New Quote
            </Button>
          </Link>
          <Link href="/invoices/new" passHref>
            <Button size="sm" variant="outline" className="border-border/60 hover:bg-secondary/40 font-semibold gap-1.5">
              <PlusCircle className="h-4 w-4" /> New Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Notifications / Reminders Panel */}
      {showNotifications && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {overdueInvoices.length > 0 && (
            <div className="flex items-start gap-3 bg-red-950/20 border border-red-500/20 rounded-xl p-4">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-red-400">Overdue Invoices Alert</h4>
                <p className="text-xs text-red-300/80 mt-1">
                  You have {overdueInvoices.length} invoices past their due dates. Outstanding sum:{" "}
                  <span className="font-bold">{formatCurrency(overdueInvoices.reduce((sum, item) => sum + item.balance, 0))}</span>.
                </p>
                <div className="mt-2.5 space-y-1">
                  {overdueInvoices.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-[11px] bg-red-950/30 px-2 py-1 rounded">
                      <Link href={`/invoices/${item.id}`} className="hover:underline text-red-300 font-medium">
                        {item.invoiceNumber}
                      </Link>
                      <span className="text-red-400 font-semibold">{formatCurrency(item.balance)} (Due {formatDate(item.dueDate)})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {metrics.pendingQuotesCount > 0 && (
            <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl p-4">
              <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-primary/95">Pending Quotations Follow-up</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  There are {metrics.pendingQuotesCount} quotations in Draft or Sent status waiting for customer feedback.
                </p>
                <div className="mt-3">
                  <Link href="/quotations">
                    <Button size="xs" variant="link" className="text-primary hover:text-primary/80 font-bold p-0 h-auto">
                      View all quotations &rarr;
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <Card className="bg-card/40 border-border/40 backdrop-blur-md overflow-hidden relative group hover:border-primary/20 transition-all">
          <div className="absolute top-0 right-0 h-16 w-16 bg-primary/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{formatCurrency(metrics.totalRevenue)}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Sum of all collected invoice payments</p>
          </CardContent>
        </Card>

        {/* Outstanding payments */}
        <Card className="bg-card/40 border-border/40 backdrop-blur-md overflow-hidden relative group hover:border-primary/20 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Outstanding Dues</CardTitle>
            <CreditCard className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{formatCurrency(metrics.outstandingAmount)}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Receivables from unpaid invoice balances</p>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card className="bg-card/40 border-border/40 backdrop-blur-md overflow-hidden relative group hover:border-primary/20 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{formatCurrency(metrics.totalExpenses)}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Administrative & operating costs logged</p>
          </CardContent>
        </Card>

        {/* Net Profit */}
        <Card className="bg-card/40 border-border/40 backdrop-blur-md overflow-hidden relative group hover:border-primary/20 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Net Profit</CardTitle>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${metrics.netProfit >= 0 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
              {metrics.netProfit >= 0 ? "SURPLUS" : "DEFICIT"}
            </span>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold tracking-tight ${metrics.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {formatCurrency(metrics.netProfit)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Calculated as: Revenue &minus; Expenses</p>
          </CardContent>
        </Card>
      </div>

      {/* Visual Analytics Plot & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Sales vs Expenses History</h3>
            <span className="text-xs text-muted-foreground">Rolling 6 Months</span>
          </div>
          <DashboardCharts data={chartData} />
        </div>

        {/* Quick Stats Panel */}
        <div className="space-y-4">
          <div className="px-1">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Operational Summary</h3>
          </div>
          <Card className="bg-card/40 border-border/40 backdrop-blur-md">
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-border/20">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Users className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Active Customers</div>
                    <div className="text-[10px] text-muted-foreground">Registered profiles</div>
                  </div>
                </div>
                <div className="text-xl font-bold">{metrics.customersCount}</div>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-border/20">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Receipt className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Fully Paid Invoices</div>
                    <div className="text-[10px] text-muted-foreground">Settled invoices</div>
                  </div>
                </div>
                <div className="text-xl font-bold">{metrics.paidInvoicesCount}</div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <FileText className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Pending Quotes</div>
                    <div className="text-[10px] text-muted-foreground">Awaiting sign off</div>
                  </div>
                </div>
                <div className="text-xl font-bold text-primary">{metrics.pendingQuotesCount}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activities Panel */}
      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider px-1">Recent Activities</h3>
        <Card className="bg-card/40 border-border/40 backdrop-blur-md">
          <CardContent className="p-0">
            {recentActivities.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">No recent activities logged.</div>
            ) : (
              <div className="divide-y divide-border/20">
                {recentActivities.map((act) => (
                  <div key={act.id} className="flex justify-between items-center p-3.5 hover:bg-secondary/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                        act.type === "PAYMENT" ? "bg-emerald-500/10 text-emerald-400" :
                        act.type === "EXPENSE" ? "bg-rose-500/10 text-rose-400" :
                        act.type === "INVOICE" ? "bg-blue-500/10 text-blue-400" :
                        "bg-primary/10 text-primary"
                      }`}>
                        {act.type.substring(0, 3)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{act.title}</div>
                        <div className="text-[10px] text-muted-foreground">{formatDate(act.date)}</div>
                      </div>
                    </div>
                    {act.amount !== null && (
                      <div className={`text-sm font-bold ${
                        act.type === "PAYMENT" ? "text-emerald-400" : "text-rose-400"
                      }`}>
                        {act.type === "PAYMENT" ? "+" : "-"}{formatCurrency(act.amount)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
