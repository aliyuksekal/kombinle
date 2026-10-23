import sys, os, json, base64; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import *

APKPAY = """(sahip) => { window.__sahip = sahip || []; window.__alim = [];
 window.ApkPay = { products: ids => Promise.resolve(ids.map(id => ({ id, price: id === 'kombinle_pro' ? '₺149,99' : '₺14,99' }))),
   buy: id => { window.__alim.push(id); if (id === 'kombinle_pro') window.__sahip.push(id); return Promise.resolve(true); },
   owned: id => id === undefined ? window.__sahip : window.__sahip.indexOf(id) >= 0,
   restore: () => Promise.resolve(window.__sahip.slice()) }; }"""

def kaydet_sayfasi(p, tur=None):
    p.wait_for_selector('.sayfa.acik .buyuk-resim', timeout=15000); p.wait_for_timeout(300)
    if tur:
        p.locator('.sayfa.acik .bolum').first.locator('.cip', has_text=tur).first.click()
    if p.locator('.sayfa.acik .alt-bar .btn.ana').is_disabled():
        p.locator('.sayfa.acik .bolum').first.locator('.sarili .cip').first.click()
    p.locator('.sayfa.acik .alt-bar .btn.ana').click(); p.wait_for_timeout(700)

def kombin_iste(p, metin='günlük'):
    p.fill('#istek', metin); p.click('#onerBtn'); p.wait_for_timeout(900)

