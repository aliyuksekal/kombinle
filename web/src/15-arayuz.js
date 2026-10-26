/* =========================================================
   Kombinle arayüzü (yeni tasarım) — gerçek veriyle
   ========================================================= */

/* ---------- Jeton ekonomisi ----------
   Yeni kullanıcı 15 jetonla başlar; her yapay zekâ işi 1 jeton.
   Fiyatlar ABD doları tabanlıdır (Play Console'da varsayılan fiyat USD; yerel para birimine Play çevirir).
   Türkiye'de elde kalan: fiyat ÷1,20 (KDV) ×0,85 (Google) ×0,85 (20/B stopajı) ≈ %60.
   Maliyet: yapay zekâ işi ~0,009–0,012 $, sohbet ~0,002 $ (hafif model), doğal ses ~0,005 $ (2027'de ~0,011 $).
   Ayrıntı: magaza/FIYATLANDIRMA.md. Uygulamada gösterilen fiyat Play'den gelen yerel fiyattır; aşağıdakiler yalnız yedek.
   PRO aylık abonedir; "sınırsız" adil kullanımla: günde 20 yapay zekâ işi, 40 sohbet mesajı, 20 doğal sesli cevap. */
var BASLANGIC_JETON = 15;
var JETON_PAKETLERI = [
  { id: 'jeton_50', adet: 50, fiyat: '$2.49' },
  { id: 'jeton_150', adet: 150, fiyat: '$6.49', avantaj: 13 },
  { id: 'jeton_400', adet: 400, fiyat: '$12.99', avantaj: 35, populer: true }
];
var PRO_FIYAT = '$14.99', PRO_YIL_FIYAT = '$99.99';   // yıllık: ayda 8,33 $ (aylığa göre %44 indirim)
var PRO_GUNLUK = 20, SOHBET_GUNLUK = { ucretsiz: 5, pro: 40 };
/* doğal (yapay zekâ) sesle okunan cevap: ücretsizde günde 3, PRO'da 20; sonrası telefonun kendi sesiyle */
var SES_GUNLUK = { ucretsiz: 3, pro: 20 };
var UCRETLI = { kombin: 1, arka: 1, bavul: 1, eslestir: 1, ilham: 1, analiz: 1, renk: 1 };
function sayacGunu() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
function gunlukSayac(ad) { var x = LS.al('gs_' + ad, null); return x && x.g === sayacGunu() && sayiMi(x.n) ? x.n : 0; }
function gunlukArtir(ad) { LS.yaz('gs_' + ad, { g: sayacGunu(), n: gunlukSayac(ad) + 1 }); }
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
/* Uygulama sahibi (@admin hesabı) jeton harcamaz, mağazaya yönlendirilmez */
function sahipMi() { try { var hb = hesapBilgi(); return !!(hb && hb.yonetici); } catch (e) { return false; } }
function ozKalan(oz) { return !UCRETLI[oz] || sahipMi() ? Infinity : S.pro ? Math.max(0, PRO_GUNLUK - gunlukSayac('pro')) : jeton(); }
function ozIzin(oz) {
  if (!UCRETLI[oz] || sahipMi()) return true;
  if (S.pro) { if (gunlukSayac('pro') < PRO_GUNLUK) return true; tost(t('proGunlukDoldu', PRO_GUNLUK)); return false; }
  if (jeton() >= UCRETLI[oz]) return true;
  magazaSayfasi(oz); return false;
}
function ozKullan(oz) {
  if (!UCRETLI[oz] || sahipMi()) return;
  if (S.pro) { gunlukArtir('pro'); return; }
  LS.yaz('jeton', Math.max(0, jeton() - UCRETLI[oz]));
  jetonHapGuncelle();
}
function ozHakYazi(oz) {
  if (S.pro || !UCRETLI[oz] || sahipMi()) return null;
  return h('p', { class: 'hak', text: t('jetonBilgi', UCRETLI[oz], jeton()) });
}
/* üst çubuk kalabalıkken (giriş yapılmış: mesaj, zil, profil) jeton hapı kısa yazılır */
function jetonEtiket() {
  var kisa = yzKurulu() && girisli();
  if (sahipMi()) return kisa ? '👑' : t('sahipRozet');
  if (S.pro) return kisa ? 'PRO' : t('rozet');
  return kisa ? String(jeton()) : t('jetonSay', jeton());
}
function jetonHapGuncelle() { var e = $('#jetonHap span'); if (e) e.textContent = jetonEtiket(); }

