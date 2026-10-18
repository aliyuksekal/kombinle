import sys; sys.path.insert(0, '.')
from ortak import *
with sync_playwright() as pw:
    o = Oturum(pw); p = o.ac()
    o.ekran('01_karsilama')
    p.click('text=Örnek dolapla dene'); p.wait_for_timeout(1500)
    o.ekran('02_bugun')
    p.fill('#istek', 'Öğleden sonra toplantım var'); p.click('#onerBtn'); p.wait_for_timeout(1200)
    o.ekran('03_sonuc', tam=True)
    print('\n'.join(o.hatalar)); print(o.dis_istek)
    o.kapat()
