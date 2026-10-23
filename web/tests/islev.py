import sys, os, json; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import *

def kombin(p, metin, ortam=None):
    p.fill('#istek', metin)
    if ortam:
        p.click('.g-ortam button:has-text("%s"), .g-diger button:has-text("%s")' % (ortam, ortam))
    p.click('#onerBtn'); p.wait_for_selector('#sonucAlani .g-sonuc', timeout=8000); p.wait_for_timeout(300)
    return okuSonuc(p)

def okuSonuc(p):
    parca = p.eval_on_selector_all('#sonucAlani .g-parcalar .g-parca', 'e => e.map(x => x.getAttribute("aria-label"))')
    neden = p.text_content('#sonucAlani .nedenler')
    return parca, neden

def hepsi(p):
    """3 alternatifi de topla"""
    sonuclar = []
    n = p.eval_on_selector_all('#sonucAlani .g-eylem .g-btn-ikon', 'e => e.length')
    for i in range(3):
        sonuclar.append(okuSonuc(p))
        b = p.locator('#sonucAlani .g-eylem .g-btn-ikon[aria-label="Başka öner"]')
        if b.count() == 0: break
        b.click(); p.wait_for_timeout(250)
    return sonuclar

def iceren(liste, *kelimeler):
    return [x for x in liste if any(k.lower() in x.lower() for k in kelimeler)]

with sync_playwright() as pw:
    print('— Senaryo: serin, toplantı (örnek dolap)')
    o = Oturum(pw, hava=met_yanit(taban=11)); p = o.ac()
    p.click('text=Örnek dolapla dene'); p.wait_for_selector('#istek', timeout=8000); p.wait_for_timeout(800)
    ok('Konum' not in p.inner_text('#havaKarti') and '°' in p.inner_text('#havaKarti'), 'hava kartı yüklendi')
    parca, neden = kombin(p, 'Öğleden sonra toplantım var')
    print('   ', parca)
    tum = sum([x[0] for x in hepsi(p)], [])
    ok(not iceren(tum, 'Spor ayakkabı', 'Sweatshirt', 'Eşofman', 'Tişört'), 'toplantıda spor parça yok')
    ok(bool(iceren(parca, 'Kumaş pantolon', 'Gömlek', 'Bluz', 'Blazer', 'Uzun etek')), 'toplantıda şık parça var')
    ok(bool(iceren(parca, 'Trençkot', 'Mont', 'Kaban', 'Yağmurluk', 'Blazer', 'Hırka')), 'serin havada dış katman var')
    ok('İş için' in neden, 'neden: ortam açıklaması')
    ok('15 Jeton' in p.inner_text('#jetonHap'), 'örnek dolap jeton düşürmedi')
    o.ekran('20_toplanti', tam=True)

    print('— Senaryo: hayvan barınağı')
    parca, neden = kombin(p, 'Bugün hayvan barınağına gideceğim')
    tum = sum([x[0] for x in hepsi(p)], [])
    print('   ', parca)
    print('    tüm:', tum)
    ok(not iceren(tum, 'Topuklu', 'Babet', 'Blazer', 'Etek', 'Elbise'), 'barınakta topuklu/babet/blazer/etek/elbise yok')
    ok(bool(iceren(parca, 'Spor ayakkabı', 'Bot')), 'barınakta kapalı rahat ayakkabı')
    ok(not iceren(parca, 'Beyaz', 'Krem'), 'barınakta açık renk yok (ilk öneri)')
    ok('Kirlenebileceğin' in neden, 'neden: barınak açıklaması')

    print('— Senaryo: istemediğim parça ve renk isteği')
    parca, _ = kombin(p, 'etek giymek istemiyorum, siyah olsun')
    tum = sum([x[0] for x in hepsi(p)], [])
    ok(not iceren(tum, 'etek', 'Etek'), 'etek istemiyorum → hiç etek yok')
    ok(bool(iceren(parca, 'Siyah')), 'siyah isteği karşılandı')
    an = p.inner_text('#sonucAlani .anladim')
    ok('Etek' in an and 'Siyah' in an, 'anladıklarım etiketleri gösteriliyor')
    o.kapat()

    print('— Senaryo: sıcak (30°)')
    o = Oturum(pw, hava=met_yanit(taban=30)); p = o.ac()
    p.click('text=Örnek dolapla dene'); p.wait_for_selector('#istek', timeout=8000); p.wait_for_timeout(800)
    tum = []
    kombin(p, 'arkadaşlarla kahve')
    tum = sum([x[0] for x in hepsi(p)], [])
    print('   ', tum[:6])
    ok(not iceren(tum, 'Mont', 'Kaban', 'Kazak', 'Bot', 'Trençkot'), 'sıcakta mont/kaban/kazak/bot yok')

    print('— Senaryo: yağmurlu 12°')
    o.kapat()
    o = Oturum(pw, hava=met_yanit(taban=12, yagmur=True)); p = o.ac()
    p.click('text=Örnek dolapla dene'); p.wait_for_selector('#istek', timeout=8000); p.wait_for_timeout(800)
    ok('yağ' in p.inner_text('#havaKarti').lower(), 'hava kartında yağmur etiketi')
    parca, neden = kombin(p, 'alışverişe çıkacağım')
    print('   ', parca)
    ok(bool(iceren(parca, 'Yağmurluk', 'Mont', 'Trençkot')), 'yağmurda suya dayanıklı dış giyim')
    ok(not iceren(parca, 'Topuklu', 'Sandalet', 'Terlik'), 'yağmurda açık/topuklu ayakkabı yok')
    ok('Şemsiyeni' in neden, 'şemsiye hatırlatması')
    o.ekran('21_yagmur', tam=True)

    print('— Senaryo: kapalı giyim modu')
    p.click('header .ikon-btn[aria-label="Ayarlar"]'); p.wait_for_timeout(400)
    p.click('.sayfa.acik button.satir:has-text("Kapalı giyim")'); p.wait_for_timeout(200)
    o.ekran('22_ayarlar')
    p.keyboard.press('Escape'); p.go_back(); p.wait_for_timeout(500)
    ok(p.locator('.sayfa.acik').count() == 0, 'geri tuşu sayfayı kapattı')
    parca, neden = kombin(p, 'okula gideceğim')
    tum = sum([x[0] for x in hepsi(p)], [])
    print('   ', parca)
    ok(bool(iceren(parca, 'Eşarp')), 'kapalı giyimde eşarp eklendi')
    ok(not iceren(tum, 'Şort', 'Askılı') and not [x for x in tum if x.endswith(' etek') and 'Uzun' not in x and 'uzun' not in x], 'kapalı giyimde şort/askılı/kısa etek yok')
    print('\n'.join(h for h in o.hatalar if 'analiz' not in h)[:2000])
    ok(not [h for h in o.hatalar if 'pageerror' in h or 'Content Security' in h], 'sayfa hatası / CSP ihlali yok')
    o.kapat()
ozet()
