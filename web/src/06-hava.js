/* ---------- Konum ---------- */
function konumBul() {
  if (A.konum) return Promise.resolve({ lat: A.konum.lat, lon: A.konum.lon, ad: A.konum.ad, elle: true });
  if (YEREL && typeof YEREL.konum === 'function') {
    return yerelCagir('konum', [], 25000).then(function (d) {
      if (d.ok && sayiMi(d.lat) && sayiMi(d.lon) && Math.abs(d.lat) <= 90 && Math.abs(d.lon) <= 180) {
        var k = { lat: Math.round(d.lat * 100) / 100, lon: Math.round(d.lon * 100) / 100, ad: kirp(d.ad, 60) || enYakinSehir(d.lat, d.lon) };
        LS.yaz('sonKonum', k); return k;
      }
      var e = LS.al('sonKonum', null);
      if (d.hata !== 'izin' && d.hata !== 'kapali' && konumGecerli(e)) return { lat: e.lat, lon: e.lon, ad: e.ad, eski: true };
      return d.hata === 'kapali' ? { kapali: true } : null;
    });
  }
  return new Promise(function (coz) {
    var bitti = false, son = function (v) { if (!bitti) { bitti = true; coz(v); } };
    var yedek = function () { var k = LS.al('sonKonum', null); son(konumGecerli(k) ? { lat: k.lat, lon: k.lon, ad: k.ad, eski: true } : null); };
    if (!navigator.geolocation) return yedek();
    setTimeout(yedek, 14000);
    try {
      navigator.geolocation.getCurrentPosition(function (p) {
        var lat = Math.round(sinirla(p.coords.latitude, -90, 90) * 100) / 100, lon = Math.round(sinirla(p.coords.longitude, -180, 180) * 100) / 100;
        var k = { lat: lat, lon: lon, ad: enYakinSehir(lat, lon) };
        LS.yaz('sonKonum', k); son(k);
      }, yedek, { enableHighAccuracy: false, timeout: 12000, maximumAge: 30 * 60000 });
    } catch (e) { yedek(); }
  });
}

