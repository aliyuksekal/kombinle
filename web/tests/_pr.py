import sys, os; sys.path.insert(0, '.')
from ortak import *
SAHTE = open('ozellikler.py').read().split('SAHTE = r"""')[1].split('"""')[0]
SAHTE = SAHTE.replace("if (yol === '/v1/akis')", "if (yol === '/v1/profilgor') return tamam({profil: {kod: '0123456789ab', takma: 'Elif', kadi: 'elif', bio: 'Minimal', av: 0, takipci: 12, takip: 30, paylasim: 2, takipte: 0, benim: 1}});\n    if (yol === '/v1/akis')")
with sync_playwright() as pw:
    o = Oturum(pw, koyu=True); o.ctx.add_init_script(SAHTE); p = o.ac()
    p.click('text=Başla'); p.wait_for_timeout(600)
    p.click('.g-avatar, #ustAvatar, header button[aria-label]') if False else None
    p.evaluate("1")
    p.click('.g-hesap'); p.wait_for_timeout(1200)
    print(p.inner_text('.sayfa.acik')[:400])
    o.ekran('dbg_profil')
    o.kapat()
