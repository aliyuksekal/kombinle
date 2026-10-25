/* ---------- Kamera (Instagram kamerasından uyarlama) ----------
   Tam ekran vizör; üstte kapat, flaş, zamanlayıcı, ızgara; altta galeri, deklanşör, ön/arka kamera.
   Modlar: "Kıyafet" (arka kamera, hızlı çekim) ve "Boydan" (ön kamera + 10 sn zamanlayıcı: telefonu
   yaslayıp geri çekilerek üzerindeki kombini çekmek için; sonra hangi parçaların ekleneceği sorulur).
   Art arda birkaç parça çekilebilir, "Bitti" ile hepsi sırayla tanınır. İki parmakla yakınlaştırma. */

/* ---------- Kombinle kamerası (telefonun kendi kamera donanımı, CameraX) ----------
   Uygulamada her kamera girişi buradan geçer. Telefonda yerel kamera açılır: gerçek dokunarak odak,
   optik yakınlaştırma (0.5× / 1× / 2×), flaş, ses tuşuyla çekim, 3:4 kare = çekilen kare.
   Tarayıcıda (ya da yerel kamera açılamazsa) aşağıdaki web kamerası kullanılır.
   sec: { mod: 'kiyafet'|'boydan'|'gonderi'|'selfie'|'urun', modlar: [...], tek, sonuc(tuval), bloblar(liste), galeri(), iptal() } */
var KAMERA_MODLARI = { kiyafet: ['kamModKiyafet', 'kamIpucuKiyafet'], boydan: ['kamModBoydan', 'kamIpucuBoydan'], gonderi: ['kamModGonderi', 'kamIpucuGonderi'],
  selfie: ['kamModSelfie', 'kamIpucuSelfie'], urun: ['kamModUrun', 'kamIpucuUrun'] };
