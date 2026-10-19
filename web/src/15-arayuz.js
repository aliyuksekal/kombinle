/* =========================================================
   Kombinle arayüzü (Gemini Canvas tasarımı) — gerçek veriyle
   ========================================================= */

/* ---------- Jeton ekonomisi ----------
   Yeni kullanıcı 15 jetonla başlar. Kombin önerisi ve yapay zekâ işleri 1 jeton.
   PRO sınırsızdır. Jeton paketleri Google Play'den satın alınır. */
var BASLANGIC_JETON = 15;
var JETON_PAKETLERI = [
  { id: 'jeton_100', adet: 100, fiyat: '39,99 ₺' },
  { id: 'jeton_300', adet: 300, fiyat: '89,99 ₺' },
  { id: 'jeton_500', adet: 500, fiyat: '129,99 ₺', populer: true }
];
var UCRETLI = { kombin: 1, arka: 1, bavul: 1, eslestir: 1, ilham: 1 };
function jeton() {
  var j = LS.al('jeton', null);
  if (j === null) { LS.yaz('jeton', BASLANGIC_JETON); return BASLANGIC_JETON; }
  return sinirla(j, 0, 1e7) | 0;
}
function jetonEkle(n) { LS.yaz('jeton', jeton() + (n | 0)); jetonHapGuncelle(); }
/* Satın alınan jetonlar telefondaki defterden alınır: Play tüketimi onayladıktan sonra yazılır, bir kez teslim edilir. */
function jetonTeslimAl() {
  var n = 0;
  try { if (YEREL && typeof YEREL.jetonTeslim === 'function') n = sinirla(+YEREL.jetonTeslim() || 0, 0, 1e7) | 0; } catch (e) { n = 0; }
  if (n > 0) jetonEkle(n);
  return n;
}
function jetonBekle(ms) {
  return new Promise(function (coz) {
    var bas = Date.now(), top = 0;
    (function dene() {
      top += jetonTeslimAl();
      if (top > 0 || Date.now() - bas > ms) { coz(top); return; }
      setTimeout(dene, 500);
    })();
  });
}
function ozKalan(oz) { return S.pro || !UCRETLI[oz] ? Infinity : jeton(); }
function ozIzin(oz) {
  if (S.pro || !UCRETLI[oz] || jeton() >= UCRETLI[oz]) return true;
  magazaSayfasi(oz); return false;
}
function ozKullan(oz) {
  if (S.pro || !UCRETLI[oz]) return;
  LS.yaz('jeton', Math.max(0, jeton() - UCRETLI[oz]));
  jetonHapGuncelle();
}
function ozHakYazi(oz) {
  if (S.pro || !UCRETLI[oz]) return null;
  return h('p', { class: 'hak', text: t('jetonBilgi', UCRETLI[oz], jeton()) });
}
function jetonHapGuncelle() { var e = $('#jetonHap span'); if (e) e.textContent = S.pro ? t('rozet') : t('jetonSay', jeton()); }

/* ---------- Üst bar ve alt menü ---------- */
function ustBar() {
  return h('header', { class: 'g-ust' },
    h('div', { class: 'g-marka' }, h('img', { class: 'g-logo', src: LOGO_ROZET, alt: '' }),
      h('div', null, h('h1', { text: 'Kombinle' }), h('span', { text: t('altBaslik') }))),
    h('div', { class: 'g-ust-sag' },
      h('button', { class: 'g-jeton', id: 'jetonHap', 'aria-label': t('magazaBaslik'), on: { click: function () { magazaSayfasi(); } } },
        ikon('zap', 'k dolu'), h('span', { text: S.pro ? t('rozet') : t('jetonSay', jeton()) })),
      h('button', { class: 'ikon-btn', 'aria-label': t('ayarlar'), on: { click: ayarlarSayfasi } }, ikon('ayar'))));
}
function altMenuCiz() {
  var ic = temizle($('#altMenu .ic'));
  [['bugun', 'isilti', 'sBugun'], ['dolap', 'ust', 'sDolap'], ['kesfet', 'pusula', 'sKesfet']].forEach(function (x) {
    ic.appendChild(h('button', {
      'aria-current': S.sekme === x[0] ? 'page' : null,
      on: { click: function () { if (S.sekme !== x[0]) { S.sekme = x[0]; ciz(); window.scrollTo(0, 0); } } }
    }, ikon(x[1]), t(x[2])));
  });
}

