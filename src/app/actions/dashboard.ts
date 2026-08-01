"use server"

import { db } from "@/lib/db"
import { InvoiceStatus, QuotationStatus } from "@prisma/client"

export async function getDashboardData() {
  try {
    const [
      customersCount,
      pendingQuotesCount,
      paidInvoicesCount,
      payments,
      expenses,
      invoices,
      quotations,
      purchases
    ] = await Promise.all([
      db.customer.count(),
      db.quotation.count({ where: { status: { in: [QuotationStatus.DRAFT, QuotationStatus.SENT] } } }),
      db.invoice.count({ where: { status: InvoiceStatus.PAID } }),
      db.payment.findMany({ include: { invoice: true } }),
      db.expense.findMany(),
      db.invoice.findMany({ include: { items: true, payments: true } }),
      db.quotation.findMany({ include: { customer: true } }),
      db.purchaseBill.findMany()
    ])

    // 1. Total Revenue = Sum of all payments
    const totalRevenue = payments.reduce((sum, p) => sum + p.amountPaid, 0)

    // 2. Total Expenses
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

    // 3. Outstanding Payments
    // Outstanding = Sum of (Invoice Grand Total - Total Paid for that invoice) for non-PAID invoices
    let outstandingAmount = 0
    invoices.forEach((inv) => {
      if (inv.status !== InvoiceStatus.PAID) {
        let subtotal = 0
        let tax = 0
        inv.items.forEach((item) => {
          const itemSub = item.price * item.quantity * (1 - item.discount / 100)
          subtotal += itemSub
          if (inv.isGst) {
            tax += itemSub * (item.gstPercent / 100)
          }
        })
        const grandTotal = Math.round(subtotal + tax + inv.shippingCharges - inv.discount + inv.roundOff)
        const paid = inv.payments.reduce((sum, p) => sum + p.amountPaid, 0)
        outstandingAmount += Math.max(0, grandTotal - paid)
      }
    })

    // 4. Net Profit
    const netProfit = totalRevenue - totalExpenses

    // 5. Recent Activities
    // We combine recent Invoices, Quotations, Expenses, and Payments into a unified timeline
    const activities: any[] = []

    invoices.slice(0, 5).forEach((inv) => {
      activities.push({
        id: `inv-${inv.id}`,
        type: "INVOICE",
        title: `Invoice ${inv.invoiceNumber} created`,
        amount: null,
        date: inv.createdAt,
      })
    })

    quotations.slice(0, 5).forEach((q) => {
      activities.push({
        id: `q-${q.id}`,
        type: "QUOTATION",
        title: `Quotation ${q.quotationNumber} is ${q.status.toLowerCase()}`,
        amount: null,
        date: q.createdAt,
      })
    })

    payments.slice(0, 5).forEach((p) => {
      activities.push({
        id: `pay-${p.id}`,
        type: "PAYMENT",
        title: `Payment received for ${p.invoice.invoiceNumber}`,
        amount: p.amountPaid,
        date: p.paymentDate,
      })
    })

    expenses.slice(0, 5).forEach((e) => {
      activities.push({
        id: `exp-${e.id}`,
        type: "EXPENSE",
        title: `Expense logged: ${e.vendor} (${e.category.toLowerCase()})`,
        amount: e.amount,
        date: e.date,
      })
    })

    // Sort activities by date descending
    const sortedActivities = activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8)

    // 6. Monthly Sales Chart Data (last 6 months)
    const chartDataMap: { [key: string]: { month: string; sales: number; expenses: number } } = {}
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    // Seed last 6 months
    const today = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      chartDataMap[key] = {
        month: `${monthNames[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`,
        sales: 0,
        expenses: 0
      }
    }

    // Populate Sales
    invoices.forEach((inv) => {
      const invDate = new Date(inv.invoiceDate)
      const key = `${invDate.getFullYear()}-${String(invDate.getMonth() + 1).padStart(2, "0")}`
      if (chartDataMap[key]) {
        let subtotal = 0
        let tax = 0
        inv.items.forEach((item) => {
          const itemSub = item.price * item.quantity * (1 - item.discount / 100)
          subtotal += itemSub
          if (inv.isGst) {
            tax += itemSub * (item.gstPercent / 100)
          }
        })
        const grandTotal = Math.round(subtotal + tax + inv.shippingCharges - inv.discount + inv.roundOff)
        chartDataMap[key].sales += grandTotal
      }
    })

    // Populate Expenses
    expenses.forEach((exp) => {
      const expDate = new Date(exp.date)
      const key = `${expDate.getFullYear()}-${String(expDate.getMonth() + 1).padStart(2, "0")}`
      if (chartDataMap[key]) {
        chartDataMap[key].expenses += exp.amount
      }
    })

    const chartData = Object.keys(chartDataMap)
      .sort()
      .map((key) => chartDataMap[key])

    // Overdue alerts (Invoices overdue today)
    const overdueInvoices = invoices
      .filter((inv) => inv.status !== InvoiceStatus.PAID && new Date(inv.dueDate) < today)
      .map((inv) => {
        let subtotal = 0
        let tax = 0
        inv.items.forEach((item) => {
          const itemSub = item.price * item.quantity * (1 - item.discount / 100)
          subtotal += itemSub
          if (inv.isGst) {
            tax += itemSub * (item.gstPercent / 100)
          }
        })
        const grandTotal = Math.round(subtotal + tax + inv.shippingCharges - inv.discount + inv.roundOff)
        const paid = inv.payments.reduce((sum, p) => sum + p.amountPaid, 0)
        return {
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          dueDate: inv.dueDate,
          balance: grandTotal - paid,
        }
      })

    return {
      metrics: {
        totalRevenue,
        totalExpenses,
        netProfit,
        outstandingAmount,
        customersCount,
        pendingQuotesCount,
        paidInvoicesCount,
      },
      recentActivities: sortedActivities,
      chartData,
      overdueInvoices,
    }
  } catch (error) {
    console.error("Dashboard calculation error:", error)
    return {
      metrics: {
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        outstandingAmount: 0,
        customersCount: 0,
        pendingQuotesCount: 0,
        paidInvoicesCount: 0,
      },
      recentActivities: [],
      chartData: [],
      overdueInvoices: [],
    }
  }
}
