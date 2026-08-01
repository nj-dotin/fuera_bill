import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    let settings = await db.companySetting.findUnique({
      where: { id: "default" }
    })
    if (!settings) {
      settings = await db.companySetting.create({
        data: {
          id: "default",
          companyName: "FUERA",
          address: "FUERA Corporate HQ",
          defaultTerms: "1. Payments are due within 15 days of invoice date.\n2. Interest of 2% per month will be charged on overdue payments.",
        }
      })
    }
    return NextResponse.json(settings)
  } catch (error) {
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 })
  }
}
