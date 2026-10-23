import sys, os, json; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import *
# Sahte telefon köprüsü + sahte Kombinle sunucusu
SAHTE = r"""window.__api = []; window.__mod = {};
const yanit = (req, d) => setTimeout(() => window.dispatchEvent(new CustomEvent('kbyerel', {detail: Object.assign({req}, d)})), 60);
const AKIS = [
  {id: 'a'.repeat(20), takma: 'Zeynep', aciklama: 'Pazar kahvaltısı', etiketler: ['kahve'], begeni: 4, begenmeme: 1, zaman: Date.now() - 3600000, benim: false, gizli: 0, yazar: '0123456789ab', oy: 0},
  {id: 'b'.repeat(20), takma: '<img src=x onerror=window.__xss=1>', aciklama: '<script>window.__xss=2</script>', etiketler: ['<b>x</b>'], begeni: 0, begenmeme: 0, zaman: Date.now() - 60000, benim: true, gizli: 0, yazar: 'aaaaaaaaaaaa', oy: 0},
  {id: 'kotu', takma: 'x', begeni: 0, begenmeme: 0, zaman: 1, yazar: 'zz'}
];
window.KombinleNative = {
  konum: req => yanit(req, {ok: true, lat: 41.01, lon: 28.97, ad: 'İstanbul'}), konumAyarlari: () => {},
  surum: () => '1.0.8', cubuk: () => {}, dinle: (req) => yanit(req, {ok: false}),
  etiketle: (req) => yanit(req, {ok: true, etiketler: []}),
  arkaSil: (req) => yanit(req, {ok: false}), dosyaKaydet: (req) => yanit(req, {ok: true}),
  odemeSorgula: (req) => yanit(req, {ok: true, products: []}), odemeAl: (req) => yanit(req, {ok: false}),
  odemeSahip: () => '[]', odemeGeriYukle: req => yanit(req, {ok: true, owned: []}), jetonTeslim: () => 0,
  yzVar: () => true, sunucu: () => 'https://kombinle-api.ornek.workers.dev',
  api: (req, yol, govde) => {
    const g = JSON.parse(govde); window.__api.push({yol, g});
    if (window.__mod.hata) return yanit(req, {ok: false, durum: 429, veri: {ok: false, hata: 'kota'}});
    if (yol === '/v1/tani') return yanit(req, {ok: true, durum: 200, veri: {ok: true, sonuc: {kiyafet: true, tur: 'tren', alternatifler: ['kaban', 'yok_tur'], guven: 0.92, renk: 'bej', renk2: 'zzz', desenli: false, mevsim: ['i', 's', 'x'], tarz: ['g', 's'], su: true, ad: 'Bej trençkot <b>', kumas: 'Gabardin'}}});
    if (yol === '/v1/kombin') {
      const ids = g.parcalar.map(p => p.i);
      const ust = g.parcalar.find(p => p.k === 'ust'), alt = g.parcalar.find(p => p.k === 'alt'), ayk = g.parcalar.find(p => p.k === 'ayk');
      return yanit(req, {ok: true, durum: 200, veri: {ok: true, sonuc: {kombinler: [
        {parcalar: [ust.i, alt.i, ayk ? ayk.i : ids[0], 'uydurma-id'], baslik: 'Toplantıya güvenle', ipucu: 'İnce bir kemer bel hattını vurgular.', nedenler: ['Öğleden sonra 14°C', 'Lacivert ve beyaz uyumu'], uyum: 94},
        {parcalar: ['olmayan1', 'olmayan2'], baslik: 'Geçersiz', ipucu: '', nedenler: [], uyum: 80}
      ], havaNotu: 'Akşam 18:00 sonrası yağmur bekleniyor, şemsiyeni al.'}}});
    }
    if (yol === '/v1/analiz') return yanit(req, {ok: true, durum: 200, veri: {ok: true, sonuc: {ozet: 'Dolabın günlük kullanıma çok uygun.', puan: 72, tarzProfili: 'Rahat şık', eksikler: [{tur: 'kaban', neden: 'Kış için'}], azGiyilen: [], havaHazirlik: 'Yağmurluk iyi olur.', ipuclari: ['Renk ekle']}}});
    if (yol === '/v1/akis') return yanit(req, {ok: true, durum: 200, veri: {ok: true, devam: false, liste: AKIS}});
    if (yol === '/v1/oy') return yanit(req, {ok: true, durum: 200, veri: {ok: true, begeni: g.oy === 1 ? 5 : 4, begenmeme: 1, oy: g.oy}});
    if (yol === '/v1/sikayet') return yanit(req, {ok: true, durum: 200, veri: {ok: true}});
    if (yol === '/v1/paylas') {
      if (window.__mod.red) return yanit(req, {ok: false, durum: 200, veri: {ok: false, hata: 'denetim', neden: 'ciplaklik'}});
      return yanit(req, {ok: true, durum: 200, veri: {ok: true, id: 'c'.repeat(20)}});
    }
    yanit(req, {ok: false, durum: 404, veri: {ok: false, hata: 'yok'}});
  }
};"""