function yerelKameraVar() { return !!(YEREL && typeof YEREL.kameraAc === 'function' && typeof YEREL.kameraDosya === 'function'); }
function kameraEtiketleri(modlar) {
  var n = '{n}';
  var e = {
    kapat: t('kapat'), flas: t('kamFlas'), zamanlayici: t('kamZamanlayici'), izgara: t('kamIzgara'), cevir: t('kamCevir'), galeri: t('galeridenSec'),
    cek: t('fotoCek'), bitti: t('kamBitti', n), cekilen: t('kamCekilen', n), enFazla: t('kamEnFazla', n), kapatBaslik: t('kamKapatBaslik'),
    kapatSor: t('kamKapatSor', n), atKapat: t('kamAtVeKapat'), vazgec: t('vazgec'), flasAcik: t('kamFlasAcik'), flasKapali: t('kamFlasKapali'),
    flasOto: t('kamFlasOto'), zamanKapali: t('kamZamanKapali'), hata: t('kamHata'), sonSilindi: t('kamSonSilindi')
  };
  modlar.forEach(function (m) { var k = KAMERA_MODLARI[m]; if (k) { e['mod_' + m] = t(k[0]); e['ipucu_' + m] = t(k[1]); } });
  return e;
}
function yerelDosyaBlob(yol) {
  var b64 = '';
  try { b64 = YEREL.kameraDosya(String(yol)) || ''; } catch (e) { b64 = ''; }
  if (!b64) return null;
  try {
    var ikili = atob(b64), u = new Uint8Array(ikili.length);
    for (var i = 0; i < ikili.length; i++) u[i] = ikili.charCodeAt(i);
    return new Blob([u], { type: 'image/jpeg' });
  } catch (e) { return null; }
}
function blobTuval(b, enUzun) {
  return resimCoz(b).then(function (bmp) { var c = tuvaleCiz(bmp, enUzun || 1440); bmpKapat(bmp); return c; });
}
function yerelKamera(sec) {
  var modlar = (sec.modlar || (sec.tek ? [sec.mod || 'gonderi'] : ['kiyafet', 'boydan'])).filter(function (m) { return KAMERA_MODLARI[m]; });
  if (!modlar.length) modlar = ['kiyafet'];
  var mod = modlar.indexOf(sec.mod) >= 0 ? sec.mod : modlar[0];
  var secenek = { mod: mod, modlar: modlar, tek: !!sec.tek, etiket: kameraEtiketleri(modlar) };
  yerelCagir('kameraAc', [JSON.stringify(secenek)], 3 * 3600000).then(function (d) {
    if (d && d.ok && d.galeri) { if (sec.galeri) sec.galeri(); else $('#dosyaSec').click(); return; }
    if (!d || !d.ok) {
      if (d && d.hata === 'izin') tost(t('kameraIzin'));
      else if (d && d.hata === 'kamera') { kameraAc(Object.assign({}, sec, { web: true })); return; }   // CameraX açılamadı: web kamerası
      if (sec.iptal) sec.iptal();
      return;
    }
    var bloblar = (Array.isArray(d.dosyalar) ? d.dosyalar : []).slice(0, KAMERA_EN_FAZLA).map(yerelDosyaBlob).filter(Boolean);
    try { YEREL.kameraTemizle(); } catch (e) { }
    if (!bloblar.length) { tost(t('kamHata')); if (sec.iptal) sec.iptal(); return; }
    if (sec.bloblar) { sec.bloblar(bloblar); return; }
    if (sec.tek) {
      blobTuval(bloblar[0], sec.enUzun).then(function (c) { if (sec.sonuc) sec.sonuc(c); }).catch(function () { tost(t('kamHata')); });
      return;
    }
    sirayaIsle(bloblar, 0);
  });
}
/* Tek fotoğraf çek: Blob (JPEG) ya da vazgeçilirse null. Galeri düğmesi seçilirse galeriden seçilen dosya. */
function fotografCek(sec) {
  sec = sec || {};
  return new Promise(function (coz) {
    var bitti = false;
    function son(x) { if (!bitti) { bitti = true; coz(x || null); } }
    function galeridenDosya() {
      var inp = h('input', { type: 'file', accept: 'image/*', style: { display: 'none' } });
      document.body.appendChild(inp);
      inp.addEventListener('change', function () { var f = inp.files && inp.files[0]; inp.remove(); son(f); });
      inp.click();
    }
    kameraAc({ tek: true, mod: sec.mod || 'urun', modlar: [sec.mod || 'urun'], web: sec.web,
      bloblar: function (l) { son(l[0]); },
      sonuc: function (c) { c.toBlob(function (b) { son(b); }, 'image/jpeg', 0.9); },
      galeri: galeridenDosya, iptal: function () { son(null); } });
  });
}

