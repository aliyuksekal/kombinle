/* ---------- Profil resmi ----------
   Seçilen fotoğraf kare kırpılır (sürükle + yakınlaştır), 256 px'e yeniden çizilir (EXIF/konum bilgisi gitmez).
   Telefonda saklanır; hesapla giriş yapılmışsa denetlenip sunucuya da yüklenir ve toplulukta görünür.
   Profil resmi varsa sol üstteki uygulama simgesinin yerini alır. */
var AVATAR_DESEN = /^data:image\/(jpeg|webp);base64,[A-Za-z0-9+\/=]{100,110000}$/;
function avatarYerel() { var d = LS.al('avatar', ''); return typeof d === 'string' && AVATAR_DESEN.test(d) ? d : ''; }
function avatarAdres(kod, av) {
  var a = sunucuAdres();
  return a && /^[a-f0-9]{12}$/.test(kod || '') && sayiMi(av) && av > 0 ? a + '/v1/avatar/' + kod + '?v=' + Math.floor(av) : '';
}
/* kendi resmim: önce telefondaki, yoksa hesaptaki */
function benimAvatar() {
  var y = avatarYerel(); if (y) return y;
  var hb = hesapBilgi();
  return hb ? avatarAdres(hb.kod, hb.av) : '';
}
/* yuvarlak profil görseli; resim yoksa ya da yüklenemezse baş harf */
function avatarIc(src, ad, dil) {
  var harf = (String(ad || '').charAt(0) || '?').toLocaleUpperCase(dil || 'tr');
  if (!src) return document.createTextNode(harf);
  var img = h('img', { class: 'av-img', src: src, alt: '', loading: 'lazy', decoding: 'async', referrerpolicy: 'no-referrer', draggable: 'false' });
  img.addEventListener('error', function () { var p = img.parentNode; if (p) { p.classList.remove('resimli'); p.replaceChild(document.createTextNode(harf), img); } });
  return img;
}
function avatarDoldur(el, src, ad, dil) {
  temizle(el); el.appendChild(avatarIc(src, ad, dil));
  el.classList.toggle('resimli', !!src);
  return el;
}
function kisiAvatar(kod, av, ad) {
  var hb = hesapBilgi();
  if (hb && hb.kod && hb.kod === kod) return benimAvatar();
  return avatarAdres(kod, av);
}

