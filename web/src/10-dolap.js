/* ---------- Dolabım ---------- */
function dolapEkrani() {
  var bol = h('section', null);
  bol.appendChild(h('div', { class: 'dolap-ust' },
    h('div', null, h('h1', { class: 'baslik', text: t('dolabim') }), h('p', { class: 'alt-yazi', text: t('parcaSayisi', S.parcalar.length) }))));
  if (!S.parcalar.length) { bol.appendChild(bosDolapKarti()); return bol; }
  var ara = h('input', { type: 'search', placeholder: t('dolaptaAra'), 'aria-label': t('dolaptaAra'), maxlength: '40', on: { input: function (e) { S.ara = kirp(e.target.value, 40); izgaraDoldur(izgara); } } });
  ara.value = S.ara;
  bol.appendChild(h('label', { class: 'arama' }, ikon('ara', 'k'), ara));
  var cipler = h('div', { class: 'cipler' });
  var say = {}; S.parcalar.forEach(function (p) { var g = TUR[p.tur] ? TUR[p.tur].g : ''; say[g] = (say[g] || 0) + 1; });
  [{ id: 'hepsi' }].concat(GRUPLAR).forEach(function (g) {
    if (g.id !== 'hepsi' && !say[g.id]) return;
    cipler.appendChild(h('button', {
      class: 'cip', 'aria-pressed': S.filtre === g.id ? 'true' : 'false',
      on: { click: function () { S.filtre = g.id; ciz(); } }
    }, g.id === 'hepsi' ? t('hepsi') : grupAd(g.id), h('span', { class: 'say', text: g.id === 'hepsi' ? S.parcalar.length : say[g.id] })));
  });
  bol.appendChild(cipler);
  if (S.parcalar.some(function (p) { return p.ornek; })) {
    bol.appendChild(h('div', { class: 'tahmin' }, ikon('bilgi', 'k'), h('span', { style: { flex: '1' }, text: t('ornekVar') }),
      h('button', { class: 'btn kucuk ikincil', on: { click: ornekleriSil }, text: t('ornekleriKaldir') })));
  }
  var izgara = h('div', { class: 'izgara' });
  izgaraDoldur(izgara);
  bol.appendChild(izgara);
  bol.appendChild(h('button', { class: 'ekle-fab', on: { click: ekleMenusu } }, ikon('arti'), t('ekle')));
  return bol;
}
function izgaraDoldur(izgara) {
  temizle(izgara);
  var q = katla(S.ara.toLocaleLowerCase('tr'));
  var liste = S.parcalar.filter(function (p) {
    if (!TUR[p.tur]) return false;
    if (S.filtre !== 'hepsi' && TUR[p.tur].g !== S.filtre) return false;
    if (!q) return true;
    return katla((parcaAd(p) + ' ' + turAd(p.tur) + ' ' + renkAd(p.renk)).toLocaleLowerCase('tr')).indexOf(q) >= 0;
  }).sort(function (a, b) { return (b.eklendi || 0) - (a.eklendi || 0); });
  if (!liste.length) { izgara.appendChild(h('p', { class: 'alt-yazi', style: { 'grid-column': '1/-1' }, text: t('bulunamadi') })); return; }
  liste.forEach(function (p) {
    izgara.appendChild(h('button', { class: 'oge', 'aria-label': parcaAd(p), on: { click: function () { parcaDuzenle(p, null); } } },
      resimEl(p.id, false, null, ''),
      p.ornek ? h('span', { class: 'ornek', text: t('ornek') }) : null,
      h('span', { class: 'alt' }, h('i', { style: { background: (RENK[p.renk] || RENK.siyah).hex } }), h('span', { text: p.ad || turAd(p.tur) }))));
  });
}

