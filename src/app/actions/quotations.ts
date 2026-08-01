"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { QuotationStatus, InvoiceStatus } from "@prisma/client"
import { ensureAdmin } from "@/lib/auth"

export async function getNextQuotationNumber() {
  try {
    const settings = await db.companySetting.findUnique({ where: { id: "default" } })
    const prefix = settings?.quotationPrefix || "QTN-"

    const latest = await db.quotation.findFirst({
      where: { quotationNumber: { startsWith: prefix } },
      orderBy: { quotationNumber: "desc" }
    })

    if (!latest) {
      return `${prefix}0001`
    }

    const numPart = latest.quotationNumber.replace(prefix, "")
    const nextNum = parseInt(numPart, 10) + 1
    const paddedNum = String(nextNum).padStart(4, "0")
    return `${prefix}${paddedNum}`
  } catch (error) {
    console.error("Failed to generate quotation number:", error)
    return "QTN-0001"
  }
}

export async function getQuotations(query: string = "", status: string = "ALL", page: number = 1, limit: number = 10) {
  const skip = (page - 1) * limit

  try {
    const whereClause: any = {}

    if (query) {
      whereClause.OR = [
        { quotationNumber: { contains: query, mode: "insensitive" as const } },
        { customer: { companyName: { contains: query, mode: "insensitive" as const } } }
      ]
    }

    if (status && status !== "ALL") {
      whereClause.status = status as QuotationStatus
    }

    const [quotations, total] = await Promise.all([
      db.quotation.findMany({
        where: whereClause,
        orderBy: { date: "desc" },
        include: {
          customer: true,
          items: true
        },
        skip,
        take: limit
      }),
      db.quotation.count({ where: whereClause })
    ])

    return {
      quotations,
      totalPages: Math.ceil(total / limit),
      totalCount: total
    }
  } catch (error) {
    console.error("Failed to fetch quotations:", error)
    return { quotations: [], totalPages: 1, totalCount: 0 }
  }
}

export async function createQuotation(data: {
  quotationNumber: string
  date: Date
  validUntil: Date
  customerId: string
  discount: number
  gstInclusive: boolean
  notes?: string
  terms?: string
  status: QuotationStatus
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
    const quote = await db.quotation.create({
      data: {
        quotationNumber: data.quotationNumber,
        date: data.date,
        validUntil: data.validUntil,
        customerId: data.customerId,
        discount: data.discount,
        gstInclusive: data.gstInclusive,
        notes: data.notes,
        terms: data.terms,
        status: data.status,
        items: {
          create: data.items
        }
      }
    })

    revalidatePath("/quotations")
    revalidatePath("/dashboard")
    return { success: true, quotation: quote }
  } catch (error: any) {
    console.error("Failed to create quotation:", error)
    return { error: error.message || "Failed to create quotation" }
  }
}

export async function updateQuotation(
  id: string,
  data: {
    date: Date
    validUntil: Date
    customerId: string
    discount: number
    gstInclusive: boolean
    notes?: string
    terms?: string
    status: QuotationStatus
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
    // Delete existing items and recreate them
    await db.$transaction([
      db.quotationItem.deleteMany({
        where: { quotationId: id }
      }),
      db.quotation.update({
        where: { id },
        data: {
          date: data.date,
          validUntil: data.validUntil,
          customerId: data.customerId,
          discount: data.discount,
          gstInclusive: data.gstInclusive,
          notes: data.notes,
          terms: data.terms,
          status: data.status,
          items: {
            create: data.items
          }
        }
      })
    ])

    revalidatePath("/quotations")
    revalidatePath(`/quotations/${id}`)
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to update quotation:", error)
    return { error: error.message || "Failed to update quotation" }
  }
}

export async function deleteQuotation(id: string) {
  try {
    await ensureAdmin()
    await db.quotation.delete({
      where: { id }
    })
    revalidatePath("/quotations")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to delete quotation:", error)
    return { error: error.message || "Failed to delete quotation" }
  }
}

