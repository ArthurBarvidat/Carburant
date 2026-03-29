import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useProStatus() {
  const [isPro, setIsPro] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { setLoading(false); return }
      setUserId(data.user.id)
      supabase
        .from('profiles')
        .select('is_pro')
        .eq('id', data.user.id)
        .single()
        .then(({ data: p }) => {
          setIsPro(p?.is_pro ?? false)
          setLoading(false)
        })
    })
  }, [])

  return { isPro, userId, loading }
}
