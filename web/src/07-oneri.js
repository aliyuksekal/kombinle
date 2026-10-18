/* ---------- Cümleyi anlama ---------- */
function katla(s) {
  return s.replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u');
}
function kelimeler(metin) {
  var ham = String(metin || '').slice(0, 400).toLocaleLowerCase('tr').replace(/[^a-zçğıöşüâîû0-9'\s-]/g, ' ').split(/[\s'-]+/).filter(Boolean);
  return { ham: ham, katli: ham.map(katla) };
}
function kelimeEsler(k, kw) {
  if (kw.length >= 5) return k.indexOf(kw.slice(0, -1)) === 0;
  return k === kw || (k.indexOf(kw) === 0 && k.length <= kw.length + 3);
}
/* kw listesindeki sözcüklerin geçtiği konumlar */
function bul(kel, liste) {
  var yerler = [];
  liste.forEach(function (kw) {
    var asciiMi = /^[a-z0-9]+$/.test(kw), dizi = asciiMi ? kel.katli : kel.ham;
    dizi.forEach(function (k, i) { if (kelimeEsler(k, kw)) yerler.push(i); });
  });
  return yerler;
}
var OLUMSUZ_SONRA = ['olmasın', 'olmasin', 'istemiyorum', 'istemem', 'giymeyeceğim', 'giymeyecegim', 'giymem', 'giymiyorum', 'değil', 'degil', 'hariç', 'haric', 'yok', 'olmasin'];
var OLUMSUZ_ONCE = ['no', 'not', 'without', 'dont', 'never', 'avoid', 'except'];
function olumsuzMu(kel, i) {
  for (var j = i + 1; j <= i + 3 && j < kel.katli.length; j++) {
    var w = kel.katli[j];
    if (OLUMSUZ_SONRA.some(function (o) { return katla(o) === w || w.indexOf('istemiyor') === 0 || w.indexOf('giymeyece') === 0; })) return true;
  }
  for (j = Math.max(0, i - 2); j < i; j++) if (OLUMSUZ_ONCE.indexOf(kel.katli[j]) >= 0) return true;
  return false;
}
var RENK_SOZ = {
  siyah: ['siyah', 'black'], beyaz: ['beyaz', 'white'], kirmizi: ['kırmızı', 'kirmizi', 'red'], bordo: ['bordo', 'burgundy'],
  mavi: ['mavi', 'blue'], lacivert: ['lacivert', 'navy'], yesil: ['yeşil', 'yesil', 'green'], pembe: ['pembe', 'pink'],
  mor: ['mor', 'purple'], lila: ['lila', 'lilac'], sari: ['sarı', 'sari', 'yellow'], turuncu: ['turuncu', 'orange'],
  gri: ['gri', 'grey', 'gray'], bej: ['bej', 'beige'], kahve: ['kahverengi', 'kahve', 'brown'], krem: ['krem', 'cream'],
  haki: ['haki', 'khaki'], pudra: ['pudra', 'blush'], fusya: ['fuşya', 'fusya', 'fuchsia'], turkuaz: ['turkuaz', 'teal', 'turquoise'],
  mint: ['mint'], hardal: ['hardal', 'mustard'], somon: ['somon', 'salmon'], taba: ['taba', 'camel'], antrasit: ['antrasit', 'charcoal'], zeytin: ['zeytin', 'olive']
};
var RENK_AILE = { mavi: ['mavi', 'acikmavi', 'kot'], yesil: ['yesil', 'mint', 'haki', 'zeytin'], pembe: ['pembe', 'pudra', 'fusya'], mor: ['mor', 'lila'], kahve: ['kahve', 'taba'], gri: ['gri', 'acikgri', 'antrasit'], kirmizi: ['kirmizi', 'bordo'] };
var TUR_SOZ = [
  [['etek', 'skirt'], ['etek', 'uzunetek']], [['pantolon', 'pantalon', 'trousers', 'pants'], ['kumas', 'kot']], [['kot', 'jean', 'jeans', 'denim'], ['kot']],
  [['elbise', 'dress'], ['elbise', 'uzunelbise']], [['şort', 'sort', 'shorts'], ['sort']], [['topuklu', 'topuk', 'heels', 'heel'], ['topuklu']],
  [['bot', 'botlar', 'çizme', 'cizme', 'boots'], ['bot']], [['sandalet', 'sandals'], ['sandalet']], [['terlik', 'slides', 'slippers'], ['terlik']],
  [['blazer'], ['blazer']], [['ceket', 'jacket'], ['ceket', 'blazer']], [['gömlek', 'gomlek', 'shirt'], ['gomlek']], [['kazak', 'sweater', 'jumper'], ['kazak']],
  [['tunik', 'tunic'], ['tunik']], [['tayt', 'leggings'], ['tayt']], [['eşofman', 'esofman', 'joggers', 'sweatpants'], ['esofman']], [['tulum', 'jumpsuit'], ['tulum']],
  [['ferace', 'abaya'], ['ferace']], [['trençkot', 'trenckot', 'pardösü', 'pardosu', 'trench'], ['tren']], [['mont', 'parka', 'puffer'], ['mont']],
  [['kaban', 'coat'], ['kaban']], [['hırka', 'hirka', 'cardigan'], ['hirka']], [['babet', 'flats'], ['babet']], [['loafer', 'makosen', 'loafers'], ['loafer']], [['küpe', 'kupe', 'earrings'], ['kupe']], [['kolye', 'necklace'], ['kolye']], [['eşarp', 'esarp', 'şal', 'headscarf', 'shawl'], ['esarp']],
  [['atkı', 'atki', 'scarf'], ['atki']], [['bere', 'şapka', 'sapka', 'hat', 'beanie'], ['bere']], [['çanta', 'canta', 'bag', 'handbag'], ['canta']],
  [['bluz', 'blouse'], ['bluz']], [['tişört', 'tisort', 'tshirt'], ['tisort']], [['sweatshirt', 'sweat', 'hoodie'], ['sweat']], [['yelek', 'vest'], ['yelek']],
  [['yağmurluk', 'yagmurluk', 'raincoat'], ['yagmurluk']]
];
function cumleCoz(metin, secilenOrtam) {
  var kel = kelimeler(metin), sonuc = {
    ortam: '', eslesen: [], pencere: { bas: 8, son: 21 }, gun: -1, f: '', rahat: false, renkli: false, iceri: false,
    renkTercih: [], renkKac: [], turTercih: [], turKac: [], turIstek: []
  };
  var puan = {};
  ORTAM_SIRA.forEach(function (id) {
    var liste = ORTAMLAR[id].k.split(' ');
    var yer = bul(kel, liste).filter(function (i) {
      /* "spor ayakkabı" bir ortam değil */
      return !(id === 'spor' && /^ayakkab|^sneaker|^shoe/.test(kel.katli[i + 1] || ''));
    });
    if (yer.length) puan[id] = yer.length;
  });
  var enIyi = '', enP = 0;
  ORTAM_SIRA.forEach(function (id) { if ((puan[id] || 0) > enP) { enP = puan[id]; enIyi = id; } });
  sonuc.ortam = secilenOrtam && ORTAMLAR[secilenOrtam] ? secilenOrtam : (enIyi || 'gunluk');
  sonuc.metindenOrtam = enIyi;
  /* zaman */
  var k = kel.katli;
  var var_ = function (l) { return bul(kel, l).length > 0; };
  if (var_(['sabah', 'morning'])) sonuc.pencere = { bas: 7, son: 12 };
  if (var_(['öğle', 'ogle', 'öğlen', 'oglen', 'öğleden', 'ogleden', 'noon', 'afternoon'])) sonuc.pencere = { bas: 12, son: 18 };
  if (var_(['akşam', 'aksam', 'evening', 'tonight'])) sonuc.pencere = { bas: 17, son: 23 };
  if (var_(['gece', 'night'])) sonuc.pencere = { bas: 19, son: 24 };
  if (var_(['yarın', 'yarin', 'tomorrow'])) sonuc.gun = 1;
  else if (var_(['bugün', 'bugun', 'today'])) sonuc.gun = 0;
  /* tarz ipuçları */
  if (var_(['şık', 'sik', 'elegant', 'chic', 'dressy', 'fancy'])) sonuc.f = 's';
  if (var_(['resmi', 'formal'])) sonuc.f = 'r';
  if (var_(['rahat', 'comfortable', 'comfy', 'casual'])) sonuc.rahat = true;
  if (var_(['yürüyeceğim', 'yuruyecegim', 'yürüme', 'yurume', 'ayakta', 'walking', 'walk'])) sonuc.rahat = true;
  if (var_(['renkli', 'canlı', 'canli', 'colorful', 'colourful', 'bright'])) sonuc.renkli = true;
  if (var_(['içeride', 'iceride', 'kapalı', 'kapali', 'indoor', 'indoors'])) sonuc.iceri = true;
  /* renk ve kıyafet istekleri */
  Object.keys(RENK_SOZ).forEach(function (r) {
    bul(kel, RENK_SOZ[r]).forEach(function (i) {
      var aile = RENK_AILE[r] || [r];
      if (olumsuzMu(kel, i)) aile.forEach(function (x) { if (sonuc.renkKac.indexOf(x) < 0) sonuc.renkKac.push(x); });
      else aile.forEach(function (x) { if (sonuc.renkTercih.indexOf(x) < 0) sonuc.renkTercih.push(x); });
    });
  });
  TUR_SOZ.forEach(function (ts) {
    var yerler = bul(kel, ts[0]);
    /* "spor ayakkabı" */
    yerler.forEach(function (i) {
      var olumsuz = olumsuzMu(kel, i), hedef = olumsuz ? sonuc.turKac : sonuc.turTercih;
      ts[1].forEach(function (x) { if (hedef.indexOf(x) < 0) hedef.push(x); });
      if (!olumsuz) sonuc.turIstek.push(ts[1]);
    });
  });
  bul(kel, ['spor', 'sport']).forEach(function (i) {
    if (/^ayakkab|^sneaker|^shoe/.test(k[i + 1] || '')) {
      var hedef = olumsuzMu(kel, i + 1) ? sonuc.turKac : sonuc.turTercih;
      if (hedef.indexOf('spor') < 0) hedef.push('spor');
      if (hedef === sonuc.turTercih) sonuc.turIstek.push(['spor']);
      sonuc.turTercih = sonuc.turTercih.filter(function (x) { return x !== 'spor' || hedef === sonuc.turTercih; });
    }
  });
  /* çelişkileri temizle: hem iste hem isteme → isteme kazanır */
  sonuc.turTercih = sonuc.turTercih.filter(function (x) { return sonuc.turKac.indexOf(x) < 0; });
  sonuc.renkTercih = sonuc.renkTercih.filter(function (x) { return sonuc.renkKac.indexOf(x) < 0; });
  return sonuc;
}

