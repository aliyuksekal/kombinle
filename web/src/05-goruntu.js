/* ---------- Fotoğraf işleme ----------
   Fotoğraf yeniden çizilip JPEG olarak kaydedilir: EXIF (konum dahil) tamamen silinir,
   bozuk ya da aşırı büyük dosyalar reddedilir. */
var EN_BUYUK_DOSYA = 40 * 1024 * 1024;

function zamanAsimi(p, ms, mesaj) {
  return new Promise(function (coz, red) {
    var z = setTimeout(function () { red(new Error(mesaj || 'zaman')); }, ms);
    p.then(function (v) { clearTimeout(z); coz(v); }, function (e) { clearTimeout(z); red(e); });
  });
}
function resimCoz(dosya) {
  if (!dosya || typeof dosya.size !== 'number') return Promise.reject(new Error('dosya'));
  if (dosya.size <= 0 || dosya.size > EN_BUYUK_DOSYA) return Promise.reject(new Error('boyut'));
  if (dosya.type && !/^image\//i.test(dosya.type)) return Promise.reject(new Error('tur'));
  var tarayici = function (d) {
    return window.createImageBitmap ? createImageBitmap(d, { imageOrientation: 'from-image' }).catch(function () { return imgIleCoz(d); }) : imgIleCoz(d);
  };
  // sayfa çözemezse (ör. HEIC) telefon JPEG'e çevirir
  var p = tarayici(dosya).catch(function (e) {
    if (!YEREL || typeof YEREL.jpegYap !== 'function') throw e;
    return blobDataUrl(dosya).then(function (d) {
      return yerelCagir('jpegYap', [String(d).slice(String(d).indexOf(',') + 1)], 30000);
    }).then(function (r) {
      if (!r || !r.ok || typeof r.jpeg !== 'string' || r.jpeg.length < 100) throw e;
      return tarayici(dataUrlBlob('data:image/jpeg;base64,' + r.jpeg));
    });
  });
  return zamanAsimi(p, 20000, 'zaman').then(function (bmp) {
    var w = bmp.width, hh = bmp.height;
    if (!(w >= 24 && hh >= 24) || w > 20000 || hh > 20000 || w * hh > 120e6) throw new Error('olcu');
    return bmp;
  });
}
function imgIleCoz(dosya) {
  return new Promise(function (coz, red) {
    var url = URL.createObjectURL(dosya), im = new Image();
    im.decoding = 'async';
    im.onload = function () { coz({ width: im.naturalWidth, height: im.naturalHeight, kaynak: im, kapat: function () { URL.revokeObjectURL(url); } }); };
    im.onerror = function () { URL.revokeObjectURL(url); red(new Error('coz')); };
    im.src = url;
  });
}
function tuvaleCiz(bmp, enFazla) {
  var w = bmp.width, hh = bmp.height, o = Math.min(1, enFazla / Math.max(w, hh));
  var c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w * o)); c.height = Math.max(1, Math.round(hh * o));
  var x = c.getContext('2d');
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, c.width, c.height);
  x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
  x.drawImage(bmp.kaynak || bmp, 0, 0, c.width, c.height);
  return c;
}
function tuvaldenBlob(c, kalite) {
  return new Promise(function (coz) {
    try {
      c.toBlob(function (b) {
        if (b && b.size) coz(b);
        else coz(dataUrlBlob(c.toDataURL('image/jpeg', kalite)));
      }, 'image/jpeg', kalite);
    } catch (e) { coz(dataUrlBlob(c.toDataURL('image/jpeg', kalite))); }
  });
}
function dataUrlBlob(d) {
  var i = d.indexOf(','), b = atob(d.slice(i + 1)), a = new Uint8Array(b.length);
  for (var k = 0; k < b.length; k++) a[k] = b.charCodeAt(k);
  return new Blob([a], { type: 'image/jpeg' });
}
function blobDataUrl(b) {
  return new Promise(function (coz, red) {
    var r = new FileReader(); r.onload = function () { coz(r.result); }; r.onerror = function () { red(r.error); }; r.readAsDataURL(b);
  });
}
/* Dosya ya da tuvalden kayda hazır fotoğraf + analiz üretir. */
function fotografIsle(kaynak) {
  var cozum = kaynak instanceof HTMLCanvasElement ? Promise.resolve(kaynak) : resimCoz(kaynak);
  return cozum.then(function (bmp) {
    var alfa = kaynak && /png|webp|gif/i.test(kaynak.type || '');
    var buyuk = tuvaleCiz(bmp, 1024), kucuk = tuvaleCiz(bmp, 420);
    var analizTuval = analizTuvali(bmp, alfa);
    var yzVeri = '';
    if (YEREL) { try { var yt = tuvaleCiz(bmp, 480); yzVeri = yt.toDataURL('image/jpeg', 0.85); yzVeri = yzVeri.slice(yzVeri.indexOf(',') + 1); } catch (e) { yzVeri = ''; } }
    var bulutVeri = '';
    if (yzAcik()) { try { var bt = tuvaleCiz(bmp, 640); bulutVeri = bt.toDataURL('image/jpeg', 0.82); bulutVeri = bulutVeri.slice(bulutVeri.indexOf(',') + 1); } catch (e) { bulutVeri = ''; } }
    try { if (bmp.close) bmp.close(); if (bmp.kapat) bmp.kapat(); } catch (e) { }
    var analiz;
    try { analiz = analizEt(analizTuval.veri, analizTuval.w, analizTuval.h, analizTuval.alfa); }
    catch (e) { analiz = { grup: '', turlar: [], guven: 0, renk: 'siyah', renk2: '', desen: 0, sekilYok: true }; }
    var yz = yzVeri ? yerelCagir('etiketle', [yzVeri], 20000).then(function (d) {
      if (d.ok && Array.isArray(d.etiketler)) yapayZekaBirlestir(analiz, d.etiketler);
    }) : Promise.resolve();
    var bulut = bulutVeri ? yzTani(bulutVeri).catch(function () { return null; }) : Promise.resolve(null);
    return Promise.all([tuvaldenBlob(buyuk, 0.86), tuvaldenBlob(kucuk, 0.82), yz, bulut]).then(function (b) {
      /* bulut sonucu cihaz içi tanımadan sonra uygulanır: daha güvenilir olan kazanır */
      if (b[3]) bulutBirlestir(analiz, b[3]);
      return { buyuk: b[0], kucuk: b[1], analiz: analiz };
    });
  });
}
function analizTuvali(bmp, alfaOlabilir) {
  var w = bmp.width, hh = bmp.height, o = Math.min(1, 128 / Math.max(w, hh));
  var c = document.createElement('canvas');
  c.width = Math.max(8, Math.round(w * o)); c.height = Math.max(8, Math.round(hh * o));
  var x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(bmp.kaynak || bmp, 0, 0, c.width, c.height);
  var veri = x.getImageData(0, 0, c.width, c.height).data;
  var alfa = false;
  if (alfaOlabilir) { for (var i = 3; i < veri.length; i += 16) { if (veri[i] < 200) { alfa = true; break; } } }
  return { veri: veri, w: c.width, h: c.height, alfa: alfa };
}

