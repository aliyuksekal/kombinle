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
    else if (S.sekme === 'kesfet') kok.appendChild(kesfetEkrani());
    else if (S.sekme === 'ayarlar') kok.appendChild(ayarlarEkrani());
    else kok.appendChild(bugunEkrani());
    /* Keşfet akışı karosel gibi: her kaydırmada bir paylaşım yerine oturur */
    document.documentElement.classList.toggle('akis-karosel', S.sekme === 'kesfet');
  } catch (e) { hataYakala(e); hataEkrani(kok); }
}
function hataEkrani(kok) {
  temizle(kok);
  kok.appendChild(h('div', { class: 'hata-ekrani' },
    h('h1', { class: 'baslik', text: t('hataBaslik') }), h('p', { class: 'alt-yazi', text: t('hataMetin') }),
    h('button', { class: 'btn ana', style: { 'margin-top': '18px' }, on: { click: function () { location.reload(); } }, text: t('yenidenBaslat') })));
}
/* ---------- Karşılama ---------- */
function karsilamaEkrani() {
  var vitrin = h('img', { class: 'logo-tam', src: LOGO_TAM, alt: 'Kombinle' });
  return h('section', { class: 'karsilama' },
    h('div', { class: 'vitrin' }, vitrin),
    h('h1', { text: t('karsilamaBaslik') }),
    h('p', { text: t('karsilamaMetin') }),
    h('div', { class: 'kimin-karsilama' }, h('b', { text: t('kiminBaslik') }), kiminSeg(function () { ciz(); })),
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
  x.fillStyle = koyu ? '#262328' : '#F0EEF2'; x.fillRect(0, 0, W, W);
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
function bosDolapKarti() {
  return h('div', { class: 'kart bos' },
    h('div', { class: 'resim' }, ikon('aski')),
    h('h2', { class: 'baslik', text: t('bosBaslik') }),
    h('p', { class: 'alt-yazi', text: t('bosMetin') }),
    h('div', { class: 'dugmeler' },
      h('button', { class: 'btn ana', on: { click: ekleMenusu } }, ikon('arti'), t('kiyafetEkle')),
      h('button', { class: 'btn ikincil', on: { click: ornekDolapYukle }, text: t('ornekleDene') })));
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
/* ---------- Kombin isteği ---------- */
function kombinIste() {
  if (S.mesgul) return;
  var gercek = S.parcalar.filter(function (p) { return !p.ornek; });
  if (gercek.length && !ozIzin('kombin')) return;
  if (!S.ortamTik) akilliOrtam();
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
  var tm = S.tarzMod || '';
  if (tm === 'sik') c.f = (cumle.ortam === 'is' || cumle.ortam === 'taziye') ? 'r' : 's';
  else if (tm === 'rahat') { c.rahat = true; if (c.f !== 'r') c.f = cumle.ortam === 'davet' ? c.f : 'g'; }
  else if (tm === 'minimal') c.minimal = true;
  else if (tm === 'renkli') c.renkli = true;
  c.tarzMod = tm;
  var tekrar = tekrarHaritasi(S.kimle);
  c.bonus = paletBonusu(tekrarBonusu({}, tekrar));
  c.tekrar = tekrar;
  S.mesgul = true;
  var btn = $('#onerBtn'); if (btn) { btn.disabled = true; temizle(btn); btn.appendChild(h('span', { class: 'yukleniyor' })); btn.appendChild(document.createTextNode(t('hazirlaniyor'))); }
  function yerel() {
    var sonuc = null;
    try {
      if (A.kendiMod) { var kl = kendiKombinlerdenOner(c); if (kl.length) sonuc = { kombinler: kl }; else tost(t('kendiYok')); }
      if (!sonuc) sonuc = kombinOner(oneriParcalari(), c);
    }
    catch (e) { hataYakala(e); sonuc = { kombinler: [] }; }
    return sonuc;
  }
  function bitir(sonuc, havaNotu) {
    S.mesgul = false;
    if (!sonuc.kombinler.length) {
      S.sonuc = null; ciz();
      tost(sonuc.eksik === 'baz' ? t('azParca') : t('kombinYok'));
      return;
    }
    var ornekMi = sonuc.kombinler[0] && kombinParcalari(sonuc.kombinler[0]).every(function (p) { return p.ornek; });
    if (!ornekMi) ozKullan('kombin');
    S.sonuc = { liste: sonuc.kombinler, cumle: cumle, c: c, hv: hv, zaman: Date.now(), havaNotu: havaNotu || '', tekrar: tekrar };
    S.sonucNo = 0; S.kayitli = {};
    ciz();
    var alan = $('#sonucAlani'); if (alan) alan.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  /* Kombinle AI: gerçek dolapta en az 3 parça varsa önce yapay zekâ denenir; olmazsa cihaz içi stilist */
  if (yzAcik() && !A.kendiMod && gercek.length >= 3) {
    if (btn) { temizle(btn); btn.appendChild(h('span', { class: 'yukleniyor' })); btn.appendChild(document.createTextNode(t('yzDusunuyor'))); }
    yzKombin(c, cumle, hv).then(function (r) {
      if (r) { bitir({ kombinler: r.kombinler }, r.havaNotu); return; }
      tost(t('yzYedek')); bitir(yerel());
    }).catch(function (e) {
      tost(yzHataMetni(e, t('yzYedek'))); bitir(yerel());
    });
    return;
  }
  setTimeout(function () { bitir(yerel()); }, 260);
}
function kombinParcalari(k) { return [k.dis, k.kat, k.tek, k.ust, k.alt, k.ayk].concat(k.aks || []).filter(Boolean); }

function masaCiz(k) {
  var parca = function (p, uzun, aci) {
    if (!p) return null;
    return h('button', {
      class: 'parca' + (uzun ? ' uzun' : '') + (p.kesik ? ' kesik' : ''), style: { '--aci': aci + 'deg' }, 'aria-label': parcaAd(p),
      on: { click: function () { parcaDuzenle(p, null); } }
    }, resimEl(p.id, false, null, parcaAd(p)), h('span', { class: 'ad', text: turAd(p.tur) }));
  };
  var sol = h('div', { class: 'sutun' }), sag = h('div', { class: 'sutun' });
  if (k.tek) ekle(sol, parca(k.tek, true, -2));
  else { ekle(sol, parca(k.ust, false, -2.5)); ekle(sol, parca(k.alt, true, 1.5)); }
  var ustSag = k.dis || k.kat;
  if (ustSag) ekle(sag, parca(ustSag, false, 3));
  if (k.dis && k.kat) ekle(sag, parca(k.kat, false, -2));
  if (k.ayk) ekle(sag, parca(k.ayk, false, -3.5));
  var kucukler = (k.aks || []).slice(0, 6);
  if (kucukler.length) {
    var kp = h('div', { class: 'kucuk-parcalar' });
    kucukler.forEach(function (a, i) { ekle(kp, parca(a, false, i % 2 ? 3 : -3)); });
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
    var kid = kayit.id;
    setTimeout(function () { giyimCevresiKaydet(kid); }, 500);
  } else {
    kayit.fav = !kayit.fav;
    tost(kayit.fav ? t('favEklendi') : t('favCikti'));
  }
  if (!kayit.fav && !kayit.giyildi) g = g.filter(function (x) { return x.id !== kayit.id; });
  gecmisYaz(g);
  S.kayitli[no] = kayit.fav || kayit.giyildi ? kayit : null;
  ciz();
}
