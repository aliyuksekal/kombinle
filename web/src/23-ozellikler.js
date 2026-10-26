/* =========================================================
   Yeni özellikler: renk analizi, makyaj & oje önerisi, "Bunu daha önce giydin" uyarısı,
   mağazada "Alsam mı?", toplulukta "A mı B mi?" anketi.
   Hepsi cihazda çalışır; yalnız renk analizi ve anket sunucuya gider.
   ========================================================= */

/* ---------- 1. Kişisel renk analizi ---------- */
var RENK_MEVSIMLERI = ['ilkbahar', 'yaz', 'sonbahar', 'kis'];
function renkAnalizi() {
  var r = A.renkAnaliz;
  return r && RENK_MEVSIMLERI.indexOf(r.mevsim) >= 0 && Array.isArray(r.iyi) ? r : null;
}
function renkAnaliziTemizle(s) {
  if (!s || typeof s !== 'object' || RENK_MEVSIMLERI.indexOf(s.mevsim) < 0) return null;
  var renkler = function (l, n) { return (Array.isArray(l) ? l : []).filter(function (x, i, d) { return RENK[x] && d.indexOf(x) === i; }).slice(0, n); };
  return {
    mevsim: s.mevsim,
    alt: ['sicak', 'soguk', 'notr'].indexOf(s.alt) >= 0 ? s.alt : 'notr',
    kontrast: ['dusuk', 'orta', 'yuksek'].indexOf(s.kontrast) >= 0 ? s.kontrast : 'orta',
    iyi: renkler(s.iyi, 8), kacin: renkler(s.kacin, 4),
    metal: ['altin', 'gumus', 'ikisi'].indexOf(s.metal) >= 0 ? s.metal : 'ikisi',
    ruj: (Array.isArray(s.ruj) ? s.ruj : []).filter(function (x) { return MAKYAJ.ruj[x]; }).slice(0, 3),
    aciklama: kirp(s.aciklama, 260),
    ipuclari: (Array.isArray(s.ipuclari) ? s.ipuclari : []).map(function (x) { return kirp(x, 140); }).filter(Boolean).slice(0, 3),
    tarih: sayiMi(s.tarih) ? s.tarih : Date.now()
  };
}
/* Kombin motoruna: yüze yakın parçalarda yakışan renklere artı, kaçınılacak renklere eksi puan */
var YUZE_YAKIN = { ust: 1, tek: 1, dis: 1 };
function paletBonusu(bonus) {
  var r = renkAnalizi(); if (!r) return bonus;
  S.parcalar.forEach(function (p) {
    var g = TUR[p.tur] ? TUR[p.tur].g : '';
    if (!YUZE_YAKIN[g] && p.tur !== 'esarp' && p.tur !== 'atki') return;
    var b = 0;
    if (r.iyi.indexOf(p.renk) >= 0) b += 1.2; else if (r.iyi.indexOf(p.renk2) >= 0) b += 0.4;
    if (r.kacin.indexOf(p.renk) >= 0) b -= 1.2;
    if (b) bonus[p.id] = (bonus[p.id] || 0) + b;
  });
  return bonus;
}
function renkOrnek(hex, buyuk) {
  return h('i', { class: 'renk-ornek' + (buyuk ? ' buyuk' : ''), style: { background: hex }, 'aria-hidden': 'true' });
}
function renkAnaliziSayfasi() {
  if (!yzKurulu()) { tost(t('yzKapali')); return; }
  var gov = h('div', { class: 'profil-duzen' });
  var s = sayfaAc({ baslik: t('renkBaslik'), icerik: gov });
  var galeri = h('input', { type: 'file', accept: 'image/*', class: 'gizli', 'aria-hidden': 'true' });
  function ciz2() {
    temizle(gov);
    gov.appendChild(galeri);
    var r = renkAnalizi();
    if (r) gov.appendChild(paletKarti(r));
    else gov.appendChild(h('p', { class: 'alt-yazi', text: t('renkMetin') }));
    gov.appendChild(h('ul', { class: 'renk-ipucu' }, ['renkIp1', 'renkIp2', 'renkIp3'].map(function (k) { return h('li', null, ikon('tik', 'k'), h('span', { text: t(k) })); })));
    var cek = h('button', { class: 'btn ana', style: { width: '100%' } }, ikon('kamera', 'k'), r ? t('renkYenile') : t('renkSelfie'));
    var sec = h('button', { class: 'btn ikincil', style: { width: '100%' } }, ikon('galeri', 'k'), t('renkGaleri'));
    cek.addEventListener('click', function () { if (ozIzin('renk')) fotografCek({ mod: 'selfie' }).then(isle); });
    sec.addEventListener('click', function () { if (ozIzin('renk')) galeri.click(); });
    gov.appendChild(cek); gov.appendChild(sec);
    if (!S.pro && !sahipMi()) gov.appendChild(h('p', { class: 'hak', text: t('jetonBilgi', 1, jeton()) }));
    gov.appendChild(h('p', { class: 'ayar-not', text: t('renkGizlilik') }));
    if (r) gov.appendChild(h('button', { class: 'g-btn-cizgi kucuk', style: { 'align-self': 'center' }, text: t('renkSil'), on: { click: function () {
      A.renkAnaliz = null; ayarKaydet(); tost(t('renkSilindi')); ciz2(); ciz();
    } } }));
  }
  function isle(f) {
    if (!f) return;
    temizle(gov);
    gov.appendChild(h('div', { class: 'g-yukleniyor', style: { padding: '40px 0' } }, h('span', { class: 'yukleniyor' }), h('p', { class: 'alt-yazi', text: t('renkBakiyor') })));
    resimCoz(f).then(function (bmp) {
      var c = tuvaleCiz(bmp, 1024);
      try { if (bmp.close) bmp.close(); } catch (e) { }
      var d = c.toDataURL('image/jpeg', 0.88);
      return yzIste('/v1/renk', { resim: d.slice(d.indexOf(',') + 1), renkler: yzRenkListesi(), dil: A.dil }, 60000);
    }).then(function (v) {
      var sn = v && v.sonuc;
      if (!sn || sn.yuz === false) { tost(t('renkYuzYok')); ciz2(); return; }
      olay('renk');
      var r = renkAnaliziTemizle(Object.assign({}, sn, { tarih: Date.now() }));
      if (!r || !r.iyi.length) { tost(t('renkHata')); ciz2(); return; }
      ozKullan('renk');
      A.renkAnaliz = r; ayarKaydet(); S.sonuc = null; ciz();
      tost(t('renkHazir', t('mv_' + r.mevsim)));
      ciz2();
    }).catch(function (e) { tost(yzHataMetni(e, t('renkHata'))); ciz2(); });
  }
  galeri.addEventListener('change', function (e) { var f = e.target.files && e.target.files[0]; e.target.value = ''; isle(f); });
  ciz2();
  return s;
}
function paletKarti(r) {
  var iyi = h('div', { class: 'renk-sira' }, r.iyi.map(function (id) { return h('span', { class: 'renk-hap' }, renkOrnek(RENK[id].hex, true), h('small', { text: renkAd(id) })); }));
  var kacin = r.kacin.length ? h('div', { class: 'renk-sira kacin' }, r.kacin.map(function (id) { return h('span', { class: 'renk-hap' }, renkOrnek(RENK[id].hex, true), h('small', { text: renkAd(id) })); })) : null;
  var ruj = r.ruj.length ? h('div', { class: 'renk-sira' }, r.ruj.map(function (id) { return h('span', { class: 'renk-hap' }, renkOrnek(MAKYAJ.ruj[id], true), h('small', { text: makyajAd(id) })); })) : null;
  return h('div', { class: 'palet-kart' },
    h('div', { class: 'palet-bas' }, h('span', { class: 'g-arac-ikon' }, ikon('palet')),
      h('div', null, h('b', { text: t('mv_' + r.mevsim) }), h('small', { text: t('alt_' + r.alt) + ' • ' + t('kon_' + r.kontrast) + ' • ' + t('metal_' + r.metal) }))),
    r.aciklama ? h('p', { class: 'palet-metin', text: r.aciklama }) : null,
    h('span', { class: 'g-bolum-etk', text: t('renkYakisan') }), iyi,
    kacin ? h('span', { class: 'g-bolum-etk', text: t('renkKacin') }) : null, kacin,
    ruj ? h('span', { class: 'g-bolum-etk', text: t('renkRuj') }) : null, ruj,
    r.ipuclari.length ? h('ul', { class: 'renk-ipucu' }, r.ipuclari.map(function (x) { return h('li', null, ikon('ampul', 'k'), h('span', { text: x })); })) : null);
}