export async function duplicateQuotation(id: string) {
  try {
    await ensureAdmin()
    const original = await db.quotation.findUnique({
      where: { id },
      include: { items: true }
    })

    if (!original) return { error: "Quotation not found" }

    const nextNumber = await getNextQuotationNumber()

    const duplicated = await db.quotation.create({
      data: {
        quotationNumber: nextNumber,
        date: new Date(),
        validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        customerId: original.customerId,
        discount: original.discount,
        gstInclusive: original.gstInclusive,
        notes: original.notes,
        terms: original.terms,
        status: QuotationStatus.DRAFT,
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

    revalidatePath("/quotations")
    return { success: true, quotationId: duplicated.id }
  } catch (error: any) {
    console.error("Failed to duplicate quotation:", error)
    return { error: error.message || "Failed to duplicate quotation" }
  }
}

export async function convertQuotationToInvoice(id: string) {
  try {
    await ensureAdmin()
    const original = await db.quotation.findUnique({
      where: { id },
      include: { items: true, customer: true, invoice: true }
    })

    if (!original) return { error: "Quotation not found" }

    // Check if invoice already converted
    if (original.invoice) {
      return { error: "Quotation has already been converted to an invoice" }
    }

    // Get next invoice number
    const settings = await db.companySetting.findUnique({ where: { id: "default" } })
    const prefix = settings?.invoicePrefix || "INV-"
    const latest = await db.invoice.findFirst({
      where: { invoiceNumber: { startsWith: prefix } },
      orderBy: { invoiceNumber: "desc" }
    })

    let invoiceNumber = `${prefix}0001`
    if (latest) {
      const numPart = latest.invoiceNumber.replace(prefix, "")
      const nextNum = parseInt(numPart, 10) + 1
      const paddedNum = String(nextNum).padStart(4, "0")
      invoiceNumber = `${prefix}${paddedNum}`
    }

    // Compute invoice totals for spelling amount in words
    // Subtotal calculations: Sum up item (price * qty * (1 - disc%))
    let subtotal = 0
    let totalTax = 0
    
    original.items.forEach((item) => {
      const itemSubtotal = item.price * item.quantity * (1 - item.discount / 100)
      const tax = original.gstInclusive ? 0 : itemSubtotal * (item.gstPercent / 100)
      subtotal += itemSubtotal
      totalTax += tax
    })

    const totalBeforeRound = subtotal + totalTax - original.discount
    const roundedTotal = Math.round(totalBeforeRound)
    const roundOff = roundedTotal - totalBeforeRound

    // Standard local conversion of amount to words
    const { numberToWords } = require("@/lib/utils")
    const words = numberToWords(roundedTotal)

    // Run transaction: create invoice, update quotation status, link them
    const result = await db.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          invoiceDate: new Date(),
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Default 15 days due date
          customerId: original.customerId,
          discount: original.discount,
          shippingCharges: 0,
          roundOff,
          amountInWords: words,
          status: InvoiceStatus.PENDING,
          isGst: true,
          notes: original.notes,
          terms: original.terms || settings?.defaultTerms,
          quotationId: original.id,
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

      await tx.quotation.update({
        where: { id: original.id },
        data: { status: QuotationStatus.ACCEPTED }
      })

      return invoice
    })

    revalidatePath("/quotations")
    revalidatePath("/invoices")
    revalidatePath("/dashboard")
    return { success: true, invoiceId: result.id }
  } catch (error: any) {
    console.error("Failed to convert quotation to invoice:", error)
    return { error: error.message || "Conversion failed" }
  }
}

export async function getQuotationFormData() {
  try {
    const [customers, products, nextNumber] = await Promise.all([
      db.customer.findMany({ orderBy: { companyName: "asc" } }),
      db.productService.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
      getNextQuotationNumber()
    ])
    return { customers, products, nextNumber }
  } catch (error) {
    console.error("Failed to fetch quotation form selection data:", error)
    return { customers: [], products: [], nextNumber: "QTN-0001" }
  }
}