with sync_playwright() as pw:
    print('— Ücretsiz hak ve Pro')
    o = Oturum(pw, hava=met_yanit(taban=14)); p = o.ac()
    p.click('text=Başla'); p.wait_for_timeout(800)
    p.set_input_files('#dosyaSec', ['foto/tisort_kirmizi.jpg', 'foto/pantolon_lacivert.jpg', 'foto/ayakkabi_siyah.jpg', 'foto/exifli.jpg'])
    for i in range(4):
        kaydet_sayfasi(p)
    p.wait_for_timeout(500)
    J = lambda: p.evaluate("+localStorage.getItem('kb_jeton')")
    ok(J() == 15 and '15 Jeton' in p.inner_text('#jetonHap'), 'başlangıçta 15 jeton')
    p.fill('#istek', 'iş toplantısı'); p.evaluate("(()=>{const b=document.querySelector('#onerBtn'); b.click(); b.click(); b.click();})()"); p.wait_for_timeout(1200)
    ok(J() == 14, 'hızlı çoklu tıklama yalnız 1 jeton düşürdü')
    p.evaluate("localStorage.setItem('kb_jeton', '0')")
    kombin_iste(p, 'yine kahve')
    ok(p.locator('.sayfa.acik .g-magaza').count() == 1, 'jeton bitince mağaza açıldı')
    for kotu_deger in ['-5e9', '{"a":1}', 'NaN', '1e99']:
        p.evaluate("v => localStorage.setItem('kb_jeton', v)", kotu_deger)
        p.reload(); p.wait_for_timeout(900)
        import re as _re; m = _re.search(r'(\d+) Jeton', p.inner_text('#jetonHap'))
        ok(m and 0 <= int(m.group(1)) <= 1e7, 'bozuk jeton değeri sınırlandı: %s → %s' % (kotu_deger, m and m.group(1)))
    p.evaluate("localStorage.setItem('kb_jeton', '0')"); p.reload(); p.wait_for_timeout(900)
    p.click('#jetonHap'); p.wait_for_timeout(500)
    o.ekran('30_magaza')
    p.locator('.sayfa.acik .g-fiyat').first.click(); p.wait_for_timeout(400)
    ok("Play Store" in p.inner_text('#tost'), 'köprü yokken satın alma uyarısı')
    p.evaluate("localStorage.setItem('kb_jeton', '0')")
    p.go_back(); p.wait_for_timeout(400)
    p.evaluate(APKPAY, [])
    p.click('#jetonHap'); p.wait_for_timeout(600)
    ok('₺149,99' in p.inner_text('.sayfa.acik'), 'PRO fiyatı Play’den geldi')
    p.click('.sayfa.acik .g-pro-btn'); p.wait_for_timeout(700)
    ok('PRO' in p.inner_text('#jetonHap'), 'satın alma sonrası PRO rozeti')
    ok(p.evaluate('window.__alim[0]') == 'kombinle_pro', 'doğru ürün kimliği kombinle_pro')
    kombin_iste(p, 'akşam yemeği')
    ok(p.locator('#sonucAlani .g-sonuc').count() == 1 and J() == 0, 'PRO: jeton harcamadan kombin')
    p.reload(); p.evaluate(APKPAY, []); p.wait_for_timeout(1500)
    ok('PRO' not in p.inner_text('#jetonHap'), 'iade edilen PRO yeniden açılışta kapandı')
    p.reload(); p.evaluate(APKPAY, ['kombinle_pro']); p.wait_for_timeout(1500)
    ok('PRO' in p.inner_text('#jetonHap'), 'sahip olunan PRO yeniden açılışta tanındı')

    print('— Kod enjeksiyonu (XSS)')
    p.click('nav.alt-menu button:nth-child(2)'); p.wait_for_timeout(500)
    p.locator('.g-izgara .oge').first.click(); p.wait_for_timeout(500)
    zarar = '<img src=x onerror="window.__xss=1"><script>window.__xss=2</script>'
    p.fill('.sayfa.acik input.metin', zarar)
    p.locator('.sayfa.acik .alt-bar .btn.ana').click(); p.wait_for_timeout(700)
    ok(p.evaluate('window.__xss') is None, 'kıyafet adındaki kod çalışmadı')
    ok(p.evaluate("document.querySelectorAll('.izgara img[src=\"x\"]').length") == 0 and '<img' in p.inner_text('.g-izgara'), 'kod düz metin olarak gösterildi (40 karakterle sınırlı)')

    print('— Yedek ve EXIF')
    p.click('header .ikon-btn[aria-label="Ayarlar"]'); p.wait_for_timeout(400)
    with p.expect_download() as d:
        p.click('.sayfa.acik button.satir:has-text("Yedek al")')
    yol = d.value.path(); veri = json.load(open(yol))
    ok(veri['uygulama'] == 'kombinle' and len(veri['parcalar']) == 4, 'yedek dosyası 4 kıyafet içeriyor')
    exifsiz = all(b'GizliKamera' not in base64.b64decode(x['foto'].split(',')[1]) and b'Exif' not in base64.b64decode(x['foto'].split(',')[1])[:200] for x in veri['parcalar'])
    ok(exifsiz, 'kaydedilen fotoğraflarda EXIF (kamera/konum) yok')
    p.go_back(); p.wait_for_timeout(400)

    print('— Kötü niyetli yedek dosyası')
    kotu_foto = 'data:image/svg+xml;base64,' + base64.b64encode(b'<svg onload="window.__xss=3"/>').decode()
    iyi_foto = veri['parcalar'][0]['foto']
    kotu = {'uygulama': 'kombinle', 'bicim': 1, '__proto__': {'kirli': 1},
            'ayar': {'tesettur': 'evet', 'isi': 99, '__proto__': {'pro': True}},
            'parcalar': [
                {'id': '../../etc', 'tur': 'tisort', 'renk': 'kirmizi', 'foto': iyi_foto, 'ad': 'A' * 5000},
                {'id': 'abcdefgh', 'tur': '__proto__', 'renk': 'x', 'foto': iyi_foto},
                {'id': 'abcdefg2', 'tur': 'etek', 'renk': '"><script>', 'foto': kotu_foto},
                {'id': 'abcdefg3', 'tur': 'kot', 'renk': 'mavi', 'foto': 'data:image/jpeg;base64,AAAA'},
                {'id': 'abcdefg4', 'tur': 'kot', 'renk': 'mavi', 'foto': iyi_foto, 'tarz': 'gx<y>', 'giy': -50, 'son': 1e20, 'desen': 'evet'},
                None, 5, 'metin'],
            'gecmis': [{'id': 'zzzzzzzz', 'p': ['abcdefg4', '<b>'], 'o': 'yok', 'm': '<img src=x onerror=alert(1)>', 'tarih': 'dün'}, {'__proto__': 1}]}
    kotu_yol = os.path.join(EKRAN, 'kotu.json')
    open(kotu_yol, 'w').write(json.dumps(kotu).replace('"__proto__": {"kirli": 1}', '"__proto__": {"kirli": 1}'))
    p.set_input_files('#yedekSec', kotu_yol); p.wait_for_timeout(300)
    p.click('.pencere .btn.ana'); p.wait_for_timeout(2500)
    tost = p.inner_text('#tost')
    print('   ', tost)
    ok('2 kıyafet yüklendi' in tost and '6 bozuk' in tost, 'yalnız geçerli 2 kayıt alındı, 6 bozuk kayıt atlandı')
    ok(p.evaluate('window.__xss') is None, 'yedekteki kod çalışmadı')
    ok(p.evaluate('({}).kirli === undefined && ({}).pro === undefined'), 'prototip kirletme yok')
    ayar = p.evaluate("JSON.parse(localStorage.getItem('kb_ayar'))")
    ok(ayar['tesettur'] is False and ayar['isi'] == 0 and ayar.get('pro') is True, 'yedekteki geçersiz ayarlar yok sayıldı')
    p.click('nav.alt-menu button:nth-child(2)'); p.wait_for_timeout(600)
    adlar = p.eval_on_selector_all('.g-izgara .oge', 'e => e.map(x => x.getAttribute("aria-label"))')
    ok(all(len(a) <= 60 for a in adlar), 'uzun ad 40 karaktere kısaltıldı')
    p.click('nav.alt-menu button:nth-child(3)'); p.wait_for_timeout(500)
    ok(p.evaluate('window.__xss') is None, 'kombin geçmişindeki kod çalışmadı')
    o.ekran('31_kombinlerim')
    ok(not [h for h in o.hatalar if 'pageerror' in h], 'sayfa hatası yok')
    print('\n'.join(h for h in o.hatalar if 'analiz' not in h)[:1500])

    print('— Tüm verileri sil')
    p.click('header .ikon-btn[aria-label="Ayarlar"]'); p.wait_for_timeout(400)
    p.click('.sayfa.acik button.satir:has-text("Tüm verileri sil")'); p.wait_for_timeout(300)
    p.click('.pencere .btn.tehlike'); p.wait_for_timeout(400); p.click('.pencere .btn.tehlike'); p.wait_for_timeout(1200)
    ok('Dolabın henüz boş' in p.inner_text('#uygulama') or p.locator('.bos').count() > 0, 'tüm veriler silindi')
    ok(p.evaluate("localStorage.getItem('kb_jeton')") is not None, 'silme jetonları sıfırlamadı')
    o.kapat()

    print('— İnternet yok')
    o = Oturum(pw, hava='HATA'); p = o.ac()
    p.click('text=Örnek dolapla dene'); p.wait_for_timeout(2000)
    ok('alınamadı' in p.inner_text('#havaKarti'), 'hava alınamadı kartı')
    o.ekran('32_internet_yok')
    p.click('#havaKarti .cip:has-text("Serin")'); p.wait_for_timeout(300)
    p.click('#havaKarti .cip:has-text("Yağmurlu")'); p.wait_for_timeout(300)
    kombin_iste(p, 'iş yemeği')
    ok(p.locator('#sonucAlani .g-sonuc').count() == 1, 'elle seçilen havayla kombin önerildi')
    p.click('#sonucAlani summary'); p.wait_for_timeout(200); ok('Seçtiğin havaya' in p.inner_text('#sonucAlani'), 'neden: elle seçilen hava')
    o.kapat()

    print('— Konum izni yok')
    o = Oturum(pw, konum=False); p = o.ac()
    p.click('text=Başla'); p.wait_for_timeout(16000)
    ok('konum' in p.inner_text('#havaKarti').lower(), 'konum izni yokken açıklama kartı')
    p.click('#havaKarti button:has-text("Şehir seç")'); p.wait_for_timeout(400)
    p.fill('.sayfa.acik input.metin', 'izm'); p.wait_for_timeout(200)
    p.click('.sayfa.acik .sehir:has-text("İzmir")'); p.wait_for_timeout(1200)
    ok('İzmir' in p.inner_text('#havaKarti'), 'İzmir seçildi, hava geldi')
    ok(any('lat=38.42' in u for u in o.istekler), 'MET isteği İzmir koordinatıyla')
    ok(all(u.startswith('https://api.met.no/') for u in o.dis_istek), 'dışarıya yalnız MET Norway isteği gitti: %s' % set(u.split('?')[0] for u in o.dis_istek))
    o.kapat()
ozet()
