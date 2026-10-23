/* ---------- Dolabım ---------- */
/* ---------- Kıyafet ekleme ---------- */
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
  var tas = p ? { tur: p.tur, renk: p.renk, renk2: p.renk2 || '', desen: p.desen ? 1 : 0, tarz: p.tarz || '', su: p.su ? 1 : 0, ad: p.ad || '',
      marka: p.marka || '', fiyat: p.fiyat ? String(p.fiyat) : '', kumas: p.kumas || '', mevsim: p.mevsim || '', dinlen: p.dinlen ? 1 : 0 }
    : { tur: an && an.guven >= 0.5 && an.turlar[0] ? an.turlar[0] : '', renk: an ? an.renk : 'siyah', renk2: an ? an.renk2 : '', desen: an ? an.desen : 0, tarz: '', su: 0, ad: an && an.oneriAd || '',
      marka: '', fiyat: '', kumas: an && an.kumas || '', mevsim: an && an.mevsim || '', dinlen: 0 };
  var yeniResim = yeni ? { buyuk: yeni.sonuc.buyuk, kucuk: yeni.sonuc.kucuk, kesik: 0 } : null;
  if (!p && tas.tur) { tas.tarz = TUR[tas.tur].s || ''; tas.su = TUR[tas.tur].su ? 1 : 0; }
  if (!p && an && an.bulut) { if (an.tarz) tas.tarz = an.tarz; if (an.su === 0 || an.su === 1) tas.su = an.su; }
  var tarzElle = false;
  var adElle = !!(p && p.ad), ilkTur = tas.tur, ilkRenk = tas.renk;
  /* kullanıcı yazmadıysa adı tür ve renkten üret (yapay zekâ adı, tür/renk değişmedikçe korunur) */
  function otoAd() {
    if (adElle || !tas.tur) return;
    if (an && an.oneriAd && tas.tur === ilkTur && tas.renk === ilkRenk) { tas.ad = an.oneriAd; return; }
    var tr = turAd(tas.tur), rk = renkAd(tas.renk);
    if (TUR[tas.tur] && TUR[tas.tur].ozel) { tas.ad = kirp(rk + ' ' + tr, 40); return; }
    var dil = A.dil === 'en' ? 'en' : A.dil === 'ru' ? 'ru' : A.dil === 'uz' ? 'uz' : 'tr';
    var kucuk = function (x) { return x.split(' / ')[0].toLocaleLowerCase(dil === 'tr' ? 'tr' : dil); };
    tas.ad = kirp(dil === 'ru' ? tr.split(' / ')[0] + ', ' + kucuk(rk) : rk + ' ' + kucuk(tr), 40);
  }
  if (an && LS.al('ayikla', false)) try { console.info('analiz ' + JSON.stringify({ g: an.guven, t: an.turlar, o: an.ozellik, p: an.olasilik })); } catch (e) { }
  var acikGrup = tas.tur ? TUR[tas.tur].g : (an && an.grup) || 'ust';
  var geciciUrl = yeni ? URL.createObjectURL(yeni.sonuc.buyuk) : '';
  var gov = h('div');
  var kaydetBtn = h('button', { class: 'btn ana', on: { click: kaydet } });
  function ciz2() {
    temizle(gov);
    var img = yeni ? h('img', { class: 'buyuk-resim', src: geciciUrl, alt: '' }) : resimEl(p.id, true, 'buyuk-resim', parcaAd(p));
    img.addEventListener('click', function () { if (img.src) goruntuleyiciAc(img.src, img.alt); });
    gov.appendChild(img);
    var arkaBtn = h('button', { class: 'btn ikincil kucuk', on: { click: arkaPlaniSil } }, ikon('isilti', 'k'), t('arkaSil'));
    var araclar = h('div', { class: 'sarili', style: { 'margin-top': '10px' } }, (yeni ? yeniResim.kesik : p.kesik) ? null : arkaBtn,
      p ? h('button', { class: 'btn ikincil kucuk', on: { click: function () { s.kapat(); setTimeout(function () { nelerGiyilir(p); }, 300); } } }, ikon('kalp', 'k'), t('nelerGiyilir')) : null);
    if (araclar.childNodes.length) gov.appendChild(araclar);
    if (yeni) {
      var msg;
      if (an.guven >= 0.5 && an.turlar[0]) msg = t(an.bulut ? 'yzTanidi' : an.yz ? 'tanidimYz' : 'tanidim', turAd(an.turlar[0]));
      else if (an.turlar.length) msg = t('emin');
      else msg = t('turSec');
      if (an.kiyafetDegil) msg = t('kiyafetDegil');
      var tahminKutu = h('div', { class: 'tahmin' + (an.bulutHata ? ' uyari' : '') }, ikon(an.bulutHata ? 'bilgi' : 'isilti', 'k'), h('span', { text: an.bulutHata ? t('bulutHata') : msg }));
      if (an.bulutHata && an._bulutVeri && yzAcik()) {
        var yenidenBtn = h('button', { class: 'tahmin-btn' }, ikon('yenile', 'k'), t('yenidenTani'));
        yenidenBtn.addEventListener('click', function () {
          yenidenBtn.disabled = true; temizle(yenidenBtn); yenidenBtn.appendChild(h('span', { class: 'yukleniyor' })); yenidenBtn.appendChild(document.createTextNode(t('taniniyor')));
          yzTani(an._bulutVeri).then(function (sn) {
            bulutBirlestir(an, sn);
            if (an.bulut && !an.kiyafetDegil) {
              if (an.guven >= 0.5 && an.turlar[0]) { tas.tur = an.turlar[0]; acikGrup = TUR[tas.tur].g; tas.tarz = an.tarz || TUR[tas.tur].s || ''; if (an.su === 0 || an.su === 1) tas.su = an.su; }
              tas.renk = an.renk; tas.renk2 = an.renk2; tas.desen = an.desen; if (an.mevsim) tas.mevsim = an.mevsim; if (an.kumas) tas.kumas = an.kumas;
              ilkTur = tas.tur; ilkRenk = tas.renk;
            }
            ciz2();
          }).catch(function (e) { tost(yzHataMetni(e, t('bulutHata'))); ciz2(); });
        });
        tahminKutu.appendChild(yenidenBtn);
      }
      gov.appendChild(tahminKutu);
      if (an.bulut) gov.appendChild(h('p', { class: 'ai-not', style: { 'text-align': 'left' }, text: t('aiNot') }));
    } else {
      gov.appendChild(h('p', { class: 'alt-yazi', style: { 'margin-top': '10px' }, text: p.giy ? t('giyimBilgi', p.giy, tarihYaz(p.son)) : t('henuzGiyilmedi') }));
    }
    /* ad: tanınınca kendiliğinden yazılır, dokunup düzenlenebilir */
    otoAd();
    var ad = h('input', { class: 'metin ad-girdi', maxlength: '40', placeholder: t('adYer'), 'aria-label': t('adEtiket'), on: { input: function (e) { tas.ad = kirp(e.target.value, 40); adElle = !!tas.ad; } } });
    ad.value = tas.ad;
    gov.appendChild(h('div', { class: 'bolum' }, h('span', { class: 'etk' }, t('adEtiket2'), !adElle && tas.ad ? h('small', { class: 'oto-rozet' }, ikon('isilti', 'k'), an && an.bulut ? t('adYz') : t('adOto')) : null), ad));
    /* tür */
    var turB = h('div', { class: 'bolum' }, h('span', { class: 'etk', text: t('tur') }));
    if (yeni && an.turlar.length && an.guven < 0.5) {
      var onr = h('div', { class: 'sarili', style: { 'margin-bottom': '10px' } });
      an.turlar.forEach(function (id) { onr.appendChild(turCip(id)); });
      turB.appendChild(onr);
    } else if (yeni && an.bulut && an.alternatifler && an.alternatifler.length) {
      /* emin olsa da yapay zekânın diğer olasılıkları tek dokunuşla seçilebilir */
      var olas = h('div', { class: 'sarili olasilik', style: { 'margin-bottom': '10px' } }, h('small', { class: 'olasilik-etk', text: t('digerOlasilik') }));
      an.alternatifler.forEach(function (id) { if (TUR[id] && id !== tas.tur) olas.appendChild(turCip(id)); });
      if (olas.childNodes.length > 1) turB.appendChild(olas);
    }
    var grp = h('div', { class: 'cipler', style: { padding: '2px 2px 8px' } });
    GRUPLAR.forEach(function (g) {
      grp.appendChild(h('button', { class: 'cip', 'aria-pressed': acikGrup === g.id ? 'true' : 'false', text: grupAd(g.id), on: { click: function () { acikGrup = g.id; ciz2(); } } }));
    });
    turB.appendChild(grp);
    var turl = h('div', { class: 'sarili' });
    TURLER.filter(function (x) { return x.g === acikGrup; }).forEach(function (x) { turl.appendChild(turCip(x.id)); });
    turl.appendChild(h('button', { class: 'cip', on: { click: function () { ozelTurEkle(acikGrup, function (id) { tas.tur = id; ciz2(); }); } } }, ikon('arti', 'k'), t('yeniTur')));
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
    ayarlar.appendChild(anahtarSatir(t('dinlen'), t('dinlenAlt'), !!tas.dinlen, function (v) { tas.dinlen = v ? 1 : 0; }));
    if (tas.tur && (TUR[tas.tur].g === 'dis' || TUR[tas.tur].g === 'ayk')) ayarlar.appendChild(anahtarSatir(t('suyaDayanikli'), t('suyaDayanikliAlt'), !!tas.su, function (v) { tas.su = v ? 1 : 0; }));
    gov.appendChild(ayarlar);
    /* mevsim */
    var mv = h('div', { class: 'sarili' });
    MEVSIMLER.forEach(function (m) {
      mv.appendChild(h('button', { class: 'cip', 'aria-pressed': tas.mevsim.indexOf(m[0]) >= 0 ? 'true' : 'false', text: yerelAd('mevsim', m[0], m[1], m[2]),
        on: { click: function () { tas.mevsim = tas.mevsim.indexOf(m[0]) >= 0 ? tas.mevsim.replace(m[0], '') : tas.mevsim + m[0]; ciz2(); } } }));
    });
    gov.appendChild(h('div', { class: 'bolum' }, h('span', { class: 'etk', text: t('mevsimEtk') }), mv));
    var marka = h('input', { class: 'metin', maxlength: '30', placeholder: t('markaYer'), 'aria-label': t('marka'), on: { input: function (e) { tas.marka = kirp(e.target.value, 30); } } });
    marka.value = tas.marka;
    var fiyat = h('input', { class: 'metin', type: 'number', inputmode: 'decimal', min: '0', max: '1000000', step: '0.01', placeholder: '0', 'aria-label': t('fiyat'), on: { input: function (e) { tas.fiyat = String(e.target.value).slice(0, 10); } } });
    fiyat.value = tas.fiyat;
    var kumas = h('input', { class: 'metin', maxlength: '30', placeholder: t('kumasYer'), 'aria-label': t('kumas'), on: { input: function (e) { tas.kumas = kirp(e.target.value, 30); } } });
    kumas.value = tas.kumas;
    gov.appendChild(h('div', { class: 'bolum ikili' }, h('label', null, h('span', { class: 'etk', text: t('marka') }), marka), h('label', null, h('span', { class: 'etk', text: t('fiyat') + ' (₺)' }), fiyat)));
    gov.appendChild(h('div', { class: 'bolum' }, h('span', { class: 'etk', text: t('kumas') }), kumas));
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
  var silmede = false;
  function arkaPlaniSil() {
    if (silmede || !ozIzin('arka')) return;
    silmede = true;
    tost(t('arkaSiliniyor'));
    var kaynak = yeni ? Promise.resolve(yeniResim.buyuk) : Depo.resimAl(p.id).then(function (r) { return r && r.buyuk; });
    kaynak.then(function (b) { if (!b) throw new Error('resim'); return arkaPlanSil(b); }).then(function (r) {
      ozKullan('arka');
      if (yeni) {
        yeniResim = { buyuk: r.buyuk, kucuk: r.kucuk, kesik: 1 };
        if (geciciUrl) URL.revokeObjectURL(geciciUrl);
        geciciUrl = URL.createObjectURL(r.buyuk);
        if (r.analiz && !r.analiz.sekilYok && r.analiz.guven > (an.yz ? 2 : an.guven)) { r.analiz.yz = false; an.turlar = r.analiz.turlar; an.guven = r.analiz.guven; an.grup = r.analiz.grup; }
        silmede = false; ciz2(); tost(t('arkaSilindi'));
        return;
      }
      return Depo.resimYaz(p.id, { buyuk: r.buyuk, kucuk: r.kucuk }).then(function () {
        p.kesik = 1; return Depo.parcaYaz(p);
      }).then(function () { urlBirak(p.id); silmede = false; ciz2(); ciz(); tost(t('arkaSilindi')); });
    }).catch(function (e) { silmede = false; hataYakala(e); tost(e && e.message === 'model' ? t('arkaModel') : t('arkaOlmadi')); });
  }
  var kaydediliyor = false;
  function kaydet() {
    if (!tas.tur || !TUR[tas.tur] || kaydediliyor) return;
    kaydediliyor = true;
    var kayit = p || { id: yeniId(), eklendi: Date.now(), giy: 0, son: 0 };
    if (yeni && an && an.bulutTur) tanimaDuzeltmeEkle(an.bulutTur, tas.tur);   // yapay zekâ yanıldıysa öğrenilir
    kayit.tur = tas.tur; kayit.renk = RENK[tas.renk] ? tas.renk : 'siyah'; kayit.renk2 = RENK[tas.renk2] ? tas.renk2 : '';
    kayit.desen = tas.desen ? 1 : 0; kayit.tarz = tarzTemizle(tas.tarz); kayit.su = tas.su ? 1 : 0; kayit.ad = kirp(tas.ad, 40);
    kayit.marka = kirp(tas.marka, 30); kayit.kumas = kirp(tas.kumas, 30); kayit.mevsim = mevsimTemizle(tas.mevsim); kayit.dinlen = tas.dinlen ? 1 : 0;
    var f = parseFloat(String(tas.fiyat).replace(',', '.')); kayit.fiyat = isFinite(f) && f > 0 ? Math.round(sinirla(f, 0, 1e6) * 100) / 100 : 0;
    if (yeni && yeniResim.kesik) kayit.kesik = 1;
    var is = yeni ? Depo.resimYaz(kayit.id, { buyuk: yeniResim.buyuk, kucuk: yeniResim.kucuk }).then(function () { return Depo.parcaYaz(kayit); }) : Depo.parcaYaz(kayit);
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
function mevsimTemizle(s) { return MEVSIMLER.map(function (m) { return m[0]; }).filter(function (x) { return String(s || '').indexOf(x) >= 0; }).join(''); }
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

/* ---------- Kendi türünü ekle ---------- */
function ozelTurEkle(grup, bitti) {
  var ad = h('input', { class: 'metin', maxlength: '24', placeholder: t('yeniTurYer'), 'data-odak': '1' });
  var ekle = h('button', { class: 'btn ana', text: t('ekle'), on: { click: kaydet } });
  var s = sayfaAc({ baslik: t('yeniTurBaslik', grupAd(grup)), icerik: h('div', null, h('p', { class: 'alt-yazi', text: t('yeniTurMetin') }), h('div', { class: 'bolum' }, ad)),
    altBar: [h('button', { class: 'btn ikincil', text: t('vazgec'), on: { click: function () { s.kapat(); } } }), ekle] });
  function kaydet() {
    var a = kirp(ad.value, 24); if (!a) { ad.focus(); return; }
    if (A.ozelTur.length >= 40) { tost(t('turSiniri')); return; }
    var id = 'oz' + yeniId().slice(0, 10);
    A.ozelTur.push({ id: id, g: grup, ad: a }); ayarKaydet(); ozelTurKaydet(A.ozelTur);
    s.kapat(); tost(t('turEklendi')); if (bitti) bitti(id);
  }
}
function kategoriSayfasi() {
  var gov = h('div');
  function ciz4() {
    temizle(gov);
    gov.appendChild(h('p', { class: 'alt-yazi', text: t('kategoriMetin') }));
    if (!A.ozelTur.length) { gov.appendChild(h('p', { class: 'alt-yazi', style: { 'margin-top': '14px' }, text: t('kategoriBos') })); return; }
    var g = h('div', { class: 'ayar-grup', style: { 'margin-top': '14px' } });
    A.ozelTur.forEach(function (o) {
      var kullanan = S.parcalar.filter(function (p) { return p.tur === o.id; }).length;
      g.appendChild(h('div', { class: 'satir' }, h('span', { class: 'sol' }, h('div', null, o.ad, h('small', { text: grupAd(o.g) + ', ' + t('parcaSayisi', kullanan) }))),
        h('button', { class: 'ikon-btn', 'aria-label': t('sil'), on: { click: function () {
          if (kullanan) { tost(t('turKullaniliyor')); return; }
          A.ozelTur = A.ozelTur.filter(function (x) { return x.id !== o.id; }); ayarKaydet(); ozelTurKaydet(A.ozelTur); ciz4();
        } } }, ikon('cop', 'k'))));
    });
    gov.appendChild(g);
  }
  sayfaAc({ baslik: t('kategorilerim'), icerik: gov });
  ciz4();
}
