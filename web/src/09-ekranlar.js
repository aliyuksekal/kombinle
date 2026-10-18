/* ---------- Ana çizim ---------- */
function ciz() {
  var kok = $('#uygulama');
  try {
    temizle(kok);
    document.documentElement.lang = A.dil;
    if (!A.karsilandi) { $('#altMenu').classList.add('gizli'); kok.appendChild(karsilamaEkrani()); return; }
    $('#altMenu').classList.remove('gizli');
    altMenuCiz();
    kok.appendChild(ustBar());
    if (S.sekme === 'dolap') kok.appendChild(dolapEkrani());
    else if (S.sekme === 'kombin') kok.appendChild(kombinlerEkrani());
    else kok.appendChild(bugunEkrani());
  } catch (e) { hataYakala(e); hataEkrani(kok); }
}
function hataEkrani(kok) {
  temizle(kok);
  kok.appendChild(h('div', { class: 'hata-ekrani' },
    h('h1', { class: 'baslik', text: t('hataBaslik') }), h('p', { class: 'alt-yazi', text: t('hataMetin') }),
    h('button', { class: 'btn ana', style: { 'margin-top': '18px' }, on: { click: function () { location.reload(); } }, text: t('yenidenBaslat') })));
}
function ustBar() {
  return h('header', { class: 'ust' },
    h('div', { class: 'marka', 'aria-label': 'Kombinle' }, ikon('marka'), 'Kombinle'),
    h('div', { style: { display: 'flex', 'align-items': 'center', gap: '4px' } },
      S.pro ? h('span', { class: 'pro-rozet' }, ikon('tac', 'k'), 'Pro')
        : h('button', { class: 'ikon-btn', 'aria-label': t('proBaslik'), style: { color: 'var(--altin)' }, on: { click: proSayfasi } }, ikon('tac')),
      h('button', { class: 'ikon-btn', 'aria-label': t('ayarlar'), on: { click: ayarlarSayfasi } }, ikon('ayar'))));
}
function altMenuCiz() {
  var ic = temizle($('#altMenu .ic'));
  [['bugun', 'isilti', 'sBugun'], ['dolap', 'aski', 'sDolap'], ['kombin', 'kalp', 'sKombin']].forEach(function (x) {
    ic.appendChild(h('button', {
      'aria-current': S.sekme === x[0] ? 'page' : null,
      on: { click: function () { if (S.sekme !== x[0]) { S.sekme = x[0]; ciz(); window.scrollTo(0, 0); } } }
    }, ikon(x[1]), t(x[2])));
  });
}

/* ---------- Karşılama ---------- */
function karsilamaEkrani() {
  var vitrin = h('div', { class: 'masa' },
    h('div', { class: 'sutun' }, vitrinParca('ust', '#E7C3C2', -3), vitrinParca('alt', '#1F2A47', 2)),
    h('div', { class: 'sutun' }, vitrinParca('dis', '#D3BF9E', 3), vitrinParca('ayk', '#1E1D21', -4), vitrinParca('aks', '#AE7A4B', 2)));
  return h('section', { class: 'karsilama' },
    h('div', { class: 'vitrin' }, vitrin),
    h('h1', { text: t('karsilamaBaslik') }),
    h('p', { text: t('karsilamaMetin') }),
    h('button', { class: 'btn ana tam', on: { click: function () { A.karsilandi = true; ayarKaydet(); ciz(); havaYukle(); } }, text: t('basla') }),
    h('button', { class: 'btn ikincil tam', on: { click: function () { A.karsilandi = true; ayarKaydet(); ciz(); havaYukle(); ornekDolapYukle(); } }, text: t('ornekleDene') }));
}
function vitrinParca(ikonAd, renk, aci) {
  var c = document.createElement('canvas'); c.width = c.height = 240;
  cizimIllustrasyon(c, ikonAd, renk);
  var img = h('img', { alt: '' });
  try { img.src = c.toDataURL('image/png'); } catch (e) { }
  return h('div', { class: 'parca', style: { '--aci': aci + 'deg' } }, img);
}
function cizimIllustrasyon(c, ikonAd, renk) {
  var x = c.getContext('2d'), W = c.width;
  var koyu = document.documentElement.getAttribute('data-tema') === 'koyu';
  x.fillStyle = koyu ? '#2D212A' : '#F7F0F2'; x.fillRect(0, 0, W, W);
  var yol = IK[ikonAd] || IK.ust;
  var parcalar = yol.match(/d="([^"]+)"/g) || [];
  x.save(); x.translate(W * 0.14, W * 0.14); x.scale(W * 0.72 / 24, W * 0.72 / 24);
  x.lineJoin = 'round'; x.lineCap = 'round'; x.lineWidth = 0.9;
  var rgb = hexRgb(renk), lum = (rgb[0] * 0.3 + rgb[1] * 0.59 + rgb[2] * 0.11);
  parcalar.forEach(function (m, i) {
    try {
      var p = new Path2D(m.slice(3, -1));
      if (i === 0) { x.fillStyle = renk; x.fill(p); }
      x.strokeStyle = lum > 140 ? 'rgba(60,40,50,.55)' : 'rgba(255,255,255,.35)'; x.stroke(p);
    } catch (e) { }
  });
  x.restore();
}