/* ---------- 2. Kombine uygun makyaj ve oje (kural tabanlı, internetsiz) ---------- */
var MAKYAJ = {
  ruj: { nude_sicak: '#C68A6A', gul_kurusu: '#B97A7F', mercan: '#E5655B', seftali: '#EE9F7E', kirmizi_soguk: '#A8122C', kirmizi_sicak: '#C8361E',
    bordo: '#6B1A2C', fusya: '#C2185B', tugla: '#9E4430', bebek_pembe: '#E6A0B1', murdum: '#5E1F3D' },
  far: { sampanya: '#E8D2B0', bronz: '#9C6B45', kahve_far: '#5E4334', gul_altin: '#D9A49A', duman: '#4F4F5A', zeytin_far: '#6A6838', lavanta_far: '#9C88B8' },
  oje: { nude_oje: '#E6C4AE', klasik_kirmizi: '#B0172B', bordo_oje: '#5B1324', pudra_oje: '#E8C0C0', sut_beyaz: '#F3EDE4', mercan_oje: '#E66A5E',
    lacivert_oje: '#1E2A4A', fusya_oje: '#C21E6B', lavanta_oje: '#B8A2D5' }
};
function makyajAd(id) { return t('mk_' + id); }
/* renk ailesi: kirmizi, pembe, turuncu, sari, yesil, mavi, mor ya da nötr */
function renkAilesi(id) {
  var r = RENK[id]; if (!r || r.notr) return '';
  if (id === 'pembe' || id === 'pudra' || id === 'fusya') return 'pembe';
  if (id === 'bordo') return 'kirmizi';
  if (id === 'somon') return 'turuncu';
  var ton = renkTon(id); if (!ton) return '';
  var hh = ton.h;
  if (hh >= 340 || hh < 15) return 'kirmizi';
  if (hh < 45) return 'turuncu';
  if (hh < 70) return 'sari';
  if (hh < 165) return 'yesil';
  if (hh < 255) return 'mavi';
  if (hh < 300) return 'mor';
  return 'pembe';
}
var SICAK_NOTR = { bej: 1, taba: 1, kahve: 1, krem: 1, haki: 1, zeytin: 1 };
function makyajOner(k, c) {
  var parcalar = kombinParcalari(k);
  var agirlik = { tek: 3, ust: 2.5, dis: 2, alt: 1.5, ayk: 0.6, aks: 0.8, ic: 0 };
  var aileler = {}, sicak = 0, soguk = 0, aksanRenk = '';
  var enIyi = 0;
  parcalar.forEach(function (p) {
    var g = TUR[p.tur] ? TUR[p.tur].g : 'aks', w = agirlik[g] || 1;
    [[p.renk, w], [p.renk2, w * 0.5]].forEach(function (x) {
      if (!x[0] || !RENK[x[0]]) return;
      var a = renkAilesi(x[0]);
      if (a) {
        aileler[a] = (aileler[a] || 0) + x[1];
        if (aileler[a] > enIyi) { enIyi = aileler[a]; aksanRenk = x[0]; }
        if (a === 'turuncu' || a === 'sari' || (a === 'yesil' && (x[0] === 'haki' || x[0] === 'zeytin'))) sicak += x[1]; else if (a === 'mavi' || a === 'mor' || a === 'pembe') soguk += x[1];
      } else if (SICAK_NOTR[x[0]]) sicak += x[1] * 0.6; else soguk += x[1] * 0.4;
    });
  });
  var aksan = aksanRenk ? renkAilesi(aksanRenk) : '';
  var pal = renkAnalizi();
  var ton = pal && pal.alt !== 'notr' ? pal.alt : (sicak > soguk ? 'sicak' : 'soguk');
  var oid = c && c.oid || 'gunluk', f = c && c.f || 'g';
  var cesur = oid === 'davet' || oid === 'randevu' || f === 's';
  var sade = !cesur && (oid === 'is' || oid === 'okul' || oid === 'spor' || oid === 'taziye' || oid === 'doga' || f === 'r' || f === 'p');
  var ruj, far, oje, nRuj, nOje;
  var ras = ton === 'sicak';
  if (aksan === 'kirmizi') { ruj = cesur ? (ras ? 'kirmizi_sicak' : 'kirmizi_soguk') : (ras ? 'nude_sicak' : 'gul_kurusu'); nRuj = cesur ? 'esles' : 'yumusak'; }
  else if (aksan === 'pembe') { ruj = cesur ? 'fusya' : 'bebek_pembe'; nRuj = 'esles'; }
  else if (aksan === 'turuncu' || aksan === 'sari') { ruj = cesur ? 'mercan' : 'seftali'; nRuj = 'esles'; }
  else if (aksan === 'yesil') { ruj = cesur ? 'kirmizi_sicak' : (ras ? 'tugla' : 'gul_kurusu'); nRuj = cesur ? 'zit' : 'yumusak'; }
  else if (aksan === 'mavi') { ruj = cesur ? (ras ? 'mercan' : 'kirmizi_soguk') : 'gul_kurusu'; nRuj = cesur ? 'zit' : 'yumusak'; }
  else if (aksan === 'mor') { ruj = cesur ? 'murdum' : 'bebek_pembe'; nRuj = 'esles'; }
  else { ruj = cesur ? (pal && pal.ruj[0] ? pal.ruj[0] : (ras ? 'kirmizi_sicak' : 'kirmizi_soguk')) : sade ? (ras ? 'nude_sicak' : 'gul_kurusu') : (ras ? 'tugla' : 'bordo'); nRuj = cesur ? 'vurgu' : 'yumusak'; }
  if (sade && (ruj === 'kirmizi_soguk' || ruj === 'kirmizi_sicak' || ruj === 'fusya' || ruj === 'murdum')) { ruj = ras ? 'nude_sicak' : 'gul_kurusu'; nRuj = 'yumusak'; }
  if (pal && !cesur && pal.ruj.length && nRuj === 'yumusak') { ruj = pal.ruj.filter(function (x) { return ['nude_sicak', 'gul_kurusu', 'seftali', 'bebek_pembe', 'mercan'].indexOf(x) >= 0; })[0] || ruj; nRuj = 'palet'; }
  if (aksan === 'pembe') far = 'gul_altin';
  else if (aksan === 'yesil') far = cesur ? 'bronz' : 'sampanya';
  else if (aksan === 'mor') far = cesur ? 'duman' : 'lavanta_far';
  else if (aksan === 'mavi') far = cesur ? 'bronz' : 'sampanya';
  else if (!aksan && cesur) far = ras ? 'bronz' : 'duman';
  else far = ras ? (sade ? 'sampanya' : 'bronz') : (sade ? 'sampanya' : 'gul_altin');
  if (sade) { oje = ras ? 'nude_oje' : (oid === 'is' ? 'pudra_oje' : 'sut_beyaz'); nOje = 'yumusak'; }
  else if (aksan === 'kirmizi') { oje = 'klasik_kirmizi'; nOje = 'esles'; }
  else if (aksan === 'pembe') { oje = cesur ? 'fusya_oje' : 'pudra_oje'; nOje = 'esles'; }
  else if (aksan === 'turuncu' || aksan === 'sari') { oje = 'mercan_oje'; nOje = 'esles'; }
  else if (aksan === 'mavi') { oje = cesur ? 'lacivert_oje' : 'nude_oje'; nOje = cesur ? 'esles' : 'yumusak'; }
  else if (aksan === 'mor') { oje = 'lavanta_oje'; nOje = 'esles'; }
  else if (aksan === 'yesil') { oje = cesur ? 'bordo_oje' : 'nude_oje'; nOje = cesur ? 'zit' : 'yumusak'; }
  else { oje = cesur ? (buMevsim() === 's' || buMevsim() === 'k' ? 'bordo_oje' : 'klasik_kirmizi') : 'nude_oje'; nOje = cesur ? 'vurgu' : 'yumusak'; }
  var neden = function (n) {
    if (n === 'esles') return t('mkEsles', renkAd(aksanRenk));
    if (n === 'zit') return t('mkZit', renkAd(aksanRenk));
    if (n === 'vurgu') return t('mkVurgu');
    if (n === 'palet') return t('mkPalet');
    return t('mkYumusak');
  };
  return {
    liste: [{ tur: 'ruj', id: ruj, hex: MAKYAJ.ruj[ruj], neden: neden(nRuj) },
      { tur: 'far', id: far, hex: MAKYAJ.far[far], neden: cesur ? t('mkFarCesur') : t('mkFarSade') },
      { tur: 'oje', id: oje, hex: MAKYAJ.oje[oje], neden: neden(nOje) }],
    metal: pal ? pal.metal : (ras ? 'altin' : 'gumus')
  };
}
function makyajBolumu(k, c) {
  var m = makyajOner(k, c);
  var liste = h('ul', { class: 'makyaj-liste' });
  m.liste.forEach(function (x) {
    liste.appendChild(h('li', null, renkOrnek(x.hex, true),
      h('div', null, h('b', null, t('mkTur_' + x.tur) + ': ', h('span', { text: makyajAd(x.id) })), h('small', { text: x.neden }))));
  });
  liste.appendChild(h('li', null, h('i', { class: 'renk-ornek buyuk metal-' + (m.metal === 'gumus' ? 'gumus' : m.metal === 'altin' ? 'altin' : 'ikisi'), 'aria-hidden': 'true' }),
    h('div', null, h('b', null, t('mkTur_taki') + ': ', h('span', { text: t('metal_' + m.metal) })), h('small', { text: renkAnalizi() ? t('mkPalet') : t('mkTakiNot') }))));
  var d = h('details', { class: 'g-neden g-makyaj' }, h('summary', null, ikon('isilti', 'k'), ' ', t('mkBaslik')), liste);
  if (!renkAnalizi() && yzKurulu()) d.appendChild(h('button', { class: 'g-btn-cizgi kucuk', style: { margin: '4px 0 10px' }, text: t('mkRenkOner'), on: { click: renkAnaliziSayfasi } }));
  return d;
}

/* ---------- 3. "Bunu daha önce giydin" uyarısı ----------
   Giyilen kombin "kimlerle" bilgisiyle saklanır; aynı kişilerle buluşurken yakın zamanda giyilen parçalar
   önerilerde geri plana itilir ve sonuçta uyarı çıkar. Her şey telefonda kalır. */
