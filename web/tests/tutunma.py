import sys, os, json; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import *
# Başlangıç görevleri, geri bildirim, Play puanı, hata raporları ve yönetici görünümleri
KOK = os.path.dirname(os.path.abspath(__file__))
F = lambda ad: os.path.join(KOK, 'foto', ad)
src = open(os.path.join(KOK, 'ozellikler.py'), encoding='utf-8').read()
SAHTE = src[src.index('SAHTE = r"""') + 12: src.index('};"""') + 2]
SAHTE = SAHTE.replace("    if (yol === '/v1/anketler') return tamam({devam: false, liste: window.__anket});", """    if (yol === '/v1/anketler') return tamam({devam: false, liste: window.__anket});
    if (yol === '/v1/geribildir') { window.__gb.push(g); return tamam({}); }
    if (yol === '/v1/hata') { window.__hata.push(g); return tamam({}); }
    if (yol === '/v1/merhaba') return tamam({});
    if (yol === '/v1/gbliste') return tamam({toplam: 12, ortalama: 4.3, liste: [{id: 3, zaman: Date.now(), kim: 'Elif @elif', eposta: 'elif@ornek.com', metin: 'Sabah bildirimi çok iyi', puan: 5, surum: '1.0.38', dil: 'tr', ekran: 'ayarlar'}]});
    if (yol === '/v1/hataliste') return tamam({liste: [{mesaj: 'TypeError: x is null', yer: 'kombinIste kombinle.html:120:5', surum: '1.0.38', sayi: 7, ilk: Date.now(), son: Date.now()}]});""")
SAHTE = SAHTE.replace("window.KombinleNative = {", """window.__gb = []; window.__hata = []; window.__puan = 0;
window.KombinleNative = {
  puanIste: req => { window.__puan++; yanit(req, {ok: true, bitti: true}); }, sabahAyarla: () => {}, widgetEklenebilir: () => true, widgetVar: () => false, widgetEkle: () => {},
  metinPaylas: () => {}, bildirimDurum: () => true, bildirimIzni: () => {},""", 1)
exec(src[src.index('def ekle('):src.index('def kapat(')])

