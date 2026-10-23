/* ---------- Kalıcı depolama ---------- */
var LS = {
  al: function (k, v) { try { var x = localStorage.getItem('kb_' + k); return x === null ? v : JSON.parse(x); } catch (e) { return v; } },
  yaz: function (k, v) {
    try { localStorage.setItem('kb_' + k, JSON.stringify(v)); return true; }
    catch (e) { if (e && /quota/i.test(e.name + e.message)) tost(t('yerYok')); return false; }
  },
  sil: function (k) { try { localStorage.removeItem('kb_' + k); } catch (e) { } }
};

var VARSAYILAN_AYAR = { dil: '', konum: null, tesettur: false, isi: 0, karsilandi: false, pro: false };
var A = {};
function ayarYukle() {
  var x = LS.al('ayar', {}) || {};
  A = {
    dil: ['tr', 'en', 'ru', 'uz'].indexOf(x.dil) >= 0 ? x.dil : '',
    konum: konumGecerli(x.konum) ? x.konum : null,
    tesettur: x.tesettur === true,
    isi: x.isi === -1 || x.isi === 1 ? x.isi : 0,
    karsilandi: x.karsilandi === true,
    pro: x.pro === true,
    kendiMod: x.kendiMod === true,
    yz: x.yz !== false,
    ozelTur: Array.isArray(x.ozelTur) ? x.ozelTur.filter(function (o) { return o && /^oz[a-z0-9]{4,20}$/.test(o.id) && typeof o.ad === 'string' && typeof o.g === 'string'; }).slice(0, 40).map(function (o) { return { id: o.id, g: o.g, ad: kirp(o.ad, 24) }; }) : []
  };
  ozelTurKaydet(A.ozelTur);
  if (!A.dil) { var nl = String(navigator.language || 'tr').slice(0, 2).toLowerCase(); A.dil = ['tr', 'en', 'ru', 'uz'].indexOf(nl) >= 0 ? nl : 'en'; }
}
function ayarKaydet() { LS.yaz('ayar', A); }
function konumGecerli(k) {
  return !!k && typeof k === 'object' && sayiMi(k.lat) && sayiMi(k.lon) && Math.abs(k.lat) <= 90 && Math.abs(k.lon) <= 180 && typeof k.ad === 'string' && k.ad.length <= 60;
}
var TEMALAR = [
  ['oto', 'temaOto', 'linear-gradient(135deg,#fff5f8 50%,#0a0612 50%)'], ['pembe', 'temaPembe', 'linear-gradient(135deg,#fff5f8,#ec4899)'],
  ['lavanta', 'temaLavanta', 'linear-gradient(135deg,#f8f5ff,#8b5cf6)'], ['altin', 'temaAltin', 'linear-gradient(135deg,#fffbf0,#d97706)'],
  ['mint', 'temaMint', 'linear-gradient(135deg,#f0fdf8,#10b981)'], ['rosegold', 'temaRosegold', 'linear-gradient(135deg,#fdf6f3,#d4735a)'],
  ['acik', 'temaAcik', 'linear-gradient(135deg,#fdfcff,#ec4899)'], ['koyu', 'temaKoyu', 'linear-gradient(135deg,#0a0612,#f472b6)'],
  ['amoled', 'temaAmoled', 'linear-gradient(135deg,#000000,#ff4d94)']
];
var TEMA_ZEMIN = { pembe: '#fff5f8', lavanta: '#f8f5ff', altin: '#fffbf0', mint: '#f0fdf8', rosegold: '#fdf6f3', acik: '#fdfcff', koyu: '#0a0612', amoled: '#000000' };
function temaRengi(secim) {
  if (secim !== 'oto' && TEMA_ZEMIN[secim]) return secim;
  return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'koyu' : 'pembe';
}
function temaUygula(secim) {
  if (!TEMALAR.some(function (x) { return x[0] === secim; })) secim = 'oto';
  try { localStorage.setItem('kb_tema', secim); } catch (e) { }
  var renk = temaRengi(secim), koyu = renk === 'koyu' || renk === 'amoled';
  document.documentElement.setAttribute('data-tema', koyu ? 'koyu' : 'acik');
  document.documentElement.setAttribute('data-renk', renk);
  var m = $('meta[name="theme-color"]'); if (m) m.setAttribute('content', TEMA_ZEMIN[renk]);
  if (YEREL && YEREL.cubuk) try { YEREL.cubuk(!!koyu); } catch (e) { }
  if (YEREL && typeof YEREL.zemin === 'function') try { YEREL.zemin(TEMA_ZEMIN[renk]); } catch (e) { }
}
function temaSecimi() {
  try { var x = localStorage.getItem('kb_tema'); return TEMALAR.some(function (y) { return y[0] === x; }) ? x : 'oto'; } catch (e) { return 'oto'; }
}