var KAMERA_EN_FAZLA = 10;
/* sec.tek: gönderi kamerası — tek kare çekilir, sec.sonuc(tuval) çağrılır; galeri düğmesi sec.galeri() */
function kameraAc(sec) {
  sec = sec || {};
  if (typeof sec !== 'object' || sec instanceof Event) sec = {};
  if (!sec.web && yerelKameraVar()) { yerelKamera(sec); return; }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { tost(t('kameraYok')); if (sec.tek) { if (sec.galeri) sec.galeri(); } else $('#dosyaSec').click(); return; }
  var ayar = LS.al('kamera', null) || {};
  var yon = sec.mod === 'selfie' ? 'user' : 'environment', mod = 'kiyafet', zamanlayici = 0, izgara = ayar.izgara !== false, flas = false;
  var akis = null, iz = null, yetenek = {}, cekimler = [], geriSay = null, kapandi = false, yakin = 1, teslim = false;
  var video = h('video', { autoplay: true, playsinline: true, muted: true });
  var izgaraEl = h('div', { class: 'kam-izgara' });
  var sayac = h('div', { class: 'kam-sayac', hidden: true });
  var ipucu = h('div', { class: 'kam-ipucu', text: t('kameraAciliyor') });
  var yakinEl = h('div', { class: 'kam-yakin', hidden: true });
  var flasBtn = h('button', { class: 'kam-btn', 'aria-label': t('kamFlas'), hidden: true, on: { click: flasDegis } }, kamIkon('flas'));
  var zamanBtn = h('button', { class: 'kam-btn', 'aria-label': t('kamZamanlayici'), on: { click: zamanDegis } });
  var izgaraBtn = h('button', { class: 'kam-btn', 'aria-label': t('kamIzgara'), 'aria-pressed': izgara ? 'true' : 'false', on: { click: izgaraDegis } }, kamIkon('izgara'));
  var kapatBtn = h('button', { class: 'kam-btn', 'aria-label': t('kapat'), on: { click: function () { kapat(); } } }, ikon('kapat'));
  var deklansor = h('button', { class: 'deklansor kam-deklansor', 'aria-label': t('fotoCek'), disabled: true, on: { click: cekBas } }, h('span'));
  var galeriBtn = h('button', { class: 'kam-galeri', 'aria-label': t('galeridenSec'), on: { click: galeri } }, ikon('galeri'));
  var cevirBtn = h('button', { class: 'kam-btn kam-cevir', 'aria-label': t('kamCevir'), on: { click: cevir } }, kamIkon('cevir'));
  var bittiBtn = h('button', { class: 'kam-bitti', hidden: true, on: { click: bitti } });
  var modlar = h('div', { class: 'kam-modlar' });
  var flasPerde = h('div', { class: 'kam-flas-perde' });
  var vizor = h('div', { class: 'kam-vizor' }, video, izgaraEl, sayac, yakinEl, flasPerde);
  var kok = h('div', { class: 'kam', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('fotoCek') },
    h('div', { class: 'kam-ust' }, kapatBtn, h('div', { class: 'kam-ust-sag' }, flasBtn, zamanBtn, izgaraBtn)),
    vizor, ipucu,
    h('div', { class: 'kam-alt' }, modlar, h('div', { class: 'kam-alt-sira' }, galeriBtn, deklansor, h('div', { class: 'kam-sag' }, bittiBtn, cevirBtn))));
  document.body.appendChild(kok);
  requestAnimationFrame(function () { kok.classList.add('acik'); });
  /* geri tuşu kamerayı kapatsın */
  var kayit = { kapandi: false };
  YIGIN.push(kayit);
  gecmisEkle();
  kayit.kapat = function (gecmisten) { kapat(gecmisten); };

  function kamIkon(ad) {
    var yollar = {
      flas: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
      flasYok: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/><path d="M3 3l18 18"/>',
      izgara: '<path d="M3 9h18M3 15h18M9 3v18M15 3v18"/><rect x="3" y="3" width="18" height="18" rx="3"/>',
      saat: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9.5 2.5h5"/>',
      cevir: '<path d="M4 10a8 8 0 0 1 14-4l2 2"/><path d="M20 4v4h-4"/><path d="M20 14a8 8 0 0 1-14 4l-2-2"/><path d="M4 20v-4h4"/>'
    };
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'ik');
    s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '1.8'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round');
    s.innerHTML = yollar[ad] || '';
    return s;
  }
  function ayarYaz() { LS.yaz('kamera', { izgara: izgara }); }
  function zamanCiz() { temizle(zamanBtn); zamanBtn.appendChild(kamIkon('saat')); zamanBtn.appendChild(h('b', { text: zamanlayici ? zamanlayici + 's' : t('kamKapali') })); zamanBtn.setAttribute('aria-pressed', zamanlayici ? 'true' : 'false'); }
  function izgaraCiz() { izgaraEl.hidden = !izgara; izgaraBtn.setAttribute('aria-pressed', izgara ? 'true' : 'false'); }
  function modCiz() {
    temizle(modlar);
    if (sec.tek) { var km = KAMERA_MODLARI[sec.mod] || KAMERA_MODLARI.gonderi; modlar.appendChild(h('button', { 'aria-pressed': 'true', text: t(km[0]) })); ipucu.textContent = t(km[1]); return; }
    [['kiyafet', t('kamModKiyafet')], ['boydan', t('kamModBoydan')]].forEach(function (x) {
      modlar.appendChild(h('button', { 'aria-pressed': mod === x[0] ? 'true' : 'false', text: x[1], on: { click: function () { modSec(x[0]); } } }));
    });
    ipucu.textContent = mod === 'boydan' ? t('kamIpucuBoydan') : t('kamIpucuKiyafet');
    vizor.classList.toggle('boydan', mod === 'boydan');
  }
  function modSec(m) {
    if (mod === m) return;
    mod = m;
    zamanlayici = m === 'boydan' ? 10 : 0; zamanCiz();
    var istenen = m === 'boydan' ? 'user' : 'environment';
    modCiz();
    if (istenen !== yon) { yon = istenen; baslat(); }
  }
  function durdur() { if (akis) { akis.getTracks().forEach(function (tr) { try { tr.stop(); } catch (e) { } }); akis = null; iz = null; } }
  function baslat() {
    durdur();
    deklansor.disabled = true; flas = false; flasBtn.hidden = true; yakinEl.hidden = true; yakin = 1;
    video.classList.toggle('ayna', yon === 'user');
    zamanAsimi(navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: yon }, width: { ideal: 1920 }, height: { ideal: 1920 } }, audio: false }), 15000)
      .then(function (st) {
        if (kapandi) { st.getTracks().forEach(function (tr) { tr.stop(); }); return; }
        akis = st; video.srcObject = st; iz = st.getVideoTracks()[0] || null;
        try { yetenek = iz && iz.getCapabilities ? iz.getCapabilities() || {} : {}; } catch (e) { yetenek = {}; }
        flasBtn.hidden = !yetenek.torch; flasCiz();
        deklansor.disabled = false;
        modCiz();
      }).catch(function () {
        ipucu.textContent = t('kameraIzin');
        deklansor.disabled = true;
      });
  }
  function flasCiz() { temizle(flasBtn); flasBtn.appendChild(kamIkon(flas ? 'flas' : 'flasYok')); flasBtn.setAttribute('aria-pressed', flas ? 'true' : 'false'); }
  function flasDegis() {
    if (!iz || !yetenek.torch) return;
    flas = !flas;
    iz.applyConstraints({ advanced: [{ torch: flas }] }).catch(function () { flas = false; }).then(flasCiz);
  }
  function zamanDegis() { zamanlayici = zamanlayici === 0 ? 3 : zamanlayici === 3 ? 10 : 0; zamanCiz(); }
  function izgaraDegis() { izgara = !izgara; izgaraCiz(); ayarYaz(); }
  function cevir() { yon = yon === 'user' ? 'environment' : 'user'; baslat(); }
  /* iki parmakla yakınlaştırma (telefonun kamerası destekliyorsa) */
  var tutam = null;
  vizor.addEventListener('touchstart', function (e) {
    if (e.touches.length === 2 && yetenek.zoom) tutam = { d: mesafe(e.touches), z: yakin };
  }, { passive: true });
  vizor.addEventListener('touchmove', function (e) {
    if (!tutam || e.touches.length !== 2 || !iz) return;
    var z = Math.max(yetenek.zoom.min || 1, Math.min(Math.min(yetenek.zoom.max || 1, 8), tutam.z * mesafe(e.touches) / tutam.d));
    yakin = z; yakinEl.hidden = false; yakinEl.textContent = z.toFixed(1) + '×';
    try { iz.applyConstraints({ advanced: [{ zoom: z }] }).catch(function () { }); } catch (er) { }
  }, { passive: true });
  vizor.addEventListener('touchend', function () { tutam = null; setTimeout(function () { yakinEl.hidden = true; }, 900); });
  function mesafe(d) { var x = d[0].clientX - d[1].clientX, y = d[0].clientY - d[1].clientY; return Math.sqrt(x * x + y * y); }
  function cekBas() {
    if (!akis || deklansor.disabled) return;
    if (geriSay) { clearInterval(geriSay); geriSay = null; sayac.hidden = true; deklansor.classList.remove('sayiyor'); return; }   // geri sayımı iptal
    if (!zamanlayici) { cek(); return; }
    var n = zamanlayici;
    sayac.hidden = false; sayac.textContent = String(n); deklansor.classList.add('sayiyor');
    geriSay = setInterval(function () {
      n--;
      if (n <= 0) { clearInterval(geriSay); geriSay = null; sayac.hidden = true; deklansor.classList.remove('sayiyor'); cek(); return; }
      sayac.textContent = String(n);
    }, 1000);
  }
  function cek() {
    if (!akis || !video.videoWidth || cekimler.length >= KAMERA_EN_FAZLA) return;
    var c = document.createElement('canvas');
    var o = Math.min(1, 1920 / Math.max(video.videoWidth, video.videoHeight));
    c.width = Math.round(video.videoWidth * o); c.height = Math.round(video.videoHeight * o);
    c.getContext('2d').drawImage(video, 0, 0, c.width, c.height);   // ön kamerada da yazılar ters çıkmasın: ayna uygulanmaz
    if (sec.tek) {   // gönderi: çekilen kare düzenlemeye gider
      flasPerde.classList.remove('cak'); void flasPerde.offsetWidth; flasPerde.classList.add('cak');
      teslim = true; kapat(); setTimeout(function () { if (sec.sonuc) sec.sonuc(c); }, 320);
      return;
    }
    cekimler.push(c);
    flasPerde.classList.remove('cak'); void flasPerde.offsetWidth; flasPerde.classList.add('cak');
    try { if (navigator.vibrate) navigator.vibrate(15); } catch (e) { }
    galeriCiz();
    if (cekimler.length >= KAMERA_EN_FAZLA) tost(t('kamEnFazla', KAMERA_EN_FAZLA));
  }
  /* son çekilen kare galeri düğmesinde küçük resim olur; sayısıyla "Bitti" düğmesi çıkar */
  function galeriCiz() {
    temizle(galeriBtn);
    var son = cekimler[cekimler.length - 1];
    if (son) {
      var k = document.createElement('canvas'), oo = 96 / Math.max(son.width, son.height);
      k.width = Math.round(son.width * oo); k.height = Math.round(son.height * oo);
      k.getContext('2d').drawImage(son, 0, 0, k.width, k.height);
      galeriBtn.appendChild(k); galeriBtn.appendChild(h('b', { class: 'kam-adet', text: String(cekimler.length) }));
      galeriBtn.setAttribute('aria-label', t('kamCekilen', cekimler.length));
    } else galeriBtn.appendChild(ikon('galeri'));
    bittiBtn.hidden = !cekimler.length;
    temizle(bittiBtn); bittiBtn.appendChild(document.createTextNode(t('kamBitti', cekimler.length)));
  }
  function galeri() {
    if (sec.tek) { teslim = true; kapat(); setTimeout(function () { if (sec.galeri) sec.galeri(); }, 300); return; }
    if (cekimler.length) { onayla(t('kamCekilenler'), t('kamSonuSil'), t('sil'), true).then(function (evet) { if (evet) { cekimler.pop(); galeriCiz(); } }); return; }
    teslim = true; kapat(); setTimeout(function () { $('#dosyaSec').click(); }, 300);
  }
  function bitti() {
    var l = cekimler.slice(); cekimler = [];
    teslim = true; kapat();
    if (l.length) setTimeout(function () { sirayaIsle(l, 0); }, 320);
  }
  function kapat(gecmisten) {
    if (kapandi) return;
    if (cekimler.length && !gecmisten) {
      onayla(t('kamKapatBaslik'), t('kamKapatSor', cekimler.length), t('kamAtVeKapat'), true).then(function (evet) { if (evet) { cekimler = []; kapat(); } });
      return;
    }
    kapandi = true; kayit.kapandi = true;
    var i = YIGIN.indexOf(kayit); if (i >= 0) YIGIN.splice(i, 1);
    if (geriSay) clearInterval(geriSay);
    durdur();
    kok.classList.remove('acik');
    setTimeout(function () { kok.remove(); }, 250);
    if (!gecmisten) { geriKilit++; try { history.back(); } catch (e) { geriKilit--; } }
    if (!teslim && sec.iptal) setTimeout(sec.iptal, 300);
  }
  zamanCiz(); izgaraCiz(); modCiz(); galeriCiz();
  baslat();
}

