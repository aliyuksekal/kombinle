/* =========================================================
   Araçlar: bavul, kombin kurma, "bununla ne giyilir", ilham panosu,
   istatistik ve takvim. Her biri ücretsiz sürümde 3 kez kullanılır.
   ========================================================= */

function baglamKur(oid, hv, ek) {
  var o = ORTAMLAR[oid] || ORTAMLAR.gunluk;
  var c = {
    o: o, oid: ORTAMLAR[oid] ? oid : 'gunluk', f: o.f, h: hv, rahat: !!o.rahat, renkli: false, iceriSadece: false, tesettur: A.tesettur,
    renkTercih: [], renkKac: [], turTercih: [], turKac: [], turIstek: [], metindenOrtam: '', secildi: false
  };
  if (ek) for (var k in ek) if (Object.prototype.hasOwnProperty.call(ek, k)) c[k] = ek[k];
  return c;
}
function varsayilanHava() { return aktifHava() || elleHava({ sicaklik: 'ilik', yagmur: false }); }

/* ---------- Bugün ekranındaki araç kutuları ---------- */
function araclarBolumu() {
  var kutu = function (ik, baslik, alt, oz, fn) {
    var k = ozKalan(oz);
    return h('button', { class: 'arac', on: { click: fn } }, ikon(ik), h('b', { text: baslik }),
      h('small', { class: !S.pro && k <= 0 ? 'kilit' : null, text: S.pro ? alt : k > 0 ? alt + ' ' + t('ucretsizKalan', k) : t('kraliceyle') }));
  };
  return h('section', null,
    h('h2', { class: 'baslik', style: { 'margin-top': '26px' }, text: t('araclar') }),
    h('div', { class: 'araclar' },
      kutu('aks', t('bavulBaslik'), t('bavulAlt'), 'bavul', bavulAc),
      kutu('aski', t('kurBaslik'), t('kurAlt'), 'kur', function () { kombinKur(null); }),
      kutu('galeri', t('ilhamBaslik'), t('ilhamAlt'), 'ilham', ilhamPanosu),
      kutu('termometre', t('istatistikBaslik'), t('istatistikAlt'), 'istatistik', istatistikSayfasi)));
}

/* ---------- Takvimde planlanan kombin (Bugün ekranı) ---------- */
function planKarti() {
  var gun = new Date(); if (S.gun === 1) gun = new Date(Date.now() + 86400000);
  var anahtar = bugunAnahtar(gun);
  var plan = gecmisAl().filter(function (k) { return k.plan === anahtar && !k.giyildi; })[0];
  if (!plan) return null;
  var y = kayittanKombin(plan);
  if (!kombinParcalari(y).length) return null;
  var kart = h('div', { class: 'kart masa-kart' },
    h('div', { class: 'masa-ust' }, h('h2', { class: 'baslik', text: S.gun === 1 ? t('yarinPlan') : t('bugunPlan') }), h('span', { class: 'no', text: plan.ad || ortamAd(plan.o) })),
    masaCiz(y));
  kart.appendChild(h('div', { class: 'eylemler', style: { 'grid-template-columns': '1fr auto' } },
    h('button', { class: 'btn ana', disabled: S.gun === 1 ? true : null, on: { click: function () { planGiyildi(plan); } } }, ikon('tik', 'k'), t('bunuGiydim')),
    h('button', { class: 'ikon-btn', 'aria-label': t('planKaldir'), on: { click: function () { gecmisYaz(gecmisAl().filter(function (x) { return x.id !== plan.id; })); tost(t('planKalkti')); ciz(); } } }, ikon('cop'))));
  return kart;
}
function planGiyildi(plan) {
  var simdi = Date.now(), g = gecmisAl();
  g.forEach(function (x) { if (x.id === plan.id) { x.giyildi = true; x.tarih = simdi; } });
  gecmisYaz(g);
  S.parcalar.forEach(function (p) { if (plan.p.indexOf(p.id) >= 0) { p.son = simdi; p.giy = sinirla((p.giy || 0) + 1, 0, 99999); Depo.parcaYaz(p).catch(hataYakala); } });
  tost(t('giyildiTost')); ciz();
}

/* ---------- Parça seçici ---------- */
function parcaSec(baslik, filtre, coklu, secili, bitti) {
  var sec = (secili || []).slice();
  var izgara = h('div', { class: 'secim-izgara' });
  var liste = S.parcalar.filter(filtre).sort(function (a, b) { return (b.giy || 0) - (a.giy || 0); });
  function doldur() {
    temizle(izgara);
    if (!liste.length) { izgara.appendChild(h('p', { class: 'alt-yazi', style: { 'grid-column': '1/-1' }, text: t('buGruptaYok') })); return; }
    liste.forEach(function (p) {
      izgara.appendChild(h('button', {
        class: 'oge' + (p.kesik ? ' kesik' : ''), 'aria-pressed': sec.indexOf(p.id) >= 0 ? 'true' : 'false', 'aria-label': parcaAd(p),
        on: { click: function () {
          var i = sec.indexOf(p.id);
          if (coklu) { if (i >= 0) sec.splice(i, 1); else if (sec.length < 6) sec.push(p.id); doldur(); }
          else { s.kapat(); bitti(i >= 0 ? [] : [p.id]); }
        } }
      }, resimEl(p.id, false, null, ''), h('span', { class: 'alt' }, h('i', { style: { background: (RENK[p.renk] || RENK.siyah).hex } }), h('span', { text: p.ad || turAd(p.tur) }))));
    });
  }
  doldur();
  var alt = coklu ? [h('button', { class: 'btn ikincil', text: t('temizle'), on: { click: function () { sec = []; doldur(); } } }),
    h('button', { class: 'btn ana', text: t('tamam'), on: { click: function () { s.kapat(); bitti(sec); } } })]
    : [h('button', { class: 'btn ikincil', text: t('bosBirak'), on: { click: function () { s.kapat(); bitti([]); } } })];
  var s = sayfaAc({ baslik: baslik, icerik: izgara, altBar: alt });
}

