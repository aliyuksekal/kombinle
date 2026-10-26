import sys, os, json; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import *
# Büyüme özellikleri: hızlı doldurma, sipariş ekran görüntüsü, WhatsApp anket bağlantısı, davet,
# sabah bildirimi + widget hazırlığı, bildirimden açılış, kullanım ölçümü ve yönetici istatistikleri
KOK = os.path.dirname(os.path.abspath(__file__))
F = lambda ad: os.path.join(KOK, 'foto', ad)
src = open(os.path.join(KOK, 'ozellikler.py'), encoding='utf-8').read()
SAHTE = src[src.index('SAHTE = r"""') + 12: src.index('};"""') + 2]
SAHTE = SAHTE.replace("    if (yol === '/v1/anketler') return tamam({devam: false, liste: window.__anket});", """    if (yol === '/v1/anketler') return tamam({devam: false, liste: window.__anket});
    if (yol === '/v1/siparis') return tamam({alisveris: true, urunler: [{ad: 'Siyah midi etek', kategori: 'alt', kutu: [80, 40, 470, 480]}, {ad: 'Krem kazak', kategori: 'ust', kutu: [80, 520, 470, 960]}]});
    if (yol === '/v1/merhaba') { window.__merhaba.push(g); return tamam({}); }
    if (yol === '/v1/olcum') return tamam({toplam: 1240, haftaOrtalama: 310, d1: {grup: 200, donen: 76, oran: 38}, d7: {grup: 150, donen: 21, oran: 14}, d30: {grup: 0, donen: 0, oran: null},
      gunler: Array.from({length: 30}, (_, i) => ({gun: '2026-10-' + String(i + 1).padStart(2, '0'), aktif: 200 + i * 5, yeni: 20 + i})), olaylar: [{ad: 'kombin', n: 900}, {ad: 'parca_ekle', n: 400}]});""")
SAHTE = SAHTE.replace("window.KombinleNative = {", """window.__merhaba = []; window.__sabah = []; window.__paylas = []; window.__widget = 0;
window.KombinleNative = {
  sabahAyarla: j => window.__sabah.push(JSON.parse(j)), widgetEklenebilir: () => true, widgetVar: () => window.__widget > 0, widgetEkle: () => { window.__widget++; },
  metinPaylas: (m, h) => window.__paylas.push([m, h]), acilacak: () => window.__acilacak || '', bildirimIzni: () => {},""", 1)
exec(src[src.index('def ekle('):src.index('def kapat(')])