Object.assign(DIL.tr, {
  kamFlas: 'Flaş', kamZamanlayici: 'Zamanlayıcı', kamIzgara: 'Izgara', kamCevir: 'Kamerayı çevir', kamKapali: 'Kapalı',
  kamModKiyafet: 'Kıyafet', kamModBoydan: 'Boydan', kamIpucuKiyafet: 'Kıyafeti düz bir zemine ser ya da as; çerçeveyi doldur.',
  kamIpucuBoydan: 'Telefonu yasla, geri çekil: 10 sn sonra çekilir. Sonra hangi parçaları ekleyeceğini seçersin.',
  kamBitti: function (n) { return 'Bitti (' + n + ')'; }, kamCekilen: function (n) { return n + ' fotoğraf çekildi'; }, kamCekilenler: 'Son fotoğraf',
  kamSonuSil: 'Son çektiğin fotoğraf silinsin mi?', kamEnFazla: function (n) { return 'Bir seferde en fazla ' + n + ' fotoğraf; "Bitti"ye dokun.'; },
  kamKapatBaslik: 'Kameradan çık', kamKapatSor: function (n) { return 'Çektiğin ' + n + ' fotoğraf eklenmeden silinecek.'; }, kamAtVeKapat: 'Sil ve çık'
});
Object.assign(DIL.en, {
  kamFlas: 'Flash', kamZamanlayici: 'Timer', kamIzgara: 'Grid', kamCevir: 'Flip camera', kamKapali: 'Off',
  kamModKiyafet: 'Item', kamModBoydan: 'Full body', kamIpucuKiyafet: 'Lay the item flat or hang it; fill the frame.',
  kamIpucuBoydan: 'Prop the phone up and step back: it shoots in 10 s. Then pick which pieces to add.',
  kamBitti: function (n) { return 'Done (' + n + ')'; }, kamCekilen: function (n) { return n + ' photos taken'; }, kamCekilenler: 'Last photo',
  kamSonuSil: 'Delete the last photo you took?', kamEnFazla: function (n) { return 'Up to ' + n + ' photos at a time; tap "Done".'; },
  kamKapatBaslik: 'Leave camera', kamKapatSor: function (n) { return 'Your ' + n + ' photos will be discarded.'; }, kamAtVeKapat: 'Discard and leave'
});
Object.assign(DIL.ru, {
  kamFlas: 'Вспышка', kamZamanlayici: 'Таймер', kamIzgara: 'Сетка', kamCevir: 'Сменить камеру', kamKapali: 'Выкл',
  kamModKiyafet: 'Вещь', kamModBoydan: 'В полный рост', kamIpucuKiyafet: 'Разложи вещь или повесь её; заполни кадр.',
  kamIpucuBoydan: 'Поставь телефон и отойди: снимок через 10 с. Потом выберешь, какие вещи добавить.',
  kamBitti: function (n) { return 'Готово (' + n + ')'; }, kamCekilen: function (n) { return 'Снято фото: ' + n; }, kamCekilenler: 'Последнее фото',
  kamSonuSil: 'Удалить последнее фото?', kamEnFazla: function (n) { return 'Не больше ' + n + ' фото за раз; нажми «Готово».'; },
  kamKapatBaslik: 'Выйти из камеры', kamKapatSor: function (n) { return 'Снятые фото (' + n + ') будут удалены.'; }, kamAtVeKapat: 'Удалить и выйти'
});
Object.assign(DIL.uz, {
  kamFlas: 'Chiroq', kamZamanlayici: 'Taymer', kamIzgara: "To'r", kamCevir: 'Kamerani almashtirish', kamKapali: "O'chiq",
  kamModKiyafet: 'Kiyim', kamModBoydan: "To'liq bo'y", kamIpucuKiyafet: "Kiyimni tekis yoying yoki iling; ramkani to'ldiring.",
  kamIpucuBoydan: "Telefonni qo'ying va orqaga chekining: 10 soniyada suratga oladi. Keyin qaysi kiyimlarni qo'shishni tanlaysiz.",
  kamBitti: function (n) { return 'Tayyor (' + n + ')'; }, kamCekilen: function (n) { return n + ' ta surat olindi'; }, kamCekilenler: 'Oxirgi surat',
  kamSonuSil: "Oxirgi surat o'chirilsinmi?", kamEnFazla: function (n) { return 'Bir martada ' + n + ' tagacha surat; «Tayyor»ni bosing.'; },
  kamKapatBaslik: 'Kameradan chiqish', kamKapatSor: function (n) { return "Olingan " + n + " ta surat o'chiriladi."; }, kamAtVeKapat: "O'chirib chiqish"
});

