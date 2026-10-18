import sys, os; sys.path.insert(0, '.')
from ortak import *
BEK = {'tisort_kirmizi': ('ust', 'kirmizi'), 'kazak_krem': ('ust', 'krem'), 'pantolon_lacivert': ('alt', 'lacivert'), 'sort_mavi': ('alt', 'kot'),
       'etek_bordo': ('alt', 'bordo'), 'elbise_yesil': ('tek', 'yesil'), 'ayakkabi_siyah': ('ayk', 'siyah'), 'spor_beyaz': ('ayk', 'beyaz'),
       'canta_taba': ('aks', 'taba'), 'kaban_gri': ('dis', 'gri'), 'atki_mor': ('aks', 'mor'), 'karisik_pembe': (None, 'pembe')}
TUR_GRUP = {}
with sync_playwright() as pw:
    o = Oturum(pw); p = o.ac(); p.evaluate("localStorage.setItem('kb_ayikla','true')")
    p.click('text=Başla'); p.wait_for_timeout(800)
    dosyalar = [os.path.join('foto', k + '.jpg') for k in BEK]
    p.set_input_files('#dosyaSec', dosyalar)
    dogru_tur = dogru_renk = 0
    for i, ad in enumerate(BEK):
        p.wait_for_selector('.sayfa.acik .buyuk-resim', timeout=15000); p.wait_for_timeout(350)
        if i == 0: o.ekran('10_yeni_kiyafet')
        tahmin = p.inner_text('.sayfa.acik .tahmin')
        secili = p.eval_on_selector_all('.sayfa.acik .cip[aria-pressed="true"]', 'e => e.map(x => x.textContent)')
        renk = p.eval_on_selector_all('.sayfa.acik .renk-cip[aria-pressed="true"]', 'e => e.map(x => x.textContent)')
        oneriler = p.eval_on_selector_all('.sayfa.acik .bolum:first-of-type .sarili:first-of-type .cip', 'e => e.map(x => x.textContent)')
        print(f'{ad:20s} | {tahmin[:46]:46s} | seçili={secili} renk={renk[:1]} öneri={oneriler[:4]}')
        btn = p.locator('.sayfa.acik .alt-bar .btn.ana')
        if btn.is_disabled():
            p.locator('.sayfa.acik .bolum').first.locator('.sarili .cip').first.click(); p.wait_for_timeout(100)
        p.locator('.sayfa.acik .alt-bar .btn.ana').click(); p.wait_for_timeout(700)
    p.wait_for_timeout(500)
    o.ekran('11_dolap_sonra')
    n = p.evaluate("document.querySelectorAll('#uygulama .alt-yazi')[0] && document.querySelector('#uygulama').innerText.length")
    p.click('nav.alt-menu button:nth-child(2)'); p.wait_for_timeout(600)
    o.ekran('12_dolap', tam=False)
    print('dolap:', p.inner_text('.dolap-ust'))
    # bozuk ve metin dosyası
    p.set_input_files('#dosyaSec', ['foto/bozuk.jpg']); p.wait_for_timeout(2500)
    print('bozuk tost:', p.inner_text('#tost'))
    
    print('\n'.join(h[:900] for h in o.hatalar))
    o.kapat()