/* ---------- Kombin motoru ---------- */
function hedefIsi(his) { return sinirla(1.2 + (30 - his) * 0.24, 0.8, 10); }
function gunFarki(ts) { return ts ? (Date.now() - ts) / 86400000 : 99; }
function tarzVar(p, f) { return (p.tarz || '').indexOf(f) >= 0; }

function parcaPuan(p, c) {
  var tur = TUR[p.tur]; if (!tur) return -99;
  var o = c.o, h = c.h, his = h.kisisel, s = 0, f = c.f;
  var tz = 0;
  if (tarzVar(p, f)) tz = 3;
  else if (f === 'r' && tarzVar(p, 's')) tz = 1.2;
  else if (f === 's' && tarzVar(p, 'r')) tz = 1.6;
  else if (f === 'g' && (tarzVar(p, 's') || tarzVar(p, 'p'))) tz = 0.8;
  else if (f === 'p' && tarzVar(p, 'g')) tz = 0.3;
  else tz = -3;
  s += tur.g === 'aks' ? tz / 2 : tz;
  s += (o.tercih[p.tur] || 0) + (o.kac[p.tur] || 0);
  if (c.rahat) { if (p.tur === 'topuklu') s -= 5; if (p.tur === 'spor' || p.tur === 'babet' || p.tur === 'loafer') s += 1.5; }
  var rk = RENK[p.renk] || RENK.siyah;
  if (o.kirli && ACIK_RENKLER[p.renk]) s -= (tur.g === 'ayk' || tur.g === 'alt') ? 4 : 2.5;
  if (o.koyu) { if (KOYU_SADE[p.renk]) s += 2; else if (!rk.notr) s -= 3.5; if (p.desen) s -= 2; }
  if (c.renkli && !rk.notr) s += 1.5;
  if (c.renkTercih.length && (c.renkTercih.indexOf(p.renk) >= 0 || c.renkTercih.indexOf(p.renk2) >= 0)) s += 3;
  if (c.renkKac.indexOf(p.renk) >= 0) s -= 12; else if (c.renkKac.indexOf(p.renk2) >= 0) s -= 4;
  if (c.turTercih.indexOf(p.tur) >= 0) s += 6;
  if (c.turKac.indexOf(p.tur) >= 0) s -= 40;
  /* hava */
  if (tur.ac) { if (his < 19 && !o.ac) s -= 7; if (h.yagmur || h.kar) s -= 7; if (his >= 24) s += 1.5; }
  if (p.tur === 'topuklu' && (h.yagmur || h.kar)) s -= 2.5;
  if (p.tur === 'bot') { if (h.kar) s += 5; else if (h.yagmur) s += 2.5; if (his > 22) s -= 6; else if (his > 17) s -= 2; }
  if (h.kar && tur.g === 'ayk' && p.tur !== 'bot') s -= 3;
  if ((p.tur === 'sort' || p.tur === 'askili') && his < 22) s -= his < 16 ? 10 : 5;
  if (p.tur === 'kazak') { if (his > 22) s -= 7; else if (his > 17) s -= 2; }
  if (p.tur === 'sweat' && his > 24) s -= 5;
  if (p.tur === 'mont' || p.tur === 'kaban') { if (his > 16) s -= 9; else if (his > 11) s -= 2; }
  if (p.tur === 'tren' && his > 21) s -= 6;
  if (p.tur === 'ceket' && his > 23) s -= 5;
  if (tur.g === 'dis' && (h.yagmur || h.kar) && p.su) s += 3;
  if (h.ruzgarli && (p.tur === 'etek' || p.tur === 'elbise')) s -= 1.5;
  if (c.tesettur) {
    if (tur.k === 0) s -= 25;
    else if (tur.k === 1 && tur.g !== 'aks' && tur.g !== 'ayk') s -= 4;
    if (tur.k === 2 && (tur.g === 'ust' || tur.g === 'alt' || tur.g === 'tek')) s += 1.5;
    if (p.tur === 'tunik' || p.tur === 'ferace') s += 1.5;
  }
  if (p.mevsim && p.mevsim.indexOf(c.mevsim || buMevsim()) < 0) s -= 4;
  if (c.bonus && c.bonus[p.id]) s += c.bonus[p.id];
  var gf = gunFarki(p.son);
  if (gf < 1.5) s -= 4; else if (gf < 3.5) s -= 2; else if (gf < 7) s -= 0.7;
  return s;
}
function renkUyum(liste, c) {
  var aileler = [], desen = 0, s = 0;
  liste.forEach(function (p) {
    if (!p) return;
    if (p.desen) desen++;
    var r = RENK[p.renk]; if (!r || r.notr) return;
    var ton = renkTon(p.renk); if (!ton) return;
    var bulundu = aileler.some(function (a) { var d = Math.abs(a - ton.h); d = Math.min(d, 360 - d); return d <= 25; });
    if (!bulundu) aileler.push(ton.h);
  });
  var n = aileler.length;
  if (n === 0) s += 1;
  else if (n === 1) s += 2.5;
  else if (n === 2) { var d = Math.abs(aileler[0] - aileler[1]); d = Math.min(d, 360 - d); s += d <= 50 ? 1.8 : d >= 150 ? 1.2 : -2.2; }
  else s -= 3.5 * (n - 2);
  if (desen >= 2) s -= 3.5;
  if (c && c.renkli) s += Math.min(n, 2) * 0.8;
  return s;
}
function kombinOner(parcalar, c) {
  var grup = function (g, fn) { return parcalar.filter(function (p) { var tr = TUR[p.tur]; return tr && tr.g === g && (!fn || fn(p, tr)); }); };
  var puanli = {};
  parcalar.forEach(function (p) { puanli[p.id] = parcaPuan(p, c); });
  var sirala = function (l, n) { return l.slice().sort(function (a, b) { return puanli[b.id] - puanli[a.id]; }).slice(0, n); };
  var usttler = sirala(grup('ust'), 22), altlar = sirala(grup('alt'), 22), tekler = sirala(grup('tek'), 22);
  var katlar = sirala(grup('dis', function (p, tr) { return tr.kat; }), 4);
  var disler = sirala(grup('dis', function (p, tr) { return !tr.kat; }), 4);
  var ayklar = sirala(grup('ayk'), 5);
  var z = c.zorunlu, zKat = false, zDis = false;
  if (z && TUR[z.tur]) {
    var zg = TUR[z.tur].g;
    if (zg === 'ust') { usttler = [z]; tekler = []; }
    else if (zg === 'alt') { altlar = [z]; tekler = []; }
    else if (zg === 'tek') { tekler = [z]; usttler = []; }
    else if (zg === 'dis' && TUR[z.tur].kat) { katlar = [z]; zKat = true; }
    else if (zg === 'dis') { disler = [z]; zDis = true; }
    else if (zg === 'ayk') ayklar = [z];
  }
  var his = c.h.kisisel, T = hedefIsi(his);
  var disVar = grup('dis', function (p, tr) { return !tr.kat; }).length > 0;
  var suGecirmezVar = grup('dis', function (p) { return p.su; }).length > 0;
  var bazlar = [];
  tekler.forEach(function (p) { bazlar.push({ parca: [p], puan: puanli[p.id] }); });
  usttler.forEach(function (u) {
    altlar.forEach(function (a) {
      var s = puanli[u.id] + puanli[a.id];
      if (u.tur === 'kazak' && a.tur === 'sort') s -= 4;
      if ((u.tur === 'gomlek' || u.tur === 'bluz') && a.tur === 'esofman' && c.oid !== 'spor') s -= 3;
      if (u.tur === 'tunik' && a.tur === 'sort') s -= 3;
      bazlar.push({ parca: [u, a], puan: s });
    });
  });
  if (!bazlar.length) return { kombinler: [], eksik: 'baz' };
  bazlar.forEach(function (b) { b.puan += renkUyum(b.parca, c) * 0.7; });
  bazlar.sort(function (a, b) { return b.puan - a.puan; });
  bazlar = bazlar.slice(0, 40);
  var adaylar = [];
  var katSec = zKat ? katlar : [null].concat(katlar), disSec = zDis ? disler : [null].concat(disler), aykSec = ayklar.length ? ayklar : [null];
  bazlar.forEach(function (b) {
    katSec.forEach(function (kt) {
      disSec.forEach(function (ds) {
        aykSec.forEach(function (ay) {
          var giysi = b.parca.concat(kt ? [kt] : [], ds ? [ds] : []);
          var W = giysi.reduce(function (t2, p) { return t2 + (TUR[p.tur].w || 0); }, 0);
          var fark = W - T, isi = 0;
          if (Math.abs(fark) > 0.4) isi = fark < 0 ? (fark + 0.4) * 3.2 : -(fark - 0.4) * 2;
          var s = b.puan + isi + (kt ? puanli[kt.id] * 0.8 : 0) + (ds ? puanli[ds.id] : 0) + (ay ? puanli[ay.id] * 0.9 : 0);
          if (his < 12 && disVar && !ds && !c.iceriSadece) s -= 6;
          if ((c.h.yagmur || c.h.kar) && suGecirmezVar && !(ds && ds.su)) s -= 3;
          if (kt && ds && his > 13) s -= 2;
          if (kt && kt.tur === 'blazer' && c.f !== 'r' && c.f !== 's') s -= 1;
          if (c.f === 'r' && kt && kt.tur === 'blazer') s += 1;
          var uyum = renkUyum(giysi.concat(ay ? [{ renk: ay.renk, desen: ay.desen }] : []), c);
          s += uyum + rastgele() * 0.9;
          adaylar.push({ baz: b.parca, kat: kt, dis: ds, ayk: ay, puan: s, W: W, T: T });
        });
      });
    });
  });
  adaylar.sort(function (a, b) { return b.puan - a.puan; });
  var secilen = [];
  var anahtar = function (k) { return k.baz.map(function (p) { return p.id; }).join('+'); };
  var ortak = function (a, b) {
    var ia = [a.kat, a.dis, a.ayk].concat(a.baz).filter(Boolean).map(function (p) { return p.id; });
    var ib = [b.kat, b.dis, b.ayk].concat(b.baz).filter(Boolean).map(function (p) { return p.id; });
    return ia.filter(function (x) { return ib.indexOf(x) >= 0; }).length;
  };
  while (secilen.length < 3) {
    var en = null, enP = -1e9;
    for (var i = 0; i < adaylar.length && i < 1500; i++) {
      var a = adaylar[i];
      if (secilen.some(function (s2) { return anahtar(s2) === anahtar(a); })) continue;
      if (secilen.length && a.puan < secilen[0].puan - 5) break; /* çok daha kötü alternatif gösterme */
      var p2 = a.puan - secilen.reduce(function (t2, s2) { return t2 + ortak(s2, a) * 2.5; }, 0);
      if (p2 > enP) { enP = p2; en = a; }
    }
    if (!en) break;
    secilen.push(en);
  }
  return {
    kombinler: secilen.map(function (k) { return kombinTamamla(k, parcalar, c, puanli); }),
    eksik: ''
  };
}
function kombinTamamla(k, parcalar, c, puanli) {
  var his = c.h.kisisel;
  var giysi = k.baz.concat([k.kat, k.dis]).filter(Boolean);
  var aksSec = function (tur, ek) {
    var l = parcalar.filter(function (p) { return p.tur === tur; });
    if (!l.length) return null;
    l.sort(function (a, b) {
      return (puanli[b.id] + renkUyum(giysi.concat([b]), c) * (ek || 1)) - (puanli[a.id] + renkUyum(giysi.concat([a]), c) * (ek || 1));
    });
    return l[0];
  };
  var aks = [];
  var ekleA = function (p) { if (p && aks.indexOf(p) < 0) aks.push(p); };
  ekleA(aksSec('canta', 0.6));
  if (c.tesettur || c.turTercih.indexOf('esarp') >= 0) ekleA(aksSec('esarp', 1.2));
  if (his <= 8 && !c.tesettur) ekleA(aksSec('atki'));
  if (his <= 5 || c.h.kar || c.turTercih.indexOf('bere') >= 0) ekleA(aksSec('bere'));
  if (his <= 4) ekleA(aksSec('eldiven'));
  if (c.h.gunes > 0.5 && his >= 18 && !c.h.elle) ekleA(aksSec('gozluk'));
  if (c.oid === 'davet' || c.oid === 'randevu' || c.turTercih.indexOf('taki') >= 0) { ekleA(aksSec('kupe')); ekleA(aksSec('kolye')); ekleA(aksSec('taki')); }
  if (c.turTercih.indexOf('kupe') >= 0) ekleA(aksSec('kupe'));
  if (c.turTercih.indexOf('kolye') >= 0) ekleA(aksSec('kolye'));
  if (c.turTercih.indexOf('kemer') >= 0) ekleA(aksSec('kemer'));
  var kisa = k.baz.some(function (p) { return p.tur === 'etek' || p.tur === 'elbise'; });
  if (kisa && his < 16) ekleA(aksSec('kulotlu'));
  if (c.zorunlu && TUR[c.zorunlu.tur] && TUR[c.zorunlu.tur].g === 'aks' && aks.indexOf(c.zorunlu) < 0) aks.unshift(c.zorunlu);
  var tek = k.baz.length === 1 ? k.baz[0] : null;
  return {
    ust: tek ? null : k.baz[0], alt: tek ? null : k.baz[1], tek: tek, kat: k.kat, dis: k.dis, ayk: k.ayk, aks: aks,
    puan: k.puan, W: k.W, T: k.T, nedenler: nedenYaz(k, aks, parcalar, c)
  };
}
function trAd(p) { return p.ad ? p.ad : turAd(p.tur).toLocaleLowerCase(A.dil === 'tr' ? 'tr' : 'en'); }
function nedenYaz(k, aks, parcalar, c) {
  var h = c.h, his = Math.round(h.kisisel), n = [];
  var hasDis = parcalar.some(function (p) { return TUR[p.tur] && TUR[p.tur].g === 'dis' && !TUR[p.tur].kat; });
  var ayk = parcalar.some(function (p) { return TUR[p.tur] && TUR[p.tur].g === 'ayk'; });
  var hava = h.elle ? t('nElleHava') : t('nHava', Math.round(h.min), Math.round(h.max), Math.round(h.his));
  if (k.dis) hava += ' ' + t('nDisEklendi', trAd(k.dis));
  else if (k.kat) hava += ' ' + t('nKatYeter', trAd(k.kat));
  else if (his >= 24) hava += ' ' + t('nHafif');
  n.push({ i: havaIkonu(h.sembol), m: hava });
  if (h.yagmur || h.kar) {
    var m = k.dis && k.dis.su ? t('nYagmurSu', trAd(k.dis)) : t('nYagmur');
    if (k.ayk && !TUR[k.ayk.tur].ac) m += ' ' + t('nKapaliAyk');
    n.push({ i: 'semsiye', m: m + ' ' + t('nSemsiye') });
  }
  var oMet = t('o_' + c.oid);
  if (c.metindenOrtam === c.oid || c.secildi) n.push({ i: 'isilti', m: oMet });
  if (h.hisMax - h.hisMin >= 7) n.push({ i: 'termometre', m: t('nKatKat', Math.round(h.hisMax - h.hisMin)) });
  if (h.ruzgarli) n.push({ i: 'ruzgar', m: t('nRuzgar') + (k.baz.some(function (p) { return p.tur === 'etek' || p.tur === 'elbise'; }) ? ' ' + t('nEtekUcar') : '') });
  var giysi = k.baz.concat([k.kat, k.dis]).filter(Boolean);
  var renkli = giysi.filter(function (p) { return RENK[p.renk] && !RENK[p.renk].notr; });
  if (renkli.length === 1) n.push({ i: 'isilti', m: t('nTekRenk', renkAd(renkli[0].renk)) });
  else if (!renkli.length) n.push({ i: 'isilti', m: t('nNotr') });
  if (!ayk) n.push({ i: 'bilgi', m: t('nAykYok') });
  if (his < 12 && !hasDis) n.push({ i: 'bilgi', m: t('nDisYok') });
  (c.turIstek || []).forEach(function (l) {
    if (!parcalar.some(function (p) { return l.indexOf(p.tur) >= 0; })) n.push({ i: 'bilgi', m: t('nTurYok', turAd(l[0]).toLocaleLowerCase(A.dil === 'tr' ? 'tr' : 'en')) });
  });
  if (c.tesettur && !aks.some(function (p) { return p.tur === 'esarp'; }) && !parcalar.some(function (p) { return p.tur === 'esarp'; })) n.push({ i: 'bilgi', m: t('nEsarpYok') });
  return n.slice(0, 7);
}