/* ---------- Üst bar ve alt menü ---------- */
function ustBar() {
  return h('header', { class: 'g-ust' },
    h('div', { class: 'g-marka' }, logoDoldur(h('button', { class: 'g-logo-kap', 'aria-label': t('avBaslik'), on: { click: function () { avatarMenusu(); } } })),
      h('div', null, h('h1', { text: 'Kombinle' }), h('span', { text: t('altBaslik') }))),
    h('div', { class: 'g-ust-sag' },
      yzKurulu() ? (function () {
        var hb = hesapBilgi();
        var b = h('button', { class: 'g-hesap' + (hb ? ' girisli' : ''), 'aria-label': hb ? t('profilim') : t('hGiris'), on: { click: function () {
          if (hesapBilgi()) { benimProfilim(); return; }
          S.ayarAcik = S.ayarAcik || {}; S.ayarAcik.hesap = true; ayarlarSayfasi();
        } } });
        if (hb) avatarDoldur(b, benimAvatar(), hb.ad); else b.appendChild(ikon('kisi', 'k'));
        return hb ? h('span', { class: 'g-ust-ikili' }, dmDugmesi(), zilDugmesi(), b) : b;
      })() : null,
      h('button', { class: 'g-jeton', id: 'jetonHap', 'aria-label': t('magazaBaslik'), on: { click: function () { magazaSayfasi(); } } },
        ikon('zap', 'k dolu'), h('span', { text: jetonEtiket() }))));
}
var SEKMELER = ['bugun', 'dolap', 'kesfet', 'ayarlar'];
function sekmeyeGec(ad) { if (S.sekme !== ad) { S.sekme = ad; if (ad === 'kesfet') olay('kesfet'); ciz(); window.scrollTo(0, 0); } }
function altMenuCiz() {
  var ic = temizle($('#altMenu .ic'));
  [['bugun', 'ev', 'sBugun'], ['dolap', 'gardirop', 'sDolap'], ['ai'], ['kesfet', 'pusula', 'sKesfet'], ['ayarlar', 'ayar', 'ayarlar']].forEach(function (x) {
    if (x[0] === 'ai') {
      ic.appendChild(h('button', { class: 'ai-orta', 'aria-label': t('prensesBaslik'), on: { click: function () { sohbetAc(); } } }, ikon('prenses')));
      return;
    }
    ic.appendChild(h('button', {
      'aria-current': S.sekme === x[0] || (x[0] === 'dolap' && S.sekme === 'kombin') ? 'page' : null, 'data-sekme': x[0],
      on: { click: function () { sekmeyeGec(x[0]); } }
    }, ikon(x[1]), t(x[2])));
  });
}

