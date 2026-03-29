# WolfFuel — Next.js

## Structure du projet

```
wolffuel/
├── src/
│   ├── app/
│   │   ├── layout.tsx        ← Métadonnées, polices, PWA
│   │   ├── page.tsx          ← Page principale
│   │   └── globals.css       ← Tout le CSS de l'app
│   └── components/
│       └── WolfFuelApp.tsx   ← App complète (phase 1 : migration directe)
├── public/
│   └── manifest.json         ← PWA manifest
├── package.json
├── next.config.js
└── tsconfig.json
```

## Installation & démarrage

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

## Déploiement sur Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel
```

## Prochaines étapes (refactoring)

- [ ] Extraire `Splash.tsx` — composant du timer de lancement
- [ ] Extraire `SearchScreen.tsx` — écran de recherche principal  
- [ ] Extraire `ResultsScreen.tsx` — affichage des résultats
- [ ] Extraire `EVStations.tsx` — bornes électriques
- [ ] Extraire `Chatbot.tsx` — assistant
- [ ] Migrer les `useState` / `useEffect` pour chaque feature
- [ ] Créer des hooks : `useFuelSearch`, `useEVStations`, `useGeolocation`
- [ ] API Routes Next.js pour les appels carburants et Overpass