/* IndexedDB: kıyafet bilgileri ve fotoğraflar. Açılamazsa bellekte çalışır. */
var DB = null, BELLEK = { parca: {}, resim: {} }, DB_YOK = false;
function dbAc() {
  return new Promise(function (coz) {
    var bitti = false, son = function (d) { if (!bitti) { bitti = true; coz(d); } };
    try {
      var r = indexedDB.open('kombinle', 2);
      r.onupgradeneeded = function () {
        var d = r.result;
        if (!d.objectStoreNames.contains('parca')) d.createObjectStore('parca', { keyPath: 'id' });
        if (!d.objectStoreNames.contains('resim')) d.createObjectStore('resim');
        if (!d.objectStoreNames.contains('ilham')) d.createObjectStore('ilham', { keyPath: 'id' });
      };
      r.onsuccess = function () { DB = r.result; DB.onversionchange = function () { try { DB.close(); } catch (e) { } }; son(true); };
      r.onerror = function () { son(false); };
      r.onblocked = function () { son(false); };
      setTimeout(function () { son(false); }, 6000);
    } catch (e) { son(false); }
  }).then(function (ok) { if (!ok) DB_YOK = true; return ok; });
}
function dbIs(depo, kip, fn) {
  if (!DB) return Promise.resolve(fn(null));
  return new Promise(function (coz, red) {
    var sonuc;
    try {
      var tx = DB.transaction(depo, kip), st = tx.objectStore(depo);
      sonuc = fn(st);
      tx.oncomplete = function () { coz(sonuc && sonuc.__istek ? sonuc.__istek.result : sonuc); };
      tx.onerror = function () { red(tx.error); };
      tx.onabort = function () { red(tx.error || new Error('abort')); };
    } catch (e) { red(e); }
  });
}
var Depo = {
  parcalar: function () {
    if (!DB) return Promise.resolve(Object.keys(BELLEK.parca).map(function (k) { return BELLEK.parca[k]; }));
    return dbIs('parca', 'readonly', function (st) { return { __istek: st.getAll() }; });
  },
  parcaYaz: function (p) {
    if (!DB) { BELLEK.parca[p.id] = p; return Promise.resolve(); }
    return dbIs('parca', 'readwrite', function (st) { st.put(p); });
  },
  parcaSil: function (id) {
    if (!DB) { delete BELLEK.parca[id]; delete BELLEK.resim[id]; return Promise.resolve(); }
    return new Promise(function (coz, red) {
      try {
        var tx = DB.transaction(['parca', 'resim'], 'readwrite');
        tx.objectStore('parca').delete(id); tx.objectStore('resim').delete(id);
        tx.oncomplete = function () { coz(); }; tx.onerror = function () { red(tx.error); };
      } catch (e) { red(e); }
    });
  },
  resimYaz: function (id, r) {
    if (!DB) { BELLEK.resim[id] = r; return Promise.resolve(); }
    return dbIs('resim', 'readwrite', function (st) { st.put(r, id); });
  },
  resimAl: function (id) {
    if (!DB) return Promise.resolve(BELLEK.resim[id] || null);
    return dbIs('resim', 'readonly', function (st) { return { __istek: st.get(id) }; });
  },
  ilhamlar: function () {
    if (!DB) return Promise.resolve(Object.keys(BELLEK.ilham || {}).map(function (k) { return BELLEK.ilham[k]; }));
    return dbIs('ilham', 'readonly', function (st) { return { __istek: st.getAll() }; });
  },
  ilhamYaz: function (x) {
    if (!DB) { BELLEK.ilham = BELLEK.ilham || {}; BELLEK.ilham[x.id] = x; return Promise.resolve(); }
    return dbIs('ilham', 'readwrite', function (st) { st.put(x); });
  },
  ilhamSil: function (id) {
    if (!DB) { if (BELLEK.ilham) delete BELLEK.ilham[id]; return Promise.resolve(); }
    return dbIs('ilham', 'readwrite', function (st) { st.delete(id); });
  },
  hepsiniSil: function () {
    BELLEK = { parca: {}, resim: {}, ilham: {} };
    if (!DB) return Promise.resolve();
    return new Promise(function (coz, red) {
      var tx = DB.transaction(['parca', 'resim'], 'readwrite');
      tx.objectStore('parca').clear(); tx.objectStore('resim').clear();
      try { DB.transaction('ilham', 'readwrite').objectStore('ilham').clear(); } catch (e) { }
      tx.oncomplete = function () { coz(); }; tx.onerror = function () { red(tx.error); };
    });
  }
};

/* Kombin geçmişi (en fazla 300) */
function gecmisAl() {
  var g = LS.al('gecmis', []);
  return Array.isArray(g) ? g.filter(function (x) { return x && idGecerli(x.id) && Array.isArray(x.p); }).slice(0, 500) : [];
}
function gecmisYaz(g) { LS.yaz('gecmis', g.slice(0, 500)); }
