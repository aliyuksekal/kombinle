import sys, os, json; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import *
# Renkli temalar belirgin, Nane teması; sohbette her cevabın yanında sesli oku düğmesi
with sync_playwright() as pw:
    o = Oturum(pw); p = o.ac()
    p.click('text=Örnek dolapla dene'); p.wait_for_timeout(1200)
    renkler = {}
    for tema in ['acik', 'pembe', 'lavanta', 'altin', 'nane', 'turkuaz', 'rosegold', 'koyu']:
        p.evaluate("t => { localStorage.setItem('kb_tema', t); location.reload(); }", tema); p.wait_for_timeout(1300)
        try: p.click('#acilis', timeout=1500)
        except Exception: pass
        p.wait_for_timeout(500)
        renkler[tema] = p.evaluate("getComputedStyle(document.body).backgroundColor")
        o.ekran('tm_' + tema)
    print(renkler)
    ok(len(set(renkler.values())) == len(renkler), 'her temanın zemini farklı')
    ok(renkler['nane'] == 'rgb(226, 245, 238)', 'Nane teması yeşil zeminli: ' + renkler['nane'])
    ok(renkler['turkuaz'] == 'rgb(221, 243, 245)', 'Turkuaz teması: ' + renkler['turkuaz'])
    p.evaluate("t => { localStorage.setItem('kb_tema', t); location.reload(); }", 'acik'); p.wait_for_timeout(1300)
    try: p.click('#acilis', timeout=1500)
    except Exception: pass
    p.click('#altMenu [data-sekme="ayarlar"]'); p.wait_for_timeout(500)
    p.click('details[data-kart="gorunum"] summary') if p.locator('details[data-kart="gorunum"]').count() else None
    p.wait_for_timeout(300)
    ok(p.locator('[aria-label="Nane"], [title="Nane"]').count() + p.locator('text=Nane').count() >= 1, 'tema listesinde Nane')
    ok(p.locator('text=Turkuaz').count() >= 1, 'tema listesinde Turkuaz')
    # sohbet: sesli oku düğmesi
    p.evaluate("""localStorage.setItem('kb_sohbet', JSON.stringify([{r:'k', m:'Ne giysem?', p:[], z:Date.now()-5000},{r:'a', m:'Krem kazak ve kot çok yakışır.', p:[], z:Date.now()-4000},{r:'a', m:'Bir de taba bot ekle.', p:[], z:Date.now()-3000}]))""")
    p.click('.ai-orta'); p.wait_for_timeout(800)
    ok(p.locator('.sohbet .sh-mesaj.bot .sh-oku').count() == 2 and p.locator('.sohbet .sh-mesaj.kul .sh-oku').count() == 0, 'her AI cevabında 🔉 düğmesi, kullanıcı mesajında yok')
    p.evaluate("() => { window.__okunan = []; if (window.speechSynthesis) speechSynthesis.speak = u => window.__okunan.push(u.text); }")
    p.locator('.sohbet .sh-oku').first.click(); p.wait_for_timeout(300)
    ok(p.locator('.sohbet .sh-oku.caliyor').count() == 1, 'basınca okuyor (düğme vurgulu)')
    o.ekran('tm_sohbet')
    p.locator('.sohbet .sh-oku.caliyor').click(); p.wait_for_timeout(200)
    ok(p.locator('.sohbet .sh-oku.caliyor').count() == 0, 'tekrar basınca durdu')
    hatalar = [h for h in o.hatalar if 'pageerror' in h]
    ok(not hatalar, 'sayfa hatası yok ' + str(hatalar[:2]))
    o.kapat()
ozet()
