/* ---------- Ayarlar ---------- */
function ayarlarSayfasi() {
  var gov = h('div');
  function satir(ik, baslik, alt, fn, sag) {
    return h('button', { class: 'satir', on: { click: fn } },
      h('span', { class: 'sol' }, ikon(ik), h('div', null, baslik, alt ? h('small', { text: alt }) : null)), sag || ikon('sag', 'k'));
  }
  function ciz3() {
    temizle(gov);
    /* görünüm */
    var tema = temaSecimi();
    var temaSeg = h('div', { class: 'seg' });
    [['oto', 'temaOto'], ['acik', 'temaAcik'], ['koyu', 'temaKoyu']].forEach(function (x) {
      temaSeg.appendChild(h('button', { 'aria-pressed': tema === x[0] ? 'true' : 'false', text: t(x[1]), on: { click: function () { temaUygula(x[0]); ciz3(); ciz(); } } }));
    });
    var dilSeg = h('div', { class: 'seg' });
    [['tr', 'Türkçe'], ['en', 'English']].forEach(function (x) {
      dilSeg.appendChild(h('button', { 'aria-pressed': A.dil === x[0] ? 'true' : 'false', text: x[1], on: { click: function () { A.dil = x[0]; ayarKaydet(); s.kapat(); ciz(); setTimeout(ayarlarSayfasi, 320); } } }));
    });
    gov.appendChild(h('div', { class: 'bolum' }, h('span', { class: 'etk', text: t('gorunum') }),
      h('div', { class: 'ayar-grup' },
        h('div', { class: 'satir' }, h('span', { class: 'sol' }, ikon(document.documentElement.getAttribute('data-tema') === 'koyu' ? 'ay' : 'gunes'), h('div', null, t('tema'))), temaSeg),
        h('div', { class: 'satir' }, h('span', { class: 'sol' }, ikon('dil'), h('div', null, t('dil'))), dilSeg))));
    /* kişisel */
    var isiSeg = h('div', { class: 'seg' });
    [[-1, 'isiUsur'], [0, 'isiNormal'], [1, 'isiSicaklar']].forEach(function (x) {
      isiSeg.appendChild(h('button', { 'aria-pressed': A.isi === x[0] ? 'true' : 'false', text: t(x[1]), on: { click: function () { A.isi = x[0]; ayarKaydet(); S.sonuc = null; ciz3(); ciz(); } } }));
    });
    gov.appendChild(h('div', { class: 'bolum' }, h('span', { class: 'etk', text: t('kisisel') }),
      h('div', { class: 'ayar-grup' },
        satir('konum', t('konum'), A.konum ? A.konum.ad : t('otomatikKonum'), sehirSec),
        h('div', { class: 'satir', style: { 'flex-wrap': 'wrap' } }, h('span', { class: 'sol' }, ikon('termometre'), h('div', null, t('isiHissi'), h('small', { text: t('isiHissiAlt') }))), isiSeg),
        anahtarSatir(t('tesettur'), t('tesetturAlt'), A.tesettur, function (v) { A.tesettur = v; ayarKaydet(); S.sonuc = null; ciz(); }, 'esarp'),
        anahtarSatir(t('kendiMod'), t('kendiModAlt'), A.kendiMod, function (v) { A.kendiMod = v; ayarKaydet(); S.sonuc = null; }, 'kalp'),
        satir('aski', t('kategorilerim'), t('kategorilerimAlt', A.ozelTur.length), kategoriSayfasi))));
    /* pro ve destek */
    gov.appendChild(h('div', { class: 'bolum' }, h('span', { class: 'etk', text: t('proBaslik') }),
      h('div', { class: 'ayar-grup' },
        satir('tac', S.pro ? t('proAcik') : t('proyaGec'), S.pro ? t('proAcikAlt') : t('proAlt', Math.max(0, UCRETSIZ_HAK - hakKullanilan())), function () { if (!S.pro) proSayfasi(); }, S.pro ? ikon('tik', 'k') : null),
        satir('yenile', t('geriYukle'), null, satinAlimlariGeriYukle),
        satir('fincan', t('destekle'), t('destekleAlt'), destekSayfasi))));
    /* veriler */
    gov.appendChild(h('div', { class: 'bolum' }, h('span', { class: 'etk', text: t('verilerim') }),
      h('div', { class: 'ayar-grup' },
        satir('indir', t('yedekAl'), t('yedekAlAlt'), yedekAl),
        satir('yukle', t('yedekYukle'), t('yedekYukleAlt'), function () { $('#yedekSec').click(); }),
        satir('kalkan', t('gizlilik'), t('gizlilikAlt'), gizlilikSayfasi),
        satir('cop', t('hepsiniSil'), t('hepsiniSilAlt'), hepsiniSil))));
    gov.appendChild(h('p', { class: 'alt-yazi', style: { 'margin-top': '18px', 'font-size': '12px' }, text: 'Kombinle ' + (YEREL && YEREL.surum ? kirp(YEREL.surum(), 20) : SURUM) + ', matali. ' + t('kaynakMetUzun') }));
  }
  var s = sayfaAc({ baslik: t('ayarlar'), icerik: gov });
  ciz3();
}
function sehirSec() {
  var liste = h('div');
  var ara = h('input', { class: 'metin', type: 'search', placeholder: t('sehirAra'), maxlength: '40', 'data-odak': '1', on: { input: function () { doldur(); } } });
  function doldur() {
    temizle(liste);
    var q = katla(kirp(ara.value, 40).toLocaleLowerCase('tr'));
    liste.appendChild(h('button', { class: 'sehir', on: { click: function () { A.konum = null; ayarKaydet(); s.kapat(); havaYukle(true); } } },
      h('span', { style: { display: 'inline-flex', gap: '8px', 'align-items': 'center', color: 'var(--vurgu)', 'font-weight': '500' } }, ikon('konum', 'k'), t('otomatikKonum'))));
    SEHIRLER.filter(function (x) { return !q || katla(x.ad.toLocaleLowerCase('tr')).indexOf(q) >= 0; })
      .sort(function (a, b) { return a.ad.localeCompare(b.ad, 'tr'); })
      .forEach(function (x) {
        liste.appendChild(h('button', { class: 'sehir', text: x.ad, on: { click: function () { A.konum = { lat: x.lat, lon: x.lon, ad: x.ad }; ayarKaydet(); S.elleHava = null; s.kapat(); havaYukle(true); } } }));
      });
  }
  var s = sayfaAc({ baslik: t('sehirSec'), icerik: h('div', null, h('div', { class: 'liste-ara' }, ara), liste) });
  doldur();
}