/* ---------- Kendi kombinini kur ---------- */
function kombinKur(ayar) {
  ayar = ayar || {};
  if (!ozIzin('kur')) return;
  var y = { aks: [] }, ad = '', ortam = '';
  var harita = function () { var m = {}; S.parcalar.forEach(function (p) { m[p.id] = p; }); return m; };
  var gov = h('div');
  var kaydetBtn = h('button', { class: 'btn ana', on: { click: kaydet } });
  var SLOTLAR = [
    ['tek', 'slotTek', function (p) { return TUR[p.tur].g === 'tek'; }],
    ['ust', 'slotUst', function (p) { return TUR[p.tur].g === 'ust'; }],
    ['alt', 'slotAlt', function (p) { return TUR[p.tur].g === 'alt'; }],
    ['kat', 'slotKat', function (p) { return TUR[p.tur].g === 'dis' && TUR[p.tur].kat; }],
    ['dis', 'slotDis', function (p) { return TUR[p.tur].g === 'dis' && !TUR[p.tur].kat; }],
    ['ayk', 'slotAyk', function (p) { return TUR[p.tur].g === 'ayk'; }],
    ['aks', 'slotAks', function (p) { var g = TUR[p.tur].g; return g === 'aks' || p.tur === 'kulotlu'; }]
  ];
  function ciz5() {
    temizle(gov);
    if (kombinParcalari(y).length) gov.appendChild(masaCiz(y));
    else gov.appendChild(h('p', { class: 'alt-yazi', text: t('kurMetin') }));
    SLOTLAR.forEach(function (sl) {
      var anahtar = sl[0], deger = y[anahtar];
      var secilen = anahtar === 'aks' ? deger : deger ? [deger] : [];
      var resim = h('span', { class: 'kucuk-resim' });
      if (secilen[0]) resim.appendChild(resimEl(secilen[0].id, false, null, '')); else resim.appendChild(ikon('arti', 'k'));
      gov.appendChild(h('button', { class: 'slot', on: { click: function () {
        parcaSec(t(sl[1]), sl[2], anahtar === 'aks', secilen.map(function (p) { return p.id; }), function (ids) {
          var m = harita(), l = ids.map(function (id) { return m[id]; }).filter(Boolean);
          if (anahtar === 'aks') y.aks = l; else y[anahtar] = l[0] || null;
          if (anahtar === 'tek' && y.tek) { y.ust = null; y.alt = null; }
          if ((anahtar === 'ust' || anahtar === 'alt') && y[anahtar]) y.tek = null;
          ciz5();
        });
      } } }, resim, h('span', { style: { flex: '1', 'min-width': '0' } }, h('b', { style: { 'font-weight': '500', display: 'block' }, text: t(sl[1]) }),
        h('small', { class: 'alt-yazi', text: secilen.length ? secilen.map(parcaAd).join(', ') : t('secilmedi') })), ikon('sag', 'k')));
    });
    var adGir = h('input', { class: 'metin', maxlength: '40', placeholder: t('kombinAdYer'), on: { input: function (e) { ad = kirp(e.target.value, 40); } } });
    adGir.value = ad;
    gov.appendChild(h('div', { class: 'bolum' }, h('span', { class: 'etk', text: t('kombinAdi') }), adGir));
    var oc = h('div', { class: 'sarili' });
    ORTAM_SIRA.forEach(function (id) {
      oc.appendChild(h('button', { class: 'cip kucuk', 'aria-pressed': ortam === id ? 'true' : 'false', text: ortamAd(id), on: { click: function () { ortam = ortam === id ? '' : id; ciz5(); } } }));
    });
    gov.appendChild(h('div', { class: 'bolum' }, h('span', { class: 'etk', text: t('kombinOrtami') }), oc));
    var hazir = !!(y.tek || y.ust || y.alt);
    kaydetBtn.disabled = !hazir;
    kaydetBtn.textContent = hazir ? (ayar.plan ? t('kaydetVePlanla') : t('kombiniKaydet')) : t('kurEnAz');
    var hy = ozHakYazi('kur'); if (hy) gov.appendChild(hy);
  }
  function kaydet() {
    if (!(y.tek || y.ust || y.alt)) return;
    var ids = kombinParcalari(y).map(function (p) { return p.id; }).slice(0, 16);
    var g = gecmisAl();
    var k = { id: yeniId(), tarih: Date.now(), p: ids, o: ortam || 'gunluk', m: ad, ad: ad, fav: true, kendi: 1, giyildi: false };
    g.unshift(k);
    if (ayar.plan) g.unshift({ id: yeniId(), tarih: Date.now(), plan: ayar.plan, p: ids, o: k.o, m: ad, ad: ad, fav: false, giyildi: false });
    gecmisYaz(g);
    ozKullan('kur');
    if (ayar.plan) ozKullan('takvim');
    s.kapat(); tost(ayar.plan ? t('planlandi') : t('kombinKaydedildi')); ciz();
  }
  var s = sayfaAc({ baslik: t('kurBaslik'), icerik: gov, altBar: [h('button', { class: 'btn ikincil', text: t('vazgec'), on: { click: function () { s.kapat(); } } }), kaydetBtn] });
  ciz5();
}