with sync_playwright() as pw:
    o = Oturum(pw, hava=met_yanit(taban=15)); o.ctx.add_init_script(SAHTE); p = o.ac()
    p.click('text=Başla'); p.wait_for_timeout(900)
    print('— başlangıç görevleri')
    k = p.locator('.bg-kart')
    ok(k.count() == 1 and '1 / 6' in k.inner_text() and '10 jeton' in k.inner_text(), 'Bugün ekranında başlangıç görevleri (6 görev, ödül yazıyor)')
    o.ekran('u1_baslangic')
    for f, tn in [('tisort_kirmizi.jpg', {'kategori': 'ust', 'tur': 'bluz', 'renk': 'kirmizi'}), ('pantolon_lacivert.jpg', {'kategori': 'alt', 'tur': 'kumas', 'renk': 'lacivert'}), ('ayakkabi_siyah.jpg', {'kategori': 'ayk', 'tur': 'babet', 'renk': 'siyah'})]:
        ekle(p, f, tn)
    p.click('nav.alt-menu button[data-sekme="bugun"]'); p.wait_for_timeout(500)
    ok(p.locator('.bg-gorev.tamam').count() == 2, '3 kıyafet eklenince ve sabah bildirimi açıkken 2 görev tamam')
    j0 = p.evaluate("+localStorage.getItem('kb_jeton')")
    p.evaluate("""() => { localStorage.setItem('kb_davetEtti', 'true'); localStorage.setItem('kb_kombinSay', '1');
      const g = JSON.parse(localStorage.getItem('kb_gecmis') || '[]'); g.push({id: 'k' + Date.now().toString(36), p: [], fav: true, zaman: Date.now()}); localStorage.setItem('kb_gecmis', JSON.stringify(g)); }""")
    p.evaluate("window.KombinleNative.widgetVar = () => true")
    p.click('nav.alt-menu button[data-sekme="dolap"]'); p.wait_for_timeout(300); p.click('nav.alt-menu button[data-sekme="bugun"]'); p.wait_for_timeout(600)
    ok(p.locator('.bg-kart').count() == 0 and p.evaluate("+localStorage.getItem('kb_jeton')") == j0 + 10, 'hepsi bitince kart kalktı, 10 jeton verildi')
    print('— geri bildirim ve puan')
    p.click('nav.alt-menu button[data-sekme="ayarlar"]'); p.wait_for_timeout(500)
    p.evaluate("document.querySelectorAll('.ayar-kart').forEach(d => d.open = true)"); p.wait_for_timeout(200)
    p.locator('.ayar-sekme button.satir:has-text("Görüş ve öneri gönder")').click(); p.wait_for_timeout(500)
    sy = p.locator('.sayfa.acik').last
    sy.locator('.alt-bar .btn.ana').click(); p.wait_for_timeout(300)
    ok('puan seç' in p.inner_text('#tost'), 'boş gönderilemez')
    sy.locator('.gb-yildiz button').nth(4).click()
    sy.locator('textarea').fill('Sabah bildirimi çok iyi, bir de takvim olsa')
    o.ekran('u2_geri_bildirim')
    sy.locator('.alt-bar .btn.ana').click(); p.wait_for_timeout(2500)
    gb = p.evaluate('window.__gb[0]')
    ok(gb and gb['puan'] == 5 and gb['metin'].startswith('Sabah') and gb['ekran'] == 'ayarlar' and gb['dil'] == 'tr', 'geri bildirim gitti (puan, mesaj, ekran)')
    ok(p.evaluate('window.__puan') == 1, '5 yıldızdan sonra Play puanlama penceresi istendi')
    print('— hata raporu')
    p.evaluate("setTimeout(() => { null.x(); }, 0)"); p.wait_for_timeout(16500)
    hr = p.evaluate('window.__hata')
    ok(len(hr) == 1 and 'TypeError' in hr[0]['liste'][0]['m'] and hr[0]['surum'], 'sayfa hatası özetlenip gönderildi: ' + (hr[0]['liste'][0]['m'] if hr else ''))
    print('— puan sıklığı')
    p.evaluate("localStorage.setItem('kb_ilkAcilis', String(Date.now() - 5 * 86400000)); localStorage.removeItem('kb_puan')")
    ok(p.evaluate("(() => { const d = JSON.parse(localStorage.getItem('kb_puan') || '{}'); return !d.son; })()"), 'puan kaydı temiz')
    o.kapat()

    print('— @admin')
    o = Oturum(pw, hava=met_yanit(taban=15)); o.ctx.add_init_script(SAHTE); p = o.ac()
    p.click('text=Başla'); p.wait_for_timeout(1500)
    p.evaluate("""() => { const h = JSON.parse(localStorage.getItem('kb_hesap')); h.kadi = 'admin'; h.yonetici = true; localStorage.setItem('kb_hesap', JSON.stringify(h)); }""")
    p.click('nav.alt-menu button[data-sekme="ayarlar"]'); p.wait_for_timeout(500)
    p.evaluate("document.querySelectorAll('.ayar-kart').forEach(d => d.open = true)"); p.wait_for_timeout(200)
    yp = p.locator('.ayar-sekme button.satir:has-text("Yönetici")')
    yp.first.click() if yp.count() else p.locator('button:has-text("Yönetici paneli")').first.click()
    p.wait_for_timeout(600)
    p.locator('.sayfa.acik button.satir:has-text("Geri bildirimleri oku")').click(); p.wait_for_timeout(900)
    t_ = p.locator('.sayfa.acik').last.inner_text()
    ok('★ 4.3' in t_ and 'Sabah bildirimi çok iyi' in t_ and 'elif@ornek.com' in t_, 'geri bildirimler ve ortalama puan')
    p.go_back(); p.wait_for_timeout(500)
    p.locator('.sayfa.acik button.satir:has-text("Uygulama hatalarını gör")').click(); p.wait_for_timeout(900)
    ok('TypeError: x is null' in p.locator('.sayfa.acik').last.inner_text() and '7 kez' in p.locator('.sayfa.acik').last.inner_text(), 'hata listesi')
    print([h for h in o.hatalar if 'pageerror' in h])
    o.kapat()
ozet()
