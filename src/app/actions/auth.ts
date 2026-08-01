"use server"

import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { verifyPassword, encrypt } from "@/lib/auth"

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Please enter both email and password." }
  }

  try {
    const user = await db.user.findUnique({
      where: { email }
    })

    if (!user) {
      return { error: "Invalid credentials." }
    }

    const isValid = verifyPassword(password, user.password)
    if (!isValid) {
      return { error: "Invalid credentials." }
    }

    // Encrypt session token
    const session = await encrypt({ userId: user.id, email: user.email, name: user.name, role: user.role })
    
    // Save cookie
    const cookieStore = await cookies()
    cookieStore.set("session", session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/"
    })

    return { success: true }
  } catch (error: any) {
    console.error("Login Action Error:", error)
    return { error: "An error occurred. Please try again." }
  }
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete("session")
  return { success: true }
}
