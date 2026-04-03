'use client'

export default function MentionsLegalesPage() {
  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: "'DM Sans', sans-serif",
      color: '#e2e8f0',
      padding: '24px 20px 48px',
    }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <a href="/" style={{ color: '#64748b', textDecoration: 'none', fontSize: '20px' }}>←</a>
          <h1 style={{
            fontSize: '20px', fontWeight: 800,
            background: 'linear-gradient(135deg,#c084fc,#a855f7)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>Mentions légales & RGPD</h1>
        </div>

        <p style={{ fontSize: '13px', color: '#475569', marginBottom: '24px' }}>Dernière mise à jour : avril 2026</p>

        {[
          {
            title: '1. Éditeur de l\'application',
            content: (
              <>
                <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.7, marginBottom: '8px' }}>WolfFuel est une application web de consultation des prix des carburants en France.</p>
                <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.7, marginBottom: '8px' }}>Contact : <span style={{ color: '#a855f7' }}>contact@wolffuel.fr</span></p>
                <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.7 }}>Hébergement : Vercel Inc. — 440 N Barranca Ave #4133, Covina, CA 91723, USA</p>
              </>
            )
          },
          {
            title: '2. Données personnelles collectées',
            content: (
              <>
                <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.7, marginBottom: '8px' }}>Conformément au RGPD (Règlement UE 2016/679), nous collectons uniquement les données nécessaires au service :</p>
                <ul style={{ paddingLeft: '20px', margin: '8px 0 12px' }}>
                  {['Adresse email — création et gestion du compte','Pseudo — identifiant visible choisi par l\'utilisateur','Statut d\'abonnement — accès aux fonctionnalités Wolf Pro','Dernière connexion — affichage du statut en ligne','Stations favorites & alertes prix — fonctionnalités premium'].map((item, i) => (
                    <li key={i} style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.7, marginBottom: '4px' }}>{item}</li>
                  ))}
                </ul>
                <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.7 }}>Aucune donnée sensible n&apos;est stockée par WolfFuel. Les paiements sont traités exclusivement par Stripe (aucune donnée bancaire stockée sur nos serveurs).</p>
              </>
            )
          },
          {
            title: '3. Base légale du traitement',
            content: (
              <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
                {['Exécution du contrat — fourniture du service (compte, abonnement)','Consentement — fonctionnalités optionnelles (alertes, favoris)','Intérêt légitime — sécurité du service, prévention des abus'].map((item, i) => (
                  <li key={i} style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.7, marginBottom: '4px' }}>{item}</li>
                ))}
              </ul>
            )
          },
          {
            title: '4. Durée de conservation',
            content: <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.7 }}>Les données sont conservées pendant la durée d&apos;activité du compte. En cas de suppression, toutes les données associées sont effacées dans un délai de 30 jours.</p>
          },
          {
            title: '5. Sous-traitants',
            content: (
              <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
                {['Supabase (base de données & auth) — hébergé en Europe (Frankfurt)','Vercel (hébergement) — serveurs en Europe','Stripe (paiement) — traitement sécurisé des abonnements Wolf Pro','Resend (emails transactionnels) — envoi des confirmations et factures','data.gouv.fr (Open Data) — prix des carburants, données publiques françaises'].map((item, i) => (
                  <li key={i} style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.7, marginBottom: '4px' }}>{item}</li>
                ))}
              </ul>
            )
          },
          {
            title: '6. Vos droits',
            content: (
              <>
                <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.7, marginBottom: '8px' }}>Conformément au RGPD, vous disposez des droits suivants :</p>
                <ul style={{ paddingLeft: '20px', margin: '8px 0 12px' }}>
                  {['Droit d\'accès — obtenir une copie de vos données','Droit de rectification — corriger des données inexactes','Droit à l\'effacement — demander la suppression','Droit à la portabilité — recevoir vos données dans un format lisible','Droit d\'opposition — vous opposer à certains traitements'].map((item, i) => (
                    <li key={i} style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.7, marginBottom: '4px' }}>{item}</li>
                  ))}
                </ul>
                <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.7, marginBottom: '8px' }}>Tu peux également supprimer ton compte et toutes tes données directement depuis ton <strong style={{ color: '#e2e8f0' }}>profil</strong> (bas de page).</p>
                <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.7, marginBottom: '8px' }}>Pour exercer ces droits : <span style={{ color: '#a855f7' }}>contact@wolffuel.fr</span></p>
                <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.7 }}>En cas de litige, vous pouvez saisir la <strong style={{ color: '#e2e8f0' }}>CNIL</strong> — <span style={{ color: '#a855f7' }}>www.cnil.fr</span></p>
              </>
            )
          },
          {
            title: '7. Cookies & stockage local',
            content: <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.7 }}>WolfFuel utilise uniquement des cookies techniques nécessaires au fonctionnement (session d&apos;authentification). Aucun cookie publicitaire ou de tracking tiers n&apos;est utilisé.</p>
          },
          {
            title: '8. Source des données carburants',
            content: <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.7 }}>Les prix proviennent des données ouvertes du gouvernement français (<strong style={{ color: '#e2e8f0' }}>data.gouv.fr</strong>) sous licence Ouverte. Ces données sont mises à jour régulièrement mais peuvent ne pas refléter les prix en temps réel — ce délai reste exceptionnel et indépendant de WolfFuel. WolfFuel ne garantit pas l&apos;exactitude en temps réel des prix affichés et décline toute responsabilité pour les éventuelles erreurs provenant des sources officielles.</p>
          },
          {
            title: '9. Abonnement Wolf Pro',
            content: <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.7 }}>L&apos;abonnement Wolf Pro est proposé à 2,99€/mois via Stripe. Résiliable à tout moment depuis ton espace abonnement. Aucun remboursement pour les périodes déjà facturées. Aucune donnée bancaire n&apos;est stockée par WolfFuel.</p>
          },
        ].map((s, i) => (
          <div key={i} style={{
            background: 'rgba(15,10,40,.85)',
            border: '1.5px solid rgba(139,92,246,.25)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '16px',
          }}>
            <h2 style={{
              fontSize: '15px', fontWeight: 800, color: '#c084fc',
              marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '.06em',
            }}>{s.title}</h2>
            {s.content}
          </div>
        ))}

        <p style={{ textAlign: 'center', marginTop: '32px' }}>
          <a href="/" style={{ color: '#64748b', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
            ← Retour à l&apos;accueil
          </a>
        </p>
      </div>
    </div>
  )
}