/* ---------- Günün kombini ---------- */
function bugunEkrani() {
  var bol = h('section', { class: 'g-bolum' });
  bol.appendChild(havaKarti());
  if (!S.parcalar.length) { bol.appendChild(bosDolapKarti()); bol.appendChild(araclarBolumu()); return bol; }
  var pk = planKarti(); if (pk) bol.appendChild(pk);
  bol.appendChild(istekKarti());
  var sonucAlani = h('div', { id: 'sonucAlani' });
  bol.appendChild(sonucAlani);
  if (S.sonuc) sonucCiz(sonucAlani);
  bol.appendChild(araclarBolumu());
  return bol;
}
function hissetSozu(o) {
  var his = o.kisisel, s;
  s = his < 5 ? t('hsSoguk') : his < 13 ? t('hsSerin') : his < 22 ? t('hsIlik') : his < 28 ? t('hsSicak') : t('hsCokSicak');
  var r = o.ruzgar >= 8.5 ? t('hsRuzgarli') : o.ruzgar >= 4 ? t('hsHafifRuzgar') : t('hsRuzgarsiz');
  return s + ' & ' + r;
}
function havaKarti() {
  var k = h('div', { class: 'g-hava', id: 'havaKarti' });
  var hv = S.hava;
  var pill = h('span', { class: 'g-hava-pill', text: S.gun === 1 ? t('yarinHava') : t('bugunHava') });
  if (hv.durum === 'yukleniyor' || hv.durum === 'bos') {
    k.appendChild(h('div', null, pill, h('h3', { text: t('havaYukleniyor') }), h('p', { text: t('konumAraniyor') })));
    return k;
  }
  if (hv.durum === 'konumYok' || (hv.durum === 'hata' && !S.elleHava)) {
    var konumsuz = hv.durum === 'konumYok';
    k.appendChild(h('div', null, pill,
      h('h3', { text: konumsuz ? (hv.kapali ? t('konumKapaliBaslik') : t('konumBaslik')) : t('havaHataBaslik') }),
      h('p', { text: konumsuz ? (hv.kapali ? t('konumKapaliMetin') : t('konumMetin')) : t('havaHataMetin') })));
    var dg = h('div', { class: 'g-hava-dugme' });
    if (konumsuz && hv.kapali && YEREL && YEREL.konumAyarlari) dg.appendChild(h('button', { on: { click: function () { YEREL.konumAyarlari(); } } }, ikon('konum', 'k'), t('konumAc')));
    else dg.appendChild(h('button', { on: { click: function () { A.konum = null; ayarKaydet(); havaYukle(true); } } }, ikon(konumsuz ? 'konum' : 'yenile', 'k'), konumsuz ? t('konumKullan') : t('tekrarDene')));
    dg.appendChild(h('button', { on: { click: sehirSec }, text: t('sehirSec') }));
    k.appendChild(dg);
    k.appendChild(elleHavaSecici());
    return k;
  }
  var o = aktifHava();
  if (!o) { k.appendChild(elleHavaSecici()); return k; }
  var yer = o.elle ? t('elleSecildi') : (S.hava.yer && S.hava.yer.ad) || t('konumun');
  var derece = Math.round(o.elle ? o.his : (S.gun === 0 ? o.simdi : o.max));
  k.appendChild(h('div', { class: 'g-hava-ust' },
    h('div', { style: { 'min-width': '0' } }, pill,
      h('h3', { text: derece + '°C ' + havaDurumMetni(o) }),
      h('button', { class: 'g-hava-yer', on: { click: sehirSec }, 'aria-label': t('sehirSec') }, yer + ' • ' + hissetSozu(o))),
    h('div', { class: 'g-hava-ikon' }, ikon(havaIkonu(o.sembol)))));
  var alt = h('div', { class: 'g-hava-alt' });
  if (!o.elle) {
    alt.appendChild(h('span', { text: t('enDusukYuksekKisa', Math.round(o.min), Math.round(o.max)) + (o.yagmur ? ', ' + t('yagmurBekleniyor') : '') }));
    var seg = h('div', { class: 'g-gun' });
    [[0, 'bugun'], [1, 'yarin']].forEach(function (g) {
      seg.appendChild(h('button', { 'aria-pressed': S.gun === g[0] ? 'true' : 'false', text: t(g[1]), on: { click: function () { if (S.gun !== g[0]) { S.gun = g[0]; S.sonuc = null; ciz(); } } } }));
    });
    alt.appendChild(seg);
  } else {
    alt.appendChild(h('button', { class: 'g-hava-link', on: { click: function () { S.elleHava = null; havaYukle(true); } }, text: t('havayiYenile') }));
  }
  k.appendChild(alt);
  if (o.elle) k.appendChild(elleHavaSecici());
  if (!o.elle) k.appendChild(h('span', { class: 'g-kaynak', text: (o.eski ? t('eskiVeri') + ' ' : '') + t('kaynakMet') }));
  return k;
}
/* Akıllı seçim: yazılan/söylenen plan bir ortam anlatıyorsa (barınak, düğün…) o ortam seçilir.
   Kullanıcı yazdıktan sonra bir düğmeye basarsa onun seçimi geçerlidir. */
