import sys, os, json, base64, random, time; sys.path.insert(0, '.')
from ortak import *
random.seed(3)
with sync_playwright() as pw:
    for koyu in (False, True):
        o = Oturum(pw, koyu=koyu, hava=met_yanit(taban=9, yagmur=True, ruzgar=10)); p = o.ac()
        ek = '_koyu' if koyu else ''
        if koyu: o.ekran('40_karsilama_koyu')
        p.click('text=Örnek dolapla dene'); p.wait_for_selector('#istek'); p.wait_for_timeout(1500)
        p.fill('#istek', 'Akşam arkadaşımın doğum günü partisi var'); p.click('#onerBtn'); p.wait_for_selector('#sonucAlani .masa'); p.wait_for_timeout(600)
        p.evaluate("document.querySelector('#sonucAlani').scrollIntoView()"); p.wait_for_timeout(300)
        o.ekran('41_sonuc' + ek)
        p.click('#sonucAlani .btn.ana'); p.wait_for_timeout(400)
        p.click('#sonucAlani .eylemler .ikon-btn[aria-label="Favorilere ekle"]'); p.wait_for_timeout(400)
        p.click('nav.alt-menu button:nth-child(3)'); p.wait_for_timeout(600); o.ekran('42_kombinlerim' + ek)
        p.click('.gecmis-oge'); p.wait_for_timeout(600); o.ekran('43_kombin_detay' + ek); p.go_back(); p.wait_for_timeout(400)
        p.click('nav.alt-menu button:nth-child(2)'); p.wait_for_timeout(600); o.ekran('44_dolap' + ek)
        p.click('header .ikon-btn[aria-label="Ayarlar"]'); p.wait_for_timeout(500); o.ekran('45_ayarlar' + ek)
        p.go_back(); p.wait_for_timeout(300)
        p.click('header .ikon-btn[aria-label="Kombinle Pro"]'); p.wait_for_timeout(500); o.ekran('46_pro' + ek)
        p.go_back(); p.wait_for_timeout(300)
        p.click('.ekle-fab'); p.wait_for_timeout(500); o.ekran('47_ekle' + ek)
        print('hatalar', [h for h in o.hatalar if 'analiz' not in h])
        o.kapat()
    # İngilizce
    o = Oturum(pw, dil='en-US', hava=met_yanit(taban=24)); p = o.ac()
    o.ekran('50_en_karsilama')
    p.click('text=Try a sample wardrobe'); p.wait_for_selector('#istek'); p.wait_for_timeout(1200)
    p.fill('#istek', 'job interview this morning, no heels'); p.click('#onerBtn'); p.wait_for_selector('#sonucAlani .masa'); p.wait_for_timeout(500)
    o.ekran('51_en_sonuc', tam=True)
    print('EN parça:', p.eval_on_selector_all('#sonucAlani .masa .parca', 'e => e.map(x => x.getAttribute("aria-label"))'))
    print('EN anladım:', p.inner_text('#sonucAlani .anladim'))
    print('hatalar', [h for h in o.hatalar if 'analiz' not in h])
    o.kapat()
    # Performans: 240 parçalık dolap
    o = Oturum(pw, hava=met_yanit(taban=15)); p = o.ac()
    p.click('text=Başla'); p.wait_for_timeout(600)
    foto = 'data:image/jpeg;base64,' + base64.b64encode(open('foto/tisort_kirmizi.jpg', 'rb').read()).decode()
    turler = ['tisort','bluz','gomlek','kazak','sweat','tunik','kumas','kot','etek','uzunetek','tayt','elbise','uzunelbise','hirka','blazer','ceket','tren','mont','kaban','spor','babet','topuklu','bot','sandalet','canta','atki']
    renkler = ['siyah','beyaz','krem','bej','lacivert','kot','bordo','pembe','yesil','gri','mavi','kirmizi','taba']
    parcalar = [{'id': 'p%07d' % i, 'tur': random.choice(turler), 'renk': random.choice(renkler), 'foto': foto, 'tarz': ''} for i in range(240)]
    yol = os.path.join(EKRAN, 'buyuk.json'); json.dump({'uygulama': 'kombinle', 'parcalar': parcalar}, open(yol, 'w'))
    t0 = time.time(); p.set_input_files('#yedekSec', yol); p.wait_for_timeout(300); p.click('.pencere .btn.ana')
    p.wait_for_function("document.querySelector('#tost').textContent.indexOf('yüklendi')>=0", timeout=120000)
    print('240 parça yükleme: %.1f sn' % (time.time() - t0), p.inner_text('#tost'))
    p.fill('#istek', 'toplantı'); t0 = time.time(); p.click('#onerBtn'); p.wait_for_selector('#sonucAlani .masa', timeout=20000)
    print('240 parçada kombin süresi: %.2f sn (260 ms bekleme dahil)' % (time.time() - t0))
    print('hatalar', [h for h in o.hatalar if 'analiz' not in h])
    o.kapat()