/* ---------- Öneri listesi sayfası (ne giyilir / ilham) ---------- */
function onerilerSayfasi(baslik, alt, kombinler) {
  var gov = h('div', null, alt ? h('p', { class: 'alt-yazi', text: alt }) : null);
  kombinler.forEach(function (k, i) {
    var kaydedildi = false;
    var b = h('button', { class: 'btn ikincil kucuk', style: { 'margin-top': '10px' } }, ikon('kalp', 'k'), t('favoriyeEkle'));
    b.addEventListener('click', function () {
      if (kaydedildi) return; kaydedildi = true;
      var g = gecmisAl();
      g.unshift({ id: yeniId(), tarih: Date.now(), p: kombinParcalari(k).map(function (p) { return p.id; }).slice(0, 16), o: 'gunluk', m: baslik, ad: '', fav: true, giyildi: false });
      gecmisYaz(g); b.textContent = t('kaydedildi'); b.disabled = true; tost(t('favEklendi'));
    });
    gov.appendChild(h('div', { class: 'bolum' }, h('span', { class: 'etk', text: t('secenek', i + 1) }), masaCiz(k), b));
  });
  sayfaAc({ baslik: baslik, icerik: gov });
}

/* ---------- Bununla ne giyilir? ---------- */
function nelerGiyilir(p) {
  if (!ozIzin('eslestir')) return;
  var hv = varsayilanHava();
  var c = baglamKur('gunluk', hv, { zorunlu: p });
  var havuz = oneriParcalari(); if (havuz.indexOf(p) < 0) havuz.push(p);
  var sonuc;
  try { sonuc = kombinOner(havuz, c); } catch (e) { hataYakala(e); sonuc = { kombinler: [] }; }
  if (!sonuc.kombinler.length) { tost(t('eslesmeYok')); return; }
  ozKullan('eslestir');
  onerilerSayfasi(t('nelerBaslik', parcaAd(p)), t('nelerAlt'), sonuc.kombinler);
}

