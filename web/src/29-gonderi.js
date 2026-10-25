/* ---------- Yeni gönderi: kamera / galeri → düzenle (filtre, ışık, kırp, döndür) → paylaş ----------
   Instagram'daki akıştan uyarlama: "+" önce kaynağı sorar, fotoğraf düzenleyicide hazırlanır, sonra paylaşım sayfası açılır. */

function galeridenTuval() {
  return new Promise(function (coz) {
    var inp = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', style: { display: 'none' } });
    document.body.appendChild(inp);
    inp.addEventListener('change', function () {
      var f = inp.files && inp.files[0]; inp.remove();
      if (!f) { coz(null); return; }
      if (f.size > EN_BUYUK_DOSYA) { tost(t('dosyaBuyuk')); coz(null); return; }
      resimCoz(f).then(function (bmp) {
        var c = tuvaleCiz(bmp, 1440);   /* yeniden çizim: konum gibi EXIF bilgileri gitmez */
        bmpKapat(bmp);
        coz(c);
      }).catch(function () { tost(t('dosyaBozuk')); coz(null); });
    });
    inp.click();
  });
}
/* kaynak seç: sonra düzenleyici, sonra fn(tuval) */
function gonderiFotografi(fn) {
  var g = h('div', { class: 'ayar-grup' });
  var s = sayfaAc({ baslik: t('yeniPaylasim'), icerik: g });
  var sonra = function (c) { if (!c) return; fotoDuzenle(c).then(function (d) { if (d) fn(d); }); };
  g.appendChild(menuSatir('kamera', t('gnKamera'), t('gnKameraAlt'), function () {
    s.kapat();
    setTimeout(function () { kameraAc({ tek: true, sonuc: sonra, galeri: function () { galeridenTuval().then(sonra); } }); }, 300);
  }));
  g.appendChild(menuSatir('galeri', t('gnGaleri'), t('gnGaleriAlt'), function () { s.kapat(); setTimeout(function () { galeridenTuval().then(sonra); }, 300); }));
}
/* profildeki ve keşfetteki "+" */
function yeniPaylasim() {
  if (!yzKurulu()) { tost(t('tpYok')); return; }
  if (!girisIste()) return;
  gonderiFotografi(function (c) { paylasSayfasi(null, null, c); });
}

/* ---------- Fotoğraf düzenleyici ---------- */
var FILTRELER = [
  { id: 'orijinal', f: '' },
  { id: 'canli', f: 'saturate(1.35) contrast(1.08)' },
  { id: 'sicak', f: 'sepia(.18) saturate(1.2) brightness(1.03)', ton: 22 },
  { id: 'soguk', f: 'saturate(.92) brightness(1.03)', ton: -24 },
  { id: 'pastel', f: 'saturate(.72) brightness(1.08) contrast(.9)' },
  { id: 'vintage', f: 'sepia(.42) contrast(.9) brightness(1.06) saturate(.9)', vinyet: 35 },
  { id: 'dramatik', f: 'contrast(1.32) saturate(1.1) brightness(.94)', vinyet: 45 },
  { id: 'parlak', f: 'brightness(1.14) contrast(1.04)' },
  { id: 'sb', f: 'grayscale(1) contrast(1.12)' }
];
var DUZEN_AYAR = [['parlaklik', 'gnParlaklik'], ['kontrast', 'gnKontrast'], ['doygunluk', 'gnDoygunluk'], ['sicaklik', 'gnSicaklik'], ['vinyet', 'gnVinyet']];

