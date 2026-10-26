"""Play Store görselleri: telefon ekran görüntülerini başlıklı çerçevelere yerleştirir ve öne çıkan görseli üretir.

Kullanım:  python3 magaza/gorseller.py
Girdi:     web/tests/ekran/*.png (sınamaların aldığı ekran görüntüleri) ya da kendi telefonundan aldığın
           ekran görüntüleri (EKRANLAR listesindeki dosya adlarını değiştir).
Çıktı:     magaza/cikti/tr_01.png … (1080×1920) ve magaza/cikti/one_cikan.png (1024×500)
"""
import base64, os, pathlib
from playwright.sync_api import sync_playwright

KOK = pathlib.Path(__file__).resolve().parent.parent
EKRAN = KOK / 'web' / 'tests' / 'ekran'
CIKTI = KOK / 'magaza' / 'cikti'
FONT = KOK / 'web' / 'fonts'

# (dosya, üst başlık, alt satır, koyu zemin mi)
EKRANLAR = [
    ('mg04_kombin_acik.png', 'Dolabındakilerle<br>hazır kombin', 'Kıyafetlerinin fotoğrafını ekle, gerisini Kombinle yapsın', False),
    ('tm_turkuaz.png', 'Havaya ve gününe<br>göre öneri', 'Toplantı, düğün, spor… nereye gittiğini söyle yeter', False),
    ('SABAH', 'Her sabah kombinin<br>telefonunda', 'Bildirim ve ana ekran widget\'ı: hava durumu + günün kombini', True),
    ('mg10_sohbet_acik.png', 'Kombinle AI ile<br>konuş', 'Sor, sesli cevap versin: "Bugün ofiste ne giysem?"', False),
    ('c1_renk_analizi.png', 'Sana yakışan<br>renkleri keşfet', 'Bir selfie ile renk analizi, ruj ve takı önerisi', True),
    ('mg05_dolap_acik.png', '2 dakikada<br>dolabını doldur', 'Aynada tek fotoğraf ya da sipariş ekran görüntüsü yeter', False),
    ('mg03_bugun_koyu.png', 'Koyu mod ve<br>10 renkli tema', 'Gözünü yormayan, sana göre bir görünüm', True),
]


def b64(p):
    return base64.b64encode(pathlib.Path(p).read_bytes()).decode()


def fontlar():
    return ''.join(
        "@font-face{font-family:'%s';src:url(data:font/woff;base64,%s) format('woff');font-weight:%s}" % (ad, b64(FONT / dosya), agirlik)
        for ad, dosya, agirlik in [('Figtree', 'Figtree.woff', '300 900'), ('Bodoni', 'BodoniModa.woff', '400 900')])


def sabah_ekrani():
    """Kilit ekranında sabah bildirimi + ana ekran widget'ı (uygulamanın gerçek metinleriyle çizilir)."""
    kolaj = EKRAN / 'mg04_kombin_acik.png'
    return f"""
<div class="kilit">
  <div class="saat">07:30</div><div class="tarih">Salı, 27 Ekim</div>
  <div class="bildirim">
    <div class="b-ust"><span class="b-ikon">K</span><b>Kombinle</b><i>şimdi</i></div>
    <b class="b-baslik">Günaydın ☀️ Bugün 14–19°</b>
    <span class="b-metin">Önerin: Krem kazak, lacivert kumaş pantolon, siyah babet</span>
    <div class="b-resim" style="background-image:url(data:image/png;base64,{b64(kolaj)})"></div>
  </div>
  <div class="widget">
    <div class="w-resim" style="background-image:url(data:image/png;base64,{b64(kolaj)})"></div>
    <div class="w-yazi"><small>BUGÜN</small><b>Günaydın ☀️ Bugün 14–19°</b><span>Krem kazak, lacivert pantolon, siyah babet</span></div>
  </div>
</div>"""


