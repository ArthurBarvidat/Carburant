import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

function invoiceHtml(email: string, subscriptionId: string, date: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>WolfFuel — Confirmation Wolf Pro</title>
</head>
<body style="margin:0;padding:0;background:#060612;font-family:'Segoe UI',Arial,sans-serif;">

  <!-- Background -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(165deg,#0d0a1a 0%,#1a1130 50%,#0d0a1a 100%);min-height:100vh;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header logo -->
          <tr>
            <td align="center" style="padding-bottom:36px;">
              <div style="font-size:52px;line-height:1;margin-bottom:12px;">🐺</div>
              <div style="font-size:28px;font-weight:800;color:#c084fc;letter-spacing:-0.5px;">WolfFuel</div>
              <div style="font-size:13px;color:#475569;margin-top:4px;letter-spacing:0.05em;">PRIX CARBURANTS FRANCE</div>
            </td>
          </tr>

          <!-- Card principale -->
          <tr>
            <td style="background:#0f0a28;border:1.5px solid rgba(168,85,247,0.35);border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.6);">

              <!-- Bandeau supérieur gradient -->
              <div style="background:linear-gradient(135deg,#7c3aed,#a855f7,#c084fc);padding:28px 32px;text-align:center;">
                <div style="font-size:40px;margin-bottom:10px;">🎉</div>
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:rgba(255,255,255,0.7);margin-bottom:6px;">Bienvenue dans la meute</div>
                <div style="font-size:24px;font-weight:800;color:#ffffff;line-height:1.3;">Tu es maintenant <span style="background:rgba(255,255,255,0.2);padding:2px 10px;border-radius:8px;">Wolf Pro</span> !</div>
              </div>

              <!-- Contenu -->
              <div style="padding:32px;">

                <p style="margin:0 0 24px;font-size:15px;color:#94a3b8;line-height:1.7;text-align:center;">
                  Merci pour ta confiance 🙏<br>
                  Voici le récapitulatif de ton abonnement.
                </p>

                <!-- Tableau facture -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(168,85,247,0.06);border:1px solid rgba(168,85,247,0.2);border-radius:16px;overflow:hidden;margin-bottom:28px;">
                  <tr style="border-bottom:1px solid rgba(168,85,247,0.1);">
                    <td style="padding:14px 18px;font-size:13px;color:#64748b;">Produit</td>
                    <td style="padding:14px 18px;font-size:13px;font-weight:700;color:#c084fc;text-align:right;">🐺⭐ Wolf Pro</td>
                  </tr>
                  <tr style="border-bottom:1px solid rgba(168,85,247,0.1);">
                    <td style="padding:14px 18px;font-size:13px;color:#64748b;">Montant</td>
                    <td style="padding:14px 18px;font-size:13px;font-weight:700;color:#f1f5f9;text-align:right;">2,99 € / mois</td>
                  </tr>
                  <tr style="border-bottom:1px solid rgba(168,85,247,0.1);">
                    <td style="padding:14px 18px;font-size:13px;color:#64748b;">Date</td>
                    <td style="padding:14px 18px;font-size:13px;font-weight:700;color:#f1f5f9;text-align:right;">${date}</td>
                  </tr>
                  <tr style="border-bottom:1px solid rgba(168,85,247,0.1);">
                    <td style="padding:14px 18px;font-size:13px;color:#64748b;">Email</td>
                    <td style="padding:14px 18px;font-size:13px;font-weight:700;color:#f1f5f9;text-align:right;">${email}</td>
                  </tr>
                  <tr>
                    <td style="padding:14px 18px;font-size:13px;color:#64748b;">Référence</td>
                    <td style="padding:14px 18px;font-size:11px;font-weight:600;color:#7c3aed;text-align:right;font-family:monospace;">${subscriptionId}</td>
                  </tr>
                </table>

                <!-- Fonctionnalités -->
                <div style="margin-bottom:28px;">
                  <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#64748b;margin-bottom:14px;">Fonctionnalités débloquées</div>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    ${[
                      ['🔔', 'Alertes prix par email'],
                      ['⭐', 'Stations favorites'],
                      ['📈', 'Historique des prix 30 jours'],
                      ['💰', 'Calcul de tes économies'],
                      ['🚫', 'Sans publicité'],
                      ['🐺⭐', 'Badge Wolf Pro'],
                    ].map(([icon, label]) => `
                    <tr>
                      <td style="padding:8px 0;border-bottom:1px solid rgba(168,85,247,0.07);">
                        <span style="font-size:15px;margin-right:10px;">${icon}</span>
                        <span style="font-size:14px;color:#e2e8f0;">${label}</span>
                        <span style="float:right;font-size:13px;font-weight:700;color:#34d399;">✓ Actif</span>
                      </td>
                    </tr>`).join('')}
                  </table>
                </div>

                <!-- CTA -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                  <tr>
                    <td align="center">
                      <a href="https://wolffuel.fr"
                         style="display:inline-block;padding:16px 48px;background:linear-gradient(135deg,#a855f7,#7c3aed);color:#ffffff;font-size:16px;font-weight:800;text-decoration:none;border-radius:14px;letter-spacing:0.02em;">
                        🐺 Commencer la chasse
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- Note résiliation -->
                <div style="background:rgba(168,85,247,0.05);border:1px solid rgba(168,85,247,0.12);border-radius:12px;padding:14px 16px;text-align:center;">
                  <p style="margin:0;font-size:12px;color:#475569;line-height:1.6;">
                    Abonnement résiliable à tout moment depuis ton <a href="https://wolffuel.fr/abonnement" style="color:#7c3aed;text-decoration:none;font-weight:600;">espace abonnement</a>.<br>
                    Aucun engagement · Renouvellement automatique chaque mois.
                  </p>
                </div>

              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0 0 4px;font-size:12px;color:#334155;">
                Des questions ? <a href="mailto:contact@wolffuel.fr" style="color:#7c3aed;text-decoration:none;">contact@wolffuel.fr</a>
              </p>
              <p style="margin:0;font-size:11px;color:#1e293b;">
                © ${new Date().getFullYear()} WolfFuel ·
                <a href="https://wolffuel.fr/mentions-legales" style="color:#1e293b;text-decoration:none;">Mentions légales</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  try {
    const { email, subscriptionId } = await req.json()
    if (!email || !subscriptionId) {
      return NextResponse.json({ error: 'email et subscriptionId requis' }, { status: 400 })
    }

    const date = new Date().toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric'
    })

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'WolfFuel <noreply@wolffuel.fr>',
      to: email,
      subject: '🐺⭐ Bienvenue dans Wolf Pro — Confirmation d\'abonnement',
      html: invoiceHtml(email, subscriptionId, date),
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('send-invoice error:', e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