def kaydet(p):
    p.wait_for_selector('.sayfa.acik .buyuk-resim', timeout=15000); p.wait_for_timeout(300)
    p.locator('.sayfa.acik .alt-bar .btn.ana').click(); p.wait_for_timeout(700)

with sync_playwright() as pw:
    o = Oturum(pw, hava=met_yanit(taban=13)); o.ctx.add_init_script(SAHTE); p = o.ac()
    p.click('text=Başla'); p.wait_for_timeout(1200)

    print('— Kombinle AI ile tanıma')
    p.set_input_files('#dosyaSec', ['foto/tisort_kirmizi.jpg'])
    p.wait_for_selector('.sayfa.acik .buyuk-resim', timeout=15000); p.wait_for_timeout(300)
    tani = [a for a in p.evaluate('window.__api') if a['yol'] == '/v1/tani']
    ok(len(tani) == 1 and len(tani[0]['g']['resim']) > 1000 and any(x[0] == 'tren' for x in tani[0]['g']['turler']), 'fotoğraf ve tür listesi sunucuya gitti')
    ok('Kombinle AI tanıdı: Trençkot' in p.inner_text('.sayfa.acik .tahmin'), 'AI tanıma mesajı: ' + p.inner_text('.sayfa.acik .tahmin')[:60])
    ad = p.input_value('.sayfa.acik input.metin')
    ok(ad.startswith('Bej trençkot'), 'AI ad önerisi alana geldi: ' + ad)
    o.ekran('80_yz_tani')
    p.locator('.sayfa.acik .alt-bar .btn.ana').click(); p.wait_for_timeout(700)
    for f in ['tisort_kirmizi.jpg', 'pantolon_lacivert.jpg', 'ayakkabi_siyah.jpg']:
        pass
    # tür seçimini garanti etmek için yerel tanımaya bırakılan parçalar
    p.evaluate("window.__api = []")
    p.set_input_files('#dosyaSec', ['foto/pantolon_lacivert.jpg', 'foto/ayakkabi_siyah.jpg', 'foto/tisort_kirmizi.jpg'])
    # sahte sunucu hep trençkot dediği için türleri elle düzelt
    for tur in ['Kumaş pantolon', 'Topuklu', 'Tişört']:
        p.wait_for_selector('.sayfa.acik .buyuk-resim', timeout=15000); p.wait_for_timeout(300)
        grup = {'Kumaş pantolon': 'Alt', 'Topuklu': 'Ayakkabı', 'Tişört': 'Üst'}[tur]
        p.locator('.sayfa.acik .bolum').first.locator('.cipler .cip', has_text=grup).first.click(); p.wait_for_timeout(150)
        p.locator('.sayfa.acik .bolum').first.locator('.sarili .cip', has_text=tur).first.click(); p.wait_for_timeout(150)
        p.locator('.sayfa.acik .alt-bar .btn.ana').click(); p.wait_for_timeout(700)

    print('— Akıllı kombin')
    p.fill('#istek', 'öğleden sonra toplantım var'); p.click('#onerBtn')
    p.wait_for_selector('#sonucAlani .g-sonuc', timeout=10000); p.wait_for_timeout(300)
    k = [a for a in p.evaluate('window.__api') if a['yol'] == '/v1/kombin']
    ok(len(k) == 1 and k[0]['g']['hava']['saatlik'] and k[0]['g']['plan'] == 'öğleden sonra toplantım var', 'plan ve saatlik hava sunucuya gitti')
    ok(all('foto' not in json.dumps(x) for x in k[0]['g']['parcalar']), 'kombin isteğinde fotoğraf yok')
    txt = p.inner_text('#sonucAlani')
    ok('Toplantıya güvenle' in txt and 'AI Önerisi' in txt and '%94' in txt, 'AI başlığı, rozeti, uyum puanı')
    ok('yağmur bekleniyor' in txt, 'hava notu gösterildi')
    ok('İnce bir kemer' in txt, 'AI stilist ipucu')
    ok(p.locator('#sonucAlani .g-eylem .g-btn-ikon[aria-label="Başka öner"]').count() == 0, 'geçersiz kimlikli AI kombini atıldı')
    ok(p.evaluate("+localStorage.getItem('kb_jeton')") == 14, 'AI kombini 1 jeton')
    o.ekran('81_yz_kombin', tam=True)

    print('— AI hata verince cihaz içi stilist')
    p.evaluate("window.__mod.hata = true")
    p.fill('#istek', 'arkadaşlarla kahve'); p.click('#onerBtn'); p.wait_for_timeout(1500)
    ok(p.locator('#sonucAlani .g-sonuc').count() == 1 and 'AI Önerisi' not in p.inner_text('#sonucAlani'), 'yerel öneri geldi')
    ok('sınırına' in p.inner_text('#tost'), 'kota mesajı')
    p.evaluate("window.__mod.hata = false")

    print('— AI stil analizi')
    p.click('.g-analiz-kart'); p.wait_for_timeout(400)
    p.click('.sayfa.acik .g-olustur'); p.wait_for_timeout(1200)
    t2 = p.inner_text('.sayfa.acik')
    ok('72' in t2 and 'Kaban' in t2 and 'Yağmurluk iyi olur' in t2, 'analiz sonucu gösterildi')
    o.ekran('82_yz_analiz')
    p.go_back(); p.wait_for_timeout(400)

    print('— Topluluk')
    p.click('nav.alt-menu button:nth-child(3)'); p.wait_for_timeout(1200)
    ok(p.locator('.g-akis').count() == 2, 'geçersiz paylaşım elendi, 2 kart')
    ok(p.evaluate('window.__xss') is None and '<img' in p.inner_text('#toplulukAlani'), 'paylaşımdaki kod düz metin')
    src = p.get_attribute('.g-akis img.g-akis-resim', 'src') if p.locator('.g-akis img.g-akis-resim').count() else ''
    ok(src == 'https://kombinle-api.ornek.workers.dev/v1/resim/' + 'a' * 20 or p.locator('.g-akis-resim.bos').count() >= 1, 'görsel sunucu adresinden')
    o.ekran('83_topluluk')
    p.locator('.g-akis').first.locator('.g-oy').first.click(); p.wait_for_timeout(500)
    ok(p.locator('.g-akis').first.locator('.g-oy[aria-pressed="true"]').count() == 1 and '5' in p.locator('.g-akis').first.locator('.g-oy').first.inner_text(), 'beğeni sayıldı')
    p.locator('.g-akis').nth(1).locator('.g-oy').first.click(); p.wait_for_timeout(300)
    ok('Kendi paylaşımına' in p.inner_text('#tost'), 'kendi paylaşımına oy yok')
    p.locator('.g-akis').first.locator('.g-akis-menu').click(); p.wait_for_timeout(400)
    p.click('.sayfa.acik button.satir:has-text("Şikâyet et")'); p.wait_for_timeout(500)
    p.click('.sayfa.acik button.satir:has-text("Uygunsuz")'); p.wait_for_timeout(600)
    ok(p.locator('.g-akis').count() == 1 and 'şikâyetin alındı' in p.inner_text('#tost'), 'şikâyet edilen paylaşım gizlendi')

    print('— Paylaşım')
    p.click('nav.alt-menu button:nth-child(1)'); p.wait_for_timeout(500)
    p.fill('#istek', 'toplantı'); p.click('#onerBtn'); p.wait_for_selector('#sonucAlani .g-sonuc'); p.wait_for_timeout(400)
    p.click('#sonucAlani .g-btn-ikon[aria-label="Paylaş"]'); p.wait_for_timeout(1500)
    ok(p.locator('.sayfa.acik .g-paylas-onizleme img').count() == 1, 'kolaj önizlemesi')
    o.ekran('84_paylas')
    p.click('.sayfa.acik .alt-bar .btn.ana'); p.wait_for_timeout(300)
    ok('Takma ad' in p.inner_text('#tost'), 'takma ad zorunlu')
    p.fill('.sayfa.acik input.metin', 'Elif')
    p.fill('.sayfa.acik textarea', 'beni ara 0532 123 45 67')
    p.click('.sayfa.acik #kuralOnay')
    p.click('.sayfa.acik .alt-bar .btn.ana'); p.wait_for_timeout(300)
    ok('telefon' in p.inner_text('#tost'), 'telefon numarası engellendi')
    p.fill('.sayfa.acik textarea', 'Toplantı günü')
    p.evaluate("window.__mod.red = true")
    p.click('.sayfa.acik .alt-bar .btn.ana'); p.wait_for_timeout(800)
    ok('çıplaklık' in p.inner_text('#tost'), 'denetim reddi açıklandı')
    p.evaluate("window.__mod.red = false")
    p.click('.sayfa.acik .alt-bar .btn.ana'); p.wait_for_timeout(800)
    pay = [a for a in p.evaluate('window.__api') if a['yol'] == '/v1/paylas'][-1]['g']
    ok(len(pay['resim']) * 0.75 <= 440 * 1024 and pay['takma'] == 'Elif', 'paylaşım boyut sınırında')
    ok('toplulukta' in p.inner_text('#tost'), 'paylaşıldı')

    print('— Arayüzde Google/Gemini adı yok')
    p.click('header .ikon-btn[aria-label="Ayarlar"]'); p.wait_for_timeout(400)
    p.click('.sayfa.acik button.satir:has-text("Gizlilik")'); p.wait_for_timeout(400)
    tum = p.evaluate("document.body.innerText")
    ok('Google' not in tum and 'Gemini' not in tum, 'gizlilik ve ayarlar sayfasında marka adı yok')
    o.ekran('85_gizlilik')
    html = open(os.path.join(os.path.dirname(__file__), '..', 'dist', 'kombinle.html'), encoding='utf-8').read()
    ok('Gemini' not in html and 'gemini' not in html, 'uygulama paketinde "Gemini" geçmiyor')
    ok(not [h for h in o.hatalar if 'pageerror' in h], 'sayfa hatası yok: ' + str([h for h in o.hatalar if 'pageerror' in h][:2]))
    o.kapat()
ozet()
