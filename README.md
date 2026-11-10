# EASY FLY — Publicité motion design (35 s)

Vidéo publicitaire verticale **1080 × 1920, 30 i/s, 35 s** pour l'agence de voyage EASY FLY (Lubumbashi).
Entièrement réalisée en code : HTML/CSS/SVG animés par une timeline GSAP, rendue image par image puis encodée en MP4.

**Fichier final : `out/easyfly-pub-35s.mp4`** (sans bande-son pour l'instant).

## Storyboard

| Temps | Scène | Contenu |
|---|---|---|
| 0 – 3,6 s | Logo | Aile dorée + EASY FLY, « Voyagez partout dans le monde… en toute simplicité. » |
| 3,6 – 6,9 s | Typographie cinétique | « Le monde n'attend que vous. » |
| 6,7 – 20,2 s | Destinations | Carte en points + billet d'embarquement animé : 9 destinations au départ de Lubumbashi, « et tant d'autres » |
| 20 – 26,7 s | Services | Cartes en perspective 3D : billets, visas, hôtels, jets privés, accueil VIP, orientation études |
| 26,6 – 30 s | Signature | « Nos connexions, votre liberté. » |
| 29,8 – 35 s | Appel à l'action | Panneau marine : « Réservez dès aujourd'hui », téléphone, e-mail, Charck's Holding |

## Design system (thème clair)

- **Couleurs** : ciel `#DCEAF4`, ivoire `#F8F3EA`, marine `#0B2135`, or profond `#B07F28`, or lumineux `#E2BD68`
- **Typographies** : Cormorant Garamond (titres), Josefin Sans (logo, libellés)
- **Mouvement** : entrées `expo.out`, sorties `power3.in`, déplacements de caméra `power3.inOut`

## Modifier et relancer le rendu

```bash
npm install
npm run build:map   # régénère la carte et src/vendor (facultatif)
npm run render      # → out/easyfly-pub-35s.mp4  (nécessite Playwright + ffmpeg)
node scripts/render.mjs --at 3,15,42   # images fixes de contrôle dans frames/stills
```

- Textes, destinations et services : tableaux `DESTS` et `SERVICES` en tête de `src/main.js`
- Minutage : fonction `build()` de `src/main.js` (une section par scène)
- Aperçu en direct : ouvrir `src/index.html` dans un navigateur (espace = pause)
