/* ---------- Kombinle AI ve Topluluk ----------
   Yapay zekâ ve topluluk istekleri telefonun köprüsü üzerinden Kombinle sunucusuna gider.
   Sayfa sunucu adresini ya da anahtarı hiç görmez; istekleri telefon imzalar.
   İnternet ya da sunucu yoksa her şey cihaz içi stiliste döner. */

function yzKurulu() { try { return !!(YEREL && typeof YEREL.yzVar === 'function' && YEREL.yzVar()); } catch (e) { return false; } }
function yzAcik() { return yzKurulu() && A.yz !== false; }
function sunucuAdres() {
  try {
    var u = YEREL && typeof YEREL.sunucu === 'function' ? String(YEREL.sunucu() || '') : '';
    return /^https:\/\/[a-z0-9.-]{3,120}$/i.test(u) ? u : '';
  } catch (e) { return ''; }
}
function yzIste(yol, govde, ms) {
  return yerelCagir('api', [yol, JSON.stringify(govde)], ms || 45000).then(function (d) {
    var v = d && d.veri;
    if (!d || !d.ok || !v || typeof v !== 'object' || v.ok === false) {
      var e = new Error((v && typeof v.hata === 'string' && v.hata) || (d && d.hata) || 'ag');
      e.veri = v && typeof v === 'object' ? v : null;
      throw e;
    }
    return v;
  });
}
function yzHataMetni(e, varsayilan) {
  var k = e && e.message;
  if (k === 'kota') return t('yzKota');
  if (k === 'engelli') return t('engellendin');
  return varsayilan;
}

/* ---------- Tanıma ---------- */
function yzTurListesi() {
  return TURLER.filter(function (x) { return /^[a-z0-9_]{1,24}$/.test(x.id); }).slice(0, 160)
    .map(function (x) { return [x.id, kirp(A.dil === 'en' ? (x.en || x.tr) : x.tr, 30)]; });
}
function yzRenkListesi() { return RENKLER.map(function (r) { return [r[0], A.dil === 'en' ? r[3] : r[2]]; }); }
function yzTani(b64) {
  return yzIste('/v1/tani', { resim: b64, turler: yzTurListesi(), renkler: yzRenkListesi(), dil: A.dil }, 30000)
    .then(function (v) { return v.sonuc; });
}
function bulutBirlestir(an, s) {
  if (!an || !s || typeof s !== 'object' || s.kiyafet !== true || !TUR[s.tur] || !sayiMi(s.guven) || s.guven < 0.4) return;
  var alt = Array.isArray(s.alternatifler) ? s.alternatifler.filter(function (x, i, d) { return typeof x === 'string' && TUR[x] && x !== s.tur && d.indexOf(x) === i; }) : [];
  an.turlar = [s.tur].concat(alt, (an.turlar || []).filter(function (x) { return x !== s.tur && alt.indexOf(x) < 0; })).slice(0, 4);
  an.grup = TUR[s.tur].g;
  an.guven = s.guven >= 0.6 ? Math.max(an.guven || 0, Math.min(1, s.guven)) : Math.min(an.guven || 0, 0.49);
  if (RENK[s.renk]) an.renk = s.renk;
  an.renk2 = typeof s.renk2 === 'string' && RENK[s.renk2] && s.renk2 !== an.renk ? s.renk2 : '';
  if (typeof s.desenli === 'boolean') an.desen = s.desenli ? 1 : 0;
  if (Array.isArray(s.mevsim)) an.mevsim = mevsimTemizle(s.mevsim.filter(function (x) { return typeof x === 'string'; }).join(''));
  if (Array.isArray(s.tarz)) an.tarz = tarzTemizle(s.tarz.filter(function (x) { return typeof x === 'string'; }).join(''));
  if (typeof s.su === 'boolean') an.su = s.su ? 1 : 0;
  an.oneriAd = kirp(s.ad, 40);
  an.kumas = kirp(s.kumas, 30);
  an.yz = true; an.bulut = true; an.sekilYok = false;
}

