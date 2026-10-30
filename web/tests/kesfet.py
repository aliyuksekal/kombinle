import sys, os, json; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import *
# Keşfet: üstte Topluluk / Editör seçkisi / Takip ettiklerim, kişi bölümleri yok, serbest kaydırma;
# yorumlarda @kişi etiketleme; klavye açıkken yorum kutusu görünür; yönetici seçkiye ekler
KOK = os.path.dirname(os.path.abspath(__file__))
SAHTE = open(os.path.join(KOK, 'mesaj.py')).read().split('SAHTE = r"""')[1].split('"""')[0]
EK = r"""
    if (yol === '/v1/kisiler') { (window.__kisiG = window.__kisiG || []).push(g); return tamam({takipEdilen: 2, liste: g.mod === 'takip'
      ? [{kod: 'cccccccccccc', takma: 'Selin', kadi: 'selin', av: 0, takipte: 1}, {kod: 'dddddddddddd', takma: 'Merve', kadi: 'merve', av: 0, takipte: 1}]
      : [{kod: 'eeeeeeeeeeee', takma: 'Ayşe', kadi: 'ayse', av: 0, takipte: 0}, {kod: 'ffffffffffff', takma: 'Adsız', kadi: '', av: 0, takipte: 0}]}); }
    if (yol === '/v1/akis') { (window.__akisG = window.__akisG || []).push(g.sira); return tamam({devam: false, liste: Array.from({length: 6}, (_, i) => ({id: String.fromCharCode(97 + i).repeat(20), takma: 'Selin', kadi: 'selin', av: 0, aciklama: 'Kombin ' + i, etiketler: [], begeni: 1, begenmeme: 0, yorum: 1, zaman: Date.now() - 60000 * (i + 1), benim: false, gizli: 0, gorunurluk: 'herkes', yazar: 'cccccccccccc', oy: 0, secki: g.sira === 'secki' ? 1 : 0}))}); }
    if (yol === '/v1/yorumlar') return tamam({liste: [{id: 'y'.repeat(20), takma: 'Merve', metin: 'Harika olmuş @selin bak.', zaman: Date.now() - 1000}]});
    if (yol === '/v1/yorum') { window.__yorum = g; return tamam({id: 'z'.repeat(20)}); }
    if (yol === '/v1/yonetim') { window.__yonetim = g; return tamam({secki: g.secki}); }
    if (yol === '/v1/profilgor') return tamam({profil: {kod: 'cccccccccccc', takma: 'Selin', kadi: g.kadi || 'selin', bio: '', av: 0, takipci: 3, takip: 2, paylasim: 6, takipte: 1, benim: 0, dm: 1}});
    if (yol === '/v1/ben')"""
SAHTE = SAHTE.replace("\n    if (yol === '/v1/ben')", EK, 1)


def oturum(pw, yonetici=False):
    ELIF = {'ad': 'Elif', 'eposta': 'elif@ornek.com', 'kod': '0123456789ab', 'kadi': 'admin' if yonetici else 'elif', 'yonetici': yonetici, 'av': 0, 'pro': 0}
    o = Oturum(pw)
    o.ctx.add_init_script('window.__mod = {};' + "localStorage.setItem('kb_hesap', JSON.stringify(%s)); window.__ben = %s;" % (json.dumps(ELIF), json.dumps(ELIF)) + SAHTE)
    p = o.ac(); p.click('text=Başla'); p.wait_for_timeout(900)
    p.click('nav.alt-menu button[data-sekme="kesfet"]'); p.wait_for_timeout(1200)
    return o, p