/* ---------- Bavul modu ---------- */
function bavulAc() {
  var son = LS.al('bavul', null);
  if (son && Array.isArray(son.gunler) && son.gunler.length) { bavulGoster(son); return; }
  bavulFormu();
}
function bavulFormu() {
  if (!ozIzin('bavul')) return;
  var yer = S.hava.yer && sayiMi(S.hava.yer.lat) ? { ad: S.hava.yer.ad || t('konumun'), lat: S.hava.yer.lat, lon: S.hava.yer.lon } : null;
  var bas = 1, gunSay = 3, plan = '';
  var gov = h('div');
  var btn = h('button', { class: 'btn ana', on: { click: hazirla } }, ikon('isilti', 'k'), t('bavulHazirla'));
  function ciz6() {
    temizle(gov);
    gov.appendChild(h('p', { class: 'alt-yazi', text: t('bavulMetin') }));
    gov.appendChild(h('div', { class: 'bolum' }, h('span', { class: 'etk', text: t('nereye') }),
      h('button', { class: 'slot', on: { click: function () { sehirSecici(function (x) { yer = x; ciz6(); }); } } }, ikon('konum'), h('span', { style: { flex: '1' }, text: yer ? yer.ad : t('sehirSec') }), ikon('sag', 'k'))));
    var bs = h('div', { class: 'sarili' });
    [0, 1, 2, 3, 4].forEach(function (g) {
      var d = new Date(Date.now() + g * 86400000);
      bs.appendChild(h('button', { class: 'cip kucuk', 'aria-pressed': bas === g ? 'true' : 'false', text: g === 0 ? t('bugun') : g === 1 ? t('yarin') : kisaTarih(d), on: { click: function () { bas = g; ciz6(); } } }));
    });
    gov.appendChild(h('div', { class: 'bolum' }, h('span', { class: 'etk', text: t('neZaman') }), bs));
    var sayac = h('div', { style: { display: 'flex', 'align-items': 'center', gap: '14px' } },
      h('button', { class: 'ikon-btn', style: { background: 'var(--yuzey2)' }, 'aria-label': '-', on: { click: function () { gunSay = Math.max(1, gunSay - 1); ciz6(); } } }, h('span', { text: '−' })),
      h('b', { style: { 'font-family': 'var(--serif)', 'font-size': '24px', 'font-weight': '500' }, text: t('gunSayisi', gunSay) }),
      h('button', { class: 'ikon-btn', style: { background: 'var(--yuzey2)' }, 'aria-label': '+', on: { click: function () { gunSay = Math.min(10, gunSay + 1); ciz6(); } } }, ikon('arti', 'k')));
    gov.appendChild(h('div', { class: 'bolum' }, h('span', { class: 'etk', text: t('kacGun') }), sayac));
    var pl = h('textarea', { class: 'istek', rows: '2', maxlength: '200', placeholder: t('bavulPlanYer'), on: { input: function (e) { plan = kirp(e.target.value, 200); } } });
    pl.value = plan;
    gov.appendChild(h('div', { class: 'bolum' }, h('span', { class: 'etk', text: t('bavulPlan') }), pl));
    var hy = ozHakYazi('bavul'); if (hy) gov.appendChild(hy);
    btn.disabled = !yer;
  }
  var calisiyor = false;
  function hazirla() {
    if (!yer || calisiyor) return;
    calisiyor = true; btn.disabled = true; temizle(btn); btn.appendChild(h('span', { class: 'yukleniyor' })); btn.appendChild(document.createTextNode(t('hazirlaniyor')));
    havaGetir(yer.lat, yer.lon, false, 'havaBavul').then(function (kayit) { return kayit; }, function () { return null; }).then(function (kayit) {
      var sonuc = bavulOlustur(yer, bas, gunSay, plan, kayit);
      calisiyor = false;
      if (!sonuc) { tost(t('bavulOlmadi')); ciz6(); return; }
      ozKullan('bavul');
      LS.yaz('bavul', sonuc);
      s.kapat(); setTimeout(function () { bavulGoster(sonuc); }, 300);
    });
  }
  var s = sayfaAc({ baslik: t('bavulBaslik'), icerik: gov, altBar: [h('button', { class: 'btn ikincil', text: t('vazgec'), on: { click: function () { s.kapat(); } } }), btn] });
  ciz6();
}
function kisaTarih(d) { try { return d.toLocaleDateString(A.dil === 'tr' ? 'tr-TR' : 'en-GB', { day: 'numeric', month: 'short' }); } catch (e) { return bugunAnahtar(d); } }
function bavulOlustur(yer, bas, gunSay, planMetni, kayit) {
  var cumle = cumleCoz(planMetni, '');
  var parcalar = oneriParcalari();
  var bonus = {}, dun = [], gunler = [], canta = {};
  var sonOzet = null;
  for (var d = 0; d < gunSay; d++) {
    var oz = kayit ? gunOzeti(kayit, bas + d, { bas: 8, son: 21 }) : null;
    var tahmini = false;
    if (!oz) { oz = sonOzet || elleHava({ sicaklik: 'ilik' }); tahmini = true; }
    sonOzet = oz;
    var b2 = {}; Object.keys(bonus).forEach(function (k) { b2[k] = bonus[k]; });
    dun.forEach(function (id) { b2[id] = (b2[id] || 0) - 3.5; });
    var c = baglamKur(cumle.ortam || 'gunluk', oz, { bonus: b2, renkTercih: cumle.renkTercih, renkKac: cumle.renkKac, turTercih: cumle.turTercih, turKac: cumle.turKac, f: cumle.f || (ORTAMLAR[cumle.ortam] || ORTAMLAR.gunluk).f });
    var sonuc;
    try { sonuc = kombinOner(parcalar, c); } catch (e) { hataYakala(e); return null; }
    var k = sonuc.kombinler[0];
    if (!k) return null;
    var ids = kombinParcalari(k).map(function (p) { return p.id; });
    ids.forEach(function (id) { bonus[id] = 3.5; canta[id] = 1; });
    dun = [k.ust, k.alt, k.tek].filter(Boolean).map(function (p) { return p.id; });
    gunler.push({ tarih: bugunAnahtar(new Date(Date.now() + (bas + d) * 86400000)), min: Math.round(oz.min), max: Math.round(oz.max), s: oz.sembol, yagmur: !!oz.yagmur, tahmini: tahmini, p: ids });
  }
  return { id: yeniId(), olusturma: Date.now(), yer: kirp(yer.ad, 60), gunler: gunler, liste: Object.keys(canta), isaretli: [] };
}
function bavulGoster(b) {
  var harita = {}; S.parcalar.forEach(function (p) { harita[p.id] = p; });
  var liste = b.liste.map(function (id) { return harita[id]; }).filter(Boolean);
  var gov = h('div', null, h('p', { class: 'alt-yazi', text: t('bavulOzet', b.yer, b.gunler.length, liste.length) }));
  var hepsiGun = b.gunler.length && b.gunler.some(function (g) { return g.yagmur; });
  if (hepsiGun) gov.appendChild(h('div', { class: 'tahmin' }, ikon('semsiye', 'k'), h('span', { text: t('bavulSemsiye') })));
  gov.appendChild(h('h3', { class: 'baslik', style: { 'font-family': 'var(--serif)', 'font-weight': '500', 'font-size': '18px', margin: '18px 0 4px' }, text: t('bavulListe') }));
  GRUPLAR.forEach(function (g) {
    var gl = liste.filter(function (p) { return TUR[p.tur].g === g.id; });
    if (!gl.length) return;
    gov.appendChild(h('span', { class: 'etk', style: { display: 'block', 'margin-top': '10px', color: 'var(--soluk)', 'font-size': '13px' }, text: grupAd(g.id) }));
    gl.forEach(function (p) {
      var isaretli = b.isaretli.indexOf(p.id) >= 0;
      var sat = h('button', { class: 'isaret', role: 'checkbox', 'aria-checked': isaretli ? 'true' : 'false' },
        h('span', { class: 'kutu' }, isaretli ? ikon('tik', 'k') : null), resimEl(p.id, false, null, ''), h('span', { text: parcaAd(p) }));
      sat.querySelector('img') && (sat.querySelector('img').style.cssText = 'width:40px;height:40px;border-radius:9px;object-fit:cover');
      sat.addEventListener('click', function () {
        var i = b.isaretli.indexOf(p.id);
        if (i >= 0) b.isaretli.splice(i, 1); else b.isaretli.push(p.id);
        LS.yaz('bavul', b);
        var on = b.isaretli.indexOf(p.id) >= 0;
        sat.setAttribute('aria-checked', on ? 'true' : 'false');
        var kt = sat.querySelector('.kutu'); temizle(kt); if (on) kt.appendChild(ikon('tik', 'k'));
      });
      gov.appendChild(sat);
    });
  });
  gov.appendChild(h('h3', { class: 'baslik', style: { 'font-family': 'var(--serif)', 'font-weight': '500', 'font-size': '18px', margin: '22px 0 4px' }, text: t('gunGunKombin') }));
  b.gunler.forEach(function (g) {
    var d = new Date(g.tarih + 'T12:00:00');
    var mini = h('div', { class: 'mini-sira' });
    g.p.map(function (id) { return harita[id]; }).filter(Boolean).forEach(function (p) { mini.appendChild(resimEl(p.id, false, null, '')); });
    gov.appendChild(h('div', { class: 'bavul-gun' },
      h('div', { class: 'ust' }, h('b', { style: { 'font-weight': '500' }, text: tarihYaz(d.getTime()) }),
        h('span', { class: 'etiket' }, ikon(havaIkonu(g.s), 'k'), g.min + '°–' + g.max + '°' + (g.tahmini ? ' ~' : ''))), mini));
  });
  var s = sayfaAc({
    baslik: t('bavulBaslik'), icerik: gov,
    altBar: [h('button', { class: 'btn ikincil', text: t('kapat'), on: { click: function () { s.kapat(); } } }),
      h('button', { class: 'btn ana', on: { click: function () { s.kapat(); setTimeout(bavulFormu, 300); } } }, ikon('yenile', 'k'), t('yeniBavul'))]
  });
}
function sehirSecici(bitti) {
  var liste = h('div');
  var ara = h('input', { class: 'metin', type: 'search', placeholder: t('sehirAra'), maxlength: '40', 'data-odak': '1', on: { input: function () { doldur(); } } });
  function doldur() {
    temizle(liste);
    var q = katla(kirp(ara.value, 40).toLocaleLowerCase('tr'));
    if (S.hava.yer && sayiMi(S.hava.yer.lat) && !q) {
      var y = S.hava.yer;
      liste.appendChild(h('button', { class: 'sehir', on: { click: function () { s.kapat(); bitti({ ad: y.ad || t('konumun'), lat: y.lat, lon: y.lon }); } } },
        h('span', { style: { display: 'inline-flex', gap: '8px', 'align-items': 'center', color: 'var(--vurgu)', 'font-weight': '500' } }, ikon('konum', 'k'), y.ad || t('konumun'))));
    }
    SEHIRLER.filter(function (x) { return !q || katla(x.ad.toLocaleLowerCase('tr')).indexOf(q) >= 0; })
      .sort(function (a, b) { return a.ad.localeCompare(b.ad, 'tr'); })
      .forEach(function (x) { liste.appendChild(h('button', { class: 'sehir', text: x.ad, on: { click: function () { s.kapat(); bitti({ ad: x.ad, lat: x.lat, lon: x.lon }); } } })); });
  }
  var s = sayfaAc({ baslik: t('sehirSec'), icerik: h('div', null, h('div', { class: 'liste-ara' }, ara), liste) });
  doldur();
}