/* ---------- Satın alma (Google Play, APK Atölyesi köprüsü) ---------- */
function odemeHazir() { var o = odeme(); return !!(o && typeof o.buy === 'function'); }
function odemeBekle(ms) {
  if (odemeHazir()) return Promise.resolve(true);
  return new Promise(function (coz) {
    var bas = Date.now(), z = setInterval(function () {
      if (odemeHazir()) { clearInterval(z); coz(true); } else if (Date.now() - bas > ms) { clearInterval(z); coz(false); }
    }, 150);
  });
}
function proDurumuDenetle() {
  return odemeBekle(4000).then(function (var_) {
    if (!var_) return;
    var sahip = false;
    try { sahip = !!odeme().owned(PRO_URUN); } catch (e) { }
    if (sahip !== S.pro || A.pro !== sahip) { S.pro = sahip; A.pro = sahip; ayarKaydet(); ciz(); }
  });
}
function proSayfasi(oz) {
  if (S.pro) return;
  if (typeof oz !== 'string') oz = '';
  var fiyat = h('p', { class: 'pro-fiyat', text: S.fiyat || '' });
  var kalan = Math.max(0, UCRETSIZ_HAK - hakKullanilan());
  var icerik = h('div', null,
    h('p', { class: 'alt-yazi', text: oz ? t('ozBitti', t('oz_' + oz)) : kalan > 0 ? t('proLead', kalan) : t('proLeadBitti') }),
    fiyat,
    [['isilti', 'proO1'], ['tac', 'proO5'], ['takvim', 'proO6'], ['yenile', 'proO3'], ['kalkan', 'proO4']].map(function (x) {
      return h('div', { class: 'pro-ozellik' }, ikon(x[0]), h('span', { text: t(x[1]) }));
    }));
  var al = h('button', { class: 'btn altin', on: { click: satinAl } }, ikon('tac', 'k'), t('proyaGec'));
  var s = sayfaAc({ baslik: t('proBaslik'), icerik: icerik, altBar: [h('button', { class: 'btn ikincil', on: { click: function () { s.kapat(); } }, text: t('simdiDegil') }), al] });
  if (odemeHazir() && !S.fiyat) {
    zamanAsimi(odeme().products([PRO_URUN]), 10000).then(function (l) {
      var u = (l || []).filter(function (x) { return x && x.id === PRO_URUN; })[0];
      if (u && typeof u.price === 'string') { S.fiyat = kirp(u.price, 24); fiyat.textContent = S.fiyat; }
    }).catch(function () { });
  }
  var alimda = false;
  function satinAl() {
    if (alimda) return;
    if (!odemeHazir()) { tost(t('odemeYok')); return; }
    alimda = true; al.disabled = true;
    zamanAsimi(odeme().buy(PRO_URUN), 180000).then(function (ok) {
      var sahip = false; try { sahip = !!odeme().owned(PRO_URUN); } catch (e) { }
      if (ok && sahip) { S.pro = true; A.pro = true; ayarKaydet(); s.kapat(); tost(t('proTesekkur')); ciz(); }
      else tost(t('odemeTamamlanmadi'));
    }).catch(function () { tost(t('odemeTamamlanmadi')); })
      .then(function () { alimda = false; al.disabled = false; });
  }
}
function satinAlimlariGeriYukle() {
  if (!odemeHazir()) { tost(t('odemeYok')); return; }
  zamanAsimi(odeme().restore(), 20000).then(function (l) {
    var sahip = Array.isArray(l) && l.indexOf(PRO_URUN) >= 0;
    try { sahip = sahip || !!odeme().owned(PRO_URUN); } catch (e) { }
    S.pro = sahip; A.pro = sahip; ayarKaydet();
    tost(sahip ? t('proGeriGeldi') : t('proBulunamadi')); ciz();
  }).catch(function () { tost(t('odemeTamamlanmadi')); });
}
function destekSayfasi() {
  var fiyatlar = {};
  var cayF = h('small', { text: t('cayAlt') }), yemekF = h('small', { text: t('yemekAlt') });
  var icerik = h('div', null, h('p', { class: 'alt-yazi', text: t('destekMetin') }),
    h('div', { class: 'ayar-grup', style: { 'margin-top': '14px' } },
      h('button', { class: 'satir', on: { click: function () { destekAl(DESTEK_CAY); } } }, h('span', { class: 'sol' }, ikon('fincan'), h('div', null, t('cay'), cayF)), ikon('sag', 'k')),
      h('button', { class: 'satir', on: { click: function () { destekAl(DESTEK_YEMEK); } } }, h('span', { class: 'sol' }, ikon('kalp'), h('div', null, t('yemek'), yemekF)), ikon('sag', 'k'))),
    h('p', { class: 'alt-yazi', style: { 'margin-top': '12px', 'font-size': '12.5px' }, text: t('destekNot') }));
  var s = sayfaAc({ baslik: t('destekle'), icerik: icerik });
  if (odemeHazir()) {
    zamanAsimi(odeme().products([DESTEK_CAY, DESTEK_YEMEK]), 10000).then(function (l) {
      (l || []).forEach(function (u) { if (u && typeof u.price === 'string') fiyatlar[u.id] = kirp(u.price, 24); });
      if (fiyatlar[DESTEK_CAY]) cayF.textContent = fiyatlar[DESTEK_CAY] + ', ' + t('cayAlt');
      if (fiyatlar[DESTEK_YEMEK]) yemekF.textContent = fiyatlar[DESTEK_YEMEK] + ', ' + t('yemekAlt');
    }).catch(function () { });
  }
  var alimda = false;
  function destekAl(id) {
    if (alimda) return;
    if (!odemeHazir()) { tost(t('odemeYok')); return; }
    alimda = true;
    zamanAsimi(odeme().buy(id), 180000).then(function (ok) { tost(ok ? t('destekTesekkur') : t('odemeTamamlanmadi')); if (ok) s.kapat(); })
      .catch(function () { tost(t('odemeTamamlanmadi')); }).then(function () { alimda = false; });
  }
}