/* Önerilerde kullanılabilecek parçalar: iç giyim (külotlu çorap hariç) ve dinlenmedekiler çıkar */
function oneriParcalari() {
  return S.parcalar.filter(function (p) { var tr = TUR[p.tur]; return tr && !p.dinlen && (tr.g !== 'ic' || p.tur === 'kulotlu'); });
}
function bagSkoru(k, c) {
  var giysi = [k.ust, k.alt, k.tek, k.kat, k.dis].filter(Boolean);
  if (!giysi.length) return -1e9;
  var s = giysi.concat(k.ayk ? [k.ayk] : []).reduce(function (t2, p) { return t2 + parcaPuan(p, c); }, 0);
  var W = giysi.reduce(function (t2, p) { return t2 + (TUR[p.tur].w || 0); }, 0), T = hedefIsi(c.h.kisisel), fark = W - T;
  if (Math.abs(fark) > 0.4) s += fark < 0 ? (fark + 0.4) * 3.2 : -(fark - 0.4) * 2;
  return s + renkUyum(giysi, c);
}
/* Kayıtlı kombinden motorun anlayacağı yapı */
function kayittanKombin(k) {
  var harita = {}; S.parcalar.forEach(function (p) { harita[p.id] = p; });
  var y = { aks: [] };
  (k.p || []).map(function (id) { return harita[id]; }).filter(Boolean).forEach(function (p) {
    var tr = TUR[p.tur]; if (!tr) return; var g = tr.g;
    if (g === 'ust' && !y.ust) y.ust = p; else if (g === 'alt' && !y.alt) y.alt = p; else if (g === 'tek' && !y.tek) y.tek = p;
    else if (g === 'dis' && tr.kat && !y.kat) y.kat = p; else if (g === 'dis' && !y.dis) y.dis = p; else if (g === 'ayk' && !y.ayk) y.ayk = p;
    else y.aks.push(p);
  });
  return y;
}
/* "Sadece kendi kombinlerimden öner": kayıtlı kombinler havaya ve ortama göre sıralanır */
function kendiKombinlerdenOner(c) {
  var aday = gecmisAl().filter(function (k) { return k.kendi || k.fav; });
  var gorulen = {};
  var l = [];
  aday.forEach(function (k) {
    var anahtar = k.p.slice().sort().join('+'); if (gorulen[anahtar]) return; gorulen[anahtar] = 1;
    var y = kayittanKombin(k);
    if (!(y.tek || (y.ust && y.alt))) return;
    if ([y.ust, y.alt, y.tek, y.kat, y.dis, y.ayk].some(function (p) { return p && p.dinlen; })) return;
    y.puan = bagSkoru(y, c);
    y.nedenler = nedenYaz({ baz: y.tek ? [y.tek] : [y.ust, y.alt], kat: y.kat, dis: y.dis, ayk: y.ayk }, y.aks, S.parcalar, c);
    y.nedenler.unshift({ i: 'kalp', m: t('nKendi', k.ad || k.m || ortamAd(k.o)) });
    l.push(y);
  });
  l.sort(function (a, b) { return b.puan - a.puan; });
  return l.slice(0, 3);
}
