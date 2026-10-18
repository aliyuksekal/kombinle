import sys, os, json, base64, random, time; sys.path.insert(0, '.')
from ortak import *
random.seed(3)
with sync_playwright() as pw:
    # Performans: 240 parçalık dolap
    o = Oturum(pw, hava=met_yanit(taban=15)); p = o.ac()
    p.click('text=Başla'); p.wait_for_timeout(600)
    foto = 'data:image/jpeg;base64,' + base64.b64encode(open('foto/tisort_kirmizi.jpg', 'rb').read()).decode()
    turler = ['tisort','bluz','gomlek','kazak','sweat','tunik','kumas','kot','etek','uzunetek','tayt','elbise','uzunelbise','hirka','blazer','ceket','tren','mont','kaban','spor','babet','topuklu','bot','sandalet','canta','atki']
    renkler = ['siyah','beyaz','krem','bej','lacivert','kot','bordo','pembe','yesil','gri','mavi','kirmizi','taba']
    parcalar = [{'id': 'p%07d' % i, 'tur': random.choice(turler), 'renk': random.choice(renkler), 'foto': foto, 'tarz': ''} for i in range(240)]
    yol = os.path.join(EKRAN, 'buyuk.json'); json.dump({'uygulama': 'kombinle', 'parcalar': parcalar}, open(yol, 'w'))
    t0 = time.time(); p.set_input_files('#yedekSec', yol); p.wait_for_timeout(300); p.click('.pencere .btn.ana')
    while 'yüklendi' not in p.inner_text('#tost') and time.time() - t0 < 120: p.wait_for_timeout(250)
    print('240 parça yükleme: %.1f sn' % (time.time() - t0), p.inner_text('#tost'))
    p.fill('#istek', 'toplantı'); t0 = time.time(); p.click('#onerBtn'); p.wait_for_selector('#sonucAlani .masa', timeout=20000)
    print('240 parçada kombin süresi: %.2f sn (260 ms bekleme dahil)' % (time.time() - t0))
    print('hatalar', [h for h in o.hatalar if 'analiz' not in h])
    o.kapat()
