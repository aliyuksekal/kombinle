import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import *
KOK = os.path.dirname(os.path.abspath(__file__))
SAHTE = open(os.path.join(KOK, 'reklam.py')).read().split('SAHTE = open(')[0]
exec(open(os.path.join(KOK, 'reklam.py')).read().split('with sync_playwright()')[0])  # SAHTE ve JPG
SAHTE = SAHTE.replace("if (yol === '/v1/reklamlar')", """if (yol === '/v1/profilgor') return yanit(req, {ok: true, durum: 200, veri: {ok: true, profil: {kod: g.kod, takma: g.kod === '0123456789ab' ? 'Elif' : 'Kişi 1', kadi: g.kod === '0123456789ab' ? 'elif' : 'kisi1', bio: 'Pastel tonlar 💜', av: 0, takipci: 1520, takip: 87, paylasim: 14, takipte: 0, benim: g.kod === '0123456789ab' ? 1 : 0}}});
    if (yol === '/v1/takipler') return yanit(req, {ok: true, durum: 200, veri: {ok: true, liste: [{kod: 'abcdefabcdef', takma: 'Melis', kadi: 'melis', av: 0, takipte: 1, benim: 0}]}});
    if (yol === '/v1/bildirim') return yanit(req, {ok: true, durum: 200, veri: g.sadeceSay ? {ok: true, okunmamis: window.__okunmamis} : (window.__okunmamis = 0, {ok: true, okunmamis: 3, liste: [
      {id: 1, tur: 'begeni', kod: 'abcdefabcdef', takma: 'Melis', kadi: 'melis', av: 0, paylasim: 'a'.repeat(20), metin: '', zaman: Date.now() - 60000, yeni: 1, takipte: 1},
      {id: 2, tur: 'yorum', kod: '1123456789ab', takma: 'Kişi 1', kadi: 'kisi1', av: 0, paylasim: 'a'.repeat(20), metin: 'Bayıldım!', zaman: Date.now() - 3600000, yeni: 1, takipte: 0},
      {id: 3, tur: 'takip', kod: 'ffffffffffff', takma: 'Ece', kadi: 'ece', av: 0, paylasim: '', metin: '', zaman: Date.now() - 86400000 * 9, yeni: 0, takipte: 0}]})});
    if (yol === '/v1/kaydet') return yanit(req, {ok: true, durum: 200, veri: {ok: true, kayitli: g.kaydet !== false}});
    if (yol === '/v1/duzenle') return yanit(req, {ok: true, durum: 200, veri: {ok: true, aciklama: g.aciklama}});
    if (yol === '/v1/ksikayet') return yanit(req, {ok: true, durum: 200, veri: {ok: true}});
    if (yol === '/v1/takip') return yanit(req, {ok: true, durum: 200, veri: {ok: true, takipte: g.takip !== false, takipci: 1}});
    if (yol === '/v1/reklamlar')""")
