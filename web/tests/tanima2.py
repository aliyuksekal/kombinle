import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import *
KOK = os.path.dirname(os.path.abspath(__file__))
SAHTE = open(os.path.join(KOK, 'yz.py')).read().split('SAHTE = r"""')[1].split('"""')[0]
SAHTE = SAHTE.replace("if (yol === '/v1/tani')", """if (yol === '/v1/tani' && window.__mod.taniHata) return yanit(req, {ok: false, durum: 502, veri: {ok: false, hata: 'yz_json'}});
    if (yol === '/v1/tani') return yanit(req, {ok: true, durum: 200, veri: {ok: true, sonuc: {kiyafet: true, kategori: 'ust', tur: 'kazak', alternatifler: ['hirka', 'sweat'], guven: 0.82, renk: 'krem', renk2: '', desenli: false, mevsim: ['s', 'k'], tarz: ['g'], su: false, ad: 'Krem örgü kazak', kumas: 'Yün'}}});
    if (yol === '/v1/tani__eski')""", 1)
with sync_playwright() as pw:
    o = Oturum(pw, hava=met_yanit(taban=14)); o.ctx.add_init_script(SAHTE); p = o.ac()
    p.click('text=Başla'); p.wait_for_timeout(800)
    print('— Yapay zekâ yanıt vermeyince')
    p.evaluate("window.__mod.taniHata = true; window.__api = []")
    p.set_input_files('#dosyaSec', [os.path.join(KOK, 'foto', 'kazak_krem.jpg')]); p.wait_for_selector('.sayfa.acik .buyuk-resim', timeout=20000); p.wait_for_timeout(300)
    ok('tahmin cihazda yapıldı' in p.inner_text('.sayfa.acik .tahmin') and p.locator('.sayfa.acik .tahmin-btn').count() == 1, 'uyarı ve "tekrar tanı" düğmesi')
    tani = [a for a in p.evaluate('window.__api') if a['yol'] == '/v1/tani'][-1]['g']
    ok(len(tani['turler'][0]) == 4 and tani['turler'][0][2] == 'T-shirt' and tani['turler'][0][3] == 'ust', 'tür listesi İngilizce ad ve kategoriyle gidiyor')
    ok(len(tani['resim']) * 0.75 > 20000, 'yapay zekâya ayrıntılı görüntü gidiyor (%d KB)' % (len(tani['resim']) * 0.75 // 1024))
    p.evaluate("window.__mod.taniHata = false")
    p.click('.sayfa.acik .tahmin-btn'); p.wait_for_timeout(800)
    ok('Kazak' in p.inner_text('.sayfa.acik .tahmin') and p.locator('.sayfa.acik .tahmin.uyari').count() == 0, 'tekrar tanıma başarılı')
    ok(p.input_value('.sayfa.acik .ad-girdi') == 'Krem örgü kazak', 'yapay zekâ adı yazıldı')
    ok(p.locator('.sayfa.acik .olasilik .cip').count() == 2 and 'Hırka' in p.inner_text('.sayfa.acik .olasilik'), 'diğer olasılıklar tek dokunuşla seçilebilir')
    o.ekran('b1_tanima_olasilik')
    print('— Düzeltmeden öğrenme')
    p.locator('.sayfa.acik .olasilik .cip', has_text='Hırka').click(); p.wait_for_timeout(200)
    p.locator('.sayfa.acik .alt-bar .btn.ana').click(); p.wait_for_timeout(800)
    ok(p.evaluate("JSON.parse(localStorage.getItem('kb_tanimaDuzeltme') || '[]')") == [['kazak', 'hirka']], 'düzeltme kaydedildi')
    p.evaluate("window.__api = []")
    p.set_input_files('#dosyaSec', [os.path.join(KOK, 'foto', 'kazak_krem.jpg')]); p.wait_for_selector('.sayfa.acik .buyuk-resim', timeout=20000); p.wait_for_timeout(300)
    tani = [a for a in p.evaluate('window.__api') if a['yol'] == '/v1/tani'][-1]['g']
    ok(tani.get('duzeltmeler') == [['kazak', 'hirka']], 'sonraki tanımaya düzeltme ipucu gitti')
    ok(not [h for h in o.hatalar if 'pageerror' in h], 'sayfa hatası yok: ' + str(o.hatalar[:2]))
    o.kapat()
ozet()