/* ---------- Kıyafet ekleme ---------- */
function ekleMenusu() {
  var s = sayfaAc({
    baslik: t('kiyafetEkle'),
    icerik: h('div', null,
      h('p', { class: 'alt-yazi', text: t('ekleIpucu') }),
      h('div', { class: 'ayar-grup', style: { 'margin-top': '14px' } },
        h('button', { class: 'satir', 'data-odak': '1', on: { click: function () { s.kapat(); setTimeout(kameraAc, 300); } } },
          h('span', { class: 'sol' }, ikon('kamera'), h('div', null, t('fotoCek'), h('small', { text: t('fotoCekAlt') }))), ikon('sag', 'k')),
        h('button', { class: 'satir', on: { click: function () { s.kapat(); setTimeout(function () { $('#dosyaSec').click(); }, 300); } } },
          h('span', { class: 'sol' }, ikon('galeri'), h('div', null, t('galeridenSec'), h('small', { text: t('galeridenSecAlt') }))), ikon('sag', 'k'))))
  });
}
function dosyalarSecildi(dosyalar) {
  var liste = Array.prototype.slice.call(dosyalar || [], 0, 30);
  if (!liste.length) return;
  if ((dosyalar.length || 0) > 30) tost(t('enFazla30'));
  sirayaIsle(liste, 0);
}
function sirayaIsle(liste, i) {
  if (i >= liste.length) return;
  var bekleme = sayfaAc({
    baslik: t('hazirlaniyor'), kilitli: true,
    icerik: h('div', { style: { padding: '24px 0', display: 'flex', 'align-items': 'center', gap: '12px' } }, h('span', { class: 'yukleniyor' }), h('span', { text: liste.length > 1 ? t('fotoSira', i + 1, liste.length) : t('fotoInceleniyor') }))
  });
  var bitti = false;
  fotografIsle(liste[i]).then(function (sonuc) {
    bitti = true;
    bekleme.kapat();
    setTimeout(function () {
      parcaDuzenle(null, { sonuc: sonuc, sira: i + 1, toplam: liste.length, devam: function () { sirayaIsle(liste, i + 1); } });
    }, 300);
  }).catch(function (e) {
    bitti = true;
    bekleme.kapat();
    var m = e && e.message;
    tost(m === 'boyut' ? t('dosyaBuyuk') : m === 'tur' ? t('dosyaTur') : m === 'olcu' ? t('dosyaOlcu') : t('dosyaBozuk'));
    setTimeout(function () { sirayaIsle(liste, i + 1); }, 400);
  });
  setTimeout(function () { if (!bitti) tost(t('biraz')); }, 6000);
}

