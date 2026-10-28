/* ---------- Ayarlar ---------- */
var A = {
  dil: 'tr', tema: 'oto', titre: false, titreKuvvet: 60,
  birim: 'c', km: true, hesapli: true, canliDuvar: true, uygulama: '',
  profilGor: 'herkes', bildirimEtk: true, rozetEtk: false,
  kombinParca: 'oto', kolajTema: 'oto', kolajRenk: 'oto',
  tusSesi: true, konumHatirlat: true, arama: false, widgetParca: 4, temaRenk: '', temaRenk2: '',
  pro: false
};
try { var A_ESKI = LS.al('ayar', {}); Object.keys(A).forEach(function (k) { if (k in A_ESKI) A[k] = A_ESKI[k]; }); } catch (e) { }
function ayarKaydet() { try { LS.yaz('ayar', A); } catch (e) { } }
function ayarYukle() {
  try { var x = LS.al('ayar', {}); Object.keys(A).forEach(function (k) { if (k in x) A[k] = x[k]; }); } catch (e) { }
}
function temaUygula() {
  var koyu = A.tema === 'koyu' || (A.tema === 'oto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.body.classList.toggle('koyu', koyu);
  var r = document.documentElement.style, b = getComputedStyle(document.body);
  r.setProperty('--tema', b.getPropertyValue('--tema'));
  r.setProperty('--tema2', b.getPropertyValue('--tema2'));
  r.setProperty('--tema3', b.getPropertyValue('--tema3'));
  r.setProperty('--tema-metin', b.getPropertyValue('--tema-metin'));
  r.setProperty('--kart', b.getPropertyValue('--kart'));
  r.setProperty('--zemin', b.getPropertyValue('--zemin'));
}
function mevsimTemaUygula() {
  /* oto temada günün saatine göre gökkuşağı tonu; canlı duvar kağıdı açıksa görsellik korunur */
  if (A.tema !== 'oto') { temaUygula(); return; }
  var saat = new Date().getHours(), ton = saat < 6 ? 290 : saat < 12 ? 25 : saat < 18 ? 205 : 335;
  document.documentElement.style.setProperty('--tema', 'hsl(' + ton + ', 62%, 52%)');
  document.documentElement.style.setProperty('--tema2', 'hsl(' + ((ton + 40) % 360) + ', 70%, 46%)');
  document.documentElement.style.setProperty('--tema3', 'hsl(' + ((ton + 80) % 360) + ', 75%, 44%)');
  document.documentElement.style.setProperty('--kart', 'hsl(' + ((ton + 340) % 360) + ', 55%, 96%)');
}
function temaSecimi() {
  var dilSec = h('select', { 'aria-label': t('dilSec') });
  Object.keys(DIL).forEach(function (d) { var o = h('option', { value: d, text: DIL[d]._ad }); if (A.dil === d) o.selected = true; dilSec.appendChild(o); });
  dilSec.addEventListener('change', function (e) {
    A.dil = e.target.value; ayarKaydet();
    var q = katla(S.ara.toLocaleLowerCase('tr'));
    ciz();
    if (S.ara) { S.ara = ''; var g = $('.g-ara-satir input'); if (g) g.value = ''; }
    tost(t('dilDegisti'));
  });
  var g = h('div', { class: 'ayar-grup' });
  [['oto', 'temaOto'], ['acik', 'temaAcik'], ['koyu', 'temaKoyu']].forEach(function (x) {
    g.appendChild(h('button', { class: 'satir' + (A.tema === x[0] ? ' secili' : ''), 'aria-pressed': A.tema === x[0] ? 'true' : 'false', on: { click: function () {
      A.tema = x[0]; ayarKaydet(); mevsimTemaUygula(); ciz();
    } } }, h('span', { class: 'sol' }, ikon('grafik', 'k'), t(x[1])), ikon('sag', 'k')));
  });
  return h('div', null,
    h('div', { class: 'ayar-kart' }, h('div', { class: 'ayar-kart-bas' }, h('b', { text: t('dilSec') })), dilSec),
    h('div', { class: 'ayar-kart' }, h('div', { class: 'ayar-kart-bas' }, h('b', { text: t('temaSec') })), g));
}
function anahtarSatir(ad, alt, acik, fn) {
  var b = h('button', { class: 'anahtar' + (acik ? ' acik' : ''), role: 'switch', 'aria-checked': acik ? 'true' : 'false', 'aria-label': ad });
  b.appendChild(h('span', { class: 'kizak' }));
  var dur = h('small', { class: 'anahtar-durum', text: acik ? t('acik') : t('kapali') });
  b.addEventListener('click', function () {
    acik = !acik; b.classList.toggle('acik', acik); b.setAttribute('aria-checked', acik ? 'true' : 'false'); dur.textContent = acik ? t('acik') : t('kapali');
    if (fn) fn(acik);
  });
  var sat = h('div', { class: 'satir' }, h('span', { class: 'sol' }, h('div', null, ad, alt ? h('small', { text: alt }) : null), dur), b);
  return sat;
}
function satir(ik, ad, alt, fn) {
  return h('button', { class: 'satir', on: { click: fn } }, h('span', { class: 'sol' }, ikon(ik, 'k'), h('div', null, ad, alt ? h('small', { text: alt }) : null)), ikon('sag', 'k'));
}
function menuSatir(ik, ad, alt, fn) { return satir(ik, ad, alt, fn); }
function ayarlarEkrani() { return ayarGovde(); }
function ayarGovde() {
  var gov = h('div', { class: 'ayar-govde' });
  /* hesap kartı: giriş yapılmışsa profil, jeton; değilse giriş */
  var hb = hesapBilgi();
  var hesapKart = h('div', { class: 'ayar-kart hesap-kart' });
  var girisYazi = h('button', { class: 'satir', 'data-odak': '1', on: { click: function () { S.ayarAcik = S.ayarAcik || {}; S.ayarAcik.hesap = true; ayarlarSayfasi(); } } },
    h('span', { class: 'sol' }, ikon('kisi', 'k'), h('div', null, t('hGiris'), h('small', { text: t('hGirisAlt') }))), ikon('sag', 'k')));
  if (hb) {
    temizle(hesapKart);
    hesapKart.appendChild(h('div', { class: 'ayar-kart-bas' }, h('b', { text: t('hesabim') })));
    var profilSatir = h('button', { class: 'satir hesap-profil', on: { click: function () { benimProfilim(); } } },
      avatarDoldur(h('span', { class: 'g-avatar' }), benimAvatar(), hb.ad),
      h('span', { class: 'sol' }, h('div', null, h('b', { text: hb.ad || '' }), h('small', { text: hb.kadi || '' }))));
    hesapKart.appendChild(profilSatir);
    hesapKart.appendChild(h('button', { class: 'satir', on: { click: function () { magazaSayfasi(); } } },
      h('span', { class: 'sol' }, ikon('zap', 'k'), h('div', null, t('magazaBaslik'), h('small', { text: t('jetonSay', jeton()) }))), ikon('sag', 'k')));
    if (S.pro) hesapKart.appendChild(h('div', { class: 'satir pro-satir' }, h('span', { class: 'sol' }, ikon('isilti', 'k'), h('div', null, t('rozet'), h('small', { text: t('proAktifAlt') }))), ikon('tik', 'k')));
    hesapKart.appendChild(h('button', { class: 'satir', on: { click: function () { profilDuzenle(); } } },
      h('span', { class: 'sol' }, ikon('kalem', 'k'), h('div', null, t('profilDuzenle'))), ikon('sag', 'k')));
    hesapKart.appendChild(h('button', { class: 'satir', on: { click: function () { bildirimSayfasi(); } } },
      h('span', { class: 'sol' }, ikon('zil', 'k'), h('div', null, t('bildirimler'))), ikon('sag', 'k')));
    hesapKart.appendChild(h('button', { class: 'satir', on: { click: function () { gizlilikSatiriAc(); } } },
      h('span', { class: 'sol' }, ikon('kilit', 'k'), h('div', null, t('gizlilik'))), ikon('sag', 'k')));
    hesapKart.appendChild(h('button', { class: 'satir', on: { click: function () { engellenenlerSayfasi(); } } },
      h('span', { class: 'sol' }, ikon('kapat', 'k'), h('div', null, t('engellenenler'))), ikon('sag', 'k')));
    hesapKart.appendChild(h('button', { class: 'satir', on: { click: function () { dmAyarlariSayfasi(); } } },
      h('span', { class: 'sol' }, ikon('gonder', 'k'), h('div', null, t('dmAyarlari'))), ikon('sag', 'k')));
    hesapKart.appendChild(h('button', { class: 'satir', on: { click: function () { reklamBasvurularim(); } } },
      h('span', { class: 'sol' }, ikon('grafik', 'k'), h('div', null, t('reklamBasvurularim'))), ikon('sag', 'k')));
    hesapKart.appendChild(h('button', { class: 'satir', on: { click: function () { hesapCikis(); } } },
      h('span', { class: 'sol' }, ikon('indir', 'k'), h('div', null, t('cikisYap'))), ikon('sag', 'k')));
  } else {
    temizle(hesapKart);
    hesapKart.appendChild(h('div', { class: 'ayar-kart-bas' }, h('b', { text: t('hesabim') })));
    hesapKart.appendChild(girisYazi);
  }
  gov.appendChild(hesapKart);
  /* tema ve görünüm kartı */
  gov.appendChild(h('div', { class: 'ayar-kart' }, h('div', { class: 'ayar-kart-bas' }, h('b', { text: t('gorunum') })), temaSecimi()));
  /* birim ve konum kartı */
  var birimKart = h('div', { class: 'ayar-kart' });
  birimKart.appendChild(h('div', { class: 'ayar-kart-bas' }, h('b', { text: t('olcuBirim') })));
  var birimSec = h('div', { class: 'seg', role: 'group' });
  [['c', 'celsius'], ['f', 'fahrenheit']].forEach(function (x) {
    birimSec.appendChild(h('button', { 'aria-pressed': A.birim === x[0] ? 'true' : 'false', text: x[1], on: { click: function () {
      A.birim = x[0]; ayarKaydet(); ciz();
    } } }));
  });
  birimKart.appendChild(birimSec);
  var konumSatir = h('button', { class: 'satir', on: { click: function () { sehirSec(); } } },
    h('span', { class: 'sol' }, ikon('konum', 'k'), h('div', null, t('sehirSec'), h('small', { text: (A.konum && A.konum.ad) || t('konumYok') }))), ikon('sag', 'k'));
  birimKart.appendChild(konumSatir);
  birimKart.appendChild(anahtarSatir(t('konumHatirlat'), t('konumHatirlatAlt'), A.konumHatirlat, function (v) { A.konumHatirlat = v; ayarKaydet(); }));
  gov.appendChild(birimKart);
  /* sosyal kartı: paylaşım, bildirim, profil */
  var sosyalKart = h('div', { class: 'ayar-kart' });
  sosyalKart.appendChild(h('div', { class: 'ayar-kart-bas' }, h('b', { text: t('sosyal') })));
  sosyalKart.appendChild(satir('paylas', t('paylasSoru'), t('paylasAlt'), function () { paylasPaneliAc(); }));
  sosyalKart.appendChild(anahtarSatir(t('bildirimEtkin'), t('bildirimEtkinAlt'), A.bildirimEtk, function (v) { A.bildirimEtk = v; ayarKaydet(); if (v) bildirimIzinIste(); }));
  sosyalKart.appendChild(anahtarSatir(t('rozetEtkin'), t('rozetEtkinAlt'), A.rozetEtk, function (v) { A.rozetEtk = v; ayarKaydet(); }));
  sosyalKart.appendChild(satir('kisi', t('profilim'), t('profilimAlt'), function () { benimProfilim(); }));
  gov.appendChild(sosyalKart);
  /* duygu kartı: titreşim, ses, tema rengi */
  var duyguKart = h('div', { class: 'ayar-kart' });
  duyguKart.appendChild(h('div', { class: 'ayar-kart-bas' }, h('b', { text: t('duygu') })));
  duyguKart.appendChild(anahtarSatir(t('titreEtkin'), t('titreEtkinAlt'), A.titre, function (v) { A.titre = v; ayarKaydet(); titre(v ? 40 : 0); }));
  duyguKart.appendChild(anahtarSatir(t('tusSesiEtkin'), t('tusSesiEtkinAlt'), A.tusSesi, function (v) { A.tusSesi = v; ayarKaydet(); }));
  duyguKart.appendChild(satir('palet', t('temaRengi'), t('temaRengiAlt'), function () { temaRenkSec(); }));
  gov.appendChild(duyguKart);
  /* veri kartı: yedekle, geri yükle, sıfırla */
  var veriKart = h('div', { class: 'ayar-kart' });
  veriKart.appendChild(h('div', { class: 'ayar-kart-bas' }, h('b', { text: t('veriler') })));
  veriKart.appendChild(satir('yukle', t('yedekAl'), t('yedekAlAlt'), function () { yedekAl(); }));
  veriKart.appendChild(satir('indir', t('yedekYukle'), t('yedekYukleAlt'), function () { yedekYukle(); }));
  veriKart.appendChild(satir('cop', t('veriSifirla'), t('veriSifirlaAlt'), function () { veriSifirla(); }));
  gov.appendChild(veriKart);
  /* YENİ (34): geliştirici kartı — yalnız uygulama sahibi görür */
  if (typeof sahipMi === 'function' && sahipMi()) {
    gov.appendChild(h('div', { class: 'ayar-kart' }, h('div', { class: 'ayar-kart-bas' }, h('b', { text: t('glBaslik') })),
      h('div', { class: 'ayar-grup' }, satir('kisi', t('glKayitlar'), null, function () { gelistiriciSayfasi(0); }))));
  }
  gov.appendChild(h('p', { class: 'alt-yazi', style: { 'margin-top': '18px', 'font-size': '12px', 'text-align': 'center', 'white-space': 'pre-line' }, text: t('hakkinda') + '\n' + 'Kombinle ' + (YEREL && YEREL.surum ? kirp(YEREL.surum(), 20) : SURUM) + ', matali. ' + t('kaynakMetUzun') + (modelVar() ? ' ' + t('kaynakModel') : '') }));
  return gov;
}
function gizlilikSatiriAc() {
  var gov = h('div', { class: 'ayar-govde' });
  gov.appendChild(h('div', { class: 'ayar-kart' }, h('div', { class: 'ayar-kart-bas' }, h('b', { text: t('gizlilik') })), gizlilikSatiri()));
  gov.appendChild(h('div', { class: 'ayar-kart' }, h('div', { class: 'ayar-kart-bas' }, h('b', { text: t('engellenenler') })), engellenenlerListesi()));
  sayfaAc({ baslik: t('gizlilik'), icerik: gov });
}
function engellenenlerSayfasi() { gizlilikSatiriAc(); }
function engellenenlerListesi() {
  var gov = h('div', { class: 'tk-liste' });
  var l = engelliler();
  if (!l.length) { gov.appendChild(h('p', { class: 'alt-yazi', text: t('engelliYok') })); return gov; }
  l.forEach(function (kod) {
    var sat = h('div', { class: 'tk-satir' },
      h('button', { class: 'tk-ac', on: { click: function () { profilSayfasi(kod); } } }, avatarDoldur(h('span', { class: 'g-avatar' }), kisiAvatar(kod, 0, '?'), '?'),
        h('div', null, h('b', { text: kod }), h('small', { text: '' }))),
      h('button', { class: 'g-takip', 'aria-label': t('engelKaldir'), on: { click: function () { engelKaldir(kod); sat.remove(); tost(t('engelKaldirildi')); } } }, t('engelKaldir')));
    gov.appendChild(sat);
  });
  return gov;
}
function yedekAl() {
  var veri = {};
  Object.keys(LS.tum()).forEach(function (k) { if (k.indexOf('gs_') !== 0 && k.indexOf('jeton') !== 0 && k.indexOf('hesap') !== 0) veri[k] = LS.al(k, null); });
  var blob = new Blob([JSON.stringify(veri)], { type: 'application/json' });
  var a = h('a', { href: URL.createObjectURL(blob), download: 'kombinle-yedek.json' });
  a.click();
  tost(t('yedekAlindi'));
}
function yedekYukle() {
  var girdi = h('input', { type: 'file', accept: 'application/json', style: { display: 'none' } });
  girdi.addEventListener('change', function () {
    var f = girdi.files[0];
    if (!f) return;
    var oku = new FileReader();
    oku.onload = function () {
      try {
        var v = JSON.parse(oku.result);
        Object.keys(v).forEach(function (k) { LS.yaz(k, v[k]); });
        tost(t('yedekYuklendi')); ciz();
      } catch (e) { tost(t('yedekHata')); }
    };
    oku.readAsText(f);
  });
  document.body.appendChild(girdi); girdi.click();
}
function veriSifirla() {
  var s = sayfaAc({ baslik: t('veriSifirla'), icerik: h('div', null, h('p', { class: 'alt-yazi', text: t('veriSifirlaEmin') }),
    h('button', { class: 'btn ana', style: { width: '100%', 'margin-top': '14px' }, on: { click: function () { try { LS.temizle(); } catch (e) { } tost(t('veriSifirlandi')); setTimeout(function () { location.reload(); }, 800); } } }, t('evetSifirla'))) });
}
function temaRenkSec() {
  var renkler = ['', '#f97316', '#ef4444', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899'];
  var gov = h('div', { class: 'ayar-grup' });
  var izgara = h('div', { style: { display: 'grid', 'grid-template-columns': 'repeat(4, 1fr)', gap: '10px', padding: '8px' } });
  renkler.forEach(function (r) {
    var b = h('button', { class: 'satir', style: { 'justify-content': 'center', background: r || 'var(--kart)', border: r ? '2px solid ' + r : '2px dashed var(--sinir)' }, on: { click: function () {
      A.temaRenk = r; ayarKaydet(); temaUygulaRenk(); tost(t('kaydedildi')); s.kapat();
    } } }, r ? '' : t('oto'));
    izgara.appendChild(b);
  });
  gov.appendChild(izgara);
  var s = sayfaAc({ baslik: t('temaRengi'), icerik: gov });
}
function temaUygulaRenk() {
  var r = document.documentElement.style;
  if (A.temaRenk) { r.setProperty('--tema', A.temaRenk); r.setProperty('--tema2', A.temaRenk); r.setProperty('--tema3', A.temaRenk); }
  else mevsimTemaUygula();
}