/* ---------- Akıllı kombin ---------- */
function yzParcaListesi() {
  return S.parcalar.filter(function (p) { return !p.ornek && TUR[p.tur] && /^[A-Za-z0-9_-]{4,40}$/.test(p.id); }).slice(0, 300).map(function (p) {
    return { i: p.id, t: p.tur, tr: kirp(turAd(p.tur), 30), r: p.renk, r2: p.renk2 || '', a: kirp(p.ad || '', 40), m: p.mevsim || '',
      z: p.tarz || TUR[p.tur].s || '', g: p.giy | 0, d: p.dinlen ? 1 : 0, su: p.su ? 1 : 0, k: TUR[p.tur].g };
  });
}
function bir(x) { return sayiMi(x) ? Math.round(x * 10) / 10 : null; }
function yzHava(hv) {
  var o = { yer: kirp((S.hava.yer && S.hava.yer.ad) || '', 60), durum: '', simdi: bir(hv.simdi), min: bir(hv.min), max: bir(hv.max),
    his: bir(sayiMi(hv.kisisel) ? hv.kisisel : hv.his), yagis: bir(hv.yag || 0), ruzgar: bir(hv.ruzgar || 0), gun: S.gun, saatlik: [] };
  try { o.durum = kirp(havaDurumMetni(hv), 40); } catch (e) { o.durum = ''; }
  var k = S.hava.kayit;
  if (!hv.elle && k && Array.isArray(k.saatler)) {
    var g0 = new Date(); g0.setHours(0, 0, 0, 0);
    var bas = g0.getTime() + S.gun * 86400000 + (S.pencere ? S.pencere.bas : 7) * 3600000;
    var son = g0.getTime() + S.gun * 86400000 + (S.pencere ? S.pencere.son : 22) * 3600000;
    o.saatlik = k.saatler.filter(function (s) { return s && sayiMi(s.t) && s.t >= bas && s.t <= son; }).slice(0, 24).map(function (s) {
      return { s: new Date(s.t).getHours(), d: bir(s.T), y: bir(s.y || 0), r: bir(s.v || 0) };
    });
  }
  return o;
}
function yzKombinKur(x, harita) {
  if (!x || typeof x !== 'object' || !Array.isArray(x.parcalar)) return null;
  var k = { aks: [] }, gorulen = Object.create(null);
  x.parcalar.forEach(function (id) {
    if (typeof id !== 'string' || gorulen[id]) return;
    gorulen[id] = 1;
    var p = harita[id];
    if (!p || p.dinlen || !TUR[p.tur]) return;
    var g = TUR[p.tur].g;
    if (g === 'tek') { if (!k.tek) k.tek = p; }
    else if (g === 'ust') { if (!k.ust) k.ust = p; else if (!k.kat) k.kat = p; }
    else if (g === 'alt') { if (!k.alt) k.alt = p; }
    else if (g === 'dis') { if (!k.dis) k.dis = p; else if (!k.kat) k.kat = p; }
    else if (g === 'ayk') { if (!k.ayk) k.ayk = p; }
    else if (g === 'aks') { if (k.aks.length < 6) k.aks.push(p); }
  });
  if (k.tek && k.ust) { if (!k.kat) k.kat = k.ust; k.ust = null; }
  if (!(k.tek || (k.ust && k.alt))) return null;
  k.nedenler = (Array.isArray(x.nedenler) ? x.nedenler : []).map(function (m) { return { i: 'isilti', m: kirp(m, 140) }; }).filter(function (n) { return n.m; }).slice(0, 4);
  k.yz = { baslik: kirp(x.baslik, 50), ipucu: kirp(x.ipucu, 260), uyum: sayiMi(x.uyum) ? Math.round(sinirla(x.uyum, 50, 99)) : 0 };
  return k;
}
function yzKombin(c, cumle, hv) {
  var harita = Object.create(null);
  S.parcalar.forEach(function (p) { if (!p.ornek) harita[p.id] = p; });
  return yzIste('/v1/kombin', {
    plan: S.istek || '', ortam: ortamAd(cumle.ortam), tarz: t(TARZ_ETK[c.tarzMod] || 'tmOto'), tesettur: !!A.tesettur,
    hava: yzHava(hv), parcalar: yzParcaListesi(), dil: A.dil
  }, 50000).then(function (v) {
    var s = v.sonuc;
    if (!s || typeof s !== 'object' || !Array.isArray(s.kombinler)) return null;
    var liste = s.kombinler.slice(0, 3).map(function (x) { return yzKombinKur(x, harita); }).filter(Boolean);
    return liste.length ? { kombinler: liste, havaNotu: kirp(s.havaNotu, 200) } : null;
  });
}

