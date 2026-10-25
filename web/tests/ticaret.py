import sys, os, json; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import *
# Sosyal paket + gönderiyi öne çıkar, Keşfet'te AdMob yuvası, "Reklam ver" başvurusu ve @admin onayı
KOK = os.path.dirname(os.path.abspath(__file__))
F = lambda ad: os.path.join(KOK, 'foto', ad)
exec(open(os.path.join(KOK, 'reklam.py')).read().split('with sync_playwright()')[0])  # SAHTE ve JPG
SAHTE = SAHTE.replace("aciklama: 'Kombin ' + i,", "aciklama: 'Kombin ' + i, benim: i === 2, oneCikan: i === 0 ? 1 : 0, oneCikanBitis: i === 0 ? Date.now() + 5 * 3600000 : 0, gorunurluk: 'herkes',").replace("zaman: Date.now() - i * 60000, benim: false,", "zaman: Date.now() - i * 60000,")
SAHTE = SAHTE.replace("if (yol === '/v1/reklamlar')", """if (yol === '/v1/onecikar') return yanit(req, {ok: true, durum: 200, veri: {ok: true, bitis: Date.now() + 86400000}});
    if (yol === '/v1/rtarife') return yanit(req, {ok: true, durum: 200, veri: {ok: true, paketler: [{id: 'g10000', gosterim: 10000, gun: 60, ilk: 0, liste: 1980, fiyat: 990}, {id: 'g30000', gosterim: 30000, gun: 60, ilk: 0, liste: 4980, fiyat: 2490}, {id: 'g100000', gosterim: 100000, gun: 60, ilk: 0, liste: 13980, fiyat: 6990}, {id: 'ilk1', gosterim: 0, gun: 1, ilk: 1, liste: 3980, fiyat: 1990}], indirim: 50, havale: true}});
    if (yol === '/v1/rtalep') { window.__talep = g; return yanit(req, {ok: true, durum: 200, veri: {ok: true, id: 't'.repeat(20), kod: 'KMB-ABC234', fiyat: 1500, gun: 7}}); }
    if (yol === '/v1/rtalepler') return yanit(req, {ok: true, durum: 200, veri: {ok: true, havale: true, liste: [{id: 't'.repeat(20), kod: 'KMB-ABC234', marka: 'Lale Butik', baslik: 'Yeni sezon', metin: '%20', gun: 7, fiyat: 1500, durum: window.__talepDurum || 'bekliyor', zaman: Date.now(), not: '',
      odeme: window.__talepDurum === 'onaylandi' ? {iban: 'TR33 0006 1005 1978 6457 8413 26', alici: 'Ali Yüksekal'} : undefined}]}});
    if (yol === '/v1/rtyonetim') return yanit(req, {ok: true, durum: 200, veri: {ok: true, havale: true, liste: [{id: 't'.repeat(20), kod: 'KMB-ABC234', marka: 'Lale Butik', baslik: 'Yeni sezon', metin: '%20', gun: 7, fiyat: 1500, durum: window.__talepDurum || 'bekliyor', zaman: Date.now(), firma: 'Lale Ltd.', yetkili: 'Ayşe', eposta: 'ayse@lale.com', telefon: '05321112233', link: 'https://lale.com'}]}});
    if (yol === '/v1/rtkarar') { window.__karar = (window.__karar || []).concat([g]); window.__talepDurum = g.karar === 'onayla' ? 'onaylandi' : g.karar === 'odendi' ? 'yayinda' : 'reddedildi'; return yanit(req, {ok: true, durum: 200, veri: {ok: true}}); }
    if (yol === '/v1/reklamlar')""")
