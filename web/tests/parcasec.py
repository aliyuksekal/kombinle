import sys, os, json, datetime; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import *
# Boydan fotoğraftan parça seçme + AI Prenses selamlaşma ve doğal ses
KOK = os.path.dirname(os.path.abspath(__file__))
SAHTE = open(os.path.join(KOK, 'yz.py')).read().split('SAHTE = r"""')[1].split('"""')[0]
SAHTE = SAHTE.replace("if (yol === '/v1/tani')", r"""if (yol === '/v1/tani' && g.hedef) return yanit(req, {ok: true, durum: 200, veri: {ok: true, sonuc: {kiyafet: true, tur: 'corap', alternatifler: [], guven: 0.9, renk: 'beyaz', renk2: '', desenli: false, mevsim: [], tarz: ['g'], su: false, ad: 'Beyaz çorap', kutu: [880, 300, 990, 700]}}});
    if (yol === '/v1/tani' && g.tek) return yanit(req, {ok: true, durum: 200, veri: {ok: true, sonuc: {kiyafet: true, tur: 'bere', alternatifler: [], guven: 0.9, renk: 'siyah', renk2: '', desenli: false, mevsim: ['k'], tarz: ['g'], su: false, ad: 'Siyah şapka ' + (window.__kirpik = (window.__kirpik || 0) + 1), kutu: [0, 0, 1000, 1000]}}});
    if (yol === '/v1/tani' && window.__mod.tekParca) return yanit(req, {ok: true, durum: 200, veri: {ok: true, sonuc: {kiyafet: true, tur: 'kazak', alternatifler: [], guven: 0.9, renk: 'krem', renk2: '', desenli: false, mevsim: [], tarz: ['g'], su: false, ad: 'Krem kazak', kutu: [50, 50, 950, 950], kisi: false, parcalar: [{kategori: 'ust', ad: 'Krem kazak', kutu: [50, 50, 950, 950]}]}}});
    if (yol === '/v1/tani') return yanit(req, {ok: true, durum: 200, veri: {ok: true, sonuc: {kiyafet: true, tur: 'kazak', alternatifler: [], guven: 0.9, renk: 'krem', renk2: '', desenli: false, mevsim: [], tarz: ['g'], su: false, ad: 'Krem kazak', kutu: [200, 200, 550, 800], kisi: true,
      parcalar: [{kategori: 'aks', ad: 'Siyah şapka', kutu: [20, 350, 140, 650]}, {kategori: 'ust', ad: 'Krem örgü kazak', kutu: [200, 200, 550, 800]}, {kategori: 'alt', ad: 'Mavi kot', kutu: [520, 250, 900, 750]}, {kategori: 'ust', ad: 'bozuk', kutu: [1, 2]}]}}});
    if (yol === '/v1/sohbet') return yanit(req, {ok: true, durum: 200, veri: {ok: true, sonuc: {yanit: 'Krem kazağın çok tatlı durur 💜\n- Altına mavi kot', parcalar: [], oneriler: []}}});
    if (yol === '/v1/ses') return yanit(req, {ok: true, durum: 200, veri: {ok: true, ses: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAwF0AAIC7AAACABAAZGF0YQAAAAA=' + 'A'.repeat(200), tip: 'audio/wav'}});
    if (yol === '/v1/tani__eski')""", 1)

SAY = "() => new Promise(r => { const q = indexedDB.open('kombinle'); q.onsuccess = () => { const t = q.result.transaction('parca').objectStore('parca').count(); t.onsuccess = () => r(t.result); }; })"

def ac_sayfa(p):
    return p.locator('.sayfa.acik').last