/* ---------- İstatistik ---------- */
function istatistikSayfasi() {
  if (!S.parcalar.filter(function (p) { return !p.ornek; }).length && !S.parcalar.length) { tost(t('istatistikBos')); return; }
  if (!ozIzin('istatistik')) return;
  ozKullan('istatistik');
  var l = S.parcalar.filter(function (p) { return TUR[p.tur] && TUR[p.tur].g !== 'ic'; });
  var toplamGiy = l.reduce(function (a, p) { return a + (p.giy || 0); }, 0);
  var fiyatli = l.filter(function (p) { return p.fiyat > 0; });
  var deger = fiyatli.reduce(function (a, p) { return a + p.fiyat; }, 0);
  var para = function (x) { try { return x.toLocaleString(A.dil === 'tr' ? 'tr-TR' : 'en-GB', { maximumFractionDigits: 0 }) + ' ₺'; } catch (e) { return Math.round(x) + ' ₺'; } };
  var gov = h('div');
  gov.appendChild(h('div', { class: 'istat-sayi' },
    h('div', null, h('b', { text: l.length }), h('small', { text: t('isParca') })),
    h('div', null, h('b', { text: toplamGiy }), h('small', { text: t('isGiyim') })),
    h('div', null, h('b', { text: fiyatli.length ? para(deger) : '—' }), h('small', { text: t('isDeger') }))));
  /* renk dağılımı */
  var renkSay = {}; l.forEach(function (p) { renkSay[p.renk] = (renkSay[p.renk] || 0) + 1; });
  var cubuk = h('div', { class: 'cubuk', role: 'img', 'aria-label': t('isRenk') });
  Object.keys(renkSay).sort(function (a, b) { return renkSay[b] - renkSay[a]; }).forEach(function (r) {
    cubuk.appendChild(h('i', { title: renkAd(r), style: { background: RENK[r] ? RENK[r].hex : '#999', width: (renkSay[r] / l.length * 100) + '%' } }));
  });
  var ilkRenkler = Object.keys(renkSay).sort(function (a, b) { return renkSay[b] - renkSay[a]; }).slice(0, 3).map(function (r) { return renkAd(r) + ' ' + renkSay[r]; }).join(', ');
  gov.appendChild(h('div', { class: 'bolum' }, h('span', { class: 'etk', text: t('isRenk') }), cubuk, h('p', { class: 'alt-yazi', style: { 'margin-top': '6px' }, text: ilkRenkler })));
  var satir = function (p, sag) {
    return h('div', { class: 'liste-satir' }, resimEl(p.id, false, null, ''), h('span', { text: parcaAd(p) }), h('small', { text: sag }));
  };
  var cok = l.filter(function (p) { return p.giy > 0; }).sort(function (a, b) { return b.giy - a.giy; }).slice(0, 5);
  if (cok.length) gov.appendChild(h('div', { class: 'bolum' }, h('span', { class: 'etk', text: t('isEnCok') }), cok.map(function (p) { return satir(p, t('kez', p.giy)); })));
  var otuzGun = Date.now() - 30 * 86400000;
  var unutulan = l.filter(function (p) { return !p.ornek && (p.son || p.eklendi || 0) < otuzGun; }).sort(function (a, b) { return (a.son || 0) - (b.son || 0); }).slice(0, 6);
  var hic = l.filter(function (p) { return !p.giy; }).length;
  gov.appendChild(h('div', { class: 'bolum' }, h('span', { class: 'etk', text: t('isUnutulan') }),
    h('p', { class: 'alt-yazi', text: t('isHic', hic) }),
    unutulan.map(function (p) { return satir(p, p.son ? kisaTarih(new Date(p.son)) : t('hic')); })));
  var maliyet = fiyatli.filter(function (p) { return p.giy > 0; }).map(function (p) { return { p: p, m: p.fiyat / p.giy }; }).sort(function (a, b) { return a.m - b.m; });
  var mb = h('div', { class: 'bolum' }, h('span', { class: 'etk', text: t('isMaliyet') }));
  if (!fiyatli.length) mb.appendChild(h('p', { class: 'alt-yazi', text: t('isFiyatYok') }));
  else if (!maliyet.length) mb.appendChild(h('p', { class: 'alt-yazi', text: t('isMaliyetYok') }));
  else {
    mb.appendChild(h('p', { class: 'alt-yazi', text: t('isMaliyetAlt') }));
    maliyet.slice(0, 3).forEach(function (x) { mb.appendChild(satir(x.p, para(x.m) + t('giyimBasi'))); });
    if (maliyet.length > 3) maliyet.slice(-2).reverse().forEach(function (x) { mb.appendChild(satir(x.p, para(x.m) + t('giyimBasi'))); });
  }
  gov.appendChild(mb);
  var grupSay = h('div', { class: 'sarili' });
  GRUPLAR.forEach(function (g) { var n = l.filter(function (p) { return TUR[p.tur].g === g.id; }).length; if (n) grupSay.appendChild(h('span', { class: 'etiket', text: grupAd(g.id) + ' ' + n })); });
  gov.appendChild(h('div', { class: 'bolum' }, h('span', { class: 'etk', text: t('isGrup') }), grupSay));
  var hy = ozHakYazi('istatistik'); if (hy) gov.appendChild(hy);
  sayfaAc({ baslik: t('istatistikBaslik'), icerik: gov });
}