/* ---------- Hava durumu (MET Norway, CC BY 4.0) ---------- */
var havaIstekte = null;
function havaGetir(lat, lon, zorla, anahtar) {
  anahtar = anahtar || 'hava';
  lat = Math.round(lat * 100) / 100; lon = Math.round(lon * 100) / 100;
  var on = LS.al(anahtar, null), simdi = Date.now();
  var ayniYer = on && sayiMi(on.lat) && Math.abs(on.lat - lat) < 0.06 && Math.abs(on.lon - lon) < 0.06 && Array.isArray(on.saatler);
  if (ayniYer && !zorla && simdi - on.alindi < 45 * 60000 && simdi - on.alindi >= 0) return Promise.resolve(on);
  if (ayniYer && zorla && simdi - on.alindi < 60000) return Promise.resolve(on); /* çok sık yenilemeyi engelle */
  if (havaIstekte && anahtar === 'hava') return havaIstekte;
  var kontrol = window.AbortController ? new AbortController() : null;
  var z = setTimeout(function () { if (kontrol) kontrol.abort(); }, 12000);
  var istek = fetch(HAVA_ADRES + '?lat=' + lat.toFixed(2) + '&lon=' + lon.toFixed(2), {
    method: 'GET', mode: 'cors', credentials: 'omit', cache: 'no-cache', redirect: 'error', signal: kontrol ? kontrol.signal : undefined
  }).then(function (r) {
    if (!r.ok) throw new Error('http ' + r.status);
    var uz = +r.headers.get('content-length');
    if (uz && uz > 3e6) throw new Error('buyuk');
    return r.text();
  }).then(function (metin) {
    if (metin.length > 3e6) throw new Error('buyuk');
    var veri = havaAyikla(JSON.parse(metin));
    var kayit = { lat: lat, lon: lon, alindi: Date.now(), saatler: veri };
    LS.yaz(anahtar, kayit);
    return kayit;
  }).catch(function (e) {
    if (ayniYer && simdi - on.alindi < 30 * 3600000) { on.eski = true; return on; }
    throw e;
  }).then(function (v) { clearTimeout(z); if (anahtar === 'hava') havaIstekte = null; return v; }, function (e) { clearTimeout(z); if (anahtar === 'hava') havaIstekte = null; throw e; });
  if (anahtar === 'hava') havaIstekte = istek;
  return istek;
}
function havaAyikla(j) {
  var ts = j && j.properties && j.properties.timeseries;
  if (!Array.isArray(ts) || !ts.length) throw new Error('bicim');
  var cikti = [];
  for (var i = 0; i < ts.length && cikti.length < 160; i++) {
    var s = ts[i]; if (!s || typeof s.time !== 'string') continue;
    var t = Date.parse(s.time); if (!isFinite(t)) continue;
    var d = s.data && s.data.instant && s.data.instant.details; if (!d || !sayiMi(d.air_temperature)) continue;
    var n1 = s.data.next_1_hours, n6 = s.data.next_6_hours;
    var sembol = (n1 && n1.summary && n1.summary.symbol_code) || (n6 && n6.summary && n6.summary.symbol_code) || '';
    var yag = n1 && n1.details && sayiMi(n1.details.precipitation_amount) ? n1.details.precipitation_amount
      : (n6 && n6.details && sayiMi(n6.details.precipitation_amount) ? n6.details.precipitation_amount / 6 : 0);
    cikti.push({
      t: t, T: sinirla(d.air_temperature, -60, 60), v: sinirla(d.wind_speed || 0, 0, 80), rh: sinirla(d.relative_humidity || 50, 0, 100),
      s: typeof sembol === 'string' ? sembol.replace(/[^a-z_]/g, '').slice(0, 40) : '', y: sinirla(yag, 0, 200)
    });
  }
  if (cikti.length < 3) throw new Error('bicim');
  return cikti;
}
function hissedilen(T, v, rh) {
  var kmh = v * 3.6;
  if (T <= 10 && kmh > 4.8) return 13.12 + 0.6215 * T - 11.37 * Math.pow(kmh, 0.16) + 0.3965 * T * Math.pow(kmh, 0.16);
  if (T >= 27 && rh >= 40) {
    var e = rh / 100 * 6.105 * Math.exp(17.27 * T / (237.7 + T));
    return T + 0.33 * e - 0.7 * v - 4;
  }
  return T;
}
/* gun: 0 bugün, 1 yarın; pencere: {bas, son} saat */
function gunOzeti(kayit, gun, pencere) {
  var bugun = new Date(); bugun.setHours(0, 0, 0, 0);
  var g0 = bugun.getTime() + gun * 86400000;
  var bas = g0 + pencere.bas * 3600000, son = g0 + pencere.son * 3600000;
  if (gun === 0) bas = Math.max(bas, Date.now() - 3600000);
  var saatler = kayit.saatler.filter(function (s) { return s.t >= bas && s.t <= son; });
  if (saatler.length < 2) saatler = kayit.saatler.filter(function (s) { return s.t >= Date.now() - 3600000; }).slice(0, 6);
  if (!saatler.length) return null;
  var T = saatler.map(function (s) { return s.T; });
  var H = saatler.map(function (s) { return hissedilen(s.T, s.v, s.rh); });
  var ozet = {
    min: Math.min.apply(null, T), max: Math.max.apply(null, T),
    his: H.reduce(function (a, b) { return a + b; }, 0) / H.length,
    hisMin: Math.min.apply(null, H), hisMax: Math.max.apply(null, H),
    yag: saatler.reduce(function (a, s) { return a + s.y; }, 0),
    yagSaat: saatler.filter(function (s) { return s.y >= 0.2 || /rain|sleet|shower/.test(s.s); }).length,
    kar: saatler.some(function (s) { return /snow|sleet/.test(s.s); }),
    firtina: saatler.some(function (s) { return /thunder/.test(s.s); }),
    ruzgar: Math.max.apply(null, saatler.map(function (s) { return s.v; })),
    gunes: saatler.filter(function (s) { return /clearsky|fair/.test(s.s); }).length / saatler.length,
    sis: saatler.filter(function (s) { return /fog/.test(s.s); }).length / saatler.length > 0.3,
    simdi: saatler[0].T, eski: !!kayit.eski, alindi: kayit.alindi, gun: gun
  };
  /* kişisel ısı tercihi: üşüyen için hava 3° daha soğuk sayılır */
  ozet.kisisel = ozet.his + A.isi * 3;
  ozet.yagmur = ozet.yagSaat >= 2 || ozet.yag >= 1.2;
  ozet.ruzgarli = ozet.ruzgar >= 8.5;
  var orta = saatler[Math.min(saatler.length - 1, Math.floor(saatler.length / 2))].s;
  ozet.sembol = ozet.firtina ? 'thunder' : ozet.kar ? 'snow' : ozet.yagmur ? 'rain' : ozet.sis ? 'fog' : (orta || 'cloudy');
  return ozet;
}
function havaIkonu(s) {
  if (/thunder/.test(s)) return 'simsek';
  if (/snow|sleet/.test(s)) return 'kar';
  if (/rain|shower/.test(s)) return 'yagmur';
  if (/fog/.test(s)) return 'sis';
  if (/clearsky|fair/.test(s)) return /night/.test(s) ? 'ay' : 'gunes';
  if (/partly/.test(s)) return 'parcali';
  return 'bulut';
}
function havaDurumMetni(o) {
  if (o.firtina) return t('hvFirtina');
  if (o.kar) return t('hvKar');
  if (o.yagmur) return o.yag > 8 ? t('hvSaganak') : t('hvYagmur');
  if (o.yagSaat === 1) return t('hvHafifYagmur');
  if (o.sis) return t('hvSis');
  if (o.gunes > 0.6) return /night/.test(o.sembol) ? t('hvAcikGece') : t('hvAcik');
  if (o.gunes > 0.25 || /partly/.test(o.sembol)) return t('hvParcali');
  return t('hvBulutlu');
}
/* Ağ yoksa ve hiç veri yoksa kullanıcının seçtiği kaba hava */
function elleHava(tip) {
  var tablo = { soguk: 3, serin: 11, ilik: 19, sicak: 28 };
  var his = tablo[tip.sicaklik] !== undefined ? tablo[tip.sicaklik] : 16;
  return {
    min: his - 3, max: his + 3, his: his, hisMin: his - 3, hisMax: his + 3, yag: tip.yagmur ? 3 : 0, yagSaat: tip.yagmur ? 4 : 0,
    kar: false, firtina: false, ruzgar: 3, gunes: tip.yagmur ? 0 : 0.5, sis: false, simdi: his, eski: false, alindi: Date.now(), gun: 0,
    kisisel: his + A.isi * 3, yagmur: !!tip.yagmur, ruzgarli: false, sembol: tip.yagmur ? 'rain' : 'partlycloudy', elle: true
  };
}
