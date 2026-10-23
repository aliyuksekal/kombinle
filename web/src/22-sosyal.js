/* ---------- Sosyal: profil sayfası, takipçi listeleri, bildirimler, kaydedilenler, etiketler ---------- */
var BILDIRIM = { okunmamis: 0, son: 0, zamanlayici: null, gorulen: 0, gorulenMesaj: 0 };
function sayiKisa(n) {
  n = n | 0;
  if (n < 1000) return String(n);
  var k = A.dil === 'tr' ? 'B' : A.dil === 'ru' ? 'тыс' : 'K';
  if (n < 1e6) return String(Math.round(n / 100) / 10).replace('.', A.dil === 'en' ? '.' : ',') + k;
  return String(Math.round(n / 1e5) / 10).replace('.', A.dil === 'en' ? '.' : ',') + 'M';
}

/* Profil sayfası: resim, ad, @kullanıcıadı, hakkımda, sayılar, takip, paylaşım ızgarası (+ kendi profilimde kaydedilenler) */
function profilSayfasi(kod, on) {
  on = on || {};
  var hb = hesapBilgi();
  var benim = !!(hb && hb.kod && hb.kod === kod);
  var gov = h('div', { class: 'pr-sayfa' });
  var s = sayfaAc({ baslik: on.kadi ? '@' + on.kadi : (on.takma || t('profil')), icerik: gov });
  var bas = h('div', { class: 'pr-bas' });
  var izgara = h('div', { class: 'pr-izgara' });
  var sekme = 'paylasim';
  gov.appendChild(bas);
  var sekmeler = h('div', { class: 'pr-sekmeler', role: 'tablist' });
  function sekmeCiz() {
    temizle(sekmeler);
    [['paylasim', 'galeri', 'prPaylasimlar'], ['takipci', 'kisi', 'prTakipcilerSekme'], ['takip', 'kisi', benim ? 'prTakipBenSekme' : 'prTakipSekme']].concat(benim ? [['kayitli', 'yerimi', 'prKaydedilenler']] : []).forEach(function (x) {
      sekmeler.appendChild(h('button', { role: 'tab', 'aria-selected': sekme === x[0] ? 'true' : 'false', on: { click: function () { if (sekme !== x[0]) { sekme = x[0]; sekmeCiz(); izgaraYukle(); } } } }, ikon(x[1], 'k'), h('span', { text: t(x[2]) })));
    });
  }
  sekmeCiz();
  gov.appendChild(sekmeler);
  gov.appendChild(izgara);
  function basCiz(p) {
    temizle(bas);
    var av = avatarDoldur(h('span', { class: 'pr-av' }), kisiAvatar(p.kod, p.av, p.takma), p.takma);
    if (benim) { av = h('button', { class: 'pr-av-btn', 'aria-label': t('avBaslik'), on: { click: function () { avatarMenusu(function () { profilYenile(); }); } } }, av); }
    var sayi = function (n, etk, fn) { return h(fn ? 'button' : 'div', { class: 'pr-sayi', on: fn ? { click: fn } : null }, h('b', { text: sayiKisa(n) }), h('small', { text: etk })); };
    /* ortalı başlık: profil resmi, ad, kullanıcı adı, tanıtım, sayılar */
    bas.appendChild(h('div', { class: 'pr-ust' }, av));
    bas.appendChild(h('div', { class: 'pr-kim' }, h('b', { text: kirp(p.takma, 24) }), kadiEl(p.kadi)));
    if (p.bio) bas.appendChild(h('p', { class: 'pr-bio', text: kirp(p.bio, 150) }));
    bas.appendChild(h('div', { class: 'pr-sayilar' },
      sayi(p.paylasim, t('prPaylasim')),
      sayi(p.takipci, t('prTakipci'), function () { sekmeSec('takipci'); }),
      sayi(p.takip, t('prTakip'), function () { sekmeSec('takip'); })));
    var dugmeler = h('div', { class: 'pr-dugmeler' });
    if (benim) {
      dugmeler.appendChild(h('button', { class: 'btn ikincil', on: { click: function () { profilDuzenle(function () { profilYenile(); }); } } }, ikon('kalem', 'k'), t('profilDuzenle')));
      dugmeler.appendChild(h('button', { class: 'btn ikincil', on: { click: function () { bildirimSayfasi(); } } }, ikon('zil', 'k'), t('bildirimler')));
    } else {
      var tk = takipDugmesi(p.kod, !!p.takipte); tk.classList.add('buyuk');
      dugmeler.appendChild(tk);
      dugmeler.appendChild(h('button', { class: 'btn ikincil pr-mesaj', on: { click: function () { dmSohbet({ kod: p.kod, takma: p.takma, kadi: p.kadi, av: p.av }); } } }, ikon('gonder', 'k'), t('dmMesaj')));
      dugmeler.appendChild(h('button', { class: 'btn ikincil ikon-kare', 'aria-label': t('secenekler'), on: { click: function () { profilMenusu(p, s); } } }, ikon('nokta')));
    }
    bas.appendChild(dugmeler);
  }
  function profilYenile() {
    yzIste('/v1/profilgor', { kod: kod }, 15000).then(function (v) {
      if (s.kapandi || !v || !v.profil) return;
      basCiz(v.profil);
    }).catch(function (e) {
      if (s.kapandi) return;
      if (e && e.message === 'yok') { temizle(bas); bas.appendChild(h('p', { class: 'alt-yazi', text: t('prYok') })); }
    });
  }
  function sekmeSec(ad) { if (sekme !== ad) { sekme = ad; sekmeCiz(); izgaraYukle(); } try { sekmeler.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { } }
  function izgaraYukle() {
    if (sekme === 'takipci' || sekme === 'takip') { izgara.classList.add('liste-mod'); takipListesiDoldur(izgara, kod, sekme, function () { s.kapat(); }); return; }
    izgara.classList.remove('liste-mod');
    temizle(izgara); izgara.appendChild(h('div', { class: 'g-yukleniyor pr-tam' }, h('span', { class: 'yukleniyor' })));
    var govde = sekme === 'kayitli' ? { sira: 'kayitli' } : benim ? { sira: 'benim' } : { sira: 'kisi', kisi: kod };
    govde.engelli = engelliler();
    yzIste('/v1/akis', govde, 20000).then(function (v) {
      if (s.kapandi) return;
      temizle(izgara);
      var l = Array.isArray(v.liste) ? v.liste.filter(paylasimGecerli) : [];
      if (!l.length) { izgara.appendChild(h('div', { class: 'g-bos-not pr-tam' }, ikon(sekme === 'kayitli' ? 'yerimi' : 'galeri', 'k'), h('span', { text: sekme === 'kayitli' ? t('prKayitliBos') : benim ? t('prBenimBos') : t('prBos') }))); return; }
      var adres = sunucuAdres();
      l.forEach(function (x) {
        var hucre = h('button', { class: 'pr-hucre', 'aria-label': kirp(x.aciklama, 60) || t('paylasim') },
          h('img', { src: adres ? adres + '/v1/resim/' + x.id : '', alt: '', loading: 'lazy', decoding: 'async', referrerpolicy: 'no-referrer' }),
          h('span', { class: 'pr-hucre-bilgi' }, ikon('kalp', 'k'), String(x.begeni | 0), ikon('yorum', 'k'), String(x.yorum | 0)),
          x.gorunurluk && x.gorunurluk !== 'herkes' ? h('span', { class: 'pr-hucre-gor' }, ikon(x.gorunurluk === 'gizli' ? 'kilit' : 'kisi', 'k')) : null);
        hucre.addEventListener('click', function () { paylasimDetay(x, function () { izgaraYukle(); }); });
        izgara.appendChild(hucre);
      });
    }).catch(function () { if (!s.kapandi) { temizle(izgara); izgara.appendChild(h('p', { class: 'alt-yazi pr-tam', text: t('tpHata') })); } });
  }
  // önbilgiyle hemen çiz, sunucudan gelince güncelle
  basCiz({ kod: kod, takma: on.takma || '…', kadi: on.kadi || '', bio: on.bio || '', av: on.av || 0, takipci: 0, takip: 0, paylasim: 0, takipte: on.takipte ? 1 : 0 });
  profilYenile(); izgaraYukle();
}
/* eski çağrılar için */
function kisiSayfasi(kod, takma, kadi, bio, av) { profilSayfasi(kod, { takma: takma, kadi: kadi, bio: bio, av: av }); }
function benimProfilim() {
  var hb = hesapBilgi();
  if (!hb || !hb.kod) { girisIste(); return; }
  profilSayfasi(hb.kod, { takma: hb.ad, kadi: hb.kadi, bio: hb.bio, av: hb.av });
}
/* tek paylaşım: tam kart (yorumlar, oy, kaydet) */
function paylasimDetay(x, degisti) {
  var gov = h('div', { class: 'pr-detay' });
  var s = sayfaAc({ baslik: kirp(x.takma, 24), icerik: gov });
  var kart = paylasimKarti(x, sunucuAdres());
  kart.addEventListener('kbsilindi', function () { s.kapat(); if (degisti) degisti(); });
  gov.appendChild(kart);
}
function profilMenusu(p, sayfa) {
  var gov = h('div', { class: 'ayar-grup' });
  var s = sayfaAc({ baslik: kirp(p.takma, 24), icerik: gov });
  gov.appendChild(menuSatir('bayrak', t('prSikayet'), '', function () {
    s.kapat(); if (!girisli()) { setTimeout(girisIste, 300); return; }
    setTimeout(function () {
      var g2 = h('div', { class: 'ayar-grup' });
      var s2 = sayfaAc({ baslik: t('sikayetNeden'), icerik: g2 });
      [['resim', 'psResim'], ['hakaret', 'snHakaret'], ['sahte', 'psSahte'], ['spam', 'snSpam'], ['diger', 'snDiger']].forEach(function (n) {
        g2.appendChild(menuSatir('bayrak', t(n[1]), '', function () {
          yzIste('/v1/ksikayet', { kod: p.kod, neden: n[0] }, 15000).then(function () { s2.kapat(); tost(t('sikayetAlindi')); }).catch(function (e) { tost(hesapHataMetni(e)); });
        }));
      });
    }, 300);
  }));
  gov.appendChild(menuSatir('kapat', t('engelle'), t('prEngelleAlt'), function () {
    var l = engelliler(); if (l.indexOf(p.kod) < 0) l.push(p.kod);
    LS.yaz('engelli', l.slice(-200));
    s.kapat(); if (sayfa) setTimeout(function () { sayfa.kapat(); }, 250);
    tost(t('engellendi')); toplulukCizYenile();
  }));
}
function takipListesiSayfasi(kod, tur, ad) {
  var gov = h('div', { class: 'tk-liste' }, h('div', { class: 'g-yukleniyor' }, h('span', { class: 'yukleniyor' })));
  var s = sayfaAc({ baslik: tur === 'takip' ? t('prTakipEdilenler') : t('prTakipciler'), icerik: gov });
  yzIste('/v1/takipler', { kod: kod, tur: tur }, 15000).then(function (v) {
    if (s.kapandi) return;
    temizle(gov);
    var eng = engelliler();
    var l = Array.isArray(v.liste) ? v.liste.filter(function (k) { return k && /^[a-f0-9]{12}$/.test(k.kod) && typeof k.takma === 'string' && eng.indexOf(k.kod) < 0; }) : [];
    if (!l.length) { gov.appendChild(h('p', { class: 'alt-yazi', style: { 'text-align': 'center' }, text: tur === 'takip' ? t('prTakipYok') : t('prTakipciYok') })); return; }
    l.forEach(function (k) { gov.appendChild(kisiSatiri(k, function () { s.kapat(); setTimeout(function () { profilSayfasi(k.kod, k); }, 250); })); });
  }).catch(function () { temizle(gov); gov.appendChild(h('p', { class: 'alt-yazi', text: t('tpHata') })); });
}
function kisiSatiri(k, ac, ek) {
  var ad = kirp(k.takma, 24);
  return h('div', { class: 'tk-satir' },
    h('button', { class: 'tk-ac', on: { click: ac } }, avatarDoldur(h('span', { class: 'g-avatar' }), kisiAvatar(k.kod, k.av, ad), ad),
      h('div', null, h('b', { text: ad }), kadiEl(k.kadi) || h('small', { text: ' ' }), ek || null)),
    k.benim ? null : takipDugmesi(k.kod, !!k.takipte));
}

/* Bildirimler: beğeni, yorum, yeni takipçi */
function bildirimSayi(hemen) {
  if (!girisli() || !yzKurulu()) { BILDIRIM.okunmamis = 0; rozetGuncelle(); return; }
  if (!hemen && Date.now() - BILDIRIM.son < 45000) return;
  BILDIRIM.son = Date.now();
  yzIste('/v1/bildirim', { sadeceSay: true }, 12000).then(function (v) {
    BILDIRIM.okunmamis = sayiMi(v.okunmamis) ? Math.max(0, v.okunmamis | 0) : 0; rozetGuncelle();
    DM.okunmamis = sayiMi(v.mesaj) ? Math.max(0, v.mesaj | 0) : 0; dmRozetGuncelle();
    /* uygulama açıkken yeni takipçi / bildirim / mesaj kısa bir uyarıyla haber verilir (ilk açılışta eskiler için değil) */
    var son = v.son && sayiMi(v.son.zaman) ? v.son : null, sm = v.sonMesaj && sayiMi(v.sonMesaj.zaman) ? v.sonMesaj : null;
    if (BILDIRIM.gorulen && son && son.zaman > BILDIRIM.gorulen) tost(son.tur === 'takip' ? t('bnYeniTakip', kirp(son.takma, 24)) : t('bnYeni'));
    if (BILDIRIM.gorulenMesaj && sm && sm.zaman > BILDIRIM.gorulenMesaj && !DM.acik) tost(t('bnYeniMesaj', kirp(sm.takma, 24)));
    BILDIRIM.gorulen = Math.max(BILDIRIM.gorulen || 1, son ? son.zaman : 1);
    BILDIRIM.gorulenMesaj = Math.max(BILDIRIM.gorulenMesaj || 1, sm ? sm.zaman : 1);
  }).catch(function () { });
}
function rozetGuncelle() {
  $$('.g-zil:not(.g-dm)').forEach(function (b) {
    var r = $('.zil-rozet', b);
    if (BILDIRIM.okunmamis > 0) { if (!r) { r = h('span', { class: 'zil-rozet' }); b.appendChild(r); } r.textContent = BILDIRIM.okunmamis > 99 ? '99+' : String(BILDIRIM.okunmamis); }
    else if (r) r.remove();
  });
}
function zilDugmesi() {
  var b = h('button', { class: 'g-zil', 'aria-label': t('bildirimler'), on: { click: function () { bildirimSayfasi(); } } }, ikon('zil', 'k'));
  if (BILDIRIM.okunmamis > 0) b.appendChild(h('span', { class: 'zil-rozet', text: BILDIRIM.okunmamis > 99 ? '99+' : String(BILDIRIM.okunmamis) }));
  return b;
}
function bildirimZamanlayici() {
  if (BILDIRIM.zamanlayici) return;
  BILDIRIM.zamanlayici = setInterval(function () { if (!document.hidden) bildirimSayi(true); }, 30000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) bildirimSayi(false); });
  setTimeout(function () { bildirimSayi(true); }, 1500);
}
function bildirimSayfasi() {
  if (!girisIste()) return;
  var gov = h('div', { class: 'tk-liste' }, h('div', { class: 'g-yukleniyor' }, h('span', { class: 'yukleniyor' })));
  var s = sayfaAc({ baslik: t('bildirimler'), icerik: gov });
  yzIste('/v1/bildirim', { oku: true, engelli: engelliler() }, 15000).then(function (v) {
    if (s.kapandi) return;
    BILDIRIM.okunmamis = 0; rozetGuncelle();
    temizle(gov);
    var l = Array.isArray(v.liste) ? v.liste.filter(function (b) { return b && /^[a-f0-9]{12}$/.test(b.kod) && typeof b.takma === 'string' && ['begeni', 'yorum', 'takip', 'anket'].indexOf(b.tur) >= 0; }) : [];
    if (!l.length) { gov.appendChild(h('div', { class: 'g-bos-not' }, ikon('zil', 'k'), h('span', { text: t('bildirimYok') }))); return; }
    var bugun = [], once = [];
    l.forEach(function (b) { (Date.now() - b.zaman < 86400000 * 7 ? bugun : once).push(b); });
    [[bugun, t('bildirimBuHafta')], [once, t('bildirimDaha')]].forEach(function (grup) {
      if (!grup[0].length) return;
      gov.appendChild(h('span', { class: 'g-bolum-etk', text: grup[1] }));
      grup[0].forEach(function (b) {
        var ad = kirp(b.takma, 24);
        var metin = b.tur === 'begeni' ? t('bnBegendi') : b.tur === 'yorum' ? t('bnYorum', kirp(b.metin, 80)) : b.tur === 'anket' ? t('bnAnket') : t('bnTakip');
        var ac = function () {
          s.kapat();
          setTimeout(function () {
            if (b.tur === 'anket') { S.sekme = 'kesfet'; S.kesfetSekme = 'topluluk'; TOPLULUK.sira = 'anket'; ANKET.sira = 'benim'; ANKET.yuklendi = false; ciz(); window.scrollTo(0, 0); }
            else if (b.tur === 'takip' || !/^[a-z0-9]{20}$/.test(b.paylasim)) profilSayfasi(b.kod, b);
            else paylasimAcId(b.paylasim);
          }, 250);
        };
        var ek = h('small', { class: 'bn-metin' }, h('span', { text: metin }), h('i', { text: ' • ' + zamanOnce(b.zaman) }));
        var satir = kisiSatiri({ kod: b.kod, takma: ad, kadi: b.kadi, av: b.av, takipte: b.takipte, benim: b.tur !== 'takip' }, ac, ek);
        if (b.yeni) satir.classList.add('yeni');
        if (b.tur !== 'takip' && /^[a-z0-9]{20}$/.test(b.paylasim) && sunucuAdres()) {
          satir.appendChild(h('button', { class: 'bn-resim', 'aria-label': t('paylasim'), on: { click: ac } }, h('img', { src: sunucuAdres() + (b.tur === 'anket' ? '/v1/anketresim/' + b.paylasim + '/a' : '/v1/resim/' + b.paylasim), alt: '', loading: 'lazy', referrerpolicy: 'no-referrer' })));
        }
        gov.appendChild(satir);
      });
    });
  }).catch(function (e) { temizle(gov); gov.appendChild(h('p', { class: 'alt-yazi', text: hesapHataMetni(e) })); });
}
/* bildirimden paylaşıma: kendi paylaşımlarım arasında bul */
function paylasimAcId(id) {
  var x = TOPLULUK.liste.filter(function (y) { return y.id === id; })[0];
  if (x) { paylasimDetay(x); return; }
  yzIste('/v1/akis', { sira: 'benim' }, 15000).then(function (v) {
    var l = Array.isArray(v.liste) ? v.liste.filter(paylasimGecerli) : [];
    var y = l.filter(function (z) { return z.id === id; })[0];
    if (y) paylasimDetay(y); else tost(t('prYok'));
  }).catch(function () { tost(t('tpHata')); });
}

