import sys, os, json; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import *
# Takip isteği, WhatsApp tarzı mesajlaşma (tik, yanıt, tepki, silme, yazıyor), kıyafet değilse 🫪
KOK = os.path.dirname(os.path.abspath(__file__))
SAHTE = open(os.path.join(KOK, 'mesaj.py')).read().split('SAHTE = r"""')[1].split('"""')[0]
EK = r"""
    if (yol === '/v1/takip') { window.__takip = g; return tamam({durum: g.takip === false ? 'yok' : (window.__mod.acikHesap ? 'takip' : 'istek'), takipci: 3}); }
    if (yol === '/v1/bildirim' && !g.sadeceSay) return tamam({okunmamis: 0, liste: [{id: 'b1', tur: 'kabul', kod: 'eeeeeeeeeeee', takma: 'Ayşe', kadi: 'ayse', av: 0, paylasim: '', metin: '', zaman: Date.now() - 3600000, yeni: 1, takipte: 0, istekte: 1}]});
    if (yol === '/v1/istekler') return tamam({liste: window.__istekler || []});
    if (yol === '/v1/istekyanit') { window.__yanit = g; window.__istekler = (window.__istekler || []).filter(k => k.kod !== g.kod); return tamam({kabul: !!g.kabul}); }
    if (yol === '/v1/gizlilik') { if (typeof g.acik === 'boolean') window.__acik = g.acik; return tamam({acik: !!window.__acik, istek: (window.__istekler || []).length}); }
    if (yol === '/v1/dmtepki') { const m = window.__mesajlar.find(x => x.id === g.id); m.tepki = {ben: m.tepki && m.tepki.ben === g.tepki ? '' : g.tepki, o: ''}; return tamam({tepki: JSON.parse(JSON.stringify(m.tepki))}); }
    if (yol === '/v1/dmmsil') { const m = window.__mesajlar.find(x => x.id === g.id); m.silindi = 1; m.metin = ''; return tamam({}); }
    if (yol === '/v1/dmyaziyor') { window.__yaziyorPing = (window.__yaziyorPing || 0) + 1; return tamam({}); }
    if (yol === '/v1/dmoku') return tamam({durum: window.__durum, kisi: KISI, engelledim: false, yaziyor: !!window.__mod.yaziyor, mesajlar: JSON.parse(JSON.stringify(window.__mesajlar))});
    if (yol === '/v1/dmyaz') {
      const y = g.yanit ? window.__mesajlar.find(x => x.id === g.yanit) : null;
      const m = {id: 'n' + String(window.__mesajlar.length).padStart(19, '0'), ben: true, metin: g.metin, zaman: Date.now(), okundu: 0, teslim: 0, silindi: 0, tepki: {ben: '', o: ''}, yanit: y ? {id: y.id, metin: y.metin, ben: !!y.ben} : null};
      window.__mesajlar.push(m); window.__dmyaz = g; return tamam({mesaj: JSON.parse(JSON.stringify(m)), durum: 'acik'});
    }
    if (yol === '/v1/tani') return tamam({sonuc: {kiyafet: false, kategori: 'yok', tur: 'tisort', alternatifler: [], guven: 0.2, renk: 'siyah', renk2: '', desenli: false, mevsim: [], tarz: [], su: false, ad: ''}});
    if (yol === '/v1/profilgor') return tamam({profil: {kod: g.kod, takma: g.kod === 'bbbbbbbbbbbb' ? 'Zeynep' : 'Elif', kadi: 'zeynep', bio: '', av: 0, takipci: 3, takip: 2, paylasim: 0, takipte: 0, istekte: 0, benim: g.kod === '0123456789ab' ? 1 : 0, acik: 0, istek: g.kod === '0123456789ab' ? (window.__istekler || []).length : 0}});
    if (yol === '/v1/ben')"""
SAHTE = SAHTE.replace("\n    if (yol === '/v1/ben')", EK, 1)
SAHTE = SAHTE.replace("window.__mesajlar = [{id: 'm'.repeat(20), ben: false, metin: 'Merhaba! Ceketin nereden?', zaman: Date.now() - 600000, okundu: 1}];",
  "window.__mesajlar = [{id: 'm'.repeat(20), ben: false, metin: 'Merhaba! Ceketin nereden?', zaman: Date.now() - 90000000, okundu: 1, teslim: 1, tepki: {ben: '', o: ''}}, "
  "{id: 'k'.repeat(20), ben: true, metin: 'Zara, geçen sezon', zaman: Date.now() - 600000, okundu: 1, teslim: 1, tepki: {ben: '', o: '❤️'}}, "
  "{id: 'j'.repeat(20), ben: true, metin: 'Sen de bakabilirsin', zaman: Date.now() - 500000, okundu: 0, teslim: 1, tepki: {ben: '', o: ''}}, "
  "{id: 'i'.repeat(20), ben: true, metin: 'Görüldü mü?', zaman: Date.now() - 400000, okundu: 0, teslim: 0, tepki: {ben: '', o: ''}}];")
