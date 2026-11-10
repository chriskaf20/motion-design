# EASY FLY — Publicité motion design (45 s)

Vidéo publicitaire verticale **1080 × 1920, 30 i/s, 45 s** pour l'agence de voyage EASY FLY (Lubumbashi).
Entièrement réalisée en code : HTML/CSS/SVG animés par une timeline GSAP, rendue image par image puis encodée en MP4.

**Fichier final : `out/easyfly-pub-45s.mp4`** (sans bande-son — à ajouter au montage).

## Storyboard

| Temps | Scène | Contenu |
|---|---|---|
| 0 – 4,9 s | Logo | Aile dorée + EASY FLY, « Voyagez partout dans le monde… en toute simplicité. » |
| 4,9 – 9,9 s | Typographie cinétique | « Le monde n'attend que vous. » → « Une seule agence, mille horizons. » |
| 9,8 – 26,4 s | Destinations | Carte en points, trajets au départ de Lubumbashi : Afrique du Sud, Kenya, Tanzanie, Maldives, Seychelles, Zambie, Namibie, Qatar, Singapour, « et tant d'autres » |
| 26,3 – 34,6 s | Services | Cartes en perspective 3D : billets, visas, hôtels, jets privés, accueil VIP, orientation études |
| 34,5 – 39,1 s | Signature | « Nos connexions, votre liberté. » |
| 39 – 45 s | Appel à l'action | Logo, « Réservez dès aujourd'hui », téléphone, e-mail, Charck's Holding |

## Design system

- **Couleurs** : bleu nuit `#0A1B2B`, or `#D4A853` / `#F0D592`, crème `#F3E9D2`, lueur ambrée `#D98A3D`
- **Typographies** : Cormorant Garamond (titres), Josefin Sans (logo, libellés)
- **Mouvement** : entrées `expo.out`, sorties `power3.in`, déplacements de caméra `power3.inOut`

## Modifier et relancer le rendu

```bash
npm install
npm run build:map   # régénère la carte et src/vendor (facultatif)
npm run render      # → out/easyfly-pub-45s.mp4  (nécessite Playwright + ffmpeg)
node scripts/render.mjs --at 3,15,42   # images fixes de contrôle dans frames/stills
```

- Textes, destinations et services : tableaux `DESTS` et `SERVICES` en tête de `src/main.js`
- Minutage : fonction `build()` de `src/main.js` (une section par scène)
- Aperçu en direct : ouvrir `src/index.html` dans un navigateur (espace = pause)