/* ---------- Bugün ---------- */
function bugunEkrani() {
  var bol = h('section', null);
  var tarih = new Date(); if (S.gun === 1) tarih = new Date(Date.now() + 86400000);
  bol.appendChild(h('h1', { class: 'baslik', text: S.gun === 1 ? t('yarinBaslik') : t('bugunBaslik') }));
  bol.appendChild(h('p', { class: 'alt-yazi', text: tarihYaz(tarih.getTime()) }));
  bol.appendChild(havaKarti());
  var giyim = S.parcalar.filter(function (p) { var g = TUR[p.tur] && TUR[p.tur].g; return g === 'ust' || g === 'alt' || g === 'tek'; });
  if (!S.parcalar.length) { bol.appendChild(bosDolapKarti()); return bol; }
  bol.appendChild(istekKarti());
  if (!giyim.length || (!S.parcalar.some(function (p) { return TUR[p.tur].g === 'tek'; }) &&
    !(S.parcalar.some(function (p) { return TUR[p.tur].g === 'ust'; }) && S.parcalar.some(function (p) { return TUR[p.tur].g === 'alt'; })))) {
    bol.appendChild(h('div', { class: 'kart' }, h('p', { class: 'alt-yazi', text: t('azParca') })));
  }
  var sonucAlani = h('div', { id: 'sonucAlani' });
  bol.appendChild(sonucAlani);
  if (S.sonuc) sonucCiz(sonucAlani);
  return bol;
}
function bosDolapKarti() {
  return h('div', { class: 'kart bos' },
    h('div', { class: 'resim' }, ikon('aski')),
    h('h2', { class: 'baslik', text: t('bosBaslik') }),
    h('p', { class: 'alt-yazi', text: t('bosMetin') }),
    h('div', { class: 'dugmeler' },
      h('button', { class: 'btn ana', on: { click: ekleMenusu } }, ikon('arti'), t('kiyafetEkle')),
      h('button', { class: 'btn ikincil', on: { click: ornekDolapYukle }, text: t('ornekleDene') })));
}
function havaKarti() {
  var k = h('div', { class: 'kart', id: 'havaKarti' });
  var hv = S.hava;
  if (hv.durum === 'yukleniyor' || hv.durum === 'bos') {
    k.appendChild(h('div', { class: 'hava' }, h('div', { class: 'iskelet', style: { width: '96px', height: '58px' } }),
      h('div', null, h('div', { class: 'iskelet', style: { width: '60%', height: '14px', 'margin-bottom': '8px' } }), h('div', { class: 'iskelet', style: { width: '85%', height: '12px' } }))));
    return k;
  }
  if (hv.durum === 'konumYok') {
    k.appendChild(h('h2', { class: 'baslik', text: t('konumBaslik') }));
    k.appendChild(h('p', { class: 'alt-yazi', text: t('konumMetin') }));
    k.appendChild(h('div', { class: 'sarili', style: { 'margin-top': '14px' } },
      h('button', { class: 'btn ana kucuk', on: { click: function () { A.konum = null; ayarKaydet(); havaYukle(true); } } }, ikon('konum', 'k'), t('konumKullan')),
      h('button', { class: 'btn ikincil kucuk', on: { click: sehirSec }, text: t('sehirSec') })));
    k.appendChild(elleHavaSecici());
    return k;
  }
  if (hv.durum === 'hata' && !S.elleHava) {
    k.appendChild(h('h2', { class: 'baslik', text: t('havaHataBaslik') }));
    k.appendChild(h('p', { class: 'alt-yazi', text: t('havaHataMetin') }));
    k.appendChild(h('div', { class: 'sarili', style: { 'margin-top': '12px' } },
      h('button', { class: 'btn ikincil kucuk', on: { click: function () { havaYukle(true); } } }, ikon('yenile', 'k'), t('tekrarDene'))));
    k.appendChild(elleHavaSecici());
    return k;
  }
  var o = aktifHava();
  if (!o) { k.appendChild(elleHavaSecici()); return k; }
  var notlar = h('div', { class: 'notlar' });
  if (o.yagmur || o.yagSaat) notlar.appendChild(h('span', { class: 'etiket uyari' }, ikon('semsiye'), t('etYagmur', Math.round(o.yag * 10) / 10)));
  if (o.kar) notlar.appendChild(h('span', { class: 'etiket uyari' }, ikon('kar'), t('hvKar')));
  if (o.ruzgarli) notlar.appendChild(h('span', { class: 'etiket' }, ikon('ruzgar'), t('etRuzgar', Math.round(o.ruzgar * 3.6))));
  if (Math.abs(Math.round(o.his) - Math.round(o.simdi)) >= 2 && !o.elle) notlar.appendChild(h('span', { class: 'etiket' }, ikon('termometre'), t('etHis', Math.round(o.his))));
  if (A.isi) notlar.appendChild(h('span', { class: 'etiket' }, t(A.isi < 0 ? 'etUsur' : 'etSicaklar')));
  var yer = S.hava.yer ? (S.hava.yer.ad || t('konumun')) : t('konumun');
  k.appendChild(h('div', { class: 'hava' },
    h('div', { class: 'derece' }, ikon(havaIkonu(o.sembol)), (o.elle ? Math.round(o.his) : Math.round(S.gun === 0 ? o.simdi : o.max)) + '°'),
    h('div', { style: { 'min-width': '0' } },
      h('button', { class: 'yer', on: { click: sehirSec }, 'aria-label': t('sehirSec') }, ikon('konum', 'k'), h('span', { text: o.elle ? t('elleSecildi') : yer })),
      h('div', { class: 'durum', text: havaDurumMetni(o) + (o.elle ? '' : ', ' + t('enDusukYuksek', Math.round(o.min), Math.round(o.max))) })),
    notlar.childNodes.length ? notlar : null));
  var seg = h('div', { class: 'seg', role: 'group', 'aria-label': t('gunSec') });
  [[0, 'bugun'], [1, 'yarin']].forEach(function (g) {
    seg.appendChild(h('button', {
      'aria-pressed': S.gun === g[0] ? 'true' : 'false', disabled: o.elle && g[0] === 1 ? true : null,
      on: { click: function () { if (S.gun !== g[0]) { S.gun = g[0]; S.sonuc = null; ciz(); } } }, text: t(g[1])
    }));
  });
  var kaynak = o.elle ? h('button', { class: 'kaynak', on: { click: function () { S.elleHava = null; havaYukle(true); } }, text: t('havayiYenile') })
    : h('span', { class: 'kaynak', text: (o.eski ? t('eskiVeri') + ' ' : '') + t('kaynakMet') });
  k.appendChild(h('div', { class: 'hava-alt' }, seg, kaynak));
  if (o.elle) k.appendChild(elleHavaSecici());
  return k;
}
function elleHavaSecici() {
  var sec = S.elleHava || { sicaklik: '', yagmur: false };
  var kutu = h('div', { class: 'bolum' }, h('span', { class: 'etk', text: t('elleHavaSec') }));
  var sarili = h('div', { class: 'sarili' });
  ['soguk', 'serin', 'ilik', 'sicak'].forEach(function (x) {
    sarili.appendChild(h('button', {
      class: 'cip', 'aria-pressed': sec.sicaklik === x ? 'true' : 'false', text: t('eh_' + x),
      on: { click: function () { S.elleHava = { sicaklik: x, yagmur: sec.yagmur }; S.sonuc = null; ciz(); } }
    }));
  });
  sarili.appendChild(h('button', {
    class: 'cip', 'aria-pressed': sec.yagmur ? 'true' : 'false',
    on: { click: function () { S.elleHava = { sicaklik: sec.sicaklik || 'serin', yagmur: !sec.yagmur }; S.sonuc = null; ciz(); } }
  }, t('eh_yagmur')));
  kutu.appendChild(sarili);
  return kutu;
}
function aktifHava() {
  if (S.elleHava && S.elleHava.sicaklik) return elleHava(S.elleHava);
  if (S.hava.durum !== 'tamam' || !S.hava.kayit) return null;
  var p = S.pencere || { bas: 8, son: 21 };
  return gunOzeti(S.hava.kayit, S.gun, p);
}
function istekKarti() {
  var alan = h('textarea', {
    class: 'istek', id: 'istek', rows: '2', maxlength: '300', placeholder: t('istekYer'), 'aria-label': t('istekEtiket'),
    on: { input: function (e) { S.istek = kirp(e.target.value, 300); } }
  });
  alan.value = S.istek;
  var mik = h('button', { class: 'mik', id: 'mikBtn', 'aria-label': t('sesleSoyle'), on: { click: function () { sesliDinle(alan, mik); } } }, ikon('mik'));
  var cipler = h('div', { class: 'cipler', role: 'group', 'aria-label': t('ortamSec') });
  ['is', 'gunluk', 'davet', 'randevu', 'spor', 'pratik', 'doga', 'seyahat', 'okul', 'plaj', 'taziye'].forEach(function (id) {
    cipler.appendChild(h('button', {
      class: 'cip', 'aria-pressed': S.ortamSecili === id ? 'true' : 'false', text: ortamAd(id),
      on: { click: function (e) { S.ortamSecili = S.ortamSecili === id ? '' : id; $$('.cipler .cip').forEach(function (b) { b.setAttribute('aria-pressed', b === e.currentTarget && S.ortamSecili ? 'true' : 'false'); }); } }
    }));
  });
  var kalan = Math.max(0, UCRETSIZ_HAK - hakKullanilan());
  var btn = h('button', { class: 'btn ana tam', id: 'onerBtn', style: { 'margin-top': '14px' }, on: { click: kombinIste } }, ikon('isilti'), t('kombinOner'));
  return h('div', { class: 'kart' },
    h('h2', { class: 'baslik', text: t('istekBaslik') }),
    h('div', { class: 'istek-alan' }, alan, mik),
    cipler, btn,
    S.pro ? null : h('p', { class: 'hak' }, kalan > 0 ? t('hakKaldi', kalan) : t('hakBitti')));
}