/* ---------- AI stil analizi ---------- */
function haftalikHava() {
  var k = S.hava.kayit; if (!k || !Array.isArray(k.saatler)) return [];
  var gunler = Object.create(null), sira = [];
  k.saatler.forEach(function (s) {
    if (!s || !sayiMi(s.t) || !sayiMi(s.T)) return;
    var d = new Date(s.t), a = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    if (!gunler[a]) { gunler[a] = { g: d.toLocaleDateString(A.dil === 'en' ? 'en-GB' : 'tr-TR', { weekday: 'short' }), min: s.T, max: s.T, y: 0 }; sira.push(a); }
    var g = gunler[a]; g.min = Math.min(g.min, s.T); g.max = Math.max(g.max, s.T); g.y += s.y || 0;
  });
  return sira.slice(0, 7).map(function (a) { var g = gunler[a]; return { g: kirp(g.g, 12), min: bir(g.min), max: bir(g.max), y: Math.min(100, bir(g.y)) }; });
}
function analizSayfasi() {
  var gov = h('div');
  var s = sayfaAc({ baslik: t('analizBaslik'), icerik: gov });
  function giris() {
    temizle(gov);
    gov.appendChild(h('div', { class: 'g-analiz-giris' },
      h('span', { class: 'g-analiz-ikon' }, ikon('grafik')),
      h('p', { text: t('analizAlt') })));
    var btn = h('button', { class: 'g-olustur', on: { click: basla } }, ikon('isilti', 'k'), t('analizBasla'), !S.pro ? h('small', { text: ' • ' + t('birJeton') }) : null);
    gov.appendChild(btn);
  }
  function basla() {
    var gercek = S.parcalar.filter(function (p) { return !p.ornek; });
    if (gercek.length < 3) { tost(t('analizAz')); return; }
    if (!yzAcik()) { tost(t('tpYok')); return; }
    if (!ozIzin('analiz')) return;
    temizle(gov);
    gov.appendChild(h('div', { class: 'g-yukleniyor' }, h('span', { class: 'yukleniyor' }), h('span', { text: t('yzDusunuyor') })));
    var gecmis = gecmisAl().filter(function (g) { return g && g.giyildi && Array.isArray(g.p); }).slice(0, 60)
      .map(function (g) { return { o: typeof g.o === 'string' ? g.o : '', p: g.p.slice(0, 8), d: g.h && sayiMi(g.h.max) ? g.h.max : null }; });
    yzIste('/v1/analiz', {
      parcalar: yzParcaListesi(), turler: yzTurListesi(), gunler: haftalikHava(), gecmis: gecmis,
      sehir: kirp((S.hava.yer && S.hava.yer.ad) || '', 60), tesettur: !!A.tesettur, dil: A.dil
    }, 50000).then(function (v) {
      if (s.kapandi) return;
      ozKullan('analiz');
      goster(v.sonuc || {});
    }).catch(function (e) {
      if (s.kapandi) return;
      giris();
      tost(yzHataMetni(e, t('analizHata')));
    });
  }
  function goster(r) {
    temizle(gov);
    var puan = sayiMi(r.puan) ? Math.round(sinirla(r.puan, 0, 100)) : null;
    if (puan !== null) {
      gov.appendChild(h('div', { class: 'g-analiz-puan' },
        h('div', { class: 'g-halka', style: { '--deger': puan + '' } }, h('b', { text: String(puan) })),
        h('div', null, h('small', { text: t('analizPuan') }), h('p', { text: kirp(r.ozet, 300) }))));
    }
    var bolum = function (baslik, ik, icerik) { if (icerik) gov.appendChild(h('div', { class: 'g-analiz-bolum' }, h('h4', null, ikon(ik, 'k vurgu'), baslik), icerik)); };
    if (kirp(r.tarzProfili, 120)) bolum(t('analizProfil'), 'kalp', h('p', { text: kirp(r.tarzProfili, 120) }));
    var eks = (Array.isArray(r.eksikler) ? r.eksikler : []).filter(function (x) { return x && TUR[x.tur]; }).slice(0, 4);
    if (eks.length) bolum(t('analizEksik'), 'arti', h('ul', { class: 'g-analiz-liste' }, eks.map(function (x) { return h('li', null, h('b', { text: turAd(x.tur) }), h('span', { text: kirp(x.neden, 140) })); })));
    var harita = Object.create(null); S.parcalar.forEach(function (p) { harita[p.id] = p; });
    var az = (Array.isArray(r.azGiyilen) ? r.azGiyilen : []).filter(function (x) { return x && typeof x.id === 'string' && harita[x.id]; }).slice(0, 4);
    if (az.length) bolum(t('analizAzGiyilen'), 'yenile', h('div', { class: 'g-analiz-parcalar' }, az.map(function (x) {
      var p = harita[x.id];
      return h('button', { class: 'g-analiz-parca', on: { click: function () { s.kapat(); setTimeout(function () { parcaDuzenle(p, null); }, 300); } } },
        resimEl(p.id, false, null, parcaAd(p)), h('div', null, h('b', { text: parcaAd(p) }), h('span', { text: kirp(x.oneri, 160) })));
    })));
    if (kirp(r.havaHazirlik, 240)) bolum(t('analizHava'), 'semsiye', h('p', { text: kirp(r.havaHazirlik, 240) }));
    var ip = (Array.isArray(r.ipuclari) ? r.ipuclari : []).map(function (x) { return kirp(x, 160); }).filter(Boolean).slice(0, 4);
    if (ip.length) bolum(t('analizIpucu'), 'ampul', h('ul', { class: 'g-analiz-liste' }, ip.map(function (x) { return h('li', { text: x }); })));
  }
  giris();
}