function akilliOrtam() {
  S.ortamTik = false;
  var m = '';
  try { m = cumleCoz(S.istek || '', '').metindenOrtam || ''; } catch (e) { m = ''; }
  if (!m || !ORTAMLAR[m]) {
    /* metin artık bir ortam anlatmıyorsa otomatik seçim geri alınır */
    if (S.ortamOto && S.ortamSecili === S.ortamOto) m = S.ortamOnce || 'is'; else return;
    S.ortamOto = '';
  } else {
    if (!S.ortamOto) S.ortamOnce = S.ortamSecili;
    S.ortamOto = m;
  }
  S.ortamSecili = m;
  $$('.g-ortam button, .g-diger button').forEach(function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-ortam') === m ? 'true' : 'false'); });
}
var GUNLUK_ORTAMLAR = [['is', 'gOfis'], ['gunluk', 'gKahve'], ['davet', 'gDavet'], ['spor', 'gSpor']];
function istekKarti() {
  if (S.ortamSecili === undefined || S.ortamSecili === null) S.ortamSecili = 'is';
  if (S.tarzMod === undefined) S.tarzMod = 'oto';
  var kart = h('div', { class: 'g-kart' });
  kart.appendChild(h('div', { class: 'g-kart-bas' },
    h('h3', null, ikon('pusula', 'k vurgu'), t('istekBaslik')), h('span', { class: 'g-rozet', text: t('akilliSecim') })));
  var izgara = h('div', { class: 'g-ortam' });
  var digerler = h('div', { class: 'cipler g-diger' });
  var sec = function (id, b) {
    S.ortamSecili = id; S.ortamTik = true; S.ortamOto = '';
    $$('.g-ortam button, .g-diger button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
  };
  GUNLUK_ORTAMLAR.forEach(function (x) {
    var b = h('button', { 'data-ortam': x[0], 'aria-pressed': S.ortamSecili === x[0] ? 'true' : 'false', text: t(x[1]) });
    b.addEventListener('click', function () { sec(x[0], b); });
    izgara.appendChild(b);
  });
  ['randevu', 'pratik', 'doga', 'seyahat', 'okul', 'plaj', 'taziye'].forEach(function (id) {
    var b = h('button', { class: 'cip kucuk', 'data-ortam': id, 'aria-pressed': S.ortamSecili === id ? 'true' : 'false', text: ortamAd(id) });
    b.addEventListener('click', function () { sec(id, b); });
    digerler.appendChild(b);
  });
  kart.appendChild(izgara);
  kart.appendChild(digerler);
  var tarz = h('select', { id: 'tarzSec', 'aria-label': t('tarzMod'), on: { change: function (e) { S.tarzMod = e.target.value; } } });
  [['oto', 'tmOto'], ['sik', 'tmSik'], ['rahat', 'tmRahat'], ['minimal', 'tmMinimal'], ['renkli', 'tmRenkli']].forEach(function (x) {
    var op = h('option', { value: x[0], text: t(x[1]) }); if (S.tarzMod === x[0]) op.selected = true; tarz.appendChild(op);
  });
  kart.appendChild(h('label', { class: 'g-etiket', text: t('tarzMod') }));
  kart.appendChild(tarz);
  var alan = h('input', { class: 'g-girdi', id: 'istek', maxlength: '300', placeholder: t('detayYer'), 'aria-label': t('istekEtiket'), on: { input: function (e) { S.istek = kirp(e.target.value, 300); akilliOrtam(); } } });
  alan.value = S.istek;
  var mik = h('button', { class: 'mik', id: 'mikBtn', 'aria-label': t('sesleSoyle'), on: { click: function () { sesliDinle(alan, mik); } } }, ikon('mik', 'k'));
  kart.appendChild(h('label', { class: 'g-etiket', text: t('detayEtiket') }));
  kart.appendChild(h('div', { class: 'g-girdi-kap' }, alan, mik));
  kart.appendChild(h('button', { class: 'g-olustur', id: 'onerBtn', on: { click: kombinIste } }, ikon('isilti', 'k vurgu'), t('kombinOner')));
  if (!S.pro && S.parcalar.some(function (p) { return !p.ornek; })) kart.appendChild(h('p', { class: 'hak', text: t('jetonBilgi', 1, jeton()) }));
  return kart;
}
function sonucCiz(alan) {
  var s = S.sonuc, k = s.liste[S.sonucNo];
  if (!k) return;
  var kart = h('div', { class: 'g-kart g-sonuc' });
  kart.appendChild(h('div', { class: 'g-sonuc-bas' },
    h('div', null, h('h4', { text: t('onerimiz') }),
      h('p', { text: ortamAd(s.c.oid) + ' • ' + t(TARZ_ETK[s.c.tarzMod] || 'tmOto') })),
    h('span', { class: 'g-uyum', text: t('uyumlu', uyumPuani(k, s.c)) })));
  kart.appendChild(h('div', { class: 'g-ipucu' },
    h('div', null, ikon('ampul', 'k'), t('stilistIpucu')), h('p', { text: stilistIpucu(k, s.c) })));
  var izgara = h('div', { class: 'g-parcalar' });
  kombinParcalari(k).forEach(function (p) {
    izgara.appendChild(h('button', { class: 'g-parca' + (p.kesik ? ' kesik' : ''), 'aria-label': parcaAd(p), on: { click: function () { parcaDuzenle(p, null); } } },
      resimEl(p.id, false, null, parcaAd(p)), h('b', { text: p.ad || turAd(p.tur) }), h('span', { text: renkAd(p.renk) })));
  });
  kart.appendChild(izgara);
  var anl = h('div', { class: 'anladim' });
  var pc = s.cumle.pencere;
  if (pc.bas !== 8 || pc.son !== 21) anl.appendChild(h('span', { class: 'etiket' }, ikon('takvim'), (pc.bas < 10 ? '0' : '') + pc.bas + ':00–' + (pc.son >= 24 ? '24' : pc.son) + ':00'));
  s.cumle.renkTercih.slice(0, 2).forEach(function (r) { if (RENK[r]) anl.appendChild(h('span', { class: 'etiket' }, h('i', { style: { width: '10px', height: '10px', 'border-radius': '50%', background: RENK[r].hex, display: 'inline-block' } }), renkAd(r))); });
  s.cumle.turKac.slice(0, 3).forEach(function (r) { anl.appendChild(h('span', { class: 'etiket' }, ikon('kapat', 'k'), turAd(r))); });
  if (s.c.tesettur) anl.appendChild(h('span', { class: 'etiket' }, ikon('esarp'), t('tesetturKisa')));
  if (anl.childNodes.length) kart.appendChild(anl);
  var neden = h('details', { class: 'g-neden' }, h('summary', { text: t('nedenBu') }));
  var ul = h('ul', { class: 'nedenler' });
  k.nedenler.forEach(function (n) { ul.appendChild(h('li', null, ikon(n.i, 'k'), h('span', { text: n.m }))); });
  neden.appendChild(ul);
  kart.appendChild(neden);
  var kayit = S.kayitli[S.sonucNo];
  kart.appendChild(h('div', { class: 'g-eylem' },
    h('button', { class: 'g-btn-ana', disabled: kayit && kayit.giyildi ? true : null, on: { click: function () { kombinKaydet(k, true); } } }, ikon('tik', 'k'), kayit && kayit.giyildi ? t('kaydedildi') : t('bunuGiy')),
    s.liste.length > 1 ? h('button', { class: 'g-btn-ikon', 'aria-label': t('baskaOner'), on: { click: function () { S.sonucNo = (S.sonucNo + 1) % s.liste.length; if (S.sonucNo === 0) tost(t('hepsiniGordun')); ciz(); var a = $('#sonucAlani'); if (a) a.scrollIntoView({ block: 'start' }); } } }, ikon('yenile', 'k')) : null,
    h('button', { class: 'g-btn-ikon', 'aria-label': t('favori'), 'aria-pressed': kayit && kayit.fav ? 'true' : 'false', on: { click: function () { kombinKaydet(k, false); } } }, ikon('kalp', 'k'))));
  alan.appendChild(kart);
}
function araclarBolumu() {
  var kutu = function (ik, baslik, alt, oz, fn) {
    return h('button', { class: 'g-arac', on: { click: fn } }, h('span', { class: 'g-arac-ikon' }, ikon(ik)), h('b', { text: baslik }),
      h('small', { text: alt + (UCRETLI[oz] && !S.pro ? ' • ' + t('birJeton') : '') }));
  };
  return h('section', null,
    h('h2', { class: 'g-baslik2', text: t('dahaFazla') }),
    h('div', { class: 'g-araclar' },
      kutu('kalp', t('sKombin'), t('kombinlerimKisa'), '', function () { S.sekme = 'kombin'; ciz(); window.scrollTo(0, 0); }),
      kutu('aks', t('bavulBaslik'), t('bavulAlt'), 'bavul', bavulAc),
      kutu('aski', t('kurBaslik'), t('kurAlt'), 'kur', function () { kombinKur(null); }),
      kutu('termometre', t('istatistikBaslik'), t('istatistikAlt'), 'istatistik', istatistikSayfasi)));
}

/* ---------- Gardırop ---------- */
function dolapEkrani() {
  var bol = h('section', { class: 'g-bolum' });
  bol.appendChild(h('div', { class: 'g-dolap-bas' },
    h('div', null, h('h2', { text: t('dolabim') }), h('p', { text: t('toplamParca', S.parcalar.length) })),
    h('button', { class: 'g-ekle', on: { click: ekleMenusu } }, ikon('arti', 'k'), t('kiyafetEkle'))));
  if (!S.parcalar.length) { bol.appendChild(bosDolapKarti()); return bol; }
  var hap = h('div', { class: 'g-haplar' });
  var say = {}; S.parcalar.forEach(function (p) { var g = TUR[p.tur] ? TUR[p.tur].g : ''; say[g] = (say[g] || 0) + 1; });
  [{ id: 'hepsi' }].concat(GRUPLAR).forEach(function (g) {
    if (g.id !== 'hepsi' && !say[g.id]) return;
    hap.appendChild(h('button', { 'aria-pressed': S.filtre === g.id ? 'true' : 'false', text: g.id === 'hepsi' ? t('tumu') : grupAd(g.id), on: { click: function () { S.filtre = g.id; ciz(); } } }));
  });
  bol.appendChild(hap);
  var ara = h('input', { class: 'g-girdi', type: 'search', placeholder: t('dolaptaAra'), 'aria-label': t('dolaptaAra'), maxlength: '40', on: { input: function (e) { S.ara = kirp(e.target.value, 40); izgaraDoldur(izgara); } } });
  ara.value = S.ara;
  var sira = h('select', { class: 'g-sira', 'aria-label': t('sirala'), on: { change: function (e) { S.sira = e.target.value; izgaraDoldur(izgara); } } });
  [['yeni', 'siraYeni'], ['cok', 'siraCok'], ['az', 'siraAz'], ['renk', 'siraRenk']].forEach(function (x) { var o = h('option', { value: x[0], text: t(x[1]) }); if ((S.sira || 'yeni') === x[0]) o.selected = true; sira.appendChild(o); });
  bol.appendChild(h('div', { class: 'g-ara-satir' }, ara, sira));
  if (S.parcalar.some(function (p) { return p.ornek; })) {
    bol.appendChild(h('div', { class: 'g-not' }, h('span', { text: t('ornekVar') }), h('button', { on: { click: ornekleriSil }, text: t('ornekleriKaldir') })));
  }
  var izgara = h('div', { class: 'g-izgara' });
  izgaraDoldur(izgara);
  bol.appendChild(izgara);
  return bol;
}
function izgaraDoldur(izgara) {
  temizle(izgara);
  var q = katla(S.ara.toLocaleLowerCase('tr'));
  var liste = S.parcalar.filter(function (p) {
    if (!TUR[p.tur]) return false;
    if (S.filtre !== 'hepsi' && TUR[p.tur].g !== S.filtre) return false;
    if (!q) return true;
    return katla((parcaAd(p) + ' ' + turAd(p.tur) + ' ' + renkAd(p.renk) + ' ' + (p.marka || '')).toLocaleLowerCase('tr')).indexOf(q) >= 0;
  }).sort(function (a, b) {
    if (S.sira === 'cok') return (b.giy || 0) - (a.giy || 0);
    if (S.sira === 'az') return (a.giy || 0) - (b.giy || 0) || (a.son || 0) - (b.son || 0);
    if (S.sira === 'renk') return RENKLER.findIndex(function (r) { return r[0] === a.renk; }) - RENKLER.findIndex(function (r) { return r[0] === b.renk; });
    return (b.eklendi || 0) - (a.eklendi || 0);
  });
  if (!liste.length) { izgara.appendChild(h('p', { class: 'alt-yazi', style: { 'grid-column': '1/-1' }, text: t('bulunamadi') })); return; }
  liste.forEach(function (p) {
    var mv = p.mevsim ? MEVSIMLER.filter(function (m) { return p.mevsim.indexOf(m[0]) >= 0; }).map(function (m) { return A.dil === 'en' ? m[2] : m[1]; }).join(', ') : t('dortMevsim');
    izgara.appendChild(h('button', { class: 'oge g-giysi' + (p.kesik ? ' kesik' : '') + (p.dinlen ? ' dinlen' : ''), 'aria-label': parcaAd(p), on: { click: function () { parcaDuzenle(p, null); } } },
      h('span', { class: 'foto' }, resimEl(p.id, false, null, '')),
      p.ornek ? h('span', { class: 'ornek', text: t('ornek') }) : null,
      h('b', { text: p.ad || parcaAd(p) }),
      h('small', { text: renkAd(p.renk) + ' • ' + (p.dinlen ? t('dinlende') : mv) })));
  });
}
function ekleMenusu() {
  var s = sayfaAc({
    baslik: t('yeniKiyafetEkle'),
    icerik: h('div', null,
      h('p', { class: 'alt-yazi', text: t('ekleIpucu') }),
      h('div', { class: 'ayar-grup', style: { 'margin-top': '14px' } },
        h('button', { class: 'satir', 'data-odak': '1', on: { click: function () { s.kapat(); setTimeout(kameraAc, 300); } } },
          h('span', { class: 'sol' }, ikon('kamera'), h('div', null, t('fotoCek'), h('small', { text: t('fotoCekAlt') }))), ikon('sag', 'k')),
        h('button', { class: 'satir', on: { click: function () { s.kapat(); setTimeout(function () { $('#dosyaSec').click(); }, 300); } } },
          h('span', { class: 'sol' }, ikon('galeri'), h('div', null, t('galeridenSec'), h('small', { text: t('galeridenSecAlt') }))), ikon('sag', 'k')),
        h('button', { class: 'satir', on: { click: function () { s.kapat(); setTimeout(baglantiylaEkle, 300); } } },
          h('span', { class: 'sol' }, ikon('dil'), h('div', null, t('urlEkle'), h('small', { text: t('urlEkleAlt') }))), ikon('sag', 'k'))))
  });
}
/* Görsel bağlantısıyla ekleme (Gemini tasarımındaki form) */
function baglantiylaEkle() {
  var ad = h('input', { class: 'g-girdi', maxlength: '40', placeholder: t('urlAdYer'), 'data-odak': '1' });
  var grup = h('select', { class: 'g-girdi' });
  GRUPLAR.forEach(function (g) { grup.appendChild(h('option', { value: g.id, text: grupAd(g.id) })); });
  var tur = h('select', { class: 'g-girdi' });
  var turDoldur = function () { temizle(tur); TURLER.filter(function (x) { return x.g === grup.value; }).forEach(function (x) { tur.appendChild(h('option', { value: x.id, text: turAd(x.id) })); }); };
  grup.addEventListener('change', turDoldur); turDoldur();
  var mevsim = h('select', { class: 'g-girdi' });
  mevsim.appendChild(h('option', { value: '', text: t('dortMevsim') }));
  MEVSIMLER.forEach(function (m) { mevsim.appendChild(h('option', { value: m[0], text: A.dil === 'en' ? m[2] : m[1] })); });
  var renk = h('select', { class: 'g-girdi' });
  RENKLER.forEach(function (r) { renk.appendChild(h('option', { value: r[0], text: renkAd(r[0]) })); });
  var url = h('input', { class: 'g-girdi', type: 'url', maxlength: '500', placeholder: 'https://...' });
  var etk = function (x, el) { return h('label', { class: 'g-form-alan' }, h('span', { class: 'g-etiket', text: x }), el); };
  var kaydet = h('button', { class: 'btn ana', text: t('gardirobaKaydet'), on: { click: function () {
    var a = kirp(ad.value, 40); if (!a) { ad.focus(); tost(t('adGerekli')); return; }
    var u = String(url.value || '').trim();
    if (u && !/^https:\/\/[^\s"'<>]{4,490}$/i.test(u)) { url.focus(); tost(t('urlGecersiz')); return; }
    var tt = TUR[tur.value] ? tur.value : 'tisort';
    var p = { id: yeniId(), tur: tt, renk: RENK[renk.value] ? renk.value : 'siyah', renk2: '', desen: 0, tarz: TUR[tt].s || '', su: TUR[tt].su ? 1 : 0,
      ad: a, eklendi: Date.now(), giy: 0, son: 0, mevsim: mevsimTemizle(mevsim.value), url: u };
    Depo.parcaYaz(p).then(function () { S.parcalar.push(p); S.sonuc = null; s.kapat(); tost(t('eklendi')); ciz(); }).catch(function (e) { hataYakala(e); tost(t('kayitHata')); });
  } } });
  var s = sayfaAc({ baslik: t('yeniKiyafetEkle'), icerik: h('div', null,
    etk(t('kiyafetAdi'), ad),
    h('div', { class: 'ikili' }, etk(t('kategori'), grup), etk(t('tur'), tur)),
    h('div', { class: 'ikili' }, etk(t('mevsimKisa'), mevsim), etk(t('anaRenk'), renk)),
    etk(t('gorselUrl'), url), h('p', { class: 'alt-yazi', style: { 'font-size': '12px', 'margin-top': '6px' }, text: t('urlNot') })),
    altBar: [h('button', { class: 'btn ikincil', text: t('vazgec'), on: { click: function () { s.kapat(); } } }), kaydet] });
}

/* ---------- Keşfet ---------- */
var ILHAM_SECKI = [
  { id: 'sari-esofman', url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80', tr: 'Sarı eşofman takımı', en: 'Yellow tracksuit',
    renkler: ['sari', 'hardal'], turlar: ['sweat', 'esofman', 'spor'], ortam: 'spor' },
  { id: 'bordo-kaban', url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&auto=format&fit=crop&q=80', tr: 'Bordo kabanla alışveriş', en: 'Burgundy coat for shopping',
    renkler: ['bordo', 'siyah', 'bej'], turlar: ['kaban', 'kazak', 'eldiven', 'canta'], ortam: 'gunluk' }
];
function kesfetEkrani() {
  var bol = h('section', { class: 'g-bolum' });
  bol.appendChild(h('div', { class: 'g-dolap-bas' }, h('div', null, h('h2', { text: t('kesfetBaslik') }), h('p', { text: t('kesfetAlt') })),
    h('button', { class: 'g-ekle', on: { click: ilhamPanosu } }, ikon('galeri', 'k'), t('ilhamBaslik'))));
  var kayitli = LS.al('kesfetFav', []); if (!Array.isArray(kayitli)) kayitli = [];
  ILHAM_SECKI.forEach(function (x) {
    var img = h('img', { class: 'g-akis-resim', src: x.url, alt: A.dil === 'en' ? x.en : x.tr, loading: 'lazy', referrerpolicy: 'no-referrer' });
    img.addEventListener('error', function () { img.replaceWith(h('div', { class: 'g-akis-resim bos', text: t('resimInternet') })); });
    var begen = h('button', { class: 'g-begen', 'aria-pressed': kayitli.indexOf(x.id) >= 0 ? 'true' : 'false' }, ikon('kalp', 'k'), t('kaydet'));
    begen.addEventListener('click', function () {
      var l = LS.al('kesfetFav', []); if (!Array.isArray(l)) l = [];
      var i = l.indexOf(x.id); if (i >= 0) l.splice(i, 1); else l.push(x.id);
      LS.yaz('kesfetFav', l.slice(0, 50)); begen.setAttribute('aria-pressed', i >= 0 ? 'false' : 'true');
      tost(i >= 0 ? t('favCikti') : t('favEklendi'));
    });
    bol.appendChild(h('div', { class: 'g-akis' },
      h('div', { class: 'g-akis-bas' }, h('span', { class: 'g-avatar', text: 'K' }), h('div', null, h('b', { text: t('kombinleStil') }), h('small', { text: t('editorSecki') }))),
      img,
      h('div', { class: 'g-akis-alt' }, h('b', { text: A.dil === 'en' ? x.en : x.tr }), begen),
      h('button', { class: 'g-btn-cizgi', on: { click: function () { seckidenKur(x); } } }, ikon('isilti', 'k'), t('benzeriniKur'), !S.pro ? h('small', { text: ' • ' + t('birJeton') }) : null)));
  });
  bol.appendChild(h('div', { class: 'g-dolap-bas', style: { 'margin-top': '22px' } },
    h('div', null, h('h2', { text: t('ilhamBaslik') }), h('p', { text: t('ilhamKisa') })),
    h('button', { class: 'g-ekle', on: { click: ilhamPanosu } }, ikon('galeri', 'k'), t('ac'))));
  return bol;
}
function seckidenKur(x) {
  if (!S.parcalar.length) { tost(t('azParca')); return; }
  if (!ozIzin('ilham')) return;
  var c = baglamKur(x.ortam, varsayilanHava(), { renkTercih: x.renkler.slice(), turTercih: x.turlar.slice() });
  var sonuc;
  try { sonuc = kombinOner(oneriParcalari(), c); } catch (e) { hataYakala(e); sonuc = { kombinler: [] }; }
  if (!sonuc.kombinler.length) { tost(t('azParca')); return; }
  ozKullan('ilham');
  onerilerSayfasi(A.dil === 'en' ? x.en : x.tr, t('ilhamSonucAlt'), sonuc.kombinler);
}

/* ---------- AI Stil Mağazası (Google Play) ---------- */
function proSayfasi(oz) { magazaSayfasi(oz); }
function magazaSayfasi(oz) {
  var fiyatlar = {};
  var gov = h('div', { class: 'g-magaza' });
  gov.appendChild(h('div', { class: 'g-magaza-bas' }, h('span', { class: 'g-magaza-ikon' }, ikon('zap', 'dolu')),
    h('h3', { text: t('magazaBaslik') }), h('p', { text: oz && UCRETLI[oz] ? t('jetonBitti') : t('magazaAlt') })));
  if (!S.pro) gov.appendChild(h('p', { class: 'g-bakiye', text: t('bakiye', jeton()) }));
  gov.appendChild(h('span', { class: 'g-bolum-etk', text: t('jetonPaketleri') }));
  var fiyatEl = {};
  JETON_PAKETLERI.forEach(function (pk) {
    var btn = h('button', { class: 'g-fiyat' + (pk.populer ? ' altin' : ''), text: pk.fiyat, on: { click: function () { al(pk.id, pk); } } });
    fiyatEl[pk.id] = btn;
    gov.appendChild(h('div', { class: 'g-paket' + (pk.populer ? ' populer' : '') },
      pk.populer ? h('span', { class: 'g-populer', text: t('populer') }) : null,
      h('div', null, h('b', { text: t('jetonPaket', pk.adet) }), h('small', { text: t('jetonPaketAlt', pk.adet) })), btn));
  });
  var proFiyat = h('span', { class: 'g-pro-fiyat', text: '499 ₺' });
  var proBtn = h('button', { class: 'g-pro-btn', text: S.pro ? t('proAktif') : t('proyaGec'), disabled: S.pro ? true : null, on: { click: function () { al(PRO_URUN, null); } } });
  gov.appendChild(h('div', { class: 'g-pro' },
    h('div', { class: 'g-pro-bas' }, h('div', null, h('span', { class: 'g-pro-rozet', text: t('sinirsizPaket') }), h('h4', { text: t('proBaslik') })), proFiyat),
    h('ul', null, ['proM1', 'proM2', 'proM3', 'proM4'].map(function (k) { return h('li', { text: '✓ ' + t(k) }); })),
    proBtn));
  gov.appendChild(h('button', { class: 'g-geri-yukle', text: t('geriYukle'), on: { click: satinAlimlariGeriYukle } }));
  var s = sayfaAc({ baslik: '', icerik: gov });
  if (odemeHazir()) {
    zamanAsimi(odeme().products([PRO_URUN].concat(JETON_PAKETLERI.map(function (p) { return p.id; }))), 10000).then(function (l) {
      (l || []).forEach(function (u) {
        if (!u || typeof u.price !== 'string') return;
        fiyatlar[u.id] = kirp(u.price, 24);
        if (fiyatEl[u.id]) fiyatEl[u.id].textContent = fiyatlar[u.id];
        if (u.id === PRO_URUN) proFiyat.textContent = fiyatlar[u.id];
      });
    }).catch(function () { });
  }
  var alimda = false;
  function al(id, paket) {
    if (alimda || (id === PRO_URUN && S.pro)) return;
    if (!odemeHazir()) { tost(t('odemeYok')); return; }
    alimda = true;
    zamanAsimi(odeme().buy(id), 600000).then(function (ok) {
      if (!ok) { tost(t('odemeTamamlanmadi')); return; }
      if (paket) {
        return jetonBekle(15000).then(function (n) {
          if (n > 0) { tost(t('jetonYuklendi', n)); s.kapat(); ciz(); } else tost(t('odemeTamamlanmadi'));
        });
      }
      var sahip = false; try { sahip = !!odeme().owned(PRO_URUN); } catch (e) { }
      if (sahip) { S.pro = true; A.pro = true; ayarKaydet(); s.kapat(); tost(t('proTesekkur')); ciz(); }
      else tost(t('odemeTamamlanmadi'));
    }).catch(function () { tost(t('odemeTamamlanmadi')); }).then(function () { alimda = false; });
  }
}