/* ---------- Kombin isteği ---------- */
function hakKullanilan() { return sinirla(LS.al('hak', 0), 0, 1e6) | 0; }
function kombinIste() {
  if (S.mesgul) return;
  var gercek = S.parcalar.filter(function (p) { return !p.ornek; });
  var kalan = UCRETSIZ_HAK - hakKullanilan();
  if (!S.pro && kalan <= 0 && gercek.length) { proSayfasi(); return; }
  var cumle = cumleCoz(S.istek, S.ortamSecili);
  if (cumle.gun >= 0 && cumle.gun !== S.gun && S.hava.durum === 'tamam' && !S.elleHava) S.gun = cumle.gun;
  S.pencere = cumle.pencere;
  var hv = aktifHava();
  if (!hv) {
    tost(t('havaGerek'));
    var hk = $('#havaKarti'); if (hk) hk.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  var o = ORTAMLAR[cumle.ortam];
  var c = {
    o: o, oid: cumle.ortam, f: cumle.f || o.f, h: hv, rahat: cumle.rahat || !!o.rahat, renkli: cumle.renkli, iceriSadece: false,
    tesettur: A.tesettur, renkTercih: cumle.renkTercih, renkKac: cumle.renkKac, turTercih: cumle.turTercih, turKac: cumle.turKac,
    turIstek: cumle.turIstek, metindenOrtam: cumle.metindenOrtam, secildi: !!S.ortamSecili
  };
  if (c.f === 'g' && o.f !== 'g') c.f = o.f;
  S.mesgul = true;
  var btn = $('#onerBtn'); if (btn) { btn.disabled = true; temizle(btn); btn.appendChild(h('span', { class: 'yukleniyor' })); btn.appendChild(document.createTextNode(t('hazirlaniyor'))); }
  setTimeout(function () {
    var sonuc;
    try { sonuc = kombinOner(S.parcalar.filter(function (p) { return TUR[p.tur] && TUR[p.tur].g !== 'ic' || p.tur === 'kulotlu'; }), c); }
    catch (e) { hataYakala(e); sonuc = { kombinler: [] }; }
    S.mesgul = false;
    if (!sonuc.kombinler.length) {
      S.sonuc = null; ciz();
      tost(sonuc.eksik === 'baz' ? t('azParca') : t('kombinYok'));
      return;
    }
    var ornekMi = sonuc.kombinler[0] && kombinParcalari(sonuc.kombinler[0]).every(function (p) { return p.ornek; });
    if (!S.pro && !ornekMi) LS.yaz('hak', hakKullanilan() + 1);
    S.sonuc = { liste: sonuc.kombinler, cumle: cumle, c: c, hv: hv, zaman: Date.now() };
    S.sonucNo = 0; S.kayitli = {};
    ciz();
    var alan = $('#sonucAlani'); if (alan) alan.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 260);
}
function kombinParcalari(k) { return [k.dis, k.kat, k.tek, k.ust, k.alt, k.ayk].concat(k.aks || []).filter(Boolean); }

function sonucCiz(alan) {
  var s = S.sonuc, k = s.liste[S.sonucNo];
  if (!k) return;
  var kart = h('div', { class: 'kart masa-kart' });
  kart.appendChild(h('div', { class: 'masa-ust' },
    h('h2', { class: 'baslik', text: t('onerimiz') }),
    h('span', { class: 'no', text: t('kacinci', S.sonucNo + 1, s.liste.length) })));
  kart.appendChild(masaCiz(k));
  var anl = h('div', { class: 'anladim' });
  anl.appendChild(h('span', { class: 'etiket' }, ikon('isilti'), ortamAd(s.cumle.ortam)));
  var p = s.cumle.pencere;
  if (p.bas !== 8 || p.son !== 21) anl.appendChild(h('span', { class: 'etiket' }, ikon('takvim'), (p.bas < 10 ? '0' : '') + p.bas + ':00–' + (p.son >= 24 ? '24' : p.son) + ':00'));
  s.cumle.renkTercih.slice(0, 2).forEach(function (r) { if (RENK[r]) anl.appendChild(h('span', { class: 'etiket' }, h('i', { style: { width: '10px', height: '10px', 'border-radius': '50%', background: RENK[r].hex, display: 'inline-block' } }), renkAd(r))); });
  s.cumle.turKac.slice(0, 3).forEach(function (r) { anl.appendChild(h('span', { class: 'etiket' }, ikon('kapat', 'k'), turAd(r))); });
  if (s.c.tesettur) anl.appendChild(h('span', { class: 'etiket' }, ikon('esarp'), t('tesetturKisa')));
  kart.appendChild(anl);
  var ul = h('ul', { class: 'nedenler' });
  k.nedenler.forEach(function (n) { ul.appendChild(h('li', null, ikon(n.i, 'k'), h('span', { text: n.m }))); });
  kart.appendChild(ul);
  var kayit = S.kayitli[S.sonucNo];
  var giy = h('button', {
    class: 'btn ana', disabled: kayit && kayit.giyildi ? true : null,
    on: { click: function () { kombinKaydet(k, true); } }
  }, ikon('tik'), kayit && kayit.giyildi ? t('kaydedildi') : t('bunuGiy'));
  var baska = h('button', {
    class: 'ikon-btn', 'aria-label': t('baskaOner'), title: t('baskaOner'),
    on: { click: function () { S.sonucNo = (S.sonucNo + 1) % s.liste.length; if (S.sonucNo === 0) tost(t('hepsiniGordun')); ciz(); var a = $('#sonucAlani'); if (a) a.scrollIntoView({ block: 'start' }); } }
  }, ikon('yenile'));
  var fav = h('button', {
    class: 'ikon-btn', 'aria-label': t('favori'), 'aria-pressed': kayit && kayit.fav ? 'true' : 'false',
    on: { click: function () { kombinKaydet(k, false); } }
  }, ikon('kalp'));
  kart.appendChild(h('div', { class: 'eylemler' }, giy, s.liste.length > 1 ? baska : h('span'), fav));
  alan.appendChild(kart);
}
function masaCiz(k) {
  var parca = function (p, uzun, aci) {
    if (!p) return null;
    return h('button', {
      class: 'parca' + (uzun ? ' uzun' : ''), style: { '--aci': aci + 'deg' }, 'aria-label': parcaAd(p),
      on: { click: function () { parcaDuzenle(p, null); } }
    }, resimEl(p.id, false, null, parcaAd(p)), h('span', { class: 'ad', text: turAd(p.tur) }));
  };
  var sol = h('div', { class: 'sutun' }), sag = h('div', { class: 'sutun' });
  if (k.tek) sol.appendChild(parca(k.tek, true, -2));
  else { sol.appendChild(parca(k.ust, false, -2.5)); sol.appendChild(parca(k.alt, true, 1.5)); }
  var ustSag = k.dis || k.kat;
  if (ustSag) sag.appendChild(parca(ustSag, false, 3));
  if (k.dis && k.kat) sag.appendChild(parca(k.kat, false, -2));
  if (k.ayk) sag.appendChild(parca(k.ayk, false, -3.5));
  var kucukler = (k.aks || []).slice(0, 6);
  if (kucukler.length) {
    var kp = h('div', { class: 'kucuk-parcalar' });
    kucukler.forEach(function (a, i) { kp.appendChild(parca(a, false, i % 2 ? 3 : -3)); });
    sag.appendChild(kp);
  }
  if (!sag.childNodes.length) sag.appendChild(h('div'));
  return h('div', { class: 'masa' }, sol, sag);
}
function kombinKaydet(k, giyildi) {
  var g = gecmisAl(), no = S.sonucNo, kayit = S.kayitli[no];
  var ids = kombinParcalari(k).map(function (p) { return p.id; });
  if (!kayit) {
    kayit = { id: yeniId(), tarih: Date.now(), p: ids, o: S.sonuc.cumle.ortam, m: kirp(S.istek, 80), fav: false, giyildi: false,
      h: { min: Math.round(S.sonuc.hv.min), max: Math.round(S.sonuc.hv.max), s: S.sonuc.hv.sembol } };
    g.unshift(kayit);
  } else {
    var mevcut = g.filter(function (x) { return x.id === kayit.id; })[0];
    if (mevcut) kayit = mevcut; else g.unshift(kayit);
  }
  if (giyildi) {
    if (kayit.giyildi) return;
    kayit.giyildi = true;
    var simdi = Date.now();
    S.parcalar.forEach(function (p) {
      if (ids.indexOf(p.id) >= 0) { p.son = simdi; p.giy = sinirla((p.giy || 0) + 1, 0, 99999); Depo.parcaYaz(p).catch(hataYakala); }
    });
    tost(t('giyildiTost'));
  } else {
    kayit.fav = !kayit.fav;
    tost(kayit.fav ? t('favEklendi') : t('favCikti'));
  }
  if (!kayit.fav && !kayit.giyildi) g = g.filter(function (x) { return x.id !== kayit.id; });
  gecmisYaz(g);
  S.kayitli[no] = kayit.fav || kayit.giyildi ? kayit : null;
  ciz();
}