/* ---------- Renk bilimi ---------- */
function rgbLab(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
  var X = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047, Y = r * 0.2126 + g * 0.7152 + b * 0.0722, Z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  var f = function (t) { return t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116; };
  var fx = f(X), fy = f(Y), fz = f(Z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
function hexRgb(hx) { var n = parseInt(hx.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
var RENK_LAB = RENKLER.map(function (r) { var c = hexRgb(r[1]); return { id: r[0], lab: rgbLab(c[0], c[1], c[2]) }; });
function labMesafe(a, b) { var x = a[0] - b[0], y = a[1] - b[1], z = a[2] - b[2]; return Math.sqrt(x * x + y * y + z * z); }
function enYakinRenk(lab) {
  var en = 'siyah', m = 1e9;
  RENK_LAB.forEach(function (r) {
    /* açıklık farkı biraz daha az önemli: gölge ve ışık farkını tolere eder */
    var x = (lab[0] - r.lab[0]) * 0.8, y = lab[1] - r.lab[1], z = lab[2] - r.lab[2], d = x * x + y * y + z * z;
    if (d < m) { m = d; en = r.id; }
  });
  return en;
}
function renkTon(id) {
  var r = RENK[id]; if (!r) return null;
  var c = hexRgb(r.hex), R = c[0] / 255, G = c[1] / 255, B = c[2] / 255;
  var mx = Math.max(R, G, B), mn = Math.min(R, G, B), d = mx - mn, hh = 0;
  if (d === 0) return { h: 0, s: 0, l: (mx + mn) / 2 };
  if (mx === R) hh = ((G - B) / d) % 6; else if (mx === G) hh = (B - R) / d + 2; else hh = (R - G) / d + 4;
  hh *= 60; if (hh < 0) hh += 360;
  var l = (mx + mn) / 2;
  return { h: hh, s: d / (1 - Math.abs(2 * l - 1)), l: l };
}

/* ---------- Kıyafet tanıma (cihaz içi şekil + renk analizi) ---------- */
function analizEt(px, W, H, alfaVar) {
  var N = W * H, L = new Float32Array(N), Aa = new Float32Array(N), Bb = new Float32Array(N);
  for (var i = 0; i < N; i++) { var lab = rgbLab(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]); L[i] = lab[0]; Aa[i] = lab[1]; Bb[i] = lab[2]; }
  var mask = new Uint8Array(N), b = Math.max(2, Math.round(Math.min(W, H) * 0.04));
  var kenar = [], sekilGuven = 1;
  if (alfaVar) {
    for (i = 0; i < N; i++) mask[i] = px[i * 4 + 3] > 128 ? 1 : 0;
  } else {
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      if (x < b || y < b || x >= W - b || y >= H - b) kenar.push(y * W + x);
    }
    var med = function (arr) { var s = kenar.map(function (k) { return arr[k]; }).sort(function (p, q) { return p - q; }); return s[s.length >> 1]; };
    var bg = [med(L), med(Aa), med(Bb)];
    var dl = kenar.map(function (k) { return labMesafe([L[k], Aa[k], Bb[k]], bg); }).sort(function (p, q) { return p - q; });
    var yayilim = dl[dl.length >> 1], yayilim90 = dl[Math.floor(dl.length * 0.9)];
    var esik = Math.max(13, yayilim * 3 + 6);
    if (yayilim90 > 30) sekilGuven = 0.35; else if (yayilim90 > 20) sekilGuven = 0.7;
    for (i = 0; i < N; i++) {
      var dL = L[i] - bg[0], dA = Aa[i] - bg[1], dB = Bb[i] - bg[2];
      var kroma = Math.sqrt(dA * dA + dB * dB);
      var d = Math.sqrt(dL * dL + kroma * kroma);
      var golge = dL < 0 && dL > -24 && kroma < 7; /* zemin üzerindeki yumuşak gölge */
      mask[i] = d > esik && !golge ? 1 : 0;
    }
  }
  mask = morfoloji(morfoloji(mask, W, H, 1), W, H, 0); /* kapat */
  mask = morfoloji(morfoloji(mask, W, H, 0), W, H, 1); /* aç */
  var bilesen = bilesenler(mask, W, H);
  var sonuc = { grup: '', turlar: [], guven: 0, desen: 0, renk: 'siyah', renk2: '', sekilYok: false };
  var on = null, cift = false;
  if (bilesen.length) {
    bilesen.sort(function (p, q) { return q.alan - p.alan; });
    bilesen = bilesen.slice(0, 2).map(function (c) {
      var u = new Uint8Array(N); for (var z = 0; z < N; z++) if (c.etk[z] === c.no) u[z] = 1;
      c.uyeler = u; return c;
    });
    on = bilesen[0];
    var ik = bilesen[1];
    if (ik && ik.alan > on.alan * 0.4) {
      var ust = Math.max(on.y0, ik.y0), alt = Math.min(on.y1, ik.y1);
      if (alt - ust > 0.5 * Math.min(on.y1 - on.y0, ik.y1 - ik.y0)) { cift = true; on = birlestir(on, ik); }
    }
  }
  var oran = on ? on.alan / N : 0;
  if (!on || oran < 0.04 || oran > 0.93) { sekilGuven = 0; }
  /* renk: ön plan pikselleri (şekil yoksa merkez bölge) */
  var pikseller = [];
  var adim = Math.max(1, Math.floor(Math.sqrt(N / 1600)));
  for (y = 0; y < H; y += adim) for (x = 0; x < W; x += adim) {
    var j = y * W + x;
    var al = sekilGuven > 0 ? (on && on.uyeler[j]) : (x > W * 0.2 && x < W * 0.8 && y > H * 0.2 && y < H * 0.8);
    if (al) pikseller.push([L[j], Aa[j], Bb[j]]);
  }
  if (pikseller.length < 20) for (y = 0; y < H; y += adim) for (x = 0; x < W; x += adim) { j = y * W + x; pikseller.push([L[j], Aa[j], Bb[j]]); }
  var km = kOrtalama(pikseller, 4);
  sonuc.renk = enYakinRenk(km[0].c);
  for (var k = 1; k < km.length; k++) {
    if (km[k].pay >= 0.2 && labMesafe(km[k].c, km[0].c) > 20) {
      var r2 = enYakinRenk(km[k].c); if (r2 !== sonuc.renk) { sonuc.renk2 = r2; break; }
    }
  }
  var buyukKume = km.filter(function (q) { return q.pay >= 0.12; });
  var cesit = 0;
  for (k = 0; k < buyukKume.length; k++) for (var m = k + 1; m < buyukKume.length; m++) if (labMesafe(buyukKume[k].c, buyukKume[m].c) > 22) cesit++;
  var kenarYog = kenarYogunlugu(L, W, H, sekilGuven > 0 && on ? on.uyeler : null);
  sonuc.desen = (cesit >= 3 || kenarYog > 9.5) ? 1 : 0;
  if (sekilGuven <= 0) { sonuc.sekilYok = true; return sonuc; }
  /* şekil özellikleri */
  var f = sekilOzellik(on, W, H);
  f.cift = cift;
  if (cift) f.bacak = 0; /* iki ayrı parça (ayakkabı çifti) bacak sayılmaz */
  var S = {
    ayk: cift ? 3.4 : (f.ar < 0.75 ? 2 : f.ar < 1.0 ? 0.4 : -1.5) + (f.asim > 0.22 ? 1 : 0) - f.bacak * 2.5 - f.kol * 1.2,
    canta: (cift ? -2 : 0) + (f.sap ? 3.2 : 0) + (f.ar > 0.7 && f.ar < 1.35 && f.dolu > 0.62 && f.kol < 0.15 && f.bacak < 0.15 ? 0.6 : 0),
    pantolon: f.bacak > 0.42 ? (f.ar > 1.25 ? 3.6 : 1.2) : -2,
    sort: f.bacak > 0.32 && f.ar <= 1.25 && f.ar > 0.45 ? 2.6 : -2,
    etek: (f.yamuk > 0.18 && f.kol < 0.2 && f.bacak < 0.2 && f.ar > 0.55 && f.ar < 2.2 ? 2.2 + f.yamuk * 2 - Math.max(0, f.ar - 1.5) * 1.6 : -1) - (f.sap ? 2.5 : 0) - (f.ustSeg ? 1.2 : 0) - (cift ? 2 : 0),
    elbise: (f.ar > 1.3 && f.ar < 3.2 && f.bacak < 0.22 && f.altGenis >= f.ortaGenis - 0.05 ? 1.8 + (f.yamuk > 0.1 ? 0.8 : 0) + (f.dar ? 0.6 : 0) + Math.min(1.2, Math.max(0, f.ar - 1.5) * 1.2) + (f.ustSeg ? 1.2 : 0) : -1) - (f.sap ? 2.5 : 0),
    ust: (cift ? -2.5 : 0) + (f.kol > 0.3 && f.ar > 0.55 && f.ar < 1.45 && f.bacak < 0.25 ? 2.6 : 0) + (f.ar > 0.7 && f.ar < 1.3 && f.dolu > 0.58 && f.yamuk < 0.15 ? 0.8 : 0),
    dis: cift ? -2 : f.uzunKol > 0.3 && f.ar >= 0.95 ? 2.4 + (f.ar > 1.45 ? 0.6 : 0) : 0,
    sal: !cift && (f.ar > 3 || f.ar < 0.3) ? 2.6 : 0
  };
  var adlar = Object.keys(S), ust = Math.max.apply(null, adlar.map(function (a) { return S[a]; }));
  var top = 0, P = {};
  adlar.forEach(function (a) { P[a] = Math.exp((S[a] - ust) * 1.4); top += P[a]; });
  adlar.forEach(function (a) { P[a] /= top; });
  adlar.sort(function (p, q) { return P[q] - P[p]; });
  var en = adlar[0], guven = P[en] * sekilGuven;
  if (S[en] < 1) guven *= 0.5;
  sonuc.guven = Math.round(guven * 100) / 100;
  sonuc.olasilik = P; sonuc.ozellik = f;
  var oneri = function (a) {
    var koyuMavi = /kot|lacivert|mavi|acikmavi/.test(sonuc.renk);
    switch (a) {
      case 'ayk': return cift ? ['spor', 'loafer', 'bot'] : f.ar >= 0.95 ? ['bot', 'spor', 'topuklu'] : (f.dolu < 0.42 ? ['sandalet', 'terlik', 'topuklu'] : ['spor', 'babet', 'topuklu']);
      case 'canta': return ['canta'];
      case 'pantolon': return koyuMavi ? ['kot', 'kumas', 'tayt'] : (f.darBacak && /siyah|antrasit/.test(sonuc.renk) ? ['tayt', 'kumas', 'kot'] : ['kumas', 'kot', 'esofman']);
      case 'sort': return ['sort'];
      case 'etek': return f.ar > 1.35 ? ['uzunetek', 'etek'] : ['etek', 'uzunetek'];
      case 'elbise': return f.ar > 2.1 ? ['uzunelbise', 'elbise', 'ferace'] : ['elbise', 'uzunelbise', 'tulum'];
      case 'ust': return f.uzunKol > 0.25 ? ['kazak', 'gomlek', 'sweat'] : (f.kol > 0.3 ? ['tisort', 'bluz', 'gomlek'] : ['bluz', 'tisort', 'askili']);
      case 'dis': return f.ar > 1.45 ? ['kaban', 'tren', 'mont'] : ['mont', 'ceket', 'hirka'];
      case 'sal': return ['esarp', 'atki'];
    }
    return [];
  };
  var turlar = oneri(en);
  if (adlar[1] && P[adlar[1]] > 0.18) oneri(adlar[1]).slice(0, 2).forEach(function (x) { if (turlar.indexOf(x) < 0) turlar.push(x); });
  sonuc.turlar = turlar.slice(0, 4);
  sonuc.grup = TUR[turlar[0]] ? TUR[turlar[0]].g : '';
  return sonuc;
}
function morfoloji(m, W, H, genislet) {
  var o = new Uint8Array(W * H);
  for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
    var v = genislet ? 0 : 1;
    for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
      var yy = y + dy, xx = x + dx, q = (yy < 0 || xx < 0 || yy >= H || xx >= W) ? 0 : m[yy * W + xx];
      if (genislet) { if (q) { v = 1; dy = 2; break; } } else if (!q) { v = 0; dy = 2; break; }
    }
    o[y * W + x] = v;
  }
  return o;
}
function bilesenler(m, W, H) {
  var etk = new Int32Array(W * H), liste = [], yigin = new Int32Array(W * H);
  for (var i = 0; i < W * H; i++) {
    if (!m[i] || etk[i]) continue;
    var no = liste.length + 1, bas = 0, son = 0, alan = 0, x0 = W, y0 = H, x1 = 0, y1 = 0;
    yigin[son++] = i; etk[i] = no;
    while (bas < son) {
      var p = yigin[bas++], x = p % W, y = (p / W) | 0;
      alan++;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      var komsu = [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1];
      for (var k = 0; k < 4; k++) { var q = komsu[k]; if (q >= 0 && m[q] && !etk[q]) { etk[q] = no; yigin[son++] = q; } }
    }
    if (alan >= 12) liste.push({ no: no, alan: alan, x0: x0, y0: y0, x1: x1, y1: y1 });
  }
  liste.forEach(function (c) { c.etk = etk; });
  return liste;
}
function birlestir(a, b) {
  var u = new Uint8Array(a.uyeler.length);
  for (var i = 0; i < u.length; i++) u[i] = a.uyeler[i] | b.uyeler[i];
  return { alan: a.alan + b.alan, x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1), uyeler: u };
}
function sekilOzellik(c, W, H) {
  var bw = c.x1 - c.x0 + 1, bh = c.y1 - c.y0 + 1, u = c.uyeler;
  /* delikler: kenardan ulaşılamayan boşluklar (çanta sapı) */
  var dis = new Uint8Array(W * H), q = [], i;
  for (var x = 0; x < W; x++) { q.push(x, (H - 1) * W + x); }
  for (var y = 0; y < H; y++) { q.push(y * W, y * W + W - 1); }
  q.forEach(function (p) { if (!u[p]) dis[p] = 1; });
  var yig = q.filter(function (p) { return !u[p]; });
  while (yig.length) {
    var p = yig.pop(), px = p % W, py = (p / W) | 0;
    var kn = [px > 0 ? p - 1 : -1, px < W - 1 ? p + 1 : -1, py > 0 ? p - W : -1, py < H - 1 ? p + W : -1];
    for (var k = 0; k < 4; k++) { var r = kn[k]; if (r >= 0 && !u[r] && !dis[r]) { dis[r] = 1; yig.push(r); } }
  }
  var delikUst = 0;
  for (y = c.y0; y <= c.y1; y++) for (x = c.x0; x <= c.x1; x++) {
    i = y * W + x;
    if (!u[i] && !dis[i] && y < c.y0 + bh * 0.55) delikUst++;
  }
  var bantlar = [], NB = 20;
  for (var bnt = 0; bnt < NB; bnt++) {
    var ya = c.y0 + Math.floor(bh * bnt / NB), yb = Math.max(ya, c.y0 + Math.floor(bh * (bnt + 1) / NB) - 1);
    var segToplam = [], aciklik = [], bosluk = [];
    for (y = ya; y <= yb; y++) {
      var seg = 0, ic = false, sol = -1, sag = -1, enBos = 0, bosBas = -1, bosMerkez = 0;
      for (x = c.x0; x <= c.x1; x++) {
        var v = u[y * W + x] || !dis[y * W + x];
        if (v && !ic) { seg++; ic = true; if (sol < 0) sol = x; if (bosBas >= 0) { var bu = x - bosBas; if (bu > enBos) { enBos = bu; bosMerkez = (bosBas + x) / 2; } } }
        if (!v && ic) { ic = false; bosBas = x; }
        if (v) sag = x;
      }
      segToplam.push(seg); aciklik.push(sol < 0 ? 0 : (sag - sol + 1) / bw);
      bosluk.push({ w: enBos / bw, m: bw ? (bosMerkez - c.x0) / bw : 0 });
    }
    segToplam.sort(function (a, b) { return a - b; }); aciklik.sort(function (a, b) { return a - b; });
    bosluk.sort(function (a, b) { return a.w - b.w; });
    bantlar.push({ seg: segToplam[segToplam.length >> 1], acik: aciklik[aciklik.length >> 1], bos: bosluk[bosluk.length >> 1] });
  }
  var ort = function (a, b, alan) { var s = 0, n = 0; for (var k = a; k <= b; k++) { s += bantlar[k][alan]; n++; } return s / n; };
  var bacak = 0, darBacak = 0;
  for (var k2 = 11; k2 < NB; k2++) {
    var bb = bantlar[k2];
    if (bb.seg >= 2 && bb.bos.w >= 0.06 && bb.bos.m > 0.28 && bb.bos.m < 0.72) { bacak++; if (bb.bos.w > 0.25) darBacak++; }
  }
  bacak /= (NB - 11); darBacak = darBacak / (NB - 11) > 0.4;
  var ustGenis = ort(0, 2, 'acik'), omuz = ort(2, 6, 'acik'), ortaGenis = ort(8, 11, 'acik'), altGenis = ort(16, 19, 'acik');
  var kol = 0, uzunKol = 0;
  for (k2 = 2; k2 <= 7; k2++) if (bantlar[k2].seg >= 3) kol++;
  kol = kol / 6;
  if (omuz - ortaGenis > 0.16) kol = Math.max(kol, 0.5);
  for (k2 = 8; k2 <= 14; k2++) if (bantlar[k2].seg >= 3) uzunKol++;
  uzunKol /= 7;
  var yamuk = altGenis - ort(0, 3, 'acik');
  /* asimetri: üst yarıda sol/sağ kütle farkı (ayakkabı yüksek topuk/bilek) */
  var solK = 0, sagK = 0, mx = c.x0 + bw / 2;
  for (y = c.y0; y < c.y0 + bh / 2; y++) for (x = c.x0; x <= c.x1; x++) if (u[y * W + x]) { if (x < mx) solK++; else sagK++; }
  var asim = (solK + sagK) ? Math.abs(solK - sagK) / (solK + sagK) : 0;
  return {
    ar: bh / bw, dolu: c.alan / (bw * bh), bacak: bacak, darBacak: darBacak, kol: kol, uzunKol: uzunKol, yamuk: yamuk,
    ustGenis: ustGenis, ortaGenis: ortaGenis, altGenis: altGenis, asim: asim,
    sap: delikUst > bw * bh * 0.02, dar: ustGenis < altGenis - 0.15, ustSeg: bantlar[0].seg >= 2 || bantlar[1].seg >= 2
  };
}
function kOrtalama(noktalar, k) {
  var n = noktalar.length; k = Math.min(k, n);
  var merkez = [noktalar[(n / 2) | 0].slice()];
  while (merkez.length < k) {
    var enUzak = 0, enD = -1;
    for (var i = 0; i < n; i += 3) {
      var dm = 1e9; for (var j = 0; j < merkez.length; j++) dm = Math.min(dm, labMesafe(noktalar[i], merkez[j]));
      if (dm > enD) { enD = dm; enUzak = i; }
    }
    merkez.push(noktalar[enUzak].slice());
  }
  var ata = new Int32Array(n);
  for (var tur = 0; tur < 10; tur++) {
    for (i = 0; i < n; i++) { var en = 0, m = 1e9; for (j = 0; j < k; j++) { var d = labMesafe(noktalar[i], merkez[j]); if (d < m) { m = d; en = j; } } ata[i] = en; }
    var top = merkez.map(function () { return [0, 0, 0, 0]; });
    for (i = 0; i < n; i++) { var tt = top[ata[i]]; tt[0] += noktalar[i][0]; tt[1] += noktalar[i][1]; tt[2] += noktalar[i][2]; tt[3]++; }
    for (j = 0; j < k; j++) if (top[j][3]) merkez[j] = [top[j][0] / top[j][3], top[j][1] / top[j][3], top[j][2] / top[j][3]];
  }
  var say = merkez.map(function () { return 0; });
  for (i = 0; i < n; i++) say[ata[i]]++;
  return merkez.map(function (c, j) { return { c: c, pay: say[j] / n }; }).sort(function (a, b) { return b.pay - a.pay; });
}
function kenarYogunlugu(L, W, H, uye) {
  var s = 0, n = 0;
  for (var y = 1; y < H - 1; y++) for (var x = 1; x < W - 1; x++) {
    var i = y * W + x;
    if (uye && (!uye[i] || !uye[i - 1] || !uye[i + 1] || !uye[i - W] || !uye[i + W])) continue;
    s += Math.abs(L[i + 1] - L[i - 1]) + Math.abs(L[i + W] - L[i - W]); n++;
  }
  return n ? s / n : 0;
}

