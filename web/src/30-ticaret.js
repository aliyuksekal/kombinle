/* ---------- Sosyal paket, gönderiyi öne çıkar, Keşfet'te AdMob, "Reklam ver" ----------
   Sosyal paket: tek seferlik Google Play ürünü (kombinle_sosyal); "A mı B mi?" anketi açmayı açar.
   Öne çıkarma: kullandıkça biten haklar (1 / 5 / 15'li paket); PRO'da her ay 10 hak ve anket dahil.
   Anketlere oy vermek herkese ücretsiz.
   AdMob: akıştaki bazı reklam yuvaları telefonun AdMob reklamıdır (gönderi görseliyle aynı boyut);
   sayfa yuvanın yerini bildirir, reklamı Android çizer. PRO üyelerde reklam yok.
   Reklam ver: firmalar garanti gösterim paketi ya da "1 gün ilk sırada" seçip başvurur → @admin onaylar →
   havale/EFT → @admin "ödendi" der → yayında; gösterim dolunca kendiliğinden kalkar. */

var SOSYAL_URUN = 'kombinle_sosyal', SOSYAL_FIYAT = '$4.99';
function sosyalSahibi() { try { var o = odeme(); return !!(o && o.owned(SOSYAL_URUN)); } catch (e) { return false; } }
function sosyalAcik() { return !!(S.pro || sahipMi() || A.sosyal || sosyalSahibi()); }
function sosyalDurumuDenetle() {
  if (!odemeHazir()) return;
  var v = sosyalSahibi();
  if (A.sosyal !== v) { A.sosyal = v; ayarKaydet(); }
}
/* Anket açmak isteyen ücretsiz kullanıcıya: Sosyal paket sayfası */
function sosyalSayfasi(neden, sonra) {
  var fiyat = h('span', { text: SOSYAL_FIYAT });
  var al = h('button', { class: 'btn ana sosyal-al', style: { width: '100%' } }, ikon('zap', 'k'), h('span', { text: t('sosyalAl') }), fiyat);
  var sahip = sosyalAcik();
  var gov = h('div', { class: 'profil-duzen sosyal-sayfa' },
    h('div', { class: 'sosyal-bas' }, h('span', { class: 'sosyal-ikon' }, ikon('isilti')),
      h('h3', { text: t('sosyalBaslik') }), h('p', { text: t('sosyalAlt') })),
    neden && !sahip ? h('p', { class: 'sosyal-neden', text: t('sosyalNeden_' + neden) }) : null,
    h('ul', { class: 'sosyal-liste' }, ['sosyalM1', 'sosyalM2', 'sosyalM3'].map(function (k) { return h('li', null, ikon('tik', 'k'), h('span', { text: t(k) })); })),
    h('p', { class: 'ayar-not', text: t('sosyalOyNot') }),
    sahip ? h('p', { class: 'sosyal-sahip' }, ikon('tik', 'k'), h('span', { text: S.pro ? t('sosyalProDahil') : t('sosyalSahip') })) : al,
    sahip ? null : h('button', { class: 'g-btn-cizgi', style: { width: '100%' }, on: { click: function () { s.kapat(); setTimeout(function () { magazaSayfasi(); }, 280); } } }, ikon('tac', 'k'), t('sosyalProGec')),
    sahip ? null : h('p', { class: 'ayar-not', text: t('sosyalProNot', PRO_ONECIKAR_AYLIK) }));
  var s = sayfaAc({ baslik: '', icerik: gov });
  if (odemeHazir() && !sahip) {
    zamanAsimi(odeme().products([SOSYAL_URUN]), 10000).then(function (l) {
      (l || []).forEach(function (u) { if (u && u.id === SOSYAL_URUN && typeof u.price === 'string') fiyat.textContent = kirp(u.price, 24); });
    }).catch(function () { });
  }
  var alimda = false;
  al.addEventListener('click', function () {
    if (alimda) return;
    if (!odemeHazir()) { tost(t('odemeYok')); return; }
    alimda = true; al.disabled = true;
    zamanAsimi(odeme().buy(SOSYAL_URUN), 600000).then(function (ok) {
      if (!ok || !sosyalSahibi()) { tost(t('odemeTamamlanmadi')); return; }
      A.sosyal = true; ayarKaydet();
      s.kapat(); tost(t('sosyalTesekkur'));
      if (sonra) setTimeout(sonra, 300);
    }).catch(function () { tost(t('odemeTamamlanmadi')); }).then(function () { alimda = false; al.disabled = false; });
  });
  return s;
}

/* ---------- Gönderiyi öne çıkar: kullandıkça biten haklar ---------- */
var PRO_ONECIKAR_AYLIK = 10;
var ONE_CIKAR_PAKETLERI = [
  { id: 'onecikar_1', adet: 1, fiyat: '$1.99' },
  { id: 'onecikar_5', adet: 5, fiyat: '$7.19', avantaj: 28 },
  { id: 'onecikar_15', adet: 15, fiyat: '$17.99', avantaj: 40, populer: true }
];
function oneCikarHak() { var n = LS.al('onecikarHak', 0); return sayiMi(n) && n > 0 ? Math.floor(n) : 0; }
function oneCikarProKalan() {
  if (!S.pro) return 0;
  var ay = new Date().toISOString().slice(0, 7), k = LS.al('onecikarPro', null);
  var n = k && k.ay === ay && sayiMi(k.n) ? k.n : 0;
  return Math.max(0, PRO_ONECIKAR_AYLIK - n);
}
function oneCikarKalan() { return sahipMi() ? 99 : oneCikarHak() + oneCikarProKalan(); }
function oneCikarHarca() {
  if (sahipMi()) return;
  if (oneCikarProKalan() > 0) {
    var ay = new Date().toISOString().slice(0, 7), k = LS.al('onecikarPro', null);
    LS.yaz('onecikarPro', { ay: ay, n: (k && k.ay === ay && sayiMi(k.n) ? k.n : 0) + 1 });
  } else LS.yaz('onecikarHak', Math.max(0, oneCikarHak() - 1));
}
/* Google Play'den gelen (tüketilmiş) öne çıkarma haklarını teslim al */
function oneCikarTeslimAl() {
  var n = 0;
  try { if (YEREL && typeof YEREL.oneCikarTeslim === 'function') n = sinirla(+YEREL.oneCikarTeslim() || 0, 0, 100000) | 0; } catch (e) { n = 0; }
  if (n > 0) LS.yaz('onecikarHak', oneCikarHak() + n);
  return n;
}
function oneCikarBekle(ms) {
  return new Promise(function (coz) {
    var bas = Date.now(), top = 0;
    (function dene() {
      top += oneCikarTeslimAl();
      if (top > 0 || Date.now() - bas > ms) { coz(top); return; }
      setTimeout(dene, 500);
    })();
  });
}
function oneCikarSatiri(x, kapat) {
  var kalan = x.oneCikanBitis && x.oneCikanBitis > Date.now() ? Math.max(1, Math.ceil((x.oneCikanBitis - Date.now()) / 3600000)) : 0;
  return menuSatir('zap', t('oneCikar'), x.oneCikan ? (kalan ? t('oneCikanKalan', kalan) : t('oneCikanEtiket')) : oneCikarKalan() ? t('ocHak', oneCikarKalan()) : t('oneCikarAlt'), function () {
    if (x.oneCikan) { tost(t('oneCikanZaten')); return; }
    if (x.gorunurluk && x.gorunurluk !== 'herkes') { tost(t('oneCikarGizli')); return; }
    kapat();
    setTimeout(function () { if (oneCikarKalan() > 0) oneCikarIste(x); else oneCikarPaketSayfasi(function () { oneCikarIste(x); }); }, 280);
  });
}
function oneCikarIste(x) {
  onayla(t('oneCikar'), t('oneCikarSor') + ' ' + t('ocKalanSor', oneCikarKalan()), t('oneCikarEvet')).then(function (evet) {
    if (!evet) return;
    yzIste('/v1/onecikar', { id: x.id }, 15000).then(function (v) {
      if (!x.oneCikan) { oneCikarHarca(); olay('onecikar'); }
      x.oneCikan = 1; x.oneCikanBitis = sayiMi(v.bitis) ? v.bitis : Date.now() + 86400000;
      tost(t('oneCikarildi'));
      TOPLULUK.yuklendi = false; toplulukCizYenile();
    }).catch(function (e) {
      tost(e && e.message === 'kota' ? t('oneCikarKota') : e && e.message === 'gizli' ? t('oneCikarGizli') : hesapHataMetni(e));
    });
  });
}
/* Öne çıkarma paketleri (1 / 5 / 15) */
function oneCikarPaketSayfasi(sonra) {
  oneCikarTeslimAl();
  var fiyatEl = {};
  var gov = h('div', { class: 'profil-duzen sosyal-sayfa' },
    h('div', { class: 'sosyal-bas' }, h('span', { class: 'sosyal-ikon' }, ikon('zap')),
      h('h3', { text: t('ocBaslik') }), h('p', { text: t('ocAlt') })),
    h('p', { class: 'sosyal-neden', text: oneCikarKalan() ? t('ocHak', oneCikarKalan()) : t('ocHakYok') }));
  ONE_CIKAR_PAKETLERI.forEach(function (pk) {
    var btn = h('button', { class: 'g-fiyat' + (pk.populer ? ' altin' : ''), text: pk.fiyat, on: { click: function () { al(pk); } } });
    fiyatEl[pk.id] = btn;
    gov.appendChild(h('div', { class: 'g-paket' + (pk.populer ? ' populer' : '') },
      pk.populer ? h('span', { class: 'g-populer', text: t('populer') }) : null,
      h('div', null, h('b', { text: t('ocPaket', pk.adet) }), h('small', { text: t('ocPaketAlt', pk.adet) + (pk.avantaj ? ' • ' + t('avantajYuzde', pk.avantaj) : '') })), btn));
  });
  if (!S.pro) {
    gov.appendChild(h('button', { class: 'g-btn-cizgi', style: { width: '100%' }, on: { click: function () { s.kapat(); setTimeout(function () { magazaSayfasi(); }, 280); } } }, ikon('tac', 'k'), t('sosyalProGec')));
    gov.appendChild(h('p', { class: 'ayar-not', text: t('ocProNot', PRO_ONECIKAR_AYLIK) }));
  }
  var s = sayfaAc({ baslik: '', icerik: gov });
  if (odemeHazir()) {
    zamanAsimi(odeme().products(ONE_CIKAR_PAKETLERI.map(function (p) { return p.id; })), 10000).then(function (l) {
      (l || []).forEach(function (u) { if (u && fiyatEl[u.id] && typeof u.price === 'string') fiyatEl[u.id].textContent = kirp(u.price, 24); });
    }).catch(function () { });
  }
  var alimda = false;
  function al(pk) {
    if (alimda) return;
    if (!odemeHazir()) { tost(t('odemeYok')); return; }
    alimda = true;
    zamanAsimi(odeme().buy(pk.id), 600000).then(function (ok) {
      if (!ok) { tost(t('odemeTamamlanmadi')); return; }
      return oneCikarBekle(15000).then(function (n) {
        if (n <= 0) { tost(t('odemeTamamlanmadi')); return; }
        tost(t('ocYuklendi', n)); s.kapat();
        if (sonra) setTimeout(sonra, 300);
      });
    }).catch(function () { tost(t('odemeTamamlanmadi')); }).then(function () { alimda = false; });
  }
  return s;
}