/* ---------- İlham panosu ---------- */
function ilhamPanosu() {
  var gov = h('div');
  var izgara = h('div', { class: 'ilham-izgara' });
  function doldur() {
    temizle(gov);
    gov.appendChild(h('p', { class: 'alt-yazi', text: t('ilhamMetin') }));
    gov.appendChild(h('button', { class: 'btn ana kucuk', style: { 'margin-top': '12px' }, on: { click: ilhamEkle } }, ikon('arti', 'k'), t('ilhamEkle')));
    gov.appendChild(izgara);
    var hy = ozHakYazi('ilham'); if (hy) gov.appendChild(hy);
    temizle(izgara);
    Depo.ilhamlar().then(function (l) {
      (l || []).sort(function (a, b) { return b.eklendi - a.eklendi; }).forEach(function (x) {
        if (!(x.blob instanceof Blob)) return;
        var u = URL.createObjectURL(x.blob);
        izgara.appendChild(h('button', { class: 'oge', on: { click: function () { ilhamDetay(x, u, doldur); } } }, h('img', { src: u, alt: '' })));
      });
      if (!l || !l.length) izgara.appendChild(h('p', { class: 'alt-yazi', style: { 'grid-column': '1/-1' }, text: t('ilhamBos') }));
    }).catch(hataYakala);
  }
  function ilhamEkle() {
    var g = h('input', { type: 'file', accept: 'image/*', style: { display: 'none' } });
    document.body.appendChild(g);
    g.addEventListener('change', function () {
      var f = g.files && g.files[0]; g.remove(); if (!f) return;
      tost(t('fotoInceleniyor'));
      ilhamIsle(f).then(function (x) { return Depo.ilhamYaz(x); }).then(function () { tost(t('ilhamEklendi')); doldur(); })
        .catch(function (e) { hataYakala(e); tost(t('dosyaBozuk')); });
    });
    g.click();
  }
  sayfaAc({ baslik: t('ilhamBaslik'), icerik: gov });
  doldur();
}
function ilhamIsle(dosya) {
  return resimCoz(dosya).then(function (bmp) {
    var c = tuvaleCiz(bmp, 900), a = analizTuvali(bmp, false);
    var yz = '';
    if (YEREL) { try { var yt = tuvaleCiz(bmp, 480); yz = yt.toDataURL('image/jpeg', 0.85); yz = yz.slice(yz.indexOf(',') + 1); } catch (e) { yz = ''; } }
    try { if (bmp.close) bmp.close(); if (bmp.kapat) bmp.kapat(); } catch (e) { }
    var noktalar = [];
    for (var i = 0; i < a.veri.length; i += 16) noktalar.push(rgbLab(a.veri[i], a.veri[i + 1], a.veri[i + 2]));
    var km = kOrtalama(noktalar, 5), renkler = [];
    km.forEach(function (k) { if (k.pay >= 0.08) { var r = enYakinRenk(k.c); if (renkler.indexOf(r) < 0) renkler.push(r); } });
    var etiket = yz ? yerelCagir('etiketle', [yz], 20000) : Promise.resolve({ ok: false });
    return Promise.all([tuvaldenBlob(c, 0.85), etiket]).then(function (r) {
      var turlar = [];
      if (r[1].ok && Array.isArray(r[1].etiketler)) r[1].etiketler.forEach(function (e) { var tr = e && YZ_TUR[e.t]; if (tr && e.c >= 0.5 && turlar.indexOf(tr) < 0) turlar.push(tr); });
      return { id: yeniId(), eklendi: Date.now(), blob: r[0], renkler: renkler.slice(0, 4), turlar: turlar.slice(0, 4) };
    });
  });
}
function ilhamDetay(x, url, yenile) {
  var gov = h('div', null, h('img', { class: 'buyuk-resim', src: url, alt: '' }));
  var rk = h('div', { class: 'sarili', style: { 'margin-top': '10px' } });
  x.renkler.forEach(function (r) { if (RENK[r]) rk.appendChild(h('span', { class: 'renk-cip' }, h('i', { style: { background: RENK[r].hex } }), renkAd(r))); });
  x.turlar.forEach(function (tr) { if (TUR[tr]) rk.appendChild(h('span', { class: 'etiket', text: turAd(tr) })); });
  gov.appendChild(h('div', { class: 'bolum' }, h('span', { class: 'etk', text: t('ilhamGordum') }), rk));
  var hy = ozHakYazi('ilham'); if (hy) gov.appendChild(hy);
  var kur = h('button', { class: 'btn ana', on: { click: function () {
    if (!ozIzin('ilham')) return;
    var hv = varsayilanHava();
    var c = baglamKur('gunluk', hv, { renkTercih: x.renkler.filter(function (r) { return !!RENK[r]; }), turTercih: x.turlar.slice() });
    var sonuc;
    try { sonuc = kombinOner(oneriParcalari(), c); } catch (e) { hataYakala(e); sonuc = { kombinler: [] }; }
    if (!sonuc.kombinler.length) { tost(t('azParca')); return; }
    ozKullan('ilham');
    s.kapat();
    setTimeout(function () { onerilerSayfasi(t('ilhamSonuc'), t('ilhamSonucAlt'), sonuc.kombinler); }, 300);
  } } }, ikon('isilti', 'k'), t('benzeriniKur'));
  var sil = h('button', { class: 'btn ikincil tehlike', on: { click: function () {
    Depo.ilhamSil(x.id).then(function () { s.kapat(); try { URL.revokeObjectURL(url); } catch (e) { } yenile(); });
  } } }, ikon('cop', 'k'), t('sil'));
  var s = sayfaAc({ baslik: t('ilhamBaslik'), icerik: gov, altBar: [sil, kur] });
}

