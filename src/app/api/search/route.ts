import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  // Check auth
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q") || ""

  if (!query.trim()) {
    return NextResponse.json({
      customers: [],
      quotations: [],
      invoices: [],
      products: [],
      expenses: []
    })
  }

  try {
    const [customers, quotations, invoices, products, expenses] = await Promise.all([
      db.customer.findMany({
        where: {
          OR: [
            { companyName: { contains: query, mode: "insensitive" } },
            { contactPerson: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { mobile: { contains: query, mode: "insensitive" } }
          ]
        },
        take: 5
      }),
      db.quotation.findMany({
        where: {
          OR: [
            { quotationNumber: { contains: query, mode: "insensitive" } },
            { customer: { companyName: { contains: query, mode: "insensitive" } } }
          ]
        },
        include: { customer: true },
        take: 5
      }),
      db.invoice.findMany({
        where: {
          OR: [
            { invoiceNumber: { contains: query, mode: "insensitive" } },
            { customer: { companyName: { contains: query, mode: "insensitive" } } }
          ]
        },
        include: { customer: true },
        take: 5
      }),
      db.productService.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { category: { contains: query, mode: "insensitive" } },
            { hsnSac: { contains: query, mode: "insensitive" } }
          ]
        },
        take: 5
      }),
      db.expense.findMany({
        where: {
          OR: [
            { vendor: { contains: query, mode: "insensitive" } },
            { notes: { contains: query, mode: "insensitive" } }
          ]
        },
        take: 5
      })
    ])

    return NextResponse.json({
      customers,
      quotations,
      invoices,
      products,
      expenses
    })
  } catch (error) {
    console.error("Search API error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