/* ---------- Keşfet'te AdMob ---------- */
var ADMOB = { sayac: 0, hata: {}, yer: {}, son: '', zaman: null, izleyici: null };
function admobKullan() { try { return !!(YEREL && typeof YEREL.admobVar === 'function' && YEREL.admobVar() && !S.pro); } catch (e) { return false; } }
function admobKarti(p) {
  var id = p.r.id;
  var yer = h('div', { class: 'admob-yer', 'data-admob': id, 'aria-hidden': 'true' }, h('span', { class: 'admob-yukleniyor' }));
  var kart = h('article', { class: 'g-akis g-reklam admob-kart', 'data-reklam': id, 'aria-label': t('admobEtiket') },
    h('div', { class: 'g-akis-bas' },
      h('span', { class: 'g-avatar rk-av' }, ikon('isilti', 'k')),
      h('div', null, h('b', { text: t('admobEtiket') }), h('small', { class: 'rk-sponsor', text: t('rkSponsorlu') })),
      h('button', { class: 'g-reklam-gec rv-link', on: { click: function (e) { e.stopPropagation(); reklamVerSayfasi(); } } }, h('span', { text: t('rvBurada') }))),
    yer);
  admobIzle();
  return kart;
}
/* yüklenemeyen AdMob yuvası, uygulamanın kendi tanıtımına döner */
window.addEventListener('kbadmob', function (e) {
  var d = e.detail || {};
  if (typeof d.id !== 'string') return;
  var yer = document.querySelector('.admob-yer[data-admob="' + d.id.replace(/[^a-z0-9-]/g, '') + '"]');
  if (d.durum === 'tamam') { if (yer) yer.classList.add('dolu'); return; }
  if (d.durum !== 'hata') return;
  ADMOB.hata[d.id] = 1;
  var konum = ADMOB.yer[d.id], ev = evReklamlari().filter(function (r) { return !REKLAM.gecilen[r.id]; });
  var yeni = ev.length ? { r: ev[rastgeleArada(0, ev.length - 1)], boyut: REKLAM_BOYUTLAR[rastgeleArada(0, 2)], ara: rastgeleArada(5, 8) } : null;
  if (konum && REKLAM.plan[konum]) { if (yeni) { yeni.ara = REKLAM.plan[konum].ara; REKLAM.plan[konum] = yeni; } else delete REKLAM.plan[konum]; }
  var kart = yer && yer.closest('.admob-kart');
  if (kart) { if (yeni) kart.replaceWith(reklamKarti(yeni)); else kart.remove(); }
  admobBildir(true);
});
function admobGizliMi() {
  return S.sekme !== 'kesfet' || document.hidden || (typeof YIGIN !== 'undefined' && YIGIN.length > 0) ||
    !!document.querySelector('.sayfa.acik, .pencere.acik, .perde.acik, .sohbet.acik, .goruntuleyici.acik, .kam');
}
function admobBildir(zorla) {
  if (!admobKullan()) return;
  var liste = [];
  var gizli = admobGizliMi();
  if (!gizli) {
    $$('.admob-yer').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      liste.push({ id: el.getAttribute('data-admob'), x: Math.round(r.left + window.scrollX), y: Math.round(r.top + window.scrollY), w: Math.round(r.width), h: Math.round(r.height) });
    });
  }
  var ust = 0, alt = 0, bas = $('.g-ust'), menu = $('#altMenu');
  if (bas) ust = Math.max(0, Math.round(bas.getBoundingClientRect().bottom));
  if (menu && !menu.classList.contains('gizli')) alt = Math.max(0, Math.round(window.innerHeight - menu.getBoundingClientRect().top));
  var v = JSON.stringify({ gizli: gizli || !liste.length, ust: ust, alt: alt, liste: liste.slice(0, 30) });
  if (!zorla && v === ADMOB.son) return;
  ADMOB.son = v;
  try { YEREL.admobYer(v); } catch (e) { }
}
/* yerleşim değiştikçe (yorum açıldı, sayfa açıldı, sekme değişti) yer yeniden bildirilir */
function admobIzle() {
  if (ADMOB.zaman || !admobKullan()) return;
  var bekle = false;
  var tetik = function () { if (bekle) return; bekle = true; requestAnimationFrame(function () { bekle = false; admobBildir(false); }); };
  ADMOB.zaman = setInterval(function () { admobBildir(false); }, 450);
  window.addEventListener('resize', tetik);
  document.addEventListener('visibilitychange', function () { admobBildir(true); });
  if ('ResizeObserver' in window) { ADMOB.izleyici = new ResizeObserver(tetik); ADMOB.izleyici.observe(document.body); }
}
function admobGizlilikSatiri(satir) {
  try { if (!YEREL || typeof YEREL.admobGizlilikGerekli !== 'function' || !YEREL.admobGizlilikGerekli()) return null; } catch (e) { return null; }
  return satir('kalkan', t('admobGizlilik'), t('admobGizlilikAlt'), function () { try { YEREL.admobGizlilik(); } catch (e) { } });
}

