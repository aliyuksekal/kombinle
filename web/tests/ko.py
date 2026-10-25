import sys, os, re; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import *
# Korece: dil seçimi, ekranlar Korece, türler ve renkler Korece adlarla
with sync_playwright() as pw:
    o = Oturum(pw, dil='ko-KR'); p = o.ac()
    ok('시작하기' in p.inner_text('body'), 'telefon dili Korece ise uygulama Korece açıldı')
    o.ekran('k1_karsilama')
    p.click('text=예시 옷장으로 체험하기'); p.wait_for_timeout(1500)
    govde = p.inner_text('body')
    ok(re.search('[가-힣]', govde) and '오늘' in govde, 'ana sayfa Korece')
    o.ekran('k2_ana')
    p.click('#altMenu [data-sekme="dolap"]'); p.wait_for_timeout(800)
    t = p.inner_text('body')
    ok('옷장' in t and any(x in t for x in ('티셔츠', '청바지', '원피스', '블라우스', '스웨터', '치마')), 'gardırop: türler Korece')
    o.ekran('k3_dolap')
    p.click('#altMenu [data-sekme="ayarlar"]'); p.wait_for_timeout(600)
    p.click('details[data-kart="dil"] summary'); p.wait_for_timeout(300)
    ok('한국어' in p.inner_text('body'), 'dil listesinde 한국어')
    p.locator('details[data-kart="dil"] button', has_text='English').click(); p.wait_for_timeout(500)
    ok('Settings' in p.inner_text('body'), 'İngilizceye geçildi')
    p.click('details[data-kart="dil"] summary') if not p.locator('details[data-kart="dil"][open]').count() else None
    p.locator('details[data-kart="dil"] button', has_text='한국어').click(); p.wait_for_timeout(500)
    ok('설정' in p.inner_text('body') and p.evaluate('document.documentElement.lang') == 'ko', 'Koreceye geri geçildi, sayfa dili ko')
    hatalar = [h for h in o.hatalar if 'pageerror' in h]
    ok(not hatalar, 'sayfa hatası yok ' + str(hatalar[:2]))
    o.kapat()
ozet()