/* ---------- Yapay zekâ etiketleri (Google ML Kit, telefonun içinde) ----------
   Etiket → kesin tür ya da yalnızca grup. Şekil analiziyle birleştirilir. */
var YZ_TUR = { Jeans: 'kot', Denim: 'kot', Shorts: 'sort', Leggings: 'tayt', Tights: 'kulotlu', Dress: 'elbise', Gown: 'uzunelbise', Sari: 'uzunelbise',
  Blazer: 'blazer', Tuxedo: 'blazer', Sneakers: 'spor', Handbag: 'canta', Bag: 'canta', Scarf: 'atki', Veil: 'esarp', Hat: 'bere', Cap: 'bere', Beanie: 'bere',
  Sunglasses: 'gozluk', Glasses: 'gozluk', Necklace: 'taki', Bracelet: 'taki', Bangle: 'taki', Jewellery: 'taki', Chain: 'taki', Jersey: 'tisort' };
var YZ_GRUP = { Outerwear: 'dis', Shoe: 'ayk', Fur: 'dis' };
function yapayZekaBirlestir(an, etiketler) {
  var en = null;
  etiketler.forEach(function (e) {
    if (!e || typeof e.t !== 'string' || !sayiMi(e.c)) return;
    if (e.t === 'Pattern' && e.c >= 0.6) an.desen = 1;
    var tur = YZ_TUR[e.t], grup = tur ? TUR[tur].g : YZ_GRUP[e.t];
    if (!grup || e.c < 0.55) return;
    /* Denim üst gruptaysa kot ceket olabilir */
    if (e.t === 'Denim' && (an.grup === 'dis' || an.grup === 'ust')) { tur = 'ceket'; grup = 'dis'; }
    if (!en || e.c > en.c) en = { c: e.c, tur: tur, grup: grup };
  });
  an.yzEtiket = etiketler.slice(0, 8);
  if (!en) return;
  var liste = an.turlar.slice();
  if (en.tur) {
    liste = [en.tur].concat(liste.filter(function (x) { return x !== en.tur; }));
  } else if (an.grup !== en.grup) {
    liste = TURLER.filter(function (x) { return x.g === en.grup; }).map(function (x) { return x.id; }).slice(0, 3);
  }
  an.turlar = liste.slice(0, 4);
  an.grup = en.grup;
  an.guven = Math.max(en.tur ? en.c : Math.min(an.guven, 0.49), an.grup === en.grup && an.guven >= 0.5 ? an.guven : 0);
  if (!en.tur && an.grup === en.grup && an.turlar[0] && TUR[an.turlar[0]].g === en.grup) an.guven = Math.max(an.guven, Math.min(0.75, (an.guven + en.c) / 2 + 0.2));
  an.yz = true;
  an.sekilYok = false;
}