/* ---------- Takvim ---------- */
function takvimCiz() {
  var bol = h('div');
  var ay = S.takvimAy ? new Date(S.takvimAy) : new Date();
  ay.setDate(1); ay.setHours(12, 0, 0, 0);
  var adi;
  try { adi = ay.toLocaleDateString(A.dil === 'tr' ? 'tr-TR' : 'en-GB', { month: 'long', year: 'numeric' }); } catch (e) { adi = bugunAnahtar(ay).slice(0, 7); }
  var degistir = function (n) { var d = new Date(ay); d.setMonth(d.getMonth() + n); S.takvimAy = d.getTime(); ciz(); };
  bol.appendChild(h('div', { class: 'takvim-ust' },
    h('button', { class: 'ikon-btn', 'aria-label': t('oncekiAy'), on: { click: function () { degistir(-1); } } }, ikon('sol')),
    h('b', { style: { 'font-family': 'var(--serif)', 'font-size': '19px', 'font-weight': '500' }, text: adi }),
    h('button', { class: 'ikon-btn', 'aria-label': t('sonrakiAy'), on: { click: function () { degistir(1); } } }, ikon('sag'))));
  var g = gecmisAl(), gunMap = {};
  g.forEach(function (k) {
    var anahtar = k.plan && !k.giyildi ? k.plan : k.giyildi ? bugunAnahtar(new Date(k.tarih)) : null;
    if (!anahtar) return;
    (gunMap[anahtar] = gunMap[anahtar] || []).push(k);
  });
  var izgara = h('div', { class: 'takvim' });
  (A.dil === 'tr' ? ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']).forEach(function (x) { izgara.appendChild(h('div', { class: 'gb', text: x })); });
  var bosluk = (ay.getDay() + 6) % 7;
  for (var i = 0; i < bosluk; i++) izgara.appendChild(h('div', { class: 'gun bos' }));
  var bugun = bugunAnahtar();
  var gunSay = new Date(ay.getFullYear(), ay.getMonth() + 1, 0).getDate();
  var harita = {}; S.parcalar.forEach(function (p) { harita[p.id] = p; });
  for (var d = 1; d <= gunSay; d++) {
    (function (d) {
      var tarih = new Date(ay.getFullYear(), ay.getMonth(), d, 12);
      var anahtar = bugunAnahtar(tarih), girdi = gunMap[anahtar] || [];
      var gecmis = anahtar < bugun;
      var plan = girdi.some(function (k) { return k.plan && !k.giyildi; });
      var hucre = h('button', { class: 'gun' + (anahtar === bugun ? ' bugun' : '') + (gecmis ? ' gecmis' : '') + (plan ? ' plan' : ''), 'aria-label': tarihYaz(tarih.getTime()) },
        h('span', { text: d }));
      var ilk = girdi[0] && girdi[0].p.map(function (id) { return harita[id]; }).filter(function (p) { return p && TUR[p.tur] && TUR[p.tur].g !== 'aks'; })[0];
      if (ilk) hucre.appendChild(resimEl(ilk.id, false, null, ''));
      hucre.addEventListener('click', function () {
        if (girdi.length) kombinDetay(girdi[0]);
        else if (!gecmis) planla(anahtar);
        else tost(t('gecmisBosGun'));
      });
      izgara.appendChild(hucre);
    })(d);
  }
  bol.appendChild(izgara);
  bol.appendChild(h('p', { class: 'alt-yazi', style: { 'margin-top': '10px', 'font-size': '12.5px' }, text: t('takvimIpucu') }));
  return bol;
}
function planla(anahtar) {
  if (!ozIzin('takvim')) return;
  var kayitli = gecmisAl().filter(function (k) { return (k.fav || k.kendi) && !k.plan; });
  var gov = h('div', null, h('p', { class: 'alt-yazi', text: t('planMetin', tarihYaz(new Date(anahtar + 'T12:00:00').getTime())) }));
  gov.appendChild(h('button', { class: 'btn ikincil kucuk', style: { 'margin-top': '12px' }, on: { click: function () { s.kapat(); setTimeout(function () { kombinKur({ plan: anahtar }); }, 300); } } }, ikon('arti', 'k'), t('yeniKombinKur')));
  var kutu = h('div', { class: 'gecmis' });
  var harita = {}; S.parcalar.forEach(function (p) { harita[p.id] = p; });
  kayitli.slice(0, 40).forEach(function (k) {
    var kolaj = h('div', { class: 'mini-kolaj' });
    k.p.map(function (id) { return harita[id]; }).filter(Boolean).slice(0, 4).forEach(function (p) { kolaj.appendChild(resimEl(p.id, false, null, '')); });
    kutu.appendChild(h('button', { class: 'gecmis-oge', on: { click: function () {
      var g = gecmisAl();
      g.unshift({ id: yeniId(), tarih: Date.now(), plan: anahtar, p: k.p.slice(0, 16), o: k.o, m: k.m, ad: k.ad || '', fav: false, giyildi: false });
      gecmisYaz(g); ozKullan('takvim'); s.kapat(); tost(t('planlandi')); ciz();
    } } }, kolaj, h('div', { class: 'bilgi' }, h('b', { text: k.ad || k.m || ortamAd(k.o) || t('kombin') }), h('small', { text: ortamAd(k.o) }))));
  });
  if (!kayitli.length) kutu.appendChild(h('p', { class: 'alt-yazi', text: t('planKayitYok') }));
  gov.appendChild(kutu);
  var hy = ozHakYazi('takvim'); if (hy) gov.appendChild(hy);
  var s = sayfaAc({ baslik: t('planla'), icerik: gov });
}
