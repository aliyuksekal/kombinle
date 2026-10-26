import sys, os, json; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import *
# Yeni gönderi (+ → kamera/galeri → düzenleyici → paylaş), keşfette takip ettiklerin ve kişi kartları,
# aşağı çekip yenileme, takip edilenin paylaşım bildirimi (uygulama içi şerit + telefon paneli)
KOK = os.path.dirname(os.path.abspath(__file__))
SAHTE = open(os.path.join(KOK, 'mesaj.py')).read().split('SAHTE = r"""')[1].split('"""')[0]
EK = r"""
    if (yol === '/v1/kisiler') return tamam({takipEdilen: 2, liste: g.mod === 'takip'
      ? [{kod: 'cccccccccccc', takma: 'Selin', kadi: 'selin', bio: '', av: 0, son: Date.now() - 3600000, resimler: [], takipte: 1},
         {kod: 'dddddddddddd', takma: 'Merve', kadi: 'merve', bio: '', av: 0, son: Date.now() - 9 * 86400000, resimler: [], takipte: 1}]
      : [{kod: 'eeeeeeeeeeee', takma: 'Ayşe', kadi: 'ayse', bio: 'Minimal ve rahat', av: 0, takipci: 12, paylasim: 3, resimler: ['a'.repeat(20), 'b'.repeat(20)], takipte: 0, istekte: 0}]});
    if (yol === '/v1/akis') { window.__akis = (window.__akis || 0) + 1; return tamam({liste: [], devam: false}); }
    if (yol === '/v1/paylas') { window.__paylas = g; return tamam({id: 'p'.repeat(20)}); }
    if (yol === '/v1/bildirim' && g.sadeceSay && window.__mod.paylasimBildirimi) { window.__bsay = (window.__bsay || 0) + 1; return tamam(window.__bsay > 1 ? {okunmamis: 1, mesaj: 0, son: {tur: 'paylasim', zaman: Date.now(), takma: 'Selin'}, sonMesaj: null} : {okunmamis: 0, mesaj: 0, son: null, sonMesaj: null}); }
    if (yol === '/v1/ben')"""
SAHTE = SAHTE.replace("\n    if (yol === '/v1/ben')", EK, 1)
SAHTE = SAHTE.replace("bildirimIzni: () => { window.__izin++; },", "bildirimIzni: () => { window.__izin++; }, bildirimDurum: () => !window.__mod.bnKapali, bildirimAyarlari: () => { window.__bnAyar = 1; }, bildirimGoster: (b, m, a) => { (window.__panel = window.__panel || []).push([b, a]); },")
ELIF = {'ad': 'Elif', 'eposta': 'elif@ornek.com', 'kod': '0123456789ab', 'kadi': 'elif', 'yonetici': False, 'av': 0, 'pro': 0}


def oturum(pw, mod=None, saat=False):
    o = Oturum(pw); o.ctx.grant_permissions(['camera', 'geolocation'])
    o.ctx.add_init_script(('window.__mod = %s;' % json.dumps(mod or {})) +
                          "localStorage.setItem('kb_hesap', JSON.stringify(%s)); window.__ben = %s;" % (json.dumps(ELIF), json.dumps(ELIF)) + SAHTE)
    if saat:
        o.p.clock.install()
    p = o.ac(); p.click('text=Başla'); p.wait_for_timeout(900)
    return o, p


def son(p):
    return p.locator('.sayfa.acik').last