var CEVRE_SABIT = ['aile', 'is', 'arkadas', 'okul', 'akraba'];
var TEKRAR_GUN = 120;
function cevreler() {
  var ozel = Array.isArray(A.cevreler) ? A.cevreler : [];
  return CEVRE_SABIT.map(function (id) { return { id: id, ad: t('cv_' + id) }; })
    .concat(ozel.map(function (x) { return { id: x.id, ad: x.ad }; }));
}
function cevreAd(id) { var x = cevreler().filter(function (c) { return c.id === id; })[0]; return x ? x.ad : ''; }
function cevreGecerli(id) { return typeof id === 'string' && cevreler().some(function (c) { return c.id === id; }); }
function cevreEkle(bitti) {
  var g = h('input', { class: 'metin', maxlength: '20', placeholder: t('cvYeniYer'), 'aria-label': t('cvYeni') });
  var ok = h('button', { class: 'btn ana', style: { width: '100%' } }, t('ekle'));
  var s = sayfaAc({ baslik: t('cvYeni'), icerik: h('div', { class: 'profil-duzen' }, h('p', { class: 'alt-yazi', text: t('cvYeniMetin') }), g, ok) });
  setTimeout(function () { try { g.focus(); } catch (e) { } }, 300);
  ok.addEventListener('click', function () {
    var ad = kirp(g.value.replace(/\s+/g, ' ').trim(), 20);
    if (ad.length < 2) { tost(t('cvKisa')); return; }
    var l = Array.isArray(A.cevreler) ? A.cevreler.slice() : [];
    var var_ = cevreler().filter(function (c) { return c.ad.toLocaleLowerCase('tr') === ad.toLocaleLowerCase('tr'); })[0];
    var id = var_ ? var_.id : 'cv' + Math.random().toString(36).slice(2, 10);
    if (!var_) { l.push({ id: id, ad: ad }); A.cevreler = l.slice(-10); ayarKaydet(); }
    s.kapat(); if (bitti) bitti(id);
  });
}
/* kimlerle seçici: istek kartında ve "giydim" sorusunda kullanılır */
function kimleCipleri(secili, degisti) {
  var kap = h('div', { class: 'cipler g-kimle' });
  function doldur() {
    temizle(kap);
    cevreler().forEach(function (c) {
      var b = h('button', { class: 'cip kucuk', 'aria-pressed': secili.indexOf(c.id) >= 0 ? 'true' : 'false', text: c.ad });
      b.addEventListener('click', function () {
        var i = secili.indexOf(c.id);
        if (i >= 0) secili.splice(i, 1); else { secili.push(c.id); LS.yaz('kimleKullanildi', true); }
        b.setAttribute('aria-pressed', i >= 0 ? 'false' : 'true');
        degisti(secili);
      });
      kap.appendChild(b);
    });
    kap.appendChild(h('button', { class: 'cip kucuk', 'aria-label': t('cvYeni'), on: { click: function () {
      cevreEkle(function (id) { if (secili.indexOf(id) < 0) secili.push(id); degisti(secili); doldur(); });
    } } }, ikon('arti', 'k'), t('cvEkle')));
  }
  doldur();
  return kap;
}
function kimleSecici() {
  if (!Array.isArray(S.kimle)) S.kimle = [];
  S.kimle = S.kimle.filter(cevreGecerli);
  return h('div', null, h('label', { class: 'g-etiket', text: t('kimleEtiket') }),
    kimleCipleri(S.kimle, function (l) { S.kimle = l.slice(); }));
}
/* aynı kişilerle yakın zamanda giyilen parçalar: { parçaId: { tarih, cevre } } */
function tekrarHaritasi(kimle) {
  var harita = Object.create(null);
  if (!Array.isArray(kimle) || !kimle.length) return harita;
  var sinir = Date.now() - TEKRAR_GUN * 86400000;
  gecmisAl().forEach(function (x) {
    if (!x.giyildi || !Array.isArray(x.kim) || x.tarih < sinir) return;
    var ortak = x.kim.filter(function (c) { return kimle.indexOf(c) >= 0; })[0];
    if (!ortak) return;
    x.p.forEach(function (id) { if (!harita[id] || harita[id].tarih < x.tarih) harita[id] = { tarih: x.tarih, cevre: ortak }; });
  });
  return harita;
}
var TEKRAR_GRUP = { ust: 1, tek: 1, dis: 1, alt: 1 };
function tekrarBonusu(bonus, harita) {
  S.parcalar.forEach(function (p) {
    var g = TUR[p.tur] ? TUR[p.tur].g : '';
    if (harita[p.id] && TEKRAR_GRUP[g]) bonus[p.id] = (bonus[p.id] || 0) - (g === 'tek' || g === 'dis' ? 8 : 5);
  });
  return bonus;
}
function tekrarListesi(harita) {
  return S.parcalar.filter(function (p) { return harita[p.id] && TUR[p.tur] && TEKRAR_GRUP[TUR[p.tur].g]; }).map(function (p) { return p.id; }).slice(0, 60);
}
function tekrarUyarisi(k, harita) {
  if (!harita) return null;
  var l = kombinParcalari(k).filter(function (p) { return harita[p.id] && TUR[p.tur] && TEKRAR_GRUP[TUR[p.tur].g]; });
  if (!l.length) return null;
  var p = l[0], x = harita[p.id];
  return h('div', { class: 'g-hava-not g-tekrar' }, ikon('bilgi', 'k'),
    h('div', null, h('b', { text: t('tekrarBaslik') }),
      h('p', { text: t('tekrarMetin', p.ad || turAd(p.tur).toLocaleLowerCase(A.dil === 'tr' ? 'tr' : 'en'), cevreAd(x.cevre), kisaTarih(new Date(x.tarih))) + (l.length > 1 ? ' ' + t('tekrarDaha', l.length - 1) : '') })));
}
/* "Giydim" denince: kimlerle giydiği sorulur (istek kartında seçtiyse sormadan kaydedilir) */
function giyimCevresiKaydet(kayitId) {
  var yaz = function (l) {
    var g = gecmisAl(), x = g.filter(function (y) { return y.id === kayitId; })[0];
    if (!x) return;
    x.kim = l.filter(cevreGecerli).slice(0, 6);
    gecmisYaz(g);
  };
  if (Array.isArray(S.kimle) && S.kimle.length) { yaz(S.kimle); return; }
  /* özelliği hiç kullanmamış kişiye her "giydim"de soru sorulmaz */
  if (LS.al('kimleKullanildi', false) !== true) return;
  var secili = [];
  var tamam = h('button', { class: 'btn ana', style: { flex: '1' } }, t('kaydet'));
  var atla = h('button', { class: 'btn ikincil', style: { flex: '1' } }, t('atla'));
  var s = sayfaAc({ baslik: t('kimleSoru'), icerik: h('div', { class: 'profil-duzen' }, h('p', { class: 'alt-yazi', text: t('kimleSoruMetin') }),
    kimleCipleri(secili, function () { })), altBar: h('div', { class: 'sarili', style: { width: '100%', gap: '10px' } }, atla, tamam) });
  atla.addEventListener('click', function () { s.kapat(); });
  tamam.addEventListener('click', function () { if (secili.length) { yaz(secili); tost(t('kimleKaydedildi')); } s.kapat(); ciz(); });
}

