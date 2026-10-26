import sys, os, json; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import *
# Tam ekran profil / mesaj / bildirim sayfaları, profilde ve keşfette "+", kimin için seçimi, mesaj güvenliği ayarı
KOK = os.path.dirname(os.path.abspath(__file__))
SAHTE = open(os.path.join(KOK, 'mesaj.py')).read().split('SAHTE = r"""')[1].split('"""')[0]
EK = open(os.path.join(KOK, 'istek.py')).read().split('EK = r"""')[1].split('"""')[0]
EK = EK.replace("    if (yol === '/v1/gizlilik')", "    if (yol === '/v1/gizlilik' && (g.dm || !('acik' in g))) { if (g.dm) window.__dm = g.dm; return tamam({acik: false, istek: 0, dm: window.__dm || 'takip'}); }\n    if (yol === '/v1/gizlilik')", 1)
EK = EK.replace("acik: 0, istek: g.kod", "acik: 0, dm: window.__mod.dmKapali ? 0 : 1, istek: g.kod")
SAHTE = SAHTE.replace("\n    if (yol === '/v1/ben')", EK, 1)
ELIF = {'ad': 'Elif', 'eposta': 'elif@ornek.com', 'kod': '0123456789ab', 'kadi': 'elif', 'yonetici': False, 'av': 0, 'pro': 0}


def oturum(pw, mod=None, basla=True):
    o = Oturum(pw)
    o.ctx.add_init_script(('window.__mod = %s; window.__istekler = [];' % json.dumps(mod or {})) +
                          "localStorage.setItem('kb_hesap', JSON.stringify(%s)); window.__ben = %s;" % (json.dumps(ELIF), json.dumps(ELIF)) + SAHTE)
    p = o.ac()
    if basla:
        p.click('text=Başla'); p.wait_for_timeout(900)
    return o, p


def son(p):
    return p.locator('.sayfa.acik').last


