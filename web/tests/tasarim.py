import sys, os, json; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import *
# Tasarım onayı için ana ekranların açık ve koyu ekran görüntüleri: python3 tasarim.py [önek]
KOK = os.path.dirname(os.path.abspath(__file__))
ONEK = sys.argv[1] if len(sys.argv) > 1 else 't'
SAHTE = open(os.path.join(KOK, 'mesaj.py')).read().split('SAHTE = r"""')[1].split('"""')[0]
SAHTE = SAHTE.replace("if (yol === '/v1/akis') return tamam({devam: false, liste: []});", r"""if (yol === '/v1/akis') return tamam({devam: false, liste: [
      {id: 'a'.repeat(20), takma: 'Zeynep', kadi: 'zeynep', aciklama: 'Pazar kahvaltısı için rahat ama şık', etiketler: ['günlük', 'kahvaltı'], begeni: 24, begenmeme: 1, yorum: 3, zaman: Date.now() - 3600000, benim: false, gizli: 0, yazar: 'bbbbbbbbbbbb', oy: 0}]});
    if (yol === '/v1/sohbet') return tamam({sonuc: {yanit: 'Lacivert blazerin ve krem kazağın bu hava için çok iyi gider. Altına koyu kot, ayağına da beyaz spor ayakkabı; akşam serinlerse trençkotunu al.', parcalar: [], oneriler: ['Ayakkabı ne olsun?', 'Aksesuar öner']}});
    if (yol === '/v1/ses') return hata('ses_yok', 502);
    if (yol === '/v1/anketler') return tamam({liste: []});""")
HESAP = "localStorage.setItem('kb_hesap', JSON.stringify(%s)); window.__ben = %s;"
ELIF = {'ad': 'Elif Yılmaz', 'eposta': 'elif@ornek.com', 'kod': '0123456789ab', 'kadi': 'elif', 'yonetici': False, 'av': 0, 'pro': 0}


def kapat_hepsi(p):
    for _ in range(4):
        if p.locator('.sohbet.acik').count():
            p.locator('.sohbet .sh-ust-btn').last.click(); p.wait_for_timeout(400); continue
        if p.locator('.sayfa.acik').count():
            p.locator('.sayfa.acik .bas :is([aria-label="Kapat"],[aria-label="Geri"])').last.click(); p.wait_for_timeout(400); continue
        break


with sync_playwright() as pw:
    for koyu in (False, True):
        ek = '_koyu' if koyu else '_acik'
        o = Oturum(pw, koyu=koyu, hava=met_yanit(taban=14))
        o.ctx.add_init_script('window.__mod = {};' + HESAP % (json.dumps(ELIF), json.dumps(ELIF)) + SAHTE)
        p = o.ac()
        o.ekran(ONEK + '01_karsilama' + ek)
        p.click('text=Örnek dolapla dene'); p.wait_for_selector('#istek'); p.wait_for_timeout(4200)
        p.evaluate('window.scrollTo(0,0)'); p.wait_for_timeout(200)
        o.ekran(ONEK + '03_bugun' + ek)
        p.fill('#istek', 'Öğleden sonra toplantım var'); p.click('#onerBtn'); p.wait_for_timeout(2500)
        try:
            p.evaluate("document.querySelector('#sonucAlani').scrollIntoView()"); p.wait_for_timeout(400)
        except Exception:
            pass
        o.ekran(ONEK + '04_kombin' + ek)
        p.evaluate('window.scrollTo(0,0)')
        p.click('nav.alt-menu button[data-sekme="dolap"]'); p.wait_for_timeout(900)
        o.ekran(ONEK + '05_dolap' + ek)
        p.click('nav.alt-menu button[data-sekme="kesfet"]'); p.wait_for_timeout(1200)
        o.ekran(ONEK + '06_kesfet' + ek)
        p.click('nav.alt-menu button[data-sekme="ayarlar"]'); p.wait_for_timeout(900)
        o.ekran(ONEK + '07_ayarlar' + ek)
        p.click('nav.alt-menu button[data-sekme="bugun"]'); p.wait_for_timeout(700)
        p.click('.g-hesap'); p.wait_for_timeout(1000)
        o.ekran(ONEK + '08_profil' + ek)
        kapat_hepsi(p)
        p.evaluate('magazaSayfasi && 0') if False else None
        p.locator('.g-jeton, .jeton-hap, [class*="jeton"]').first.click(); p.wait_for_timeout(900)
        o.ekran(ONEK + '09_magaza' + ek)
        kapat_hepsi(p)
        p.click('nav.alt-menu button.ai-orta'); p.wait_for_timeout(600)
        p.fill('.sh-girdi', 'Bugün ofiste ne giysem?'); p.press('.sh-girdi', 'Enter'); p.wait_for_timeout(1200)
        o.ekran(ONEK + '10_sohbet' + ek)
        kapat_hepsi(p)
        p.set_input_files('#dosyaSec', [os.path.join(KOK, 'foto', 'kazak_krem.jpg')])
        p.wait_for_selector('.sayfa.acik .buyuk-resim', timeout=20000); p.wait_for_timeout(600)
        o.ekran(ONEK + '11_ekle' + ek)
        print(ek, 'hatalar:', [h for h in o.hatalar if 'pageerror' in h][:3])
        o.kapat()
