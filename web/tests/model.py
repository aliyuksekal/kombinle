import sys, os, json; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import *
# Kombinle modeli: emin olduğunda bulut atlanır, emin değilse / takıysa bulut karar verir, model yoksa eski akış.
SAHTE = r"""localStorage.setItem('kb_hesap', JSON.stringify({ad: 'Elif', eposta: 'elif@ornek.com', kod: '0123456789ab'}));
window.__api = []; window.__model = []; window.__mod = window.__mod || {};
const yanit = (req, d) => setTimeout(() => window.dispatchEvent(new CustomEvent('kbyerel', {detail: Object.assign({req}, d)})), 40);
window.KombinleNative = {
  konum: req => yanit(req, {ok: true, lat: 41.01, lon: 28.97, ad: 'İstanbul'}), konumAyarlari: () => {},
  surum: () => '1.0.9', cubuk: () => {}, dinle: req => yanit(req, {ok: false}),
  etiketle: req => yanit(req, {ok: true, etiketler: window.__mod.etiket || []}),
  arkaSil: req => yanit(req, {ok: false}), dosyaKaydet: req => yanit(req, {ok: true}),
  odemeSorgula: req => yanit(req, {ok: true, products: []}), odemeAl: req => yanit(req, {ok: false}),
  odemeSahip: () => '[]', odemeGeriYukle: req => yanit(req, {ok: true, owned: []}), jetonTeslim: () => 0,
  yzVar: () => true, oturumVar: () => true, oturumAyarla: () => {}, sunucu: () => 'https://kombinle-api.ornek.workers.dev',
  modelVar: () => !window.__mod.modelYok,
  modelTani: (req, b64) => {
    window.__model.push(b64.length);
    const m = window.__mod.model;
    if (m === 'hata') return yanit(req, {ok: false, hata: 'model-yok'});
    yanit(req, {ok: true, sonuc: m});
  },
  api: (req, yol, govde) => {
    window.__api.push(yol);
    if (yol === '/v1/tani') return yanit(req, {ok: true, durum: 200, veri: {ok: true, sonuc: {kiyafet: true, tur: 'kolye', alternatifler: [], guven: 0.9, renk: 'altin', desenli: false, ad: 'Altın kolye'}}});
    yanit(req, {ok: false, durum: 404, veri: {ok: false, hata: 'yok'}});
  }
};"""
EMIN = {'siniflar': [{'id': 'etek', 'turlar': ['etek', 'uzunetek'], 'grup': 'alt', 'p': 0.91}, {'id': 'elbise', 'turlar': ['elbise'], 'grup': 'tek', 'p': 0.05}],
        'desen': {'duz': 0.08, 'cizgili': 0.85, 'kareli': 0.02, 'cicekli': 0.02, 'puantiyeli': 0.01, 'hayvan': 0.01, 'diger': 0.01}}
KARARSIZ = {'siniflar': [{'id': 'kaban', 'turlar': ['kaban', 'tren'], 'grup': 'dis', 'p': 0.52}], 'desen': {'duz': 0.5}}
AYAKKABI = {'siniflar': [{'id': 'ayakkabi', 'turlar': [], 'grup': 'ayk', 'p': 0.95}], 'desen': {'duz': 0.9}}


def kaydet(p):
    p.locator('.sayfa.acik .alt-bar .btn.ana').click(); p.wait_for_timeout(700)


def dene(o, model, etiket=None, ek=None, foto='foto/etek_bordo.jpg'):
    p = o.p
    p.evaluate('m => { window.__mod = m; window.__api = []; window.__model = []; }', dict({'model': model, 'etiket': etiket or []}, **(ek or {})))
    p.set_input_files('#dosyaSec', [foto])
    p.wait_for_selector('.sayfa.acik .buyuk-resim', timeout=15000); p.wait_for_timeout(300)
    sonuc = {'tahmin': p.inner_text('.sayfa.acik .tahmin'), 'api': p.evaluate('window.__api'), 'model': p.evaluate('window.__model'),
             'tur': p.evaluate("(document.querySelector('.sayfa.acik .tur-sec .secili, .sayfa.acik [aria-pressed=true]')||{}).textContent||''")}
    return sonuc


