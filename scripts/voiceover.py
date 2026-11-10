"""Voix off féminine (FR) — synthèse locale Kokoro (voix ff_siwis), calée sur le minutage des scènes.
Usage : python3 scripts/voiceover.py <dossier contenant kokoro.onnx et voices.bin>
Sortie : audio/voix-off.wav (45 s) puis out/easyfly-pub-45s-voix.mp4
"""
import re, subprocess, sys
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

M = sys.argv[1]
k = Kokoro(f"{M}/kokoro.onnx", f"{M}/voices.bin")
SR, DUR = 24000, 45.0
STEP, TD = 1.32, 12.3           # cadence des destinations (cf. src/main.js)

# (début en s, texte, vitesse)
LINES = [
    (0.9,  "Easy Fly.", 0.92),
    (2.05, "Voyagez partout dans le monde, en toute simplicité.", 0.95),
    (5.45, "Le monde n'attend que vous.", 0.92),
    (7.9,  "Une seule agence, mille horizons.", 0.95),
    (10.0, "Au départ de Lubumbashi, envolez-vous vers", 1.0),
]
for i, d in enumerate(["l'Afrique du Sud,", "le Kenya,", "la Tanzanie,", "les Maldives,", "les Seychelles,",
                       "la Zambie,", "la Namibie,", "le Qatar,", "Singapour."]):
    LINES.append((TD + i * STEP + 0.12, d, 0.95))
LINES += [
    (24.35, "Et tant d'autres destinations.", 0.95),
    (26.5,  "Tous vos services de voyage :", 1.0),
    (28.45, "billets d'avion, visas, hôtels, jets privés, accueil VIP, orientation études.", 0.93),
    (35.0,  "Nos connexions, votre liberté.", 0.9),
    (39.5,  "Easy Fly.", 0.92),
    (40.7,  "Réservez dès aujourd'hui.", 0.92),
]

def phon(text):
    p = k.tokenizer.phonemize(text, "fr-fr")
    p = re.sub(r"\((en|fr)\)", "", p)                 # marqueurs de changement de langue
    p = p.replace("lybœ̃baʃˈi", "lubumbaʃˈi")        # Lubumbashi
    return p

mix = np.zeros(int(SR * DUR), dtype=np.float32)
prev_end = 0.0
for t, text, speed in LINES:
    a, sr = k.create(phon(text), voice="ff_siwis", speed=speed, lang="fr-fr", is_phonemes=True)
    assert sr == SR
    nz = np.flatnonzero(np.abs(a) > 0.01); a = a[max(0, nz[0] - 600): nz[-1] + 2400]   # rognage des silences
    fade = np.linspace(1, 0, 1200, dtype=np.float32); a[-1200:] *= fade
    flag = "  << CHEVAUCHEMENT" if t < prev_end else ""
    print(f"{t:6.2f} → {t + len(a) / SR:6.2f}  {text}{flag}")
    prev_end = t + len(a) / SR
    i0 = int(t * SR); mix[i0:i0 + len(a)] += a[: len(mix) - i0]
mix *= 0.89 / np.abs(mix).max()
sf.write("audio/voix-off.wav", mix, SR)

subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", "out/easyfly-pub-45s.mp4", "-i", "audio/voix-off.wav",
    "-af", "highpass=f=70,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=160,loudnorm=I=-16:TP=-1.5:LRA=9,aresample=48000",
    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart",
    "out/easyfly-pub-45s-voix.mp4"], check=True)
print("→ out/easyfly-pub-45s-voix.mp4")