/* ---------- Topluluk ---------- */
function menuSatir(ik, baslik, alt, fn) {
  return h('button', { class: 'satir', on: { click: fn } },
    h('span', { class: 'sol' }, ikon(ik), h('div', null, baslik, alt ? h('small', { text: alt }) : null)), ikon('sag', 'k'));
}
var TOPLULUK = { sira: 'yeni', liste: [], sayfa: 0, devam: false, yukleniyor: false, hata: false, yuklendi: false };
function engelliler() { var l = LS.al('engelli', []); return Array.isArray(l) ? l.filter(function (x) { return typeof x === 'string' && /^[a-f0-9]{12}$/.test(x); }).slice(0, 200) : []; }
function zamanOnce(ms) {
  var d = Math.max(0, Date.now() - ms) / 60000;
  if (d < 1) return t('simdi');
  if (d < 60) return t('dkOnce', Math.floor(d));
  if (d < 1440) return t('saOnce', Math.floor(d / 60));
  return t('gunOnce', Math.floor(d / 1440));
}
function paylasimGecerli(x) {
  return x && typeof x === 'object' && typeof x.id === 'string' && /^[a-z0-9]{20}$/.test(x.id) && typeof x.takma === 'string' &&
    sayiMi(x.begeni) && sayiMi(x.begenmeme) && sayiMi(x.zaman) && typeof x.yazar === 'string' && /^[a-f0-9]{12}$/.test(x.yazar);
}
function toplulukYukle(sifirla) {
  if (TOPLULUK.yukleniyor) return;
  if (sifirla) { TOPLULUK.liste = []; TOPLULUK.sayfa = 0; TOPLULUK.devam = false; }
  TOPLULUK.yukleniyor = true; TOPLULUK.hata = false;
  toplulukCizYenile();
  yzIste('/v1/akis', { sira: TOPLULUK.sira, sayfa: TOPLULUK.sayfa, engelli: engelliler() }, 20000).then(function (v) {
    var gelen = Array.isArray(v.liste) ? v.liste.filter(paylasimGecerli) : [];
    var var_ = Object.create(null); TOPLULUK.liste.forEach(function (x) { var_[x.id] = 1; });
    TOPLULUK.liste = TOPLULUK.liste.concat(gelen.filter(function (x) { return !var_[x.id]; })).slice(0, 500);
    TOPLULUK.devam = v.devam === true && TOPLULUK.sayfa < 24;
    TOPLULUK.sayfa++;
    TOPLULUK.yuklendi = true;
  }).catch(function () { TOPLULUK.hata = true; }).then(function () { TOPLULUK.yukleniyor = false; toplulukCizYenile(); });
}
function toplulukCizYenile() { var a = $('#toplulukAlani'); if (a) toplulukDoldur(a); }
function toplulukBolumu() {
  var kap = h('div');
  var seg = h('div', { class: 'g-haplar' });
  [['yeni', 'tpYeni'], ['populer', 'tpPopuler'], ['benim', 'tpBenim']].forEach(function (x) {
    seg.appendChild(h('button', { 'aria-pressed': TOPLULUK.sira === x[0] ? 'true' : 'false', text: t(x[1]), on: { click: function () {
      if (TOPLULUK.sira === x[0]) return;
      TOPLULUK.sira = x[0];
      $$('button', seg).forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
      this.setAttribute('aria-pressed', 'true');
      toplulukYukle(true);
    } } }));
  });
  kap.appendChild(seg);
  var alan = h('div', { id: 'toplulukAlani' });
  kap.appendChild(alan);
  toplulukDoldur(alan);
  if (!TOPLULUK.yuklendi && !TOPLULUK.yukleniyor && yzKurulu()) setTimeout(function () { toplulukYukle(true); }, 0);
  return kap;
}
function toplulukDoldur(alan) {
  temizle(alan);
  if (!yzKurulu()) { alan.appendChild(h('div', { class: 'g-bos-not' }, ikon('bilgi', 'k'), h('span', { text: t('tpYok') }))); return; }
  var adres = sunucuAdres();
  var eng = engelliler();
  var liste = TOPLULUK.liste.filter(function (x) { return eng.indexOf(x.yazar) < 0; });
  liste.forEach(function (x) { alan.appendChild(paylasimKarti(x, adres)); });
  if (TOPLULUK.yukleniyor) alan.appendChild(h('div', { class: 'g-yukleniyor' }, h('span', { class: 'yukleniyor' })));
  else if (TOPLULUK.hata) alan.appendChild(h('div', { class: 'g-bos-not' }, h('span', { text: t('tpHata') }), h('button', { class: 'g-btn-cizgi kucuk', text: t('tekrarDene'), on: { click: function () { toplulukYukle(!TOPLULUK.liste.length); } } })));
  else if (!liste.length && TOPLULUK.yuklendi) alan.appendChild(h('div', { class: 'g-bos-not' }, ikon('isilti', 'k'), h('span', { text: TOPLULUK.sira === 'benim' ? t('tpBenimBos') : t('tpBos') })));
  else if (TOPLULUK.devam) alan.appendChild(h('button', { class: 'g-btn-cizgi', text: t('tpDahaFazla'), on: { click: function () { toplulukYukle(false); } } }));
}
function paylasimKarti(x, adres) {
  var img = adres ? h('img', { class: 'g-akis-resim', src: adres + '/v1/resim/' + x.id, alt: kirp(x.aciklama, 120) || kirp(x.takma, 24), loading: 'lazy', decoding: 'async', referrerpolicy: 'no-referrer' }) : null;
  if (img) img.addEventListener('error', function () { img.replaceWith(h('div', { class: 'g-akis-resim bos', text: x.gizli ? t('tpGizli') : t('resimInternet') })); });
  var yukari = h('button', { class: 'g-oy', 'aria-label': t('begen'), 'aria-pressed': x.oy === 1 ? 'true' : 'false' }, ikon('yukari', 'k'), h('span', { text: String(x.begeni) }));
  var asagi = h('button', { class: 'g-oy', 'aria-label': t('begenme'), 'aria-pressed': x.oy === -1 ? 'true' : 'false' }, ikon('asagi', 'k'), h('span', { text: String(x.begenmeme) }));
  var mesgul = false;
  function oyla(deger) {
    if (x.benim) { tost(t('kendiOy')); return; }
    if (mesgul) return;
    var yeni = x.oy === deger ? 0 : deger, eski = { oy: x.oy, b: x.begeni, bm: x.begenmeme };
    /* hemen göster, sunucu yanıtıyla düzelt */
    if (x.oy === 1) x.begeni--; if (x.oy === -1) x.begenmeme--;
    if (yeni === 1) x.begeni++; if (yeni === -1) x.begenmeme++;
    x.oy = yeni; guncelle();
    mesgul = true;
    yzIste('/v1/oy', { id: x.id, oy: yeni }, 15000).then(function (v) {
      if (sayiMi(v.begeni)) x.begeni = v.begeni; if (sayiMi(v.begenmeme)) x.begenmeme = v.begenmeme;
    }).catch(function (e) {
      x.oy = eski.oy; x.begeni = eski.b; x.begenmeme = eski.bm;
      tost(e && e.message === 'kendi' ? t('kendiOy') : t('tpHata'));
    }).then(function () { mesgul = false; guncelle(); });
  }
  function guncelle() {
    yukari.setAttribute('aria-pressed', x.oy === 1 ? 'true' : 'false'); yukari.lastChild.textContent = String(Math.max(0, x.begeni));
    asagi.setAttribute('aria-pressed', x.oy === -1 ? 'true' : 'false'); asagi.lastChild.textContent = String(Math.max(0, x.begenmeme));
  }
  yukari.addEventListener('click', function () { oyla(1); });
  asagi.addEventListener('click', function () { oyla(-1); });
  var etiketler = Array.isArray(x.etiketler) ? x.etiketler.map(function (e) { return kirp(e, 20); }).filter(Boolean).slice(0, 6) : [];
  var kart = h('div', { class: 'g-akis' + (x.gizli ? ' gizli' : '') },
    h('div', { class: 'g-akis-bas' },
      h('span', { class: 'g-avatar', text: (kirp(x.takma, 24).charAt(0) || '?').toLocaleUpperCase(A.dil === 'en' ? 'en' : 'tr') }),
      h('div', null, h('b', { text: kirp(x.takma, 24) }), h('small', { text: zamanOnce(x.zaman) })),
      h('button', { class: 'ikon-btn g-akis-menu', 'aria-label': t('secenekler'), on: { click: function () { paylasimMenusu(x, kart); } } }, ikon('nokta'))),
    x.gizli ? h('p', { class: 'g-gizli-not', text: t('tpGizli') }) : null,
    img,
    kirp(x.aciklama, 200) ? h('p', { class: 'g-akis-metin', text: kirp(x.aciklama, 200) }) : null,
    etiketler.length ? h('div', { class: 'g-akis-etiket' }, etiketler.map(function (e) { return h('span', { text: '#' + e }); })) : null,
    h('div', { class: 'g-akis-oy' }, yukari, asagi));
  return kart;
}
function paylasimMenusu(x, kart) {
  var gov = h('div', { class: 'ayar-grup' });
  var s = sayfaAc({ baslik: t('secenekler'), icerik: gov });
  if (x.benim) {
    gov.appendChild(menuSatir('cop', t('paylasimSil'), '', function () {
      onayla(t('paylasimSil'), t('paylasimSilSor'), t('sil'), true).then(function (evet) {
        if (!evet) return;
        yzIste('/v1/sil', { id: x.id }, 15000).then(function () {
          TOPLULUK.liste = TOPLULUK.liste.filter(function (y) { return y.id !== x.id; });
          s.kapat(); kart.remove(); tost(t('silindi'));
        }).catch(function () { tost(t('tpHata')); });
      });
    }));
    return;
  }
  gov.appendChild(menuSatir('bayrak', t('sikayetEt'), '', function () { s.kapat(); setTimeout(function () { sikayetSayfasi(x, kart); }, 300); }));
  gov.appendChild(menuSatir('kapat', t('engelle'), '', function () {
    var l = engelliler(); if (l.indexOf(x.yazar) < 0) l.push(x.yazar);
    LS.yaz('engelli', l.slice(-200));
    s.kapat(); tost(t('engellendi')); toplulukCizYenile();
  }));
}
function sikayetSayfasi(x, kart) {
  var gov = h('div', { class: 'ayar-grup' });
  var s = sayfaAc({ baslik: t('sikayetNeden'), icerik: gov });
  [['uygunsuz', 'snUygunsuz'], ['hakaret', 'snHakaret'], ['spam', 'snSpam'], ['kisisel', 'snKisisel'], ['diger', 'snDiger']].forEach(function (n) {
    gov.appendChild(menuSatir('bayrak', t(n[1]), '', function () {
      yzIste('/v1/sikayet', { id: x.id, neden: n[0] }, 15000).then(function () {
        s.kapat(); tost(t('sikayetAlindi'));
        /* şikâyet edilen paylaşım bu kullanıcıdan hemen gizlenir */
        TOPLULUK.liste = TOPLULUK.liste.filter(function (y) { return y.id !== x.id; });
        kart.remove();
      }).catch(function () { tost(t('tpHata')); });
    }));
  });
}