with sync_playwright() as pw:
    print('— Tam ekran sayfalar')
    o, p = oturum(pw)
    p.click('.g-hesap'); p.wait_for_timeout(1000)
    s = son(p)
    kutu = s.bounding_box(); ekran = p.viewport_size
    ok(s.get_attribute('class').count('tam') == 1 and kutu['y'] <= 1 and kutu['height'] >= ekran['height'] - 2, 'profil tam ekran açıldı: %s' % kutu)
    ok(s.locator('.bas [aria-label="Geri"]').count() == 1 and s.locator('.tutamak').count() == 0, 'solda geri düğmesi, alttan çekme tutamağı yok')
    ok(s.locator('.bas .pr-yeni').count() == 1, 'kendi profilimde üstte "+" (yeni kombin paylaş)')
    o.ekran('t1_profil_tam')
    s.locator('.bas .pr-yeni').click(); p.wait_for_timeout(900)
    ok('Kamera' in son(p).inner_text() and 'Galeri' in son(p).inner_text(), '"+" yeni gönderi için kamera / galeri soruyor')
    son(p).locator('.bas :is([aria-label="Kapat"],[aria-label="Geri"])').last.click(); p.wait_for_timeout(500)
    son(p).locator('.bas [aria-label="Geri"]').click(); p.wait_for_timeout(500)
    ok(p.locator('.sayfa.acik').count() == 0, 'geri düğmesi profili kapattı')
    p.click('.g-zil:not(.g-dm)'); p.wait_for_timeout(900)
    ok('tam' in son(p).get_attribute('class'), 'bildirimler tam ekran')
    son(p).locator('.bas [aria-label="Geri"]').click(); p.wait_for_timeout(500)
    p.click('.g-dm'); p.wait_for_timeout(900)
    ok('tam' in son(p).get_attribute('class'), 'mesajlar tam ekran')
    son(p).locator('.dm-satir, .dm-liste button').first.click(); p.wait_for_timeout(1200)
    sh = son(p)
    ak = sh.locator('.dm-akis').bounding_box()
    ok('tam' in sh.get_attribute('class') and ak and ak['height'] > ekran['height'] * 0.45, 'sohbet tam ekran, mesaj alanı ekranı dolduruyor (%d px)' % (ak['height'] if ak else 0))
    ok(sh.locator('.bas [aria-label="Seçenekler"]').count() == 1, 'sohbette seçenekler düğmesi üst çubukta')
    o.ekran('t2_sohbet_tam')
    while p.locator('.sayfa.acik').count():
        son(p).locator('.bas :is([aria-label="Kapat"],[aria-label="Geri"])').last.click(); p.wait_for_timeout(400)

    print('— Keşfette "+"')
    p.click('.alt-menu button[data-sekme="kesfet"], #altMenu button:has-text("Keşfet")'); p.wait_for_timeout(900)
    b = p.locator('.g-ekle').first
    ok('M12 5v14' in b.inner_html() and b.get_attribute('aria-label') == 'Yeni kombin paylaş', 'keşfette paylaş düğmesi "+" simgeli (gönder/paylaş simgesi yok)')

    print('— Mesaj güvenliği')
    p.click('.g-hesap'); p.wait_for_timeout(900)
    son(p).locator('button:has-text("Profili düzenle")').click(); p.wait_for_timeout(1000)
    s = son(p)
    ok(s.locator('.dm-izin-satir').count() == 1 and s.locator('.dm-izin-satir [aria-pressed="true"]').inner_text() == 'Takip ettiklerim', 'profil düzenlede "Bana kimler mesaj yazabilir" (sunucudaki ayar seçili)')
    s.locator('.dm-izin-satir button', has_text='Kimse').click(); p.wait_for_timeout(700)
    ok(p.evaluate('window.__dm') == 'kimse' and 'Kimse yeni mesaj' in s.inner_text(), 'mesaj ayarı "Kimse" olarak kaydedildi')
    o.ekran('t3_mesaj_ayari')
    o.kapat()

    o, p = oturum(pw, {'dmKapali': True})
    p.click('.g-dm'); p.wait_for_timeout(900)
    son(p).locator('.dm-satir, .dm-liste button').first.click(); p.wait_for_timeout(1000)
    son(p).locator('.dm-kisi').click(); p.wait_for_timeout(1000)
    m = son(p).locator('.pr-mesaj')
    ok(m.get_attribute('aria-disabled') == 'true', 'mesaj almayan kişide "Mesaj" düğmesi pasif')
    m.dispatch_event('click'); p.wait_for_timeout(300)
    ok('mesaj almıyor' in p.inner_text('#tost'), 'dokununca açıklama')
    o.kapat()

    print('— Kimin için')
    o, p = oturum(pw, basla=False)
    ok(p.locator('.kimin-karsilama [aria-checked="true"]').inner_text() == 'Kadın', 'karşılamada "Kombinler kimin için?" (varsayılan kadın)')
    p.locator('.kimin-karsilama button', has_text='Erkek').click(); p.wait_for_timeout(300)
    p.click('text=Başla'); p.wait_for_timeout(900)
    ok(p.evaluate("JSON.parse(localStorage.getItem('kb_ayar')).kimin") == 'erkek', 'seçim kaydedildi')
    p.set_input_files('#dosyaSec', ['foto/tisort_kirmizi.jpg']); p.wait_for_selector('.sayfa.acik .buyuk-resim', timeout=15000); p.wait_for_timeout(500)
    s = son(p)
    gr = s.locator('.tur-grup button, .cipler button', has_text='Üst')
    if gr.count():
        gr.first.click(); p.wait_for_timeout(300)
    txt = s.inner_text()
    ok('Polo yaka tişört' in txt and 'Bluz' not in txt, 'erkekte üst türlerinde polo var, bluz yok')
    s.locator('.alt-bar .btn.ikincil').first.click(); p.wait_for_timeout(500)
    p.click('.ai-orta'); p.wait_for_timeout(900)
    ok('AI Stilist' in p.inner_text('.sohbet') and 'Prenses' not in p.inner_text('.sohbet'), 'stil asistanı erkekte "AI Stilist"')
    o.ekran('t4_stilist')
    ok(p.get_attribute('.ai-orta', 'aria-label') == 'AI Stilist', 'alt menüdeki asistan düğmesi de AI Stilist')
    p.go_back(); p.wait_for_timeout(500)
    p.click('nav.alt-menu button[data-sekme="ayarlar"]'); p.wait_for_timeout(500)
    p.evaluate("document.querySelectorAll('.ayar-kart').forEach(d => d.open = true)"); p.wait_for_timeout(200)
    p.locator('.ayar-sekme .kimin-seg button', has_text='Kadın').click(); p.wait_for_timeout(600)
    ok(p.get_attribute('.ai-orta', 'aria-label') == 'AI Prenses', 'kadına dönünce asıl ad (AI Prenses) geri geldi')
    hatalar = [h for h in o.hatalar if 'pageerror' in h]
    ok(not hatalar, 'sayfa hatası yok ' + str(hatalar[:2]))
    o.kapat()
ozet()
