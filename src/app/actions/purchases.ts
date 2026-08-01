"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { PurchaseBillStatus } from "@prisma/client"
import { ensureAdmin } from "@/lib/auth"

export async function getPurchases(
  status: string = "ALL",
  query: string = "",
  page: number = 1,
  limit: number = 10
) {
  const skip = (page - 1) * limit

  try {
    const whereClause: any = {}

    if (status && status !== "ALL") {
      whereClause.status = status as PurchaseBillStatus
    }

    if (query) {
      whereClause.OR = [
        { vendor: { contains: query, mode: "insensitive" as const } },
        { billNumber: { contains: query, mode: "insensitive" as const } },
        { notes: { contains: query, mode: "insensitive" as const } }
      ]
    }

    const [purchases, total] = await Promise.all([
      db.purchaseBill.findMany({
        where: whereClause,
        orderBy: { date: "desc" },
        skip,
        take: limit
      }),
      db.purchaseBill.count({ where: whereClause })
    ])

    return {
      purchases,
      totalPages: Math.ceil(total / limit),
      totalCount: total
    }
  } catch (error) {
    console.error("Failed to fetch purchase bills:", error)
    return { purchases: [], totalPages: 1, totalCount: 0 }
  }
}

export async function createPurchase(data: {
  vendor: string
  billNumber: string
  date: Date
  amount: number
  gst: number
  notes?: string
  status: PurchaseBillStatus
}) {
  try {
    await ensureAdmin()
    const bill = await db.purchaseBill.create({
      data
    })
    revalidatePath("/purchases")
    revalidatePath("/dashboard")
    return { success: true, purchaseBill: bill }
  } catch (error: any) {
    console.error("Failed to create purchase bill:", error)
    return { error: error.message || "Failed to log purchase bill" }
  }
}

export async function updatePurchaseStatus(id: string, status: PurchaseBillStatus) {
  try {
    await ensureAdmin()
    await db.purchaseBill.update({
      where: { id },
      data: { status }
    })
    revalidatePath("/purchases")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Failed to update purchase bill status:", error)
    return { error: "Failed to update status" }
  }
}

export async function deletePurchase(id: string) {
  try {
    await ensureAdmin()
    await db.purchaseBill.delete({
      where: { id }
    })
    revalidatePath("/purchases")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to delete purchase bill:", error)
    return { error: error.message || "Failed to delete purchase bill" }
  }
}
