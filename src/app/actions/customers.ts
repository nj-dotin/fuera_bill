"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { ensureAdmin } from "@/lib/auth"

export async function getCustomers(query: string = "", page: number = 1, limit: number = 10) {
  const skip = (page - 1) * limit
  
  try {
    const whereClause = query
      ? {
          OR: [
            { companyName: { contains: query, mode: "insensitive" as const } },
            { contactPerson: { contains: query, mode: "insensitive" as const } },
            { email: { contains: query, mode: "insensitive" as const } },
            { mobile: { contains: query, mode: "insensitive" as const } }
          ]
        }
      : {}

    const [customers, total] = await Promise.all([
      db.customer.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          invoices: {
            include: {
              payments: true
            }
          }
        }
      }),
      db.customer.count({ where: whereClause })
    ])

    // Calculate total revenue for each customer based on recorded payments
    const customersWithRevenue = customers.map((c) => {
      const totalRevenue = c.invoices.reduce((sum, inv) => {
        const paidAmount = inv.payments.reduce((pSum, p) => pSum + p.amountPaid, 0)
        return sum + paidAmount
      }, 0)

      return {
        ...c,
        totalRevenue
      }
    })

    return {
      customers: customersWithRevenue,
      totalPages: Math.ceil(total / limit),
      totalCount: total
    }
  } catch (error) {
    console.error("Failed to fetch customers:", error)
    return { customers: [], totalPages: 1, totalCount: 0 }
  }
}

export async function createCustomer(data: {
  companyName: string
  contactPerson: string
  mobile: string
  whatsapp?: string
  email: string
  gstNumber?: string
  address: string
  city: string
  state: string
  pin: string
  notes?: string
}) {
  try {
    await ensureAdmin()
    const newCustomer = await db.customer.create({
      data
    })
    revalidatePath("/customers")
    return { success: true, customer: newCustomer }
  } catch (error: any) {
    console.error("Failed to create customer:", error)
    return { error: error.message || "Failed to create customer" }
  }
}

export async function updateCustomer(
  id: string,
  data: {
    companyName: string
    contactPerson: string
    mobile: string
    whatsapp?: string
    email: string
    gstNumber?: string
    address: string
    city: string
    state: string
    pin: string
    notes?: string
  }
) {
  try {
    await ensureAdmin()
    const updated = await db.customer.update({
      where: { id },
      data
    })
    revalidatePath("/customers")
    return { success: true, customer: updated }
  } catch (error: any) {
    console.error("Failed to update customer:", error)
    return { error: error.message || "Failed to update customer" }
  }
}

export async function deleteCustomer(id: string) {
  try {
    await ensureAdmin()
    await db.customer.delete({
      where: { id }
    })
    revalidatePath("/customers")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to delete customer:", error)
    return { error: error.message || "Failed to delete customer" }
  }
}

export async function getCustomerDetails(id: string) {
  try {
    const customer = await db.customer.findUnique({
      where: { id },
      include: {
        quotations: {
          orderBy: { date: "desc" }
        },
        invoices: {
          include: {
            payments: true
          },
          orderBy: { invoiceDate: "desc" }
        }
      }
    })

    if (!customer) return null

    // Calculate customer metrics
    let totalRevenue = 0
    let outstandingAmount = 0
    
    customer.invoices.forEach((inv) => {
      const paid = inv.payments.reduce((sum, p) => sum + p.amountPaid, 0)
      totalRevenue += paid
      
      // Calculate invoice grand total (simplified formula, will align with invoice calculations)
      // Grand total = subtotal + gst + shipping + roundoff - discount
      // For this check, we'll calculate it using static helpers
      // We will define details below
    })

    return {
      ...customer,
      totalRevenue
    }
  } catch (error) {
    console.error("Failed to get customer details:", error)
    return null
  }
}