/* Yeni kıyafet (yeni.sonuc) ya da mevcut kıyafet (p) düzenleme */
function parcaDuzenle(p, yeni) {
  var an = yeni ? yeni.sonuc.analiz : null;
  var tas = p ? { tur: p.tur, renk: p.renk, renk2: p.renk2 || '', desen: p.desen ? 1 : 0, tarz: p.tarz || '', su: p.su ? 1 : 0, ad: p.ad || '' }
    : { tur: an && an.guven >= 0.5 && an.turlar[0] ? an.turlar[0] : '', renk: an ? an.renk : 'siyah', renk2: an ? an.renk2 : '', desen: an ? an.desen : 0, tarz: '', su: 0, ad: '' };
  if (!p && tas.tur) { tas.tarz = TUR[tas.tur].s || ''; tas.su = TUR[tas.tur].su ? 1 : 0; }
  var tarzElle = false;
  if (an && LS.al('ayikla', false)) try { console.info('analiz ' + JSON.stringify({ g: an.guven, t: an.turlar, o: an.ozellik, p: an.olasilik })); } catch (e) { }
  var acikGrup = tas.tur ? TUR[tas.tur].g : (an && an.grup) || 'ust';
  var geciciUrl = yeni ? URL.createObjectURL(yeni.sonuc.buyuk) : '';
  var gov = h('div');
  var kaydetBtn = h('button', { class: 'btn ana', on: { click: kaydet } });
  function ciz2() {
    temizle(gov);
    var img = yeni ? h('img', { class: 'buyuk-resim', src: geciciUrl, alt: '' }) : resimEl(p.id, true, 'buyuk-resim', parcaAd(p));
    gov.appendChild(img);
    if (yeni) {
      var msg;
      if (an.guven >= 0.5 && an.turlar[0]) msg = t(an.yz ? 'tanidimYz' : 'tanidim', turAd(an.turlar[0]));
      else if (an.turlar.length) msg = t('emin');
      else msg = t('turSec');
      gov.appendChild(h('div', { class: 'tahmin' }, ikon('isilti', 'k'), h('span', { text: msg })));
    } else {
      gov.appendChild(h('p', { class: 'alt-yazi', style: { 'margin-top': '10px' }, text: p.giy ? t('giyimBilgi', p.giy, tarihYaz(p.son)) : t('henuzGiyilmedi') }));
    }
    /* tür */
    var turB = h('div', { class: 'bolum' }, h('span', { class: 'etk', text: t('tur') }));
    if (yeni && an.turlar.length && an.guven < 0.5) {
      var onr = h('div', { class: 'sarili', style: { 'margin-bottom': '10px' } });
      an.turlar.forEach(function (id) { onr.appendChild(turCip(id)); });
      turB.appendChild(onr);
    }
    var grp = h('div', { class: 'cipler', style: { padding: '2px 2px 8px' } });
    GRUPLAR.forEach(function (g) {
      grp.appendChild(h('button', { class: 'cip', 'aria-pressed': acikGrup === g.id ? 'true' : 'false', text: grupAd(g.id), on: { click: function () { acikGrup = g.id; ciz2(); } } }));
    });
    turB.appendChild(grp);
    var turl = h('div', { class: 'sarili' });
    TURLER.filter(function (x) { return x.g === acikGrup; }).forEach(function (x) { turl.appendChild(turCip(x.id)); });
    turB.appendChild(turl);
    gov.appendChild(turB);
    /* renk */
    var renkB = h('div', { class: 'bolum' }, h('span', { class: 'etk', text: t('anaRenk') }));
    renkB.appendChild(renkSecici(tas.renk, function (r) { tas.renk = r; if (tas.renk2 === r) tas.renk2 = ''; ciz2(); }, false));
    gov.appendChild(renkB);
    var renk2B = h('div', { class: 'bolum' }, h('span', { class: 'etk', text: t('ikinciRenk') }));
    renk2B.appendChild(renkSecici(tas.renk2, function (r) { tas.renk2 = tas.renk2 === r ? '' : r; ciz2(); }, true));
    gov.appendChild(renk2B);
    /* tarz */
    var tarzB = h('div', { class: 'bolum' }, h('span', { class: 'etk', text: t('tarzi') }));
    var tz = h('div', { class: 'sarili' });
    TARZLAR.forEach(function (x) {
      tz.appendChild(h('button', {
        class: 'cip', 'aria-pressed': tas.tarz.indexOf(x) >= 0 ? 'true' : 'false', text: t('tarz_' + x),
        on: { click: function () { tarzElle = true; tas.tarz = tas.tarz.indexOf(x) >= 0 ? tas.tarz.replace(x, '') : tas.tarz + x; ciz2(); } }
      }));
    });
    tarzB.appendChild(tz);
    gov.appendChild(tarzB);
    var ayarlar = h('div', { class: 'ayar-grup', style: { 'margin-top': '18px' } });
    ayarlar.appendChild(anahtarSatir(t('desenli'), t('desenliAlt'), !!tas.desen, function (v) { tas.desen = v ? 1 : 0; }));
    if (tas.tur && (TUR[tas.tur].g === 'dis' || TUR[tas.tur].g === 'ayk')) ayarlar.appendChild(anahtarSatir(t('suyaDayanikli'), t('suyaDayanikliAlt'), !!tas.su, function (v) { tas.su = v ? 1 : 0; }));
    gov.appendChild(ayarlar);
    var ad = h('input', { class: 'metin', maxlength: '40', placeholder: t('adYer'), 'aria-label': t('adEtiket'), on: { input: function (e) { tas.ad = kirp(e.target.value, 40); } } });
    ad.value = tas.ad;
    gov.appendChild(h('div', { class: 'bolum' }, h('span', { class: 'etk', text: t('adEtiket') }), ad));
    if (p) gov.appendChild(h('button', { class: 'btn ikincil tehlike tam', style: { 'margin-top': '20px' }, on: { click: sil } }, ikon('cop', 'k'), t('parcaSil')));
    kaydetBtn.disabled = !tas.tur;
    temizle(kaydetBtn);
    kaydetBtn.appendChild(document.createTextNode(!tas.tur ? t('onceTurSec') : yeni && yeni.sira < yeni.toplam ? t('kaydetSonraki', yeni.sira, yeni.toplam) : t('kaydet')));
  }
  function turCip(id) {
    return h('button', {
      class: 'cip', 'aria-pressed': tas.tur === id ? 'true' : 'false', text: turAd(id),
      on: { click: function () { tas.tur = id; acikGrup = TUR[id].g; if (!tarzElle) tas.tarz = TUR[id].s || ''; tas.su = TUR[id].su ? 1 : (p ? tas.su : 0); ciz2(); } }
    });
  }
  var kaydediliyor = false;
  function kaydet() {
    if (!tas.tur || !TUR[tas.tur] || kaydediliyor) return;
    kaydediliyor = true;
    var kayit = p || { id: yeniId(), eklendi: Date.now(), giy: 0, son: 0 };
    kayit.tur = tas.tur; kayit.renk = RENK[tas.renk] ? tas.renk : 'siyah'; kayit.renk2 = RENK[tas.renk2] ? tas.renk2 : '';
    kayit.desen = tas.desen ? 1 : 0; kayit.tarz = tarzTemizle(tas.tarz); kayit.su = tas.su ? 1 : 0; kayit.ad = kirp(tas.ad, 40);
    var is = yeni ? Depo.resimYaz(kayit.id, { buyuk: yeni.sonuc.buyuk, kucuk: yeni.sonuc.kucuk }).then(function () { return Depo.parcaYaz(kayit); }) : Depo.parcaYaz(kayit);
    is.then(function () {
      if (!p) S.parcalar.push(kayit);
      S.sonuc = null;
      s.kapat();
      tost(yeni ? t('eklendi') : t('kaydedildi'));
      ciz();
      if (yeni && yeni.devam) setTimeout(yeni.devam, 350);
    }).catch(function (e) { kaydediliyor = false; hataYakala(e); tost(e && /quota/i.test(e.name + e.message) ? t('yerYok') : t('kayitHata')); });
  }
  function sil() {
    onayla(t('silBaslik'), t('silMetin'), t('sil'), true).then(function (ok) {
      if (!ok) return;
      Depo.parcaSil(p.id).then(function () {
        S.parcalar = S.parcalar.filter(function (x) { return x.id !== p.id; });
        urlBirak(p.id); S.sonuc = null; s.kapat(); tost(t('silindi')); ciz();
      }).catch(function (e) { hataYakala(e); tost(t('kayitHata')); });
    });
  }
  var iptal = h('button', { class: 'btn ikincil', on: { click: function () { s.kapat(); } }, text: yeni ? t('atla') : t('vazgec') });
  var s = sayfaAc({
    baslik: yeni ? t('yeniKiyafet') : parcaAd(p), icerik: gov, altBar: [iptal, kaydetBtn],
    kapaninca: function () { if (geciciUrl) setTimeout(function () { URL.revokeObjectURL(geciciUrl); }, 400); if (yeni && !kaydediliyor && yeni.devam) setTimeout(yeni.devam, 350); }
  });
  ciz2();
}
function tarzTemizle(s) { return TARZLAR.filter(function (x) { return String(s || '').indexOf(x) >= 0; }).join(''); }
function renkSecici(secili, sec, ikinci) {
  var kutu = h('div', { class: 'sarili' });
  var hepsi = false;
  function doldur() {
    temizle(kutu);
    var liste = hepsi ? RENKLER.map(function (r) { return r[0]; }) : RENKLER.map(function (r) { return r[0]; }).filter(function (r) { return r === secili || RENK[r].notr; }).slice(0, 8);
    if (!hepsi && secili && liste.indexOf(secili) < 0) liste.unshift(secili);
    liste.forEach(function (r) {
      kutu.appendChild(h('button', { class: 'renk-cip', 'aria-pressed': secili === r ? 'true' : 'false', on: { click: function () { sec(r); } } },
        h('i', { style: { background: RENK[r].hex } }), renkAd(r)));
    });
    if (!hepsi) kutu.appendChild(h('button', { class: 'cip', on: { click: function () { hepsi = true; doldur(); } }, text: t('tumRenkler') }));
  }
  doldur();
  return kutu;
}
function anahtarSatir(baslik, alt, deger, degisti, ik) {
  var b = h('button', { class: 'satir', role: 'switch', 'aria-checked': deger ? 'true' : 'false' },
    h('span', { class: 'sol' }, ik ? ikon(ik) : null, h('div', null, baslik, alt ? h('small', { text: alt }) : null)), h('span', { class: 'anahtar' }));
  b.addEventListener('click', function () {
    deger = !deger; b.setAttribute('aria-checked', deger ? 'true' : 'false'); degisti(deger);
  });
  return b;
}