with sync_playwright() as pw:
    o = Oturum(pw, hava=met_yanit(taban=14)); o.ctx.add_init_script(SAHTE); p = o.ac()
    p.click('text=Başla'); p.wait_for_timeout(800)
    bas = p.evaluate(SAY)

    print('— Boydan fotoğraf: hangi parça?')
    p.evaluate("window.__api = []")
    p.set_input_files('#dosyaSec', [os.path.join(KOK, 'foto', 'kazak_krem.jpg')])
    p.wait_for_selector('.sayfa.acik .ps-izgara .ps-kart', timeout=20000); p.wait_for_timeout(600)
    s = ac_sayfa(p)
    ok('Hangi parçayı ekleyelim?' in s.inner_text() and 'üzerindeki kıyafetleri' in s.inner_text(), 'parça seçme sayfası açıldı')
    ok(s.locator('.ps-kart').count() == 3, 'geçerli 3 parça listelendi (bozuk kutu atıldı)')
    ok(s.locator('.ps-kart canvas').count() == 3, 'her parçanın kesilmiş önizlemesi var')
    ok(s.locator('.alt-bar .btn.ana').is_disabled(), 'seçim yokken ekle düğmesi kapalı')
    o.ekran('e1_parca_sec')
    print('— Listede olmayan parçayı arama')
    s.locator('.ps-diger-btn').click(); p.wait_for_timeout(200)
    s.locator('.ps-diger .cip', has_text='Çorap').click(); p.wait_for_timeout(900)
    hedef = [a['g'] for a in p.evaluate('window.__api') if a['yol'] == '/v1/tani' and a['g'].get('hedef')]
    ok(len(hedef) == 1 and hedef[0]['hedef'] == 'Çorap', 'Kombinle AI fotoğrafta çorabı aradı')
    ok(s.locator('.ps-kart').count() == 4 and s.locator('.ps-kart[aria-pressed="true"]').count() == 1 and 'Beyaz çorap' in s.inner_text(), 'bulunan çorap seçili olarak eklendi')
    s.locator('.ps-kart', has_text='Siyah şapka').click(); p.wait_for_timeout(200)
    ok('2 parçayı ekle' in s.locator('.alt-bar .btn.ana').inner_text(), 'iki parça seçildi')
    o.ekran('e2_parca_secildi')
    p.evaluate("window.__api = []")
    s.locator('.alt-bar .btn.ana').click()
    p.wait_for_selector('.sayfa.acik .buyuk-resim', timeout=20000); p.wait_for_timeout(500)
    tek = [a['g'] for a in p.evaluate('window.__api') if a['yol'] == '/v1/tani']
    ok(len(tek) >= 1 and all(x.get('tek') for x in tek) and not any(x.get('hedef') for x in tek), 'kesilen parça tek parça olarak tanındı')
    boyut = p.evaluate("""() => new Promise(r => { const i = document.querySelector('.sayfa.acik .buyuk-resim'); const f = () => r([i.naturalWidth, i.naturalHeight]); i.complete ? f() : i.onload = f; })""")
    ok(boyut[0] > boyut[1] * 0.6, 'şapka fotoğraftan kesildi (kare ya da yatay kırpık: %dx%d)' % tuple(boyut))
    ok('Siyah şapka' in p.input_value('.sayfa.acik .ad-girdi') and '(1/2)' in ac_sayfa(p).locator('.alt-bar .btn.ana').inner_text(), 'parça adı geldi, sayaç 1/2: ' + ac_sayfa(p).locator('.alt-bar .btn.ana').inner_text())
    o.ekran('e3_kesilen_sapka')
    ac_sayfa(p).locator('.alt-bar .btn.ana').click(); p.wait_for_timeout(900)
    p.wait_for_selector('.sayfa.acik .buyuk-resim', timeout=20000); p.wait_for_timeout(400)
    ok(p.locator('.sayfa.acik .buyuk-resim').count() == 1, 'ikinci parça (çorap) sırayla açıldı')
    ac_sayfa(p).locator('.alt-bar .btn.ana').click(); p.wait_for_timeout(900)
    ok(p.evaluate(SAY) == bas + 2, 'iki parça ayrı ayrı dolaba eklendi')
    ok(p.locator('.sayfa.acik').count() == 0, 'akış bitti, açık sayfa kalmadı')

    print('— Fotoğrafın tamamı ve vazgeçme')
    p.set_input_files('#dosyaSec', [os.path.join(KOK, 'foto', 'kazak_krem.jpg')])
    p.wait_for_selector('.sayfa.acik .ps-izgara .ps-kart', timeout=20000); p.wait_for_timeout(400)
    ac_sayfa(p).locator('.alt-bar .btn.ikincil').click(); p.wait_for_timeout(700)
    ok(p.locator('.sayfa.acik .buyuk-resim').count() == 1 and p.locator('.sayfa.acik .ps-izgara').count() == 0, '"Fotoğrafın tamamı" eski düzenle devam eder')
    ac_sayfa(p).locator('.bas .ikon-btn').click(); p.wait_for_timeout(600)
    p.set_input_files('#dosyaSec', [os.path.join(KOK, 'foto', 'kazak_krem.jpg'), os.path.join(KOK, 'foto', 'tisort_kirmizi.jpg')])
    p.wait_for_selector('.sayfa.acik .ps-izgara .ps-kart', timeout=20000); p.wait_for_timeout(400)
    ac_sayfa(p).locator('.bas .ikon-btn').click(); p.wait_for_timeout(900)
    p.wait_for_selector('.sayfa.acik .ps-izgara, .sayfa.acik .buyuk-resim', timeout=20000)
    ok(p.locator('.sayfa.acik').count() == 1, 'vazgeçince sıradaki fotoğrafa geçildi')
    ac_sayfa(p).locator('.bas .ikon-btn').click(); p.wait_for_timeout(600)
    print('— Tek parçalı fotoğrafta soru sorulmaz')
    p.evaluate("window.__mod.tekParca = true")
    p.set_input_files('#dosyaSec', [os.path.join(KOK, 'foto', 'kazak_krem.jpg')])
    p.wait_for_selector('.sayfa.acik .buyuk-resim', timeout=20000); p.wait_for_timeout(300)
    ok(p.locator('.sayfa.acik .ps-izgara').count() == 0, 'tek parça varsa doğrudan düzenleme açılır')
    ac_sayfa(p).locator('.bas .ikon-btn').click(); p.wait_for_timeout(600)

    print('— AI Prenses: selam ve doğal ses')
    p.evaluate("window.__api = []; localStorage.removeItem('kb_sohbet')")
    p.click('nav.alt-menu button.ai-orta'); p.wait_for_timeout(500)
    saat = p.evaluate('new Date().getHours()')
    beklenen = 'Günaydın' if 5 <= saat < 11 else 'Selam' if 11 <= saat < 17 else 'İyi akşamlar' if saat >= 17 else 'Merhaba'
    ok(beklenen in p.inner_text('.sohbet .sh-hosgeldin h2'), 'karşılama saate göre: ' + p.inner_text('.sohbet .sh-hosgeldin h2'))
    p.fill('.sh-girdi', 'ne giysem'); p.press('.sh-girdi', 'Enter'); p.wait_for_timeout(900)
    p.fill('.sh-girdi', 'peki ayakkabı'); p.press('.sh-girdi', 'Enter'); p.wait_for_timeout(900)
    sh = [a['g'] for a in p.evaluate('window.__api') if a['yol'] == '/v1/sohbet']
    ok(len(sh) == 2 and sh[0]['ilk'] is True and sh[1]['ilk'] is False and sh[0]['saat'] == saat, 'ilk mesaj "ilk" ve saatle, ikincisi selamsız istendi')
    ses = [a['g'] for a in p.evaluate('window.__api') if a['yol'] == '/v1/ses']
    ok(len(ses) >= 1 and ses[0]['metin'] == 'Krem kazağın çok tatlı durur. Altına mavi kot' and ses[0]['dil'] == 'tr', 'cevap doğal sesle okunmak üzere gönderildi: ' + (ses[0]['metin'] if ses else '-'))
    p.evaluate("localStorage.setItem('kb_sohbet', JSON.stringify(JSON.parse(localStorage.getItem('kb_sohbet')).map(x => Object.assign(x, {z: Date.now() - 4 * 3600000}))))")
    p.fill('.sh-girdi', 'yarın için?'); p.press('.sh-girdi', 'Enter'); p.wait_for_timeout(900)
    sh = [a['g'] for a in p.evaluate('window.__api') if a['yol'] == '/v1/sohbet']
    ok(sh[-1]['ilk'] is False, 'aynı açılışta süren konuşma selamsız')
    o.ekran('e4_sohbet')
    p.evaluate("localStorage.setItem('kb_dogalSes', 'false'); window.__api = []")
    p.fill('.sh-girdi', 'teşekkürler'); p.press('.sh-girdi', 'Enter'); p.wait_for_timeout(900)
    ok(not [a for a in p.evaluate('window.__api') if a['yol'] == '/v1/ses'], 'doğal ses kapalıyken telefonun sesi kullanılır')
    ok(not [h for h in o.hatalar if 'pageerror' in h], 'sayfa hatası yok: ' + str(o.hatalar[:2]))
    o.kapat()

    print('— Uzun aradan sonra yeni konuşma selamla başlar')
    o = Oturum(pw, hava=met_yanit(taban=14)); o.ctx.add_init_script(SAHTE)
    o.ctx.add_init_script("localStorage.setItem('kb_sohbet', JSON.stringify([{r: 'k', m: 'selam', z: Date.now() - 5 * 3600000}, {r: 'a', m: 'Merhaba!', z: Date.now() - 5 * 3600000}]))")
    p = o.ac(); p.click('text=Başla'); p.wait_for_timeout(800)
    p.evaluate("window.__api = []")
    p.click('nav.alt-menu button.ai-orta'); p.wait_for_timeout(500)
    p.fill('.sh-girdi', 'bugün ne giysem'); p.press('.sh-girdi', 'Enter'); p.wait_for_timeout(900)
    sh = [a['g'] for a in p.evaluate('window.__api') if a['yol'] == '/v1/sohbet']
    ok(sh and sh[-1]['ilk'] is True, '5 saat sonra gelen mesaj yeni konuşma sayılır')
    o.kapat()
ozet()