/* ---------- Yedekleme ---------- */
function yedekAl() {
  if (!S.parcalar.length && !gecmisAl().length) { tost(t('yedekBos')); return; }
  var bekleme = sayfaAc({ baslik: t('yedekAl'), kilitli: true, icerik: h('div', { style: { padding: '20px 0', display: 'flex', gap: '12px', 'align-items': 'center' } }, h('span', { class: 'yukleniyor' }), h('span', { text: t('yedekHazirlaniyor') })) });
  var liste = S.parcalar.filter(function (p) { return !p.ornek; });
  Promise.all(liste.map(function (p) {
    return Depo.resimAl(p.id).then(function (r) { return r && r.buyuk ? blobDataUrl(r.buyuk) : ''; }).then(function (foto) {
      return { id: p.id, tur: p.tur, renk: p.renk, renk2: p.renk2 || '', desen: p.desen ? 1 : 0, tarz: p.tarz, su: p.su ? 1 : 0, ad: p.ad || '', eklendi: p.eklendi || 0, giy: p.giy || 0, son: p.son || 0, marka: p.marka || '', fiyat: p.fiyat || 0, kumas: p.kumas || '', mevsim: p.mevsim || '', dinlen: p.dinlen ? 1 : 0, kesik: p.kesik ? 1 : 0, foto: foto };
    });
  })).then(function (parcalar) {
    var veri = { uygulama: 'kombinle', bicim: 1, tarih: new Date().toISOString(), ayar: { tesettur: A.tesettur, isi: A.isi, ozelTur: A.ozelTur }, parcalar: parcalar, gecmis: gecmisAl() };
    var blob = new Blob([JSON.stringify(veri)], { type: 'application/json' });
    var ad = 'kombinle-yedek-' + bugunAnahtar() + '.json';
    if (YEREL) {
      return blobDataUrl(blob).then(function (d) {
        return yerelCagir('dosyaKaydet', [ad, 'application/json', d.slice(d.indexOf(',') + 1)], 600000);
      }).then(function (d) { bekleme.kapat(); tost(d.ok ? t('yedekHazir') : d.iptal ? t('yedekIptal') : t('yedekHata')); });
    }
    var url = URL.createObjectURL(blob);
    var a = h('a', { href: url, download: ad, style: { display: 'none' } });
    document.body.appendChild(a); a.click();
    setTimeout(function () { a.remove(); URL.revokeObjectURL(url); }, 60000);
    bekleme.kapat(); tost(t('yedekHazir'));
  }).catch(function (e) { hataYakala(e); bekleme.kapat(); tost(t('yedekHata')); });
}
function yedekSecildi(dosya) {
  if (!dosya) return;
  if (dosya.size > 200 * 1024 * 1024) { tost(t('yedekBuyuk')); return; }
  onayla(t('yedekYukle'), t('yedekYukleOnay'), t('yukle'), false).then(function (ok) {
    if (!ok) return;
    var durum = h('span', { text: t('yedekOkunuyor') });
    var bekleme = sayfaAc({ baslik: t('yedekYukle'), kilitli: true, icerik: h('div', { style: { padding: '20px 0', display: 'flex', gap: '12px', 'align-items': 'center' } }, h('span', { class: 'yukleniyor' }), durum) });
    var okuyucu = new FileReader();
    okuyucu.onerror = function () { bekleme.kapat(); tost(t('yedekGecersiz')); };
    okuyucu.onload = function () {
      var veri;
      try { veri = JSON.parse(okuyucu.result); } catch (e) { bekleme.kapat(); tost(t('yedekGecersiz')); return; }
      yedekUygula(veri, durum).then(function (s) {
        bekleme.kapat(); tost(t('yedekYuklendi', s.eklenen, s.atlanan)); ciz();
      }).catch(function (e) { hataYakala(e); bekleme.kapat(); tost(t('yedekGecersiz')); });
    };
    okuyucu.readAsText(dosya);
  });
}
/* Yedek dosyası güvenilmeyen veri sayılır: her alan tek tek denetlenir, fotoğraflar yeniden çizilir. */
function yedekUygula(veri, durum) {
  if (!veri || typeof veri !== 'object' || Array.isArray(veri) || veri.uygulama !== 'kombinle' || !Array.isArray(veri.parcalar)) return Promise.reject(new Error('bicim'));
  if (veri.ayar && typeof veri.ayar === 'object') {
      if (Array.isArray(veri.ayar.ozelTur)) {
      veri.ayar.ozelTur.slice(0, 40).forEach(function (o) {
        if (!o || !/^oz[a-z0-9]{4,20}$/.test(o.id) || !GRUP_VARSAYILAN[o.g] || typeof o.ad !== 'string' || !kirp(o.ad, 24)) return;
        if (!A.ozelTur.some(function (z) { return z.id === o.id; }) && A.ozelTur.length < 40) A.ozelTur.push({ id: o.id, g: o.g, ad: kirp(o.ad, 24) });
      });
      ozelTurKaydet(A.ozelTur);
    }
    ayarKaydet();
  }
  var ham = veri.parcalar.slice(0, 3000), eklenen = 0, atlanan = 0, simdi = Date.now();
  var mevcut = {}; S.parcalar.forEach(function (p) { mevcut[p.id] = p; });
  var sira = Promise.resolve();
  ham.forEach(function (x, i) {
    sira = sira.then(function () {
      if (durum && i % 3 === 0) durum.textContent = t('yedekIsleniyor', i + 1, ham.length);
      if (!x || typeof x !== 'object' || !TUR[x.tur] || typeof x.foto !== 'string' || x.foto.length > 12e6 || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(x.foto)) { atlanan++; return; }
      var p = {
        id: idGecerli(x.id) ? x.id : yeniId(), tur: x.tur, renk: RENK[x.renk] ? x.renk : 'siyah', renk2: RENK[x.renk2] ? x.renk2 : '',
        desen: x.desen === 1 ? 1 : 0, tarz: tarzTemizle(x.tarz), su: x.su === 1 ? 1 : 0, ad: kirp(x.ad, 40),
        eklendi: sinirla(x.eklendi, 0, simdi + 864e5), giy: sinirla(x.giy, 0, 99999) | 0, son: sinirla(x.son, 0, simdi + 864e5),
        marka: kirp(x.marka, 30), kumas: kirp(x.kumas, 30), mevsim: mevsimTemizle(x.mevsim), dinlen: x.dinlen === 1 ? 1 : 0, kesik: x.kesik === 1 ? 1 : 0,
        fiyat: sayiMi(x.fiyat) && x.fiyat > 0 ? Math.round(sinirla(x.fiyat, 0, 1e6) * 100) / 100 : 0
      };
      var tur = x.foto.slice(5, x.foto.indexOf(';'));
      var bin;
      try { bin = atob(x.foto.slice(x.foto.indexOf(',') + 1)); } catch (e) { atlanan++; return; }
      var arr = new Uint8Array(bin.length); for (var k = 0; k < bin.length; k++) arr[k] = bin.charCodeAt(k);
      var dosya = new Blob([arr], { type: tur });
      return resimCoz(dosya).then(function (bmp) {
        if (p.kesik) {
          var c0 = document.createElement('canvas'); c0.width = bmp.width; c0.height = bmp.height; c0.getContext('2d').drawImage(bmp.kaynak || bmp, 0, 0);
          try { if (bmp.close) bmp.close(); if (bmp.kapat) bmp.kapat(); } catch (e) { }
          return Promise.all([saydamBlob(olcekle(c0, 1024), 0.9), saydamBlob(olcekle(c0, 420), 0.85)]);
        }
        var b = tuvaleCiz(bmp, 1024), kc = tuvaleCiz(bmp, 420);
        try { if (bmp.close) bmp.close(); if (bmp.kapat) bmp.kapat(); } catch (e) { }
        return Promise.all([tuvaldenBlob(b, 0.86), tuvaldenBlob(kc, 0.82)]);
      }).then(function (bl) {
        return Depo.resimYaz(p.id, { buyuk: bl[0], kucuk: bl[1] }).then(function () { return Depo.parcaYaz(p); });
      }).then(function () {
        if (mevcut[p.id]) { S.parcalar = S.parcalar.filter(function (z) { return z.id !== p.id; }); urlBirak(p.id); }
        S.parcalar.push(p); mevcut[p.id] = p; eklenen++;
      }).catch(function () { atlanan++; });
    });
  });
  return sira.then(function () {
    if (Array.isArray(veri.gecmis)) {
      var g = gecmisAl(), var_ = {}; g.forEach(function (x) { var_[x.id] = 1; });
      veri.gecmis.slice(0, 300).forEach(function (x) {
        if (!x || !idGecerli(x.id) || var_[x.id] || !Array.isArray(x.p)) return;
        var ids = x.p.filter(function (id) { return idGecerli(id) && mevcut[id]; }).slice(0, 16);
        if (!ids.length) return;
        var hv = x.h && typeof x.h === 'object' ? { min: sinirla(x.h.min, -60, 60) | 0, max: sinirla(x.h.max, -60, 60) | 0, s: typeof x.h.s === 'string' ? x.h.s.replace(/[^a-z_]/g, '').slice(0, 30) : '' } : null;
        var plan = typeof x.plan === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x.plan) ? x.plan : undefined;
        g.push({ id: x.id, tarih: sinirla(x.tarih, 0, simdi + 864e5), p: ids, o: ORTAMLAR[x.o] ? x.o : 'gunluk', m: kirp(x.m, 80), ad: kirp(x.ad, 40), fav: x.fav === true, giyildi: x.giyildi === true, kendi: x.kendi === 1 ? 1 : undefined, plan: plan, h: hv });
      });
      g.sort(function (a, b) { return b.tarih - a.tarih; });
      gecmisYaz(g);
    }
    if (veri.ayar && typeof veri.ayar === 'object') {
      if (typeof veri.ayar.tesettur === 'boolean') A.tesettur = veri.ayar.tesettur;
      if (veri.ayar.isi === -1 || veri.ayar.isi === 0 || veri.ayar.isi === 1) A.isi = veri.ayar.isi;

      ayarKaydet();
    }
    S.sonuc = null;
    return { eklenen: eklenen, atlanan: atlanan };
  });
}
function hepsiniSil() {
  onayla(t('hepsiniSil'), t('hepsiniSilOnay'), t('sil'), true).then(function (ok) {
    if (!ok) return;
    return onayla(t('eminMisin'), t('geriAlinamaz'), t('evetSil'), true).then(function (ok2) {
      if (!ok2) return;
      Object.keys(URL_ONBELLEK).forEach(function (k) { try { URL.revokeObjectURL(URL_ONBELLEK[k]); } catch (e) { } });
      URL_ONBELLEK = {};
      return Depo.hepsiniSil().then(function () {
        S.parcalar = []; S.sonuc = null; LS.sil('gecmis'); A.tesettur = false; A.isi = 0; ayarKaydet();
        tumSayfalariKapat(); tost(t('hepsiSilindi')); ciz();
      });
    });
  }).catch(function (e) { hataYakala(e); tost(t('kayitHata')); });
}
function gizlilikSayfasi() {
  var b = function (baslik, metin) { return [h('h3', { text: baslik }), h('p', { text: metin })]; };
  var icerik = h('div', { class: 'yazi-blok' },
    b(t('gz1b'), t('gz1')), b(t('gz2b'), t('gz2')), b(t('gz3b'), t('gz3')), b(t('gz4b'), t('gz4')), b(t('gz5b'), t('gz5')),
    h('p', null, h('a', { href: GIZLILIK_ADRES, target: '_blank', rel: 'noopener noreferrer', style: { color: 'var(--vurgu)' }, text: t('gzTam') })));
  sayfaAc({ baslik: t('gizlilik'), icerik: icerik });
}

/* ---------- Kraliçe Modu sınırları: her yeni özellik 3 kez ücretsiz ---------- */
var OZELLIK_HAK = 3;
var OZELLIKLER = ['arka', 'takvim', 'kur', 'eslestir', 'bavul', 'istatistik', 'ilham'];
function ozKalan(oz) { return S.pro ? Infinity : Math.max(0, OZELLIK_HAK - (sinirla(LS.al('hak_' + oz, 0), 0, 1e6) | 0)); }
function ozIzin(oz) { if (ozKalan(oz) > 0) return true; proSayfasi(oz); return false; }
function ozKullan(oz) { if (!S.pro && OZELLIKLER.indexOf(oz) >= 0) LS.yaz('hak_' + oz, (sinirla(LS.al('hak_' + oz, 0), 0, 1e6) | 0) + 1); }
function ozHakYazi(oz) {
  if (S.pro) return null;
  var k = ozKalan(oz);
  return h('p', { class: 'hak', text: k > 0 ? t('ozKaldi', k) : t('ozKalmadi') });
}
