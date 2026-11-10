// Génère la carte en points (terres émergées) + copie les dépendances front dans src/vendor.
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { geoContains } from 'd3-geo';
import { feature } from 'topojson-client';

const topo = JSON.parse(readFileSync('node_modules/world-atlas/land-50m.json', 'utf8'));
const land = feature(topo, topo.objects.land);

// Projection équirectangulaire : x = (lon - LON0) * K ; y = (LAT0 - lat) * K
const LON0 = -20, LON1 = 122, LAT0 = 46, LAT1 = -40, K = 8, STEP = 1.5;
const dots = [];
for (let lat = LAT0; lat >= LAT1; lat -= STEP) {
  for (let lon = LON0; lon <= LON1; lon += STEP) {
    if (geoContains(land, [lon, lat])) {
      dots.push([+((lon - LON0) * K).toFixed(1), +((LAT0 - lat) * K).toFixed(1)]);
    }
  }
}
writeFileSync(
  'src/map-data.js',
  `// Fichier généré par scripts/build-map.mjs — ne pas modifier à la main.\n` +
  `window.MAP = ${JSON.stringify({ LON0, LAT0, K, dots })};\n`
);
console.log(`map: ${dots.length} points`);

mkdirSync('src/vendor/fonts', { recursive: true });
copyFileSync('node_modules/gsap/dist/gsap.min.js', 'src/vendor/gsap.min.js');
const fonts = [
  ['cormorant-garamond', ['500-normal', '500-italic', '600-normal', '600-italic']],
  ['josefin-sans', ['300-normal', '400-normal', '600-normal']],
];
for (const [fam, variants] of fonts)
  for (const v of variants)
    copyFileSync(`node_modules/@fontsource/${fam}/files/${fam}-latin-${v}.woff2`, `src/vendor/fonts/${fam}-${v}.woff2`);
console.log('vendor: ok');
