import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'fr.wolffuel.app',
  appName: 'WolfFuel',
  webDir: 'out',
  server: {
    url: 'https://www.wolffuel.fr',
    cleartext: false,
  },
  android: {
    backgroundColor: '#060612',
  },
}

export default config
