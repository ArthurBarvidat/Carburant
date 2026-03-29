import type { Metadata } from 'next'
import './globals.css'
import ProfileButton from '@/components/ProfileButton'

export const metadata: Metadata = {
  title: 'WolfFuel — Prix Carburants France',
  description: 'Meilleurs prix carburants France',
  themeColor: '#060612',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'WolfFuel',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#060612" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <ProfileButton />
      </body>
    </html>
  )
}