SAHTE = SAHTE.replace("odemeAl: (req) => yanit(req, {ok: false}),", "odemeAl: (req, id) => { if (/^onecikar_/.test(id)) window.__oc = (window.__oc || 0) + +id.split('_')[1]; else window.__sahip.push(id); yanit(req, {ok: true, owned: window.__sahip}); }, oneCikarTeslim: () => { const n = window.__oc || 0; window.__oc = 0; return n; },").replace("odemeSahip: () => '[]',", "odemeSahip: () => JSON.stringify(window.__sahip),")
SAHTE = SAHTE.replace("window.KombinleNative = {", """window.__sahip = []; window.__admob = [];
window.KombinleNative = {
  admobVar: () => true, admobYer: j => window.__admob.push(JSON.parse(j)), admobGizlilikGerekli: () => true, admobGizlilik: () => { window.__admobGiz = 1; },""", 1)
SAHTE = "(() => { let x = 7; Math.random = () => { x = (x * 1103515245 + 12345) % 2147483648; return (x % 1000) / 1000 * 0.8 + 0.5; }; })();\n" + SAHTE   # tekrarlanabilir dizilim: yuvalar AdMob'a düşer
ADMIN = SAHTE.replace("kod: '0123456789ab'}", "kod: '0123456789ab', kadi: 'admin', yonetici: true}", 1)