with sync_playwright() as pw:
    # model dosyası yok: eski akış (model hiç çağrılmaz, bulut çağrılır)
    o = Oturum(pw); o.ctx.add_init_script(SAHTE.replace('window.__mod = window.__mod || {}', "window.__mod = {modelYok: true}")); p = o.ac()
    p.click('text=Başla'); p.wait_for_timeout(500)
    r = dene(o, None, ek={'modelYok': True})
    ok(r['model'] == [] and '/v1/tani' in r['api'], 'model yokken eski akış: bulut tanıması çalıştı')
    o.kapat()

    o = Oturum(pw); o.ctx.add_init_script(SAHTE); p = o.ac()
    p.click('text=Başla'); p.wait_for_timeout(500)

    r = dene(o, EMIN)
    ok(len(r['model']) == 1, 'model fotoğrafı gördü')
    ok('/v1/tani' not in r['api'], 'model eminken buluta gidilmedi')
    ok('Etek' in r['tahmin'], 'model sonucu gösterildi: ' + r['tahmin'][:60])
    ok('tekrar tanı' in r['tahmin'], 'istenirse bulutla yeniden tanıma düğmesi var')
    ok(p.evaluate("(() => { const b = [...document.querySelectorAll('.sayfa.acik [role=switch]')].find(x => /Desenli/.test(x.textContent)); return !!b && b.getAttribute('aria-checked') === 'true'; })()"),
       'desen: model çizgili dedi, desenli işaretli')
    p.click('.sayfa.acik .tahmin-btn'); p.wait_for_timeout(800)
    ok(p.evaluate('window.__api').count('/v1/tani') == 1 and 'Kolye' in p.inner_text('.sayfa.acik .tahmin'), 'düğmeye basınca bulut tanıdı ve düğme kalktı')
    ok(p.locator('.sayfa.acik .tahmin-btn').count() == 0, 'bulut sonrası düğme gizli')
    kaydet(p)

    r = dene(o, KARARSIZ); kaydet(p)
    ok('/v1/tani' in r['api'], 'model kararsızken (%52) bulut karar verdi')

    r = dene(o, EMIN, etiket=[{'t': 'Necklace', 'c': 0.8}]); kaydet(p)
    ok('/v1/tani' in r['api'], 'takı olabilecek fotoğraf buluta gitti')

    r = dene(o, dict(EMIN, yuz=1)); kaydet(p)
    ok('/v1/tani' in r['api'], 'fotoğrafta yüz varsa (boydan çekim) model emin olsa da bulut parçaları ayırır')
    r = dene(o, EMIN, etiket=[{'t': 'Selfie', 'c': 0.8}]); kaydet(p)
    ok('/v1/tani' in r['api'], 'ayna özçekiminde bulut parçaları ayırır')

    r = dene(o, AYAKKABI, foto='foto/spor_beyaz.jpg'); kaydet(p)
    ok('/v1/tani' not in r['api'] and any(x in r['tahmin'] for x in ('Spor', 'Babet', 'Topuklu', 'Bot', 'Loafer', 'Sandalet', 'Terlik')), 'ayakkabı: alt türü cihaz içi analizden: ' + r['tahmin'][:50])

    # --- 2. sürüm model: kıyafet değil, kol boyu, takı, parça haritası ---
    YOK = {'siniflar': [{'id': 'yok', 'turlar': [], 'grup': '', 'p': 0.97}, {'id': 'canta', 'turlar': ['canta'], 'grup': 'aks', 'p': 0.02}], 'desen': {'duz': 0.6}}
    r = dene(o, YOK)
    ok('/v1/tani' not in r['api'] and 'kıyafet göremedim' in r['tahmin'], 'model "kıyafet değil" derse buluta gidilmedi, 🫪 uyarısı: ' + r['tahmin'][:50])
    ok(p.locator('.sayfa.acik .emoji-rozet').count() == 1, 'kıyafet olmayan fotoğrafta emoji rozeti var')
    kaydet(p)
    r = dene(o, dict(YOK, siniflar=[dict(YOK['siniflar'][0], p=0.7)] + YOK['siniflar'][1:])); kaydet(p)
    ok('/v1/tani' in r['api'], 'model "kıyafet değil"de emin değilse (%70) bulut karar verdi')
    UZUNKOL = {'siniflar': [{'id': 'gomlek_bluz', 'turlar': ['bluz', 'gomlek'], 'grup': 'ust', 'p': 0.93}], 'desen': {'duz': 0.9},
               'kol': {'kolsuz': 0.02, 'kisa': 0.05, 'orta': 0.08, 'uzun': 0.85}, 'boy': {'mini': 0.2, 'dizustu': 0.2, 'diz': 0.2, 'midi': 0.2, 'maksi': 0.2}}
    r = dene(o, UZUNKOL, foto='foto/tisort_kirmizi.jpg')
    ad = p.input_value('.sayfa.acik .ad-girdi')
    ok('/v1/tani' not in r['api'] and 'uzun kollu bluz' in ad.lower(), 'model uzun kollu dedi, ad buna göre: ' + ad)
    kaydet(p)
    MIDI = {'siniflar': [{'id': 'etek', 'turlar': ['etek', 'uzunetek'], 'grup': 'alt', 'p': 0.9}], 'desen': {'duz': 0.9},
            'boy': {'mini': 0.05, 'dizustu': 0.05, 'diz': 0.1, 'midi': 0.75, 'maksi': 0.05}}
    r = dene(o, MIDI); ad = p.input_value('.sayfa.acik .ad-girdi'); kaydet(p)
    ok('midi etek' in ad.lower(), 'etek boyu ada eklendi: ' + ad)
    KUPE = {'siniflar': [{'id': 'kupe', 'turlar': ['kupe'], 'grup': 'aks', 'p': 0.9}], 'desen': {'duz': 0.9}}
    r = dene(o, KUPE, etiket=[{'t': 'Earrings', 'c': 0.8}]); kaydet(p)
    ok('/v1/tani' not in r['api'] and 'Küpe' in r['tahmin'], 'model takıyı tanıyınca buluta gidilmedi: ' + r['tahmin'][:40])

    PARCALI = dict(EMIN, yuz=1, parcalar=[
        {'sinif': 'ust', 'grup': 'ust', 'kutu': [180, 250, 450, 750], 'alan': 0.18, 'p': 0.86},
        {'sinif': 'alt', 'grup': 'alt', 'kutu': [450, 280, 850, 720], 'alan': 0.2, 'p': 0.81},
        {'sinif': 'ayakkabi', 'grup': 'ayk', 'kutu': [860, 300, 960, 700], 'alan': 0.02, 'p': 0.7},
        {'sinif': 'kemer', 'grup': 'aks', 'kutu': [440, 300, 470, 700], 'alan': 0.004, 'p': 0.3},
        {'sinif': 'bilinmeyen', 'grup': 'x', 'kutu': [0, 0, 500, 500], 'alan': 0.2, 'p': 0.9},
        {'sinif': 'canta', 'grup': 'aks', 'kutu': [0, 0, 5, 5], 'alan': 0.2, 'p': 0.9}])
    p.evaluate('m => { window.__mod = m; window.__api = []; window.__model = []; }', {'model': PARCALI, 'etiket': []})
    p.set_input_files('#dosyaSec', ['foto/karisik_pembe.jpg'])
    p.wait_for_selector('.sayfa.acik .ps-izgara .ps-kart', timeout=15000); p.wait_for_timeout(500)
    s = p.locator('.sayfa.acik')
    ok('/v1/tani' not in p.evaluate('window.__api'), 'boydan fotoğraf: parçalar telefonda ayrıldı, buluta gidilmedi')
    ok(s.locator('.ps-kart').count() == 3 and 'Ayakkabı' in s.inner_text() and 'Pantolon' in s.inner_text(),
       'parça haritası: 3 güvenilir parça listelendi (emin olunmayan, bilinmeyen, bozuk kutulu atıldı)')
    s.locator('.ps-kart', has_text='Üst').click(); p.wait_for_timeout(200)
    p.evaluate("m => { window.__mod = m; window.__model = []; }", {'model': EMIN, 'etiket': []})
    s.locator('.alt-bar .btn.ana').click()
    p.wait_for_selector('.sayfa.acik .buyuk-resim', timeout=15000); p.wait_for_timeout(400)
    ok(len(p.evaluate('window.__model')) == 1 and '/v1/tani' not in p.evaluate('window.__api'), 'seçilen parça kesilip model ile ayrıca tanındı')
    kaydet(p)
    p.wait_for_timeout(500)
    # yüz yok, tek büyük parça: parça seçici açılmaz
    r = dene(o, dict(EMIN, parcalar=[{'sinif': 'etek', 'grup': 'alt', 'kutu': [100, 100, 900, 900], 'alan': 0.5, 'p': 0.9},
                                     {'sinif': 'kemer', 'grup': 'aks', 'kutu': [100, 100, 150, 900], 'alan': 0.02, 'p': 0.8}])); kaydet(p)
    ok('/v1/tani' not in r['api'] and 'Etek' in r['tahmin'], 'tek parçalı ürün fotoğrafında parça seçici açılmadı')

    r = dene(o, 'hata'); kaydet(p)
    ok('/v1/tani' in r['api'], 'model hata verirse bulut devreye girdi')
    r = dene(o, EMIN); kaydet(p)
    ok(r['model'] == [] and '/v1/tani' in r['api'], 'bozuk model bir daha denenmedi')
    hatalar = [h for h in o.hatalar if 'pageerror' in h]
    ok(not hatalar, 'sayfa hatası yok ' + str(hatalar[:2]))
    o.kapat()
ozet()
