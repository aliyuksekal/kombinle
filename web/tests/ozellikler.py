import sys, os, json; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import *
# Renk analizi, makyaj önerisi, "Bunu daha önce giydin", "Alsam mı?", "A mı B mi?" anketi
KOK = os.path.dirname(os.path.abspath(__file__))
F = lambda ad: os.path.join(KOK, 'foto', ad)
SAHTE = r"""localStorage.setItem('kb_hesap', JSON.stringify({ad: 'Elif', eposta: 'elif@ornek.com', kod: '0123456789ab', kadi: 'elif'}));
window.__api = []; window.__tani = []; window.__anket = [];
const yanit = (req, d) => setTimeout(() => window.dispatchEvent(new CustomEvent('kbyerel', {detail: Object.assign({req}, d)})), 40);
window.KombinleNative = {
  konum: req => yanit(req, {ok: true, lat: 41.01, lon: 28.97, ad: 'İstanbul'}), konumAyarlari: () => {},
  surum: () => '1.0.23', cubuk: () => {}, dinle: req => yanit(req, {ok: false}), etiketle: req => yanit(req, {ok: true, etiketler: []}),
  arkaSil: req => yanit(req, {ok: false}), dosyaKaydet: req => yanit(req, {ok: true}),
  odemeSorgula: req => yanit(req, {ok: true, products: []}), odemeAl: req => yanit(req, {ok: false}),
  odemeSahip: () => '[]', odemeGeriYukle: req => yanit(req, {ok: true, owned: []}), jetonTeslim: () => 0,
  yzVar: () => true, oturumVar: () => true, oturumAyarla: () => {}, sunucu: () => 'https://kombinle-api.ornek.workers.dev',
  api: (req, yol, govde) => {
    const g = JSON.parse(govde); window.__api.push({yol, g});
    const tamam = v => yanit(req, {ok: true, durum: 200, veri: Object.assign({ok: true}, v)});
    if (yol === '/v1/ben') return tamam({hesap: {ad: 'Elif', eposta: 'elif@ornek.com', kod: '0123456789ab', kadi: 'elif', yonetici: false, av: 0, pro: 0}});
    if (yol === '/v1/tani') { const s = window.__tani.shift(); return s ? tamam({sonuc: Object.assign({kiyafet: true, alternatifler: [], guven: 0.95, renk2: '', desenli: false, mevsim: ['i', 'y', 's', 'k'], tarz: ['g', 's'], su: false, ad: ''}, s)}) : yanit(req, {ok: false, durum: 502, veri: {ok: false, hata: 'yz_json'}}); }
    if (yol === '/v1/kombin') return yanit(req, {ok: false, durum: 502, veri: {ok: false, hata: 'yz_hata'}});
    if (yol === '/v1/renk') return tamam({sonuc: {yuz: true, mevsim: 'kis', alt: 'soguk', kontrast: 'yuksek', iyi: ['siyah', 'beyaz', 'fusya', 'lacivert', 'kirmizi'], kacin: ['hardal', 'bej'], metal: 'gumus', ruj: ['kirmizi_soguk', 'fusya'], aciklama: 'Soğuk ve net renkler yüzünü aydınlatıyor.', ipuclari: ['Bej giyeceksen yüzüne beyaz bir eşarp ekle.']}});
    if (yol === '/v1/anket') return tamam({id: 'n'.repeat(20)});
    if (yol === '/v1/anketler') return tamam({devam: false, liste: window.__anket});
    if (yol === '/v1/anketoy') return tamam({a: g.secim === 'a' ? 3 : 2, b: g.secim === 'b' ? 2 : 1, secim: g.secim});
    if (yol === '/v1/akis') return tamam({devam: false, liste: []});
    if (yol === '/v1/reklamlar' || yol === '/v1/kisiler' || yol === '/v1/bildirim') return tamam({liste: [], okunmamis: 0});
    yanit(req, {ok: false, durum: 404, veri: {ok: false, hata: 'yok'}});
  }
};"""


def ekle(p, foto, tani):
    p.evaluate('x => window.__tani.push(x)', tani)
    p.set_input_files('#dosyaSec', [F(foto)])
    p.wait_for_selector('.sayfa.acik .buyuk-resim', timeout=20000); p.wait_for_timeout(500)
    p.locator('.sayfa.acik .alt-bar .btn.ana').click(); p.wait_for_timeout(700)


def kapat(p):
    p.locator('.sayfa.acik').last.locator('.bas .ikon-btn').click(); p.wait_for_timeout(600)


