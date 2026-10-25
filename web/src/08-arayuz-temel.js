/* ---------- Uygulama durumu ---------- */
var S = {
  sekme: 'bugun', parcalar: [], hava: { durum: 'bos' }, gun: 0, istek: '', ortamSecili: 'is', tarzMod: 'oto', sonuc: null, sonucNo: 0,
  filtre: 'hepsi', ara: '', mesgul: false, pro: false, kayitli: {}, gecmisFiltre: 'hepsi', elleHava: null, fiyat: ''
};
var URL_ONBELLEK = {};

/* ---------- Bildirim, pencere, sayfa ---------- */
var tostZaman = 0;
function tost(m) {
  var el = $('#tost'); if (!el) return;
  el.textContent = m; el.classList.add('acik');
  clearTimeout(tostZaman); tostZaman = setTimeout(function () { el.classList.remove('acik'); }, 2800);
}
var YIGIN = [];
var geriKilit = 0, bekleyenGecmis = 0;
/* yeni sayfa için geçmiş kaydı; önceki sayfanın kapanışından gelen "geri" henüz işlenmediyse onu bekler
   (yoksa geri, yeni kaydı siler ve sonraki kapanış uygulamadan çıkar) */
function gecmisEkle() {
  if (geriKilit > 0) { bekleyenGecmis++; return; }
  try { history.pushState({ kb: YIGIN.length }, ''); } catch (e) { }
}
function sayfaAc(o) {
  var perde = h('div', { class: 'perde' });
  /* o.tam: tam ekran sayfa (profil, mesajlar, bildirimler): üstten iner, solda geri düğmesi */
  var bas = o.tam
    ? h('div', { class: 'bas' },
      h('button', { class: 'ikon-btn geri-btn', 'aria-label': t('geri'), on: { click: function () { kapat(); } } }, ikon('sol')),
      h('h2', { class: 'baslik', id: 'sb' + YIGIN.length, text: o.baslik || '' }),
      h('span', { class: 'bas-sag' }))
    : h('div', { class: 'bas' },
      h('h2', { class: 'baslik', id: 'sb' + YIGIN.length, text: o.baslik || '' }),
      h('button', { class: 'ikon-btn', 'aria-label': t('kapat'), on: { click: function () { kapat(); } } }, ikon('kapat')));
  var icerik = h('div', { class: 'icerik' }, o.icerik);
  var sayfa = h('div', { class: 'sayfa' + (o.tam ? ' tam' : '') + (o.dolu ? ' dolu' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'sb' + YIGIN.length },
    o.tam ? null : h('div', { class: 'tutamak' }), bas, icerik, o.altBar ? h('div', { class: 'alt-bar' }, o.altBar) : null);
  document.body.appendChild(perde); document.body.appendChild(sayfa);
  var kayit = { sayfa: sayfa, perde: perde, kapaninca: o.kapaninca, kapandi: false, icerik: icerik };
  YIGIN.push(kayit);
  gecmisEkle();
  requestAnimationFrame(function () { perde.classList.add('acik'); sayfa.classList.add('acik'); });
  perde.addEventListener('click', function () { if (!o.kilitli) kapat(); });
  function kapat(gecmistenMi) {
    if (kayit.kapandi) return;
    kayit.kapandi = true;
    var i = YIGIN.indexOf(kayit); if (i >= 0) YIGIN.splice(i, 1);
    perde.classList.remove('acik'); sayfa.classList.remove('acik');
    setTimeout(function () { perde.remove(); sayfa.remove(); }, 280);
    if (!gecmistenMi) { geriKilit++; try { history.back(); } catch (e) { geriKilit--; } }
    if (kayit.kapaninca) try { kayit.kapaninca(); } catch (e) { hataYakala(e); }
  }
  kayit.kapat = kapat;
  setTimeout(function () { var f = sayfa.querySelector('[data-odak]'); if (f) f.focus(); }, 300);
  return kayit;
}
window.addEventListener('popstate', function () {
  if (geriKilit > 0) {
    geriKilit--;
    if (!geriKilit) while (bekleyenGecmis > 0) { bekleyenGecmis--; try { history.pushState({ kb: YIGIN.length }, ''); } catch (e) { } }
    return;
  }
  var ust = YIGIN[YIGIN.length - 1];
  if (ust) ust.kapat(true);
});
function tumSayfalariKapat() { while (YIGIN.length) YIGIN[YIGIN.length - 1].kapat(); }

function onayla(baslik, metin, evet, tehlike) {
  return new Promise(function (coz) {
    var perde = h('div', { class: 'perde', style: { 'z-index': '30' } });
    var bitti = false;
    var son = function (v) {
      if (bitti) return; bitti = true;
      p.classList.remove('acik'); perde.classList.remove('acik');
      setTimeout(function () { p.remove(); perde.remove(); }, 220);
      coz(v);
    };
    var p = h('div', { class: 'pencere', role: 'alertdialog', 'aria-modal': 'true' },
      h('h2', { class: 'baslik', text: baslik }), h('p', { text: metin }),
      h('div', { class: 'dugmeler' },
        h('button', { class: 'btn ikincil', on: { click: function () { son(false); } }, text: t('vazgec') }),
        h('button', { class: 'btn ' + (tehlike ? 'ikincil tehlike' : 'ana'), 'data-odak': '1', on: { click: function () { son(true); } }, text: evet })));
    perde.addEventListener('click', function () { son(false); });
    document.body.appendChild(perde); document.body.appendChild(p);
    requestAnimationFrame(function () { perde.classList.add('acik'); p.classList.add('acik'); var b = p.querySelector('[data-odak]'); if (b) b.focus(); });
  });
}

/* ---------- Ad yardımcıları ---------- */
function turAd(id) { var x = TUR[id]; return x ? (x.ozel ? x.tr : yerelAd('tur', id, x.tr, x.en)) : ''; }
function grupAd(id) { var g = GRUPLAR.filter(function (x) { return x.id === id; })[0]; return g ? yerelAd('grup', id, g.tr, g.en) : ''; }
function renkAd(id) { var r = RENK[id]; return r ? yerelAd('renk', id, r.tr, r.en) : ''; }
function ortamAd(id) { var o = ORTAMLAR[id]; return o ? yerelAd('ortam', id, o.tr, o.en) : ''; }
function parcaAd(p) { return p.ad || (renkAd(p.renk) + ' ' + turAd(p.tur).toLocaleLowerCase(A.dil === 'tr' ? 'tr' : 'en')); }
function tarihYaz(ts) {
  try { return new Date(ts).toLocaleDateString(({ tr: 'tr-TR', ru: 'ru-RU', uz: 'uz-UZ' })[A.dil] || 'en-GB', { day: 'numeric', month: 'long', weekday: 'long' }); }
  catch (e) { return bugunAnahtar(new Date(ts)); }
}

/* ---------- Fotoğraf adresleri ---------- */
function resimUrl(id, buyuk) {
  var anahtar = id + (buyuk ? ':b' : ':k');
  if (URL_ONBELLEK[anahtar]) return Promise.resolve(URL_ONBELLEK[anahtar]);
  return Depo.resimAl(id).then(function (r) {
    if (!r) { var p = S.parcalar.filter(function (x) { return x.id === id; })[0]; return p && typeof p.url === 'string' && /^https:\/\//.test(p.url) ? p.url : ''; }
    var b = buyuk ? r.buyuk : r.kucuk;
    if (!(b instanceof Blob)) return '';
    var u = URL.createObjectURL(b);
    URL_ONBELLEK[anahtar] = u;
    return u;
  }).catch(function () { return ''; });
}
function urlBirak(id) {
  [':b', ':k'].forEach(function (s) { if (URL_ONBELLEK[id + s]) { try { URL.revokeObjectURL(URL_ONBELLEK[id + s]); } catch (e) { } delete URL_ONBELLEK[id + s]; } });
}
function resimEl(id, buyuk, sinif, alt) {
  var img = h('img', { class: sinif || null, alt: alt || '', decoding: 'async', loading: 'lazy', draggable: 'false', referrerpolicy: 'no-referrer' });
  resimUrl(id, buyuk).then(function (u) { if (u) img.src = u; else img.replaceWith(h('div', { class: 'resimsiz' })); });
  return img;
}