SAHTE = SAHTE.replace("aciklama: 'Kombin ' + i,", "aciklama: i === 1 ? 'Ofis günü #sonbahar' : 'Kombin ' + i, benim: i === 2,").replace("zaman: Date.now() - i * 60000, benim: false,", "zaman: Date.now() - i * 60000,")
SAHTE = "window.__okunmamis = 3;\n" + SAHTE
with sync_playwright() as pw:
    o = Oturum(pw, hava=met_yanit(taban=14)); o.ctx.add_init_script(SAHTE)
    o.ctx.route('https://kombinle-api.ornek.workers.dev/**', lambda r: r.fulfill(status=200, body=JPG, headers={'Content-Type': 'image/jpeg'}))
    p = o.ac()
    p.click('text=Örnek dolapla dene'); p.wait_for_timeout(2200)
    print('— Bildirimler')
    ok(p.locator('.g-zil:not(.g-dm) .zil-rozet').inner_text() == '3', 'zilde okunmamış sayısı')
    p.click('.g-zil:not(.g-dm)'); p.wait_for_timeout(600)
    txt = p.inner_text('.sayfa.acik')
    ok('kombinini beğendi' in txt and 'Bayıldım!' in txt and 'seni takip etmeye başladı' in txt, 'beğeni, yorum, takip bildirimleri')
    ok('bu hafta' in txt.lower() and 'daha önce' in txt.lower(), 'zamana göre gruplandı')
    ok(p.locator('.g-zil:not(.g-dm) .zil-rozet').count() == 0, 'açınca rozet sıfırlandı')
    o.ekran('a1_bildirim')
    p.click('.sayfa.acik button[aria-label="Kapat"]'); p.wait_for_timeout(400)
    print('— Kendi profilim')
    p.click('.g-hesap'); p.wait_for_timeout(800)
    txt = p.inner_text('.sayfa.acik')
    ok('Pastel' in txt and p.locator('.sayfa.acik .pr-sayi').count() == 0, 'profilde hakkımda var, sayı satırı yok: ' + txt[:80].replace('\n', ' '))
    ok(p.locator('.sayfa.acik .pr-hucre').count() >= 3, 'paylaşım ızgarası')
    ok(p.locator('.sayfa.acik .pr-sekmeler button').count() == 4 and 'Kaydedilenler' in p.inner_text('.sayfa.acik .pr-sekmeler'), 'kendi profilimde takipçi, takip ve Kaydedilenler sekmeleri')
    o.ekran('a2_profil')
    p.click('.sayfa.acik .pr-sekmeler button:has-text("Takipçiler")'); p.wait_for_timeout(600)
    son = p.locator('.sayfa.acik').last.inner_text(); ok('Melis' in son and '@melis' in son, 'takipçi listesi (profilin içinde)')
    p.click('.sayfa.acik button[aria-label="Kapat"]'); p.wait_for_timeout(400)
    print('— Akış: kaydet, çift dokunuş, etiket, düzenleme, başkasının profili')
    p.click('nav.alt-menu button[data-sekme="kesfet"]'); p.wait_for_timeout(1500)
    k = p.locator('.g-akis:not(.g-reklam)').first
    k.locator('.g-kaydet').click(); p.wait_for_timeout(300)
    ok(k.locator('.g-kaydet[aria-pressed="true"]').count() == 1 and [a for a in p.evaluate('window.__api') if a['yol'] == '/v1/kaydet'][-1]['g']['kaydet'] is True, 'paylaşım kaydedildi')
    k.locator('img.g-akis-resim').dblclick(); p.wait_for_timeout(250)
    ok(k.locator('.kalp-patla').count() == 1, 'çift dokunuşta kalp')
    p.wait_for_timeout(400)
    oy = [a for a in p.evaluate('window.__api') if a['yol'] == '/v1/oy']
    ok(oy and oy[-1]['g']['oy'] == 1, 'çift dokunuş beğendi')
    ok(p.locator('.goruntuleyici').count() == 0, 'çift dokunuşta görüntüleyici açılmadı')
    p.locator('.g-akis:not(.g-reklam)').nth(1).locator('.etiket-link:has-text("#sonbahar")').click(); p.wait_for_timeout(600)
    ok('#sonbahar' in p.locator('.sayfa.acik .baslik').last.inner_text() and [a for a in p.evaluate('window.__api') if a['yol'] == '/v1/akis'][-1]['g'].get('etiket') == 'sonbahar', 'etiket akışı açıldı')
    p.click('.sayfa.acik button[aria-label="Kapat"]'); p.wait_for_timeout(400)
    benim = p.locator('.g-akis:not(.g-reklam)').nth(2)
    benim.locator('.g-akis-menu').click(); p.wait_for_timeout(400)
    p.click('.sayfa.acik button.satir:has-text("Açıklamayı düzenle")'); p.wait_for_timeout(500)
    p.fill('.sayfa.acik textarea', 'Yeni açıklama #kis'); p.click('.sayfa.acik .alt-bar .btn.ana'); p.wait_for_timeout(500)
    ok('Yeni açıklama' in benim.inner_text() and benim.locator('.etiket-link:has-text("#kis")').count() == 1, 'açıklama düzenlendi, etiket dokunulabilir')
    p.locator('.g-akis:not(.g-reklam)').nth(1).locator('.g-akis-kim').click(); p.wait_for_timeout(800)
    ok('@kisi1' in p.inner_text('.sayfa.acik') and p.locator('.sayfa.acik .g-takip.buyuk').count() == 1, 'başkasının profili, takip düğmesi')
    p.click('.sayfa.acik .pr-dugmeler .ikon-kare'); p.wait_for_timeout(400)
    p.click('.sayfa.acik button.satir:has-text("Profili şikâyet et")'); p.wait_for_timeout(600)
    p.click('.sayfa.acik button.satir:has-text("Sahte hesap")'); p.wait_for_timeout(500)
    ok([a for a in p.evaluate('window.__api') if a['yol'] == '/v1/ksikayet'][-1]['g']['neden'] == 'sahte', 'profil şikâyeti gönderildi')
    print('— Reklam sıklığı')
    p.evaluate("document.querySelectorAll('.sayfa.acik button[aria-label=\"Kapat\"]').forEach(b => b.click())"); p.wait_for_timeout(600)
    dizi = p.evaluate("[...document.querySelectorAll('#toplulukAlani > .g-akis')].map(e => e.classList.contains('g-reklam') ? 'R' : 'P').join('')")
    araliklar = [len(x) for x in dizi.split('R')[:-1]]
    ok(dizi.count('R') >= 1 and all(n >= 5 for n in araliklar), 'en az 5 paylaşımda bir reklam: ' + dizi)
    ok(not [h for h in o.hatalar if 'pageerror' in h], 'sayfa hatası yok: ' + str(o.hatalar[:2]))
    o.kapat()
ozet()
