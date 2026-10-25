import sys, os, json; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import *
# Mesajlaşma, profil takip sekmeleri, yeni takipçi uyarısı, yönetici şikâyet paneli, e-postayla şifre sıfırlama
SAHTE = r"""window.__api = []; window.__mod = window.__mod || {};
const yanit = (req, d) => setTimeout(() => window.dispatchEvent(new CustomEvent('kbyerel', {detail: Object.assign({req}, d)})), 30);
const KISI = {kod: 'bbbbbbbbbbbb', takma: 'Zeynep', kadi: 'zeynep', av: 0};
window.__mesajlar = [{id: 'm'.repeat(20), ben: false, metin: 'Merhaba! Ceketin nereden?', zaman: Date.now() - 600000, okundu: 1}];
window.__durum = window.__mod.durum || 'acik';
window.__izin = 0;
window.KombinleNative = {
  konum: req => yanit(req, {ok: true, lat: 41.01, lon: 28.97, ad: 'İstanbul'}), konumAyarlari: () => {},
  surum: () => '1.0.24', cubuk: () => {}, dinle: req => yanit(req, {ok: false}), etiketle: req => yanit(req, {ok: true, etiketler: []}),
  arkaSil: req => yanit(req, {ok: false}), dosyaKaydet: req => yanit(req, {ok: true}),
  odemeSorgula: req => yanit(req, {ok: true, products: []}), odemeAl: req => yanit(req, {ok: false}),
  odemeSahip: () => '[]', odemeGeriYukle: req => yanit(req, {ok: true, owned: []}), jetonTeslim: () => 0,
  yzVar: () => true, oturumVar: () => !window.__mod.cikis, oturumAyarla: () => {}, sunucu: () => 'https://kombinle-api.ornek.workers.dev',
  bildirimIzni: () => { window.__izin++; }, acilacak: () => window.__mod.ac || '',
  api: (req, yol, govde) => {
    const g = JSON.parse(govde); window.__api.push({yol, g});
    const tamam = v => yanit(req, {ok: true, durum: 200, veri: Object.assign({ok: true}, v)});
    const hata = (h, d) => yanit(req, {ok: false, durum: d || 400, veri: {ok: false, hata: h}});
    if (yol === '/v1/ben') return tamam({hesap: window.__ben});
    if (yol === '/v1/bildirim' && g.sadeceSay) { window.__bsay = (window.__bsay || 0) + 1; return tamam(window.__bsay > 1 && window.__mod.yeniTakip ? {okunmamis: 1, mesaj: 2, son: {tur: 'takip', zaman: Date.now(), takma: 'Ayşe'}, sonMesaj: null} : {okunmamis: 0, mesaj: 2, son: null, sonMesaj: {zaman: Date.now() - 999999, takma: 'Zeynep'}}); }
    if (yol === '/v1/dmliste') return tamam({liste: [
      {kisi: KISI, son: Date.now() - 600000, metin: 'Merhaba! Ceketin nereden?', benden: false, okunmamis: 2, durum: 'acik'},
      {kisi: {kod: 'cccccccccccc', takma: 'Yabancı', kadi: '', av: 0}, son: Date.now() - 900000, metin: 'Selam', benden: false, okunmamis: 1, durum: 'istek_gelen'}]});
    if (yol === '/v1/dmoku') return tamam({durum: window.__durum, kisi: KISI, engelledim: false, mesajlar: window.__mesajlar});
    if (yol === '/v1/dmyaz') {
      if (/www\./.test(g.metin)) return hata('baglanti');
      const m = {id: 'n' + String(window.__mesajlar.length).padStart(19, '0'), ben: true, metin: g.metin, zaman: Date.now(), okundu: 0};
      window.__mesajlar.push(m); return tamam({mesaj: m, durum: 'acik'});
    }
    if (yol === '/v1/dmkabul') { window.__durum = 'acik'; return tamam({durum: 'acik'}); }
    if (yol === '/v1/dmengel' || yol === '/v1/dmsil' || yol === '/v1/dmsikayet') return tamam({engel: g.engel !== false});
    if (yol === '/v1/profilgor') return tamam({profil: {kod: g.kod, takma: g.kod === 'bbbbbbbbbbbb' ? 'Zeynep' : 'Elif', kadi: 'x', bio: '', av: 0, takipci: 3, takip: 2, paylasim: 0, takipte: 0, benim: g.kod === '0123456789ab' ? 1 : 0}});
    if (yol === '/v1/takipler') return tamam({liste: g.tur === 'takip' ? [{kod: 'dddddddddddd', takma: 'Merve', kadi: 'merve', av: 0, takipte: 1, benim: 0}] : [{kod: 'bbbbbbbbbbbb', takma: 'Zeynep', kadi: 'zeynep', av: 0, takipte: 0, benim: 0}, {kod: 'eeeeeeeeeeee', takma: 'Ayşe', kadi: 'ayse', av: 0, takipte: 1, benim: 0}]});
    if (yol === '/v1/akis') return tamam({devam: false, liste: []});
    if (yol === '/v1/yonetim') {
      if (g.islem === 'liste') return tamam({paylasimlar: [{id: 'p'.repeat(20), takma: 'Kötü', aciklama: 'x', sikayet: 3, zaman: Date.now(), nedenler: 'spam,uygunsuz'}], anketler: [], yorumlar: [{id: 'y'.repeat(20), takma: 'Biri', metin: 'kaba yorum', sikayet: 3, zaman: Date.now()}],
        engelliler: [{kod: 'ffffffffffff', zaman: Date.now(), takma: 'Spamcı', kadi: ''}], mesajlar: [{id: 'q'.repeat(20), metin: 'rahatsız edici', zaman: Date.now(), gonderen: 'aaaaaaaaaaaa', takma: 'Taciz', sayi: 2}]});
      if (g.islem === 'resim') return tamam({tip: 'image/png', b64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='});
      return tamam({});
    }
    if (yol === '/v1/durum') return tamam({eposta: !!window.__mod.eposta});
    if (yol === '/v1/kodgonder') return tamam({});
    if (yol === '/v1/kodsifirla') return g.kod === '123456' ? tamam({oturum: 'a'.repeat(64), hesap: {ad: 'Elif', eposta: g.eposta, kod: '0123456789ab', kadi: 'elif', yonetici: false, av: 0, pro: 0}}) : hata('yanlis', 401);
    if (yol === '/v1/reklamlar' || yol === '/v1/kisiler') return tamam({liste: []});
    hata('yok', 404);
  }
};"""
HESAP = "localStorage.setItem('kb_hesap', JSON.stringify(%s)); window.__ben = %s;"
ELIF = {'ad': 'Elif', 'eposta': 'elif@ornek.com', 'kod': '0123456789ab', 'kadi': 'elif', 'yonetici': False, 'av': 0, 'pro': 0}
ADMIN = dict(ELIF, kadi='admin', yonetici=True)


