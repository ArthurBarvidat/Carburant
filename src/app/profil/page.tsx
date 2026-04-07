'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { SkeletonCard, SkeletonStat } from '@/components/LoadingScreen'

type Profile = {
  pseudo?: string
  is_pro?: boolean
  subscription_status?: string
  created_at?: string
  avatar_url?: string
}

export default function ProfilPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [profile, setProfile] = useState<Profile>({})
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [pseudoEdit, setPseudoEdit] = useState('')
  const [pseudoMode, setPseudoMode] = useState<'view' | 'edit'>('view')
  const [savingPseudo, setSavingPseudo] = useState(false)
  const [pseudoError, setPseudoError] = useState('')
  const [pseudoOk, setPseudoOk] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/login'); return }
      setEmail(data.user.email ?? '')
      setUserId(data.user.id)
      // Mettre à jour la présence
      fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: data.user.id }),
      })
      supabase.from('profiles').select('*').eq('id', data.user.id).single()
        .then(({ data: p }) => {
          if (p) {
            setProfile(p)
            setPseudoEdit(p.pseudo ?? '')
            setPseudoMode(p.pseudo ? 'view' : 'edit')
          }
          else {
            // Profil pas encore créé → le créer via l'API
            fetch('/api/set-pro', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: data.user!.id, isPro: false }),
            })
          }
          setLoading(false)
        })
    })
  }, [router])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    if (file.size > 2 * 1024 * 1024) { alert('Image trop lourde (max 2 Mo)'); return }
    setUploadingAvatar(true)
    const ext = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (uploadError) { setUploadingAvatar(false); return }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
    const avatar_url = urlData.publicUrl + '?t=' + Date.now()
    await supabase.from('profiles').update({ avatar_url }).eq('id', userId)
    setProfile(p => ({ ...p, avatar_url }))
    setUploadingAvatar(false)
  }

  const savePseudo = async () => {
    if (!pseudoEdit.trim() || !userId) return
    setSavingPseudo(true)
    setPseudoError('')
    setPseudoOk(false)

    // Vérification pseudo
    const checkRes = await fetch('/api/check-pseudo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pseudo: pseudoEdit.trim(), userId }),
    })
    const check = await checkRes.json()
    if (!check.ok) {
      setPseudoError(check.error)
      setSavingPseudo(false)
      return
    }

    // Sauvegarde
    const { error } = await supabase.from('profiles').upsert({ id: userId, pseudo: pseudoEdit.trim() })
    if (!error) {
      setProfile(p => ({ ...p, pseudo: pseudoEdit.trim() }))
      setPseudoOk(true)
      setPseudoMode('view')
    } else {
      setPseudoError('Erreur lors de la sauvegarde.')
    }
    setSavingPseudo(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const handleDeleteAccount = async () => {
    const confirmed = confirm('⚠️ Supprimer définitivement ton compte ?\n\nToutes tes données (favoris, alertes, historique) seront effacées. Cette action est irréversible.')
    if (!confirmed) return
    const confirmed2 = confirm('Dernière confirmation : supprimer mon compte WolfFuel définitivement ?')
    if (!confirmed2) return
    const res = await fetch('/api/delete-account', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    if (res.ok) {
      await supabase.auth.signOut()
      router.replace('/')
    }
  }

  const s: React.CSSProperties = {
    minHeight: '100vh',
    fontFamily: "'DM Sans', sans-serif",
    color: '#e2e8f0',
    padding: '24px 20px',
  }

  const card: React.CSSProperties = {
    background: 'rgba(15,10,40,.85)',
    border: '1.5px solid rgba(139,92,246,.25)',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '12px',
  }

  const label: React.CSSProperties = {
    fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '.08em', color: '#64748b', marginBottom: '4px', display: 'block',
  }

  const value: React.CSSProperties = {
    fontSize: '15px', fontWeight: 600, color: '#f1f5f9',
  }

  return (
    <div style={s}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <a href="/" style={{ color: '#64748b', textDecoration: 'none', fontSize: '20px' }}>←</a>
          <h1 style={{
            fontSize: '20px', fontWeight: 800,
            background: 'linear-gradient(135deg,#c084fc,#a855f7)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>Mon profil</h1>
        </div>

        {loading ? (
          <>
            <SkeletonStat />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard lines={1} />
          </>
        ) : (
          <>
            {/* Avatar + statut */}
            <div style={{ ...card, textAlign: 'center', padding: '28px' }}>
              <div style={{ position: 'relative', width: '80px', margin: '0 auto 12px' }}>
                <div style={{
                  width: '80px', height: '80px', borderRadius: '50%',
                  background: 'linear-gradient(135deg,rgba(168,85,247,.3),rgba(124,58,237,.2))',
                  border: '2px solid rgba(168,85,247,.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '32px', overflow: 'hidden',
                }}>
                  {profile.avatar_url
                    ? <img src={profile.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : '🐺'
                  }
                </div>
                <label style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: '26px', height: '26px', borderRadius: '50%',
                  background: 'linear-gradient(135deg,#a855f7,#7c3aed)',
                  border: '2px solid #0d0a1a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: '12px',
                }}>
                  {uploadingAvatar ? '⏳' : '📷'}
                  <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                </label>
              </div>
              <div style={{ fontSize: '17px', fontWeight: 700, color: '#f1f5f9', marginBottom: '6px' }}>
                {profile.pseudo ?? email.split('@')[0]}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>{email}</div>
              {/* Badge statut */}
              {profile.is_pro ? (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '6px 16px', borderRadius: '20px',
                  background: 'linear-gradient(135deg,rgba(168,85,247,.2),rgba(124,58,237,.15))',
                  border: '1.5px solid rgba(168,85,247,.5)',
                  color: '#c084fc', fontSize: '13px', fontWeight: 700,
                }}>🐺⭐ Wolf Pro</span>
              ) : (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '6px 16px', borderRadius: '20px',
                  background: 'rgba(100,116,139,.1)',
                  border: '1.5px solid rgba(100,116,139,.3)',
                  color: '#64748b', fontSize: '13px', fontWeight: 700,
                }}>🐺 Gratuit</span>
              )}
            </div>

            {/* Abonnement */}
            <div style={card}>
              <span style={label}>Abonnement</span>
              {profile.is_pro ? (
                <>
                  <div style={{ ...value, color: '#c084fc' }}>🐺⭐ Wolf Pro actif</div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                    Toutes les fonctionnalités premium débloquées
                  </div>
                  <Link href="/abonnement" style={{
                    display: 'inline-block', marginTop: '12px', padding: '9px 18px',
                    borderRadius: '10px', border: '1px solid rgba(168,85,247,.3)',
                    background: 'rgba(168,85,247,.08)', color: '#c084fc',
                    fontSize: '13px', fontWeight: 700, textDecoration: 'none',
                  }}>
                    Gérer l'abonnement
                  </Link>
                </>
              ) : (
                <>
                  <div style={value}>Gratuit</div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', marginBottom: '12px' }}>
                    Passe à Wolf Pro pour débloquer toutes les fonctionnalités
                  </div>
                  <Link href="/abonnement" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '12px', borderRadius: '12px',
                    background: 'linear-gradient(135deg,#a855f7,#7c3aed)',
                    color: '#fff', fontSize: '14px', fontWeight: 800, textDecoration: 'none',
                  }}>
                    ⭐ Passer Wolf Pro — 2,99€/mois
                  </Link>
                </>
              )}
            </div>

            {/* Infos compte + pseudo */}
            <div style={card}>
              <span style={label}>Compte</span>
              <div style={{ marginBottom: '14px' }}>
                <span style={{ ...label, marginBottom: '2px' }}>Email</span>
                <div style={value}>{email}</div>
              </div>
              <div>
                <span style={{ ...label, marginBottom: '6px' }}>Pseudo</span>

                {pseudoMode === 'view' && profile.pseudo ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', background: 'rgba(16,185,129,.08)', border: '1.5px solid rgba(16,185,129,.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px' }}>✅</span>
                      <span style={{ fontWeight: 700, fontSize: '15px', color: '#f1f5f9' }}>{profile.pseudo}</span>
                    </div>
                    <button onClick={() => { setPseudoMode('edit'); setPseudoError(''); setPseudoOk(false) }} style={{
                      padding: '5px 12px', borderRadius: '8px',
                      border: '1px solid rgba(168,85,247,.3)', background: 'rgba(168,85,247,.08)',
                      color: '#c084fc', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                      fontFamily: "'DM Sans', sans-serif",
                    }}>✏️ Modifier</button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={pseudoEdit}
                        onChange={e => { setPseudoEdit(e.target.value); setPseudoError(''); setPseudoOk(false) }}
                        onKeyDown={e => e.key === 'Enter' && savePseudo()}
                        placeholder="Choisis un pseudo..."
                        maxLength={20}
                        style={{
                          flex: 1, padding: '10px 14px', borderRadius: '10px',
                          border: `1.5px solid ${pseudoError ? 'rgba(239,68,68,.5)' : 'rgba(168,85,247,.2)'}`,
                          background: 'rgba(168,85,247,.06)',
                          color: '#f1f5f9', fontSize: '14px', outline: 'none',
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      />
                      <button onClick={savePseudo} disabled={savingPseudo} style={{
                        padding: '10px 16px', borderRadius: '10px', border: 'none',
                        background: savingPseudo ? 'rgba(168,85,247,.4)' : 'linear-gradient(135deg,#a855f7,#7c3aed)',
                        color: '#fff', fontWeight: 700, fontSize: '13px',
                        cursor: savingPseudo ? 'not-allowed' : 'pointer',
                        fontFamily: "'DM Sans', sans-serif",
                      }}>
                        {savingPseudo ? '...' : 'Sauver'}
                      </button>
                    </div>
                    {pseudoError && <p style={{ fontSize: '12px', color: '#f87171', marginTop: '6px', fontWeight: 600 }}>⚠️ {pseudoError}</p>}
                    {pseudoOk && <p style={{ fontSize: '12px', color: '#34d399', marginTop: '6px', fontWeight: 600 }}>✅ Pseudo sauvegardé !</p>}
                    {profile.pseudo && (
                      <button onClick={() => { setPseudoMode('view'); setPseudoError(''); setPseudoEdit(profile.pseudo ?? '') }} style={{ marginTop: '6px', background: 'none', border: 'none', color: '#64748b', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                        Annuler
                      </button>
                    )}
                  </>
                )}
                <p style={{ fontSize: '11px', color: '#475569', marginTop: '6px' }}>
                  Lettres, chiffres, _ - . uniquement · Visible par tes amis
                </p>
              </div>
            </div>

            {/* Liens vers les fonctionnalités */}
            {[
              { href: '/amis', icon: '👥', label: 'Mes amis', sub: 'Ajouter et gérer tes amis' },
              { href: '/vehicule', icon: '🚗', label: 'Mon véhicule', sub: 'Profil, pleins & entretien' },
              { href: '/trajet', icon: '🗺️', label: 'Estimateur de trajet', sub: 'Calcule le coût d\'un trajet' },
              { href: '/badges', icon: '🏅', label: 'Mes badges', sub: 'Récompenses & succès' },
              { href: '/classement', icon: '🏆', label: 'Classement amis', sub: 'Qui économise le plus ?' },
            ].map(l => (
              <Link key={l.href} href={l.href} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 20px', borderRadius: '14px', textDecoration: 'none',
                background: 'rgba(15,10,40,.85)', border: '1.5px solid rgba(139,92,246,.25)',
                marginBottom: '8px', gap: '12px',
              }}>
                <span style={{ fontSize: '20px' }}>{l.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9' }}>{l.label}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '1px' }}>{l.sub}</div>
                </div>
                <span style={{ color: '#64748b', fontSize: '18px' }}>→</span>
              </Link>
            ))}

            {/* Fonctionnalités Pro */}
            <div style={card}>
              <span style={label}>Fonctionnalités Wolf Pro</span>
              {[
                { label: '🔔 Alertes prix', ok: profile.is_pro },
                { label: '⭐ Stations favorites', ok: profile.is_pro },
                { label: '📈 Historique des prix', ok: profile.is_pro },
                { label: '💰 Calcul économies', ok: profile.is_pro },
                { label: '🚫 Sans publicité', ok: profile.is_pro },
                { label: '🐺⭐ Badge Wolf Pro', ok: profile.is_pro },
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 5 ? '1px solid rgba(168,85,247,.08)' : 'none' }}>
                  <span style={{ fontSize: '14px', color: f.ok ? '#e2e8f0' : '#475569' }}>{f.label}</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: f.ok ? '#34d399' : '#475569' }}>{f.ok ? '✓ Actif' : '✗'}</span>
                </div>
              ))}
            </div>

            {/* Déconnexion */}
            <button
              onClick={handleLogout}
              style={{
                width: '100%', padding: '14px', borderRadius: '14px',
                border: '1.5px solid rgba(239,68,68,.3)',
                background: 'rgba(239,68,68,.06)',
                color: '#f87171', fontSize: '15px', fontWeight: 700,
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                marginTop: '4px',
              }}
            >
              Se déconnecter
            </button>

            {/* Suppression compte */}
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(139,92,246,.1)' }}>
              <p style={{ fontSize: '12px', color: '#334155', textAlign: 'center', marginBottom: '10px' }}>
                Zone dangereuse · Conformité RGPD
              </p>
              <button
                onClick={handleDeleteAccount}
                style={{
                  width: '100%', padding: '12px', borderRadius: '12px',
                  border: '1px solid rgba(239,68,68,.2)',
                  background: 'transparent',
                  color: '#475569', fontSize: '13px', fontWeight: 600,
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                }}
              >
                🗑️ Supprimer mon compte et mes données
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
