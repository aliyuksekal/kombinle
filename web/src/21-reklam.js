/* ---------- Keşfet reklamları (Instagram tarzı sponsorlu kartlar) ----------
   Akışta rastgele aralıklarla (3–7 paylaşımda bir), rastgele boyutta (kare, dikey, hikâye, yatay) çıkar.
   Her reklam "Geç" ile kapatılabilir; hikâye boyutunda 5 sn sayaç sonra geçilebilir.
   Kaynak: @admin'in eklediği reklam verenler + uygulamanın kendi tanıtımları. PRO üyelerde reklam yok. */
var REKLAM = { liste: [], yuklendi: false, yukleniyor: false, plan: {}, gecilen: {}, sayilan: {}, ilk: 0 };
var REKLAM_BOYUTLAR = ['kare', 'dikey', 'hikaye', 'yatay'];
function rastgeleArada(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
function evReklamlari() {
  var l = [
    { id: 'ev-prenses', ev: 1, marka: 'Kombinle AI', ikon: 'prenses', renk: 'r1', baslik: t('rkPrensesB'), metin: t('rkPrensesM'), dugme: t('rkPrensesD'), eylem: function () { sohbetAc(); } },
    { id: 'ev-analiz', ev: 1, marka: 'Kombinle', ikon: 'grafik', renk: 'r2', baslik: t('rkAnalizB'), metin: t('rkAnalizM'), dugme: t('rkAnalizD'), eylem: function () { analizSayfasi(); } },
    { id: 'ev-jeton', ev: 1, marka: 'Kombinle', ikon: 'zap', renk: 'r3', baslik: t('rkJetonB'), metin: t('rkJetonM'), dugme: t('rkJetonD'), eylem: function () { magazaSayfasi(); } }
  ];
  if (!S.pro) l.unshift({ id: 'ev-pro', ev: 1, marka: 'Kombinle PRO', ikon: 'tac', renk: 'r4', baslik: t('rkProB'), metin: t('rkProM', PRO_FIYAT), dugme: t('rkProD'), eylem: function () { magazaSayfasi(); } });
  return l;
}
function reklamGecerli(r) {
  return r && typeof r.id === 'string' && /^[a-z0-9]{20}$/.test(r.id) && typeof r.marka === 'string' && r.marka.length >= 2 &&
    REKLAM_BOYUTLAR.indexOf(r.boyut) >= 0 && (r.link === '' || /^https:\/\/[a-z0-9.-]+\.[a-z]{2,}(\/[^\s"'<>]*)?$/i.test(r.link || ''));
}
function reklamYukle() {
  if (REKLAM.yuklendi || REKLAM.yukleniyor || !yzKurulu()) return;
  REKLAM.yukleniyor = true;
  yzIste('/v1/reklamlar', {}, 15000).then(function (v) {
    REKLAM.liste = Array.isArray(v.liste) ? v.liste.filter(reklamGecerli).slice(0, 12) : [];
    REKLAM.yuklendi = true;
    if (REKLAM.liste.length) { REKLAM.plan = {}; toplulukCizYenile(); }
  }).catch(function () { REKLAM.yuklendi = true; }).then(function () { REKLAM.yukleniyor = false; });
}
function reklamAcik() { return !S.pro && TOPLULUK.sira !== 'benim'; }
/* paylaşım sırası -> reklam planı (ekran yeniden çizilince aynı yerde aynı reklam kalır) */
function reklamPlani(n) {
  if (!REKLAM.ilk) REKLAM.ilk = rastgeleArada(2, 4);
  var yer = REKLAM.ilk, plan = {};
  var havuz = REKLAM.liste.filter(function (r) { return !REKLAM.gecilen[r.id]; });
  var ev = evReklamlari().filter(function (r) { return !REKLAM.gecilen[r.id]; });
  var sira = 0;
  while (yer <= n) {
    if (REKLAM.plan[yer] && !REKLAM.gecilen[REKLAM.plan[yer].r.id]) plan[yer] = REKLAM.plan[yer];
    else {
      // reklam verenler öncelikli (3'te 2), aralarda uygulamanın kendi tanıtımları
      var r = havuz.length && (Math.random() < 0.67 || !ev.length) ? havuz[(sira + rastgeleArada(0, havuz.length - 1)) % havuz.length] : ev.length ? ev[rastgeleArada(0, ev.length - 1)] : null;
      if (r) plan[yer] = { r: r, boyut: r.ev ? REKLAM_BOYUTLAR[rastgeleArada(0, 3)] : r.boyut, ara: rastgeleArada(3, 7) };
    }
    sira++;
    yer += plan[yer] ? plan[yer].ara : rastgeleArada(3, 7);
  }
  REKLAM.plan = plan;
  return plan;
}
function reklamSay(r, tur) {
  if (r.ev || !yzKurulu()) return;
  var k = r.id + ':' + tur;
  if (REKLAM.sayilan[k]) return;
  REKLAM.sayilan[k] = 1;
  yzIste('/v1/reklamsay', { id: r.id, tur: tur }, 10000).catch(function () { });
}
function reklamAc(r) {
  if (r.ev) { if (typeof r.eylem === 'function') r.eylem(); return; }
  reklamSay(r, 'tik');
  if (!r.link) return;
  try { if (YEREL && typeof YEREL.ac === 'function') { YEREL.ac(r.link); return; } } catch (e) { }
  try { window.open(r.link, '_blank', 'noopener,noreferrer'); } catch (e2) { }
}
function reklamKarti(p) {
  var r = p.r, boyut = p.boyut, adres = sunucuAdres();
  var gec = h('button', { class: 'g-reklam-gec', 'aria-label': t('rkGec') }, h('span', { text: t('rkGec') }), ikon('kapat', 'k'));
  var medya;
  if (r.ev) {
    medya = h('button', { class: 'g-reklam-medya ev ' + r.renk, 'aria-label': r.baslik },
      h('span', { class: 'rk-isik' }), h('span', { class: 'rk-ikon' }, ikon(r.ikon)),
      h('b', { class: 'rk-baslik', text: r.baslik }), h('span', { class: 'rk-alt', text: r.metin }));
  } else {
    medya = h('button', { class: 'g-reklam-medya', 'aria-label': r.baslik || r.marka },
      h('img', { src: adres ? adres + '/v1/reklam/' + r.id : '', alt: kirp(r.baslik || r.marka, 80), loading: 'lazy', decoding: 'async', referrerpolicy: 'no-referrer' }));
  }
  var ilerleme = boyut === 'hikaye' ? h('span', { class: 'rk-ilerleme' }, h('i')) : null;
  if (ilerleme) medya.appendChild(ilerleme);
  var cta = h('button', { class: 'g-reklam-cta' }, h('span', { text: kirp(r.dugme || t('rkDahaFazla'), 20) }), ikon('sag', 'k'));
  var kart = h('article', { class: 'g-akis g-reklam boyut-' + boyut, 'data-reklam': r.id },
    h('div', { class: 'g-akis-bas' },
      h('span', { class: 'g-avatar rk-av ' + (r.renk || '') }, r.ev ? ikon(r.ikon, 'k') : document.createTextNode((r.marka.charAt(0) || '?').toLocaleUpperCase('tr'))),
      h('div', null, h('b', { text: kirp(r.marka, 30) }), h('small', { class: 'rk-sponsor', text: t('rkSponsorlu') })), gec),
    medya, cta,
    (!r.ev && (r.baslik || r.metin)) ? h('p', { class: 'g-akis-metin' }, r.baslik ? h('b', { text: kirp(r.baslik, 60) + ' ' }) : null, document.createTextNode(kirp(r.metin || '', 200))) : null);
  medya.addEventListener('click', function () { reklamAc(r); });
  cta.addEventListener('click', function () { reklamAc(r); });
  // hikâye boyutu: 5 sn izlendikten sonra geçilebilir
  var kalan = boyut === 'hikaye' ? 5 : 0, sayac = null;
  if (kalan) { gec.disabled = true; gec.firstChild.textContent = t('rkGecSay', kalan); }
  gec.addEventListener('click', function (e) {
    e.stopPropagation();
    if (gec.disabled) return;
    REKLAM.gecilen[r.id] = 1;
    kart.style.height = kart.offsetHeight + 'px';
    requestAnimationFrame(function () { kart.classList.add('geciliyor'); kart.style.height = '0px'; });
    setTimeout(function () { kart.remove(); }, 380);
  });
  // görünürlük: yarısı 1 sn görünürse gösterim sayılır; hikâye sayacı görünürken akar
  var gorunur = false, gorTimer = null;
  function adim() {
    if (!gorunur || kalan <= 0) return;
    kalan--;
    if (kalan <= 0) { gec.disabled = false; gec.firstChild.textContent = t('rkGec'); return; }
    gec.firstChild.textContent = t('rkGecSay', kalan);
    sayac = setTimeout(adim, 1000);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (g) {
      gorunur = g[0].isIntersecting && g[0].intersectionRatio >= 0.5;
      clearTimeout(gorTimer); clearTimeout(sayac);
      if (gorunur) {
        gorTimer = setTimeout(function () { reklamSay(r, 'g'); }, 1000);
        if (ilerleme) ilerleme.classList.add('akiyor');
        if (kalan > 0) sayac = setTimeout(adim, 1000);
      } else if (ilerleme) ilerleme.classList.remove('akiyor');
      if (!document.body.contains(kart)) io.disconnect();
    }, { threshold: [0, 0.5, 1] });
    setTimeout(function () { io.observe(kart); }, 0);
  } else { kalan = 0; gec.disabled = false; gec.firstChild.textContent = t('rkGec'); }
  return kart;
}

/* @admin: reklam ekle, istatistik, durdur/sil */
function reklamYonetimi() {
  var hb = hesapBilgi(); if (!hb || !hb.yonetici) return;
  var liste = h('div', { class: 'rk-yonetim-liste' }, h('div', { class: 'g-yukleniyor' }, h('span', { class: 'yukleniyor' })));
  var s = sayfaAc({ baslik: t('rkYonetim'), icerik: h('div', { class: 'profil-duzen' },
    h('p', { class: 'alt-yazi', text: t('rkYonetimMetin') }),
    h('button', { class: 'btn ana', style: { width: '100%' }, on: { click: function () { reklamEkleSayfasi(yukle); } } }, ikon('arti', 'k'), t('rkYeni')),
    liste) });
  function yukle() {
    yzIste('/v1/reklamlar', { yonetim: true }, 15000).then(function (v) {
      temizle(liste);
      var l = Array.isArray(v.liste) ? v.liste : [];
      if (!l.length) { liste.appendChild(h('p', { class: 'alt-yazi', style: { 'text-align': 'center' }, text: t('rkYok') })); return; }
      var adres = sunucuAdres();
      l.forEach(function (r) {
        if (!r || typeof r.id !== 'string' || !/^[a-z0-9]{20}$/.test(r.id)) return;
        var oran = r.gosterim ? Math.round(1000 * (r.tik | 0) / r.gosterim) / 10 : 0;
        liste.appendChild(h('div', { class: 'rk-satir' + (r.aktif ? '' : ' pasif') },
          h('img', { src: adres + '/v1/reklam/' + r.id, alt: '', loading: 'lazy', referrerpolicy: 'no-referrer' }),
          h('div', null, h('b', { text: kirp(r.marka, 30) }), h('small', { text: kirp(r.baslik || '', 60) }),
            h('small', { class: 'rk-ist', text: t('rkIstatistik', r.gosterim | 0, r.tik | 0, oran) + ' • ' + (r.aktif ? t('rkBitis', new Date(r.bitis).toLocaleDateString(A.dil === 'tr' ? 'tr-TR' : undefined)) : t('rkDurdu')) })),
          h('div', { class: 'rk-dugmeler' },
            h('button', { class: 'ikon-btn', 'aria-label': r.aktif ? t('rkDurdur') : t('rkSurdur'), on: { click: function () {
              yzIste('/v1/reklamsil', { id: r.id, durdur: !!r.aktif }, 15000).then(yukle, function (e) { tost(hesapHataMetni(e)); });
            } } }, ikon(r.aktif ? 'kilit' : 'yenile', 'k')),
            h('button', { class: 'ikon-btn', 'aria-label': t('sil'), on: { click: function () {
              onayIste(t('rkSilSor', kirp(r.marka, 30)), function () { yzIste('/v1/reklamsil', { id: r.id }, 15000).then(yukle, function (e) { tost(hesapHataMetni(e)); }); });
            } } }, ikon('cop', 'k')))));
      });
    }).catch(function (e) { temizle(liste); liste.appendChild(h('p', { class: 'alt-yazi', text: hesapHataMetni(e) })); });
  }
  yukle();
}
function reklamEkleSayfasi(sonra) {
  var tuval = null, boyut = 'kare';
  var onizleme = h('button', { class: 'rk-resim-sec' }, ikon('galeri'), h('span', { text: t('rkResimSec') }));
  var alan = function (etk, enFazla, yer) { var i = h('input', { class: 'metin', type: 'text', maxlength: String(enFazla), placeholder: yer || '', 'aria-label': etk }); return { el: i, sar: h('label', { class: 'hesap-alan' }, h('span', { text: etk }), i) }; };
  var marka = alan(t('rkMarka'), 30), baslik = alan(t('rkBaslikEtk'), 60), metin = alan(t('rkMetin'), 200), link = alan(t('rkLink'), 300, 'https://'), dugme = alan(t('rkDugme'), 20, t('rkDahaFazla'));
  link.el.setAttribute('inputmode', 'url');
  var gun = h('input', { class: 'metin', type: 'number', min: '1', max: '365', value: '30', 'aria-label': t('rkGun') });
  var boyutlar = h('div', { class: 'cipler' });
  REKLAM_BOYUTLAR.forEach(function (b) {
    boyutlar.appendChild(h('button', { class: 'cip', 'data-b': b, 'aria-pressed': b === boyut ? 'true' : 'false', text: t('rkBoyut_' + b), on: { click: function () {
      boyut = b; $$('button', boyutlar).forEach(function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-b') === b ? 'true' : 'false'); });
      onizleme.setAttribute('data-boyut', b);
    } } }));
  });
  onizleme.setAttribute('data-boyut', boyut);
  onizleme.addEventListener('click', function () {
    var inp = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', style: { display: 'none' } });
    document.body.appendChild(inp);
    inp.addEventListener('change', function () {
      var f = inp.files && inp.files[0]; inp.remove();
      if (!f) return;
      if (f.size > EN_BUYUK_DOSYA) { tost(t('dosyaBuyuk')); return; }
      resimCoz(f).then(function (bmp) {
        tuval = tuvaleCiz(bmp, 1080); try { if (bmp.close) bmp.close(); } catch (e) { }
        temizle(onizleme); onizleme.appendChild(h('img', { src: tuval.toDataURL('image/jpeg', 0.8), alt: '' }));
      }).catch(function () { tost(t('dosyaBozuk')); });
    });
    inp.click();
  });
  var btn = h('button', { class: 'btn ana' }, ikon('tik', 'k'), t('rkYayinla'));
  var s = sayfaAc({ baslik: t('rkYeni'), icerik: h('div', { class: 'profil-duzen' }, onizleme,
    h('div', { class: 'hesap-alan' }, h('span', { text: t('rkBoyutEtk') }), boyutlar),
    marka.sar, baslik.sar, metin.sar, link.sar, dugme.sar,
    h('label', { class: 'hesap-alan' }, h('span', { text: t('rkGun') }), gun)), altBar: btn });
  btn.addEventListener('click', function () {
    if (!tuval) { tost(t('rkResimGerek')); return; }
    var m = kirp(marka.el.value, 30), l = (link.el.value || '').trim();
    if (m.length < 2) { tost(t('rkMarkaGerek')); marka.el.focus(); return; }
    if (l && !/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}(\/[^\s"'<>]*)?$/i.test(l)) { tost(t('rkLinkHata')); link.el.focus(); return; }
    var b64 = tuvaldenB64(tuval, 440 * 1024);
    if (!b64) { tost(t('dosyaBuyuk')); return; }
    btn.disabled = true;
    yzIste('/v1/reklamekle', { resim: b64, marka: m, baslik: kirp(baslik.el.value, 60), metin: kirp(metin.el.value, 200), link: l, dugme: kirp(dugme.el.value, 20), boyut: boyut, gun: Math.max(1, Math.min(365, +gun.value || 30)) }, 40000).then(function () {
      s.kapat(); tost(t('rkEklendi')); REKLAM.yuklendi = false; if (sonra) sonra();
    }).catch(function (e) { tost(e && e.message === 'link' ? t('rkLinkHata') : hesapHataMetni(e)); }).then(function () { btn.disabled = false; });
  });
}