/* ---------- Reklam ver ---------- */
var RV_DURUMLAR = ['bekliyor', 'onaylandi', 'yayinda', 'reddedildi', 'iptal', 'bitti'];
function sayiYaz(n) { try { return Number(n).toLocaleString(A.dil === 'en' ? 'en-US' : 'tr-TR'); } catch (e) { return String(n); } }
function paketAdi(p) { return p.ilk ? t('rvIlk', p.gun) : p.gosterim ? t('rvGosterim', sayiYaz(p.gosterim)) : t('rvGun', p.gun); }
function tlYaz(n) { try { return Number(n).toLocaleString('tr-TR') + ' ₺'; } catch (e) { return n + ' ₺'; } }
function reklamVerSayfasi() {
  if (!yzKurulu()) { tost(t('yzKapali')); return; }
  if (!girisIste()) return;
  var hb = hesapBilgi() || {};
  var tuval = null, boyut = 'dikey', secPaket = 'g30000', paketler = [], indirim = 0;
  var alan = function (etk, enFazla, ek) {
    var i = h('input', Object.assign({ class: 'metin', type: 'text', maxlength: String(enFazla), 'aria-label': etk }, ek || {}));
    return { el: i, sar: h('label', { class: 'hesap-alan' }, h('span', { text: etk }), i) };
  };
  var onizleme = h('button', { class: 'rk-resim-sec', 'data-boyut': boyut }, ikon('galeri'), h('span', { text: t('rkResimSec') }));
  var boyutlar = h('div', { class: 'cipler' });
  REKLAM_BOYUTLAR.forEach(function (b) {
    boyutlar.appendChild(h('button', { class: 'cip', 'data-b': b, 'aria-pressed': b === boyut ? 'true' : 'false', text: t('rkBoyut_' + b), on: { click: function () {
      boyut = b; $$('button', boyutlar).forEach(function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-b') === b ? 'true' : 'false'); });
      onizleme.setAttribute('data-boyut', b);
    } } }));
  });
  onizleme.addEventListener('click', function () {
    var inp = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', style: { display: 'none' } });
    document.body.appendChild(inp);
    inp.addEventListener('change', function () {
      var f = inp.files && inp.files[0]; inp.remove();
      if (!f) return;
      if (f.size > EN_BUYUK_DOSYA) { tost(t('dosyaBuyuk')); return; }
      resimCoz(f).then(function (bmp) {
        tuval = tuvaleCiz(bmp, 1080); bmpKapat(bmp);
        temizle(onizleme); onizleme.appendChild(h('img', { src: tuval.toDataURL('image/jpeg', 0.8), alt: '' }));
      }).catch(function () { tost(t('dosyaBozuk')); });
    });
    inp.click();
  });
  var marka = alan(t('rkMarka'), 30), baslik = alan(t('rkBaslikEtk'), 60), metin = alan(t('rkMetin'), 200),
    link = alan(t('rkLink'), 300, { placeholder: 'https://', inputmode: 'url' }), dugme = alan(t('rkDugme'), 20, { placeholder: t('rkDahaFazla') });
  var firma = alan(t('rvFirma'), 80), yetkili = alan(t('rvYetkili'), 60, { autocomplete: 'name' }),
    eposta = alan(t('rvEposta'), 254, { type: 'email', inputmode: 'email', autocomplete: 'email' }),
    telefon = alan(t('rvTelefon'), 24, { type: 'tel', inputmode: 'tel', autocomplete: 'tel', placeholder: '05xx xxx xx xx' }), vergi = alan(t('rvVergi'), 60);
  if (hb.eposta) eposta.el.value = hb.eposta;
  if (hb.ad) yetkili.el.value = hb.ad;
  var paketKap = h('div', { class: 'rv-paketler', role: 'radiogroup', 'aria-label': t('rvPaket') }, h('span', { class: 'yukleniyor' }));
  var havaleVar = false;
  function paketCiz() {
    temizle(paketKap);
    if (indirim) paketKap.appendChild(h('p', { class: 'rv-indirim', text: t('rvIndirim', indirim) }));
    paketler.forEach(function (p) {
      paketKap.appendChild(h('button', { class: 'rv-paket' + (p.ilk ? ' ilk' : ''), role: 'radio', 'aria-checked': p.id === secPaket ? 'true' : 'false', on: { click: function () { secPaket = p.id; paketCiz(); } } },
        h('b', { text: paketAdi(p) }),
        h('span', null, p.liste && p.liste > p.fiyat ? h('del', { text: tlYaz(p.liste) }) : null, document.createTextNode(tlYaz(p.fiyat))),
        h('small', { text: p.ilk ? t('rvIlkAlt') : t('rvBinGosterim', tlYaz(Math.round(p.fiyat * 1000 / p.gosterim))) })));
    });
  }
  yzIste('/v1/rtarife', {}, 15000).then(function (v) {
    paketler = Array.isArray(v.paketler) ? v.paketler.filter(function (p) { return p && typeof p.id === 'string' && /^[a-z]{1,3}\d{1,7}$/.test(p.id) && sayiMi(p.fiyat) && sayiMi(p.gun); }).slice(0, 8) : [];
    havaleVar = v.havale === true;
    indirim = sayiMi(v.indirim) && v.indirim > 0 && v.indirim <= 90 ? v.indirim : 0;
    if (paketler.length && !paketler.some(function (p) { return p.id === secPaket; })) secPaket = paketler[Math.min(1, paketler.length - 1)].id;
    paketCiz();
  }).catch(function () { temizle(paketKap); paketKap.appendChild(h('p', { class: 'alt-yazi', text: t('tpHata') })); });
  var adimlar = h('ol', { class: 'rv-adimlar' }, ['rvAdim1', 'rvAdim2', 'rvAdim3', 'rvAdim4'].map(function (k, i) { return h('li', null, h('b', { text: String(i + 1) }), h('span', { text: t(k) })); }));
  var gonder = h('button', { class: 'btn ana' }, ikon('gonder', 'k'), t('rvGonder'));
  var s = sayfaAc({ tam: true, baslik: t('rvBaslik'), icerik: h('div', { class: 'profil-duzen rv-sayfa' },
    h('div', { class: 'rv-bas' }, h('span', { class: 'sosyal-ikon' }, ikon('grafik')), h('h3', { text: t('rvAlt') }), h('p', { text: t('rvGiris') })),
    adimlar,
    h('button', { class: 'satir rv-basvurular', on: { click: function () { reklamBasvurularim(); } } }, h('span', { class: 'sol' }, ikon('takvim'), h('div', null, t('rvBasvurularim'))), ikon('sag', 'k')),
    h('span', { class: 'g-bolum-etk', text: t('rvPaket') }), paketKap, h('p', { class: 'ayar-not', text: t('rvKdv') }),
    h('span', { class: 'g-bolum-etk', text: t('rvReklamBolum') }),
    onizleme, h('div', { class: 'hesap-alan' }, h('span', { text: t('rkBoyutEtk') }), boyutlar),
    marka.sar, baslik.sar, metin.sar, link.sar, dugme.sar,
    h('span', { class: 'g-bolum-etk', text: t('rvIletisimBolum') }),
    firma.sar, yetkili.sar, eposta.sar, telefon.sar, vergi.sar,
    h('p', { class: 'ayar-not', text: t('rvKurallar') })), altBar: gonder });
  function eksik(a) { a.el.classList.add('hatali'); a.el.focus(); tost(t('rvEksik')); return true; }
  gonder.addEventListener('click', function () {
    $$('.hatali', s.el || document).forEach(function (x) { x.classList.remove('hatali'); });
    if (!tuval) { tost(t('rkResimGerek')); onizleme.scrollIntoView({ block: 'center' }); return; }
    if (kirp(marka.el.value, 30).length < 2) return eksik(marka);
    var l = (link.el.value || '').trim();
    if (l && !/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}(\/[^\s"'<>]*)?$/i.test(l)) { link.el.classList.add('hatali'); link.el.focus(); tost(t('rkLinkHata')); return; }
    if (kirp(firma.el.value, 80).length < 2) return eksik(firma);
    if (kirp(yetkili.el.value, 60).length < 2) return eksik(yetkili);
    if (!/^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/.test((eposta.el.value || '').trim())) return eksik(eposta);
    if ((telefon.el.value || '').replace(/\D/g, '').length < 10) { telefon.el.classList.add('hatali'); telefon.el.focus(); tost(t('rvTelefonHata')); return; }
    if (!paketler.length) { tost(t('tpHata')); return; }
    var b64 = tuvaldenB64(tuval, 440 * 1024);
    if (!b64) { tost(t('dosyaBuyuk')); return; }
    gonder.disabled = true;
    yzIste('/v1/rtalep', { resim: b64, boyut: boyut, paket: secPaket, marka: kirp(marka.el.value, 30), baslik: kirp(baslik.el.value, 60), metin: kirp(metin.el.value, 200), link: l,
      dugme: kirp(dugme.el.value, 20), firma: kirp(firma.el.value, 80), yetkili: kirp(yetkili.el.value, 60), eposta: (eposta.el.value || '').trim().slice(0, 254),
      telefon: kirp(telefon.el.value, 24), vergi: kirp(vergi.el.value, 60) }, 40000).then(function (v) {
      s.kapat(); olay('reklam_basvuru');
      setTimeout(function () { reklamBasvurularim(v && v.kod); }, 300);
    }).catch(function (e) {
      var m = e && e.message;
      tost(m === 'link' ? t('rkLinkHata') : m === 'telefon' ? t('rvTelefonHata') : m === 'cok_talep' ? t('rvCokTalep') : m === 'kota' ? t('rvKota') : ['firma', 'yetkili', 'eposta', 'marka'].indexOf(m) >= 0 ? t('rvEksik') : hesapHataMetni(e));
    }).then(function () { gonder.disabled = false; });
  });
  return s;
}
function kopyalaSatiri(etk, deger) {
  var btn = h('button', { class: 'g-btn-cizgi kucuk', text: t('rvKopyala'), on: { click: function () {
    var bitti = function () { btn.textContent = t('rvKopyalandi'); setTimeout(function () { btn.textContent = t('rvKopyala'); }, 1600); };
    try { navigator.clipboard.writeText(deger).then(bitti, function () { tost(deger); }); } catch (e) { tost(deger); }
  } } });
  return h('div', { class: 'rv-kopya' }, h('div', null, h('small', { text: etk }), h('b', { text: deger })), btn);
}
function talepKarti(x, adres, yonetim, yenile) {
  var durum = RV_DURUMLAR.indexOf(x.durum) >= 0 ? x.durum : 'bekliyor';
  var kart = h('div', { class: 'rv-kart durum-' + durum },
    h('div', { class: 'rv-kart-bas' },
      h('img', { src: adres ? adres + '/v1/talepresim/' + x.id : '', alt: '', loading: 'lazy', referrerpolicy: 'no-referrer' }),
      h('div', null, h('b', { text: kirp(x.marka, 30) }), h('small', { text: (x.kod || '') + ' • ' + paketAdi({ ilk: x.ilk, gun: x.gun, gosterim: x.hedef }) + ' • ' + tlYaz(x.fiyat) }),
        h('span', { class: 'rv-durum', text: t('rvDurum_' + durum) }))));
  if (x.baslik || x.metin) kart.appendChild(h('p', { class: 'rv-metin' }, x.baslik ? h('b', { text: kirp(x.baslik, 60) + ' ' }) : null, document.createTextNode(kirp(x.metin || '', 200))));
  if (yonetim) {
    kart.appendChild(h('div', { class: 'rv-iletisim' },
      h('small', { text: kirp(x.firma, 80) + (x.vergi ? ' • ' + kirp(x.vergi, 60) : '') }),
      h('small', { text: kirp(x.yetkili, 60) + ' • ' + kirp(x.eposta, 254) + ' • ' + kirp(x.telefon, 24) }),
      x.link ? h('small', { text: kirp(x.link, 120) }) : null));
  }
  if (x.not) kart.appendChild(h('p', { class: 'rv-not' }, h('b', { text: t('rvYoneticiNot') + ': ' }), document.createTextNode(kirp(x.not, 200))));
  if (!yonetim && durum === 'onaylandi') {
    var od = h('div', { class: 'rv-odeme' }, h('b', { text: t('rvOdemeBaslik') }), h('p', { text: t('rvOdemeMetin', tlYaz(x.fiyat), x.kod) }));
    if (x.odeme && x.odeme.iban) {
      od.appendChild(kopyalaSatiri(t('rvAlici'), kirp(x.odeme.alici, 80)));
      od.appendChild(kopyalaSatiri(t('rvIban'), kirp(x.odeme.iban, 42)));
      od.appendChild(kopyalaSatiri(t('rvAciklama'), x.kod));
      od.appendChild(kopyalaSatiri(t('rvTutar'), tlYaz(x.fiyat)));
    } else od.appendChild(h('p', { class: 'ayar-not', text: t('rvOdemeEposta') }));
    kart.appendChild(od);
  }
  if (durum === 'yayinda' || durum === 'bitti') {
    kart.appendChild(h('small', { class: 'rv-ist', text: (sayiMi(x.gosterim) ? t('rvIstatistik', sayiYaz(x.gosterim) + (x.hedef ? ' / ' + sayiYaz(x.hedef) : ''), x.tik | 0) + ' • ' : '') +
      (durum === 'yayinda' ? t('rvBitis', new Date(x.bitis).toLocaleDateString(A.dil === 'tr' ? 'tr-TR' : undefined)) : t('rvDurum_bitti')) }));
  }
  var dugmeler = h('div', { class: 'sarili rv-dugmeler', style: { gap: '8px' } });
  var islem = function (govde, metin_) {
    return yzIste('/v1/rtkarar', govde, 20000).then(function () { tost(metin_ || t('rtYapildi')); yenile(); }).catch(function (e) { tost(hesapHataMetni(e)); });
  };
  if (yonetim) {
    if (durum === 'bekliyor' || durum === 'onaylandi') {
      var fiyatGir = h('input', { class: 'metin', type: 'number', min: '1', value: String(x.fiyat), 'aria-label': t('rtFiyatSor'), style: { 'max-width': '110px' } });
      var notGir = h('input', { class: 'metin', type: 'text', maxlength: '200', placeholder: t('rtNot'), 'aria-label': t('rtNot'), value: x.not || '' });
      kart.appendChild(h('div', { class: 'sarili', style: { gap: '8px' } }, h('label', { class: 'hesap-alan', style: { flex: '0 0 auto' } }, h('span', { text: t('rtFiyatSor') }), fiyatGir), h('label', { class: 'hesap-alan', style: { flex: '1' } }, h('span', { text: t('rtNot') }), notGir)));
      dugmeler.appendChild(h('button', { class: 'btn ana kucuk', text: durum === 'onaylandi' ? t('rtGuncelle') : t('rtOnayla'), on: { click: function () { islem({ id: x.id, karar: 'onayla', fiyat: +fiyatGir.value || x.fiyat, not: kirp(notGir.value, 200) }); } } }));
      dugmeler.appendChild(h('button', { class: 'btn ikincil kucuk', text: t('rtOdendi'), on: { click: function () {
        onayla(t('rtOdendi'), t('rtOdendiSor', x.kod, tlYaz(+fiyatGir.value || x.fiyat)), t('rtOdendi')).then(function (e) { if (e) islem({ id: x.id, karar: 'odendi' }); });
      } } }));
      dugmeler.appendChild(h('button', { class: 'g-btn-cizgi kucuk tehlike', text: t('rtReddet'), on: { click: function () {
        onayla(t('rtReddet'), t('rtReddetSor'), t('rtReddet'), true).then(function (e) { if (e) islem({ id: x.id, karar: 'reddet', not: kirp(notGir.value, 200) }); });
      } } }));
    } else if (durum === 'yayinda') {
      dugmeler.appendChild(h('button', { class: 'g-btn-cizgi kucuk tehlike', text: t('rtDurdur'), on: { click: function () {
        onayla(t('rtDurdur'), t('rtDurdurSor'), t('rtDurdur'), true).then(function (e) { if (e) islem({ id: x.id, karar: 'durdur' }); });
      } } }));
    }
  } else if (durum === 'bekliyor' || durum === 'onaylandi') {
    dugmeler.appendChild(h('button', { class: 'g-btn-cizgi kucuk', text: t('rvGeriCek'), on: { click: function () {
      onayla(t('rvGeriCek'), t('rvGeriCekSor'), t('rvGeriCek'), true).then(function (e) {
        if (!e) return;
        yzIste('/v1/rtiptal', { id: x.id }, 15000).then(function () { tost(t('rvGeriCekildi')); yenile(); }).catch(function (er) { tost(hesapHataMetni(er)); });
      });
    } } }));
  }
  if (dugmeler.childNodes.length) kart.appendChild(dugmeler);
  return kart;
}
function talepListesi(yol, yonetim, baslik, ust) {
  var liste = h('div', { class: 'rv-liste' }, h('div', { class: 'g-yukleniyor' }, h('span', { class: 'yukleniyor' })));
  var s = sayfaAc({ tam: true, baslik: baslik, icerik: h('div', { class: 'profil-duzen' }, ust, liste) });
  function yukle() {
    yzIste(yol, {}, 20000).then(function (v) {
      temizle(liste);
      var l = Array.isArray(v.liste) ? v.liste.filter(function (x) { return x && typeof x.id === 'string' && /^[a-z0-9]{20}$/.test(x.id); }) : [];
      if (yonetim && v.havale === false) liste.appendChild(h('p', { class: 'ayar-not rv-uyari', text: t('rtIbanYok') }));
      if (!l.length) { liste.appendChild(h('div', { class: 'g-bos-not' }, ikon('grafik', 'k'), h('span', { text: yonetim ? t('rtBos') : t('rvYok') }))); return; }
      var adres = sunucuAdres();
      l.forEach(function (x) { liste.appendChild(talepKarti(x, adres, yonetim, yukle)); });
    }).catch(function (e) { temizle(liste); liste.appendChild(h('p', { class: 'alt-yazi', text: hesapHataMetni(e) })); });
  }
  yukle();
  return s;
}
function reklamBasvurularim(yeniKod) {
  if (!girisIste()) return;
  var ust = h('div', null,
    yeniKod ? h('div', { class: 'rv-tamam' }, ikon('tik', 'k'), h('span', { text: t('rvGonderildi', yeniKod) })) : null,
    h('button', { class: 'btn ikincil', style: { width: '100%' }, on: { click: function () { s.kapat(); setTimeout(reklamVerSayfasi, 300); } } }, ikon('arti', 'k'), t('rvYeni')));
  var s = talepListesi('/v1/rtalepler', false, t('rvBasvurularim'), ust);
  return s;
}
function reklamTalepYonetimi() {
  var hb = hesapBilgi(); if (!hb || !hb.yonetici) return;
  return talepListesi('/v1/rtyonetim', true, t('rtYonetim'), h('p', { class: 'alt-yazi', text: t('rtYonetimMetin') }));
}

Object.assign(DIL.tr, {
  rkVerB: 'Markanı burada göster', rkVerM: "Reklamın Keşfet'te stil meraklılarına ulaşsın. Başvurusu 2 dakika.",
  sosyalBaslik: 'Sosyal paket', sosyalAlt: 'Tek seferlik ödeme, ömür boyu senin', sosyalAl: 'Satın al',
  sosyalM1: '"A mı B mi?" anketi aç: iki kombin arasında kaldığında topluluğa sor',
  sosyalM2: "Gönderini öne çıkar: her gün bir gönderin 24 saat Keşfet'in en üstünde",
  sosyalM3: 'Öne çıkan gönderilerinde "Öne çıkan" rozeti', sosyalOyNot: 'Anketlere oy vermek herkes için ücretsiz.',
  sosyalProGec: "PRO'yu incele", sosyalProNot: 'PRO üyelikte Sosyal paket zaten dahil; reklamsız Keşfet ve günlük yapay zekâ hakları da var.',
  sosyalProDahil: 'PRO üyeliğinde dahil', sosyalSahip: 'Sosyal paket sende', sosyalTesekkur: 'Sosyal paket açıldı 💜',
  sosyalNeden_anket: '"A mı B mi?" anketi açmak Sosyal pakete ya da PRO\'ya özel.', sosyalNeden_onecikar: "Gönderini öne çıkarmak Sosyal pakete ya da PRO'ya özel.",
  oneCikar: 'Gönderiyi öne çıkar', oneCikarAlt: "24 saat Keşfet'in en üstünde", oneCikanKalan: function (n) { return 'Öne çıkıyor • ' + n + ' saat kaldı'; },
  oneCikanZaten: 'Bu gönderi zaten öne çıkıyor.', oneCikarEvet: 'Öne çıkar',
  oneCikarSor: "Gönderin 24 saat boyunca Keşfet'in en üstünde, \"Öne çıkan\" etiketiyle görünecek. Günde bir gönderi öne çıkarabilirsin.",
  oneCikarildi: 'Gönderin 24 saat öne çıkıyor ✨', oneCikarGizli: 'Yalnız herkese açık gönderiler öne çıkarılabilir.',
  oneCikarKota: 'Bugün bir gönderini zaten öne çıkardın; yarın yeniden deneyebilirsin.', oneCikanEtiket: 'Öne çıkan',
  admobEtiket: 'Reklam', admobGizlilik: 'Reklam gizlilik seçenekleri', admobGizlilikAlt: 'Kişiselleştirilmiş reklam iznini değiştir',
  rvBaslik: 'Reklam ver', rvAlt: "Markanı Kombinle'de stil meraklılarına göster", rvBurada: 'Reklam ver',
  rvGiris: 'Reklamın Keşfet akışında gönderilerin arasında "Sponsorlu" etiketiyle görünür. Başvurunu inceleriz; ödemen ulaşınca seçtiğin süre boyunca yayında kalır, süresi bitince kendiliğinden kalkar.',
  rvAdim1: 'Başvur', rvAdim2: 'İnceleme ve fiyat onayı', rvAdim3: 'Havale / EFT ile ödeme', rvAdim4: 'Yayında, gösterim ve tıklama raporu',
  rvPaket: 'Yayın süresi', rvGun: function (n) { return n + ' gün'; }, rvGunluk: function (f) { return 'günü ' + f; }, rvKdv: 'Fiyatlara KDV dahil değildir. Kesin fiyat onayla birlikte bildirilir; fatura başvurudaki bilgilerle kesilir.',
  rvReklamBolum: 'Reklamın', rvIletisimBolum: 'İletişim ve fatura', rvFirma: 'Firma / işletme adı', rvYetkili: 'Yetkili ad soyad', rvEposta: 'E-posta', rvTelefon: 'Telefon',
  rvVergi: 'Vergi dairesi ve numarası (isteğe bağlı)', rvGonder: 'Başvuruyu gönder', rvYeni: 'Yeni başvuru',
  rvKurallar: 'Reklamlar Kombinle reklam kurallarına uymalıdır: yanıltıcı, yetişkin, kumar, sağlık iddiası ya da taklit ürün içeremez. Onaylanmayan başvurudan ücret alınmaz.',
  rvGonderildi: function (k) { return 'Başvurun alındı. Başvuru kodun: ' + k + '. İnceleyip bildirim göndereceğiz.'; },
  rvBasvurularim: 'Reklam başvurularım', rvYok: 'Henüz başvurun yok.',
  rvDurum_bekliyor: 'İnceleniyor', rvDurum_onaylandi: 'Onaylandı • ödeme bekleniyor', rvDurum_yayinda: 'Yayında', rvDurum_reddedildi: 'Onaylanmadı', rvDurum_iptal: 'Geri çekildi', rvDurum_bitti: 'Süresi bitti',
  rvOdemeBaslik: 'Ödeme bilgileri', rvOdemeMetin: function (tt, k) { return tt + ' tutarını aşağıdaki hesaba havale/EFT ile gönder ve açıklamaya başvuru kodunu (' + k + ') yaz. Ödemen ulaşınca reklamın yayına girer, sana bildirim gelir.'; },
  rvIban: 'IBAN', rvAlici: 'Alıcı', rvAciklama: 'Açıklama', rvTutar: 'Tutar', rvKopyala: 'Kopyala', rvKopyalandi: 'Kopyalandı ✓',
  rvOdemeEposta: 'Ödeme bilgilerini e-posta adresine göndereceğiz.', rvBitis: function (d) { return d + ' tarihine kadar yayında'; },
  rvIstatistik: function (g, k) { return g + ' gösterim • ' + k + ' tıklama'; }, rvGeriCek: 'Başvuruyu geri çek', rvGeriCekSor: 'Bu başvuru geri çekilsin mi?', rvGeriCekildi: 'Başvuru geri çekildi.',
  rvYoneticiNot: 'Kombinle notu', rvEksik: 'İşaretli alanı doldur.', rvTelefonHata: 'Geçerli bir telefon numarası yaz.',
  rvCokTalep: 'Sonuçlanmayı bekleyen 3 başvurun var; biri sonuçlanınca yenisini gönderebilirsin.', rvKota: 'Bugün yeterince başvuru gönderdin; yarın yeniden deneyebilirsin.',
  rtYonetim: 'Reklam başvuruları', rtYonetimAc: 'Reklam başvurularını incele', rtYonetimMetin: 'Onayla: fiyatı kesinleştirir, başvurana ödeme bilgisi gider. Ödeme hesabına geçince "Ödeme geldi" de: reklam hemen yayına girer ve süresi bitince kalkar.',
  rtBos: 'Başvuru yok.', rtOnayla: 'Onayla', rtGuncelle: 'Fiyatı güncelle', rtReddet: 'Reddet', rtReddetSor: 'Bu başvuru reddedilsin mi? Başvurana bildirim gider.',
  rtOdendi: 'Ödeme geldi, yayınla', rtOdendiSor: function (k, tt) { return k + ' kodlu ' + tt + ' ödeme hesabına geçti mi? Reklam hemen yayına girer.'; },
  rtDurdur: 'Yayından kaldır', rtDurdurSor: 'Reklam yayından kaldırılsın mı?', rtFiyatSor: 'Fiyat (₺)', rtNot: 'Not (başvurana görünür)', rtYapildi: 'Kaydedildi.',
  rtIbanYok: 'REKLAM_IBAN tanımlı değil: başvuranlara ödeme bilgisini e-postayla gönder.',
  bnRtalep: 'yeni bir reklam başvurusu gönderdi', bnRtonay: 'reklam başvurunu onayladı • ödeme bilgileri hazır', bnRtred: 'reklam başvurunu onaylamadı', bnRtyayin: 'reklamın yayında 🎉'
});
Object.assign(DIL.en, {
  rkVerB: 'Show your brand here', rkVerM: 'Reach style lovers in Explore. Applying takes 2 minutes.',
  sosyalBaslik: 'Social pack', sosyalAlt: 'Pay once, yours for good', sosyalAl: 'Buy',
  sosyalM1: 'Start "A or B?" polls: ask the community when you can\'t pick between two outfits',
  sosyalM2: 'Boost your post: one post a day at the top of Explore for 24 hours',
  sosyalM3: 'A "Featured" badge on your boosted posts', sosyalOyNot: 'Voting on polls is free for everyone.',
  sosyalProGec: 'See PRO', sosyalProNot: 'PRO already includes the Social pack, plus ad-free Explore and daily AI credits.',
  sosyalProDahil: 'Included in your PRO', sosyalSahip: 'You have the Social pack', sosyalTesekkur: 'Social pack unlocked 💜',
  sosyalNeden_anket: 'Starting "A or B?" polls is part of the Social pack and PRO.', sosyalNeden_onecikar: 'Boosting posts is part of the Social pack and PRO.',
  oneCikar: 'Boost post', oneCikarAlt: 'Top of Explore for 24 hours', oneCikanKalan: function (n) { return 'Boosted • ' + n + 'h left'; },
  oneCikanZaten: 'This post is already boosted.', oneCikarEvet: 'Boost',
  oneCikarSor: 'Your post will show at the top of Explore for 24 hours with a "Featured" label. You can boost one post a day.',
  oneCikarildi: 'Your post is boosted for 24 hours ✨', oneCikarGizli: 'Only public posts can be boosted.',
  oneCikarKota: 'You already boosted a post today; try again tomorrow.', oneCikanEtiket: 'Featured',
  admobEtiket: 'Ad', admobGizlilik: 'Ad privacy options', admobGizlilikAlt: 'Change your personalised ads consent',
  rvBaslik: 'Advertise', rvAlt: 'Show your brand to style lovers on Kombinle', rvBurada: 'Advertise',
  rvGiris: 'Your ad appears between posts in the Explore feed with a "Sponsored" label. We review your request; once payment arrives it runs for the period you chose and ends by itself.',
  rvAdim1: 'Apply', rvAdim2: 'Review and price confirmation', rvAdim3: 'Pay by bank transfer', rvAdim4: 'Live, with impressions and clicks',
  rvPaket: 'Duration', rvGun: function (n) { return n + ' days'; }, rvGunluk: function (f) { return f + ' / day'; }, rvKdv: 'Prices exclude VAT. The final price is confirmed on approval; the invoice uses the details you provide.',
  rvReklamBolum: 'Your ad', rvIletisimBolum: 'Contact and billing', rvFirma: 'Company / business name', rvYetkili: 'Contact person', rvEposta: 'Email', rvTelefon: 'Phone',
  rvVergi: 'Tax office and number (optional)', rvGonder: 'Send request', rvYeni: 'New request',
  rvKurallar: 'Ads must follow the Kombinle ad rules: no misleading, adult, gambling, health-claim or counterfeit content. Requests that are not approved are not charged.',
  rvGonderildi: function (k) { return 'Request received. Your code: ' + k + '. We will review it and notify you.'; },
  rvBasvurularim: 'My ad requests', rvYok: 'No requests yet.',
  rvDurum_bekliyor: 'In review', rvDurum_onaylandi: 'Approved • awaiting payment', rvDurum_yayinda: 'Live', rvDurum_reddedildi: 'Not approved', rvDurum_iptal: 'Withdrawn', rvDurum_bitti: 'Ended',
  rvOdemeBaslik: 'Payment details', rvOdemeMetin: function (tt, k) { return 'Send ' + tt + ' by bank transfer to the account below and write your request code (' + k + ') in the description. Your ad goes live when the payment arrives and you get a notification.'; },
  rvIban: 'IBAN', rvAlici: 'Recipient', rvAciklama: 'Description', rvTutar: 'Amount', rvKopyala: 'Copy', rvKopyalandi: 'Copied ✓',
  rvOdemeEposta: 'We will email the payment details to you.', rvBitis: function (d) { return 'Live until ' + d; },
  rvIstatistik: function (g, k) { return g + ' impressions • ' + k + ' clicks'; }, rvGeriCek: 'Withdraw request', rvGeriCekSor: 'Withdraw this request?', rvGeriCekildi: 'Request withdrawn.',
  rvYoneticiNot: 'Note from Kombinle', rvEksik: 'Please fill in the highlighted field.', rvTelefonHata: 'Enter a valid phone number.',
  rvCokTalep: 'You have 3 requests waiting; you can send a new one when one is settled.', rvKota: 'You sent enough requests today; try again tomorrow.',
  rtYonetim: 'Ad requests', rtYonetimAc: 'Review ad requests', rtYonetimMetin: 'Approve: confirms the price and sends payment details. When the money arrives, tap "Payment received": the ad goes live and ends by itself.',
  rtBos: 'No requests.', rtOnayla: 'Approve', rtGuncelle: 'Update price', rtReddet: 'Reject', rtReddetSor: 'Reject this request? The advertiser is notified.',
  rtOdendi: 'Payment received, publish', rtOdendiSor: function (k, tt) { return 'Did the ' + tt + ' payment for ' + k + ' arrive? The ad goes live right away.'; },
  rtDurdur: 'Take down', rtDurdurSor: 'Take this ad down?', rtFiyatSor: 'Price (₺)', rtNot: 'Note (visible to advertiser)', rtYapildi: 'Saved.',
  rtIbanYok: 'REKLAM_IBAN is not set: send payment details to advertisers by email.',
  bnRtalep: 'sent a new ad request', bnRtonay: 'approved your ad request • payment details ready', bnRtred: 'did not approve your ad request', bnRtyayin: 'your ad is live 🎉'
});
Object.assign(DIL.ru, {
  rkVerB: 'Покажи свой бренд здесь', rkVerM: 'Реклама в «Интересном» для любителей стиля. Заявка — 2 минуты.',
  sosyalBaslik: 'Социальный пакет', sosyalAlt: 'Одна оплата — навсегда твой', sosyalAl: 'Купить',
  sosyalM1: 'Создавай опросы «A или B?»: спроси сообщество, если не можешь выбрать между образами',
  sosyalM2: 'Продвигай публикацию: одна в день — 24 часа вверху «Интересного»',
  sosyalM3: 'Значок «Продвигается» на твоих публикациях', sosyalOyNot: 'Голосовать в опросах бесплатно для всех.',
  sosyalProGec: 'Смотреть PRO', sosyalProNot: 'В PRO социальный пакет уже включён, а ещё лента без рекламы и ежедневные ИИ-запросы.',
  sosyalProDahil: 'Входит в твой PRO', sosyalSahip: 'Социальный пакет у тебя есть', sosyalTesekkur: 'Социальный пакет открыт 💜',
  sosyalNeden_anket: 'Создание опросов «A или B?» входит в социальный пакет и PRO.', sosyalNeden_onecikar: 'Продвижение публикаций входит в социальный пакет и PRO.',
  oneCikar: 'Продвинуть публикацию', oneCikarAlt: '24 часа вверху «Интересного»', oneCikanKalan: function (n) { return 'Продвигается • осталось ' + n + ' ч'; },
  oneCikanZaten: 'Эта публикация уже продвигается.', oneCikarEvet: 'Продвинуть',
  oneCikarSor: 'Публикация 24 часа будет вверху «Интересного» с пометкой «Продвигается». Продвигать можно одну публикацию в день.',
  oneCikarildi: 'Публикация продвигается 24 часа ✨', oneCikarGizli: 'Продвигать можно только публичные публикации.',
  oneCikarKota: 'Сегодня ты уже продвигала публикацию; попробуй завтра.', oneCikanEtiket: 'Продвигается',
  admobEtiket: 'Реклама', admobGizlilik: 'Настройки конфиденциальности рекламы', admobGizlilikAlt: 'Изменить согласие на персональную рекламу',
  rvBaslik: 'Реклама у нас', rvAlt: 'Покажи свой бренд любителям стиля в Kombinle', rvBurada: 'Разместить рекламу',
  rvGiris: 'Реклама показывается между публикациями в «Интересном» с пометкой «Реклама». Мы проверяем заявку; после оплаты она идёт выбранный срок и сама снимается.',
  rvAdim1: 'Заявка', rvAdim2: 'Проверка и цена', rvAdim3: 'Оплата переводом', rvAdim4: 'Показ, отчёт о показах и кликах',
  rvPaket: 'Срок', rvGun: function (n) { return n + ' дн.'; }, rvGunluk: function (f) { return f + ' / день'; }, rvKdv: 'Цены без НДС. Окончательная цена подтверждается при одобрении.',
  rvReklamBolum: 'Твоя реклама', rvIletisimBolum: 'Контакты и счёт', rvFirma: 'Компания', rvYetkili: 'Контактное лицо', rvEposta: 'E-mail', rvTelefon: 'Телефон',
  rvVergi: 'Налоговые данные (необязательно)', rvGonder: 'Отправить заявку', rvYeni: 'Новая заявка',
  rvKurallar: 'Реклама должна соответствовать правилам Kombinle: без обмана, контента 18+, азартных игр, медицинских обещаний и подделок. Неодобренные заявки не оплачиваются.',
  rvGonderildi: function (k) { return 'Заявка принята. Код: ' + k + '. Мы проверим её и пришлём уведомление.'; },
  rvBasvurularim: 'Мои рекламные заявки', rvYok: 'Заявок пока нет.',
  rvDurum_bekliyor: 'На проверке', rvDurum_onaylandi: 'Одобрено • ждём оплату', rvDurum_yayinda: 'В показе', rvDurum_reddedildi: 'Не одобрено', rvDurum_iptal: 'Отозвано', rvDurum_bitti: 'Завершено',
  rvOdemeBaslik: 'Реквизиты для оплаты', rvOdemeMetin: function (tt, k) { return 'Переведи ' + tt + ' на счёт ниже и укажи в назначении код заявки (' + k + '). После поступления оплаты реклама начнёт показываться.'; },
  rvIban: 'IBAN', rvAlici: 'Получатель', rvAciklama: 'Назначение', rvTutar: 'Сумма', rvKopyala: 'Копировать', rvKopyalandi: 'Скопировано ✓',
  rvOdemeEposta: 'Реквизиты пришлём на e-mail.', rvBitis: function (d) { return 'В показе до ' + d; },
  rvIstatistik: function (g, k) { return 'показов: ' + g + ' • кликов: ' + k; }, rvGeriCek: 'Отозвать заявку', rvGeriCekSor: 'Отозвать эту заявку?', rvGeriCekildi: 'Заявка отозвана.',
  rvYoneticiNot: 'Заметка Kombinle', rvEksik: 'Заполни отмеченное поле.', rvTelefonHata: 'Укажи правильный номер телефона.',
  rvCokTalep: 'У тебя 3 заявки на рассмотрении; новую можно отправить позже.', rvKota: 'На сегодня заявок достаточно; попробуй завтра.',
  rtYonetim: 'Рекламные заявки', rtYonetimAc: 'Проверить рекламные заявки', rtYonetimMetin: 'Одобрить — подтвердить цену и отправить реквизиты. Когда оплата придёт, нажми «Оплата получена»: реклама сразу запустится.',
  rtBos: 'Заявок нет.', rtOnayla: 'Одобрить', rtGuncelle: 'Обновить цену', rtReddet: 'Отклонить', rtReddetSor: 'Отклонить заявку? Рекламодатель получит уведомление.',
  rtOdendi: 'Оплата получена, запустить', rtOdendiSor: function (k, tt) { return 'Оплата ' + tt + ' по заявке ' + k + ' поступила? Реклама запустится сразу.'; },
  rtDurdur: 'Снять с показа', rtDurdurSor: 'Снять рекламу с показа?', rtFiyatSor: 'Цена (₺)', rtNot: 'Заметка (видна заявителю)', rtYapildi: 'Сохранено.',
  rtIbanYok: 'REKLAM_IBAN не задан: отправляй реквизиты по e-mail.',
  bnRtalep: 'отправил(а) рекламную заявку', bnRtonay: 'одобрил(а) рекламную заявку • реквизиты готовы', bnRtred: 'не одобрил(а) рекламную заявку', bnRtyayin: 'твоя реклама в показе 🎉'
});
Object.assign(DIL.uz, {
  rkVerB: "Brendingni shu yerda ko'rsat", rkVerM: 'Kashf etishda uslub ishqibozlariga yet. Ariza 2 daqiqa.',
  sosyalBaslik: 'Ijtimoiy paket', sosyalAlt: "Bir marta to'lov, umrbod seniki", sosyalAl: 'Sotib olish',
  sosyalM1: "«A mi B mi?» so'rovnomasini och: ikki obraz orasida qolsang hamjamiyatdan so'ra",
  sosyalM2: "Ulashishingni ko'tar: kuniga bittasi 24 soat Kashf etish tepasida",
  sosyalM3: "Ko'tarilgan ulashishlaringda «Tavsiya» belgisi", sosyalOyNot: "So'rovnomalarga ovoz berish hamma uchun bepul.",
  sosyalProGec: "PRO'ni ko'rish", sosyalProNot: "PRO'da Ijtimoiy paket allaqachon bor, yana reklamasiz lenta va kunlik AI imkoniyatlari.",
  sosyalProDahil: 'PRO obunangda bor', sosyalSahip: 'Ijtimoiy paket sende bor', sosyalTesekkur: 'Ijtimoiy paket ochildi 💜',
  sosyalNeden_anket: "«A mi B mi?» so'rovnomasi Ijtimoiy paket va PRO uchun.", sosyalNeden_onecikar: "Ulashishni ko'tarish Ijtimoiy paket va PRO uchun.",
  oneCikar: "Ulashishni ko'tarish", oneCikarAlt: '24 soat Kashf etish tepasida', oneCikanKalan: function (n) { return "Ko'tarilgan • " + n + ' soat qoldi'; },
  oneCikanZaten: "Bu ulashish allaqachon ko'tarilgan.", oneCikarEvet: "Ko'tarish",
  oneCikarSor: "Ulashishing 24 soat Kashf etish tepasida «Tavsiya» belgisi bilan ko'rinadi. Kuniga bitta ulashishni ko'tarish mumkin.",
  oneCikarildi: "Ulashishing 24 soat ko'tarildi ✨", oneCikarGizli: "Faqat ochiq ulashishlarni ko'tarish mumkin.",
  oneCikarKota: "Bugun bitta ulashishni ko'tarding; ertaga qayta urin.", oneCikanEtiket: 'Tavsiya',
  admobEtiket: 'Reklama', admobGizlilik: 'Reklama maxfiylik sozlamalari', admobGizlilikAlt: "Shaxsiy reklama roziligini o'zgartirish",
  rvBaslik: 'Reklama berish', rvAlt: "Brendingni Kombinle'dagi uslub ishqibozlariga ko'rsat", rvBurada: 'Reklama berish',
  rvGiris: "Reklamang Kashf etish lentasida ulashishlar orasida «Reklama» belgisi bilan chiqadi. Arizangni ko'rib chiqamiz; to'lov kelgach tanlangan muddat davomida ko'rinadi.",
  rvAdim1: 'Ariza', rvAdim2: "Ko'rib chiqish va narx", rvAdim3: "Bank o'tkazmasi bilan to'lov", rvAdim4: "Efirda, ko'rish va bosish hisoboti",
  rvPaket: 'Muddat', rvGun: function (n) { return n + ' kun'; }, rvGunluk: function (f) { return 'kuniga ' + f; }, rvKdv: 'Narxlarga QQS kirmaydi. Aniq narx tasdiqlashda aytiladi.',
  rvReklamBolum: 'Reklamang', rvIletisimBolum: "Aloqa va hisob-faktura", rvFirma: 'Kompaniya nomi', rvYetkili: "Mas'ul shaxs", rvEposta: 'E-pochta', rvTelefon: 'Telefon',
  rvVergi: "Soliq ma'lumotlari (ixtiyoriy)", rvGonder: 'Arizani yuborish', rvYeni: 'Yangi ariza',
  rvKurallar: "Reklamalar Kombinle qoidalariga mos bo'lishi kerak: aldov, kattalar uchun, qimor, tibbiy va'da yoki soxta mahsulot bo'lmasin. Tasdiqlanmagan ariza uchun to'lov olinmaydi.",
  rvGonderildi: function (k) { return 'Ariza qabul qilindi. Kodingiz: ' + k + ". Ko'rib chiqib xabar beramiz."; },
  rvBasvurularim: 'Reklama arizalarim', rvYok: "Hozircha ariza yo'q.",
  rvDurum_bekliyor: "Ko'rib chiqilmoqda", rvDurum_onaylandi: "Tasdiqlandi • to'lov kutilmoqda", rvDurum_yayinda: 'Efirda', rvDurum_reddedildi: 'Tasdiqlanmadi', rvDurum_iptal: 'Qaytarib olindi', rvDurum_bitti: 'Muddati tugadi',
  rvOdemeBaslik: "To'lov ma'lumotlari", rvOdemeMetin: function (tt, k) { return tt + " miqdorini quyidagi hisobga o'tkazing va izohga ariza kodini (" + k + ") yozing. To'lov kelgach reklama efirga chiqadi."; },
  rvIban: 'IBAN', rvAlici: 'Qabul qiluvchi', rvAciklama: 'Izoh', rvTutar: 'Miqdor', rvKopyala: 'Nusxa olish', rvKopyalandi: 'Nusxa olindi ✓',
  rvOdemeEposta: "To'lov ma'lumotlarini e-pochtaga yuboramiz.", rvBitis: function (d) { return d + ' gacha efirda'; },
  rvIstatistik: function (g, k) { return g + " ko'rish • " + k + ' bosish'; }, rvGeriCek: 'Arizani qaytarib olish', rvGeriCekSor: 'Bu ariza qaytarib olinsinmi?', rvGeriCekildi: 'Ariza qaytarib olindi.',
  rvYoneticiNot: 'Kombinle izohi', rvEksik: "Belgilangan maydonni to'ldiring.", rvTelefonHata: "To'g'ri telefon raqamini yozing.",
  rvCokTalep: "Kutilayotgan 3 ta arizang bor; biri hal bo'lgach yangisini yubor.", rvKota: 'Bugun yetarlicha ariza yubording; ertaga urin.',
  rtYonetim: 'Reklama arizalari', rtYonetimAc: "Reklama arizalarini ko'rish", rtYonetimMetin: "Tasdiqlash narxni belgilaydi va to'lov ma'lumotini yuboradi. Pul kelgach «To'lov keldi» ni bosing.",
  rtBos: "Ariza yo'q.", rtOnayla: 'Tasdiqlash', rtGuncelle: 'Narxni yangilash', rtReddet: 'Rad etish', rtReddetSor: 'Ariza rad etilsinmi?',
  rtOdendi: "To'lov keldi, efirga", rtOdendiSor: function (k, tt) { return k + ' kodli ' + tt + " to'lov keldimi? Reklama darhol efirga chiqadi."; },
  rtDurdur: 'Efirdan olish', rtDurdurSor: 'Reklama efirdan olinsinmi?', rtFiyatSor: 'Narx (₺)', rtNot: "Izoh (arizachiga ko'rinadi)", rtYapildi: 'Saqlandi.',
  rtIbanYok: "REKLAM_IBAN belgilanmagan: to'lov ma'lumotini e-pochta orqali yuboring.",
  bnRtalep: 'yangi reklama arizasi yubordi', bnRtonay: "reklama arizangizni tasdiqladi • to'lov ma'lumotlari tayyor", bnRtred: 'reklama arizangizni tasdiqlamadi', bnRtyayin: 'reklamangiz efirda 🎉'
});
Object.assign(DIL.ko, {
  rkVerB: '여기에 브랜드를 보여 주세요', rkVerM: '탐색에서 스타일 애호가들을 만나요. 신청은 2분이면 돼요.',
  sosyalBaslik: '소셜 팩', sosyalAlt: '한 번 결제로 계속 사용해요', sosyalAl: '구매하기',
  sosyalM1: '"A 아니면 B?" 투표 만들기: 두 코디 중 고민될 때 커뮤니티에 물어보세요',
  sosyalM2: '게시물 부스트: 하루 한 게시물을 24시간 동안 탐색 맨 위에',
  sosyalM3: '부스트한 게시물에 "추천" 배지', sosyalOyNot: '투표 참여는 누구나 무료예요.',
  sosyalProGec: 'PRO 보기', sosyalProNot: 'PRO에는 소셜 팩이 이미 포함돼 있고, 광고 없는 탐색과 매일 AI 이용권도 있어요.',
  sosyalProDahil: 'PRO에 포함돼 있어요', sosyalSahip: '소셜 팩을 가지고 있어요', sosyalTesekkur: '소셜 팩이 열렸어요 💜',
  sosyalNeden_anket: '"A 아니면 B?" 투표 만들기는 소셜 팩과 PRO 전용이에요.', sosyalNeden_onecikar: '게시물 부스트는 소셜 팩과 PRO 전용이에요.',
  oneCikar: '게시물 부스트', oneCikarAlt: '24시간 동안 탐색 맨 위에', oneCikanKalan: function (n) { return '부스트 중 • ' + n + '시간 남음'; },
  oneCikanZaten: '이미 부스트 중인 게시물이에요.', oneCikarEvet: '부스트',
  oneCikarSor: '게시물이 24시간 동안 "추천" 표시와 함께 탐색 맨 위에 보여요. 하루에 한 게시물만 부스트할 수 있어요.',
  oneCikarildi: '게시물이 24시간 부스트돼요 ✨', oneCikarGizli: '전체 공개 게시물만 부스트할 수 있어요.',
  oneCikarKota: '오늘 이미 게시물을 부스트했어요. 내일 다시 시도하세요.', oneCikanEtiket: '추천',
  admobEtiket: '광고', admobGizlilik: '광고 개인정보 옵션', admobGizlilikAlt: '맞춤 광고 동의 변경',
  rvBaslik: '광고하기', rvAlt: 'Kombinle의 스타일 애호가들에게 브랜드를 보여 주세요', rvBurada: '광고하기',
  rvGiris: '광고는 탐색 피드의 게시물 사이에 "스폰서" 표시와 함께 나와요. 신청을 검토하고, 결제가 확인되면 선택한 기간 동안 게재된 뒤 자동으로 내려가요.',
  rvAdim1: '신청', rvAdim2: '검토와 가격 확정', rvAdim3: '계좌 이체로 결제', rvAdim4: '게재, 노출과 클릭 보고',
  rvPaket: '게재 기간', rvGun: function (n) { return n + '일'; }, rvGunluk: function (f) { return '하루 ' + f; }, rvKdv: '가격에는 부가세가 포함되지 않아요. 최종 가격은 승인 시 알려 드려요.',
  rvReklamBolum: '광고 내용', rvIletisimBolum: '연락처와 청구 정보', rvFirma: '회사 / 사업체 이름', rvYetkili: '담당자 이름', rvEposta: '이메일', rvTelefon: '전화번호',
  rvVergi: '사업자 정보(선택)', rvGonder: '신청 보내기', rvYeni: '새 신청',
  rvKurallar: '광고는 Kombinle 광고 규칙을 따라야 해요: 허위, 성인, 도박, 건강 효능 주장, 모조품은 안 돼요. 승인되지 않은 신청은 비용이 없어요.',
  rvGonderildi: function (k) { return '신청을 받았어요. 신청 코드: ' + k + '. 검토 후 알림을 보낼게요.'; },
  rvBasvurularim: '내 광고 신청', rvYok: '아직 신청이 없어요.',
  rvDurum_bekliyor: '검토 중', rvDurum_onaylandi: '승인됨 • 결제 대기', rvDurum_yayinda: '게재 중', rvDurum_reddedildi: '승인되지 않음', rvDurum_iptal: '철회함', rvDurum_bitti: '종료',
  rvOdemeBaslik: '결제 정보', rvOdemeMetin: function (tt, k) { return tt + '을(를) 아래 계좌로 이체하고 입금자 메모에 신청 코드(' + k + ')를 적어 주세요. 입금이 확인되면 광고가 게재되고 알림이 가요.'; },
  rvIban: 'IBAN', rvAlici: '받는 사람', rvAciklama: '메모', rvTutar: '금액', rvKopyala: '복사', rvKopyalandi: '복사됨 ✓',
  rvOdemeEposta: '결제 정보를 이메일로 보내 드릴게요.', rvBitis: function (d) { return d + '까지 게재'; },
  rvIstatistik: function (g, k) { return '노출 ' + g + ' • 클릭 ' + k; }, rvGeriCek: '신청 철회', rvGeriCekSor: '이 신청을 철회할까요?', rvGeriCekildi: '신청을 철회했어요.',
  rvYoneticiNot: 'Kombinle 메모', rvEksik: '표시된 칸을 채워 주세요.', rvTelefonHata: '올바른 전화번호를 입력하세요.',
  rvCokTalep: '대기 중인 신청이 3개 있어요. 하나가 처리되면 새로 보낼 수 있어요.', rvKota: '오늘은 신청을 충분히 보냈어요. 내일 다시 시도하세요.',
  rtYonetim: '광고 신청', rtYonetimAc: '광고 신청 검토', rtYonetimMetin: '승인하면 가격이 확정되고 결제 정보가 전달돼요. 입금되면 "결제 확인"을 누르세요: 바로 게재돼요.',
  rtBos: '신청이 없어요.', rtOnayla: '승인', rtGuncelle: '가격 수정', rtReddet: '거절', rtReddetSor: '이 신청을 거절할까요? 신청자에게 알림이 가요.',
  rtOdendi: '결제 확인, 게재', rtOdendiSor: function (k, tt) { return k + ' 신청의 ' + tt + ' 입금이 확인됐나요? 광고가 바로 게재돼요.'; },
  rtDurdur: '게재 중단', rtDurdurSor: '광고 게재를 중단할까요?', rtFiyatSor: '가격 (₺)', rtNot: '메모(신청자에게 보임)', rtYapildi: '저장했어요.',
  rtIbanYok: 'REKLAM_IBAN이 설정되지 않았어요: 결제 정보를 이메일로 보내세요.',
  bnRtalep: '님이 새 광고 신청을 보냈어요', bnRtonay: '님이 광고 신청을 승인했어요 • 결제 정보 준비됨', bnRtred: '님이 광고 신청을 승인하지 않았어요', bnRtyayin: '광고가 게재 중이에요 🎉'
});

/* fiyatlandırma güncellemesi: Sosyal paket yalnız anket; öne çıkarma ayrı paketlerle; reklam gösterimle */
Object.assign(DIL.tr, {
  sosyalM2: 'Anketini takipçilerine ya da herkese aç, oyları anlık izle', sosyalM3: 'Bir kez öde, sınırsız anket aç',
  sosyalProNot: function (n) { return "PRO'da anket açmak dahil; her ay " + n + ' gönderi öne çıkarma, reklamsız Keşfet ve günlük yapay zekâ hakları da var.'; },
  ocBaslik: 'Gönderini öne çıkar', ocAlt: "Gönderin 24 saat Keşfet'in en üstünde, \"Öne çıkan\" etiketiyle görünür.",
  ocHak: function (n) { return n + ' öne çıkarma hakkın var'; }, ocHakYok: 'Öne çıkarma hakkın kalmadı.',
  ocPaket: function (n) { return n === 1 ? '1 öne çıkarma' : n + ' öne çıkarma'; }, ocPaketAlt: function (n) { return n === 1 ? 'Bir gönderi, 24 saat' : n + ' gönderi, her biri 24 saat'; },
  ocProNot: function (n) { return "PRO'da her ay " + n + ' öne çıkarma dahil.'; }, ocYuklendi: function (n) { return n + ' öne çıkarma hakkı eklendi ✨'; },
  ocKalanSor: function (n) { return '(Kalan hakkın: ' + n + ')'; }, oneCikarKota: 'Bugün yeterince gönderi öne çıkardın; yarın yeniden deneyebilirsin.',
  oneCikarSor: "Gönderin 24 saat boyunca Keşfet'in en üstünde, \"Öne çıkan\" etiketiyle görünecek. 1 öne çıkarma hakkın kullanılır.",
  proS8: function (n) { return 'Sınırsız "A mı B mi?" anketi ve her ay ' + n + ' gönderi öne çıkarma'; },
  rvPaket: 'Paket', rvKdv: 'Fiyatlara KDV dahil değildir. Gösterim paketi, gösterimler dolunca ya da en geç 60 günde biter. Kesin fiyat onayla bildirilir; fatura başvurudaki bilgilerle kesilir.',
  rvIndirim: function (n) { return 'Açılışa özel %' + n + ' indirim'; }, rvGosterim: function (s) { return s + ' gösterim'; }, rvBinGosterim: function (f) { return '1.000 gösterim ' + f; },
  rvIlk: function (n) { return n + " gün Keşfet'te ilk sırada"; }, rvIlkAlt: 'Akıştaki ilk reklam yeri senin'
});
Object.assign(DIL.en, {
  sosyalM2: 'Open your poll to followers or everyone and watch votes live', sosyalM3: 'Pay once, unlimited polls',
  sosyalProNot: function (n) { return 'PRO includes polls, ' + n + ' post boosts a month, ad-free Explore and daily AI credits.'; },
  ocBaslik: 'Boost your post', ocAlt: 'Your post shows at the top of Explore for 24 hours with a "Featured" label.',
  ocHak: function (n) { return n === 1 ? 'You have 1 boost' : 'You have ' + n + ' boosts'; }, ocHakYok: 'You have no boosts left.',
  ocPaket: function (n) { return n === 1 ? '1 boost' : n + ' boosts'; }, ocPaketAlt: function (n) { return n === 1 ? 'One post, 24 hours' : n + ' posts, 24 hours each'; },
  ocProNot: function (n) { return 'PRO includes ' + n + ' boosts every month.'; }, ocYuklendi: function (n) { return n + ' boosts added ✨'; },
  ocKalanSor: function (n) { return '(Boosts left: ' + n + ')'; }, oneCikarKota: "You've boosted enough posts today; try again tomorrow.",
  oneCikarSor: 'Your post will show at the top of Explore for 24 hours with a "Featured" label. This uses 1 boost.',
  proS8: function (n) { return 'Unlimited "A or B?" polls and ' + n + ' post boosts a month'; },
  rvPaket: 'Package', rvKdv: 'Prices exclude VAT. An impressions package ends when its impressions are used or after 60 days at most. The final price is confirmed on approval.',
  rvIndirim: function (n) { return 'Launch offer: ' + n + '% off'; }, rvGosterim: function (s) { return s + ' impressions'; }, rvBinGosterim: function (f) { return f + ' per 1,000 impressions'; },
  rvIlk: function (n) { return n === 1 ? 'First slot in Explore for 1 day' : 'First slot in Explore for ' + n + ' days'; }, rvIlkAlt: 'The first ad slot in the feed is yours'
});
Object.assign(DIL.ru, {
  sosyalM2: 'Открывай опрос подписчикам или всем и следи за голосами', sosyalM3: 'Одна оплата — безлимитные опросы',
  sosyalProNot: function (n) { return 'В PRO опросы включены, а ещё ' + n + ' продвижений в месяц, лента без рекламы и ежедневные ИИ-запросы.'; },
  ocBaslik: 'Продвинь публикацию', ocAlt: 'Публикация 24 часа вверху «Интересного» с пометкой «Продвигается».',
  ocHak: function (n) { return 'Продвижений: ' + n; }, ocHakYok: 'Продвижения закончились.',
  ocPaket: function (n) { return 'Продвижений: ' + n; }, ocPaketAlt: function (n) { return n === 1 ? 'Одна публикация, 24 часа' : n + ' публикаций, по 24 часа'; },
  ocProNot: function (n) { return 'В PRO каждый месяц ' + n + ' продвижений.'; }, ocYuklendi: function (n) { return 'Добавлено продвижений: ' + n + ' ✨'; },
  ocKalanSor: function (n) { return '(Осталось: ' + n + ')'; }, oneCikarKota: 'На сегодня продвижений достаточно; попробуй завтра.',
  oneCikarSor: 'Публикация 24 часа будет вверху «Интересного» с пометкой «Продвигается». Спишется 1 продвижение.',
  proS8: function (n) { return 'Безлимитные опросы «A или B?» и ' + n + ' продвижений в месяц'; },
  rvPaket: 'Пакет', rvKdv: 'Цены без НДС. Пакет показов завершается, когда показы израсходованы, или максимум через 60 дней.',
  rvIndirim: function (n) { return 'Скидка к запуску ' + n + '%'; }, rvGosterim: function (s) { return s + ' показов'; }, rvBinGosterim: function (f) { return f + ' за 1000 показов'; },
  rvIlk: function (n) { return 'Первое место в «Интересном», дней: ' + n; }, rvIlkAlt: 'Первое рекламное место в ленте — твоё'
});
Object.assign(DIL.uz, {
  sosyalM2: "So'rovnomangni kuzatuvchilarga yoki hammaga och, ovozlarni jonli kuzat", sosyalM3: "Bir marta to'la, cheksiz so'rovnoma",
  sosyalProNot: function (n) { return "PRO'da so'rovnoma, oyiga " + n + " ta ko'tarish, reklamasiz lenta va kunlik AI imkoniyatlari bor."; },
  ocBaslik: "Ulashishingni ko'tar", ocAlt: "Ulashishing 24 soat Kashf etish tepasida «Tavsiya» belgisi bilan ko'rinadi.",
  ocHak: function (n) { return n + " ta ko'tarish huquqing bor"; }, ocHakYok: "Ko'tarish huquqing qolmadi.",
  ocPaket: function (n) { return n + " ta ko'tarish"; }, ocPaketAlt: function (n) { return n === 1 ? 'Bitta ulashish, 24 soat' : n + ' ta ulashish, har biri 24 soat'; },
  ocProNot: function (n) { return "PRO'da har oy " + n + " ta ko'tarish bor."; }, ocYuklendi: function (n) { return n + " ta ko'tarish qo'shildi ✨"; },
  ocKalanSor: function (n) { return '(Qolgan: ' + n + ')'; }, oneCikarKota: "Bugun yetarlicha ko'tarding; ertaga urin.",
  oneCikarSor: "Ulashishing 24 soat Kashf etish tepasida «Tavsiya» belgisi bilan ko'rinadi. 1 ta ko'tarish ishlatiladi.",
  proS8: function (n) { return "Cheksiz «A mi B mi?» so'rovnomasi va oyiga " + n + " ta ko'tarish"; },
  rvPaket: 'Paket', rvKdv: "Narxlarga QQS kirmaydi. Ko'rish paketi ko'rishlar tugaganda yoki eng ko'pi 60 kunda tugaydi.",
  rvIndirim: function (n) { return 'Ochilish chegirmasi %' + n; }, rvGosterim: function (s) { return s + " ko'rish"; }, rvBinGosterim: function (f) { return "1000 ko'rish " + f; },
  rvIlk: function (n) { return n + ' kun Kashf etishda birinchi o‘rinda'; }, rvIlkAlt: "Lentadagi birinchi reklama joyi seniki"
});
Object.assign(DIL.ko, {
  sosyalM2: '팔로워나 모두에게 투표를 열고 실시간으로 결과를 보세요', sosyalM3: '한 번 결제로 투표 무제한',
  sosyalProNot: function (n) { return 'PRO에는 투표, 매달 게시물 부스트 ' + n + '회, 광고 없는 탐색, 매일 AI 이용권이 포함돼요.'; },
  ocBaslik: '게시물 부스트', ocAlt: '게시물이 24시간 동안 "추천" 표시와 함께 탐색 맨 위에 보여요.',
  ocHak: function (n) { return '부스트 ' + n + '회 남음'; }, ocHakYok: '남은 부스트가 없어요.',
  ocPaket: function (n) { return '부스트 ' + n + '회'; }, ocPaketAlt: function (n) { return n === 1 ? '게시물 1개, 24시간' : '게시물 ' + n + '개, 각 24시간'; },
  ocProNot: function (n) { return 'PRO에는 매달 부스트 ' + n + '회가 포함돼요.'; }, ocYuklendi: function (n) { return '부스트 ' + n + '회가 추가됐어요 ✨'; },
  ocKalanSor: function (n) { return '(남은 부스트: ' + n + ')'; }, oneCikarKota: '오늘은 부스트를 충분히 했어요. 내일 다시 시도하세요.',
  oneCikarSor: '게시물이 24시간 동안 "추천" 표시와 함께 탐색 맨 위에 보여요. 부스트 1회가 사용돼요.',
  proS8: function (n) { return '"A 아니면 B?" 투표 무제한, 매달 게시물 부스트 ' + n + '회'; },
  rvPaket: '패키지', rvKdv: '가격에는 부가세가 포함되지 않아요. 노출 패키지는 노출을 다 쓰거나 최대 60일이 지나면 끝나요.',
  rvIndirim: function (n) { return '오픈 기념 ' + n + '% 할인'; }, rvGosterim: function (s) { return '노출 ' + s + '회'; }, rvBinGosterim: function (f) { return '노출 1,000회당 ' + f; },
  rvIlk: function (n) { return '탐색 첫 자리 ' + n + '일'; }, rvIlkAlt: '피드의 첫 광고 자리가 내 거예요'
});
