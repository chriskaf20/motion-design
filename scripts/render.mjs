// Rendu image par image (Playwright) puis encodage H.264 (ffmpeg).
// Usage : node scripts/render.mjs [--at 3.5,12,30]   (--at : images fixes de contrôle)
import { spawnSync, execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Playwright : installation locale, sinon globale (npm root -g)
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require(execSync('npm root -g').toString().trim() + '/playwright')); }

const FPS = 30, W = 1080, H = 1920, WORKERS = 4;
const url = pathToFileURL(resolve('src/index.html')).href + '?render';
const atIdx = process.argv.indexOf('--at');
const stills = atIdx > -1 ? process.argv[atIdx + 1].split(',').map(Number) : null;
const dir = resolve(stills ? 'frames/stills' : 'frames/seq');
rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
mkdirSync('out', { recursive: true });

const browser = await chromium.launch();
const open = async () => {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on('pageerror', e => { console.error('PAGE ERROR', e.message); process.exitCode = 1; });
  await page.goto(url);
  await page.waitForFunction('window.READY === true');
  return page;
};

if (stills) {
  const page = await open();
  for (const t of stills) {
    await page.evaluate(t => window.seek(t), t);
    await page.screenshot({ path: `${dir}/t${t.toFixed(2).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 80 });
  }
  await browser.close();
  console.log('stills →', dir);
} else {
  const total = Math.round(45 * FPS);
  let next = 0, done = 0;
  await Promise.all(Array.from({ length: WORKERS }, async () => {
    const page = await open();
    while (next < total) {
      const f = next++;
      await page.evaluate(t => window.seek(t), f / FPS);
      await page.screenshot({ path: `${dir}/f${String(f).padStart(5, '0')}.png`, type: 'png' });
      if (++done % 150 === 0) console.log(`${done}/${total}`);
    }
  }));
  await browser.close();
  const r = spawnSync('ffmpeg', ['-y', '-v', 'error', '-framerate', String(FPS), '-i', `${dir}/f%05d.png`,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    'out/easyfly-pub-45s.mp4'], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(1);
  console.log('vidéo → out/easyfly-pub-45s.mp4');
}
