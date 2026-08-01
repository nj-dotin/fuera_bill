"use server"

import { db } from "@/lib/db"

export async function getReportsData(year: number = new Date().getFullYear()) {
  try {
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31, 23, 59, 59)

    const [invoices, expenses, purchaseBills, customers] = await Promise.all([
      db.invoice.findMany({
        where: {
          invoiceDate: {
            gte: startDate,
            lte: endDate
          }
        },
        include: { items: true, payments: true, customer: true }
      }),
      db.expense.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      db.purchaseBill.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      db.customer.findMany()
    ])

    // 1. Sales and Collections Month by Month
    const monthlySummary = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(year, i, 1).toLocaleString("default", { month: "short" }),
      monthIndex: i,
      sales: 0,
      collected: 0,
      expenses: 0,
      purchases: 0
    }))

    // Calculate Invoices
    invoices.forEach((inv) => {
      const month = new Date(inv.invoiceDate).getMonth()
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
      
      monthlySummary[month].sales += grandTotal

      const collected = inv.payments
        .filter((p) => new Date(p.paymentDate).getFullYear() === year)
        .reduce((sum, p) => sum + p.amountPaid, 0)
      
      monthlySummary[month].collected += collected
    })

    // Calculate Expenses
    expenses.forEach((exp) => {
      const month = new Date(exp.date).getMonth()
      monthlySummary[month].expenses += exp.amount
    })

    // Calculate Purchases
    purchaseBills.forEach((bill) => {
      const month = new Date(bill.date).getMonth()
      monthlySummary[month].purchases += bill.amount
    })

    // 2. GST Summary (Collected from Invoices vs Paid in Purchases/Expenses)
    let gstCollected = 0
    let gstPaid = 0

    invoices.forEach((inv) => {
      if (inv.isGst) {
        inv.items.forEach((item) => {
          const itemSub = item.price * item.quantity * (1 - item.discount / 100)
          gstCollected += itemSub * (item.gstPercent / 100)
        })
      }
    })

    purchaseBills.forEach((bill) => {
      gstPaid += bill.gst
    })

    // 3. Customer Performance Report
    const customerPerformance = customers.map((c) => {
      const customerInvoices = invoices.filter((inv) => inv.customerId === c.id)
      
      let salesAmount = 0
      let collectedAmount = 0

      customerInvoices.forEach((inv) => {
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
        salesAmount += grandTotal
        collectedAmount += inv.payments.reduce((sum, p) => sum + p.amountPaid, 0)
      })

      return {
        customerId: c.id,
        companyName: c.companyName,
        contactPerson: c.contactPerson,
        salesAmount,
        collectedAmount,
        outstandingAmount: salesAmount - collectedAmount
      }
    }).sort((a, b) => b.salesAmount - a.salesAmount)

    // 4. Expenses Breakdown by Category
    const expenseBreakdown = Object.keys(
      expenses.reduce((acc: any, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount
        return acc
      }, {})
    ).map((key) => ({
      category: key,
      amount: expenses.filter((e) => e.category === key).reduce((sum, e) => sum + e.amount, 0)
    })).sort((a, b) => b.amount - a.amount)

    // Outstanding Payments
    const outstandingInvoices = invoices
      .filter((inv) => inv.status !== "PAID")
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
        const grand = Math.round(subtotal + tax + inv.shippingCharges - inv.discount + inv.roundOff)
        const paid = inv.payments.reduce((sum, p) => sum + p.amountPaid, 0)
        return {
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          companyName: inv.customer.companyName,
          invoiceDate: inv.invoiceDate,
          dueDate: inv.dueDate,
          grandTotal: grand,
          paidAmount: paid,
          dueAmount: grand - paid
        }
      }).sort((a, b) => b.dueAmount - a.dueAmount)

    return {
      monthlySummary,
      gstSummary: {
        gstCollected,
        gstPaid,
        netGstLiability: gstCollected - gstPaid
      },
      customerPerformance,
      expenseBreakdown,
      outstandingInvoices
    }
  } catch (error) {
    console.error("Reports aggregation error:", error)
    return {
      monthlySummary: [],
      gstSummary: { gstCollected: 0, gstPaid: 0, netGstLiability: 0 },
      customerPerformance: [],
      expenseBreakdown: [],
      outstandingInvoices: []
    }
  }
}
