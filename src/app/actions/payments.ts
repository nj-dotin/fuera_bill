"use server"

import { db } from "@/lib/db"

export async function getPayments(
  query: string = "",
  page: number = 1,
  limit: number = 10
) {
  const skip = (page - 1) * limit

  try {
    const whereClause: any = {}

    if (query) {
      whereClause.OR = [
        { referenceNumber: { contains: query, mode: "insensitive" as const } },
        { invoice: { invoiceNumber: { contains: query, mode: "insensitive" as const } } },
        { invoice: { customer: { companyName: { contains: query, mode: "insensitive" as const } } } }
      ]
    }

    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where: whereClause,
        orderBy: { paymentDate: "desc" },
        include: {
          invoice: {
            include: {
              customer: true
            }
          }
        },
        skip,
        take: limit
      }),
      db.payment.count({ where: whereClause })
    ])

    return {
      payments,
      totalPages: Math.ceil(total / limit),
      totalCount: total
    }
  } catch (error) {
    console.error("Failed to fetch payments:", error)
    return { payments: [], totalPages: 1, totalCount: 0 }
  }
}
