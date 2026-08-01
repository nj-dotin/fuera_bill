import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = process.env.JWT_SECRET || "fuera_default_secret_key_change_me"
const key = new TextEncoder().encode(JWT_SECRET)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Exclude static assets, api/auth routes, or images
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next()
  }

  const sessionCookie = request.cookies.get("session")?.value

  let isVerified = false
  if (sessionCookie) {
    try {
      await jwtVerify(sessionCookie, key, {
        algorithms: ["HS256"]
      })
      isVerified = true
    } catch (e) {
      isVerified = false
    }
  }

  // Handle routing logic
  if (pathname === "/login") {
    if (isVerified) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
    return NextResponse.next()
  }

  // Protect all other routes (including the home page /)
  if (!isVerified) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Redirect root path to dashboard
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

// Config to run middleware on all paths except static paths/files
export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
}