STIL = """
*{box-sizing:border-box;margin:0}
body{width:1080px;height:1920px;overflow:hidden;font-family:Figtree,system-ui,sans-serif}
.sahne{position:relative;width:1080px;height:1920px;padding:120px 80px 0;display:flex;flex-direction:column;align-items:center;
  background:radial-gradient(120% 70% at 85% 0%,#F7C6DD 0,rgba(247,198,221,0) 55%),linear-gradient(170deg,#FFF6FA 0%,#F6E8F1 100%);color:#2A1424}
.sahne.koyu{background:radial-gradient(120% 70% at 85% 0%,#6D2A57 0,rgba(109,42,87,0) 55%),linear-gradient(170deg,#1C1220 0%,#0E0A10 100%);color:#FBEFF6}
h1{font-family:Bodoni,serif;font-weight:700;font-size:96px;line-height:1.02;text-align:center;letter-spacing:-.01em}
p{margin-top:28px;font-size:38px;line-height:1.3;text-align:center;opacity:.78;max-width:880px}
.telefon{margin-top:70px;width:780px;height:1500px;border-radius:84px;padding:22px;background:#111;box-shadow:0 40px 90px rgba(80,20,60,.35),0 0 0 2px rgba(255,255,255,.08) inset}
.ekran{width:100%;height:100%;border-radius:64px;overflow:hidden;background:#fff center top/cover no-repeat}
.kilit{width:100%;height:100%;border-radius:64px;overflow:hidden;padding:120px 34px 0;color:#fff;
  background:radial-gradient(90% 60% at 30% 10%,#B23A68 0,rgba(178,58,104,0) 60%),linear-gradient(180deg,#3A1838,#140B16)}
.saat{font-size:150px;font-weight:300;text-align:center;letter-spacing:-.03em}
.tarih{text-align:center;font-size:34px;opacity:.85;margin-top:-6px}
.bildirim{margin-top:70px;padding:26px 28px;border-radius:40px;background:rgba(255,255,255,.92);color:#1d1220;display:flex;flex-direction:column;gap:8px}
.b-ust{display:flex;align-items:center;gap:12px;font-size:26px}.b-ust i{margin-left:auto;font-style:normal;opacity:.6}
.b-ikon{width:40px;height:40px;border-radius:12px;background:#8A3A62;color:#fff;display:grid;place-items:center;font-weight:800}
.b-baslik{font-size:32px}.b-metin{font-size:28px;opacity:.8;line-height:1.3}
.b-resim{margin-top:10px;height:330px;border-radius:24px;background:#f3e9ef center 22%/cover no-repeat}
.widget{margin-top:36px;display:flex;gap:22px;padding:22px;border-radius:40px;background:rgba(255,255,255,.95);color:#2A1424;height:260px}
.w-resim{flex:0 0 40%;border-radius:26px;background:#f3e9ef center 22%/cover no-repeat}
.w-yazi{display:flex;flex-direction:column;justify-content:center;gap:8px}.w-yazi small{color:#C2185B;font-weight:800;font-size:22px;letter-spacing:.06em}
.w-yazi b{font-size:30px;line-height:1.2}.w-yazi span{font-size:25px;color:#7B6274;line-height:1.3}
"""


def sayfa(govde, koyu=False):
    return f"<!doctype html><html><head><meta charset='utf-8'><style>{fontlar()}{STIL}</style></head><body><div class='sahne{' koyu' if koyu else ''}'>{govde}</div></body></html>"


ONE_CIKAN = """<!doctype html><html><head><meta charset='utf-8'><style>%s
*{box-sizing:border-box;margin:0}body{width:1024px;height:500px;overflow:hidden;font-family:Figtree,sans-serif}
.k{position:relative;width:1024px;height:500px;display:flex;align-items:center;padding:0 64px;color:#fff;
  background:radial-gradient(70%% 120%% at 100%% 0%%,#E5689B 0,rgba(229,104,155,0) 60%%),linear-gradient(120deg,#2A0E2E,#8A3A62)}
.sol{flex:1;display:flex;flex-direction:column;gap:18px;z-index:1}
.logo{display:flex;align-items:center;gap:16px}.logo img{width:84px;height:84px;border-radius:22px}.logo b{font-family:Bodoni,serif;font-size:58px;font-weight:700}
h1{font-size:40px;line-height:1.12;font-weight:800;max-width:400px}
p{font-size:20px;opacity:.85;max-width:400px;line-height:1.35}
.tel{position:absolute;right:40px;top:46px;width:260px;height:560px;border-radius:40px;padding:10px;background:#111;transform:rotate(6deg);box-shadow:0 30px 60px rgba(0,0,0,.4)}
.tel div{width:100%%;height:100%%;border-radius:32px;background:#fff center top/cover no-repeat}
.tel.iki{right:290px;top:96px;transform:rotate(-5deg);width:220px;height:460px}
</style></head><body><div class='k'>
<div class='sol'><div class='logo'><img src='data:image/png;base64,%s'><b>Kombinle</b></div>
<h1>Dolabındakilerle her sabah hazır kombin</h1><p>Hava durumuna göre öneri, Kombinle AI ve renk analizi</p></div>
<div class='tel iki'><div style="background-image:url(data:image/png;base64,%s)"></div></div>
<div class='tel'><div style="background-image:url(data:image/png;base64,%s)"></div></div>
</div></body></html>"""


def main():
    CIKTI.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as pw:
        t = pw.chromium.launch()
        s = t.new_page(viewport={'width': 1080, 'height': 1920})
        for i, (dosya, baslik, alt, koyu) in enumerate(EKRANLAR, 1):
            if dosya == 'SABAH':
                ic = sabah_ekrani()
            else:
                ic = f"<div class='ekran' style=\"background-image:url(data:image/png;base64,{b64(EKRAN / dosya)})\"></div>"
            s.set_content(sayfa(f"<h1>{baslik}</h1><p>{alt}</p><div class='telefon'>{ic}</div>", koyu))
            s.wait_for_timeout(300)
            s.screenshot(path=str(CIKTI / f'tr_{i:02d}.png'))
        s = t.new_page(viewport={'width': 1024, 'height': 500})
        s.set_content(ONE_CIKAN % (fontlar(), b64(KOK / 'magaza' / 'kombinle-ikon-512.png'), b64(EKRAN / 'tm_turkuaz.png'), b64(EKRAN / 'mg04_kombin_acik.png')))
        s.wait_for_timeout(300)
        s.screenshot(path=str(CIKTI / 'one_cikan.png'))
        t.close()
    print('Hazır:', sorted(p.name for p in CIKTI.iterdir()))


if __name__ == '__main__':
    main()