/* ---------- 4. Mağazada "Alsam mı?" ---------- */
function alsamMiSayfasi() {
  var gov = h('div', { class: 'profil-duzen' });
  var s = sayfaAc({ baslik: t('alsamBaslik'), icerik: gov });
  var galeri = h('input', { type: 'file', accept: 'image/*', class: 'gizli', 'aria-hidden': 'true' });
  var fiyat = h('input', { class: 'metin', type: 'text', inputmode: 'decimal', maxlength: '9', placeholder: t('alsamFiyatYer'), 'aria-label': t('alsamFiyat') });
  if (S.alsamFiyat) fiyat.value = S.alsamFiyat;
  fiyat.addEventListener('input', function () { S.alsamFiyat = kirp(fiyat.value, 9); });
  function bas() {
    temizle(gov);
    gov.appendChild(galeri);
    gov.appendChild(h('p', { class: 'alt-yazi', text: t('alsamMetin') }));
    gov.appendChild(h('label', { class: 'hesap-alan' }, h('span', { text: t('alsamFiyat') }), fiyat));
    gov.appendChild(h('button', { class: 'btn ana', style: { width: '100%' }, on: { click: function () { fotografCek({ mod: 'urun' }).then(isle); } } }, ikon('kamera', 'k'), t('alsamCek')));
    gov.appendChild(h('button', { class: 'btn ikincil', style: { width: '100%' }, on: { click: function () { galeri.click(); } } }, ikon('galeri', 'k'), t('alsamGaleri')));
    if (S.parcalar.filter(function (p) { return !p.ornek; }).length < 3) gov.appendChild(h('p', { class: 'ayar-not', text: t('alsamAzParca') }));
  }
  function isle(f) {
    if (!f) return;
    temizle(gov);
    gov.appendChild(h('div', { class: 'g-yukleniyor', style: { padding: '40px 0' } }, h('span', { class: 'yukleniyor' }), h('p', { class: 'alt-yazi', text: t('taniniyor') })));
    fotografIsle(f).then(function (sn) { olay('alsam'); alsamSonuc(gov, sn, f, bas, s); }).catch(function () { tost(t('fotoHata')); bas(); });
  }
  galeri.addEventListener('change', function (e) { var f = e.target.files && e.target.files[0]; e.target.value = ''; isle(f); });
  bas();
  return s;
}
function fiyatSayi(v) { var n = parseFloat(String(v || '').replace(/[^\d,.]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')); return sayiMi(n) && n > 0 && n < 1e7 ? n : 0; }
/* aday parçanın dolaptaki parçalarla kurabileceği kombinler (renk uyumu cihazda hesaplanır) */
function alsamHesapla(aday) {
  var parcalar = S.parcalar.filter(function (p) { return !p.ornek && !p.dinlen && TUR[p.tur]; });
  var g = TUR[aday.tur].g;
  var grup = function (gg) { return parcalar.filter(function (p) { return TUR[p.tur].g === gg; }); };
  var uyar = function (l) { return renkUyum(l, null) > 0; };
  var kombinler = [];
  var ayklar = grup('ayk');
  var aykSec = function (l) { return ayklar.filter(function (a) { return uyar(l.concat([a])); })[0] || null; };
  if (g === 'ust') grup('alt').forEach(function (a) { if (uyar([aday, a])) kombinler.push([a, aykSec([aday, a])]); });
  else if (g === 'alt') grup('ust').forEach(function (u) { if (uyar([aday, u])) kombinler.push([u, aykSec([aday, u])]); });
  else if (g === 'tek') { ayklar.forEach(function (a) { if (uyar([aday, a])) kombinler.push([a]); }); if (!ayklar.length) kombinler.push([]); }
  else {
    /* dış giyim, ayakkabı, aksesuar: mevcut üst+alt ya da elbise kombinlerine eklenir */
    var tabanlar = [];
    grup('tek').forEach(function (x) { tabanlar.push([x]); });
    grup('ust').forEach(function (u) { grup('alt').forEach(function (a) { if (uyar([u, a])) tabanlar.push([u, a]); }); });
    tabanlar.forEach(function (tb) { if (uyar(tb.concat([aday]))) kombinler.push(tb); });
  }
  var benzer = parcalar.filter(function (p) {
    if (p.tur !== aday.tur && !(TUR[p.tur].g === g && g !== 'aks' && g !== 'ayk')) return false;
    var a = RENK[p.renk], b = RENK[aday.renk]; if (!a || !b) return false;
    var la = rgbLab.apply(null, hexRgb(a.hex)), lb = rgbLab.apply(null, hexRgb(b.hex));
    return labMesafe(la, lb) < 18 && (p.tur === aday.tur || labMesafe(la, lb) < 8) && !!p.desen === !!aday.desen;
  });
  return { kombinler: kombinler, benzer: benzer };
}
function alsamSonuc(gov, sn, f, geri, sayfa) {
  var an = sn.analiz || {};
  var tur = an.turlar && an.turlar[0] && TUR[an.turlar[0]] ? an.turlar[0] : '';
  var url = URL.createObjectURL(sn.kucuk);
  var aday = { id: 'aday', tur: tur, renk: RENK[an.renk] ? an.renk : 'siyah', renk2: an.renk2 || '', desen: an.desen ? 1 : 0 };
  function ciz3() {
    temizle(gov);
    var turSec = h('select', { class: 'g-girdi', 'aria-label': t('turu') });
    turSec.appendChild(h('option', { value: '', text: t('turSec') }));
    GRUPLAR.forEach(function (g) {
      var og = h('optgroup', { label: grupAd(g.id) });
      TURLER.filter(function (x) { return x.g === g.id && g.id !== 'ic' && turGoster(x, aday.tur); }).forEach(function (x) { var o = h('option', { value: x.id, text: turAd(x.id) }); if (x.id === aday.tur) o.selected = true; og.appendChild(o); });
      if (og.childNodes.length) turSec.appendChild(og);
    });
    turSec.addEventListener('change', function () { aday.tur = turSec.value; ciz3(); });
    gov.appendChild(h('div', { class: 'alsam-ust' }, h('img', { src: url, alt: '' }),
      h('div', null, h('b', { text: aday.tur ? renkAd(aday.renk) + ' ' + turAd(aday.tur).toLocaleLowerCase(A.dil === 'tr' ? 'tr' : 'en') : t('turSec') }),
        h('small', { text: t('alsamDuzelt') }), turSec)));
    if (!aday.tur) return;
    var r = alsamHesapla(aday);
    var n = r.kombinler.length, fiyatN = fiyatSayi(S.alsamFiyat);
    var karar = n >= 5 && !r.benzer.length ? 'al' : (n <= 1 || r.benzer.length >= 2) ? 'alma' : 'dusun';
    gov.appendChild(h('div', { class: 'alsam-karar ' + karar }, ikon(karar === 'al' ? 'tik' : karar === 'alma' ? 'kapat' : 'bilgi', 'k'),
      h('div', null, h('b', { text: t('alsam_' + karar) }), h('p', { text: t('alsamKombin', n) + (r.benzer.length ? ' ' + t('alsamBenzer', r.benzer.length) : '') }))));
    if (fiyatN) {
      var giyim = sinirla(n * 3, 3, 60);
      gov.appendChild(h('p', { class: 'alsam-maliyet', text: t('alsamMaliyet', Math.round(fiyatN / giyim * 10) / 10, giyim) }));
    }
    if (r.benzer.length) {
      gov.appendChild(h('span', { class: 'g-bolum-etk', text: t('alsamBenzerBaslik') }));
      gov.appendChild(h('div', { class: 'alsam-sira' }, r.benzer.slice(0, 6).map(function (p) { return h('button', { class: 'alsam-kucuk', 'aria-label': parcaAd(p), on: { click: function () { parcaDuzenle(p, null); } } }, resimEl(p.id, false, null, parcaAd(p))); })));
    }
    if (n) {
      gov.appendChild(h('span', { class: 'g-bolum-etk', text: t('alsamOrnek') }));
      r.kombinler.slice(0, 3).forEach(function (l) {
        gov.appendChild(h('div', { class: 'alsam-sira' }, h('span', { class: 'alsam-kucuk aday' }, h('img', { src: url, alt: '' })),
          l.filter(Boolean).map(function (p) { return h('span', { class: 'alsam-kucuk' }, resimEl(p.id, false, null, parcaAd(p))); })));
      });
    }
    gov.appendChild(h('div', { class: 'sarili', style: { gap: '10px', 'margin-top': '6px' } },
      h('button', { class: 'btn ikincil', style: { flex: '1' }, on: { click: function () { URL.revokeObjectURL(url); geri(); } } }, t('alsamBaska')),
      h('button', { class: 'btn ana', style: { flex: '1' }, on: { click: function () {
        sayfa.kapat();
        setTimeout(function () { dosyalarSecildi([f]); }, 350);
      } } }, ikon('arti', 'k'), t('alsamAldim'))));
  }
  ciz3();
}

/* ---------- 5. "A mı B mi?" anketi ---------- */
var ANKET = { liste: [], sayfa: 0, devam: false, yukleniyor: false, hata: false, yuklendi: false, sira: 'yeni' };
function anketGecerli(x) {
  return x && typeof x === 'object' && typeof x.id === 'string' && /^[a-z0-9]{20}$/.test(x.id) && typeof x.takma === 'string' &&
    sayiMi(x.a) && sayiMi(x.b) && sayiMi(x.zaman) && typeof x.yazar === 'string' && /^[a-f0-9]{12}$/.test(x.yazar);
}
function anketYukle(sifirla) {
  if (ANKET.yukleniyor) return;
  if (sifirla) { ANKET.liste = []; ANKET.sayfa = 0; ANKET.devam = false; }
  ANKET.yukleniyor = true; ANKET.hata = false;
  toplulukCizYenile();
  yzIste('/v1/anketler', { sira: ANKET.sira, sayfa: ANKET.sayfa, engelli: engelliler() }, 20000).then(function (v) {
    var gelen = Array.isArray(v.liste) ? v.liste.filter(anketGecerli) : [];
    var var_ = Object.create(null); ANKET.liste.forEach(function (x) { var_[x.id] = 1; });
    ANKET.liste = ANKET.liste.concat(gelen.filter(function (x) { return !var_[x.id]; })).slice(0, 300);
    ANKET.devam = v.devam === true && ANKET.sayfa < 24;
    ANKET.sayfa++; ANKET.yuklendi = true;
  }).catch(function () { ANKET.hata = true; }).then(function () { ANKET.yukleniyor = false; toplulukCizYenile(); });
}
function anketlerDoldur(alan) {
  var eng = engelliler();
  var ust = h('div', { class: 'sarili', style: { gap: '8px', 'justify-content': 'space-between', 'align-items': 'center' } },
    h('div', { class: 'g-haplar' }, [['yeni', 'akHepsi'], ['benim', 'akBenim']].map(function (x) {
      return h('button', { 'aria-pressed': ANKET.sira === x[0] ? 'true' : 'false', text: t(x[1]), on: { click: function () { if (ANKET.sira !== x[0]) { ANKET.sira = x[0]; anketYukle(true); } } } });
    })),
    h('button', { class: 'g-ekle', on: { click: function () { anketOlustur(null, null); } } }, ikon(sosyalAcik() ? 'arti' : 'kilit', 'k'), t('akYeni')));
  alan.appendChild(ust);
  var adres = sunucuAdres();
  ANKET.liste.filter(function (x) { return eng.indexOf(x.yazar) < 0; }).forEach(function (x) { alan.appendChild(anketKarti(x, adres)); });
  if (ANKET.yukleniyor) alan.appendChild(h('div', { class: 'g-yukleniyor' }, h('span', { class: 'yukleniyor' })));
  else if (ANKET.hata) alan.appendChild(h('div', { class: 'g-bos-not' }, h('span', { text: t('tpHata') }), h('button', { class: 'g-btn-cizgi kucuk', text: t('tekrarDene'), on: { click: function () { anketYukle(true); } } })));
  else if (!ANKET.liste.length && ANKET.yuklendi) alan.appendChild(h('div', { class: 'g-bos-not' }, ikon('isilti', 'k'), h('span', { text: ANKET.sira === 'benim' ? t('akBenimBos') : t('akBos') })));
  else if (ANKET.devam) alan.appendChild(h('button', { class: 'g-btn-cizgi', text: t('tpDahaFazla'), on: { click: function () { anketYukle(false); } } }));
  if (!ANKET.yuklendi && !ANKET.yukleniyor) setTimeout(function () { anketYukle(true); }, 0);
}
function anketKarti(x, adres) {
  var ad = kirp(x.takma, 24);
  var mesgul = false;
  var profilAc = function () { if (x.benim) benimProfilim(); else profilSayfasi(x.yazar, { takma: ad, kadi: x.kadi, av: x.av }); };
  var secenek = function (harf) {
    var src = adres ? adres + '/v1/anketresim/' + x.id + '/' + harf : '';
    var yuzde = h('span', { class: 'ak-yuzde' });
    var cubuk = h('i', { class: 'ak-cubuk' });
    var img = src ? h('img', { src: src, alt: t('akSecenek', harf.toUpperCase()), loading: 'lazy', decoding: 'async', referrerpolicy: 'no-referrer' }) : h('div', { class: 'g-akis-resim bos' });
    var b = h('button', { class: 'ak-secenek', 'aria-label': t('akOyVer', harf.toUpperCase()) }, img, h('span', { class: 'ak-harf', text: harf.toUpperCase() }), cubuk, yuzde);
    b.addEventListener('click', function () { oyla(harf); });
    if (src) {
      var buyut = h('button', { class: 'buyut-btn', 'aria-label': t('buyut'), on: { click: function (e) { e.stopPropagation(); goruntuleyiciAc(src, img.alt); } } }, ikon('buyut', 'k'));
      return { el: h('div', { class: 'ak-kap' }, b, buyut), yuzde: yuzde, cubuk: cubuk, b: b };
    }
    return { el: h('div', { class: 'ak-kap' }, b), yuzde: yuzde, cubuk: cubuk, b: b };
  };
  var A_ = secenek('a'), B_ = secenek('b');
  var toplam = h('small', { class: 'ak-toplam' });
  function guncelle() {
    var top = (x.a || 0) + (x.b || 0), goster = x.benim || !!x.secim;
    [[A_, x.a, 'a'], [B_, x.b, 'b']].forEach(function (s) {
      var y = top ? Math.round(s[1] / top * 100) : 0;
      s[0].yuzde.textContent = goster ? '%' + y : '';
      s[0].cubuk.style.width = goster ? y + '%' : '0';
      s[0].b.setAttribute('aria-pressed', x.secim === s[2] ? 'true' : 'false');
      s[0].b.classList.toggle('kazanan', goster && top > 0 && s[1] >= (top - s[1]) && s[1] > 0);
    });
    toplam.textContent = goster ? t('akToplam', top) : (x.benim ? '' : t('akOyla'));
  }
  function oyla(harf) {
    if (x.benim) { tost(t('akKendi')); return; }
    if (mesgul || x.secim === harf || !girisIste()) return;
    var eski = { s: x.secim, a: x.a, b: x.b };
    if (x.secim) x[x.secim]--;
    x.secim = harf; x[harf]++; guncelle();
    mesgul = true;
    yzIste('/v1/anketoy', { id: x.id, secim: harf }, 15000).then(function (v) {
      if (sayiMi(v.a)) x.a = v.a; if (sayiMi(v.b)) x.b = v.b;
    }).catch(function () { x.secim = eski.s; x.a = eski.a; x.b = eski.b; tost(t('tpHata')); }).then(function () { mesgul = false; guncelle(); });
  }
  var kart = h('div', { class: 'g-akis g-anket' + (x.gizli ? ' gizli' : '') },
    h('div', { class: 'g-akis-bas' },
      avatarDoldur(h('button', { class: 'g-avatar', 'aria-label': ad, on: { click: profilAc } }), kisiAvatar(x.yazar, x.av, ad), ad, A.dil === 'en' ? 'en' : 'tr'),
      h('button', { class: 'g-akis-kim', on: { click: profilAc } }, h('b', null, ad, kadiEl(x.kadi, 'yan')), h('small', null, zamanOnce(x.zaman), x.gorunurluk === 'takip' ? h('span', { class: 'g-gorunur', title: t('gorTakip') }, ikon('kisi', 'k')) : null)),
      h('button', { class: 'ikon-btn g-akis-menu', 'aria-label': t('secenekler'), on: { click: function () { anketMenusu(x, kart); } } }, ikon('nokta'))),
    x.gizli ? h('p', { class: 'g-gizli-not', text: t('tpGizli') }) : null,
    h('p', { class: 'ak-soru', text: kirp(x.soru, 140) || t('akVarsayilan') }),
    h('div', { class: 'ak-ikili' }, A_.el, B_.el),
    toplam,
    x.benim && x.gorunurluk !== 'takip' && !x.gizli ? h('button', { class: 'g-btn-cizgi kucuk ak-wp', on: { click: function () { anketPaylas(x); } } }, ikon('gonder', 'k'), t('akWpPaylas')) : null);
  guncelle();
  return kart;
}
function anketMenusu(x, kart) {
  var gov = h('div', { class: 'ayar-grup' });
  var s = sayfaAc({ baslik: t('secenekler'), icerik: gov });
  if (x.benim) {
    if (x.gorunurluk !== 'takip' && !x.gizli) gov.appendChild(menuSatir('gonder', t('akWpPaylas'), t('akWpMetin'), function () { s.kapat(); anketPaylas(x); }));
    gov.appendChild(menuSatir('cop', t('akSil'), '', function () {
      onayla(t('akSil'), t('akSilSor'), t('sil'), true).then(function (evet) {
        if (!evet) return;
        yzIste('/v1/anketsil', { id: x.id }, 15000).then(function () {
          ANKET.liste = ANKET.liste.filter(function (y) { return y.id !== x.id; });
          s.kapat(); kart.remove(); tost(t('silindi'));
        }).catch(function () { tost(t('tpHata')); });
      });
    }));
    return;
  }
  gov.appendChild(menuSatir('kisi', t('profiliGor'), '', function () { s.kapat(); setTimeout(function () { profilSayfasi(x.yazar, { takma: x.takma, kadi: x.kadi, av: x.av }); }, 300); }));
  gov.appendChild(menuSatir('bayrak', t('sikayetEt'), '', function () {
    if (!girisIste()) return;
    yzIste('/v1/aksikayet', { id: x.id }, 15000).then(function () {
      s.kapat(); tost(t('sikayetAlindi'));
      ANKET.liste = ANKET.liste.filter(function (y) { return y.id !== x.id; }); kart.remove();
    }).catch(function () { tost(t('tpHata')); });
  }));
  gov.appendChild(menuSatir('kapat', t('engelle'), '', function () {
    var l = engelliler(); if (l.indexOf(x.yazar) < 0) l.push(x.yazar);
    LS.yaz('engelli', l.slice(-200)); s.kapat(); tost(t('engellendi')); toplulukCizYenile();
  }));
}
/* Anket oluştur: iki kombin önerisinden (kolaj) ya da galeriden iki fotoğrafla */
function anketOlustur(kA, kB, bilgi) {
  if (!yzKurulu()) { tost(t('yzKapali')); return; }
  if (!girisIste()) return;
  if (!sosyalAcik()) { sosyalSayfasi('anket', function () { anketOlustur(kA, kB, bilgi); }); return; }
  var tuvaller = { a: null, b: null };
  var gor = 'herkes';
  var soru = h('input', { class: 'metin', maxlength: '140', placeholder: t('akSoruYer'), 'aria-label': t('akSoru') });
  var kutular = {};
  var secimler = h('div', { class: 'ak-ikili ak-yeni' });
  ['a', 'b'].forEach(function (harf) {
    var dosya = h('input', { type: 'file', accept: 'image/*', class: 'gizli', 'aria-hidden': 'true' });
    var kutu = h('button', { class: 'ak-secenek bos', 'aria-label': t('akFotoSec', harf.toUpperCase()) }, h('span', { class: 'ak-harf', text: harf.toUpperCase() }), ikon('galeri', 'k'), h('small', { text: t('akFotoSec', harf.toUpperCase()) }));
    kutu.addEventListener('click', function () { dosya.click(); });
    dosya.addEventListener('change', function (e) {
      var f = e.target.files && e.target.files[0]; e.target.value = '';
      if (!f) return;
      resimCoz(f).then(function (bmp) { var c = tuvaleCiz(bmp, 1024); try { if (bmp.close) bmp.close(); } catch (x) { } goster(harf, c); }).catch(function () { tost(t('fotoHata')); });
    });
    kutular[harf] = kutu;
    secimler.appendChild(h('div', { class: 'ak-kap' }, kutu, dosya));
  });
  function goster(harf, c) {
    tuvaller[harf] = c;
    var kutu = kutular[harf];
    temizle(kutu); kutu.classList.remove('bos');
    kutu.appendChild(h('img', { src: c.toDataURL('image/jpeg', 0.85), alt: '' }));
    kutu.appendChild(h('span', { class: 'ak-harf', text: harf.toUpperCase() }));
  }
  var gorSec = h('div', { class: 'g-gorunurluk' });
  [['takip', 'kisi', 'gorTakip'], ['herkes', 'dunya', 'gorHerkes']].forEach(function (x) {
    gorSec.appendChild(h('button', { class: 'cip', 'data-gor': x[0], 'aria-pressed': gor === x[0] ? 'true' : 'false', on: { click: function () {
      gor = x[0]; $$('button', gorSec).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-gor') === gor ? 'true' : 'false'); });
    } } }, ikon(x[1], 'k'), t(x[2])));
  });
  var btn = h('button', { class: 'btn ana', style: { width: '100%' } }, ikon('paylas', 'k'), t('akPaylas'));
  var s = sayfaAc({ baslik: t('akBaslik'), icerik: h('div', { class: 'profil-duzen' },
    h('p', { class: 'alt-yazi', text: t('akMetin') }), secimler,
    h('label', { class: 'hesap-alan' }, h('span', { text: t('akSoru') }), soru),
    h('span', { class: 'etk g-etiket', text: t('gorunurlukBaslik') }), gorSec,
    btn, h('p', { class: 'ayar-not', text: t('paylasKuralNot') })) });
  if (kA && kB) {
    Promise.all([kombinKolaji(kA, bilgi || {}), kombinKolaji(kB, bilgi || {})]).then(function (l) { if (l[0]) goster('a', l[0]); if (l[1]) goster('b', l[1]); }).catch(function () { });
  }
  var gidiyor = false;
  btn.addEventListener('click', function () {
    if (gidiyor) return;
    if (!tuvaller.a || !tuvaller.b) { tost(t('akIkiFoto')); return; }
    var m = kirp(soru.value, 140);
    if (/(https?:\/\/|www\.|\b\d[\d\s().-]{8,}\d\b)/i.test(m)) { tost(t('baglantiYok')); return; }
    var a = tuvaldenB64(tuvaller.a, 440 * 1024), b = tuvaldenB64(tuvaller.b, 440 * 1024);
    if (!a || !b) { tost(t('fotoHata')); return; }
    gidiyor = true; btn.disabled = true;
    yzIste('/v1/anket', { resimA: a, resimB: b, soru: m, gorunurluk: gor, takma: (hesapBilgi() || {}).ad || '' }, 60000).then(function (v) {
      s.kapat(); tost(t('akPaylasildi')); olay('anket_ac');
      if (gor === 'herkes' && v && /^[a-z0-9]{20}$/.test(v.id || '')) {
        setTimeout(function () { onayla(t('akWpBaslik'), t('akWpMetin'), t('akWpPaylas')).then(function (e) { if (e) anketPaylas({ id: v.id, soru: m, gorunurluk: 'herkes' }); }); }, 900);
      }
      ANKET.yuklendi = false; ANKET.sira = 'benim';
      S.sekme = 'kesfet'; S.kesfetSekme = 'topluluk'; TOPLULUK.sira = 'anket'; ciz(); window.scrollTo(0, 0);
    }).catch(function (e) {
      var v = e && e.veri;
      if (e && e.message === 'denetim') {
        var ad2 = { ciplaklik: 'dnCiplaklik', cinsel: 'dnCinsel', cocuk: 'dnCocuk', siddet: 'dnSiddet', nefret: 'dnNefret', kisisel_bilgi: 'dnKisisel', kiyafet_degil: 'dnKiyafet', spam: 'dnSpam' }[v && v.neden];
        tost(t('denetimRed', ad2 ? t(ad2) : ''));
      } else if (e && e.message === 'kota') tost(t('paylasKota'));
      else tost(yzHataMetni(e, t('paylasHata')));
    }).then(function () { gidiyor = false; btn.disabled = false; });
  });
}

/* ---------- Metinler ---------- */
Object.assign(DIL.tr, {
  renkBaslik: 'Renk analizim', renkAlt: 'Sana en çok yakışan renkler', renkMetin: 'Bir selfie çek; ten alt tonuna, saç ve göz rengine bakıp sana en çok yakışan renkleri, kaçınman gerekenleri, ruj tonlarını ve takı metalini söyleyeyim. Sonuç kombin önerilerinde de kullanılır.',
  renkIp1: 'Gün ışığında, pencereye dönük çek', renkIp2: 'Filtre ve yoğun makyaj olmasın', renkIp3: 'Yüzün net ve tek başına görünsün',
  renkSelfie: 'Selfie çek', renkGaleri: 'Galeriden seç', renkYenile: 'Yeniden analiz et', renkGizlilik: 'Fotoğrafın yalnızca analiz için gönderilir, hiçbir yerde saklanmaz. Sonuç yalnız bu telefonda tutulur.',
  renkSil: 'Renk analizimi sil', renkSilindi: 'Renk analizi silindi.', renkBakiyor: 'Renklerine bakıyorum…', renkYuzYok: 'Fotoğrafta yüzünü net göremedim. Gün ışığında, tek başına bir selfie dener misin?',
  renkHata: 'Renk analizi şu an yapılamadı, birazdan tekrar dene.', renkHazir: function (m) { return 'Sen bir ' + m + ' tipisin 💜 Önerilerim artık buna göre.'; },
  renkYakisan: 'Sana yakışan renkler', renkKacin: 'Yüzünden uzak tut', renkRuj: 'Ruj tonların',
  mv_ilkbahar: 'İlkbahar', mv_yaz: 'Yaz', mv_sonbahar: 'Sonbahar', mv_kis: 'Kış',
  alt_sicak: 'Sıcak alt ton', alt_soguk: 'Soğuk alt ton', alt_notr: 'Nötr alt ton', kon_dusuk: 'düşük kontrast', kon_orta: 'orta kontrast', kon_yuksek: 'yüksek kontrast',
  metal_altin: 'Altın tonlar', metal_gumus: 'Gümüş tonlar', metal_ikisi: 'Altın da gümüş de',
  mkBaslik: 'Makyaj ve oje önerisi', mkTur_ruj: 'Ruj', mkTur_far: 'Far', mkTur_oje: 'Oje', mkTur_taki: 'Takı',
  mkEsles: function (r) { return r + ' ile aynı aileden, uyumlu bir dokunuş'; }, mkZit: function (r) { return r + ' ile güzel bir zıtlık yaratır'; },
  mkVurgu: 'Sade kombinde tek ve şık bir vurgu', mkYumusak: 'Ortama uygun, doğal ve yumuşak', mkPalet: 'Renk analizine göre sana yakışan ton',
  mkFarCesur: 'Akşam ve davet için derinlik katar', mkFarSade: 'Gündüz için ışıltılı ve sade', mkTakiNot: 'Kombinin renk sıcaklığına göre', mkRenkOner: 'Renk analizini yap, öneriler sana özel olsun',
  mk_nude_sicak: 'Sıcak nude', mk_gul_kurusu: 'Gül kurusu', mk_mercan: 'Mercan', mk_seftali: 'Şeftali', mk_kirmizi_soguk: 'Mavi alt tonlu kırmızı', mk_kirmizi_sicak: 'Domates kırmızısı',
  mk_bordo: 'Bordo', mk_fusya: 'Fuşya', mk_tugla: 'Tuğla', mk_bebek_pembe: 'Bebek pembesi', mk_murdum: 'Mürdüm',
  mk_sampanya: 'Şampanya', mk_bronz: 'Bronz', mk_kahve_far: 'Kahve', mk_gul_altin: 'Gül altın', mk_duman: 'Dumanlı gri', mk_zeytin_far: 'Zeytin', mk_lavanta_far: 'Lavanta',
  mk_nude_oje: 'Nude', mk_klasik_kirmizi: 'Klasik kırmızı', mk_bordo_oje: 'Bordo', mk_pudra_oje: 'Pudra', mk_sut_beyaz: 'Süt beyazı', mk_mercan_oje: 'Mercan', mk_lacivert_oje: 'Lacivert', mk_fusya_oje: 'Fuşya', mk_lavanta_oje: 'Lavanta',
  kimleEtiket: 'Kimlerle buluşacaksın? (isteğe bağlı)', cv_aile: 'Aile', cv_is: 'İş', cv_arkadas: 'Arkadaşlar', cv_okul: 'Okul', cv_akraba: 'Akrabalar',
  cvEkle: 'Ekle', cvYeni: 'Yeni grup', cvYeniYer: 'ör. Kayınvalidem, Yoga grubu', cvYeniMetin: 'Sık görüştüğün bir kişi ya da grup ekle. Aynı kişilerle buluşurken yakın zamanda giydiğin parçaları hatırlatırım.', cvKisa: 'En az 2 harf yaz.',
  kimleSoru: 'Kimlerle giydin?', kimleSoruMetin: 'Seçersen, aynı kişilerle buluşurken bu kıyafeti yakın zamanda giydiğini sana hatırlatırım.', kimleKaydedildi: 'Not aldım 💜', atla: 'Atla', ekle: 'Ekle',
  tekrarBaslik: 'Bunu daha önce giydin', tekrarMetin: function (p, c, d) { return 'Bu ' + p + ' ile ' + c + ' seni ' + d + ' tarihinde görmüştü.'; }, tekrarDaha: function (n) { return '(+' + n + ' parça daha)'; },
  alsamBaslik: 'Alsam mı?', alsamAlt: 'Mağazada fotoğrafını çek', alsamMetin: 'Beğendiğin ürünün fotoğrafını çek; dolabındaki kaç parçayla uyduğunu, benzerinin olup olmadığını ve giyim başına maliyetini söyleyeyim.',
  alsamFiyat: 'Fiyatı (isteğe bağlı)', alsamFiyatYer: 'ör. 899', alsamCek: 'Fotoğrafını çek', alsamGaleri: 'Galeriden seç', alsamAzParca: 'Dolabında ne kadar çok parça olursa sonuç o kadar doğru olur.',
  alsamDuzelt: 'Tür yanlışsa buradan düzelt:', alsam_al: 'Bence al 💜', alsam_dusun: 'Bir düşün', alsam_alma: 'Bence alma',
  alsamKombin: function (n) { return !n ? 'Dolabındaki parçalarla uyumlu bir kombin bulamadım.' : n <= 2 ? 'Dolabındaki parçalarla yalnızca ' + n + ' kombin kurabilirsin.' : 'Dolabındaki parçalarla en az ' + n + ' farklı kombin kurabilirsin.'; },
  alsamBenzer: function (n) { return 'Dolabında buna çok benzeyen ' + n + ' parça var.'; }, alsamMaliyet: function (m, g) { return 'Yılda yaklaşık ' + g + ' kez giyersen giyim başına ' + m + ' ₺.'; },
  alsamBenzerBaslik: 'Dolabındaki benzerleri', alsamOrnek: 'Kurabileceğin kombinlerden', alsamBaska: 'Başka ürün', alsamAldim: 'Aldım, dolabıma ekle',
  akBaslik: 'A mı B mi?', akMetin: 'İki kombin arasında kararsız mısın? Topluluğa ya da takipçilerine sor.', akSoru: 'Soru', akSoruYer: 'ör. Cumartesi düğüne hangisi?', akPaylas: 'Anketi paylaş',
  akFotoSec: function (h) { return h + ' fotoğrafı'; }, akIkiFoto: 'İki fotoğraf da seçmelisin.', akPaylasildi: 'Anketin paylaşıldı 💜', akYeni: 'Anket', akHepsi: 'Tüm anketler', akBenim: 'Anketlerim',
  akBos: 'Henüz anket yok. İlk soran sen ol!', akBenimBos: 'Henüz anket açmadın.', akVarsayilan: 'Hangisini giyeyim?', akSecenek: function (h) { return 'Seçenek ' + h; }, akOyVer: function (h) { return h + ' seçeneğine oy ver'; },
  akToplam: function (n) { return n + ' oy'; }, akOyla: 'Oy vermek için birine dokun', akKendi: 'Kendi anketine oy veremezsin.', akSil: 'Anketi sil', akSilSor: 'Bu anket silinsin mi?', akSor: 'A mı B mi? diye sor',
  tpAnket: 'A mı B mi?', bnAnket: 'anketine oy verdi'
});
Object.assign(DIL.en, {
  renkBaslik: 'My colour analysis', renkAlt: 'The colours that suit you best', renkMetin: "Take a selfie; I'll look at your skin undertone, hair and eye colour and tell you the colours that suit you best, the ones to avoid, your lipstick shades and jewellery metal. Outfit suggestions will use it too.",
  renkIp1: 'Daylight, facing a window', renkIp2: 'No filters or heavy makeup', renkIp3: 'Your face clear and on its own',
  renkSelfie: 'Take a selfie', renkGaleri: 'Choose from gallery', renkYenile: 'Analyse again', renkGizlilik: 'Your photo is sent only for the analysis and is never stored. The result stays on this phone.',
  renkSil: 'Delete my colour analysis', renkSilindi: 'Colour analysis deleted.', renkBakiyor: 'Looking at your colours…', renkYuzYok: "I couldn't see your face clearly. Try a selfie on your own in daylight?",
  renkHata: "Colour analysis isn't available right now, try again shortly.", renkHazir: function (m) { return "You're a " + m + ' 💜 My suggestions now use it.'; },
  renkYakisan: 'Colours that suit you', renkKacin: 'Keep away from your face', renkRuj: 'Your lipstick shades',
  mv_ilkbahar: 'Spring', mv_yaz: 'Summer', mv_sonbahar: 'Autumn', mv_kis: 'Winter',
  alt_sicak: 'Warm undertone', alt_soguk: 'Cool undertone', alt_notr: 'Neutral undertone', kon_dusuk: 'low contrast', kon_orta: 'medium contrast', kon_yuksek: 'high contrast',
  metal_altin: 'Gold tones', metal_gumus: 'Silver tones', metal_ikisi: 'Both gold and silver',
  mkBaslik: 'Makeup & nail suggestion', mkTur_ruj: 'Lipstick', mkTur_far: 'Eyeshadow', mkTur_oje: 'Nails', mkTur_taki: 'Jewellery',
  mkEsles: function (r) { return 'Same family as the ' + r.toLowerCase() + ', a matching touch'; }, mkZit: function (r) { return 'A lovely contrast with the ' + r.toLowerCase(); },
  mkVurgu: 'One chic accent on a simple outfit', mkYumusak: 'Natural and soft, right for the occasion', mkPalet: 'A shade that suits you, from your colour analysis',
  mkFarCesur: 'Adds depth for evenings and events', mkFarSade: 'Soft and luminous for daytime', mkTakiNot: 'Based on the colour temperature of the outfit', mkRenkOner: 'Do your colour analysis for personal suggestions',
  mk_nude_sicak: 'Warm nude', mk_gul_kurusu: 'Dusty rose', mk_mercan: 'Coral', mk_seftali: 'Peach', mk_kirmizi_soguk: 'Blue-red', mk_kirmizi_sicak: 'Tomato red',
  mk_bordo: 'Burgundy', mk_fusya: 'Fuchsia', mk_tugla: 'Brick', mk_bebek_pembe: 'Baby pink', mk_murdum: 'Plum',
  mk_sampanya: 'Champagne', mk_bronz: 'Bronze', mk_kahve_far: 'Brown', mk_gul_altin: 'Rose gold', mk_duman: 'Smoky grey', mk_zeytin_far: 'Olive', mk_lavanta_far: 'Lavender',
  mk_nude_oje: 'Nude', mk_klasik_kirmizi: 'Classic red', mk_bordo_oje: 'Burgundy', mk_pudra_oje: 'Powder pink', mk_sut_beyaz: 'Milky white', mk_mercan_oje: 'Coral', mk_lacivert_oje: 'Navy', mk_fusya_oje: 'Fuchsia', mk_lavanta_oje: 'Lavender',
  kimleEtiket: 'Who are you meeting? (optional)', cv_aile: 'Family', cv_is: 'Work', cv_arkadas: 'Friends', cv_okul: 'School', cv_akraba: 'Relatives',
  cvEkle: 'Add', cvYeni: 'New group', cvYeniYer: 'e.g. Mother-in-law, Yoga group', cvYeniMetin: "Add a person or group you see often. When you meet them again I'll remind you what you recently wore in front of them.", cvKisa: 'Type at least 2 letters.',
  kimleSoru: 'Who did you wear it with?', kimleSoruMetin: "If you choose, I'll remind you that you recently wore this when you meet the same people.", kimleKaydedildi: 'Noted 💜', atla: 'Skip', ekle: 'Add',
  tekrarBaslik: 'You wore this before', tekrarMetin: function (p, c, d) { return c + ' saw you in this ' + p + ' on ' + d + '.'; }, tekrarDaha: function (n) { return '(+' + n + ' more)'; },
  alsamBaslik: 'Should I buy it?', alsamAlt: 'Snap it in the store', alsamMetin: "Take a photo of the item you like; I'll tell you how many of your pieces it goes with, whether you already own something similar, and the cost per wear.",
  alsamFiyat: 'Price (optional)', alsamFiyatYer: 'e.g. 899', alsamCek: 'Take a photo', alsamGaleri: 'Choose from gallery', alsamAzParca: 'The more pieces in your wardrobe, the more accurate the result.',
  alsamDuzelt: 'Wrong type? Fix it here:', alsam_al: 'I say buy it 💜', alsam_dusun: 'Think it over', alsam_alma: "I'd skip it",
  alsamKombin: function (n) { return !n ? "I couldn't find a matching outfit with your pieces." : n <= 2 ? 'Only ' + n + ' outfit' + (n === 1 ? '' : 's') + ' with pieces you already own.' : 'You can make at least ' + n + ' outfits with pieces you already own.'; },
  alsamBenzer: function (n) { return 'You already have ' + n + ' very similar piece' + (n === 1 ? '' : 's') + '.'; }, alsamMaliyet: function (m, g) { return 'Worn about ' + g + ' times a year, that is ' + m + ' per wear.'; },
  alsamBenzerBaslik: 'Similar pieces you own', alsamOrnek: 'Outfits you could make', alsamBaska: 'Another item', alsamAldim: 'I bought it, add to wardrobe',
  akBaslik: 'A or B?', akMetin: "Can't choose between two outfits? Ask the community or your followers.", akSoru: 'Question', akSoruYer: 'e.g. Which one for the wedding on Saturday?', akPaylas: 'Share poll',
  akFotoSec: function (h) { return 'Photo ' + h; }, akIkiFoto: 'Choose both photos.', akPaylasildi: 'Your poll is shared 💜', akYeni: 'Poll', akHepsi: 'All polls', akBenim: 'My polls',
  akBos: 'No polls yet. Be the first to ask!', akBenimBos: "You haven't started a poll yet.", akVarsayilan: 'Which one should I wear?', akSecenek: function (h) { return 'Option ' + h; }, akOyVer: function (h) { return 'Vote for ' + h; },
  akToplam: function (n) { return n + ' vote' + (n === 1 ? '' : 's'); }, akOyla: 'Tap one to vote', akKendi: "You can't vote on your own poll.", akSil: 'Delete poll', akSilSor: 'Delete this poll?', akSor: 'Ask: A or B?',
  tpAnket: 'A or B?', bnAnket: 'voted on your poll'
});
Object.assign(DIL.ru, {
  renkBaslik: 'Мой цветотип', renkAlt: 'Цвета, которые тебе идут', renkMetin: 'Сделай селфи: по подтону кожи, цвету волос и глаз подскажу, какие цвета тебе идут больше всего, каких избегать, оттенки помады и металл украшений. Подбор образов тоже это учтёт.',
  renkIp1: 'При дневном свете, лицом к окну', renkIp2: 'Без фильтров и яркого макияжа', renkIp3: 'Лицо чётко и одно в кадре',
  renkSelfie: 'Сделать селфи', renkGaleri: 'Выбрать из галереи', renkYenile: 'Проанализировать снова', renkGizlilik: 'Фото отправляется только для анализа и нигде не хранится. Результат остаётся на этом телефоне.',
  renkSil: 'Удалить мой цветотип', renkSilindi: 'Анализ цвета удалён.', renkBakiyor: 'Смотрю на твои цвета…', renkYuzYok: 'Не удалось чётко увидеть лицо. Попробуешь селфи при дневном свете?',
  renkHata: 'Анализ цвета сейчас недоступен, попробуй чуть позже.', renkHazir: function (m) { return 'Твой цветотип — ' + m + ' 💜 Советы теперь учитывают это.'; },
  renkYakisan: 'Тебе идут', renkKacin: 'Держи подальше от лица', renkRuj: 'Твои оттенки помады',
  mv_ilkbahar: 'Весна', mv_yaz: 'Лето', mv_sonbahar: 'Осень', mv_kis: 'Зима',
  alt_sicak: 'Тёплый подтон', alt_soguk: 'Холодный подтон', alt_notr: 'Нейтральный подтон', kon_dusuk: 'низкий контраст', kon_orta: 'средний контраст', kon_yuksek: 'высокий контраст',
  metal_altin: 'Золотые оттенки', metal_gumus: 'Серебряные оттенки', metal_ikisi: 'И золото, и серебро',
  mkBaslik: 'Макияж и маникюр', mkTur_ruj: 'Помада', mkTur_far: 'Тени', mkTur_oje: 'Лак', mkTur_taki: 'Украшения',
  mkEsles: function (r) { return 'В тон: ' + r.toLowerCase(); }, mkZit: function (r) { return 'Красивый контраст: ' + r.toLowerCase(); },
  mkVurgu: 'Один яркий акцент к простому образу', mkYumusak: 'Естественно и мягко, по случаю', mkPalet: 'Оттенок из твоего цветотипа',
  mkFarCesur: 'Добавит глубины вечером', mkFarSade: 'Мягко и свежо для дня', mkTakiNot: 'По цветовой температуре образа', mkRenkOner: 'Определи цветотип, чтобы советы были личными',
  mk_nude_sicak: 'Тёплый нюд', mk_gul_kurusu: 'Пыльная роза', mk_mercan: 'Коралл', mk_seftali: 'Персик', mk_kirmizi_soguk: 'Холодный красный', mk_kirmizi_sicak: 'Томатный красный',
  mk_bordo: 'Бордо', mk_fusya: 'Фуксия', mk_tugla: 'Кирпичный', mk_bebek_pembe: 'Нежно-розовый', mk_murdum: 'Сливовый',
  mk_sampanya: 'Шампань', mk_bronz: 'Бронза', mk_kahve_far: 'Коричневый', mk_gul_altin: 'Розовое золото', mk_duman: 'Дымчато-серый', mk_zeytin_far: 'Оливковый', mk_lavanta_far: 'Лавандовый',
  mk_nude_oje: 'Нюд', mk_klasik_kirmizi: 'Классический красный', mk_bordo_oje: 'Бордо', mk_pudra_oje: 'Пудровый', mk_sut_beyaz: 'Молочный', mk_mercan_oje: 'Коралл', mk_lacivert_oje: 'Тёмно-синий', mk_fusya_oje: 'Фуксия', mk_lavanta_oje: 'Лавандовый',
  kimleEtiket: 'С кем встречаешься? (необязательно)', cv_aile: 'Семья', cv_is: 'Работа', cv_arkadas: 'Друзья', cv_okul: 'Учёба', cv_akraba: 'Родственники',
  cvEkle: 'Добавить', cvYeni: 'Новая группа', cvYeniYer: 'напр. Свекровь, Йога', cvYeniMetin: 'Добавь человека или группу, с кем часто видишься. Напомню, что ты недавно надевала при них.', cvKisa: 'Минимум 2 буквы.',
  kimleSoru: 'С кем ты это надевала?', kimleSoruMetin: 'Если выберешь, напомню при встрече с теми же людьми, что надевала это недавно.', kimleKaydedildi: 'Запомнила 💜', atla: 'Пропустить', ekle: 'Добавить',
  tekrarBaslik: 'Ты уже надевала это', tekrarMetin: function (p, c, d) { return c + ': видели тебя в этом (' + p + ') ' + d + '.'; }, tekrarDaha: function (n) { return '(+' + n + ')'; },
  alsamBaslik: 'Купить или нет?', alsamAlt: 'Сфотографируй в магазине', alsamMetin: 'Сфотографируй вещь; скажу, со сколькими твоими вещами она сочетается, нет ли похожей и сколько стоит одна носка.',
  alsamFiyat: 'Цена (необязательно)', alsamFiyatYer: 'напр. 899', alsamCek: 'Сфотографировать', alsamGaleri: 'Выбрать из галереи', alsamAzParca: 'Чем больше вещей в гардеробе, тем точнее результат.',
  alsamDuzelt: 'Тип неверный? Исправь:', alsam_al: 'Бери 💜', alsam_dusun: 'Подумай', alsam_alma: 'Лучше не брать',
  alsamKombin: function (n) { return !n ? 'Не нашла подходящих образов с твоими вещами.' : n <= 2 ? 'С твоими вещами — только ' + n + '.' : 'С твоими вещами получится минимум ' + n + ' образов.'; },
  alsamBenzer: function (n) { return 'Похожих вещей в гардеробе: ' + n + '.'; }, alsamMaliyet: function (m, g) { return 'При ~' + g + ' носках в год — ' + m + ' за раз.'; },
  alsamBenzerBaslik: 'Похожие вещи', alsamOrnek: 'Возможные образы', alsamBaska: 'Другая вещь', alsamAldim: 'Купила, добавить в гардероб',
  akBaslik: 'A или B?', akMetin: 'Не можешь выбрать между двумя образами? Спроси сообщество или подписчиков.', akSoru: 'Вопрос', akSoruYer: 'напр. Что надеть на свадьбу в субботу?', akPaylas: 'Опубликовать опрос',
  akFotoSec: function (h) { return 'Фото ' + h; }, akIkiFoto: 'Выбери оба фото.', akPaylasildi: 'Опрос опубликован 💜', akYeni: 'Опрос', akHepsi: 'Все опросы', akBenim: 'Мои опросы',
  akBos: 'Опросов пока нет. Спроси первой!', akBenimBos: 'Ты ещё не создавала опросов.', akVarsayilan: 'Что мне надеть?', akSecenek: function (h) { return 'Вариант ' + h; }, akOyVer: function (h) { return 'Голосовать за ' + h; },
  akToplam: function (n) { return 'голосов: ' + n; }, akOyla: 'Нажми, чтобы проголосовать', akKendi: 'Нельзя голосовать в своём опросе.', akSil: 'Удалить опрос', akSilSor: 'Удалить этот опрос?', akSor: 'Спросить: A или B?',
  tpAnket: 'A или B?', bnAnket: 'проголосовал(а) в опросе'
});
Object.assign(DIL.uz, {
  renkBaslik: 'Rang tahlilim', renkAlt: 'Senga eng mos ranglar', renkMetin: "Selfi oling; teri tagi rangi, soch va ko'z rangiga qarab sizga eng mos ranglar, qochish kerak bo'lganlari, lab bo'yog'i tuslari va zargarlik metalini aytaman. Obraz tavsiyalari ham buni hisobga oladi.",
  renkIp1: "Kunduzgi yorug'likda, derazaga qarab", renkIp2: "Filtr va qalin pardozsiz", renkIp3: "Yuzingiz aniq va yolg'iz",
  renkSelfie: 'Selfi olish', renkGaleri: 'Galereyadan tanlash', renkYenile: 'Qayta tahlil qilish', renkGizlilik: "Rasmingiz faqat tahlil uchun yuboriladi va saqlanmaydi. Natija faqat shu telefonda qoladi.",
  renkSil: "Rang tahlilimni o'chirish", renkSilindi: "Rang tahlili o'chirildi.", renkBakiyor: "Ranglaringizga qarayapman…", renkYuzYok: "Yuzingizni aniq ko'ra olmadim. Kunduzgi yorug'likda selfi qilib ko'rasizmi?",
  renkHata: "Rang tahlili hozir mavjud emas, birozdan keyin urinib ko'ring.", renkHazir: function (m) { return 'Sizning turingiz: ' + m + ' 💜'; },
  renkYakisan: 'Sizga mos ranglar', renkKacin: 'Yuzdan uzoq tuting', renkRuj: "Lab bo'yog'i tuslari",
  mv_ilkbahar: 'Bahor', mv_yaz: 'Yoz', mv_sonbahar: 'Kuz', mv_kis: 'Qish',
  alt_sicak: 'Iliq ton', alt_soguk: 'Sovuq ton', alt_notr: 'Neytral ton', kon_dusuk: 'past kontrast', kon_orta: "o'rta kontrast", kon_yuksek: 'yuqori kontrast',
  metal_altin: 'Oltin tuslar', metal_gumus: 'Kumush tuslar', metal_ikisi: 'Oltin ham, kumush ham',
  mkBaslik: "Pardoz va tirnoq bo'yog'i", mkTur_ruj: "Lab bo'yog'i", mkTur_far: "Ko'z soyasi", mkTur_oje: "Tirnoq bo'yog'i", mkTur_taki: 'Taqinchoq',
  mkEsles: function (r) { return r + ' bilan bir oiladan'; }, mkZit: function (r) { return r + ' bilan chiroyli kontrast'; },
  mkVurgu: 'Oddiy obrazga bitta urg\'u', mkYumusak: "Tabiiy va yumshoq", mkPalet: "Rang tahlilingizga mos tus",
  mkFarCesur: "Kechki tadbirlar uchun chuqurlik", mkFarSade: 'Kunduz uchun yengil', mkTakiNot: "Obrazning rang haroratiga ko'ra", mkRenkOner: "Shaxsiy tavsiyalar uchun rang tahlilini qiling",
  mk_nude_sicak: 'Iliq nyud', mk_gul_kurusu: 'Quruq atirgul', mk_mercan: 'Marjon', mk_seftali: 'Shaftoli', mk_kirmizi_soguk: 'Sovuq qizil', mk_kirmizi_sicak: 'Pomidor qizil',
  mk_bordo: 'Bordo', mk_fusya: 'Fuksiya', mk_tugla: "G'isht", mk_bebek_pembe: 'Och pushti', mk_murdum: 'Olxo\'ri',
  mk_sampanya: 'Shampan', mk_bronz: 'Bronza', mk_kahve_far: 'Jigarrang', mk_gul_altin: 'Pushti oltin', mk_duman: 'Tutunli kulrang', mk_zeytin_far: 'Zaytun', mk_lavanta_far: 'Lavanda',
  mk_nude_oje: 'Nyud', mk_klasik_kirmizi: 'Klassik qizil', mk_bordo_oje: 'Bordo', mk_pudra_oje: 'Upa rang', mk_sut_beyaz: 'Sutrang', mk_mercan_oje: 'Marjon', mk_lacivert_oje: "To'q ko'k", mk_fusya_oje: 'Fuksiya', mk_lavanta_oje: 'Lavanda',
  kimleEtiket: "Kim bilan uchrashasiz? (ixtiyoriy)", cv_aile: 'Oila', cv_is: 'Ish', cv_arkadas: "Do'stlar", cv_okul: "O'qish", cv_akraba: "Qarindoshlar",
  cvEkle: "Qo'shish", cvYeni: 'Yangi guruh', cvYeniYer: 'masalan, Qaynona, Yoga', cvYeniMetin: "Tez-tez ko'rishadigan odam yoki guruhni qo'shing. Ular bilan yana uchrashganda yaqinda kiyganingizni eslataman.", cvKisa: 'Kamida 2 harf yozing.',
  kimleSoru: 'Kim bilan kiydingiz?', kimleSoruMetin: "Tanlasangiz, o'sha odamlar bilan uchrashganda buni yaqinda kiyganingizni eslataman.", kimleKaydedildi: 'Yozib oldim 💜', atla: "O'tkazib yuborish", ekle: "Qo'shish",
  tekrarBaslik: 'Buni avval kiygansiz', tekrarMetin: function (p, c, d) { return c + ' sizni bu ' + p + 'da ' + d + ' kuni ko\'rgan.'; }, tekrarDaha: function (n) { return '(+' + n + ')'; },
  alsamBaslik: 'Olsammi?', alsamAlt: "Do'konda rasmga oling", alsamMetin: "Yoqqan buyumni rasmga oling; shkafingizdagi nechta buyum bilan mos kelishini, o'xshashi borligini va bir marta kiyish narxini aytaman.",
  alsamFiyat: 'Narxi (ixtiyoriy)', alsamFiyatYer: 'masalan, 899', alsamCek: 'Rasmga olish', alsamGaleri: 'Galereyadan tanlash', alsamAzParca: "Shkafingizda buyum qancha ko'p bo'lsa, natija shuncha aniq.",
  alsamDuzelt: "Turi noto'g'rimi? Bu yerda tuzating:", alsam_al: 'Oling 💜', alsam_dusun: "O'ylab ko'ring", alsam_alma: 'Olmang',
  alsamKombin: function (n) { return !n ? 'Mos obraz topa olmadim.' : n <= 2 ? 'Faqat ' + n + ' ta obraz tuzish mumkin.' : 'Shkafingizdagi buyumlar bilan kamida ' + n + ' ta obraz tuzish mumkin.'; },
  alsamBenzer: function (n) { return "Shkafingizda bunga juda o'xshash " + n + ' ta buyum bor.'; }, alsamMaliyet: function (m, g) { return 'Yiliga ~' + g + ' marta kiysangiz, bir kiyish ' + m + '.'; },
  alsamBenzerBaslik: "O'xshash buyumlaringiz", alsamOrnek: 'Tuzish mumkin bo\'lgan obrazlar', alsamBaska: 'Boshqa buyum', alsamAldim: "Oldim, shkafga qo'shish",
  akBaslik: 'A mi B mi?', akMetin: "Ikki obraz orasida ikkilanyapsizmi? Hamjamiyat yoki obunachilardan so'rang.", akSoru: 'Savol', akSoruYer: "masalan, Shanba kuni to'yga qaysi biri?", akPaylas: "So'rovnomani ulashish",
  akFotoSec: function (h) { return h + ' rasmi'; }, akIkiFoto: 'Ikkala rasmni ham tanlang.', akPaylasildi: "So'rovnoma ulashildi 💜", akYeni: "So'rovnoma", akHepsi: "Barcha so'rovnomalar", akBenim: "So'rovnomalarim",
  akBos: "Hali so'rovnoma yo'q. Birinchi bo'lib so'rang!", akBenimBos: "Hali so'rovnoma ochmadingiz.", akVarsayilan: 'Qaysi birini kiyay?', akSecenek: function (h) { return 'Variant ' + h; }, akOyVer: function (h) { return h + ' ga ovoz berish'; },
  akToplam: function (n) { return n + ' ovoz'; }, akOyla: 'Ovoz berish uchun birini bosing', akKendi: "O'z so'rovnomangizga ovoz bera olmaysiz.", akSil: "So'rovnomani o'chirish", akSilSor: "Bu so'rovnoma o'chirilsinmi?", akSor: "So'rash: A mi B mi?",
  tpAnket: 'A mi B mi?', bnAnket: "so'rovnomangizga ovoz berdi"
});
