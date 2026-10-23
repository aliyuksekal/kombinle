import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import *
# @admin PRO hediye eder; hediye alan kişi açılışta PRO olur, jeton harcamaz.
ORTAK = r"""window.__api = []; window.__liste = window.__liste || [];
const yanit = (req, d) => setTimeout(() => window.dispatchEvent(new CustomEvent('kbyerel', {detail: Object.assign({req}, d)})), 40);
window.KombinleNative = {
  konum: req => yanit(req, {ok: true, lat: 41.01, lon: 28.97, ad: 'İstanbul'}), konumAyarlari: () => {},
  surum: () => '1.0.22', cubuk: () => {}, dinle: req => yanit(req, {ok: false}), etiketle: req => yanit(req, {ok: true, etiketler: []}),
  arkaSil: req => yanit(req, {ok: false}), dosyaKaydet: req => yanit(req, {ok: true}),
  odemeSorgula: req => yanit(req, {ok: true, products: []}), odemeAl: req => yanit(req, {ok: false}),
  odemeSahip: () => '[]', odemeGeriYukle: req => yanit(req, {ok: true, owned: []}), jetonTeslim: () => 0,
  yzVar: () => true, oturumVar: () => true, oturumAyarla: () => {}, sunucu: () => 'https://kombinle-api.ornek.workers.dev',
  api: (req, yol, govde) => {
    const g = JSON.parse(govde); window.__api.push({yol, g});
    if (yol === '/v1/ben') return yanit(req, {ok: true, durum: 200, veri: {ok: true, hesap: window.__ben}});
    if (yol === '/v1/prolar') return yanit(req, {ok: true, durum: 200, veri: {ok: true, liste: window.__liste}});
    if (yol === '/v1/proata') {
      if (g.hedef === 'yok.kisi') return yanit(req, {ok: false, durum: 404, veri: {ok: false, hata: 'yok'}});
      if (g.geriAl) { window.__liste = window.__liste.filter(x => x.hedef !== g.hedef); return yanit(req, {ok: true, durum: 200, veri: {ok: true, ad: 'Ayşe', pro: 0}}); }
      const pro = g.gun === 0 ? -1 : Date.now() + g.gun * 86400000;
      window.__liste = [{ad: 'Ayşe', kadi: 'ayse.test', eposta: 'ay***@ornek.com', hedef: 'ayse.test', pro}].concat(window.__liste);
      return yanit(req, {ok: true, durum: 200, veri: {ok: true, ad: 'Ayşe', kadi: 'ayse.test', pro}});
    }
    yanit(req, {ok: false, durum: 404, veri: {ok: false, hata: 'yok'}});
  }
};"""
ADMIN = "localStorage.setItem('kb_hesap', JSON.stringify({ad: 'Ali', eposta: 'ali@ornek.com', kod: '0123456789ab', kadi: 'admin', yonetici: true})); window.__ben = {ad: 'Ali', eposta: 'ali@ornek.com', kod: '0123456789ab', kadi: 'admin', yonetici: true, av: 0, pro: 0};"
TESTCI = "localStorage.setItem('kb_hesap', JSON.stringify({ad: 'Ayşe', eposta: 'ayse@ornek.com', kod: 'abcdef012345', kadi: 'ayse.test'})); localStorage.setItem('kb_jeton', '0'); window.__ben = {ad: 'Ayşe', eposta: 'ayse@ornek.com', kod: 'abcdef012345', kadi: 'ayse.test', yonetici: false, av: 0, pro: Date.now() + 30 * 86400000};"

with sync_playwright() as pw:
    o = Oturum(pw, koyu=True); o.ctx.add_init_script(ADMIN + ORTAK); p = o.ac()
    p.click('text=Başla'); p.wait_for_timeout(600)
    p.click('nav.alt-menu button[data-sekme="ayarlar"]'); p.wait_for_timeout(400)
    p.evaluate("(() => { const d = document.querySelector('.yonetici-btn').closest('details'); if (d) d.open = true; })()"); p.wait_for_timeout(200)
    p.click('.yonetici-btn'); p.wait_for_timeout(400)
    p.click('text=Deneme yapacaklara PRO ver'); p.wait_for_timeout(600)
    sy = p.locator('.sayfa.acik').last
    ok('Henüz kimseye PRO vermedin' in sy.inner_text(), 'boş PRO listesi')
    girdi = sy.locator('input[aria-label="Kullanıcı adı ya da e-posta"]')
    girdi.fill('ab'); sy.locator('button:has-text("PRO ver")').click(); p.wait_for_timeout(300)
    ok(not any(a['yol'] == '/v1/proata' for a in p.evaluate('window.__api')), 'geçersiz hedef sunucuya gitmedi')
    sy.locator('button.cip:has-text("Süresiz")').click()
    girdi.fill('@ayse.test'); sy.locator('button:has-text("PRO ver")').click(); p.wait_for_timeout(700)
    istek = [a for a in p.evaluate('window.__api') if a['yol'] == '/v1/proata'][-1]['g']
    ok(istek == {'hedef': '@ayse.test', 'gun': 0}, 'süresiz PRO isteği gitti: ' + str(istek))
    ok('Ayşe · @ayse.test' in sy.inner_text() and 'süresiz' in sy.inner_text(), 'liste güncellendi')
    p.screenshot(path=os.path.join(EKRAN, 'pro_hediye_koyu.png'))
    girdi.fill('yok.kisi'); sy.locator('button:has-text("PRO ver")').click(); p.wait_for_timeout(600)
    ok('bulunamadı' in p.inner_text('body'), 'olmayan kişi için anlaşılır uyarı')
    sy.locator('button:has-text("Geri al")').click(); p.wait_for_timeout(400)
    p.locator('.sayfa.acik').last.locator('button:has-text("Evet")').click(); p.wait_for_timeout(800)
    ok('Henüz kimseye PRO vermedin' in sy.inner_text(), 'PRO geri alındı')
    ok(not [h for h in o.hatalar if 'pageerror' in h], 'sayfa hatası yok')
    o.kapat()

    o = Oturum(pw); o.ctx.add_init_script(TESTCI + ORTAK); p = o.ac()
    p.click('text=Başla'); p.wait_for_timeout(1200)
    ok('PRO' in p.inner_text('#jetonHap'), 'hediye alan kişi PRO oldu: ' + p.inner_text('#jetonHap').strip())
    p.click('nav.alt-menu button[data-sekme="ayarlar"]'); p.wait_for_timeout(400)
    p.evaluate("document.querySelector('.ayar-kart[data-kart=pro]').open = true"); p.wait_for_timeout(200)
    metin = p.inner_text('.ayar-kart[data-kart=pro]')
    ok('Kombinle hediyesi' in metin and 'Aboneliği' not in metin, 'ayarlarda hediye bitişi görünüyor, abonelik yönetimi yok')
    p.click('nav.alt-menu button[data-sekme="bugun"]'); p.wait_for_timeout(300)
    p.click('text=Bavul hazırla'); p.wait_for_timeout(900)
    ok(p.locator('.sayfa.acik .g-fiyat').count() == 0, '0 jetonla bile mağaza açılmadı')
    o.kapat()

    # hediye geri alınınca normal kullanıcıya döner
    o = Oturum(pw); o.ctx.add_init_script(TESTCI.replace('pro: Date.now() + 30 * 86400000', 'pro: 0') + ORTAK); p = o.ac()
    p.click('text=Başla'); p.wait_for_timeout(1200)
    ok('PRO' not in p.inner_text('#jetonHap'), 'hediye yokken PRO değil')
    o.kapat()
ozet()