/* Sol üst / hesap kartı / profil düzenleme: "Profil resmi" menüsü */
function avatarMenusu(sonra) {
  var var_ = !!benimAvatar();
  var s = sayfaAc({ baslik: t('avBaslik'), icerik: h('div', { class: 'av-menu' },
    avatarDoldur(h('span', { class: 'hesap-av dev' }), benimAvatar(), (hesapBilgi() || {}).ad || 'K'),
    h('p', { class: 'alt-yazi', style: { 'text-align': 'center' }, text: girisli() ? t('avNotGirisli') : t('avNotYerel') }),
    h('button', { class: 'satir', on: { click: function () { s.kapat(); avatarSec(sonra); } } }, ikon('galeri'), h('span', { text: var_ ? t('avDegistir') : t('avSec') })),
    var_ ? h('button', { class: 'satir tehlike', on: { click: function () { s.kapat(); avatarKaldir(sonra); } } }, ikon('cop'), h('span', { text: t('avKaldir') })) : null) });
}
function avatarSec(sonra) {
  var inp = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', style: { display: 'none' } });
  document.body.appendChild(inp);
  inp.addEventListener('change', function () {
    var f = inp.files && inp.files[0]; inp.remove();
    if (!f) return;
    if (f.size > EN_BUYUK_DOSYA) { tost(t('dosyaBuyuk')); return; }
    resimCoz(f).then(function (bmp) {
      var c = tuvaleCiz(bmp, 1400);
      try { if (bmp.close) bmp.close(); } catch (e) { }
      avatarKirp(c, sonra);
    }).catch(function () { tost(t('dosyaBozuk')); });
  });
  inp.click();
}
/* Kare kırpma: parmakla sürükle, kaydırıcıyla yakınlaştır */
function avatarKirp(kaynak, sonra) {
  var B = 280;
  var tv = h('canvas', { class: 'av-kirp', width: String(B * 2), height: String(B * 2), 'aria-label': t('avKirp') });
  var x = tv.getContext('2d');
  var taban = Math.max(B * 2 / kaynak.width, B * 2 / kaynak.height);
  var olc = 1, ox = 0, oy = 0;
  function sinirla() {
    var w = kaynak.width * taban * olc, hh = kaynak.height * taban * olc;
    ox = Math.min(0, Math.max(B * 2 - w, ox)); oy = Math.min(0, Math.max(B * 2 - hh, oy));
  }
  function ortala() { ox = (B * 2 - kaynak.width * taban * olc) / 2; oy = (B * 2 - kaynak.height * taban * olc) / 2; }
  function ciz_() { sinirla(); x.fillStyle = '#fff'; x.fillRect(0, 0, B * 2, B * 2); x.drawImage(kaynak, ox, oy, kaynak.width * taban * olc, kaynak.height * taban * olc); }
  ortala(); ciz_();
  var son = null;
  tv.addEventListener('pointerdown', function (e) { son = [e.clientX, e.clientY]; try { tv.setPointerCapture(e.pointerId); } catch (x2) { } });
  tv.addEventListener('pointermove', function (e) {
    if (!son) return;
    var k = (B * 2) / tv.getBoundingClientRect().width;
    ox += (e.clientX - son[0]) * k; oy += (e.clientY - son[1]) * k; son = [e.clientX, e.clientY]; ciz_();
  });
  ['pointerup', 'pointercancel'].forEach(function (o) { tv.addEventListener(o, function () { son = null; }); });
  var kay = h('input', { type: 'range', min: '100', max: '300', value: '100', class: 'av-yakin', 'aria-label': t('avYakinlas') });
  kay.addEventListener('input', function () {
    var eski = olc, yeni = (+kay.value || 100) / 100, m = B;   // ortadan yakınlaş
    ox = m - (m - ox) * yeni / eski; oy = m - (m - oy) * yeni / eski; olc = yeni; ciz_();
  });
  var btn = h('button', { class: 'btn ana' }, ikon('tik', 'k'), t('avKullan'));
  var s = sayfaAc({ baslik: t('avKirp'), icerik: h('div', { class: 'av-kirp-kap' },
    h('div', { class: 'av-kirp-cerceve' }, tv), h('label', { class: 'av-yakin-sar' }, ikon('ara', 'k'), kay), h('p', { class: 'ayar-not', style: { 'text-align': 'center' }, text: t('avKirpNot') })), altBar: btn });
  btn.addEventListener('click', function () {
    var c = h('canvas', { width: '256', height: '256' });
    c.getContext('2d').drawImage(tv, 0, 0, 256, 256);
    var d = '';
    try { d = c.toDataURL('image/jpeg', 0.86); } catch (e) { d = ''; }
    if (!AVATAR_DESEN.test(d)) { tost(t('dosyaBozuk')); return; }
    btn.disabled = true;
    avatarKaydet(d).then(function (tamam) { if (tamam) { s.kapat(); if (sonra) sonra(); } }).then(function () { btn.disabled = false; });
  });
}
function avatarKaydet(d) {
  var yerel = function () { LS.yaz('avatar', d); avatarlariYenile(); tost(t('avKaydedildi')); return true; };
  if (!girisli() || !yzKurulu()) return Promise.resolve(yerel());
  return yzIste('/v1/avatar', { resim: d.slice(d.indexOf(',') + 1) }, 30000).then(function (v) {
    var hb = LS.al('hesap', null);
    if (hb && typeof hb === 'object' && sayiMi(v.av)) { hb.av = v.av; LS.yaz('hesap', hb); }
    TOPLULUK.yuklendi = false;
    return yerel();
  }).catch(function (e) {
    tost(e && e.message === 'denetim' ? t('avDenetim') : hesapHataMetni(e));
    return false;
  });
}
function avatarKaldir(sonra) {
  var bitir = function () { LS.sil('avatar'); avatarlariYenile(); tost(t('avKaldirildi')); if (sonra) sonra(); };
  if (!girisli() || !yzKurulu()) { bitir(); return; }
  yzIste('/v1/avatar', { sil: true }, 20000).then(function () {
    var hb = LS.al('hesap', null);
    if (hb && typeof hb === 'object') { hb.av = 0; LS.yaz('hesap', hb); }
    TOPLULUK.yuklendi = false; bitir();
  }).catch(function (e) { tost(hesapHataMetni(e)); });
}
/* üst çubuk ve açık kartlar yeni resimle güncellenir */
function avatarlariYenile() {
  var src = benimAvatar(), hb = hesapBilgi(), ad = hb ? hb.ad : '';
  $$('.g-marka .g-logo-kap').forEach(function (k) { logoDoldur(k); });
  $$('.g-hesap, .hesap-av.benim').forEach(function (el) { if (hb || src) avatarDoldur(el, src, ad || 'K'); });
  if (typeof ciz === 'function') ciz();
}
/* sol üst: profil resmi varsa o, yoksa uygulama simgesi */
function logoDoldur(kap) {
  temizle(kap);
  var src = benimAvatar();
  kap.classList.toggle('kullanici', !!src);
  if (src) {
    var img = h('img', { class: 'g-logo kullanici', src: src, alt: t('avBaslik'), referrerpolicy: 'no-referrer', draggable: 'false' });
    img.addEventListener('error', function () { kap.classList.remove('kullanici'); img.src = LOGO_ROZET; img.className = 'g-logo'; });
    kap.appendChild(img);
  } else {
    kap.appendChild(h('img', { class: 'g-logo', src: LOGO_ROZET, alt: '' }));
    kap.appendChild(h('span', { class: 'g-logo-arti', 'aria-hidden': 'true' }, ikon('arti', 'k')));
  }
  return kap;
}