/* ---------- Arka plan silme ----------
   Telefonda Google ML Kit (konu ayırma) kullanılır; yoksa ya da model hazır değilse
   uygulamanın kendi zemin analiziyle kesilir. Sonuç saydam WebP olarak saklanır. */
function arkaPlanSil(blob) {
  var yerel = YEREL && typeof YEREL.arkaSil === 'function'
    ? blobDataUrl(blob).then(function (d) { return yerelCagir('arkaSil', [d.slice(d.indexOf(',') + 1)], 60000); }).then(function (d) {
      if (!d.ok || typeof d.png !== 'string' || d.png.length > 20e6) return null;
      return resimCoz(dataUrlBlob2('data:image/png;base64,' + d.png, 'image/png')).then(function (bmp) {
        var c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height;
        c.getContext('2d').drawImage(bmp.kaynak || bmp, 0, 0);
        try { if (bmp.close) bmp.close(); if (bmp.kapat) bmp.kapat(); } catch (e) { }
        return c;
      });
    }).catch(function () { return null; })
    : Promise.resolve(null);
  return yerel.then(function (c) {
    if (c) return c;
    return resimCoz(blob).then(function (bmp) {
      var r = zeminAyir(bmp);
      try { if (bmp.close) bmp.close(); if (bmp.kapat) bmp.kapat(); } catch (e) { }
      if (!r) throw new Error('kesilemedi');
      return r;
    });
  }).then(function (c) {
    var kirpik = saydamKirp(c);
    if (!kirpik) throw new Error('kesilemedi');
    var buyuk = olcekle(kirpik, 1024), kucuk = olcekle(kirpik, 420);
    var px = olcekle(kirpik, 128), x = px.getContext('2d', { willReadFrequently: true });
    var analiz = null;
    try { analiz = analizEt(x.getImageData(0, 0, px.width, px.height).data, px.width, px.height, true); } catch (e) { }
    return Promise.all([saydamBlob(buyuk, 0.9), saydamBlob(kucuk, 0.85)]).then(function (b) { return { buyuk: b[0], kucuk: b[1], analiz: analiz }; });
  });
}
function dataUrlBlob2(d, tur) {
  var i = d.indexOf(','), b = atob(d.slice(i + 1)), a = new Uint8Array(b.length);
  for (var k = 0; k < b.length; k++) a[k] = b.charCodeAt(k);
  return new Blob([a], { type: tur });
}
function olcekle(c, enFazla) {
  var o = Math.min(1, enFazla / Math.max(c.width, c.height));
  var d = document.createElement('canvas'); d.width = Math.max(1, Math.round(c.width * o)); d.height = Math.max(1, Math.round(c.height * o));
  var x = d.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(c, 0, 0, d.width, d.height);
  return d;
}
function saydamBlob(c, kalite) {
  return new Promise(function (coz) {
    try { c.toBlob(function (b) { if (b && b.size) coz(b); else c.toBlob(function (p) { coz(p); }, 'image/png'); }, 'image/webp', kalite); }
    catch (e) { coz(dataUrlBlob2(c.toDataURL('image/png'), 'image/png')); }
  });
}
/* Saydam olmayan alanın çevresini %6 boşlukla kırp */
function saydamKirp(c) {
  var x = c.getContext('2d', { willReadFrequently: true }), W = c.width, H = c.height;
  var d = x.getImageData(0, 0, W, H).data, x0 = W, y0 = H, x1 = -1, y1 = -1, dolu = 0;
  for (var y = 0; y < H; y += 2) for (var i = 0; i < W; i += 2) {
    if (d[(y * W + i) * 4 + 3] > 40) { dolu++; if (i < x0) x0 = i; if (i > x1) x1 = i; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 < 0 || dolu < (W * H / 4) * 0.02) return null;
  var p = Math.round(Math.max(x1 - x0, y1 - y0) * 0.06);
  x0 = Math.max(0, x0 - p); y0 = Math.max(0, y0 - p); x1 = Math.min(W - 1, x1 + p); y1 = Math.min(H - 1, y1 + p);
  var o = document.createElement('canvas'); o.width = x1 - x0 + 1; o.height = y1 - y0 + 1;
  o.getContext('2d').drawImage(c, x0, y0, o.width, o.height, 0, 0, o.width, o.height);
  return o;
}
/* Uygulamanın kendi zemin ayırma yöntemi (sade zeminli fotoğraflar için) */
function zeminAyir(bmp) {
  var buyuk = tuvaleCiz(bmp, 1024);
  var W = buyuk.width, H = buyuk.height, o = Math.min(1, 200 / Math.max(W, H));
  var kw = Math.max(8, Math.round(W * o)), kh = Math.max(8, Math.round(H * o));
  var k = document.createElement('canvas'); k.width = kw; k.height = kh;
  var kx = k.getContext('2d', { willReadFrequently: true }); kx.drawImage(buyuk, 0, 0, kw, kh);
  var px = kx.getImageData(0, 0, kw, kh).data, N = kw * kh;
  var L = new Float32Array(N), A2 = new Float32Array(N), B2 = new Float32Array(N), i;
  for (i = 0; i < N; i++) { var lab = rgbLab(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]); L[i] = lab[0]; A2[i] = lab[1]; B2[i] = lab[2]; }
  var b = Math.max(2, Math.round(Math.min(kw, kh) * 0.04)), kenar = [];
  for (var y = 0; y < kh; y++) for (var x = 0; x < kw; x++) if (x < b || y < b || x >= kw - b || y >= kh - b) kenar.push(y * kw + x);
  var med = function (arr) { var s = kenar.map(function (q) { return arr[q]; }).sort(function (p, q) { return p - q; }); return s[s.length >> 1]; };
  var bg = [med(L), med(A2), med(B2)];
  var dl = kenar.map(function (q) { return labMesafe([L[q], A2[q], B2[q]], bg); }).sort(function (p, q) { return p - q; });
  if (dl[Math.floor(dl.length * 0.9)] > 26) return null; /* zemin karışık: güvenle kesilemez */
  var esik = Math.max(12, dl[dl.length >> 1] * 3 + 6), m = new Uint8Array(N);
  for (i = 0; i < N; i++) {
    var dL = L[i] - bg[0], dA = A2[i] - bg[1], dB = B2[i] - bg[2], kr = Math.sqrt(dA * dA + dB * dB);
    m[i] = Math.sqrt(dL * dL + kr * kr) > esik && !(dL < 0 && dL > -24 && kr < 7) ? 1 : 0;
  }
  m = morfoloji(morfoloji(m, kw, kh, 1), kw, kh, 0);
  m = morfoloji(morfoloji(m, kw, kh, 0), kw, kh, 1);
  var bl = bilesenler(m, kw, kh); if (!bl.length) return null;
  bl.sort(function (p, q) { return q.alan - p.alan; });
  var tut = {}; tut[bl[0].no] = 1; if (bl[1] && bl[1].alan > bl[0].alan * 0.4) tut[bl[1].no] = 1;
  var etk = bl[0].etk, son = new Uint8Array(N), alan = 0;
  for (i = 0; i < N; i++) if (tut[etk[i]]) { son[i] = 1; alan++; }
  if (alan < N * 0.04 || alan > N * 0.93) return null;
  /* delikleri doldur (kenardan ulaşılamayan küçük boşluklar) */
  var dis = new Uint8Array(N), yig = [];
  for (x = 0; x < kw; x++) { yig.push(x, (kh - 1) * kw + x); } for (y = 0; y < kh; y++) { yig.push(y * kw, y * kw + kw - 1); }
  yig = yig.filter(function (q) { return !son[q]; }); yig.forEach(function (q) { dis[q] = 1; });
  while (yig.length) {
    var q = yig.pop(), qx = q % kw, qy = (q / kw) | 0;
    [qx > 0 ? q - 1 : -1, qx < kw - 1 ? q + 1 : -1, qy > 0 ? q - kw : -1, qy < kh - 1 ? q + kw : -1].forEach(function (r) { if (r >= 0 && !son[r] && !dis[r]) { dis[r] = 1; yig.push(r); } });
  }
  var maske = document.createElement('canvas'); maske.width = kw; maske.height = kh;
  var mx = maske.getContext('2d'), md = mx.createImageData(kw, kh);
  for (i = 0; i < N; i++) { var a = son[i] || !dis[i] ? 255 : 0; md.data[i * 4 + 3] = a; }
  mx.putImageData(md, 0, 0);
  var sonuc = document.createElement('canvas'); sonuc.width = W; sonuc.height = H;
  var sx = sonuc.getContext('2d');
  sx.drawImage(buyuk, 0, 0);
  sx.globalCompositeOperation = 'destination-in';
  sx.imageSmoothingEnabled = true; sx.imageSmoothingQuality = 'high';
  try { sx.filter = 'blur(' + Math.max(1, Math.round(W / kw * 0.6)) + 'px)'; } catch (e) { }
  sx.drawImage(maske, 0, 0, W, H);
  return sonuc;
}
