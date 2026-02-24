import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const session = req.cookies.get("session")?.value
  const publicPaths = ["/login"]
  const isPublic = publicPaths.some(p => pathname.startsWith(p))
  if (!session && !isPublic) return NextResponse.redirect(new URL("/login", req.url))
  if (session && isPublic) return NextResponse.redirect(new URL("/dashboard", req.url))
  return NextResponse.next()
}

export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\..*).*)"] }
