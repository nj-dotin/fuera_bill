"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { hashPassword, verifyPassword, ensureAdmin } from "@/lib/auth"

export async function getSettings() {
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
          defaultTerms: "Payment within 15 days.",
        }
      })
    }
    
    return settings;
  } catch (error) {
    console.error("Failed to fetch settings:", error)
    return null
  }
}

export async function updateSettings(data: {
  companyName: string
  address: string
  gstin?: string
  pan?: string
  cin?: string
  bankName?: string
  accountNumber?: string
  ifscCode?: string
  upiQrCodeUrl?: string
  signatureUrl?: string
  defaultTerms: string
  invoicePrefix: string
  quotationPrefix: string
  logoUrl?: string
}) {
  try {
    await ensureAdmin()
    const updated = await db.companySetting.upsert({
      where: { id: "default" },
      update: data,
      create: {
        id: "default",
        ...data
      }
    })
    revalidatePath("/settings")
    revalidatePath("/dashboard")
    return { success: true, settings: updated }
  } catch (error: any) {
    console.error("Failed to update settings:", error)
    return { error: error.message || "Failed to update settings" }
  }
}

export async function updateAdminUser(data: {
  name: string
  email: string
  currentPassword?: string
  newPassword?: string
}) {
  try {
    await ensureAdmin()
    const user = await db.user.findFirst()
    if (!user) return { error: "Admin user not found" }

    const updateData: any = {
      name: data.name,
      email: data.email
    }

    if (data.newPassword) {
      if (!data.currentPassword) {
        return { error: "Current password is required to set a new password" }
      }
      
      const isValid = verifyPassword(data.currentPassword, user.password)
      if (!isValid) {
        return { error: "Current password is incorrect" }
      }

      updateData.password = hashPassword(data.newPassword)
    }

    await db.user.update({
      where: { id: user.id },
      data: updateData
    })

    return { success: true }
  } catch (error: any) {
    console.error("Failed to update admin profile:", error)
    return { error: error.message || "Failed to update profile" }
  }
}
