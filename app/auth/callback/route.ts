import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // After confirmation, we want Arush to land on the dashboard
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    // In Next.js 15+, cookies() is an async function
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            // Note: In some Next.js 15+ environments, 
            // you can only set cookies in Server Actions or Middleware.
            // But this try/catch block ensures the route doesn't crash.
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              // The Middleware handles the cookie sync if the route can't
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              // The Middleware handles the cookie sync
            }
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If there is an error, return the user to an error page
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}