with sync_playwright() as pw:
    print('— Keşfet üst düğmeleri')
    o, p = oturum(pw)
    ust = p.locator('.g-kesfet-seg button').all_inner_texts()
    ok(ust == ['Topluluk', 'Editör seçkisi', 'Takip ettiklerim'], 'üstte üç düğme: ' + str(ust))
    ok(p.locator('.g-kisiler').count() == 0 and p.locator('.kt').count() == 0, '"Takip ettiklerin" ve "Kişileri keşfet" kaldırıldı')
    haplar = p.locator('.g-haplar').first.locator('button').all_inner_texts()
    ok('Takip edilenler' not in haplar and 'Herkes' in haplar, 'alt seçeneklerde takip yok (üste taşındı): ' + str(haplar))
    ok(p.evaluate("getComputedStyle(document.documentElement).scrollSnapType") in ('none', ''), 'akış serbest kayıyor (yapışma yok)')
    p.evaluate("window.scrollTo(0, 700)"); p.wait_for_timeout(500)
    ok(abs(p.evaluate('window.scrollY') - 700) < 5, 'kaydırma bırakılan yerde duruyor: ' + str(p.evaluate('window.scrollY')))
    p.evaluate("window.scrollTo(0, 0)")
    p.click('.g-kesfet-seg button:has-text("Takip ettiklerim")'); p.wait_for_timeout(800)
    ok(p.evaluate('window.__akisG.slice(-1)[0]') == 'takip' and p.locator('.g-kesfet-seg button[aria-pressed="true"]').inner_text() == 'Takip ettiklerim', 'Takip ettiklerim akışı')
    ok(p.locator('#toplulukAlani .g-akis').count() >= 1 and p.locator('.g-haplar').count() == 0, 'takip akışında paylaşımlar, alt seçenek yok')
    p.click('.g-kesfet-seg button:has-text("Editör seçkisi")'); p.wait_for_timeout(800)
    ok(p.evaluate('window.__akisG.slice(-1)[0]') == 'secki' and p.locator('.ilham-kart').count() == 1, 'Editör seçkisi akışı ve ilham panosu')
    o.ekran('kf1_secki')
    p.click('.g-kesfet-seg button:has-text("Topluluk")'); p.wait_for_timeout(800)
    ok(p.evaluate('window.__akisG.slice(-1)[0]') == 'yeni', 'Topluluk akışına dönüldü')
    o.ekran('kf2_topluluk')

    print('— Kişi arama')
    ok(p.locator('.ka-cubuk').count() == 1, 'Keşfet\'te kişi arama düğmesi var')
    p.click('.ka-cubuk'); p.wait_for_timeout(600)
    ara = p.locator('.sayfa.acik .ka-girdi')
    ok(ara.count() == 1 and 'Kişi ara' in p.locator('.sayfa.acik .baslik').last.inner_text(), 'dokununca arama sayfası açıldı')
    p.wait_for_timeout(300)
    ok(p.evaluate("document.activeElement && document.activeElement.classList.contains('ka-girdi')"), 'yazı alanına odaklandı')
    ara.press_sequentially('ay'); p.wait_for_timeout(700)
    ok(p.evaluate("window.__kisiG.slice(-1)[0].ara") == 'ay', 'harf yazdıkça aranıyor')
    ok(p.locator('.sayfa.acik .ka-sonuc .tk-satir').count() == 2 and 'Ayşe' in p.locator('.sayfa.acik .ka-sonuc').inner_text(), 'uygun kişiler sıralandı')
    o.ekran('kf5_arama')
    ara.fill('@'); p.wait_for_timeout(500)
    ok(p.locator('.sayfa.acik .ka-sonuc .tk-satir').count() == 0, 'yalnız @ yazınca liste temizlendi')
    ara.press_sequentially('ay'); p.wait_for_timeout(700)
    p.locator('.sayfa.acik .ka-sonuc .tk-ac').first.click(); p.wait_for_timeout(800)
    ok('@' in p.locator('.sayfa.acik').last.inner_text(), 'kişiye dokununca profili açıldı')
    while p.locator('.sayfa.acik').count():
        p.locator('.sayfa.acik').last.locator('.bas :is([aria-label="Kapat"],[aria-label="Geri"])').last.click(); p.wait_for_timeout(400)

    print('— Yorumda @etiketleme')
    k = p.locator('#toplulukAlani .g-akis').first
    k.locator('.g-yorum-btn').click(); p.wait_for_timeout(600)
    ok(k.locator('.bahset-link').inner_text() == '@selin', 'yorumdaki @kullanıcıadı dokunulabilir')
    girdi = k.locator('.g-yorum-form input')
    girdi.click(); girdi.press_sequentially('@'); p.wait_for_timeout(500)
    ok(p.evaluate("window.__kisiG.slice(-1)[0].mod") == 'takip' and k.locator('.g-bahset-kisi').count() == 2, '"@" yazınca takip ettiklerin önerildi')
    girdi.press_sequentially('ay'); p.wait_for_timeout(600)
    ok(p.evaluate("window.__kisiG.slice(-1)[0].ara") == 'ay', 'yazdıkça kişi aranıyor')
    ok(k.locator('.g-bahset-kisi').count() == 1, 'kullanıcı adı olmayan kişi önerilmedi')
    o.ekran('kf3_bahset')
    k.locator('.g-bahset-kisi').first.click(); p.wait_for_timeout(200)
    ok(girdi.input_value() == '@ayse ', 'öneriye dokununca etiket eklendi: ' + repr(girdi.input_value()))
    ok(k.locator('.g-bahset-kisi').count() == 0, 'öneri listesi kapandı')
    girdi.press_sequentially('çok yakışmış'); girdi.press('Enter'); p.wait_for_timeout(600)
    ok(p.evaluate('window.__yorum && window.__yorum.metin') == '@ayse çok yakışmış', 'etiketli yorum gönderildi')

    print('— Klavye açıkken yorum kutusu görünür')
    vp = p.viewport_size
    girdi.click(); p.wait_for_timeout(200)
    p.set_viewport_size({'width': vp['width'], 'height': vp['height'] - 330}); p.wait_for_timeout(900)
    ok(p.evaluate("document.documentElement.classList.contains('klavye-acik')"), 'klavye algılandı')
    ok(not p.locator('nav.alt-menu').is_visible(), 'klavye açıkken alt menü gizli')
    kutu = girdi.bounding_box()
    ok(kutu and kutu['y'] >= 0 and kutu['y'] + kutu['height'] <= vp['height'] - 330, 'yorum kutusu klavyenin üstünde görünüyor: ' + str(kutu))
    o.ekran('kf4_klavye')
    p.locator('h2').first.click(); p.set_viewport_size(vp); p.wait_for_timeout(800)
    ok(not p.evaluate("document.documentElement.classList.contains('klavye-acik')") and p.locator('nav.alt-menu').is_visible(), 'klavye kapanınca alt menü geri geldi')

    print('— Etikete dokununca profil')
    k.locator('.bahset-link').click(); p.wait_for_timeout(800)
    ok('@selin' in p.locator('.sayfa.acik').last.inner_text(), 'etiketlenen kişinin profili açıldı')
    ok(not [h for h in o.hatalar if 'pageerror' in h], 'sayfa hatası yok: ' + str(o.hatalar[:2]))
    o.kapat()

    print('— Üye olmayan')
    o = Oturum(pw); o.ctx.add_init_script('window.__mod = {};' + SAHTE)
    p = o.ac(); p.click('text=Başla'); p.wait_for_timeout(900)
    p.click('nav.alt-menu button[data-sekme="kesfet"]'); p.wait_for_timeout(800)
    ok(p.locator('.ka-cubuk').count() == 0 and 'üye' in p.locator('.g-bolum').first.inner_text().lower(), 'üye olmayana Keşfet kilitli, arama yok')
    o.kapat()

    print('— Yönetici: editör seçkisine ekle')
    o, p = oturum(pw, yonetici=True)
    p.locator('#toplulukAlani .g-akis').first.locator('.g-akis-menu').click(); p.wait_for_timeout(500)
    p.click('.sayfa.acik button.satir:has-text("Editör seçkisine ekle")'); p.wait_for_timeout(500)
    y = p.evaluate('window.__yonetim')
    ok(y and y['islem'] == 'secki' and y['secki'] is True and y['id'] == 'a' * 20, 'seçkiye ekleme isteği gitti')
    o.kapat()
    o, p = oturum(pw)
    p.locator('#toplulukAlani .g-akis').first.locator('.g-akis-menu').click(); p.wait_for_timeout(500)
    ok('Editör seçkisine' not in p.locator('.sayfa.acik').last.inner_text(), 'yönetici olmayan seçki seçeneğini görmüyor')
    o.kapat()
ozet()
