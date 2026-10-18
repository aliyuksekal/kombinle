import sys, os, json; sys.path.insert(0, '.')
from ortak import *
SAHTE = """window.__cagri = [];
const yanit = (req, d) => setTimeout(() => window.dispatchEvent(new CustomEvent('kbyerel', {detail: Object.assign({req}, d)})), 50);
window.__sahip = [];
window.KombinleNative = {
  konum: req => yanit(req, {ok: true, lat: 40.9903, lon: 29.0291, ad: 'Kadıköy, İstanbul'}), konumAyarlari: () => {},
  surum: () => '1.0.7', cubuk: k => window.__cagri.push('cubuk:' + k),
  dinle: (req, dil) => { window.__cagri.push('dinle:' + dil); yanit(req, {ok: true, metin: 'akşam düğüne gideceğim'}); },
  etiketle: (req, b64) => { window.__cagri.push('etiketle:' + b64.length); yanit(req, {ok: true, etiketler: [{t: 'Jeans', c: 0.91}, {t: 'Pattern', c: 0.3}]}); },
  dosyaKaydet: (req, ad, tur, b64) => { window.__cagri.push('kaydet:' + ad); yanit(req, {ok: true, yazildi: true}); },
  odemeSorgula: (req, ids) => yanit(req, {ok: true, products: [{id: 'kombinle_pro', price: '₺149,99'}]}),
  odemeAl: (req, id) => { window.__sahip.push(id); yanit(req, {ok: true, owned: window.__sahip}); },
  odemeSahip: () => JSON.stringify(window.__sahip),
  odemeGeriYukle: req => yanit(req, {ok: true, owned: window.__sahip})
};"""
with sync_playwright() as pw:
    o = Oturum(pw); o.ctx.add_init_script(SAHTE); p = o.ac()
    p.click('text=Başla'); p.wait_for_timeout(600)
    p.wait_for_timeout(800); ok('Kadıköy, İstanbul' in p.inner_text('#havaKarti'), 'telefon konumu: ilçe adıyla gösterildi')
    ok(any('lat=40.99&lon=29.03' in u for u in o.istekler), 'hava isteği 2 haneye yuvarlanmış konumla')
    ok('cubuk:false' in p.evaluate('window.__cagri'), 'tema sistem çubuklarına iletildi')
    p.set_input_files('#dosyaSec', ['foto/etek_bordo.jpg']); p.wait_for_selector('.sayfa.acik .buyuk-resim', timeout=15000); p.wait_for_timeout(300)
    tah = p.inner_text('.sayfa.acik .tahmin')
    ok('Yapay zekâya göre: Kot pantolon' in tah, 'ML Kit etiketi tanımayı yönlendirdi: ' + tah[:50])
    p.locator('.sayfa.acik .alt-bar .btn.ana').click(); p.wait_for_timeout(600)
    p.click('#mikBtn'); p.wait_for_timeout(400)
    ok(p.input_value('#istek') == 'akşam düğüne gideceğim' and 'dinle:tr-TR' in p.evaluate('window.__cagri'), 'mikrofon: telefonun ses tanıması metni yazdı')
    p.click('header .ikon-btn[aria-label="Kombinle Pro"]'); p.wait_for_timeout(500)
    ok('₺149,99' in p.inner_text('.sayfa.acik'), 'Pro fiyatı köprüden')
    p.click('.sayfa.acik .btn.altin'); p.wait_for_timeout(600)
    ok(p.locator('header .pro-rozet').count() == 1, 'köprü üzerinden Pro satın alındı')
    p.click('header .ikon-btn[aria-label="Ayarlar"]'); p.wait_for_timeout(400)
    ok('1.0.7' in p.inner_text('.sayfa.acik'), 'sürüm telefondan')
    p.click('.sayfa.acik button.satir:has-text("Yedek al")'); p.wait_for_timeout(1500)
    ok(any(c.startswith('kaydet:kombinle-yedek') for c in p.evaluate('window.__cagri')), 'yedek telefonun dosya kaydetme ekranına gitti')
    print([h for h in o.hatalar if 'analiz' not in h])
    o.kapat()
ozet()