/* ---------- Uygulama içi kamera ---------- */
function kameraAc() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { tost(t('kameraYok')); $('#dosyaSec').click(); return; }
  var video = h('video', { autoplay: true, playsinline: true, muted: true });
  var akis = null;
  var durum = h('p', { class: 'alt-yazi', style: { 'margin-top': '10px', 'text-align': 'center' }, text: t('kameraAciliyor') });
  var deklansor = h('button', { class: 'deklansor', 'aria-label': t('fotoCek'), disabled: true, on: { click: cek } });
  var s = sayfaAc({
    baslik: t('fotoCek'),
    icerik: h('div', null, h('div', { class: 'kamera' }, video, h('div', { class: 'cerceve' })), durum, deklansor),
    kapaninca: kapatAkis
  });
  function kapatAkis() { if (akis) { akis.getTracks().forEach(function (tr) { try { tr.stop(); } catch (e) { } }); akis = null; } }
  zamanAsimi(navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1600 }, height: { ideal: 1600 } }, audio: false }), 15000)
    .then(function (st) {
      if (s.kapandi) { st.getTracks().forEach(function (tr) { tr.stop(); }); return; }
      akis = st; video.srcObject = st;
      durum.textContent = t('kameraIpucu'); deklansor.disabled = false;
    }).catch(function () {
      durum.textContent = t('kameraIzin');
      var g = h('button', { class: 'btn ikincil tam', style: { 'margin-top': '10px' }, on: { click: function () { s.kapat(); setTimeout(function () { $('#dosyaSec').click(); }, 300); } }, text: t('galeridenSec') });
      durum.after(g); deklansor.remove();
    });
  function cek() {
    if (!akis || !video.videoWidth) return;
    var c = document.createElement('canvas');
    var o = Math.min(1, 1600 / Math.max(video.videoWidth, video.videoHeight));
    c.width = Math.round(video.videoWidth * o); c.height = Math.round(video.videoHeight * o);
    c.getContext('2d').drawImage(video, 0, 0, c.width, c.height);
    s.kapat();
    setTimeout(function () { sirayaIsle([c], 0); }, 300);
  }
}