/* Etiket akışı: #etikete dokununca */
function etiketSayfasi(et) {
  et = kirp(String(et || '').replace(/^#/, ''), 20);
  if (et.length < 2) return;
  var alan = h('div', { class: 'pr-akis' }, h('div', { class: 'g-yukleniyor' }, h('span', { class: 'yukleniyor' })));
  var s = sayfaAc({ baslik: '#' + et, icerik: alan });
  yzIste('/v1/akis', { sira: 'etiket', etiket: et, engelli: engelliler() }, 20000).then(function (v) {
    if (s.kapandi) return;
    temizle(alan);
    var l = Array.isArray(v.liste) ? v.liste.filter(paylasimGecerli) : [];
    if (!l.length) { alan.appendChild(h('div', { class: 'g-bos-not' }, h('span', { text: t('etiketBos', et) }))); return; }
    var adres = sunucuAdres();
    l.forEach(function (x) { alan.appendChild(paylasimKarti(x, adres)); });
  }).catch(function () { temizle(alan); alan.appendChild(h('p', { class: 'alt-yazi', text: t('tpHata') })); });
}
/* açıklamadaki #etiketleri dokunulabilir yap (metin güvenli: yalnız düğüm olarak eklenir) */
function etiketliMetin(metin) {
  var kap = h('p', { class: 'g-akis-metin' });
  String(metin).split(/(#[0-9A-Za-zÇĞİÖŞÜçğıöşüâîû_]{2,20})/).forEach(function (parca) {
    if (/^#[0-9A-Za-zÇĞİÖŞÜçğıöşüâîû_]{2,20}$/.test(parca)) kap.appendChild(h('button', { class: 'etiket-link', text: parca, on: { click: function (e) { e.stopPropagation(); etiketSayfasi(parca); } } }));
    else if (parca) kap.appendChild(document.createTextNode(parca));
  });
  return kap;
}
/* kendi paylaşımımın açıklamasını düzenle */
function aciklamaDuzenle(x, metinEl) {
  var girdi = h('textarea', { class: 'metin', rows: '3', maxlength: '200', 'aria-label': t('aciklamaYer') });
  girdi.value = x.aciklama || '';
  var btn = h('button', { class: 'btn ana' }, ikon('tik', 'k'), t('kaydet'));
  var s = sayfaAc({ baslik: t('aciklamaDuzenle'), icerik: h('div', { class: 'profil-duzen' }, girdi, h('p', { class: 'ayar-not', text: t('paylasKuralNot') })), altBar: btn });
  btn.addEventListener('click', function () {
    var m = kirp(girdi.value, 200);
    if (/(https?:\/\/|www\.|\b\d[\d\s().-]{8,}\d\b)/i.test(m)) { tost(t('baglantiYok')); return; }
    btn.disabled = true;
    yzIste('/v1/duzenle', { id: x.id, aciklama: m }, 25000).then(function (v) {
      x.aciklama = typeof v.aciklama === 'string' ? v.aciklama : m;
      if (metinEl) metinEl();
      s.kapat(); tost(t('kaydedildi'));
    }).catch(function (e) { tost(e && e.message === 'denetim' ? t('yorumRed') : e && e.message === 'baglanti' ? t('baglantiYok') : t('tpHata')); }).then(function () { btn.disabled = false; });
  });
}
/* kaydet (yer imi) düğmesi */
function kaydetDugmesi(x) {
  var b = h('button', { class: 'g-kaydet', 'aria-label': t('prKaydet'), 'aria-pressed': x.kayitli ? 'true' : 'false' }, ikon('yerimi', 'k'));
  var mesgul = false;
  b.addEventListener('click', function () {
    if (mesgul || !girisIste()) return;
    var yeni = !x.kayitli; x.kayitli = yeni ? 1 : 0; b.setAttribute('aria-pressed', yeni ? 'true' : 'false');
    mesgul = true;
    yzIste('/v1/kaydet', { id: x.id, kaydet: yeni }, 15000).then(function () { tost(yeni ? t('prKaydedildi') : t('prKayitKaldirildi')); })
      .catch(function () { x.kayitli = yeni ? 0 : 1; b.setAttribute('aria-pressed', x.kayitli ? 'true' : 'false'); tost(t('tpHata')); })
      .then(function () { mesgul = false; });
  });
  return b;
}
