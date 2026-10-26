import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import *
SAHTE = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'yz.py')).read().split('SAHTE = r"""')[1].split('"""')[0]
SAHTE = SAHTE.replace("if (yol === '/v1/akis')", """if (yol === '/v1/kadi') { const k = g.kadi.replace(/^@/, ''); return yanit(req, {ok: true, durum: 200, veri: {ok: true, kadi: k, durum: k === 'zeynep' ? 'alinmis' : ['admin','user'].includes(k) ? 'ayrilmis' : 'bos'}}); }
    if (yol === '/v1/profil') {
      if (g.kadi === 'admin' && g.yoneticiKodu !== 'ABCD-EFGH-JKLM-NPQR') return yanit(req, {ok: true, durum: 403, veri: {ok: false, hata: 'ayrilmis'}});
      const h = {ad: g.ad, eposta: 'elif@ornek.com', kod: '0123456789ab', kadi: g.kadi, bio: g.bio, yonetici: g.kadi === 'admin'};
      return yanit(req, {ok: true, durum: 200, veri: {ok: true, hesap: h}});
    }
    if (yol === '/v1/profilgor') return yanit(req, {ok: true, durum: 200, veri: {ok: true, profil: {kod: g.kod, takma: 'Zeynep', kadi: 'user', bio: 'Vintage aşığı', av: 0, takipci: 12, takip: 3, paylasim: 4, takipte: 0, benim: 0}}});
    if (yol === '/v1/ata') return yanit(req, {ok: true, durum: 200, veri: {ok: true, ad: g.ad, sahip: g.geriAl ? '' : 'Zeynep'}});
    if (yol === '/v1/kisiler') return yanit(req, {ok: true, durum: 200, veri: {ok: true, takipEdilen: 0, liste: [{kod: '0123456789ab', takma: 'Zeynep', kadi: 'user', bio: 'Vintage aşığı', takipci: 12, paylasim: 4, takipte: 0}]}});
    if (yol === '/v1/akis')""")
with sync_playwright() as pw:
    o = Oturum(pw, hava=met_yanit(taban=14)); o.ctx.add_init_script(SAHTE); p = o.ac()
    p.click('text=Örnek dolapla dene'); p.wait_for_timeout(1000)
    print('— Profil düzenleme')
    p.click('nav.alt-menu button[data-sekme="ayarlar"]'); p.wait_for_timeout(400)
    p.evaluate("document.querySelector('.ayar-kart[data-kart=hesap]').open = true"); p.wait_for_timeout(200)
    ok('Kullanıcı adı seçilmedi' in p.inner_text('.hesap-bolum'), 'kullanıcı adı yoksa belirtiliyor')
    p.click('.profil-duzenle-btn'); p.wait_for_timeout(500)
    S = '.sayfa.acik '
    p.fill(S + '.kadi-girdi', 'Zeynep'); p.wait_for_timeout(700)
    ok('alınmış' in p.inner_text(S + '.kadi-durum'), 'alınmış kullanıcı adı uyarısı')
    p.fill(S + '.kadi-girdi', '1abc'); p.wait_for_timeout(200)
    ok('3–20' in p.inner_text(S + '.kadi-durum'), 'geçersiz ad kuralı gösterildi')
    p.fill(S + '.kadi-girdi', 'user'); p.wait_for_timeout(700)
    ok('ayrılmış' in p.inner_text(S + '.kadi-durum') and p.locator(S + '.hesap-alan.gizli').count() == 1, '@user ayrılmış, yönetici kodu alanı gizli')
    p.fill(S + '.kadi-girdi', 'Elif.Şık'); p.wait_for_timeout(700)
    ok(p.input_value(S + '.kadi-girdi') == 'elif.sik' and 'uygun' in p.inner_text(S + '.kadi-durum'), 'Türkçe harf çevrildi, ad uygun')
    p.fill(S + 'textarea', 'Minimal ve pastel tonlar 💜')
    o.ekran('95_profil', tam=True)
    p.click(S + '.alt-bar .btn.ana'); p.wait_for_timeout(600)
    pr = [a for a in p.evaluate('window.__api') if a['yol'] == '/v1/profil'][-1]['g']
    ok(pr['kadi'] == 'elif.sik' and pr['bio'].startswith('Minimal'), 'profil sunucuya gitti')
    ok('@elif.sik' in p.inner_text('.hesap-bolum') and 'pastel' in p.inner_text('.hesap-bolum'), 'ayarlarda kullanıcı adı ve hakkımda')
    ok(p.locator('.yonetici-btn').count() == 0, 'yönetici değilse panel yok')
    print('— @admin (uygulama sahibi)')
    p.click('.profil-duzenle-btn'); p.wait_for_timeout(500)
    p.fill(S + '.kadi-girdi', 'admin'); p.wait_for_timeout(700)
    ok(p.locator(S + '.hesap-alan.gizli').count() == 0, '@admin yazınca yönetici kodu istendi')
    p.click(S + '.alt-bar .btn.ana'); p.wait_for_timeout(300)
    ok('kodunu gir' in p.inner_text('#tost'), 'kod olmadan @admin alınamıyor')
    p.fill(S + 'input[type=password]', 'YANL-ISKO-DUUU-1234'); p.click(S + '.alt-bar .btn.ana'); p.wait_for_timeout(600)
    ok('ayrılmış' in p.inner_text('#tost'), 'yanlış kod reddedildi')
    p.fill(S + 'input[type=password]', 'ABCD-EFGH-JKLM-NPQR'); p.click(S + '.alt-bar .btn.ana'); p.wait_for_timeout(600)
    ok('@admin' in p.inner_text('.hesap-bolum') and p.locator('.hesap-bolum .resmi-rozet').count() == 1, '@admin alındı, resmî rozet')
    p.click('.yonetici-btn'); p.wait_for_timeout(500)
    o.ekran('96_yonetici')
    p.fill(S + 'input.metin', '@zeynep'); p.click(S + 'button:has-text("Adı ver")'); p.wait_for_timeout(400)
    p.click('.sayfa.acik .alt-bar .btn.tehlike'); p.wait_for_timeout(600)
    at = [a for a in p.evaluate('window.__api') if a['yol'] == '/v1/ata'][-1]['g']
    ok(at == {'ad': 'user', 'hedef': 'zeynep'} or (at.get('ad') == 'user' and at.get('hedef') == 'zeynep'), '@user Zeynep\'e verildi')
    ok('Zeynep' in p.inner_text('#tost'), 'atama bildirildi')
    p.click(S + 'button:has-text("Geri al")'); p.wait_for_timeout(400); p.click('.sayfa.acik .alt-bar .btn.tehlike'); p.wait_for_timeout(600)
    ok([a for a in p.evaluate('window.__api') if a['yol'] == '/v1/ata'][-1]['g'].get('geriAl') is True, 'geri alındı')
    p.click('.sayfa.acik :is(button[aria-label="Kapat"],button[aria-label="Geri"])'); p.wait_for_timeout(400)
    print('— Keşfet')
    p.click('nav.alt-menu button[data-sekme="kesfet"]'); p.wait_for_timeout(1200)
    ok(p.locator('.g-kisiler').count() == 0, 'keşfette kişi listesi yok (kaldırıldı)')
    ok(not [h for h in o.hatalar if 'pageerror' in h], 'sayfa hatası yok: ' + str(o.hatalar[:2]))
    o.kapat()
ozet()
