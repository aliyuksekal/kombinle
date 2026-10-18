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
uygulama = '(function () {\n' + govde + '\n})();\n'
open(os.path.join(DIST, 'app.full.js'), 'w', encoding='utf-8').write(uygulama)
boot = open(os.path.join(SRC, 'boot.js'), encoding='utf-8').read().strip()
fonts = open(os.path.join(KOK, 'fonts', 'fonts.css'), encoding='utf-8').read()
sablon = open(os.path.join(SRC, 'index.tpl.html'), encoding='utf-8').read()


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
           "; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src https://api.met.no blob: data:; "
           "media-src blob: mediastream:; object-src 'none'; base-uri 'none'; form-action 'none'; worker-src 'none'; manifest-src 'none'")
    html = (sablon.replace('{{CSP}}', csp).replace('{{FONTS}}', fonts)
            .replace('{{BOOT}}', boot_js).replace('{{APP}}', app_js))
    yol = os.path.join(DIST, ad)
    open(yol, 'w', encoding='utf-8').write(html)
    print(ad, round(os.path.getsize(yol) / 1024), 'KB')


yaz('kombinle-kaynak.html', uygulama, boot)
uretim = '\n'.join(l for l in uygulama.split('\n') if "LS.al('ayikla'" not in l)
yaz('kombinle.html', kucult(uretim), kucult(boot))