/* ---------- Örnek dolap ---------- */
var ORNEKLER = [
  ['tisort', 'beyaz', 'ust'], ['bluz', 'pudra', 'ust'], ['gomlek', 'acikmavi', 'ust'], ['kazak', 'krem', 'ust'], ['sweat', 'gri', 'ust'],
  ['kot', 'kot', 'alt'], ['kumas', 'siyah', 'alt'], ['etek', 'bordo', 'alt'], ['uzunetek', 'bej', 'alt'], ['elbise', 'yesil', 'tek'],
  ['blazer', 'siyah', 'dis'], ['hirka', 'bej', 'dis'], ['tren', 'taba', 'dis'], ['mont', 'lacivert', 'dis'], ['yagmurluk', 'haki', 'dis'],
  ['spor', 'beyaz', 'ayk'], ['babet', 'siyah', 'ayk'], ['bot', 'kahve', 'ayk'], ['topuklu', 'pudra', 'ayk'], ['canta', 'taba', 'aks'], ['atki', 'gri', 'aks'], ['esarp', 'pudra', 'aks']
];
function ornekDolapYukle() {
  if (S.mesgul) return;
  S.mesgul = true;
  var simdi = Date.now(), isler = [];
  ORNEKLER.forEach(function (o, i) {
    var c = document.createElement('canvas'); c.width = c.height = 420;
    cizimIllustrasyon(c, o[2], RENK[o[1]].hex);
    var p = { id: yeniId(), tur: o[0], renk: o[1], renk2: '', desen: 0, tarz: TUR[o[0]].s || '', su: TUR[o[0]].su ? 1 : 0, ad: '', eklendi: simdi - i, giy: 0, son: 0, ornek: 1 };
    isler.push(tuvaldenBlob(c, 0.86).then(function (b) {
      return Depo.resimYaz(p.id, { buyuk: b, kucuk: b }).then(function () { return Depo.parcaYaz(p); }).then(function () { S.parcalar.push(p); });
    }));
  });
  Promise.all(isler).then(function () { S.mesgul = false; tost(t('ornekYuklendi')); ciz(); })
    .catch(function (e) { S.mesgul = false; hataYakala(e); tost(t('kayitHata')); ciz(); });
}
function ornekleriSil() {
  var ornekler = S.parcalar.filter(function (p) { return p.ornek; });
  Promise.all(ornekler.map(function (p) { urlBirak(p.id); return Depo.parcaSil(p.id); })).then(function () {
    S.parcalar = S.parcalar.filter(function (p) { return !p.ornek; }); S.sonuc = null; tost(t('ornekSilindi')); ciz();
  }).catch(hataYakala);
}