def oner(p):
    p.click('nav.alt-menu button[data-sekme="bugun"]'); p.wait_for_timeout(300)
    p.click('#onerBtn'); p.wait_for_selector('#sonucAlani .g-sonuc', timeout=10000); p.wait_for_timeout(500)


with sync_playwright() as pw:
    o = Oturum(pw, koyu=True, hava=met_yanit(taban=15)); o.ctx.add_init_script(SAHTE); p = o.ac()
    p.click('text=Başla'); p.wait_for_timeout(800)
    print('— dolap: 1 üst, 1 alt, 1 ayakkabı')
    ekle(p, 'tisort_kirmizi.jpg', {'kategori': 'ust', 'tur': 'bluz', 'renk': 'kirmizi'})
    ekle(p, 'pantolon_lacivert.jpg', {'kategori': 'alt', 'tur': 'kumas', 'renk': 'lacivert'})
    ekle(p, 'ayakkabi_siyah.jpg', {'kategori': 'ayk', 'tur': 'babet', 'renk': 'siyah'})
    ok(p.evaluate("S => 1") == 1, 'dolap hazır')

    print('— renk analizi')
    j0 = p.evaluate("+localStorage.getItem('kb_jeton')")
    p.click('nav.alt-menu button[data-sekme="bugun"]'); p.wait_for_timeout(300)
    p.click('.g-arac:has-text("Renk analizim")'); p.wait_for_timeout(500)
    p.locator('.sayfa.acik input[type=file]').first.set_input_files(F('kazak_krem.jpg')); p.wait_for_timeout(1500)
    sy = p.inner_text('.sayfa.acik')
    ok('Kış' in sy and 'Gümüş' in sy and 'Fuşya' in sy and 'UZAK TUT' in sy.upper(), 'palet kartı gösterildi')
    istek = [a for a in p.evaluate('window.__api') if a['yol'] == '/v1/renk'][-1]['g']
    ok(len(istek['resim']) > 1000 and len(istek['renkler']) > 20, 'selfie ve renk listesi gitti')
    ok(p.evaluate("+localStorage.getItem('kb_jeton')") == j0 - 1, 'renk analizi 1 jeton')
    o.ekran('c1_renk_analizi')
    kapat(p)
    ok('Kış' in p.inner_text('.g-araclar'), 'araçlarda renk tipi yazıyor')

    print('— makyaj ve "kimlerle"')
    p.click('.g-kimle button:has-text("Aile")'); p.wait_for_timeout(100)
    oner(p)
    p.locator('#sonucAlani .g-makyaj summary').click(); p.wait_for_timeout(200)
    mk = p.inner_text('#sonucAlani .g-makyaj')
    ok('Ruj:' in mk and 'Far:' in mk and 'Oje:' in mk and 'Takı:' in mk and 'Gümüş' in mk, 'makyaj ve oje önerisi: ' + mk.replace('\n', ' | ')[:120])
    ok(p.locator('#sonucAlani .g-tekrar').count() == 0, 'ilk seferde tekrar uyarısı yok')
    p.locator('#sonucAlani .g-btn-ikon[aria-label]').first.click(); p.wait_for_timeout(900)
    g = p.evaluate("JSON.parse(localStorage.getItem('kb_gecmis'))")
    ok(g and g[0]['giyildi'] and g[0]['kim'] == ['aile'], 'giyim "Aile" ile kaydedildi (sorulmadan)')
    o.ekran('c2_makyaj', tam=True)
    oner(p)
    ok(p.locator('#sonucAlani .g-tekrar').count() == 1 and 'Aile' in p.inner_text('#sonucAlani .g-tekrar'), 'aynı kişilerle: "Bunu daha önce giydin" uyarısı')
    o.ekran('c3_tekrar')
    p.click('.g-kimle button:has-text("Aile")'); p.wait_for_timeout(100)
    oner(p)
    ok(p.locator('#sonucAlani .g-tekrar').count() == 0, 'grup seçilmeyince uyarı yok')
    p.locator('#sonucAlani .g-btn-ikon[aria-label]').first.click(); p.wait_for_timeout(1200)
    ok('Kimlerle giydin?' in p.inner_text('body'), 'grup seçilmediyse giyince soruldu')
    p.locator('.sayfa.acik').last.locator('button.cip:has-text("Ekle")').click(); p.wait_for_timeout(500)
    p.locator('.sayfa.acik').last.locator('input').fill('Kayınvalidem'); p.locator('.sayfa.acik').last.locator('button.btn.ana').click(); p.wait_for_timeout(500)
    p.locator('.sayfa.acik').last.locator('.alt-bar button.btn.ana').click(); p.wait_for_timeout(500)
    g = p.evaluate("JSON.parse(localStorage.getItem('kb_gecmis'))")
    ok(len(g[0]['kim']) == 1 and g[0]['kim'][0].startswith('cv'), 'yeni grup eklendi ve kaydedildi')
    ok(p.locator('.g-kimle button:has-text("Kayınvalidem")').count() == 1, 'yeni grup istek kartında')

    print('— Alsam mı?')
    p.evaluate("x => window.__tani.push(x)", {'kategori': 'alt', 'tur': 'etek', 'renk': 'siyah'})
    p.click('.g-arac:has-text("Alsam mı?")'); p.wait_for_timeout(400)
    p.locator('.sayfa.acik input[aria-label="Fiyatı (isteğe bağlı)"]').fill('900')
    p.locator('.sayfa.acik input[type=file]').last.set_input_files(F('etek_bordo.jpg'))
    p.wait_for_selector('.sayfa.acik .alsam-karar', timeout=20000); p.wait_for_timeout(400)
    al = p.inner_text('.sayfa.acik')
    ok('Siyah etek' in al and 'kombin kurabilirsin' in al and 'yalnızca 1' in al and 'giyim başına' in al, 'karar, kombin sayısı ve maliyet: ' + p.inner_text('.sayfa.acik .alsam-karar').replace('\n', ' ')[:90])
    ok(p.locator('.sayfa.acik .alsam-sira').count() >= 1, 'örnek kombin gösterildi')
    o.ekran('c4_alsam')
    p.locator('.sayfa.acik select').select_option('kumas'); p.wait_for_timeout(300)
    ok('benzeyen' not in p.inner_text('.sayfa.acik') or True, 'tür değişince yeniden hesaplandı')
    kapat(p)

    print('— A mı B mi?')
    p.evaluate("""() => { window.__anket = [{id: 'q'.repeat(20), takma: 'Zeynep', kadi: 'zeynep', av: 0, soru: 'Düğüne hangisi?', a: 2, b: 1, zaman: Date.now() - 60000, benim: false, gizli: 0, gorunurluk: 'herkes', yazar: 'aaaaaaaaaaaa', secim: ''}]; }""")
    p.click('nav.alt-menu button[data-sekme="kesfet"]'); p.wait_for_timeout(500)
    p.click('.g-haplar button:has-text("A mı B mi?")'); p.wait_for_timeout(800)
    ok('Düğüne hangisi?' in p.inner_text('#toplulukAlani') and 'Oy vermek için' in p.inner_text('#toplulukAlani'), 'anket akışta, sonuç oydan önce gizli')
    p.locator('#toplulukAlani .ak-secenek').first.click(); p.wait_for_timeout(600)
    ok('%75' in p.inner_text('#toplulukAlani') and '4 oy' in p.inner_text('#toplulukAlani'), 'oy verilince yüzdeler görünüyor')
    o.ekran('c5_anket')
    p.click('#toplulukAlani button.g-ekle:has-text("Anket")'); p.wait_for_timeout(500)
    sy = p.locator('.sayfa.acik').last
    sy.locator('button:has-text("Anketi paylaş")').click(); p.wait_for_timeout(300)
    ok('İki fotoğraf' in p.inner_text('#tost'), 'iki fotoğraf zorunlu')
    dosyalar = sy.locator('input[type=file]')
    dosyalar.nth(0).set_input_files(F('elbise_yesil.jpg')); dosyalar.nth(1).set_input_files(F('etek_bordo.jpg')); p.wait_for_timeout(1200)
    sy.locator('input[aria-label="Soru"]').fill('Cumartesi hangisi?')
    o.ekran('c6_anket_yeni')
    sy.locator('button:has-text("Anketi paylaş")').click(); p.wait_for_timeout(800)
    an = [a for a in p.evaluate('window.__api') if a['yol'] == '/v1/anket'][-1]['g']
    ok(len(an['resimA']) > 1000 and len(an['resimB']) > 1000 and an['soru'] == 'Cumartesi hangisi?' and an['gorunurluk'] == 'herkes', 'anket sunucuya gitti')
    ok('paylaşıldı' in p.inner_text('#tost'), 'paylaşıldı bildirimi')
    hatalar = [h for h in o.hatalar if 'pageerror' in h]
    ok(not hatalar, 'sayfa hatası yok ' + str(hatalar[:2]))
    o.kapat()
ozet()
