import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

function invoiceHtml(email: string, subscriptionId: string, date: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>WolfFuel — Confirmation d'abonnement</title>
</head>
<body style="margin:0;padding:0;background:#0d0a1a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0a1a;min-height:100vh;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <div style="font-size:36px;margin-bottom:8px;">🐺⛽</div>
              <div style="font-size:24px;font-weight:800;background:linear-gradient(135deg,#c084fc,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:-0.5px;">
                WolfFuel
              </div>
              <div style="font-size:13px;color:#64748b;margin-top:4px;">Prix carburants France</div>
            </td>
          </tr>

          <!-- Card principale -->
          <tr>
            <td style="background:rgba(15,10,40,0.95);border:1.5px solid rgba(139,92,246,0.3);border-radius:20px;padding:36px 32px;">

              <!-- Icône succès -->
              <div style="text-align:center;margin-bottom:24px;">
                <div style="display:inline-block;width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,rgba(168,85,247,.3),rgba(124,58,237,.2));border:2px solid rgba(168,85,247,.5);font-size:32px;line-height:72px;text-align:center;">🐺⭐</div>
              </div>

              <p style="margin:0 0 6px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;text-align:center;">
                Bienvenue dans la meute
              </p>
              <h1 style="margin:0 0 24px;font-size:22px;font-weight:800;color:#f1f5f9;text-align:center;line-height:1.3;">
                Tu es maintenant <span style="color:#c084fc;">Wolf Pro</span> ! 🎉
              </h1>

              <!-- Récapitulatif facture -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(168,85,247,.06);border:1px solid rgba(168,85,247,.2);border-radius:14px;padding:20px;margin-bottom:24px;">
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid rgba(168,85,247,.1);">
                    <span style="font-size:13px;color:#64748b;">Abonnement</span>
                    <span style="float:right;font-size:13px;font-weight:700;color:#f1f5f9;">Wolf Pro</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid rgba(168,85,247,.1);">
                    <span style="font-size:13px;color:#64748b;">Montant</span>
                    <span style="float:right;font-size:13px;font-weight:700;color:#f1f5f9;">2,99 € / mois</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid rgba(168,85,247,.1);">
                    <span style="font-size:13px;color:#64748b;">Date</span>
                    <span style="float:right;font-size:13px;font-weight:700;color:#f1f5f9;">${date}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid rgba(168,85,247,.1);">
                    <span style="font-size:13px;color:#64748b;">Email</span>
                    <span style="float:right;font-size:13px;font-weight:700;color:#f1f5f9;">${email}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">
                    <span style="font-size:13px;color:#64748b;">Réf. abonnement</span>
                    <span style="float:right;font-size:11px;font-weight:600;color:#7c3aed;font-family:monospace;">${subscriptionId}</span>
                  </td>
                </tr>
              </table>

              <!-- Fonctionnalités débloquées -->
              <p style="margin:0 0 14px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;">
                Fonctionnalités débloquées
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                ${[
                  ['🔔', 'Alertes prix par email'],
                  ['⭐', 'Stations favorites'],
                  ['📈', 'Historique des prix 30 jours'],
                  ['💰', 'Calcul de tes économies'],
                  ['🚫', 'Sans publicité'],
                  ['🐺⭐', 'Badge Wolf Pro'],
                ].map(([icon, label]) => `
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#e2e8f0;">
                    <span style="margin-right:8px;">${icon}</span>${label}
                    <span style="float:right;color:#34d399;font-weight:700;">✓</span>
                  </td>
                </tr>`).join('')}
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://wolffuel.fr"
                       style="display:inline-block;padding:15px 40px;background:linear-gradient(135deg,#a855f7,#7c3aed);color:#ffffff;font-size:16px;font-weight:800;text-decoration:none;border-radius:14px;">
                      🐺 Commencer la chasse
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Séparateur -->
              <div style="border-top:1px solid rgba(139,92,246,.15);margin:28px 0;"></div>

              <p style="margin:0;font-size:12px;color:#475569;text-align:center;line-height:1.6;">
                Tu peux gérer ou résilier ton abonnement directement depuis ton compte PayPal.<br>
                Cet abonnement est sans engagement et résiliable à tout moment.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#334155;">
                Des questions ? Contacte-nous à <span style="color:#7c3aed;">contact@wolffuel.fr</span>
              </p>
              <p style="margin:6px 0 0;font-size:12px;color:#1e293b;">
                © 2025 WolfFuel · <a href="https://wolffuel.fr/mentions-legales" style="color:#1e293b;">Mentions légales</a>
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
