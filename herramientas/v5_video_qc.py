#!/usr/bin/env python3
"""MX Óptica · Control de calidad de la prueba audiovisual (escena 1, 3 s).

Uso:
  python3 herramientas/v5_video_qc.py CLIP.mp4 --poster sitio/media/hero-v2-poster.jpg --out docs/v5/propuesta-video/qc

Qué hace (no modifica el clip original ni el sitio):
  1. Especificación: duración (2.5–3.5 s), resolución vertical, fps, ausencia de audio, peso.
  2. Movimiento natural frente a «fotografía animada»: para cada cuadro estima la mejor
     transformación global (zoom/giro/desplazamiento) desde el primer cuadro y mide lo que
     queda SIN explicar (residuo). Si un solo movimiento de cámara explica todo el clip, el
     residuo es casi cero → es una foto con efecto de cámara, no movimiento real del sujeto.
  3. Hoja de revisión de identidad: póster original junto a 5 cuadros del clip + mapa de
     movimiento no rígido, para la aprobación visual del propietario.
  4. Versión web normalizada (720×1280, H.264, sin audio, faststart) para la vista de revisión.
     NUNCA se copia a sitio/: integrarla requiere aprobación expresa.
"""
import argparse, json, os, subprocess, sys
import cv2, numpy as np

def probe(path):
    out = subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_type,codec_name,width,height,r_frame_rate:format=duration,size', '-of', 'json', path])
    d = json.loads(out)
    v = next(s for s in d['streams'] if s['codec_type'] == 'video')
    num, den = map(int, v['r_frame_rate'].split('/'))
    return {'duracion_s': round(float(d['format']['duration']), 3), 'ancho': v['width'], 'alto': v['height'], 'fps': round(num / den, 2),
            'codec': v['codec_name'], 'audio': any(s['codec_type'] == 'audio' for s in d['streams']), 'bytes': int(d['format']['size'])}

def frames(path, w=360):
    cap = cv2.VideoCapture(path); fs = []
    while True:
        ok, f = cap.read()
        if not ok: break
        h = int(f.shape[0] * w / f.shape[1]); fs.append(cv2.resize(f, (w, h), interpolation=cv2.INTER_AREA))
    return fs

