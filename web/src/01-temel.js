'use strict';
/* =========================================================
   Kombinle — kişisel kombin asistanı (matali)
   Tek dosya, çevrimdışı çalışır. Tüm kod bu kapalı fonksiyonun
   içindedir; dışarıya hiçbir değişken açılmaz.
   ========================================================= */

var SURUM = '1.0.0';
var PRO_URUN = 'kombinle_pro_aylik';
var DESTEK_CAY = 'destek_cay', DESTEK_YEMEK = 'destek_yemek';
var HAVA_ADRES = 'https://api.met.no/weatherapi/locationforecast/2.0/compact';
var GIZLILIK_ADRES = 'https://aliyuksekal.github.io/gizlilik/kombinle-gizlilik.html';

/* ---------- Küçük yardımcılar ---------- */
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
function sinirla(x, a, b) { x = +x; if (!isFinite(x)) x = a; return x < a ? a : x > b ? b : x; }
function sayiMi(x) { return typeof x === 'number' && isFinite(x); }
function kirp(s, n) { s = typeof s === 'string' ? s : ''; s = s.replace(/[\u0000-\u001f\u007f\u2028\u2029]/g, ' ').trim(); return s.length > n ? s.slice(0, n) : s; }
function yeniId() {
  var a = new Uint8Array(9);
  try { crypto.getRandomValues(a); } catch (e) { for (var i = 0; i < 9; i++) a[i] = Math.random() * 256 | 0; }
  return Array.prototype.map.call(a, function (b) { return ('0' + b.toString(36)).slice(-2); }).join('').slice(0, 14);
}
function idGecerli(s) { return typeof s === 'string' && /^[a-z0-9]{6,24}$/.test(s); }
function bugunAnahtar(d) { d = d || new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function bekle(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function rastgele() { try { var a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] / 4294967296; } catch (e) { return Math.random(); } }

/* DOM kurucu: kullanıcı verisi asla HTML olarak yorumlanmaz, hep textContent ile yazılır. */
function h(etiket, ozellik) {
  var el = document.createElement(etiket);
  if (ozellik) {
    for (var k in ozellik) {
      if (!Object.prototype.hasOwnProperty.call(ozellik, k)) continue;
      var v = ozellik[k];
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'on') { for (var o in v) el.addEventListener(o, v[o]); }
      else if (k === 'style') { for (var s in v) el.style.setProperty(s, v[s]); }
      else if (k === 'html') el.innerHTML = v; /* yalnızca koddaki sabit SVG ikonlar için */
      else el.setAttribute(k, v === true ? '' : String(v));
    }
  }
  for (var i = 2; i < arguments.length; i++) ekle(el, arguments[i]);
  return el;
}
function ekle(el, c) {
  if (c === null || c === undefined || c === false) return;
  if (Array.isArray(c)) { c.forEach(function (x) { ekle(el, x); }); return; }
  el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
}
function temizle(el) { while (el && el.firstChild) el.removeChild(el.firstChild); return el; }

