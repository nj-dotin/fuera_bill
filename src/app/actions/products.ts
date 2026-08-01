"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { ProductUnit } from "@prisma/client"
import { ensureAdmin } from "@/lib/auth"

export async function getProducts(
  query: string = "",
  category: string = "",
  page: number = 1,
  limit: number = 10
) {
  const skip = (page - 1) * limit

  try {
    const whereClause: any = {}

    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: "insensitive" as const } },
        { description: { contains: query, mode: "insensitive" as const } },
        { hsnSac: { contains: query, mode: "insensitive" as const } }
      ]
    }

    if (category && category !== "ALL") {
      whereClause.category = category
    }

    const [products, total] = await Promise.all([
      db.productService.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      db.productService.count({ where: whereClause })
    ])

    // Get all unique categories for filters
    const allProducts = await db.productService.findMany({
      select: { category: true },
      distinct: ["category"]
    })
    const categories = ["ALL", ...allProducts.map((p) => p.category).filter(Boolean)]

    return {
      products,
      categories,
      totalPages: Math.ceil(total / limit),
      totalCount: total
    }
  } catch (error) {
    console.error("Failed to fetch products:", error)
    return { products: [], categories: ["ALL"], totalPages: 1, totalCount: 0 }
  }
}

export async function createProduct(data: {
  name: string
  description?: string
  category: string
  hsnSac: string
  unit: ProductUnit
  price: number
  gstPercent: number
  active?: boolean
}) {
  try {
    await ensureAdmin()
    const newProduct = await db.productService.create({
      data: {
        ...data,
        active: data.active ?? true
      }
    })
    revalidatePath("/products")
    return { success: true, product: newProduct }
  } catch (error: any) {
    console.error("Failed to create product:", error)
    return { error: error.message || "Failed to create product" }
  }
}

export async function updateProduct(
  id: string,
  data: {
    name: string
    description?: string
    category: string
    hsnSac: string
    unit: ProductUnit
    price: number
    gstPercent: number
    active?: boolean
  }
) {
  try {
    await ensureAdmin()
    const updated = await db.productService.update({
      where: { id },
      data
    })
    revalidatePath("/products")
    return { success: true, product: updated }
  } catch (error: any) {
    console.error("Failed to update product:", error)
    return { error: error.message || "Failed to update product" }
  }
}

export async function deleteProduct(id: string) {
  try {
    await ensureAdmin()
    await db.productService.delete({
      where: { id }
    })
    revalidatePath("/products")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to delete product:", error)
    return { error: error.message || "Failed to delete product" }
  }
}

export async function toggleProductStatus(id: string, currentStatus: boolean) {
  try {
    await ensureAdmin()
    await db.productService.update({
      where: { id },
      data: { active: !currentStatus }
    })
    revalidatePath("/products")
    return { success: true }
  } catch (error) {
    console.error("Failed to toggle product status:", error)
    return { error: "Failed to toggle status" }
  }
}