def rigid_residual(f0, fi):
    """Residuo tras alinear fi con f0 mediante una transformación de similitud (lo que haría una cámara sobre una foto)."""
    g0, gi = cv2.cvtColor(f0, cv2.COLOR_BGR2GRAY), cv2.cvtColor(fi, cv2.COLOR_BGR2GRAY)
    orb = cv2.ORB_create(3000); k0, d0 = orb.detectAndCompute(g0, None); ki, di = orb.detectAndCompute(gi, None)
    if d0 is None or di is None or len(k0) < 20 or len(ki) < 20: return None, None, None
    m = sorted(cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True).match(d0, di), key=lambda x: x.distance)[:800]
    src = np.float32([k0[x.queryIdx].pt for x in m]); dst = np.float32([ki[x.trainIdx].pt for x in m])
    M, inl = cv2.estimateAffinePartial2D(src, dst, method=cv2.RANSAC, ransacReprojThreshold=2.0)
    if M is None: return None, None, None
    warped = cv2.warpAffine(g0, M, (g0.shape[1], g0.shape[0]), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    valid = cv2.warpAffine(np.ones_like(g0) * 255, M, (g0.shape[1], g0.shape[0]), flags=cv2.INTER_NEAREST)
    valid = cv2.erode(valid, np.ones((9, 9), np.uint8)) > 0
    h = g0.shape[0]; roi = np.zeros_like(valid); roi[int(h * .08):int(h * .62), :] = True  # zona de rostro y lentes
    sel = valid & roi
    diff = cv2.absdiff(cv2.GaussianBlur(warped, (5, 5), 0), cv2.GaussianBlur(gi, (5, 5), 0)).astype(np.float32)
    raw = cv2.absdiff(g0, gi).astype(np.float32)
    # % de píxeles del rostro con cambio no explicable por la cámara (> 14 niveles de gris)
    return float((diff[sel] > 14).mean() * 100), float((raw[sel] > 14).mean() * 100), diff * sel

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('clip'); ap.add_argument('--poster', required=True); ap.add_argument('--out', required=True)
    ap.add_argument('--umbral', type=float, default=1.0, help='%% de píxeles del rostro con cambio no rígido (p90) a partir del cual se considera movimiento natural')
    a = ap.parse_args(); os.makedirs(a.out, exist_ok=True)
    spec = probe(a.clip); fs = frames(a.clip)
    if len(fs) < 10: sys.exit('El clip tiene muy pocos cuadros.')
    res, raws, heat = [], [], None
    for i in range(1, len(fs)):
        r, raw, d = rigid_residual(fs[0], fs[i])
        if r is None: continue
        res.append(r); raws.append(raw)
        if i == len(fs) // 2: heat = d
    p90 = float(np.percentile(res, 90)) if res else 0.0
    natural = p90 >= a.umbral
    spec_ok = {'duracion_2.5_a_3.5s': 2.5 <= spec['duracion_s'] <= 3.5, 'vertical_9_16': abs(spec['alto'] / spec['ancho'] - 16 / 9) < 0.02 and spec['alto'] >= 1280,
               'fps_24_a_30': 23.9 <= spec['fps'] <= 30.1, 'sin_audio': not spec['audio']}
    # Hoja de revisión
    poster = cv2.imread(a.poster); H = 640; W = 360
    poster = cv2.resize(poster, (W, H)); idx = [0, len(fs) // 4, len(fs) // 2, 3 * len(fs) // 4, len(fs) - 1]
    tiles = [poster] + [cv2.resize(fs[i], (W, H)) for i in idx]
    if heat is not None:
        hm = cv2.applyColorMap(np.clip(heat * 12, 0, 255).astype(np.uint8), cv2.COLORMAP_INFERNO); tiles.append(cv2.resize(hm, (W, H)))
    sheet = np.full((H + 60, (W + 12) * len(tiles), 3), 255, np.uint8)
    labels = ['POSTER ORIGINAL'] + [f'CLIP {fs and round(i / max(1, len(fs) - 1) * spec["duracion_s"], 2)} s' for i in idx] + ['MOV. NO RIGIDO']
    for k, t in enumerate(tiles):
        x = k * (W + 12); sheet[0:H, x:x + W] = t
        cv2.putText(sheet, labels[k], (x + 8, H + 38), cv2.FONT_HERSHEY_SIMPLEX, .7, (40, 40, 40), 2, cv2.LINE_AA)
    cv2.imwrite(os.path.join(a.out, 'hoja-identidad.jpg'), sheet, [cv2.IMWRITE_JPEG_QUALITY, 88])
    web = os.path.join(a.out, 'escena1-revision.mp4')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', a.clip, '-an', '-vf', 'scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,fps=24', '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-crf', '24', '-maxrate', '1.2M', '-bufsize', '2.4M', '-movflags', '+faststart', web], check=True)
    rep = {'clip': os.path.basename(a.clip), 'especificacion': spec, 'controles': spec_ok,
           'movimiento': {'pct_pixeles_no_rigidos_p90': round(p90, 2), 'pct_pixeles_no_rigidos_mediana': round(float(np.median(res)), 2) if res else None,
                          'pct_pixeles_cambiados_sin_alinear_mediana': round(float(np.median(raws)), 2) if raws else None, 'umbral': a.umbral,
                          'veredicto': 'MOVIMIENTO NATURAL (no explicable por una cámara sobre foto)' if natural else 'FOTOGRAFÍA ANIMADA (todo el movimiento se explica con zoom/desplazamiento de una imagen fija)'},
           'version_web': {'archivo': os.path.basename(web), 'bytes': os.path.getsize(web)},
           'identidad': 'REQUIERE REVISIÓN VISUAL DEL PROPIETARIO con hoja-identidad.jpg (rostro, ojos, armazón dorado, arete, cabello, sonrisa, tono de piel).'}
    json.dump(rep, open(os.path.join(a.out, 'reporte-qc.json'), 'w'), ensure_ascii=False, indent=1)
    print(json.dumps(rep, ensure_ascii=False, indent=1))

if __name__ == '__main__':
    main()
