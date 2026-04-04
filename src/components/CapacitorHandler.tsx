'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function CapacitorHandler() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const isCapacitor = !!(window as unknown as Record<string, unknown>).Capacitor
    if (!isCapacitor) return

    let handle: { remove: () => void } | undefined

    import('@capacitor/app').then(async ({ App }) => {
      handle = await App.addListener('appUrlOpen', async ({ url }) => {
        // url: fr.wolffuel.app://consent#access_token=...&refresh_token=...
        const sep = url.includes('#') ? '#' : '?'
        const fragment = url.split(sep)[1]
        if (!fragment) return

        const params = new URLSearchParams(fragment)
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')

        if (accessToken && refreshToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          // Ferme le browser Capacitor si ouvert
          import('@capacitor/browser').then(({ Browser }) => Browser.close().catch(() => {}))
          router.replace('/consent')
        }
      })
    })

    return () => { handle?.remove() }
  }, [router])

  return null
}
