import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import *
# Yalnız en öndeki sayfaya dokunulabilir: arkadaki sayfalar, ana ekran ve alt menü kilitli
with sync_playwright() as pw:
    o = Oturum(pw); p = o.ac()
    p.click('text=Örnek dolapla dene'); p.wait_for_timeout(1200)
    p.click('nav.alt-menu button[data-sekme="dolap"]'); p.wait_for_timeout(600)
    p.locator('#uygulama .oge, #uygulama .parca, #uygulama [data-parca]').first.click(); p.wait_for_timeout(700)
    ok(p.locator('.sayfa.acik').count() == 1, 'birinci sayfa açık')
    ok(p.evaluate("['uygulama', 'altMenu'].map(id => document.getElementById(id).inert)") == [True, True], 'ana ekran ve alt menü kilitli')
    s1 = p.locator('.sayfa.acik').first
    s1.locator('button:has-text("Kırp")').click(); p.wait_for_timeout(800)
    n = p.locator('.sayfa.acik').count()
    ok(n == 2, 'ikinci sayfa birincinin üstünde açıldı')
    ok(p.evaluate("(() => { const l = [...document.querySelectorAll('.sayfa.acik')]; return [l[0].inert, l[1].inert]; })()") == [True, False], 'yalnız en öndeki sayfa etkin, arkadaki kilitli')
    # arkadaki sayfanın görünen bir noktası ekranın neresinde olursa olsun, oraya dokunan öndekine dokunur
    ust = p.evaluate("""(() => { const l = [...document.querySelectorAll('.sayfa.acik')]; const b = l[0].querySelector('button:not([disabled])').getBoundingClientRect();
      const e = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return !l[0].contains(e); })()""")
    ok(ust, 'arkadaki sayfanın düğmesine dokunulamıyor')
    z = p.evaluate("(() => { const l = [...document.querySelectorAll('.sayfa.acik')]; return [+getComputedStyle(l[0]).zIndex, +getComputedStyle(l[1]).zIndex]; })()")
    ok(z[1] > z[0], 'öndeki sayfa üstte: ' + str(z))
    p.go_back(); p.wait_for_timeout(700)
    ok(p.locator('.sayfa.acik').count() == 1 and not p.evaluate("document.querySelector('.sayfa.acik').inert"), 'öndeki kapanınca arkadaki yeniden dokunulabilir')
    ok(p.evaluate("document.getElementById('uygulama').inert") is True, 'ana ekran hâlâ kilitli')
    p.go_back(); p.wait_for_timeout(700)
    ok(p.locator('.sayfa.acik').count() == 0 and p.evaluate("['uygulama', 'altMenu'].map(id => document.getElementById(id).inert)") == [False, False], 'hepsi kapanınca ana ekran açıldı')
    ok(p.evaluate("document.getElementById('uygulama').hasAttribute('aria-hidden')") is False, 'erişilebilirlik işareti de kaldırıldı')
    print([h for h in o.hatalar if 'pageerror' in h])
    o.kapat()
ozet()