with sync_playwright() as pw:
    o = Oturum(pw, hava=met_yanit(taban=14)); o.ctx.add_init_script(SAHTE)
    o.ctx.route('https://kombinle-api.ornek.workers.dev/**', lambda r: r.fulfill(status=200, body=JPG, headers={'Content-Type': 'image/jpeg'}))
    p = o.ac()
    p.click('text=Örnek dolapla dene'); p.wait_for_timeout(1000)
    p.click('nav.alt-menu button[data-sekme="kesfet"]'); p.wait_for_timeout(1800)
    print('— Öne çıkan gönderi')
    ilk = p.locator('#toplulukAlani .g-akis').first
    ok('Öne çıkan' in ilk.inner_text() and 'one-cikan' in (ilk.get_attribute('class') or ''), 'öne çıkan gönderi etiketli ve vurgulu')
    print("— Keşfet'te AdMob")
    yuva = p.locator('.admob-kart')
    ok(yuva.count() >= 1, 'akışta AdMob yuvası var: %d' % yuva.count())
    h0 = p.evaluate("document.querySelector('.admob-yer').getBoundingClientRect().height")
    h1 = p.evaluate("document.querySelector('.g-akis-resim').getBoundingClientRect().height")
    w0 = p.evaluate("document.querySelector('.admob-yer').getBoundingClientRect().width")
    w1 = p.evaluate("document.querySelector('.g-akis-resim').getBoundingClientRect().width")
    ok(abs(h0 - h1) < 1 and abs(w0 - w1) < 1, 'AdMob yuvası gönderi görseliyle aynı boyutta (%dx%d)' % (w0, h0))
    yuva.first.scroll_into_view_if_needed(); p.wait_for_timeout(700)
    son = p.evaluate('window.__admob[window.__admob.length - 1]')
    ok(not son['gizli'] and len(son['liste']) >= 1 and son['liste'][0]['w'] == round(w0) and son['ust'] > 0 and son['alt'] > 0, 'yuvanın yeri telefona bildirildi: ' + json.dumps(son)[:120])
    sy = p.evaluate('window.scrollY'); y0 = son['liste'][0]['y']
    ok(abs(y0 - (p.evaluate("document.querySelector('.admob-yer').getBoundingClientRect().top") + sy)) < 2, 'yer belge koordinatında (kaydırmadan bağımsız)')
    o.ekran('t1_admob_yuva')
    p.locator('#toplulukAlani .g-akis:not(.g-reklam) .g-akis-menu').nth(2).click(); p.wait_for_timeout(700)
    ok(p.evaluate('window.__admob[window.__admob.length - 1]')['gizli'], 'sayfa açılınca reklam gizlendi')
    p.keyboard.press('Escape'); p.go_back() if p.locator('.sayfa.acik').count() else None; p.wait_for_timeout(700)
    aid = p.locator('.admob-yer').first.get_attribute('data-admob')
    p.evaluate("id => window.dispatchEvent(new CustomEvent('kbadmob', {detail: {id: id, durum: 'hata', h: 0}}))", aid); p.wait_for_timeout(400)
    ok(p.locator('.admob-yer[data-admob="%s"]' % aid).count() == 0, 'yüklenemeyen AdMob yuvası kendi tanıtımımıza döndü')

    print('— Gönderiyi öne çıkar (öne çıkarma paketleri)')
    benim = p.locator('#toplulukAlani .g-akis:not(.g-reklam):has-text("Kombin 2")').first
    benim.locator('.g-akis-menu').click(); p.wait_for_timeout(500)
    ok('Gönderiyi öne çıkar' in p.locator('.sayfa.acik').last.inner_text(), 'kendi gönderimin menüsünde "öne çıkar"')
    p.locator('.sayfa.acik button.satir:has-text("Gönderiyi öne çıkar")').click(); p.wait_for_timeout(700)
    sp = p.locator('.sayfa.acik').last
    ok('Gönderini öne çıkar' in sp.inner_text() and sp.locator('.g-paket').count() == 3 and 'kalmadı' in sp.inner_text(), 'hakkı olmayana öne çıkarma paketleri (1/5/15)')
    o.ekran('t2_one_cikar_paket')
    sp.locator('.g-paket').nth(1).locator('.g-fiyat').click(); p.wait_for_timeout(1500)
    ok(p.evaluate("+localStorage.getItem('kb_onecikarHak')") == 5, '5 öne çıkarma hakkı teslim alındı')
    ok(p.locator('.pencere.acik').count() == 1 and 'Kalan hakkın: 5' in p.inner_text('.pencere.acik'), 'satın alınca öne çıkarma onayı soruldu (kalan hak yazıyor)')
    p.locator('.pencere.acik button:has-text("Öne çıkar")').click(); p.wait_for_timeout(700)
    ok(any(a['yol'] == '/v1/onecikar' and a['g']['id'] == 'c' * 20 for a in p.evaluate('window.__api')), 'öne çıkarma isteği gitti')
    ok(p.evaluate("+localStorage.getItem('kb_onecikarHak')") == 4, '1 hak düştü')

    print('— Reklam ver')
    p.click('nav.alt-menu button[data-sekme="ayarlar"]'); p.wait_for_timeout(500)
    p.evaluate("document.querySelector('.ayar-kart[data-kart=pro]').open = true; document.querySelector('.ayar-kart[data-kart=veri]').open = true"); p.wait_for_timeout(200)
    ok(p.locator('.ayar-sekme button.satir:has-text("Reklam gizlilik seçenekleri")').count() == 1, 'ayarlarda reklam gizlilik seçenekleri (AB izni gerekince)')
    p.click('.ayar-sekme button.satir:has-text("Reklam ver")'); p.wait_for_timeout(900)
    rv = p.locator('.sayfa.acik').last
    ok(rv.locator('.rv-paket').count() == 4 and '30.000 gösterim' in rv.inner_text() and '2.490 ₺' in rv.inner_text() and '%50' in rv.inner_text() and 'ilk sırada' in rv.inner_text(), 'gösterim paketleri, indirim ve "ilk sırada"')
    o.ekran('t3_reklam_ver', tam=True)
    rv.locator('.alt-bar .btn.ana').click(); p.wait_for_timeout(300)
    ok('fotoğraf' in p.inner_text('#tost').lower() or 'görsel' in p.inner_text('#tost').lower(), 'görsel zorunlu: ' + p.inner_text('#tost'))
    with p.expect_file_chooser() as fc:
        rv.locator('.rk-resim-sec').click()
    fc.value.set_files(F('elbise_yesil.jpg')); p.wait_for_timeout(900)
    rv.locator('input[aria-label="Marka adı"]').fill('Lale Butik') if rv.locator('input[aria-label="Marka adı"]').count() else rv.locator('.hesap-alan input').nth(0).fill('Lale Butik')
    rv.locator('.alt-bar .btn.ana').click(); p.wait_for_timeout(300)
    ok(rv.locator('input.hatali').count() == 1, 'eksik alan işaretlendi')
    rv.locator('input[aria-label="Firma / işletme adı"]').fill('Lale Ltd.')
    rv.locator('input[aria-label="Telefon"]').fill('0532 111 22 33')
    rv.locator('.rv-paket').nth(0).click()
    rv.locator('.alt-bar .btn.ana').click(); p.wait_for_timeout(1200)
    tl = p.evaluate('window.__talep')
    ok(tl and tl['paket'] == 'g10000' and tl['firma'] == 'Lale Ltd.' and tl['eposta'] == 'elif@ornek.com' and tl['yetkili'] == 'Elif' and len(tl['resim']) > 1000, 'başvuru gitti (e-posta ve ad hesaptan)')
    ok('KMB-ABC234' in p.locator('.sayfa.acik').last.inner_text() and 'İnceleniyor' in p.locator('.sayfa.acik').last.inner_text(), 'başvurularım: kod ve durum')
    p.evaluate("window.__talepDurum = 'onaylandi'")
    p.locator('.sayfa.acik').last.locator('.bas .ikon-btn').first.click(); p.wait_for_timeout(500)
    p.click('.ayar-sekme button.satir:has-text("Reklam ver")'); p.wait_for_timeout(700)
    p.locator('.sayfa.acik').last.locator('button.rv-basvurular').click(); p.wait_for_timeout(900)
    kt = p.locator('.sayfa.acik').last.inner_text()
    ok('TR33 0006' in kt and 'Ali Yüksekal' in kt and 'KMB-ABC234' in kt and 'havale' in kt.lower(), 'onaylanınca IBAN, alıcı ve açıklama kodu gösterildi')
    o.ekran('t4_odeme_bilgisi', tam=True)
    o.kapat()

    print('— @admin: başvuru onayı')
    o = Oturum(pw, hava=met_yanit(taban=14)); o.ctx.add_init_script(ADMIN)
    o.ctx.route('https://kombinle-api.ornek.workers.dev/**', lambda r: r.fulfill(status=200, body=JPG, headers={'Content-Type': 'image/jpeg'}))
    p = o.ac()
    p.click('text=Örnek dolapla dene'); p.wait_for_timeout(1000)
    p.evaluate("""() => { const h = JSON.parse(localStorage.getItem('kb_hesap')); h.kadi = 'admin'; h.yonetici = true; localStorage.setItem('kb_hesap', JSON.stringify(h)); }""")
    p.click('nav.alt-menu button[data-sekme="ayarlar"]'); p.wait_for_timeout(500)
    p.evaluate("document.querySelectorAll('.ayar-kart').forEach(d => d.open = true)"); p.wait_for_timeout(200)
    yp = p.locator('.ayar-sekme button.satir:has-text("Yönetici")')
    if yp.count(): yp.first.click()
    else: p.locator('button:has-text("Yönetici paneli")').first.click()
    p.wait_for_timeout(600)
    p.locator('.sayfa.acik button.satir:has-text("Reklam başvurularını incele")').click(); p.wait_for_timeout(900)
    ys = p.locator('.sayfa.acik').last
    ok('05321112233' in ys.inner_text() and 'Lale Ltd.' in ys.inner_text(), '@admin iletişim bilgilerini görüyor')
    ys.locator('input[type=number]').fill('1200')
    ys.locator('button:has-text("Onayla")').click(); p.wait_for_timeout(700)
    ok(p.evaluate('window.__karar')[0] == {'id': 't' * 20, 'karar': 'onayla', 'fiyat': 1200, 'not': ''}, 'fiyatla onaylandı')
    ys = p.locator('.sayfa.acik').last
    ys.locator('button:has-text("Ödeme geldi")').click(); p.wait_for_timeout(400)
    p.locator('.pencere.acik button:has-text("Ödeme geldi")').click(); p.wait_for_timeout(700)
    ok(p.evaluate('window.__karar')[-1]['karar'] == 'odendi' and 'Yayında' in p.locator('.sayfa.acik').last.inner_text(), 'ödendi: reklam yayında')
    print([h for h in o.hatalar if 'analiz' not in h])
    o.kapat()
ozet()
