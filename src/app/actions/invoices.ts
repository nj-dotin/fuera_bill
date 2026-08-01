"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { InvoiceStatus, PaymentMethod } from "@prisma/client"
import { numberToWords } from "@/lib/utils"
import { ensureAdmin } from "@/lib/auth"

export async function getNextInvoiceNumber() {
  try {
    const settings = await db.companySetting.findUnique({ where: { id: "default" } })
    const prefix = settings?.invoicePrefix || "INV-"

    const latest = await db.invoice.findFirst({
      where: { invoiceNumber: { startsWith: prefix } },
      orderBy: { invoiceNumber: "desc" }
    })

    if (!latest) {
      return `${prefix}0001`
    }

    const numPart = latest.invoiceNumber.replace(prefix, "")
    const nextNum = parseInt(numPart, 10) + 1
    const paddedNum = String(nextNum).padStart(4, "0")
    return `${prefix}${paddedNum}`
  } catch (error) {
    console.error("Failed to generate invoice number:", error)
    return "INV-0001"
  }
}

export async function getInvoices(query: string = "", status: string = "ALL", page: number = 1, limit: number = 10) {
  const skip = (page - 1) * limit

  try {
    const whereClause: any = {}

    if (query) {
      whereClause.OR = [
        { invoiceNumber: { contains: query, mode: "insensitive" as const } },
        { customer: { companyName: { contains: query, mode: "insensitive" as const } } }
      ]
    }

    if (status && status !== "ALL") {
      whereClause.status = status as InvoiceStatus
    }

    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        where: whereClause,
        orderBy: { invoiceDate: "desc" },
        include: {
          customer: true,
          items: true,
          payments: true
        },
        skip,
        take: limit
      }),
      db.invoice.count({ where: whereClause })
    ])

    return {
      invoices,
      totalPages: Math.ceil(total / limit),
      totalCount: total
    }
  } catch (error) {
    console.error("Failed to fetch invoices:", error)
    return { invoices: [], totalPages: 1, totalCount: 0 }
  }
}

export async function createInvoice(data: {
  invoiceNumber: string
  invoiceDate: Date
  dueDate: Date
  customerId: string
  discount: number
  shippingCharges: number
  isGst: boolean
  notes?: string
  terms?: string
  items: {
    name: string
    description?: string
    hsnSac: string
    quantity: number
    unit: string
    price: number
    gstPercent: number
    discount: number
  }[]
}) {
  try {
    await ensureAdmin()
    // Calculate values for round off and spelling words
    let subtotal = 0
    let taxTotal = 0

    data.items.forEach((item) => {
      const itemSub = item.price * item.quantity * (1 - item.discount / 100)
      const tax = data.isGst ? itemSub * (item.gstPercent / 100) : 0
      subtotal += itemSub
      taxTotal += tax
    })

    const rawTotal = subtotal + taxTotal + data.shippingCharges - data.discount
    const rounded = Math.round(rawTotal)
    const roundOff = rounded - rawTotal
    const words = numberToWords(rounded)

    const invoice = await db.invoice.create({
      data: {
        invoiceNumber: data.invoiceNumber,
        invoiceDate: data.invoiceDate,
        dueDate: data.dueDate,
        customerId: data.customerId,
        discount: data.discount,
        shippingCharges: data.shippingCharges,
        roundOff,
        amountInWords: words,
        isGst: data.isGst,
        notes: data.notes,
        terms: data.terms,
        status: InvoiceStatus.PENDING,
        items: {
          create: data.items
        }
      }
    })

    revalidatePath("/invoices")
    revalidatePath("/dashboard")
    return { success: true, invoice }
  } catch (error: any) {
    console.error("Failed to create invoice:", error)
    return { error: error.message || "Failed to create invoice" }
  }
}

export async function updateInvoice(
  id: string,
  data: {
    invoiceDate: Date
    dueDate: Date
    customerId: string
    discount: number
    shippingCharges: number
    isGst: boolean
    notes?: string
    terms?: string
    items: {
      name: string
      description?: string
      hsnSac: string
      quantity: number
      unit: string
      price: number
      gstPercent: number
      discount: number
    }[]
  }
) {
  try {
    await ensureAdmin()
    let subtotal = 0
    let taxTotal = 0

    data.items.forEach((item) => {
      const itemSub = item.price * item.quantity * (1 - item.discount / 100)
      const tax = data.isGst ? itemSub * (item.gstPercent / 100) : 0
      subtotal += itemSub
      taxTotal += tax
    })

    const rawTotal = subtotal + taxTotal + data.shippingCharges - data.discount
    const rounded = Math.round(rawTotal)
    const roundOff = rounded - rawTotal
    const words = numberToWords(rounded)

    // Verify current payments and update payment status accordingly
    const payments = await db.payment.findMany({
      where: { invoiceId: id }
    })
    const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0)

    let status: InvoiceStatus = InvoiceStatus.PENDING
    if (totalPaid >= rounded) {
      status = InvoiceStatus.PAID
    } else if (totalPaid > 0) {
      status = InvoiceStatus.PARTIALLY_PAID
    }

    await db.$transaction([
      db.invoiceItem.deleteMany({ where: { invoiceId: id } }),
      db.invoice.update({
        where: { id },
        data: {
          invoiceDate: data.invoiceDate,
          dueDate: data.dueDate,
          customerId: data.customerId,
          discount: data.discount,
          shippingCharges: data.shippingCharges,
          roundOff,
          amountInWords: words,
          isGst: data.isGst,
          notes: data.notes,
          terms: data.terms,
          status,
          items: {
            create: data.items
          }
        }
      })
    ])

    revalidatePath("/invoices")
    revalidatePath(`/invoices/${id}`)
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to update invoice:", error)
    return { error: error.message || "Failed to update invoice" }
  }
}

