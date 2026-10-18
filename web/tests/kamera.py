import sys; sys.path.insert(0, '.')
from ortak import *
with sync_playwright() as pw:
    o = Oturum(pw); o.ctx.grant_permissions(['camera', 'geolocation']); p = o.ac()
    p.click('text=Başla'); p.wait_for_timeout(600)
    p.click('#uygulama .btn.ana:has-text("Kıyafet ekle")'); p.wait_for_timeout(500)
    p.click('.sayfa.acik button.satir:has-text("Fotoğraf çek")'); p.wait_for_timeout(2500)
    o.ekran('60_kamera')
    ok(not p.locator('.sayfa.acik .deklansor').is_disabled(), 'kamera açıldı, deklanşör hazır')
    p.click('.sayfa.acik .deklansor'); p.wait_for_selector('.sayfa.acik .buyuk-resim', timeout=15000)
    ok(True, 'çekilen kare düzenleme ekranına geldi')
    print([h for h in o.hatalar if 'analiz' not in h])
    o.kapat()
ozet()