/* src tuvalini ayarlarla hedefe çizer (önizleme ve son hâl aynı yoldan geçer) */
function duzenCiz(hedef, src, a) {
  var x = hedef.getContext('2d'), w = hedef.width, hh = hedef.height;
  var fl = FILTRELER.filter(function (f) { return f.id === a.filtre; })[0] || FILTRELER[0];
  var ek = 'brightness(' + (1 + a.parlaklik / 100) + ') contrast(' + (1 + a.kontrast / 100) + ') saturate(' + (1 + a.doygunluk / 100) + ')';
  x.save();
  x.clearRect(0, 0, w, hh);
  try { x.filter = (fl.f + ' ' + ek).trim(); } catch (e) { }
  x.imageSmoothingQuality = 'high';
  x.drawImage(src, 0, 0, w, hh);
  try { x.filter = 'none'; } catch (e) { }
  /* sıcaklık: turuncu ya da mavi yumuşak ışık */
  var ton = a.sicaklik + (fl.ton || 0);
  if (ton) {
    x.globalCompositeOperation = 'soft-light';
    x.fillStyle = ton > 0 ? 'rgba(255,150,50,' + Math.min(0.6, ton / 100) + ')' : 'rgba(60,130,255,' + Math.min(0.6, -ton / 100) + ')';
    x.fillRect(0, 0, w, hh);
  }
  /* vinyet: kenarlar koyulaşır */
  var v = Math.max(a.vinyet, fl.vinyet || 0);
  if (v > 0) {
    x.globalCompositeOperation = 'source-over';
    var gr = x.createRadialGradient(w / 2, hh / 2, Math.min(w, hh) * 0.35, w / 2, hh / 2, Math.max(w, hh) * 0.75);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,' + (v / 100) * 0.7 + ')');
    x.fillStyle = gr; x.fillRect(0, 0, w, hh);
  }
  x.restore();
}
function tuvalKopya(c, enFazla) {
  var o = Math.min(1, (enFazla || 1e9) / Math.max(c.width, c.height));
  var d = document.createElement('canvas'); d.width = Math.max(1, Math.round(c.width * o)); d.height = Math.max(1, Math.round(c.height * o));
  var x = d.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(c, 0, 0, d.width, d.height);
  return d;
}
function tuvalDondur(c) {
  var d = document.createElement('canvas'); d.width = c.height; d.height = c.width;
  var x = d.getContext('2d'); x.translate(d.width, 0); x.rotate(Math.PI / 2); x.drawImage(c, 0, 0);
  return d;
}
/* Promise<tuval|null>: null = vazgeçildi */
function fotoDuzenle(kaynak) {
  return new Promise(function (coz) {
    var bitti = false;
    var son = function (v) { if (bitti) return; bitti = true; coz(v); };
    var temel = tuvalKopya(kaynak, 1440);
    var a = { filtre: 'orijinal', parlaklik: 0, kontrast: 0, doygunluk: 0, sicaklik: 0, vinyet: 0 };
    var onizleme = document.createElement('canvas'); onizleme.className = 'gn-onizleme';
    var kucuk = null;
    function onizlemeKur() {
      kucuk = tuvalKopya(temel, 900);
      onizleme.width = kucuk.width; onizleme.height = kucuk.height;
      ciz();
    }
    function ciz() { duzenCiz(onizleme, kucuk, a); }
    var sekme = 'filtre';
    var arac = h('div', { class: 'gn-arac' });
    var sekmeler = h('div', { class: 'seg gn-sekmeler' });
    function sekmeCiz() {
      temizle(sekmeler);
      [['filtre', 'gnFiltre'], ['ayar', 'gnAyarla'], ['kirp', 'gnKirp']].forEach(function (x) {
        sekmeler.appendChild(h('button', { 'aria-pressed': sekme === x[0] ? 'true' : 'false', text: t(x[1]), on: { click: function () { sekme = x[0]; sekmeCiz(); aracCiz(); } } }));
      });
    }
    function aracCiz() {
      temizle(arac);
      if (sekme === 'filtre') {
        var sira = h('div', { class: 'gn-filtreler' });
        var minik = tuvalKopya(temel, 120);
        FILTRELER.forEach(function (f) {
          var c = document.createElement('canvas'); c.width = minik.width; c.height = minik.height;
          duzenCiz(c, minik, { filtre: f.id, parlaklik: 0, kontrast: 0, doygunluk: 0, sicaklik: 0, vinyet: 0 });
          sira.appendChild(h('button', { class: 'gn-filtre', 'aria-pressed': a.filtre === f.id ? 'true' : 'false', on: { click: function () { a.filtre = f.id; ciz(); aracCiz(); } } },
            h('span', { class: 'gn-filtre-resim' }, c), h('b', { text: t('gnF_' + f.id) })));
        });
        arac.appendChild(sira);
      } else if (sekme === 'ayar') {
        DUZEN_AYAR.forEach(function (x) {
          var en = x[0] === 'vinyet' ? 0 : -50;
          var deger = h('output', { text: String(a[x[0]]) });
          var kaydir = h('input', { type: 'range', min: String(en), max: '50', step: '1', value: String(a[x[0]]), 'aria-label': t(x[1]) });
          kaydir.addEventListener('input', function () { a[x[0]] = parseInt(kaydir.value, 10) || 0; deger.textContent = String(a[x[0]]); ciz(); });
          kaydir.addEventListener('dblclick', function () { a[x[0]] = 0; kaydir.value = '0'; deger.textContent = '0'; ciz(); });
          arac.appendChild(h('label', { class: 'gn-kaydir' }, h('span', { text: t(x[1]) }), kaydir, deger));
        });
        arac.appendChild(h('button', { class: 'btn ikincil kucuk', on: { click: function () { DUZEN_AYAR.forEach(function (x) { a[x[0]] = 0; }); ciz(); aracCiz(); } } }, ikon('yenile', 'k'), t('gnSifirla')));
      } else {
        arac.appendChild(h('div', { class: 'sarili gn-kirp' },
          h('button', { class: 'btn ikincil', on: { click: function () {
            elleKirp(temel, false).then(function (c) { if (c) { temel = c; onizlemeKur(); } });
          } } }, ikon('kirp', 'k'), t('kirp')),
          h('button', { class: 'btn ikincil', on: { click: function () { temel = tuvalDondur(temel); onizlemeKur(); } } }, ikon('yenile', 'k'), t('gnDondur'))));
      }
    }
    var bittiBtn = h('button', { class: 'btn ana', on: { click: function () {
      var c = document.createElement('canvas'); c.width = temel.width; c.height = temel.height;
      duzenCiz(c, temel, a);
      son(c); s.kapat();
    } } }, ikon('tik', 'k'), t('gnDevam'));
    var s = sayfaAc({
      tam: true, baslik: t('gnBaslik'),
      icerik: h('div', { class: 'gn-sayfa' }, h('div', { class: 'gn-sahne' }, onizleme), sekmeler, arac),
      altBar: [h('button', { class: 'btn ikincil', on: { click: function () { s.kapat(); } } }, t('vazgec')), bittiBtn],
      kapaninca: function () { son(null); }
    });
    /* önizlemeye basılı tutunca orijinali göster */
    var gercek = function (v) { if (v) { var x = onizleme.getContext('2d'); x.clearRect(0, 0, onizleme.width, onizleme.height); x.drawImage(kucuk, 0, 0); } else ciz(); };
    onizleme.addEventListener('pointerdown', function () { gercek(true); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (e) { onizleme.addEventListener(e, function () { gercek(false); }); });
    onizlemeKur(); sekmeCiz(); aracCiz();
  });
}

/* ---------- Telefon bildirimleri ayarı ---------- */
function bildirimAyarSatiri() {
  var durum = true;
  try { durum = !(YEREL && typeof YEREL.bildirimDurum === 'function') || YEREL.bildirimDurum(); } catch (e) { }
  return h('div', { class: 'satir bn-ayar', style: { 'flex-wrap': 'wrap' } },
    h('span', { class: 'sol' }, ikon('zil'), h('div', null, t('bnAyarBaslik'), h('small', { text: durum ? t('bnAyarAcik') : t('bnAyarKapali') }))),
    h('button', { class: 'btn ikincil kucuk', on: { click: function () {
      try { if (YEREL && YEREL.bildirimAyarlari) YEREL.bildirimAyarlari(); else tost(t('bnAyarTelefon')); } catch (e) { }
    } } }, durum ? t('bnAyarDuzenle') : t('bnAyarAc')));
}
/* uygulama açıkken yeni bildirim: üstte dokunulabilir şerit + telefonun bildirim paneli */
function bildirimSeridi(baslik, ac) {
  var eski = $('.bn-serit'); if (eski) eski.remove();
  var el = h('button', { class: 'bn-serit', role: 'status' }, ikon(ac === 'mesaj' ? 'gonder' : 'zil', 'k'), h('span', { text: baslik }));
  el.addEventListener('click', function () { el.remove(); if (ac === 'mesaj') dmKutusu(); else bildirimSayfasi(); });
  document.body.appendChild(el);
  requestAnimationFrame(function () { el.classList.add('acik'); });
  setTimeout(function () { el.classList.remove('acik'); setTimeout(function () { el.remove(); }, 300); }, 4500);
  try { if (YEREL && typeof YEREL.bildirimGoster === 'function') YEREL.bildirimGoster(baslik, t('bnPanelAlt'), ac === 'mesaj' ? 'mesaj' : 'bildirim'); } catch (e) { }
}

/* ---------- Keşfet: yukarıdan aşağı çekince yenile (sayfanın neresinden çekilirse) ---------- */
var CEK = { bas: null, fark: 0, el: null };
function kesfetYenile() {
  if (TOPLULUK.yukleniyor) return;
  REKLAM.plan = {}; REKLAM.ilk = 0;
  KISI_ONBELLEK.zaman = 0;
  if (S.kesfetSekme === 'topluluk') { if (TOPLULUK.sira === 'anket') anketYukle(true); else { TOPLULUK.yuklendi = false; toplulukYukle(true); } }
  bildirimSayi(true);
  ciz();
}
document.addEventListener('touchstart', function (e) {
  CEK.bas = null; CEK.fark = 0;
  if (S.sekme !== 'kesfet' || YIGIN.length || e.touches.length !== 1) return;
  if ((window.scrollY || document.documentElement.scrollTop) > 2) return;
  if (e.target && e.target.closest && e.target.closest('input,textarea,.g-kisi-sira,.kt-sira,.g-haplar')) return;
  CEK.bas = e.touches[0].clientY;
}, { passive: true });
document.addEventListener('touchmove', function (e) {
  if (CEK.bas === null) return;
  CEK.fark = e.touches[0].clientY - CEK.bas;
  if (CEK.fark < 10) { if (CEK.el) CEK.el.style.opacity = '0'; return; }
  if (!CEK.el) { CEK.el = h('div', { class: 'cek-yenile-ust' }, ikon('yenile', 'k')); document.body.appendChild(CEK.el); }
  var o = Math.min(1, CEK.fark / 90);
  CEK.el.style.opacity = String(o);
  CEK.el.style.transform = 'translate(-50%,' + Math.min(70, CEK.fark * 0.5) + 'px) rotate(' + Math.round(o * 300) + 'deg)';
  CEK.el.classList.toggle('hazir', CEK.fark > 90);
}, { passive: true });
document.addEventListener('touchend', function () {
  if (CEK.el) { var g = CEK.el; CEK.el = null; g.style.opacity = '0'; setTimeout(function () { g.remove(); }, 250); }
  if (CEK.bas !== null && CEK.fark > 90) kesfetYenile();
  CEK.bas = null; CEK.fark = 0;
});

/* ---------- Keşfet: takip ettiklerin (hikâye sırası gibi) ve kişi kartları ---------- */
var KISI_ONBELLEK = { zaman: 0, takip: null, oneri: null };
function kisiResimleri(k, adres) {
  var l = Array.isArray(k.resimler) ? k.resimler.filter(function (id) { return /^[a-z0-9]{20}$/.test(id); }).slice(0, 3) : [];
  var kap = h('div', { class: 'kk-resimler' });
  for (var i = 0; i < 3; i++) {
    kap.appendChild(l[i] && adres ? h('img', { src: adres + '/v1/resim/' + l[i], alt: '', loading: 'lazy', referrerpolicy: 'no-referrer' }) : h('span', { class: 'kk-bos' }, i === 0 && !l.length ? ikon('galeri', 'k') : null));
  }
  return kap;
}
function kisiKarti(k, adres) {
  var ad = kirp(k.takma, 24), kd = typeof k.kadi === 'string' ? k.kadi : '', bio = typeof k.bio === 'string' ? kirp(k.bio, 80) : '';
  var ac = function () { profilSayfasi(k.kod, { takma: ad, kadi: kd, bio: bio, av: k.av }); };
  return h('div', { class: 'g-kisi kk' },
    h('button', { class: 'g-kisi-ac', on: { click: ac } },
      kisiResimleri(k, adres),
      avatarDoldur(h('span', { class: 'uav' }), kisiAvatar(k.kod, k.av, ad), ad), h('b', { text: ad }), kadiEl(kd),
      bio ? h('p', { class: 'kk-bio', text: bio }) : null,
      h('small', { text: t('takipciSay', k.takipci | 0) + ' • ' + t('paylasimSay', k.paylasim | 0) })),
    takipDugmesi(k.kod, !!k.takipte, !!k.istekte));
}
function takipSirasi() {
  var kap = h('div', { class: 'kt', hidden: true });
  var sira = h('div', { class: 'kt-sira' });
  kap.appendChild(h('div', { class: 'g-kisiler-bas' }, h('b', null, t('ktBaslik'))));
  kap.appendChild(sira);
  function doldur(l) {
    temizle(sira);
    l = (l || []).filter(function (k) { return k && /^[a-f0-9]{12}$/.test(k.kod) && typeof k.takma === 'string'; });
    kap.hidden = !l.length;
    l.forEach(function (k) {
      var ad = kirp(k.takma, 24), yeni = sayiMi(k.son) && Date.now() - k.son < 86400000;
      sira.appendChild(h('button', { class: 'kt-kisi' + (yeni ? ' yeni' : ''), 'aria-label': ad + (yeni ? ' — ' + t('ktYeni') : ''), on: { click: function () { profilSayfasi(k.kod, { takma: ad, kadi: k.kadi, bio: k.bio, av: k.av }); } } },
        h('span', { class: 'kt-halka' }, avatarDoldur(h('span', { class: 'uav' }), kisiAvatar(k.kod, k.av, ad), ad)), h('small', { text: ad })));
    });
  }
  if (KISI_ONBELLEK.takip && Date.now() - KISI_ONBELLEK.zaman < 120000) doldur(KISI_ONBELLEK.takip);
  else yzIste('/v1/kisiler', { mod: 'takip', engelli: engelliler() }, 15000).then(function (v) {
    KISI_ONBELLEK.takip = Array.isArray(v.liste) ? v.liste : []; KISI_ONBELLEK.zaman = Date.now(); doldur(KISI_ONBELLEK.takip);
  }).catch(function () { });
  return kap;
}

Object.assign(DIL.tr, {
  gnKamera: 'Kamera', gnKameraAlt: 'Kombinini şimdi çek', gnGaleri: 'Galeri', gnGaleriAlt: 'Telefonundaki bir fotoğrafı seç',
  gnBaslik: 'Düzenle', gnFiltre: 'Filtre', gnAyarla: 'Ayarla', gnKirp: 'Kırp', gnDondur: 'Döndür', gnDevam: 'İleri', gnSifirla: 'Sıfırla',
  gnParlaklik: 'Parlaklık', gnKontrast: 'Kontrast', gnDoygunluk: 'Doygunluk', gnSicaklik: 'Sıcaklık', gnVinyet: 'Vinyet',
  gnF_orijinal: 'Orijinal', gnF_canli: 'Canlı', gnF_sicak: 'Sıcak', gnF_soguk: 'Soğuk', gnF_pastel: 'Pastel', gnF_vintage: 'Vintage', gnF_dramatik: 'Dramatik', gnF_parlak: 'Parlak', gnF_sb: 'S/B',
  kamModGonderi: 'Gönderi', kamIpucuGonderi: 'Kombinini çek; sonra filtre ekleyip kırpabilirsin.', duzenle: 'Düzenle', kameraKullan: 'Kamera',
  bnAyarBaslik: 'Telefon bildirimleri', bnAyarAcik: 'Açık. Yeni takipçi, mesaj ve takip ettiklerinin paylaşımları bildirilir.', bnAyarKapali: 'Kapalı. Açmazsan telefonuna bildirim gelmez.',
  bnAyarAc: 'Aç', bnAyarDuzenle: 'Ayarlar', bnAyarTelefon: 'Telefonun Ayarlar → Bildirimler bölümünden açabilirsin.', bnPanelAlt: 'Görmek için dokun',
  bnPaylasim: 'yeni bir kombin paylaştı', bnYeniPaylasim: function (a) { return a + ' yeni bir kombin paylaştı'; },
  ktBaslik: 'Takip ettiklerin', ktYeni: 'yeni paylaşım'
});
Object.assign(DIL.en, {
  gnKamera: 'Camera', gnKameraAlt: 'Take a photo of your outfit now', gnGaleri: 'Gallery', gnGaleriAlt: 'Pick a photo from your phone',
  gnBaslik: 'Edit', gnFiltre: 'Filter', gnAyarla: 'Adjust', gnKirp: 'Crop', gnDondur: 'Rotate', gnDevam: 'Next', gnSifirla: 'Reset',
  gnParlaklik: 'Brightness', gnKontrast: 'Contrast', gnDoygunluk: 'Saturation', gnSicaklik: 'Warmth', gnVinyet: 'Vignette',
  gnF_orijinal: 'Original', gnF_canli: 'Vivid', gnF_sicak: 'Warm', gnF_soguk: 'Cool', gnF_pastel: 'Pastel', gnF_vintage: 'Vintage', gnF_dramatik: 'Dramatic', gnF_parlak: 'Bright', gnF_sb: 'B&W',
  kamModGonderi: 'Post', kamIpucuGonderi: 'Take your outfit photo; then add a filter and crop it.', duzenle: 'Edit', kameraKullan: 'Camera',
  bnAyarBaslik: 'Phone notifications', bnAyarAcik: 'On. New followers, messages and posts from people you follow.', bnAyarKapali: "Off. You won't get notifications on your phone.",
  bnAyarAc: 'Turn on', bnAyarDuzenle: 'Settings', bnAyarTelefon: 'Turn them on in your phone Settings → Notifications.', bnPanelAlt: 'Tap to see',
  bnPaylasim: 'shared a new outfit', bnYeniPaylasim: function (a) { return a + ' shared a new outfit'; },
  ktBaslik: 'People you follow', ktYeni: 'new post'
});
Object.assign(DIL.ru, {
  gnKamera: 'Камера', gnKameraAlt: 'Сфотографируй образ сейчас', gnGaleri: 'Галерея', gnGaleriAlt: 'Выбери фото из телефона',
  gnBaslik: 'Редактировать', gnFiltre: 'Фильтр', gnAyarla: 'Настроить', gnKirp: 'Обрезать', gnDondur: 'Повернуть', gnDevam: 'Далее', gnSifirla: 'Сбросить',
  gnParlaklik: 'Яркость', gnKontrast: 'Контраст', gnDoygunluk: 'Насыщенность', gnSicaklik: 'Теплота', gnVinyet: 'Виньетка',
  gnF_orijinal: 'Оригинал', gnF_canli: 'Яркий', gnF_sicak: 'Тёплый', gnF_soguk: 'Холодный', gnF_pastel: 'Пастель', gnF_vintage: 'Винтаж', gnF_dramatik: 'Драма', gnF_parlak: 'Светлый', gnF_sb: 'Ч/Б',
  kamModGonderi: 'Пост', kamIpucuGonderi: 'Сфотографируй образ, затем добавь фильтр и обрежь.', duzenle: 'Редактировать', kameraKullan: 'Камера',
  bnAyarBaslik: 'Уведомления на телефоне', bnAyarAcik: 'Включены. Новые подписчики, сообщения и публикации тех, на кого ты подписана.', bnAyarKapali: 'Выключены. Уведомления не будут приходить.',
  bnAyarAc: 'Включить', bnAyarDuzenle: 'Настройки', bnAyarTelefon: 'Включи их в Настройках телефона → Уведомления.', bnPanelAlt: 'Нажми, чтобы посмотреть',
  bnPaylasim: 'опубликовала новый образ', bnYeniPaylasim: function (a) { return a + ' опубликовала новый образ'; },
  ktBaslik: 'Твои подписки', ktYeni: 'новая публикация'
});
Object.assign(DIL.uz, {
  gnKamera: 'Kamera', gnKameraAlt: 'Obrazingni hozir suratga ol', gnGaleri: 'Galereya', gnGaleriAlt: 'Telefondagi rasmni tanla',
  gnBaslik: 'Tahrirlash', gnFiltre: 'Filtr', gnAyarla: 'Sozlash', gnKirp: 'Kesish', gnDondur: 'Burish', gnDevam: 'Keyingi', gnSifirla: 'Tiklash',
  gnParlaklik: 'Yorqinlik', gnKontrast: 'Kontrast', gnDoygunluk: "To'yinganlik", gnSicaklik: 'Iliqlik', gnVinyet: 'Vinyetka',
  gnF_orijinal: 'Asl', gnF_canli: 'Yorqin', gnF_sicak: 'Iliq', gnF_soguk: 'Sovuq', gnF_pastel: 'Pastel', gnF_vintage: 'Vintaj', gnF_dramatik: 'Dramatik', gnF_parlak: 'Yorug', gnF_sb: 'Oq-qora',
  kamModGonderi: 'Post', kamIpucuGonderi: "Obrazingni suratga ol; keyin filtr qo'shib kesishing mumkin.", duzenle: 'Tahrirlash', kameraKullan: 'Kamera',
  bnAyarBaslik: 'Telefon bildirishnomalari', bnAyarAcik: "Yoqilgan. Yangi obunachilar, xabarlar va kuzatganlaringning ulashishlari.", bnAyarKapali: "O'chiq. Telefoningga bildirishnoma kelmaydi.",
  bnAyarAc: 'Yoqish', bnAyarDuzenle: 'Sozlamalar', bnAyarTelefon: 'Telefon Sozlamalari → Bildirishnomalar orqali yoqing.', bnPanelAlt: "Ko'rish uchun bosing",
  bnPaylasim: 'yangi obraz ulashdi', bnYeniPaylasim: function (a) { return a + ' yangi obraz ulashdi'; },
  ktBaslik: 'Kuzatayotganlaring', ktYeni: 'yangi ulashish'
});
