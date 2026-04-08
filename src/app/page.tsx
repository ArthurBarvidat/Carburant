'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import WolfFuelApp from '@/components/WolfFuelApp'
import LoadingScreen from '@/components/LoadingScreen'
import WolfChat from '@/components/WolfChat'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // onAuthStateChange est fiable — il attend que Supabase charge la session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setReady(true)
      } else if (event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
        router.replace('/login')
      }
    })

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!ready) return <LoadingScreen message="WolfFuel démarre…" />

  return (
    <>
      <WolfFuelApp />
      <WolfChat />
    </>
  )
}