/* ---------- Paylaşım ---------- */
function resimYukle(url) {
  return new Promise(function (coz) {
    var i = new Image();
    i.onload = function () { coz(i); };
    i.onerror = function () { coz(null); };
    i.src = url;
  });
}
/* Kombindeki parçaların fotoğraflarından paylaşılabilir bir kolaj (yalnız telefondaki fotoğraflar; uzak görseller tuvali kirletir) */
function kombinKolaji(k) {
  var parcalar = kombinParcalari(k).slice(0, 6);
  var W = 720, H = 900;
  var c = document.createElement('canvas'); c.width = W; c.height = H;
  var x = c.getContext('2d');
  var koyu = document.documentElement.getAttribute('data-tema') === 'koyu';
  x.fillStyle = koyu ? '#1E1F22' : '#F8FAFC'; x.fillRect(0, 0, W, H);
  return Promise.all(parcalar.map(function (p) {
    return Depo.resimAl(p.id).then(function (r) {
      var b = r && (r.buyuk instanceof Blob ? r.buyuk : r.kucuk instanceof Blob ? r.kucuk : null);
      if (!b) return null;
      var u = URL.createObjectURL(b);
      return resimYukle(u).then(function (img) { setTimeout(function () { URL.revokeObjectURL(u); }, 1000); return img; });
    }).catch(function () { return null; });
  })).then(function (resimler) {
    var dolu = resimler.filter(Boolean);
    if (!dolu.length) return null;
    var n = dolu.length, sut = n <= 1 ? 1 : n <= 4 ? 2 : 3, sat = Math.ceil(n / sut);
    var bosluk = 18, hw = (W - bosluk * (sut + 1)) / sut, hh = (H - 70 - bosluk * (sat + 1)) / sat;
    dolu.forEach(function (img, i) {
      var cx = bosluk + (i % sut) * (hw + bosluk), cy = bosluk + Math.floor(i / sut) * (hh + bosluk);
      x.fillStyle = koyu ? '#141414' : '#FFFFFF';
      if (x.roundRect) { x.beginPath(); x.roundRect(cx, cy, hw, hh, 22); x.fill(); } else x.fillRect(cx, cy, hw, hh);
      var o = Math.min((hw - 24) / img.width, (hh - 24) / img.height);
      var w = img.width * o, hg = img.height * o;
      x.drawImage(img, cx + (hw - w) / 2, cy + (hh - hg) / 2, w, hg);
    });
    x.fillStyle = koyu ? '#E35068' : '#F43F5E';
    x.font = '800 30px Inter, sans-serif'; x.textAlign = 'center';
    x.fillText('Kombinle', W / 2, H - 28);
    return c;
  });
}
function tuvaldenB64(c, enFazla) {
  var kalite = 0.86, b64 = '';
  for (var i = 0; i < 6; i++) {
    var d = '';
    try { d = c.toDataURL('image/webp', kalite); } catch (e) { d = ''; }
    if (d.indexOf('data:image/webp') !== 0) { try { d = c.toDataURL('image/jpeg', kalite); } catch (e2) { d = ''; } }
    b64 = d.slice(d.indexOf(',') + 1);
    if (b64 && b64.length * 0.75 <= enFazla) return b64;
    kalite -= 0.12;
    if (kalite < 0.45) { c = olcekle(c, Math.round(Math.max(c.width, c.height) * 0.75)); kalite = 0.8; }
  }
  return b64 && b64.length * 0.75 <= enFazla ? b64 : '';
}
function paylasSayfasi(k, baglam) {
  if (!yzKurulu()) { tost(t('tpYok')); return; }
  var tuval = null, onizleme = h('div', { class: 'g-paylas-onizleme' }, h('span', { class: 'yukleniyor' }));
  var takma = h('input', { class: 'metin', maxlength: '24', placeholder: t('takmaYer'), value: kirp(LS.al('takma', ''), 24), 'aria-label': t('takmaAd') });
  var aciklama = h('textarea', { class: 'metin', maxlength: '200', rows: '3', placeholder: t('aciklamaYer'), 'aria-label': t('aciklamaYer') });
  var onay = h('input', { type: 'checkbox', id: 'kuralOnay' });
  if (LS.al('kuralOnay', false) === true) onay.checked = true;
  var gonderBtn = h('button', { class: 'btn ana', on: { click: gonder } }, ikon('paylas', 'k'), t('paylasGonder'));
  var etiketler = [];
  if (baglam && baglam.ortam) etiketler.push(kirp(ortamAd(baglam.ortam), 20));
  if (baglam && baglam.hv && sayiMi(baglam.hv.max)) etiketler.push(Math.round(baglam.hv.max) + '°C');
  function goster(c) {
    temizle(onizleme);
    tuval = c;
    if (!c) { onizleme.appendChild(h('p', { class: 'alt-yazi', text: t('resimInternet') })); return; }
    var img = h('img', { alt: '', src: c.toDataURL('image/jpeg', 0.8) });
    onizleme.appendChild(img);
  }
  var fotoBtn = h('button', { class: 'btn ikincil kucuk', on: { click: kendiFotografi } }, ikon('galeri', 'k'), t('kendiFoto'));
  var kolajBtn = h('button', { class: 'btn ikincil kucuk', on: { click: function () { kombinKolaji(k).then(goster); } } }, ikon('aski', 'k'), t('kolajKullan'));
  function kendiFotografi() {
    var inp = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', style: { display: 'none' } });
    document.body.appendChild(inp);
    inp.addEventListener('change', function () {
      var f = inp.files && inp.files[0]; inp.remove();
      if (!f) return;
      if (f.size > EN_BUYUK_DOSYA) { tost(t('dosyaBuyuk')); return; }
      resimCoz(f).then(function (bmp) {
        var c = tuvaleCiz(bmp, 1080);   /* yeniden çizim: konum gibi EXIF bilgileri gitmez */
        try { if (bmp.close) bmp.close(); } catch (e) { }
        goster(c);
      }).catch(function () { tost(t('dosyaBozuk')); });
    });
    inp.click();
  }
  var gov = h('div', null,
    onizleme,
    h('div', { class: 'sarili', style: { 'margin-top': '10px' } }, k ? kolajBtn : null, fotoBtn),
    h('div', { class: 'bolum' }, h('span', { class: 'etk', text: t('takmaAd') }), takma),
    h('div', { class: 'bolum' }, h('span', { class: 'etk', text: t('aciklamaYer') }), aciklama),
    h('div', { class: 'g-kurallar' },
      h('b', { text: t('kurallarBaslik') }),
      h('ul', null, ['kural1', 'kural2', 'kural3', 'kural4'].map(function (x) { return h('li', { text: t(x) }); })),
      h('label', { class: 'g-onay', for: 'kuralOnay' }, onay, h('span', { text: t('kurallarOnay') }))));
  var s = sayfaAc({ baslik: t('paylasBaslik'), icerik: gov, altBar: gonderBtn });
  if (k) kombinKolaji(k).then(goster); else goster(null);
  var gidiyor = false;
  function gonder() {
    if (gidiyor) return;
    var ad = kirp(takma.value, 24), not = kirp(aciklama.value, 200);
    if (ad.length < 2) { tost(t('takmaKisa')); takma.focus(); return; }
    if (!onay.checked) { tost(t('onayGerek')); return; }
    if (!tuval) { kendiFotografi(); return; }
    if (/(https?:\/\/|www\.|\b\d[\d\s().-]{8,}\d\b)/i.test(not + ' ' + ad)) { tost(t('baglantiYok')); return; }
    var b64 = tuvaldenB64(tuval, 440 * 1024);
    if (!b64) { tost(t('dosyaBuyuk')); return; }
    LS.yaz('takma', ad); LS.yaz('kuralOnay', true);
    gidiyor = true; gonderBtn.disabled = true;
    temizle(gonderBtn); gonderBtn.appendChild(h('span', { class: 'yukleniyor' })); gonderBtn.appendChild(document.createTextNode(t('paylasiliyor')));
    yzIste('/v1/paylas', { resim: b64, takma: ad, aciklama: not, etiketler: etiketler }, 50000).then(function () {
      s.kapat(); tost(t('paylasildi'));
      TOPLULUK.sira = 'yeni'; TOPLULUK.yuklendi = false; S.kesfetSekme = 'topluluk';
    }).catch(function (e) {
      var v = e && e.veri, m = e && e.message;
      if (m === 'denetim') {
        var ad2 = { ciplaklik: 'dnCiplaklik', cinsel: 'dnCinsel', cocuk: 'dnCocuk', siddet: 'dnSiddet', nefret: 'dnNefret', kisisel_bilgi: 'dnKisisel', kiyafet_degil: 'dnKiyafet', spam: 'dnSpam' }[v && v.neden];
        tost(t('denetimRed', ad2 ? t(ad2) : ''));
      } else if (m === 'baglanti') tost(t('baglantiYok'));
      else if (m === 'kota') tost(t('paylasKota'));
      else tost(yzHataMetni(e, t('paylasHata')));
    }).then(function () {
      gidiyor = false; gonderBtn.disabled = false;
      temizle(gonderBtn); gonderBtn.appendChild(ikon('paylas', 'k')); gonderBtn.appendChild(document.createTextNode(t('paylasGonder')));
    });
  }
}
