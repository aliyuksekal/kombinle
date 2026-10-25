import sys, os, json, base64; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import *
# Telefonun yerel (CameraX) kamerası: her kamera girişi köprüden açılır, sonuçlar doğru yere gider
KOK = os.path.dirname(os.path.abspath(__file__))
F = lambda ad: os.path.join(KOK, 'foto', ad)
B64 = {ad: base64.b64encode(open(F(ad), 'rb').read()).decode() for ad in ['tisort_kirmizi.jpg', 'etek_bordo.jpg', 'kazak_krem.jpg']}
src = open(os.path.join(KOK, 'ozellikler.py'), encoding='utf-8').read()
SAHTE = src[src.index('SAHTE = r"""') + 12: src.index('};"""') + 2]
SAHTE = SAHTE.replace('window.KombinleNative = {', '''window.__kam = []; window.__kamYanit = []; window.__temiz = 0; window.__dosya = %s;
window.KombinleNative = {
  kameraAc: (req, s) => { window.__kam.push(JSON.parse(s)); const y = window.__kamYanit.shift() || {ok: false, iptal: true}; yanit(req, y); },
  kameraDosya: yol => window.__dosya[yol.split('/').pop()] || '',
  kameraTemizle: () => { window.__temiz++; },''' % json.dumps({'kare_1_0.jpg': B64['tisort_kirmizi.jpg'], 'kare_2_1.jpg': B64['etek_bordo.jpg'], 'kare_3_0.jpg': B64['kazak_krem.jpg']}))

with sync_playwright() as pw:
    o = Oturum(pw); o.ctx.add_init_script(SAHTE); p = o.ac()
    p.click('text=Başla'); p.wait_for_timeout(800)
    print('— gardırop: art arda iki fotoğraf')
    p.evaluate("""() => { window.__tani.push({kategori: 'ust', tur: 'bluz', renk: 'kirmizi'}, {kategori: 'alt', tur: 'etek', renk: 'bordo'});
      window.__kamYanit.push({ok: true, dosyalar: ['/data/cache/kamera/kare_1_0.jpg', '/data/cache/kamera/kare_2_1.jpg']}); }""")
    p.click('#uygulama .btn.ana:has-text("Kıyafet ekle")'); p.wait_for_timeout(500)
    p.click('.sayfa.acik button.satir:has-text("Fotoğraf çek")'); p.wait_for_timeout(600)
    ok(p.locator('.kam').count() == 0, 'web kamerası açılmadı, telefonun kamerası kullanıldı')
    s = p.evaluate('window.__kam[0]')
    ok(s['modlar'] == ['kiyafet', 'boydan'] and not s['tek'], 'Kıyafet/Boydan modları, art arda çekim')
    e = s['etiket']
    ok(e['bitti'] == 'Bitti ({n})' and e['mod_boydan'] == 'Boydan' and 'yasla' in e['ipucu_boydan'] and e['kapatSor'].startswith('Çektiğin {n}'), 'kamera metinleri seçili dilde gitti')
    p.wait_for_selector('.sayfa.acik .buyuk-resim', timeout=15000); p.wait_for_timeout(400)
    ok(p.evaluate('window.__temiz') == 1, 'fotoğraflar alındıktan sonra kamera klasörü temizlendi')
    p.locator('.sayfa.acik .alt-bar .btn.ana').click(); p.wait_for_timeout(900)
    p.wait_for_selector('.sayfa.acik .buyuk-resim', timeout=15000); p.wait_for_timeout(400)
    ok(p.locator('.sayfa.acik .buyuk-resim').count() == 1, 'ikinci fotoğraf sırayla düzenlemeye geldi')
    p.locator('.sayfa.acik .alt-bar .btn.ana').click(); p.wait_for_timeout(900)
    ok(p.locator('.sayfa.acik .buyuk-resim').count() == 0, 'iki parça da eklendi, sıra bitti')

    print('— Alsam mı: tek kare, ürün modu; vazgeçince sayfa olduğu gibi kalır')
    p.click('nav.alt-menu button[data-sekme="bugun"]'); p.wait_for_timeout(300)
    p.click('.g-arac:has-text("Alsam mı?")'); p.wait_for_timeout(400)
    p.locator('.sayfa.acik button:has-text("Fotoğrafını çek")').click(); p.wait_for_timeout(500)
    s = p.evaluate('window.__kam[1]')
    ok(s['tek'] and s['mod'] == 'urun' and s['modlar'] == ['urun'], 'Alsam mı: tek çekim, ürün modu')
    ok(p.locator('.sayfa.acik button:has-text("Fotoğrafını çek")').count() == 1, 'vazgeçildi: sayfa yerinde')
    p.evaluate("""() => { window.__tani.push({kategori: 'alt', tur: 'etek', renk: 'bordo'}); window.__kamYanit.push({ok: true, dosyalar: ['/data/cache/kamera/kare_2_1.jpg']}); }""")
    p.locator('.sayfa.acik button:has-text("Fotoğrafını çek")').click()
    p.wait_for_selector('.sayfa.acik .alsam-karar', timeout=20000)
    ok(p.locator('.sayfa.acik .alsam-karar').count() == 1, 'çekilen fotoğraf Alsam mı sonucuna gitti')
    p.locator('.sayfa.acik').last.locator('.bas .ikon-btn').first.click(); p.wait_for_timeout(600)

    print('— renk analizi: ön kamera (selfie)')
    p.evaluate("""() => window.__kamYanit.push({ok: true, dosyalar: ['/data/cache/kamera/kare_3_0.jpg']})""")
    p.click('.g-arac:has-text("Renk analizim")'); p.wait_for_timeout(500)
    p.locator('.sayfa.acik button:has-text("Selfie çek")').click(); p.wait_for_timeout(2000)
    s = p.evaluate('window.__kam[3]')
    ok(s['mod'] == 'selfie' and 'pencere' in s['etiket']['ipucu_selfie'], 'renk analizi selfie modunda açıldı')
    ok(any(a['yol'] == '/v1/renk' for a in p.evaluate('window.__api')), 'selfie renk analizine gitti')

    print('— izin verilmezse')
    p.evaluate("""() => window.__kamYanit.push({ok: false, hata: 'izin'})""")
    p.locator('.sayfa.acik button:has-text("Yeniden analiz")').click(); p.wait_for_timeout(500)
    ok('Kameraya erişilemedi' in p.inner_text('body'), 'izin uyarısı gösterildi')
    print([h for h in o.hatalar if 'analiz' not in h])
    o.kapat()
ozet()