HESAP = "localStorage.setItem('kb_hesap', JSON.stringify(%s)); window.__ben = %s;"
ELIF = {'ad': 'Elif', 'eposta': 'elif@ornek.com', 'kod': '0123456789ab', 'kadi': 'elif', 'yonetici': False, 'av': 0, 'pro': 0}


def oturum(pw, mod=None, istekler=None):
    o = Oturum(pw)
    o.ctx.add_init_script(('window.__mod = %s; window.__istekler = %s;' % (json.dumps(mod or {}), json.dumps(istekler or []))) + HESAP % (json.dumps(ELIF), json.dumps(ELIF)) + SAHTE)
    p = o.ac(); p.click('text=Başla'); p.wait_for_timeout(900)
    return o, p


def son(p):
    return p.locator('.sayfa.acik').last


with sync_playwright() as pw:
    print('— Takip istekleri')
    o, p = oturum(pw, istekler=[{'kod': 'cccccccccccc', 'takma': 'Selin', 'kadi': 'selin', 'av': 0, 'zaman': 1, 'takipte': 0}, {'kod': 'dddddddddddd', 'takma': 'Merve', 'kadi': 'merve', 'av': 0, 'zaman': 1, 'takipte': 1}])
    p.click('.g-zil:not(.g-dm)'); p.wait_for_timeout(1000)
    ok(son(p).locator('.bn-istekler').count() == 1 and 'Selin ve 1 kişi daha' in son(p).inner_text(), 'bildirimlerin üstünde takip istekleri satırı')
    ok('takip isteğini kabul etti' in son(p).inner_text(), 'takip isteği kabul bildirimi')
    son(p).locator('.bn-istekler').click(); p.wait_for_timeout(900)
    s = son(p)
    ok(s.locator('.ik-onay').count() == 2 and s.locator('.ik-sil').count() == 2, 'her istekte Onayla / Sil')
    o.ekran('i1_istekler')
    s.locator('.tk-satir', has_text='Selin').locator('.ik-onay').click(); p.wait_for_timeout(700)
    ok(p.evaluate('window.__yanit') == {'kod': 'cccccccccccc', 'kabul': True}, 'istek onaylandı')
    ok(s.locator('.tk-satir', has_text='Selin').locator('.g-takip').inner_text() == 'Takip et', 'onaydan sonra "Takip et" (geri takip) düğmesi')
    s.locator('.tk-satir', has_text='Selin').locator('.g-takip').click(); p.wait_for_timeout(700)
    ok(s.locator('.tk-satir', has_text='Selin').locator('.g-takip').inner_text() == 'İstek gönderildi' and 'gönderildi' in p.inner_text('#tost'), 'takip et → "İstek gönderildi"')
    ok(p.evaluate('window.__takip') == {'kod': 'cccccccccccc', 'takip': True}, 'takip isteği sunucuya gitti')
    s.locator('.tk-satir', has_text='Selin').locator('.g-takip').click(); p.wait_for_timeout(700)
    ok(s.locator('.tk-satir', has_text='Selin').locator('.g-takip').inner_text() == 'Takip et' and 'geri çekildi' in p.inner_text('#tost'), 'tekrar dokununca istek geri çekildi')
    s.locator('.tk-satir', has_text='Merve').locator('.ik-sil').click(); p.wait_for_timeout(700)
    ok(s.locator('.tk-satir', has_text='Merve').count() == 0, 'silinen istek listeden kalktı')
    s.locator('.bas :is([aria-label="Kapat"],[aria-label="Geri"])').last.click(); p.wait_for_timeout(500)
    while p.locator('.sayfa.acik').count():
        son(p).locator('.bas :is([aria-label="Kapat"],[aria-label="Geri"])').last.click(); p.wait_for_timeout(400)
    print('— Profil düzenle: takip isteklerini onayla ayarı')
    p.click('.g-hesap'); p.wait_for_timeout(900)
    son(p).locator('button', has_text='Profili düzenle').click(); p.wait_for_timeout(900)
    sw = son(p).locator('[role=switch]', has_text='Takip isteklerini onayla')
    ok(sw.count() == 1 and sw.get_attribute('aria-checked') == 'true', 'varsayılan: takip istekleri onay bekler')
    sw.click(); p.wait_for_timeout(600)
    ok(p.evaluate('window.__acik') is True, 'kapatınca hesap herkese açık oldu')
    o.kapat()

    print('— WhatsApp tarzı mesajlaşma')
    o, p = oturum(pw, mod={'yaziyor': True})
    p.click('.g-dm'); p.wait_for_timeout(900)
    son(p).locator('.tk-satir', has_text='Zeynep').locator('.tk-ac').click(); p.wait_for_timeout(1200)
    sh = son(p)
    ok(sh.locator('.dm-gun').count() >= 2 and 'Bugün' in sh.inner_text(), 'gün ayraçları (Bugün / tarih)')
    ok(sh.locator('.dm-tik.okundu').count() == 1 and sh.locator('.dm-tik').count() == 3, 'okundu / ulaştı / gönderildi tikleri')
    ok(sh.locator('.dm-tik svg path').count() >= 5, 'çift tik ve tek tik çizildi')
    ok('❤️' in sh.locator('.dm-tepki').first.inner_text(), 'karşı tarafın tepkisi görünüyor')
    ok(sh.locator('.dm-yaziyor').count() == 1 and sh.locator('.dm-yaziyor-balon').count() == 1, '"yazıyor…" göstergesi')
    o.ekran('i2_sohbet')
    sh.locator('.dm-balon', has_text='Ceketin nereden').dispatch_event('contextmenu'); p.wait_for_timeout(500)
    e = son(p)
    ok(e.locator('.dm-tepki-sec button').count() == 6 and 'Yanıtla' in e.inner_text() and 'Şikâyet' in e.inner_text(), 'uzun basınca tepki, yanıtla, şikâyet')
    e.locator('.dm-tepki-sec button').first.click(); p.wait_for_timeout(700)
    p.wait_for_timeout(300)
    ok('❤️' in sh.locator('.dm-balon', has_text='Ceketin nereden').inner_text(), 'tepki eklendi: ' + repr(sh.locator('.dm-balon', has_text='Ceketin nereden').inner_text()) + ' ' + str(p.evaluate("window.__api.filter(a => a.yol === '/v1/dmtepki').map(a => a.g)")))
    sh.locator('.dm-balon', has_text='Ceketin nereden').dispatch_event('contextmenu'); p.wait_for_timeout(500)
    son(p).locator('.satir', has_text='Yanıtla').click(); p.wait_for_timeout(600)
    ok(not sh.locator('.dm-yanit-cubuk').is_hidden() and 'Ceketin nereden' in sh.locator('.dm-yanit-cubuk').inner_text(), 'yanıt çubuğu açıldı')
    sh.locator('.dm-girdi').fill('Zara’dan'); p.wait_for_timeout(300)
    ok(p.evaluate('window.__yaziyorPing || 0') >= 1, 'yazarken "yazıyor" bildirildi')
    sh.locator('.dm-gonder').click(); p.wait_for_timeout(800)
    ok(p.evaluate('window.__dmyaz.yanit') == 'm' * 20, 'yanıt hangi mesaja olduğu ile gitti')
    ok(sh.locator('.dm-balon.ben .dm-alinti', has_text='Ceketin nereden').count() == 1 and sh.locator('.dm-yanit-cubuk').is_hidden(), 'gönderilen mesajda alıntı, çubuk kapandı')
    sh.locator('.dm-balon.ben', has_text='Zara’dan').dispatch_event('contextmenu'); p.wait_for_timeout(500)
    son(p).locator('.satir', has_text='Herkesten sil').click(); p.wait_for_timeout(500)
    p.locator('.pencere.acik .btn', has_text='Sil').click(); p.wait_for_timeout(800)
    ok(sh.locator('.dm-metin.silindi').count() == 1 and 'Bu mesajı sildin' in sh.inner_text(), 'herkesten silindi ' + str(p.evaluate("window.__api.filter(a => a.yol === '/v1/dmmsil').length")) + ' ' + p.inner_text('#tost'))
    o.ekran('i3_sohbet_islem')
    o.kapat()

    print('— Kıyafet değilse 🫪')
    o, p = oturum(pw)
    p.set_input_files('#dosyaSec', [os.path.join(KOK, 'foto', 'kazak_krem.jpg')])
    p.wait_for_selector('.emoji-tepki', timeout=20000)
    ok(p.locator('.emoji-tepki span').inner_text() in ('🫪', '🫨', '😵‍💫', '😵'), 'ekrana şaşkın yüz geldi: ' + p.locator('.emoji-tepki span').inner_text())
    o.ekran('i4_kiyafet_degil')
    p.wait_for_timeout(2600)
    ok(p.locator('.emoji-tepki').count() == 0 and p.locator('.sayfa.acik .emoji-rozet').count() == 1, 'tepki kayboldu, resmin köşesinde küçük emoji kaldı')
    ok('kıyafet göremedim' in p.inner_text('.sayfa.acik .tahmin'), 'açıklama mesajı')
    ok(not [h for h in o.hatalar if 'pageerror' in h], 'sayfa hatası yok: ' + str(o.hatalar[:2]))
    o.kapat()
ozet()
