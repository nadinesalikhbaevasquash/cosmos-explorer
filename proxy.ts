import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { locales, defaultLocale } from './i18n/config'

function getLocale(request: NextRequest): string {
  const acceptLang = request.headers.get('accept-language') ?? ''
  if (acceptLang.toLowerCase().includes('ru')) return 'ru'
  if (acceptLang.toLowerCase().includes('uz')) return 'uz'
  return defaultLocale
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const hasLocale = locales.some(
    (l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`
  )
  if (hasLocale) return NextResponse.next()

  const locale = getLocale(request)
  request.nextUrl.pathname = `/${locale}${pathname}`
  return NextResponse.redirect(request.nextUrl)
}

export const config = {
  // Exclude /api (route handlers must not be locale-redirected) and /coach
  // (the standalone Study Abroad Coach site has no i18n) alongside static assets.
  matcher: ['/((?!api|coach|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