/* ---------- Günün kombini ---------- */
function bugunEkrani() {
  var bol = h('section', { class: 'g-bolum' });
  bol.appendChild(havaKarti());
  var bg = baslangicKarti(); if (bg) bol.appendChild(bg);
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
  s = his < 8 ? t('hsSoguk') : his < 17 ? t('hsSerin') : his < 24 ? t('hsIlik') : his < 29 ? t('hsSicak') : t('hsCokSicak');
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
      h('div', { class: 'g-derece' }, h('b', { text: derece + '°' }), h('span', { text: havaDurumMetni(o) })),
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
  if (!o.elle && o.eski) k.appendChild(h('span', { class: 'g-kaynak', text: t('eskiVeri') }));
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
  kart.appendChild(kimleSecici());
  kart.appendChild(h('button', { class: 'g-olustur', id: 'onerBtn', on: { click: kombinIste } }, ikon('isilti', 'k vurgu'), t('kombinOner')));
  if (!S.pro && !sahipMi() && S.parcalar.some(function (p) { return !p.ornek; })) kart.appendChild(h('p', { class: 'hak', text: t('jetonBilgi', 1, jeton()) }));
  return kart;
}
function sonucCiz(alan) {
  var s = S.sonuc, k = s.liste[S.sonucNo];
  if (!k) return;
  var kart = h('div', { class: 'g-kart g-sonuc' });
  var yz = k.yz || null;
  kart.appendChild(h('div', { class: 'g-sonuc-bas' },
    h('div', null, h('h4', { text: yz && yz.baslik ? yz.baslik : t('onerimiz') }),
      h('p', null, yz ? h('span', { class: 'g-yz-rozet' }, ikon('isilti', 'k'), t('yzRozet')) : null, ortamAd(s.c.oid) + ' • ' + t(TARZ_ETK[s.c.tarzMod] || 'tmOto'))),
    h('span', { class: 'g-uyum', text: t('uyumlu', yz && yz.uyum ? yz.uyum : uyumPuani(k, s.c)) })));
  var tu = tekrarUyarisi(k, s.tekrar); if (tu) kart.appendChild(tu);
  if (s.havaNotu) kart.appendChild(h('div', { class: 'g-hava-not' }, ikon('semsiye', 'k'), h('div', null, h('b', { text: t('havaNotu') }), h('p', { text: s.havaNotu }))));
  kart.appendChild(h('div', { class: 'g-ipucu' },
    h('div', null, ikon('ampul', 'k'), t('stilistIpucu')), h('p', { text: yz && yz.ipucu ? yz.ipucu : stilistIpucu(k, s.c) })));
  if (yz) kart.appendChild(h('p', { class: 'ai-not', text: t('aiNot') }));
  var parcalar = kombinParcalari(k);
  /* kolaj fotoğrafı: üst, alt, ayakkabı, çanta… tek görselde */
  var bilgi = { alt: ortamAd(s.c.oid) + (s.hv && sayiMi(s.hv.max) ? ' • ' + Math.round(s.hv.max) + '°C' : '') };
  var kolajKap = h('button', { class: 'g-kolaj yukleniyor-kap', 'aria-label': t('kolajBuyut') }, h('span', { class: 'yukleniyor' }));
  kart.appendChild(kolajKap);
  kombinKolaji(k, bilgi).then(function (c) {
    temizle(kolajKap); kolajKap.classList.remove('yukleniyor-kap');
    if (!c) { kolajKap.remove(); return; }
    var src = c.toDataURL('image/jpeg', 0.9);
    kolajKap.appendChild(h('img', { src: src, alt: t('kolajAlt') }));
    kolajKap.addEventListener('click', function () { goruntuleyiciAc(src, t('kolajAlt')); });
  }).catch(function () { kolajKap.remove(); });
  var izgara = h('div', { class: 'g-parcalar' + (parcalar.length > 2 ? ' karosel-ic' : '') });
  parcalar.forEach(function (p) {
    izgara.appendChild(h('button', { class: 'g-parca' + (p.kesik ? ' kesik' : ''), 'aria-label': parcaAd(p), on: { click: function () { parcaDuzenle(p, null); } } },
      resimEl(p.id, false, null, parcaAd(p)), h('b', { text: p.ad || turAd(p.tur) }), h('span', { text: renkAd(p.renk) })));
  });
  kart.appendChild(h('details', { class: 'g-neden g-parca-liste' }, h('summary', { text: t('parcalarSay', parcalar.length) }),
    parcalar.length > 2 ? dikeyKarosel(izgara, Math.ceil(parcalar.length / 2)) : izgara));
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
  kart.appendChild(makyajBolumu(k, s.c));
  var kayit = S.kayitli[S.sonucNo];
  var kayitli = !!(kayit && kayit.fav);
  var ornekMi = parcalar.every(function (p) { return p.ornek; });
  kart.appendChild(h('div', { class: 'g-eylem' },
    h('button', { class: 'g-btn-ana', disabled: kayitli ? true : null, on: { click: function () { kombinGardiroba(k); } } }, ikon(kayitli ? 'tik' : 'arti', 'k'), kayitli ? t('gardiropta') : t('gardirobaEkle')),
    h('button', { class: 'g-btn-ikon', 'aria-label': t('bunuGiy'), 'aria-pressed': kayit && kayit.giyildi ? 'true' : 'false', disabled: kayit && kayit.giyildi ? true : null, on: { click: function () { kombinKaydet(k, true); } } }, ikon('tik', 'k')),
    s.liste.length > 1 ? h('button', { class: 'g-btn-ikon', 'aria-label': t('baskaOner'), on: { click: function () { S.sonucNo = (S.sonucNo + 1) % s.liste.length; if (S.sonucNo === 0) tost(t('hepsiniGordun')); ciz(); var a2 = $('#sonucAlani'); if (a2) a2.scrollIntoView({ block: 'start' }); } } }, ikon('yenile', 'k')) : null));
  /* gardıroba eklenince: paylaşım ve gizlilik ayarı */
  if (kayitli && yzKurulu() && !ornekMi) kart.appendChild(paylasPaneli(k, kayit, bilgi));
  if (s.liste.length > 1 && yzKurulu() && !ornekMi) kart.appendChild(h('button', { class: 'g-btn-cizgi', style: { width: '100%', 'margin-top': '10px' }, on: { click: function () {
    anketOlustur(k, s.liste[(S.sonucNo + 1) % s.liste.length], bilgi);
  } } }, ikon('kisi', 'k'), t('akSor')));
  alan.appendChild(kart);
}
function kombinGardiroba(k) {
  var kayit = S.kayitli[S.sonucNo];
  if (kayit && kayit.fav) return;
  kombinKaydet(k, false);
  tost(t('gardirobaEklendi'));
  if (gecmisAl().filter(function (g) { return g.fav; }).length >= 2) puanIste();
  setTimeout(function () { var p = $('.g-paylas-panel'); if (p) p.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 250);
}
/* Kayıtlı kombinin altındaki paylaşım paneli: gizli / yalnız takipçiler / herkes */
function paylasPaneli(k, kayit, bilgi) {
  var kap = h('div', { class: 'g-paylas-panel' });
  if (kayit.paylasildi) {
    kap.appendChild(h('div', { class: 'g-paylasildi' }, ikon('tik', 'k'), h('span', { text: t('paylasildiDurum', t(kayit.paylasildi === 'gizli' ? 'gorGizli' : kayit.paylasildi === 'takip' ? 'gorTakip' : 'gorHerkes')) })));
    return kap;
  }
  var gor = S.paylasGor || 'herkes';
  var sec = h('div', { class: 'g-gorunurluk' });
  [['gizli', 'kilit', 'gorGizli'], ['takip', 'kisi', 'gorTakip'], ['herkes', 'dunya', 'gorHerkes']].forEach(function (x) {
    sec.appendChild(h('button', { class: 'cip', 'data-gor': x[0], 'aria-pressed': gor === x[0] ? 'true' : 'false', on: { click: function () {
      gor = x[0]; S.paylasGor = gor;
      $$('button', sec).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-gor') === gor ? 'true' : 'false'); });
    } } }, ikon(x[1], 'k'), t(x[2])));
  });
  var not = h('input', { class: 'metin', maxlength: '200', placeholder: t('aciklamaYer'), 'aria-label': t('aciklamaYer') });
  var btn = h('button', { class: 'btn ana', style: { width: '100%' } }, ikon('paylas', 'k'), t('paylas'));
  kap.appendChild(h('div', { class: 'g-paylas-bas' }, ikon('paylas', 'k vurgu'), h('b', { text: t('paylasSoru') })));
  kap.appendChild(h('span', { class: 'etk', text: t('gorunurlukBaslik') }));
  kap.appendChild(sec);
  kap.appendChild(not);
  var onay = null;
  if (LS.al('kuralOnay', false) !== true) {
    onay = h('input', { type: 'checkbox', id: 'panelKuralOnay' });
    kap.appendChild(h('label', { class: 'g-onay', for: 'panelKuralOnay' }, onay, h('span', { text: t('kurallarOnay') })));
  }
  kap.appendChild(btn);
  kap.appendChild(h('p', { class: 'ayar-not', text: t('paylasKuralNot') }));
  var gidiyor = false;
  btn.addEventListener('click', function () {
    if (gidiyor || !girisIste()) return;
    if (onay && !onay.checked) { tost(t('onayGerek')); return; }
    var m = kirp(not.value, 200);
    if (/(https?:\/\/|www\.|\b\d[\d\s().-]{8,}\d\b)/i.test(m)) { tost(t('baglantiYok')); return; }
    if (onay) LS.yaz('kuralOnay', true);
    gidiyor = true; btn.disabled = true;
    kombinKolaji(k, bilgi).then(function (c) {
      if (!c) throw new Error('resim');
      var b64 = tuvaldenB64(c, 440 * 1024);
      if (!b64) throw new Error('resim');
      var etiket = [ortamAd(S.sonuc.cumle.ortam)];
      if (S.sonuc.hv && sayiMi(S.sonuc.hv.max)) etiket.push(Math.round(S.sonuc.hv.max) + '°C');
      return yzIste('/v1/paylas', { resim: b64, takma: (hesapBilgi() || {}).ad || '', aciklama: m, etiketler: etiket.map(function (e) { return kirp(e, 20); }), gorunurluk: gor }, 50000);
    }).then(function () {
      var g = gecmisAl(), x = g.filter(function (y) { return y.id === kayit.id; })[0];
      if (x) { x.paylasildi = gor; gecmisYaz(g); }
      kayit.paylasildi = gor;
      TOPLULUK.yuklendi = false;
      tost(t('paylasildi')); ciz();
    }).catch(function (e) {
      var v = e && e.veri, ms = e && e.message;
      if (ms === 'denetim') {
        var ad2 = { ciplaklik: 'dnCiplaklik', cinsel: 'dnCinsel', cocuk: 'dnCocuk', siddet: 'dnSiddet', nefret: 'dnNefret', kisisel_bilgi: 'dnKisisel', kiyafet_degil: 'dnKiyafet', spam: 'dnSpam' }[v && v.neden];
        tost(t('denetimRed', ad2 ? t(ad2) : ''));
      } else if (ms === 'kota') tost(t('paylasKota'));
      else tost(yzHataMetni(e, t('paylasHata')));
    }).then(function () { gidiyor = false; btn.disabled = false; });
  });
  return kap;
}
/* Yukarı-aşağı kayan karosel: her seferinde bir sıra (2 parça) görünür, kaydırınca yerine oturur */
function dikeyKarosel(ic, sayfa) {
  var gosterge = h('span', { class: 'karosel-sayi', text: '1 / ' + sayfa });
  var noktalar = h('div', { class: 'karosel-nokta' });
  for (var i = 0; i < sayfa; i++) noktalar.appendChild(h('i', { class: i === 0 ? 'acik' : null }));
  var git = function (yon) { ic.scrollBy({ top: yon * ic.clientHeight, behavior: 'smooth' }); };
  var yukari = h('button', { class: 'karosel-ok', 'aria-label': t('yukari'), on: { click: function () { git(-1); } } }, ikon('sag', 'k yukari'));
  var asagi = h('button', { class: 'karosel-ok', 'aria-label': t('asagi'), on: { click: function () { git(1); } } }, ikon('sag', 'k asagi'));
  var guncelle = function () {
    var n = Math.min(sayfa - 1, Math.round(ic.scrollTop / Math.max(1, ic.clientHeight)));
    gosterge.textContent = (n + 1) + ' / ' + sayfa;
    $$('i', noktalar).forEach(function (x, j) { x.className = j === n ? 'acik' : ''; });
    yukari.disabled = n === 0; asagi.disabled = n === sayfa - 1;
  };
  ic.addEventListener('scroll', function () { clearTimeout(ic._z); ic._z = setTimeout(guncelle, 60); }, { passive: true });
  setTimeout(guncelle, 0);
  return h('div', { class: 'karosel' }, ic, h('div', { class: 'karosel-yan' }, yukari, noktalar, gosterge, asagi));
}
function araclarBolumu() {
  var kutu = function (ik, baslik, alt, oz, fn) {
    return h('button', { class: 'g-arac', on: { click: fn } }, h('span', { class: 'g-arac-ikon' }, ikon(ik)), h('b', { text: baslik }),
      h('small', { text: alt + (UCRETLI[oz] && !S.pro && !sahipMi() ? ' • ' + t('birJeton') : '') }));
  };
  return h('section', null,
    h('h2', { class: 'g-baslik2', text: t('dahaFazla') }),
    yzKurulu() ? h('button', { class: 'g-analiz-kart', on: { click: analizSayfasi } },
      h('span', { class: 'g-arac-ikon' }, ikon('grafik')),
      h('div', null, h('b', { text: t('analizBaslik') }), h('small', { text: t('analizAlt') + (!S.pro && !sahipMi() ? ' • ' + t('birJeton') : '') })),
      ikon('sag', 'k')) : null,
    h('div', { class: 'g-araclar' },
      kutu('kalp', t('sKombin'), t('kombinlerimKisa'), '', function () { S.sekme = 'kombin'; ciz(); window.scrollTo(0, 0); }),
      kutu('aks', t('bavulBaslik'), t('bavulAlt'), 'bavul', bavulAc),
      kutu('aski', t('kurBaslik'), t('kurAlt'), 'kur', function () { kombinKur(null); }),
      kutu('termometre', t('istatistikBaslik'), t('istatistikAlt'), 'istatistik', istatistikSayfasi),
      yzKurulu() ? kutu('palet', t('renkBaslik'), renkAnalizi() ? t('mv_' + renkAnalizi().mevsim) + ' • ' + t('renkAlt') : t('renkAlt'), 'renk', renkAnaliziSayfasi) : null,
      kutu('aks', t('alsamBaslik'), t('alsamAlt'), '', alsamMiSayfasi)));
}

/* ---------- Gardırop ---------- */
function dolapEkrani() {
  var bol = h('section', { class: 'g-bolum' });
  bol.appendChild(h('div', { class: 'g-dolap-bas' },
    h('div', null, h('h2', { text: t('dolabim') }), h('p', { text: t('toplamParca', S.parcalar.length) })),
    h('button', { class: 'g-ekle', on: { click: ekleMenusu } }, ikon('arti', 'k'), t('kiyafetEkle'))));
  /* gardıroba eklenen kombinler */
  var kayitliSay = gecmisAl().filter(function (g) { return g.fav; }).length;
  bol.appendChild(h('button', { class: 'g-kombin-sira', on: { click: function () { S.gecmisFiltre = 'fav'; S.sekme = 'kombin'; ciz(); window.scrollTo(0, 0); } } },
    h('span', { class: 'g-arac-ikon' }, ikon('kalp')), h('div', null, h('b', { text: t('kayitliKombinler') }), h('small', { text: t('kayitliKombinSay', kayitliSay) })), ikon('sag', 'k')));
  var gercekSay = S.parcalar.filter(function (p) { return !p.ornek; }).length;
  if (gercekSay < 15) bol.appendChild(hizliDoldurKarti(gercekSay));
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
    var mv = p.mevsim ? MEVSIMLER.filter(function (m) { return p.mevsim.indexOf(m[0]) >= 0; }).map(function (m) { return yerelAd('mevsim', m[0], m[1], m[2]); }).join(', ') : t('dortMevsim');
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
        h('button', { class: 'satir', on: { click: function () { s.kapat(); setTimeout(siparisSec, 300); } } },
          h('span', { class: 'sol' }, ikon('marka'), h('div', null, t('urlSiparis'), h('small', { text: t('urlSiparisAlt') }))), ikon('sag', 'k')),
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
  var turDoldur = function () { temizle(tur); TURLER.filter(function (x) { return x.g === grup.value && turGoster(x); }).forEach(function (x) { tur.appendChild(h('option', { value: x.id, text: turAd(x.id) })); }); };
  grup.addEventListener('change', turDoldur); turDoldur();
  var mevsim = h('select', { class: 'g-girdi' });
  mevsim.appendChild(h('option', { value: '', text: t('dortMevsim') }));
  MEVSIMLER.forEach(function (m) { mevsim.appendChild(h('option', { value: m[0], text: yerelAd('mevsim', m[0], m[1], m[2]) })); });
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
  if (!S.kesfetSekme) S.kesfetSekme = yzKurulu() ? 'topluluk' : 'secki';
  var seg = h('div', { class: 'seg g-kesfet-seg' });
  [['topluluk', 'sTopluluk'], ['secki', 'sSecki']].forEach(function (x) {
    seg.appendChild(h('button', { 'aria-pressed': S.kesfetSekme === x[0] ? 'true' : 'false', text: t(x[1]), on: { click: function () { if (S.kesfetSekme !== x[0]) { S.kesfetSekme = x[0]; ciz(); } } } }));
  });
  if (S.kesfetSekme === 'topluluk') {
    bol.appendChild(h('div', { class: 'g-dolap-bas' }, h('div', null, h('h2', { text: t('sTopluluk') }), h('p', { text: t('kural1') })),
      h('button', { class: 'g-ekle', 'aria-label': t('yeniPaylasim'), on: { click: yeniPaylasim } }, ikon('arti', 'k'), t('paylas'))));
    bol.appendChild(seg);
    bol.appendChild(toplulukBolumu());
    return bol;
  }
  bol.appendChild(h('div', { class: 'g-dolap-bas' }, h('div', null, h('h2', { text: t('kesfetBaslik') }), h('p', { text: t('kesfetAlt') }))));
  bol.appendChild(seg);
  var kayitli = LS.al('kesfetFav', []); if (!Array.isArray(kayitli)) kayitli = [];
  /* Editör seçkisi: editörlerimiz seçki yayınladığında burada görünecek */
  bol.appendChild(h('div', { class: 'g-bos-not secki-bos' }, h('span', { class: 'g-analiz-ikon' }, ikon('isilti')), h('b', { text: t('seckiBosBaslik') }), h('span', { text: t('seckiBosMetin') })));
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
  onerilerSayfasi(A.dil !== 'tr' ? x.en : x.tr, t('ilhamSonucAlt'), sonuc.kombinler);
}

/* ---------- AI Stil Mağazası (Google Play) ---------- */
function proSayfasi(oz) { magazaSayfasi(oz); }
function magazaSayfasi(oz) {
  var gov = h('div', { class: 'g-magaza' });
  gov.appendChild(h('div', { class: 'g-magaza-bas' }, h('span', { class: 'g-magaza-ikon' }, ikon('zap', 'dolu')),
    h('h3', { text: t('magazaBaslik') }), h('p', { text: oz && UCRETLI[oz] ? t('jetonBitti') : t('magazaAlt') })));
  if (!S.pro) gov.appendChild(h('p', { class: 'g-bakiye', text: t('bakiye', jeton()) }));
  /* PRO: yıllık (en avantajlı, varsayılan) ya da aylık */
  var plan = 'yil', fiyatlar = {}; fiyatlar[PRO_URUN] = PRO_FIYAT; fiyatlar[PRO_URUN_YIL] = PRO_YIL_FIYAT;
  var proFiyat = h('span', { class: 'g-pro-fiyat' });
  var proBaslik = h('h4');
  var proAlt = h('p', { class: 'g-pro-yil-alt' });
  var planSeg = h('div', { class: 'seg g-pro-plan', role: 'group' });
  function planCiz() {
    temizle(proFiyat); temizle(planSeg); temizle(proBaslik);
    proBaslik.appendChild(document.createTextNode(plan === 'yil' ? t('proYillikBaslik') : t('proAylikBaslik')));
    proFiyat.appendChild(document.createTextNode(fiyatlar[plan === 'yil' ? PRO_URUN_YIL : PRO_URUN]));
    proFiyat.appendChild(h('small', { text: plan === 'yil' ? t('yilBasi') : t('ayBasi') }));
    proAlt.textContent = plan === 'yil' ? t('proYilAlt') : '';
    proAlt.hidden = plan !== 'yil';
    [['yil', t('planYillik')], ['ay', t('planAylik')]].forEach(function (x) {
      planSeg.appendChild(h('button', { 'aria-pressed': plan === x[0] ? 'true' : 'false', text: x[1], on: { click: function () { plan = x[0]; planCiz(); } } }));
    });
  }
  planCiz();
  var proBtn = S.pro
    ? h('button', { class: 'g-pro-btn ikincil', on: { click: function () { try { if (YEREL && YEREL.aboneligiYonet) YEREL.aboneligiYonet(); } catch (e) { } } } }, t('aboneligiYonet'))
    : h('button', { class: 'g-pro-btn', on: { click: function () { al(plan === 'yil' ? PRO_URUN_YIL : PRO_URUN, null); } } }, t('aboneBaslat'));
  gov.appendChild(h('div', { class: 'g-pro' },
    S.pro ? null : planSeg,
    h('div', { class: 'g-pro-bas' }, h('div', null, h('span', { class: 'g-pro-rozet', text: S.pro ? t('proAktif') : t('enAvantajli') }), proBaslik), proFiyat),
    S.pro ? null : proAlt,
    h('p', { class: 'g-pro-kiyas', text: t('proKiyas', PRO_GUNLUK * 30) }),
    h('ul', null, [t('proS1', PRO_GUNLUK), t('proS2', SOHBET_GUNLUK.pro), t('proS7', SES_GUNLUK.pro), t('proS8', PRO_ONECIKAR_AYLIK), t('proS3'), t('proS5'), t('proS6')].map(function (k) { return h('li', { text: '✓ ' + k }); })),
    proBtn,
    h('p', { class: 'g-pro-not', text: t('aboneNot') })));
  gov.appendChild(h('span', { class: 'g-bolum-etk', text: t('jetonPaketleri') }));
  var fiyatEl = {};
  JETON_PAKETLERI.forEach(function (pk) {
    var btn = h('button', { class: 'g-fiyat' + (pk.populer ? ' altin' : ''), text: pk.fiyat, on: { click: function () { al(pk.id, pk); } } });
    fiyatEl[pk.id] = btn;
    gov.appendChild(h('div', { class: 'g-paket' + (pk.populer ? ' populer' : '') },
      pk.populer ? h('span', { class: 'g-populer', text: t('populer') }) : null,
      h('div', null, h('b', { text: t('jetonPaket', pk.adet) }), h('small', { text: t('jetonPaketAlt', pk.adet) + (pk.avantaj ? ' • ' + t('avantajYuzde', pk.avantaj) : '') })), btn));
  });
  gov.appendChild(h('button', { class: 'g-geri-yukle', text: t('geriYukle'), on: { click: satinAlimlariGeriYukle } }));
  var s = sayfaAc({ baslik: '', icerik: gov });
  if (odemeHazir()) {
    zamanAsimi(odeme().products([PRO_URUN, PRO_URUN_YIL].concat(JETON_PAKETLERI.map(function (p) { return p.id; }))), 10000).then(function (l) {
      (l || []).forEach(function (u) {
        if (!u || typeof u.price !== 'string') return;
        var f = kirp(u.price, 24);
        if (fiyatEl[u.id]) fiyatEl[u.id].textContent = f;
        if (u.id === PRO_URUN || u.id === PRO_URUN_YIL) { fiyatlar[u.id] = f; planCiz(); }
      });
    }).catch(function () { });
  }
  var alimda = false;
  function al(id, paket) {
    if (alimda || ((id === PRO_URUN || id === PRO_URUN_YIL) && S.pro)) return;
    if (!odemeHazir()) { tost(t('odemeYok')); return; }
    alimda = true;
    zamanAsimi(odeme().buy(id), 600000).then(function (ok) {
      if (!ok) { tost(t('odemeTamamlanmadi')); return; }
      if (paket) {
        return jetonBekle(15000).then(function (n) {
          if (n > 0) { tost(t('jetonYuklendi', n)); s.kapat(); ciz(); } else tost(t('odemeTamamlanmadi'));
        });
      }
      var sahip = proSahibi();
      if (sahip) { S.pro = true; A.pro = true; ayarKaydet(); s.kapat(); tost(t('proTesekkur')); ciz(); }
      else tost(t('odemeTamamlanmadi'));
    }).catch(function () { tost(t('odemeTamamlanmadi')); }).then(function () { alimda = false; });
  }
}