Object.assign(DIL.tr, {
  kamModSelfie: 'Selfie', kamIpucuSelfie: 'Yüzün pencereye dönük, doğal ışıkta; filtresiz ve tek başına.', kamModUrun: 'Ürün',
  kamIpucuUrun: 'Kıyafeti çerçeveye sığdır; askıda ya da üzerinde olabilir.', kamFlasAcik: 'Flaş açık', kamFlasKapali: 'Flaş kapalı', kamFlasOto: 'Flaş otomatik',
  kamZamanKapali: 'Zamanlayıcı kapalı', kamHata: 'Fotoğraf çekilemedi, tekrar dene.', kamSonSilindi: 'Son fotoğraf silindi'
});
Object.assign(DIL.en, {
  kamModSelfie: 'Selfie', kamIpucuSelfie: 'Face a window in natural light; no filter, just you.', kamModUrun: 'Item',
  kamIpucuUrun: 'Fit the item in the frame, on the hanger or on you.', kamFlasAcik: 'Flash on', kamFlasKapali: 'Flash off', kamFlasOto: 'Flash auto',
  kamZamanKapali: 'Timer off', kamHata: "Couldn't take the photo, try again.", kamSonSilindi: 'Last photo deleted'
});
Object.assign(DIL.ru, {
  kamModSelfie: 'Селфи', kamIpucuSelfie: 'Лицом к окну, при дневном свете; без фильтров и одна.', kamModUrun: 'Вещь',
  kamIpucuUrun: 'Помести вещь в кадр: на вешалке или на тебе.', kamFlasAcik: 'Вспышка вкл.', kamFlasKapali: 'Вспышка выкл.', kamFlasOto: 'Авто-вспышка',
  kamZamanKapali: 'Таймер выкл.', kamHata: 'Не удалось сделать фото, попробуй ещё раз.', kamSonSilindi: 'Последнее фото удалено'
});
Object.assign(DIL.uz, {
  kamModSelfie: 'Selfi', kamIpucuSelfie: "Derazaga qarab, tabiiy yorug'likda; filtrsiz va yolg'iz.", kamModUrun: 'Kiyim',
  kamIpucuUrun: "Kiyimni kadrga sig'dir: ilgichda yoki ustingda.", kamFlasAcik: 'Chiroq yoqiq', kamFlasKapali: "Chiroq o'chiq", kamFlasOto: 'Chiroq avtomatik',
  kamZamanKapali: "Taymer o'chiq", kamHata: "Surat olinmadi, qayta urinib ko'ring.", kamSonSilindi: "Oxirgi surat o'chirildi"
});
Object.assign(DIL.ko, {
  kamModSelfie: '셀카', kamIpucuSelfie: '창문을 바라보고 자연광에서, 필터 없이 혼자 찍으세요.', kamModUrun: '아이템',
  kamIpucuUrun: '옷을 프레임에 맞추세요. 옷걸이에 걸거나 입은 채로 괜찮아요.', kamFlasAcik: '플래시 켬', kamFlasKapali: '플래시 끔', kamFlasOto: '플래시 자동',
  kamZamanKapali: '타이머 끔', kamHata: '사진을 찍지 못했어요. 다시 시도하세요.', kamSonSilindi: '마지막 사진을 삭제했어요'
});