with sync_playwright() as pw:
    print('— Profil "+": galeri → düzenleyici → paylaş')
    o, p = oturum(pw)
    p.click('.g-hesap'); p.wait_for_timeout(900)
    son(p).locator('.pr-yeni').click(); p.wait_for_timeout(600)
    s = son(p)
    ok('Kamera' in s.inner_text() and 'Galeri' in s.inner_text(), '"+" önce kaynağı soruyor: Kamera / Galeri')
    with p.expect_file_chooser() as fc:
        s.locator('button.satir', has_text='Galeri').click()
    fc.value.set_files('foto/elbise_yesil.jpg'); p.wait_for_timeout(1500)
    s = son(p)
    ok('tam' in s.get_attribute('class') and s.locator('.gn-onizleme').count() == 1, 'fotoğraf düzenleyici tam ekran açıldı')
    ok(s.locator('.gn-filtre').count() == 9, '9 filtre küçük önizlemeleriyle')
    once = p.evaluate("(() => { const c = document.querySelector('.gn-onizleme'); return c.toDataURL().length; })()")
    s.locator('.gn-filtre', has_text='S/B').click(); p.wait_for_timeout(300)
    gri = p.evaluate("(() => { const c = document.querySelector('.gn-onizleme'); const d = c.getContext('2d').getImageData(c.width / 2, c.height / 2, 1, 1).data; return Math.abs(d[0] - d[1]) + Math.abs(d[1] - d[2]); })()")
    ok(gri <= 3 and s.locator('.gn-filtre[aria-pressed="true"]').inner_text() == 'S/B', 'S/B filtresi uygulandı (gri tonlar)')
    o.ekran('g1_filtre')
    s.locator('.gn-sekmeler button', has_text='Ayarla').click(); p.wait_for_timeout(200)
    ok(s.locator('.gn-kaydir').count() == 5, 'parlaklık, kontrast, doygunluk, sıcaklık, vinyet ayarları')
    s.locator('.gn-kaydir', has_text='Parlaklık').locator('input').fill('40'); p.wait_for_timeout(200)
    ok(s.locator('.gn-kaydir', has_text='Parlaklık').locator('output').inner_text() == '40', 'parlaklık ayarlandı')
    o.ekran('g2_ayarla')
    s.locator('.gn-sekmeler button', has_text='Kırp').click(); p.wait_for_timeout(200)
    b0 = p.evaluate("[document.querySelector('.gn-onizleme').width, document.querySelector('.gn-onizleme').height]")
    s.locator('.gn-kirp button', has_text='Döndür').click(); p.wait_for_timeout(300)
    b1 = p.evaluate("[document.querySelector('.gn-onizleme').width, document.querySelector('.gn-onizleme').height]")
    ok(b1 == [b0[1], b0[0]], 'döndür: en ve boy yer değiştirdi %s → %s' % (b0, b1))
    s.locator('.gn-kirp button', has_text='Kırp').click(); p.wait_for_timeout(600)
    ok('Fotoğrafı kırp' in son(p).inner_text(), 'kırpma çerçevesi açıldı')
    son(p).locator('.alt-bar .btn.ana').click(); p.wait_for_timeout(500)
    son(p).locator('.alt-bar .btn.ana', has_text='İleri').click(); p.wait_for_timeout(900)
    s = son(p)
    ok('Kombinini paylaş' in s.inner_text() and s.locator('.g-paylas-onizleme img').count() == 1, 'düzenlenen fotoğraf paylaşım sayfasında')
    ok(s.locator('button', has_text='Kamera').count() == 1 and s.locator('button', has_text='Düzenle').is_visible(), 'paylaşımda Kamera, Galeri ve Düzenle düğmeleri')
    o.ekran('g3_paylas')
    s.locator('#kuralOnay').check(); s.locator('.alt-bar .btn.ana').click(); p.wait_for_timeout(900)
    ok(p.evaluate('!!window.__paylas && window.__paylas.resim.length > 1000'), 'düzenlenmiş fotoğraf paylaşıldı')

    print('— Kamera ile gönderi')
    while p.locator('.sayfa.acik').count():
        son(p).locator('.bas :is([aria-label="Kapat"],[aria-label="Geri"])').last.click(); p.wait_for_timeout(400)
    p.click('#altMenu [data-sekme="kesfet"]'); p.wait_for_timeout(900)
    p.locator('.g-ekle').first.click(); p.wait_for_timeout(500)
    son(p).locator('button.satir', has_text='Kamera').click(); p.wait_for_timeout(2500)
    ok(p.locator('.kam.acik').count() == 1 and p.locator('.kam-modlar button').count() == 1 and 'Gönderi' in p.inner_text('.kam-modlar'), 'gönderi kamerası açıldı (tek mod)')
    p.click('.kam .kam-deklansor'); p.wait_for_timeout(1500)
    ok(p.locator('.kam').count() == 0 and son(p).locator('.gn-onizleme').count() == 1, 'çekilen kare doğrudan düzenleyiciye geldi')
    while p.locator('.sayfa.acik').count():
        son(p).locator('.bas :is([aria-label="Kapat"],[aria-label="Geri"])').last.click(); p.wait_for_timeout(400)

    print('— Keşfet: üst düğmeler, çekip yenile')
    ok(p.locator('.kt').count() == 0 and p.locator('.g-kisi.kk').count() == 0 and p.locator('.g-kesfet-seg button').count() == 3, 'keşfette kişi bölümleri yok, üstte üç düğme')
    o.ekran('g4_kesfet')
    once = p.evaluate('window.__akis || 0')
    p.evaluate("""(() => { window.scrollTo(0, 0);
      const t = (y) => new Touch({identifier: 1, target: document.body, clientX: 200, clientY: y});
      document.body.dispatchEvent(new TouchEvent('touchstart', {touches: [t(120)], bubbles: true}));
      document.body.dispatchEvent(new TouchEvent('touchmove', {touches: [t(200)], bubbles: true}));
      document.body.dispatchEvent(new TouchEvent('touchmove', {touches: [t(300)], bubbles: true}));
      document.body.dispatchEvent(new TouchEvent('touchend', {touches: [], bubbles: true})); })()""")
    p.wait_for_timeout(900)
    ok(p.evaluate('window.__akis || 0') > once, 'sayfanın üstünden aşağı çekince akış yenilendi')

    print('— Telefon bildirimi ayarı')
    p.click('#altMenu [data-sekme="ayarlar"]'); p.wait_for_timeout(700)
    p.click('details[data-kart="kisisel"] summary'); p.wait_for_timeout(400)
    ok(p.locator('.bn-ayar').count() == 1 and 'Açık' in p.inner_text('.bn-ayar'), 'ayarlarda telefon bildirimleri satırı')
    p.locator('.bn-ayar button').click(); p.wait_for_timeout(200)
    ok(p.evaluate('window.__bnAyar') == 1, 'telefonun bildirim ayarlarını açar')
    hatalar = [h for h in o.hatalar if 'pageerror' in h]
    ok(not hatalar, 'sayfa hatası yok ' + str(hatalar[:2]))
    o.kapat()

    print('— Takip edilenin yeni paylaşımı: uygulama içinde ve telefonun bildirim panelinde')
    o, p = oturum(pw, {'paylasimBildirimi': True}, saat=True)
    p.clock.fast_forward('00:05'); p.wait_for_timeout(500)
    p.clock.fast_forward('00:35'); p.wait_for_timeout(1200)
    ok(p.locator('.bn-serit').count() == 1 and 'Selin yeni bir kombin paylaştı' in p.inner_text('.bn-serit'), 'uygulama içinde üstte bildirim şeridi')
    ok(p.evaluate('window.__panel') and p.evaluate('window.__panel')[-1] == ['Selin yeni bir kombin paylaştı', 'bildirim'], 'telefonun bildirim paneline de gönderildi')
    o.ekran('g5_serit')
    p.locator('.bn-serit').click(); p.wait_for_timeout(900)
    ok('Bildirimler' in son(p).inner_text(), 'şeride dokununca bildirimler açıldı')
    o.kapat()
ozet()