with sync_playwright() as pw:
    o = Oturum(pw, hava=met_yanit(taban=15)); o.ctx.add_init_script(SAHTE); p = o.ac()
    p.click('text=Başla'); p.wait_for_timeout(800)
    print('— 2 dakikada dolabını doldur')
    p.click('nav.alt-menu button[data-sekme="dolap"]'); p.wait_for_timeout(500)
    ok(p.locator('.hd-kart').count() == 1 and '0 / 15' in p.inner_text('.hd-kart') and p.locator('.hd-adim').count() == 3, 'boş dolapta hızlı doldurma kartı (ayna, sipariş, galeri)')
    o.ekran('b1_hizli_doldur')
    print('— sipariş ekran görüntüsü')
    p.evaluate("""() => { window.__tani.push({kategori: 'alt', tur: 'etek', renk: 'siyah'}, {kategori: 'ust', tur: 'kazak', renk: 'krem'}); }""")
    with p.expect_file_chooser() as fc:
        p.locator('.hd-adim', has_text='Sipariş ekran görüntüsü').click()
    fc.value.set_files(F('kazak_krem.jpg'))
    p.wait_for_selector('.sayfa.acik .ps-izgara', timeout=15000); p.wait_for_timeout(500)
    sy = p.locator('.sayfa.acik').last
    ok('ekran görüntüsünde bu ürünleri buldum' in sy.inner_text().lower() and 'Siyah midi etek' in sy.inner_text() and 'Krem kazak' in sy.inner_text(), 'ürünler bulundu, seçim ekranı açıldı')
    ok(not sy.locator('button:has-text("Fotoğrafın tamamı")').is_visible(), '"fotoğrafın tamamı" ekran görüntüsünde gizli')
    o.ekran('b2_siparis_secim')
    sy.locator('.ps-izgara button').nth(0).click(); sy.locator('.ps-izgara button').nth(1).click(); p.wait_for_timeout(200)
    sy.locator('.alt-bar .btn.ana, button.btn.ana').last.click()
    for i in range(2):
        p.wait_for_selector('.sayfa.acik .buyuk-resim', timeout=20000); p.wait_for_timeout(500)
        p.locator('.sayfa.acik .alt-bar .btn.ana').click(); p.wait_for_timeout(900)
    ok((p.evaluate("JSON.parse(localStorage.getItem('kb_olaylar') || '{}').siparis") or 0) + sum(x['olaylar'].get('siparis', 0) for x in p.evaluate('window.__merhaba')) == 1, 'sipariş olayı sayıldı')
    ekle(p, 'ayakkabi_siyah.jpg', {'kategori': 'ayk', 'tur': 'babet', 'renk': 'siyah'})
    ekle(p, 'pantolon_lacivert.jpg', {'kategori': 'alt', 'tur': 'kumas', 'renk': 'lacivert'})
    ok((p.evaluate("JSON.parse(localStorage.getItem('kb_olaylar') || '{}').parca_ekle") or 0) + sum(x['olaylar'].get('parca_ekle', 0) for x in p.evaluate('window.__merhaba')) >= 4, 'eklenen kıyafetler sayıldı')
    ok('4 / 15' in p.inner_text('.hd-kart'), 'ilerleme çubuğu güncellendi')

    print('— sabah bildirimi ve widget')
    p.evaluate("window.__sabah = []")
    p.click('nav.alt-menu button[data-sekme="ayarlar"]'); p.wait_for_timeout(500)
    p.evaluate("document.querySelectorAll('.ayar-kart').forEach(d => d.open = true)"); p.wait_for_timeout(200)
    ok(p.locator('.ayar-sekme', has_text='Sabah kombin bildirimi').count() == 1 and p.locator('.ayar-sekme select[aria-label="Bildirim saati"]').count() == 1, 'ayarlarda sabah bildirimi ve saati')
    p.locator('.ayar-sekme select[aria-label="Bildirim saati"]').select_option('08:00'); p.wait_for_timeout(2500)
    s = p.evaluate('window.__sabah[window.__sabah.length - 1]')
    ok(s and s['saat'] == '08:00' and s['acik'] and s['lat'] and len(s.get('resim', '')) > 1000 and 'Günaydın' in s['baslik'] and s['metin'].startswith('Önerin:'), 'sabah önerisi hazırlandı (kolaj, hava, parçalar): ' + (s or {}).get('baslik', '') + ' | ' + (s or {}).get('metin', ''))
    ok(s['havaSablon'] == 'Günaydın ☀️ Bugün {min}–{max}°' and s['gunEtiket'] in ('Bugün', 'Yarın'), 'telefonun yedek hava metni seçili dilde')
    p.locator('.ayar-sekme button.satir:has-text("Ana ekrana widget ekle")').click(); p.wait_for_timeout(300)
    ok(p.evaluate('window.__widget') == 1, 'widget ekleme istendi')
    print('— davet')
    p.locator('.ayar-sekme button.satir:has-text("Arkadaşını davet et")').click(); p.wait_for_timeout(300)
    pv = p.evaluate('window.__paylas[window.__paylas.length - 1]')
    ok(pv[1] == 'whatsapp' and 'play.google.com/store/apps/details?id=com.benim.kombinle' in pv[0], "davet WhatsApp'a Play bağlantısıyla gitti")

    print('— bildirime dokununca')
    sk = p.evaluate("JSON.parse(localStorage.getItem('kb_sabahKombin'))")
    p.evaluate("""() => { const s = JSON.parse(localStorage.getItem('kb_sabahKombin')); s.tarih = new Date().toISOString().slice(0, 10); localStorage.setItem('kb_sabahKombin', JSON.stringify(s)); }""")
    p.evaluate("window.dispatchEvent(new CustomEvent('kbac', {detail: {ne: 'sabah'}}))"); p.wait_for_timeout(1200)
    ok(p.locator('.sayfa.acik').count() == 1 and 'kombini' in p.locator('.sayfa.acik .baslik').last.inner_text(), 'hazırlanan kombin açıldı: ' + p.locator('.sayfa.acik .baslik').last.inner_text())
    o.ekran('b3_sabah_kombin')
    p.go_back(); p.wait_for_timeout(500)

    print('— WhatsApp anket bağlantısı')
    p.evaluate("""() => { window.__anket = [{id: 'q'.repeat(20), takma: 'Elif', kadi: 'elif', av: 0, soru: 'Cumartesi hangisi?', a: 2, b: 1, zaman: Date.now() - 60000, benim: true, gizli: 0, gorunurluk: 'herkes', yazar: '0123456789ab', secim: ''}]; }""")
    p.click('nav.alt-menu button[data-sekme="kesfet"]'); p.wait_for_timeout(600)
    p.click('.g-haplar button:has-text("A mı B mi?")'); p.wait_for_timeout(900)
    p.locator('#toplulukAlani .ak-wp').first.click(); p.wait_for_timeout(300)
    pv = p.evaluate('window.__paylas[window.__paylas.length - 1]')
    ok(pv[1] == 'whatsapp' and '/a/' + 'q' * 20 in pv[0] and 'Cumartesi hangisi?' in pv[0], 'anket bağlantısı WhatsApp\'a gitti: ' + pv[0][:80])
    o.ekran('b4_anket_wp')
    p.click('.g-haplar button:has-text("Akış"), .g-haplar button:has-text("Yeni")') if p.locator('.g-haplar button:has-text("Akış")').count() else None

    print('— kullanım ölçümü')
    p.evaluate("document.dispatchEvent(new Event('visibilitychange'))")
    p.evaluate("Object.defineProperty(document, 'hidden', {value: true, configurable: true}); document.dispatchEvent(new Event('visibilitychange'))"); p.wait_for_timeout(1200)
    m = p.evaluate('window.__merhaba')
    ok(len(m) >= 1 and sum(x['olaylar'].get('parca_ekle', 0) for x in m) >= 4 and sum(x['olaylar'].get('anket_paylas', 0) for x in m) == 1, 'kullanım sayıları gönderildi: ' + json.dumps(m[-1]['olaylar'])[:120])
    ok(p.evaluate("Object.keys(JSON.parse(localStorage.getItem('kb_olaylar') || '{}')).length") == 0, 'gönderilen sayaçlar sıfırlandı')
    print([h for h in o.hatalar if 'analiz' not in h])
    o.kapat()

    print('— @admin: kullanım istatistikleri')
    o = Oturum(pw, hava=met_yanit(taban=15)); o.ctx.add_init_script(SAHTE.replace("kod: '0123456789ab', kadi: 'elif'}));", "kod: '0123456789ab', kadi: 'admin', yonetici: true}));", 1)); p = o.ac()
    p.click('text=Başla'); p.wait_for_timeout(1500)
    p.evaluate("""() => { const h = JSON.parse(localStorage.getItem('kb_hesap')); h.kadi = 'admin'; h.yonetici = true; localStorage.setItem('kb_hesap', JSON.stringify(h)); }""")
    p.click('nav.alt-menu button[data-sekme="ayarlar"]'); p.wait_for_timeout(500)
    p.evaluate("document.querySelectorAll('.ayar-kart').forEach(d => d.open = true)"); p.wait_for_timeout(200)
    yp = p.locator('.ayar-sekme button.satir:has-text("Yönetici")')
    yp.first.click() if yp.count() else p.locator('button:has-text("Yönetici paneli")').first.click()
    p.wait_for_timeout(600)
    p.locator('.sayfa.acik button.satir:has-text("Kullanım istatistikleri")').click(); p.wait_for_timeout(900)
    t_ = p.locator('.sayfa.acik').last.inner_text()
    ok('1.240' in t_ and '%38' in t_ and '%14' in t_ and 'Kombin önerisi' in t_ and p.locator('.ol-sutun').count() == 30, 'istatistik sayfası: toplam, geri dönüş, 30 gün, olaylar')
    o.ekran('b5_olcum', tam=True)
    o.kapat()
ozet()