export async function deleteInvoice(id: string) {
  try {
    await ensureAdmin()
    await db.invoice.delete({
      where: { id }
    })
    revalidatePath("/invoices")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to delete invoice:", error)
    return { error: error.message || "Failed to delete invoice" }
  }
}

export async function duplicateInvoice(id: string) {
  try {
    await ensureAdmin()
    const original = await db.invoice.findUnique({
      where: { id },
      include: { items: true }
    })

    if (!original) return { error: "Invoice not found" }

    const nextNumber = await getNextInvoiceNumber()

    const duplicated = await db.invoice.create({
      data: {
        invoiceNumber: nextNumber,
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        customerId: original.customerId,
        discount: original.discount,
        shippingCharges: original.shippingCharges,
        roundOff: original.roundOff,
        amountInWords: original.amountInWords,
        isGst: original.isGst,
        notes: original.notes,
        terms: original.terms,
        status: InvoiceStatus.PENDING,
        items: {
          create: original.items.map((item) => ({
            name: item.name,
            description: item.description,
            hsnSac: item.hsnSac,
            quantity: item.quantity,
            unit: item.unit,
            price: item.price,
            gstPercent: item.gstPercent,
            discount: item.discount
          }))
        }
      }
    })

    revalidatePath("/invoices")
    return { success: true, invoiceId: duplicated.id }
  } catch (error: any) {
    console.error("Failed to duplicate invoice:", error)
    return { error: error.message || "Failed to duplicate invoice" }
  }
}

export async function addPayment(data: {
  invoiceId: string
  amountPaid: number
  paymentMethod: PaymentMethod
  referenceNumber?: string
  notes?: string
  paymentDate?: Date
}) {
  try {
    await ensureAdmin()
    const invoice = await db.invoice.findUnique({
      where: { id: data.invoiceId },
      include: { items: true, payments: true }
    })

    if (!invoice) return { error: "Invoice not found" }

    // Calculate invoice total amount
    let subtotal = 0
    let taxTotal = 0
    invoice.items.forEach((item) => {
      const itemSub = item.price * item.quantity * (1 - item.discount / 100)
      const tax = invoice.isGst ? itemSub * (item.gstPercent / 100) : 0
      subtotal += itemSub
      taxTotal += tax
    })

    const grandTotal = Math.round(subtotal + taxTotal + invoice.shippingCharges - invoice.discount + invoice.roundOff)
    const currentPaid = invoice.payments.reduce((sum, p) => sum + p.amountPaid, 0)
    const newTotalPaid = currentPaid + data.amountPaid

    let status: InvoiceStatus = InvoiceStatus.PENDING
    if (newTotalPaid >= grandTotal) {
      status = InvoiceStatus.PAID
    } else if (newTotalPaid > 0) {
      status = InvoiceStatus.PARTIALLY_PAID
    }

    await db.$transaction([
      db.payment.create({
        data: {
          invoiceId: data.invoiceId,
          amountPaid: data.amountPaid,
          paymentMethod: data.paymentMethod,
          referenceNumber: data.referenceNumber,
          notes: data.notes,
          paymentDate: data.paymentDate || new Date()
        }
      }),
      db.invoice.update({
        where: { id: data.invoiceId },
        data: { status }
      })
    ])

    revalidatePath("/invoices")
    revalidatePath(`/invoices/${data.invoiceId}`)
    revalidatePath("/dashboard")
    revalidatePath("/payments")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to add payment:", error)
    return { error: error.message || "Failed to record payment" }
  }
}

export async function deletePayment(paymentId: string) {
  try {
    await ensureAdmin()
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: { invoice: { include: { items: true, payments: true } } }
    })

    if (!payment) return { error: "Payment not found" }

    const invoice = payment.invoice
    
    // Calculate invoice grand total
    let subtotal = 0
    let taxTotal = 0
    invoice.items.forEach((item) => {
      const itemSub = item.price * item.quantity * (1 - item.discount / 100)
      const tax = invoice.isGst ? itemSub * (item.gstPercent / 100) : 0
      subtotal += itemSub
      taxTotal += tax
    })
    const grandTotal = Math.round(subtotal + taxTotal + invoice.shippingCharges - invoice.discount + invoice.roundOff)
    
    // Exclude the deleted payment from calculation
    const newTotalPaid = invoice.payments.filter((p) => p.id !== paymentId).reduce((sum, p) => sum + p.amountPaid, 0)

    let status: InvoiceStatus = InvoiceStatus.PENDING
    if (newTotalPaid >= grandTotal) {
      status = InvoiceStatus.PAID
    } else if (newTotalPaid > 0) {
      status = InvoiceStatus.PARTIALLY_PAID
    }

    await db.$transaction([
      db.payment.delete({ where: { id: paymentId } }),
      db.invoice.update({
        where: { id: invoice.id },
        data: { status }
      })
    ])

    revalidatePath("/invoices")
    revalidatePath(`/invoices/${invoice.id}`)
    revalidatePath("/dashboard")
    revalidatePath("/payments")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to delete payment:", error)
    return { error: error.message || "Failed to delete payment" }
  }
}

export async function getInvoiceFormData() {
  try {
    const [customers, products, nextNumber] = await Promise.all([
      db.customer.findMany({ orderBy: { companyName: "asc" } }),
      db.productService.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
      getNextInvoiceNumber()
    ])
    return { customers, products, nextNumber }
  } catch (error) {
    console.error("Failed to fetch invoice form selection data:", error)
    return { customers: [], products: [], nextNumber: "INV-0001" }
  }
}
