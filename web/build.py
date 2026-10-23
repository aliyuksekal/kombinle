#!/usr/bin/env python3
"""Kombinle derleme: kaynak dosyaları birleştirir, küçültür, CSP özetlerini hesaplar."""
import base64, hashlib, os, subprocess, sys, glob

KOK = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(KOK, 'src')
DIST = os.path.join(KOK, 'dist')
ESBUILD = '/opt/npm-tools/node_modules/.bin/esbuild'
os.makedirs(DIST, exist_ok=True)

parcalar = sorted(f for f in glob.glob(os.path.join(SRC, '[0-9][0-9]-*.js')))
govde = '\n'.join(open(f, encoding='utf-8').read() for f in parcalar)
uygulama = '(function () {\n"use strict";\n' + govde + '\n})();\n'
open(os.path.join(DIST, 'app.full.js'), 'w', encoding='utf-8').write(uygulama)
boot = open(os.path.join(SRC, 'boot.js'), encoding='utf-8').read().strip()
fonts = open(os.path.join(KOK, 'fonts', 'fonts.css'), encoding='utf-8').read()
sablon = open(os.path.join(SRC, 'index.tpl.html'), encoding='utf-8').read()


def acilis_ekrani():
    """Açılış ekranı: uygulama kodu yüklenmeden ilk karede görünür (yalnız CSS animasyonu)."""
    import random
    rnd = random.Random(7)
    def veri(ad):
        return 'data:image/webp;base64,' + base64.b64encode(open(os.path.join(KOK, 'acilis', ad), 'rb').read()).decode()
    bokeh = []
    for i in range(20):
        b = rnd.uniform(3, 13); x = rnd.uniform(-8, 96); y = rnd.choice([rnd.uniform(-6, 30), rnd.uniform(68, 100)])
        bokeh.append('<span class="bk" style="width:%.1fvmax;height:%.1fvmax;left:%.1f%%;top:%.1f%%;animation-delay:%.2fs,%.2fs;opacity:%.2f"></span>'
                     % (b, b, x, y, rnd.uniform(0.1, 1.2), rnd.uniform(0, 4), rnd.uniform(0.18, 0.5)))
    toz = []
    for i in range(46):
        x = rnd.gauss(50, 22); y = rnd.gauss(45, 16)
        toz.append('<span class="toz" style="left:%.1f%%;top:%.1f%%;--dx:%dpx;--dy:%dpx;animation-delay:%.2fs,%.2fs;transform:scale(%.2f)"></span>'
                   % (min(98, max(1, x)), min(95, max(2, y)), rnd.randint(-60, 60), rnd.randint(-40, 40), rnd.uniform(0.6, 1.9), rnd.uniform(1.6, 3.5), rnd.uniform(0.4, 1.1)))
    h = open(os.path.join(SRC, 'acilis.html'), encoding='utf-8').read()
    return (h.replace('{{BOKEH}}', ''.join(bokeh)).replace('{{TOZ}}', ''.join(toz))
            .replace('{{AMBLEM}}', veri('amblem.webp')).replace('{{AD}}', veri('ad.webp')).replace('{{SLOGAN}}', veri('slogan.webp')))


sablon = sablon.replace('<body>\n', '<body>\n' + acilis_ekrani() + '\n', 1)


def kucult(kod):
    r = subprocess.run([ESBUILD, '--minify', '--target=es2018', '--legal-comments=none', '--charset=utf8', '--loader=js'],
                       input=kod.encode('utf-8'), capture_output=True)
    if r.returncode != 0:
        sys.stderr.write(r.stderr.decode())
        sys.exit(1)
    return r.stdout.decode('utf-8').strip()


def ozet(kod):
    return "'sha256-" + base64.b64encode(hashlib.sha256(kod.encode('utf-8')).digest()).decode() + "'"


def yaz(ad, app_js, boot_js):
    if '</script' in app_js.lower() or '</script' in boot_js.lower():
        sys.exit('script içinde </script> geçiyor')
    csp = ("default-src 'none'; script-src " + ozet(boot_js) + ' ' + ozet(app_js) +
           "; style-src 'unsafe-inline'; img-src data: blob: https:; font-src data:; connect-src https://api.met.no blob: data:; "
           "media-src blob: mediastream:; object-src 'none'; base-uri 'none'; form-action 'none'; worker-src 'none'; manifest-src 'none'")
    html = (sablon.replace('{{CSP}}', csp).replace('{{FONTS}}', fonts)
            .replace('{{BOOT}}', boot_js).replace('{{APP}}', app_js))
    yol = os.path.join(DIST, ad)
    open(yol, 'w', encoding='utf-8').write(html)
    print(ad, round(os.path.getsize(yol) / 1024), 'KB')


yaz('kombinle-kaynak.html', uygulama, boot)
uretim = '\n'.join(l for l in uygulama.split('\n') if "LS.al('ayikla'" not in l)
yaz('kombinle.html', kucult(uretim), kucult(boot))