def oturum(pw, hesap, mod=None, koyu=True):
    o = Oturum(pw, koyu=koyu)
    o.ctx.add_init_script(('window.__mod = %s;' % json.dumps(mod or {})) + (HESAP % (json.dumps(hesap), json.dumps(hesap)) if hesap else '') + SAHTE)
    p = o.ac(); p.click('text=Başla'); p.wait_for_timeout(900)
    return o, p


with sync_playwright() as pw:
    print('— mesajlar')
    o, p = oturum(pw, ELIF)
    ok(p.locator('.g-dm .zil-rozet').inner_text() == '2', 'üst çubukta okunmamış mesaj rozeti')
    ok(p.evaluate('window.__izin') >= 0, '')
    p.click('.g-dm'); p.wait_for_timeout(600)
    sy = p.locator('.sayfa.acik').last
    ok('Zeynep' in sy.inner_text() and 'Yabancı' not in sy.inner_text() and 'İstekler (1)' in sy.inner_text(), 'sohbetler ve istek sayısı ayrı')
    o.ekran('d1_kutu')
    sy.locator('.g-haplar button', has_text='İstekler').click(); p.wait_for_timeout(200)
    ok('Yabancı' in sy.inner_text(), 'istekler sekmesi')
    sy.locator('.g-haplar button', has_text='Sohbetler').click(); p.wait_for_timeout(200)
    sy.locator('.tk-ac', has_text='Zeynep').click(); p.wait_for_timeout(800)
    sh = p.locator('.sayfa.acik').last
    ok('Ceketin nereden' in sh.inner_text(), 'sohbet açıldı, mesaj görünüyor')
    sh.locator('.dm-girdi').fill('Zara’dan 💜')
    sh.locator('.dm-gonder').click(); p.wait_for_timeout(500)
    ok(sh.locator('.dm-balon.ben').count() == 1 and 'Zara' in sh.locator('.dm-balon.ben').inner_text(), 'mesaj gönderildi, balon sağda')
    sh.locator('.dm-girdi').fill('bak www.site.com'); sh.locator('.dm-girdi').press('Enter'); p.wait_for_timeout(400)
    ok('bağlantı' in p.inner_text('#tost'), 'bağlantılı mesaj için anlaşılır uyarı')
    o.ekran('d2_sohbet')
    p.wait_for_timeout(4500)
    ok(len([a for a in p.evaluate('window.__api') if a['yol'] == '/v1/dmoku']) >= 2, 'açık sohbet kendiliğinden yenileniyor')
    sh.locator('.bas [aria-label="Seçenekler"]').click(); p.wait_for_timeout(400)
    ok('engelle' in p.locator('.sayfa.acik').last.inner_text(), 'sohbet menüsünde engelle')
    o.kapat()

    print('— mesaj isteği')
    o, p = oturum(pw, ELIF, {'durum': 'istek_gelen'})
    p.click('.g-dm'); p.wait_for_timeout(500)
    p.locator('.sayfa.acik').last.locator('.tk-ac', has_text='Zeynep').click(); p.wait_for_timeout(800)
    sh = p.locator('.sayfa.acik').last
    ok('seni takip etmiyor' in sh.inner_text() and sh.locator('.dm-girdi').is_disabled(), 'istekte kabul etmeden yazılamıyor')
    sh.locator('button', has_text='Kabul et').click(); p.wait_for_timeout(500)
    ok(not sh.locator('.dm-girdi').is_disabled(), 'kabul edince yazılabiliyor')
    o.kapat()

    print('— profil')
    o, p = oturum(pw, ELIF)
    p.click('.g-hesap'); p.wait_for_timeout(800)
    sy = p.locator('.sayfa.acik').last
    ok(sy.locator('.pr-sekmeler button', has_text='Takipçiler').count() == 1 and sy.locator('.pr-sekmeler button', has_text='Takip edilen').count() == 1, 'profilde Takipçiler ve Takip ettiklerim sekmeleri')
    sy.locator('.pr-sekmeler button', has_text='Takipçiler').click(); p.wait_for_timeout(500)
    ok('Zeynep' in sy.inner_text() and 'Ayşe' in sy.inner_text(), 'takipçiler listelendi')
    sy.locator('.pr-sekmeler button', has_text='Takip edilen').click(); p.wait_for_timeout(500)
    ok('Merve' in sy.inner_text() and sy.locator('.pr-sayi').count() == 0, 'takip edilenler sekmesi; profilde sayı satırı yok')
    o.ekran('d3_profil_takip')
    sy.locator('.tk-ac', has_text='Merve').click(); p.wait_for_timeout(900)
    sp = p.locator('.sayfa.acik').last
    ok(sp.locator('.pr-mesaj').count() == 1, 'başkasının profilinde "Mesaj" düğmesi')
    sp.locator('.pr-mesaj').click(); p.wait_for_timeout(700)
    ok(p.locator('.sayfa.acik').last.locator('.dm-girdi').count() == 1, 'profilden sohbet açıldı')
    o.kapat()

    print('— yeni takipçi uyarısı')
    o, p = oturum(pw, ELIF, {'yeniTakip': True})
    p.evaluate("window.__bsay = 1"); p.wait_for_timeout(31500)
    ok('Ayşe seni takip etmeye başladı' in p.inner_text('#tost') or any('Ayşe seni takip' in x for x in [p.inner_text('body')]), 'uygulama açıkken yeni takipçi uyarısı')
    ok(p.evaluate('window.__izin') >= 1, 'bildirim izni istendi')
    o.kapat()

    print('— yönetici şikâyet paneli')
    o, p = oturum(pw, ADMIN)
    p.click('nav.alt-menu button[data-sekme="ayarlar"]'); p.wait_for_timeout(400)
    p.evaluate("(() => { const d = document.querySelector('.yonetici-btn').closest('details'); if (d) d.open = true; })()")
    p.click('.yonetici-btn'); p.wait_for_timeout(400)
    p.click('text=Şikâyetleri incele'); p.wait_for_timeout(900)
    sy = p.locator('.sayfa.acik').last
    t = sy.inner_text()
    ok('GİZLENEN PAYLAŞIMLAR (1)' in t.upper().replace('İ', 'İ') or 'Gizlenen paylaşımlar (1)' in t, 'başlık'); ok( 'spam' in t and 'kaba yorum' in t and 'rahatsız edici' in t and 'Spamcı' in t, 'gizlenenler, mesaj şikâyetleri ve engellenenler')
    ok(sy.locator('.yk-resim img').count() >= 1, 'gizli görsel önizlemesi')
    o.ekran('d4_sikayet_paneli')
    sy.locator('.yk-satir', has_text='Kötü').locator('button', has_text='Geri aç').click(); p.wait_for_timeout(400)
    ok(any(a['yol'] == '/v1/yonetim' and a['g'].get('islem') == 'paylasimac' for a in p.evaluate('window.__api')) and sy.locator('.yk-satir', has_text='Kötü').count() == 0, 'paylaşım geri açıldı')
    sy.locator('.yk-satir', has_text='Spamcı').locator('button', has_text='Engeli kaldır').click(); p.wait_for_timeout(400)
    ok(any(a['g'].get('islem') == 'engelkaldir' and a['g'].get('kod') == 'ffffffffffff' for a in p.evaluate('window.__api')), 'engel kaldırıldı')
    o.kapat()

    print('— e-postayla şifre sıfırlama')
    o, p = oturum(pw, None, {'eposta': True})
    p.click('nav.alt-menu button[data-sekme="ayarlar"]'); p.wait_for_timeout(400)
    p.evaluate("(() => { const d = document.querySelector('.hesap-bolum').closest('details'); if (d) d.open = true; })()"); p.wait_for_timeout(200)
    p.click('.hesap-link:has-text("Şifremi unuttum")'); p.wait_for_timeout(900)
    ok(p.locator('.hesap-bolum button', has_text='Kod gönder').count() == 1, 'sunucu destekliyorsa e-posta kodu seçeneği')
    p.fill('.hesap-bolum input[type=email]', 'elif@ornek.com')
    p.click('.hesap-bolum button:has-text("Kod gönder")'); p.wait_for_timeout(500)
    ok(any(a['yol'] == '/v1/kodgonder' and a['g']['eposta'] == 'elif@ornek.com' for a in p.evaluate('window.__api')), 'kod istendi')
    p.fill('.hesap-bolum input[autocomplete=one-time-code]', '123456')
    p.fill('.hesap-bolum input[autocomplete=new-password]', 'yeni-sifre-1')
    p.click('.hesap-bolum .btn.ana'); p.wait_for_timeout(700)
    ok(any(a['yol'] == '/v1/kodsifirla' and a['g']['kod'] == '123456' for a in p.evaluate('window.__api')) and 'Hoş geldin' in p.inner_text('#tost'), 'kodla şifre sıfırlandı ve giriş yapıldı')
    hatalar = [x for x in o.hatalar if 'pageerror' in x]
    ok(not hatalar, 'sayfa hatası yok ' + str(hatalar[:2]))
    o.kapat()

    print('— e-posta kapalıyken')
    o, p = oturum(pw, None, {'eposta': False})
    p.click('nav.alt-menu button[data-sekme="ayarlar"]'); p.wait_for_timeout(400)
    p.evaluate("(() => { const d = document.querySelector('.hesap-bolum').closest('details'); if (d) d.open = true; })()"); p.wait_for_timeout(200)
    p.click('.hesap-link:has-text("Şifremi unuttum")'); p.wait_for_timeout(900)
    ok(p.locator('.hesap-bolum button', has_text='Kod gönder').count() == 0 and p.locator('.hesap-bolum input[autocomplete=off]').count() >= 1, 'yalnız kurtarma kodu seçeneği')
    o.kapat()
ozet()
