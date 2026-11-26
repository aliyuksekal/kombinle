import sys; sys.path.insert(0, '.')
from ortak import *
with sync_playwright() as pw:
    o = Oturum(pw); o.ctx.add_init_script('window.TUR_SINAMA = true'); p = o.ac()
    p.click('text=Örnek dolapla dene'); p.wait_for_timeout(4200)
    assert p.locator('.tur').count() == 1, 'tur açılmadı'
    o.ekran('tur_1')
    p.click('.tur-kutu .btn.ana'); p.wait_for_timeout(400)
    p.click('.tur-kutu .btn.ana'); p.wait_for_timeout(400)
    o.ekran('tur_3')
    p.click('text=Turu geç'); p.wait_for_timeout(300)
    assert p.locator('.tur').count() == 0
    p.click('#altMenu [data-sekme="ayarlar"]'); p.wait_for_timeout(600)
    assert p.locator('text=Uygulamayı puanla').count() == 1
    assert p.locator('text=Uygulamayı paylaş').count() == 1
    p.click('text=Uygulama turunu başlat'); p.wait_for_timeout(1200)
    assert p.locator('.tur').count() == 1, 'tur tekrar açılmadı'
    print('TUR OK'); print('\n'.join(o.hatalar))
    o.kapat()
