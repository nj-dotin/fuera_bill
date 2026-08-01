"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { ExpenseCategory, PaymentMethod } from "@prisma/client"
import { ensureAdmin } from "@/lib/auth"

export async function getExpenses(
  category: string = "ALL",
  query: string = "",
  page: number = 1,
  limit: number = 10
) {
  const skip = (page - 1) * limit

  try {
    const whereClause: any = {}

    if (category && category !== "ALL") {
      whereClause.category = category as ExpenseCategory
    }

    if (query) {
      whereClause.OR = [
        { vendor: { contains: query, mode: "insensitive" as const } },
        { notes: { contains: query, mode: "insensitive" as const } }
      ]
    }

    const [expenses, total] = await Promise.all([
      db.expense.findMany({
        where: whereClause,
        orderBy: { date: "desc" },
        skip,
        take: limit
      }),
      db.expense.count({ where: whereClause })
    ])

    // Get aggregates
    const aggregates = await db.expense.groupBy({
      by: ["category"],
      _sum: { amount: true }
    })

    return {
      expenses,
      aggregates,
      totalPages: Math.ceil(total / limit),
      totalCount: total
    }
  } catch (error) {
    console.error("Failed to fetch expenses:", error)
    return { expenses: [], aggregates: [], totalPages: 1, totalCount: 0 }
  }
}

export async function createExpense(data: {
  category: ExpenseCategory
  amount: number
  vendor: string
  date: Date
  paymentMethod: PaymentMethod
  notes?: string
}) {
  try {
    await ensureAdmin()
    const newExpense = await db.expense.create({
      data
    })
    revalidatePath("/expenses")
    revalidatePath("/dashboard")
    return { success: true, expense: newExpense }
  } catch (error: any) {
    console.error("Failed to create expense:", error)
    return { error: error.message || "Failed to log expense" }
  }
}

export async function deleteExpense(id: string) {
  try {
    await ensureAdmin()
    await db.expense.delete({
      where: { id }
    })
    revalidatePath("/expenses")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to delete expense:", error)
    return { error: error.message || "Failed to delete expense" }
  }
}