/* ---------- İkonlar (sabit SVG) ---------- */
var IK = {
  ev: '<path d="M3 11.5 12 4l9 7.5M5 9.8V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.8"/>',
  gardirop: '<path d="M20.38 3.46 16 2l-4 2-4-2-4.38 1.46A2 2 0 0 0 2 5.46v14.08A1.46 1.46 0 0 0 3.46 21h17.08a1.46 1.46 0 0 0 1.46-1.46V5.46a2 2 0 0 0-1.62-2z"/><path d="M12 4v17"/>',
  prenses: '<path d="M12 6V5c0-1.6 2.2-1.6 2.2-3"/><path d="M4 13c3-2.6 5.6-3.8 8-4.4 2.4.6 5 1.8 8 4.4"/><path d="M9 10.5 12 13l3-2.5c1 2 .8 3.6-.2 5 1.6 2.6 1.8 4.8.4 6.2-1.6 1.6-4.8 1.6-6.4 0-1.4-1.4-1.2-3.6.4-6.2-1-1.4-1.2-3-.2-5z" fill="currentColor" stroke="none"/>',
  gonder: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>',
  hoparlor: '<path d="M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
  sessiz: '<path d="M11 5 6 9H2v6h4l5 4zM22 9l-6 6M16 9l6 6"/>',
  yorum: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
  zil: '<path d="M6 9a6 6 0 1 1 12 0c0 5 2 6.5 2 6.5H4S6 14 6 9z"/><path d="M10 19a2 2 0 0 0 4 0"/>',
  yerimi: '<path d="M6 3h12v18l-6-4.5L6 21z"/>',
  kalem: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  kisi: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  kilit: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  dunya: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  buyut: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
  paylas: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>',
  yukari: '<path d="M7 10v11H3V10zM7 10l4-8c1.7 0 3 1.3 3 3v3h5.5a2 2 0 0 1 2 2.3l-1.4 8a2 2 0 0 1-2 1.7H7"/>',
  asagi: '<path d="M17 14V3h4v11zM17 14l-4 8c-1.7 0-3-1.3-3-3v-3H4.5a2 2 0 0 1-2-2.3l1.4-8a2 2 0 0 1 2-1.7H17"/>',
  nokta: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
  bayrak: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  grafik: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  zap: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  pusula: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  ampul: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
  marka: '<path d="M12 5.2a1.3 1.3 0 1 1 1.3-1.3"/><path d="M12 5.2v.9L7.3 8.3h9.4L12 6.1"/><path d="M9.6 8.4l.4 1.9c-.6 1-.8 2.1-.7 3.2h5.4c.1-1.1-.1-2.2-.7-3.2l.4-1.9"/><path d="M9.3 13.5h5.4l3.2 7.3c-1.7.7-3.7 1-5.9 1s-4.2-.3-5.9-1z"/>',
  aski: '<path d="M12 7a2 2 0 1 1 2-2"/><path d="M12 7v1.5L3.6 15a1.4 1.4 0 0 0 .9 2.5h15a1.4 1.4 0 0 0 .9-2.5L12 8.5"/>',
  gunes: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
  ay: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  bulut: '<path d="M7 18h10.5a4 4 0 0 0 .4-8A6 6 0 0 0 6.3 11 3.5 3.5 0 0 0 7 18z"/>',
  parcali: '<path d="M8 4.5V3M3.8 6.3l-1-1M2.5 10.5H1M12.2 6.3l1-1"/><path d="M5.2 12.2A3.5 3.5 0 1 1 11 8.4"/><path d="M9 20h9a3.5 3.5 0 0 0 .3-7A5 5 0 0 0 8.6 14 3 3 0 0 0 9 20z"/>',
  yagmur: '<path d="M7 15h10.5a4 4 0 0 0 .4-8A6 6 0 0 0 6.3 8 3.5 3.5 0 0 0 7 15z"/><path d="M8 18l-1 2.5M12 18l-1 2.5M16 18l-1 2.5"/>',
  kar: '<path d="M7 14h10.5a4 4 0 0 0 .4-8A6 6 0 0 0 6.3 7 3.5 3.5 0 0 0 7 14z"/><path d="M8 18h.01M12 20h.01M16 18h.01M10 21.5h.01M14 21.5h.01"/>',
  simsek: '<path d="M7 14h10.5a4 4 0 0 0 .4-8A6 6 0 0 0 6.3 7 3.5 3.5 0 0 0 7 14z"/><path d="M12.5 15 10 19h3.5L11 22.5"/>',
  sis: '<path d="M4 9h16M3 13h18M5 17h14"/>',
  ruzgar: '<path d="M3 9h11a3 3 0 1 0-3-3M3 15h15a3 3 0 1 1-3 3M3 12h7"/>',
  semsiye: '<path d="M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9zM12 12v7a2 2 0 0 0 4 0"/>',
  konum: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  mik: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
  kamera: '<path d="M4 8h3l1.5-2.5h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>',
  galeri: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="9.5" r="1.8"/><path d="m3.5 17.5 5-5 4 4 2.5-2.5 5.5 5"/>',
  arti: '<path d="M12 5v14M5 12h14"/>',
  isilti: '<path d="M12 3.5 13.8 9 19.5 10.8 13.8 12.6 12 18.2 10.2 12.6 4.5 10.8 10.2 9z"/><path d="M19 3v3M17.5 4.5h3M5 17.5v3M3.5 19h3"/>',
  kalp: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20z"/>',
  tik: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  kapat: '<path d="M6 6l12 12M18 6 6 18"/>',
  ayar: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
  cop: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>',
  yenile: '<path d="M20 11a8 8 0 0 0-14.5-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.5 4.5L20 16M20 20v-4h-4"/>',
  sag: '<path d="m9 6 6 6-6 6"/>',
  sol: '<path d="m15 6-6 6 6 6"/>',
  tac: '<path d="M4 18h16M4.5 15 3 7l5 3.5L12 5l4 5.5L21 7l-1.5 8z"/>',
  fincan: '<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 10.5h1.5a2.5 2.5 0 0 1 0 5H17M8 3.5c0 1.2 1 1.3 1 2.5M12 3.5c0 1.2 1 1.3 1 2.5"/>',
  ara: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  takvim: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  indir: '<path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M4.5 19.5h15"/>',
  yukle: '<path d="M12 15V4m0 0L7.5 8.5M12 4l4.5 4.5M4.5 19.5h15"/>',
  bilgi: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8h.01"/>',
  kalkan: '<path d="M12 3 5 6v5.5c0 4.4 3 8 7 9.5 4-1.5 7-5.1 7-9.5V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
  dil: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z"/>',
  termometre: '<path d="M10 14.5V5a2 2 0 1 1 4 0v9.5a4 4 0 1 1-4 0z"/><path d="M12 9v8"/>',
  esarp: '<path d="M12 3c4 0 6.5 3 6.5 7 0 3.5-2 6-3.5 7.5L17 21h-4l-1-2.5L11 21H7l2-3.5C7.5 16 5.5 13.5 5.5 10c0-4 2.5-7 6.5-7z"/><path d="M8.5 10c0-2 1.6-3.5 3.5-3.5s3.5 1.5 3.5 3.5"/>',
  /* kategori ikonları */
  ust: '<path d="M8.5 3.5 4 6l-1.5 4.5 3 1.2L7 10v10.5h10V10l1.5 1.7 3-1.2L20 6l-4.5-2.5c-.6 1.6-2 2.5-3.5 2.5s-2.9-.9-3.5-2.5z"/>',
  alt: '<path d="M7 3.5h10l1.5 17h-4.2L12 9.5l-2.3 11H5.5z"/>',
  tek: '<path d="M9.5 3.5h5L14 7.5l5 13H5l5-13z"/><path d="M10 7.5h4"/>',
  dis: '<path d="M8.5 3.5 4 6 3 20.5h4V11M15.5 3.5 20 6l1 14.5h-4V11"/><path d="M8.5 3.5 12 8l3.5-4.5M12 8v12.5M7 20.5h10"/>',
  ayk: '<path d="M3 16.5V8.5h4.5c.5 2 2 3 3.8 3.4l6.2 1.3c2.2.5 3.5 1.8 3.5 3.3v.5H3z"/><path d="M3 19h18"/>',
  aks: '<path d="M5 9h14l-1.2 11.5H6.2z"/><path d="M9 9V7a3 3 0 0 1 6 0v2"/>',
  ic: '<path d="M8 3.5h6v8.5l4.2 4.3a2.6 2.6 0 0 1-3.7 3.7L9 15.6a3.4 3.4 0 0 1-1-2.4z"/><path d="M8 7h6"/>'
};
function ikon(ad, sinif) {
  var ns = 'http://www.w3.org/2000/svg';
  var s = document.createElementNS(ns, 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('class', 'ik' + (sinif ? ' ' + sinif : ''));
  s.setAttribute('aria-hidden', 'true');
  s.innerHTML = IK[ad] || '';
  return s;
}

/* ---------- Telefon köprüsü (Kombinle Android uygulaması) ----------
   window.KombinleNative yalnızca Kombinle'nin kendi uygulamasında vardır.
   Yanıtlar 'kbyerel' olayıyla gelir. */
var YEREL = (function () { try { return window.KombinleNative && typeof window.KombinleNative.dinle === 'function' ? window.KombinleNative : null; } catch (e) { return null; } })();
var yerelBekleyen = Object.create(null), yerelSayac = 0;
window.addEventListener('kbyerel', function (e) {
  var d = e && e.detail; if (!d || typeof d.req !== 'string') return;
  var f = yerelBekleyen[d.req]; if (!f) return;
  delete yerelBekleyen[d.req]; f(d);
});
function yerelCagir(fn, args, ms) {
  return new Promise(function (coz) {
    if (!YEREL || typeof YEREL[fn] !== 'function') { coz({ ok: false, hata: 'yok' }); return; }
    var req = 'k' + (++yerelSayac).toString(36) + Math.floor(rastgele() * 1e6).toString(36);
    var z = setTimeout(function () { if (yerelBekleyen[req]) { delete yerelBekleyen[req]; coz({ ok: false, hata: 'zaman' }); } }, ms || 30000);
    yerelBekleyen[req] = function (d) { clearTimeout(z); coz(d); };
    try { YEREL[fn].apply(YEREL, [req].concat(args || [])); } catch (x) { clearTimeout(z); delete yerelBekleyen[req]; coz({ ok: false, hata: 'cagri' }); }
  });
}
var YEREL_ODEME = YEREL ? {
  products: function (ids) { return yerelCagir('odemeSorgula', [(ids || []).join(',')], 20000).then(function (d) { return d.ok && Array.isArray(d.products) ? d.products : []; }); },
  buy: function (id) { return yerelCagir('odemeAl', [String(id || '')], 600000).then(function (d) { return !!d.ok; }); },
  owned: function (id) { var l = []; try { l = JSON.parse(YEREL.odemeSahip() || '[]'); } catch (e) { } if (!Array.isArray(l)) l = []; return id === undefined ? l : l.indexOf(id) >= 0; },
  restore: function () { return yerelCagir('odemeGeriYukle', [], 30000).then(function (d) { return Array.isArray(d.owned) ? d.owned : []; }); }
} : null;
function odeme() { return YEREL_ODEME || window.ApkPay || null; }
