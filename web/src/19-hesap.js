/* ---------- Hesap: kayıt, giriş, şifre sıfırlama, çıkış, hesap silme ----------
   Şifre yalnızca HTTPS ile Kombinle sunucusuna gider; sunucuda tuzlu ve gizli anahtarla özetlenir.
   Oturum belirteci telefonda (uygulamanın kendi deposunda) tutulur, sayfa yalnızca ad ve e-postayı bilir. */

function hesapBilgi() {
  var h = LS.al('hesap', null);
  if (!h || typeof h !== 'object' || typeof h.ad !== 'string' || typeof h.eposta !== 'string') return null;
  try { if (YEREL && typeof YEREL.oturumVar === 'function' && !YEREL.oturumVar()) { LS.sil('hesap'); return null; } } catch (e) { }
  return { ad: kirp(h.ad, 24), eposta: kirp(h.eposta, 254), kod: typeof h.kod === 'string' && /^[a-f0-9]{12}$/.test(h.kod) ? h.kod : '',
    kadi: typeof h.kadi === 'string' && kadiGecerli(h.kadi) ? h.kadi : '', bio: typeof h.bio === 'string' ? kirp(h.bio, 150) : '', yonetici: h.yonetici === true && h.kadi === 'admin', av: sayiMi(h.av) ? h.av : 0 };
}
/* Kullanıcı adı kuralları sunucuyla aynı: 3–20 karakter, harfle başlar, küçük harf/rakam/nokta/alt çizgi */
var KADI_TR = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'â': 'a', 'î': 'i', 'û': 'u' };
function kadiNormal(v) {
  return String(v || '').trim().replace(/^@+/, '').toLocaleLowerCase('tr').replace(/[çğıöşüâîû]/g, function (c) { return KADI_TR[c]; }).replace(/\s+/g, '').slice(0, 20);
}
function kadiGecerli(k) { return /^[a-z][a-z0-9._]{2,19}$/.test(k) && !/[._]{2}/.test(k) && !/[.]$/.test(k); }
/* Ayrılmış adlar: @admin uygulama sahibinin, diğerleri (@user…) onun atadığı kişilerin; yanlarında onay rozeti görünür */
var RESMI_AD = { admin: 1, user: 1, kombinle: 1, destek: 1, moderator: 1 };
function kadiEl(kadi, sinif) {
  if (!kadi || !kadiGecerli(kadi)) return null;
  return h('span', { class: 'kadi' + (sinif ? ' ' + sinif : '') }, '@' + kadi, RESMI_AD[kadi] ? h('span', { class: 'resmi-rozet', title: t('resmiHesap'), 'aria-label': t('resmiHesap') }, ikon('tik', 'k')) : null);
}
function girisli() { return !!hesapBilgi(); }
function hesapKaydet(v) {
  if (!v || typeof v.oturum !== 'string' || !/^[a-f0-9]{64}$/.test(v.oturum) || !v.hesap) return false;
  try { if (YEREL && typeof YEREL.oturumAyarla === 'function') YEREL.oturumAyarla(v.oturum); } catch (e) { return false; }
  hesapYaz(v.hesap);
  TOPLULUK.yuklendi = false;
  // giriş öncesi seçilmiş profil resmi hesapta yoksa hesaba da yüklenir (denetimden geçmezse telefonda kalır)
  var yerelAv = avatarYerel();
  if (yerelAv && !(v.hesap.av > 0)) setTimeout(function () {
    yzIste('/v1/avatar', { resim: yerelAv.slice(yerelAv.indexOf(',') + 1) }, 30000).then(function (r) {
      var hb = LS.al('hesap', null); if (hb && typeof hb === 'object' && sayiMi(r.av)) { hb.av = r.av; LS.yaz('hesap', hb); }
    }).catch(function () { });
  }, 600);
  else if (v.hesap.av > 0) LS.sil('avatar');   // hesaptaki resim geçerli olur
  return true;
}
function hesapYaz(x) {
  LS.yaz('hesap', { ad: kirp(x.ad, 24), eposta: kirp(x.eposta, 254), kod: typeof x.kod === 'string' ? x.kod : '',
    kadi: typeof x.kadi === 'string' ? x.kadi : '', bio: typeof x.bio === 'string' ? kirp(x.bio, 150) : '', yonetici: x.yonetici === true, av: sayiMi(x.av) ? x.av : 0 });
  LS.yaz('takma', kirp(x.ad, 24));
}
function hesapTemizle() {
  try { if (YEREL && typeof YEREL.oturumAyarla === 'function') YEREL.oturumAyarla(''); } catch (e) { }
  LS.sil('hesap'); LS.sil('avatar');
  TOPLULUK.yuklendi = false;
}
/* Topluluk eylemleri hesap ister */
function girisIste() {
  if (girisli()) return true;
  tost(t('girisGerek'));
  S.ayarAcik = S.ayarAcik || {}; S.ayarAcik.hesap = true;
  setTimeout(ayarlarSayfasi, 250);
  return false;
}
function hesapHataMetni(e) {
  var k = e && e.message;
  return ({ eposta: t('hEpostaHata'), sifre: t('hSifreKisa'), ad: t('hAdHata'), kayitli: t('hKayitli'), yanlis: t('hYanlis'), kilitli: t('hKilitli'),
    kota: t('hKota'), baglanti: t('baglantiYok'), oturum: t('hOturumBitti'), kadi: t('kadiGecersiz'), alinmis: t('kadiAlinmis'), ayrilmis: t('kadiAyrilmis'),
    yetki: t('yetkiYok'), resim: t('avResimHata'), sinir: t('sinirDoldu'), yok: t('kisiBulunamadi'), kendi: t('kendinAtayamazsin') })[k] || t('tpHata');
}

/* Ayarlardaki "Hesap" kartının içeriği */
function hesapBolumu(yenile) {
  var kap = h('div', { class: 'hesap-bolum' });
  var hb = hesapBilgi();
  if (!yzKurulu()) { kap.appendChild(h('p', { class: 'ayar-not', text: t('hSunucuYok') })); return kap; }
  if (hb) {
    kap.appendChild(h('div', { class: 'hesap-kart' },
      avatarDoldur(h('button', { class: 'hesap-av benim', 'aria-label': t('avBaslik'), on: { click: function () { avatarMenusu(yenile); } } }), benimAvatar(), hb.ad),
      h('div', null, h('b', { text: hb.ad }), hb.kadi ? kadiEl(hb.kadi) : h('span', { class: 'kadi bos', text: t('kadiSecilmedi') }), h('small', { text: hb.eposta }))));
    if (hb.bio) kap.appendChild(h('p', { class: 'hesap-bio', text: hb.bio }));
    kap.appendChild(h('button', { class: 'btn ana profil-duzenle-btn', style: { width: '100%' }, on: { click: function () { profilDuzenle(yenile); } } }, ikon('kalem', 'k'), t('profilDuzenle')));
    if (hb.yonetici) kap.appendChild(h('button', { class: 'btn ikincil yonetici-btn', style: { width: '100%' }, on: { click: yoneticiPaneli } }, ikon('kalkan', 'k'), t('yoneticiPanel')));
    kap.appendChild(h('div', { class: 'hesap-dugmeler' },
      h('button', { class: 'btn ikincil', on: { click: function () {
        yzIste('/v1/cikis', {}, 15000).catch(function () { }).then(function () { hesapTemizle(); tost(t('hCikti')); yenile(); });
      } } }, t('hCikis')),
      h('button', { class: 'btn tehlike-cizgi', on: { click: hesapSilSor } }, t('hSil'))));
    return kap;
  }
  var mod = S.hesapMod || 'giris';
  var seg = h('div', { class: 'seg' });
  [['giris', 'hGiris'], ['kayit', 'hKayit']].forEach(function (x) {
    seg.appendChild(h('button', { 'aria-pressed': mod === x[0] ? 'true' : 'false', text: t(x[1]), on: { click: function () { S.hesapMod = x[0]; yenile(); } } }));
  });
  if (mod !== 'sifre') kap.appendChild(seg);
  var alan = function (etk, tip, oto, enFazla) {
    var i = h('input', { class: 'metin', type: tip, autocomplete: oto, maxlength: String(enFazla || 128), 'aria-label': etk });
    return { el: i, sar: h('label', { class: 'hesap-alan' }, h('span', { text: etk }), i) };
  };
  var ad = alan(t('hAd'), 'text', 'name', 24), ep = alan(t('hEposta'), 'email', 'email', 254),
    sf = alan(t('hSifre'), 'password', mod === 'kayit' ? 'new-password' : 'current-password'), sf2 = alan(t('hSifre2'), 'password', 'new-password'),
    kod = alan(t('hKurtarmaKodu'), 'text', 'off', 20), yeni = alan(t('hYeniSifre'), 'password', 'new-password');
  ep.el.setAttribute('inputmode', 'email');
  var kadiAlan = mod === 'kayit' ? kadiGirdisi('') : null;
  var btn = h('button', { class: 'btn ana', style: { width: '100%', 'margin-top': '6px' } }, mod === 'kayit' ? t('hKayit') : mod === 'sifre' ? t('hSifreSifirla') : t('hGiris'));
  if (mod === 'kayit') { kap.appendChild(ad.sar); kap.appendChild(kadiAlan.sar); }
  kap.appendChild(ep.sar);
  if (mod === 'sifre') { kap.appendChild(h('p', { class: 'ayar-not', text: t('hSifreNot') })); kap.appendChild(kod.sar); kap.appendChild(yeni.sar); }
  else kap.appendChild(sf.sar);
  if (mod === 'kayit') kap.appendChild(sf2.sar);
  kap.appendChild(btn);
  if (mod === 'giris') kap.appendChild(h('button', { class: 'hesap-link', text: t('hUnuttum'), on: { click: function () { S.hesapMod = 'sifre'; yenile(); } } }));
  if (mod === 'sifre') kap.appendChild(h('button', { class: 'hesap-link', text: t('hGiriseDon'), on: { click: function () { S.hesapMod = 'giris'; yenile(); } } }));
  kap.appendChild(h('p', { class: 'ayar-not', style: { 'text-align': 'center' }, text: t('hNot') }));
  var gidiyor = false;
  btn.addEventListener('click', function () {
    if (gidiyor) return;
    var e = kirp(ep.el.value, 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) { tost(t('hEpostaHata')); ep.el.focus(); return; }
    var yol, govde;
    if (mod === 'kayit') {
      var a = kirp(ad.el.value, 24);
      if (a.length < 2) { tost(t('hAdHata')); ad.el.focus(); return; }
      var kd = kadiNormal(kadiAlan.el.value);
      if (!kadiGecerli(kd)) { tost(t('kadiGecersiz')); kadiAlan.el.focus(); return; }
      if (kadiAlan.durum() === 'alinmis' || kadiAlan.durum() === 'ayrilmis') { tost(t(kadiAlan.durum() === 'alinmis' ? 'kadiAlinmis' : 'kadiAyrilmis')); kadiAlan.el.focus(); return; }
      if (sf.el.value.length < 8) { tost(t('hSifreKisa')); sf.el.focus(); return; }
      if (sf.el.value !== sf2.el.value) { tost(t('hSifreEslesmedi')); sf2.el.focus(); return; }
      yol = '/v1/kayit'; govde = { ad: a, eposta: e, sifre: sf.el.value, kadi: kd };
    } else if (mod === 'sifre') {
      if (yeni.el.value.length < 8) { tost(t('hSifreKisa')); yeni.el.focus(); return; }
      yol = '/v1/sifre'; govde = { eposta: e, kurtarma: kirp(kod.el.value, 20), yeniSifre: yeni.el.value };
    } else {
      if (!sf.el.value) { sf.el.focus(); return; }
      yol = '/v1/giris'; govde = { eposta: e, sifre: sf.el.value };
    }
    gidiyor = true; btn.disabled = true;
    yzIste(yol, govde, 25000).then(function (v) {
      if (!hesapKaydet(v)) throw new Error('hata');
      sf.el.value = sf2.el.value = yeni.el.value = '';
      S.hesapMod = 'giris';
      if (mod === 'kayit' && typeof v.kurtarma === 'string') kurtarmaGoster(v.kurtarma, v.hesap.ad);
      else tost(t('hHosgeldin', kirp(v.hesap.ad, 24)));
      yenile(); ciz();
    }).catch(function (x) { tost(hesapHataMetni(x)); }).then(function () { gidiyor = false; btn.disabled = false; });
  });
  return kap;
}
function kurtarmaGoster(kod, ad) {
  var k = kirp(kod, 20);
  var kodEl = h('div', { class: 'kurtarma-kod', text: k });
  var kopyala = h('button', { class: 'btn ikincil', on: { click: function () {
    try { navigator.clipboard.writeText(k).then(function () { tost(t('hKopyalandi')); }, function () { tost(k); }); } catch (e) { tost(k); }
  } } }, t('hKopyala'));
  var s = sayfaAc({ baslik: t('hHosgeldin', kirp(ad, 24)), kilitli: true, icerik: h('div', null,
    h('p', { text: t('hKurtarmaMetin') }), kodEl, h('div', { class: 'sarili', style: { 'justify-content': 'center' } }, kopyala),
    h('p', { class: 'ayar-not', text: t('hKurtarmaUyari') })),
    altBar: h('button', { class: 'btn ana', on: { click: function () { s.kapat(); } } }, t('hKaydettim')) });
}
function hesapSilSor() {
  var sifre = h('input', { class: 'metin', type: 'password', autocomplete: 'current-password', 'aria-label': t('hSifre'), placeholder: t('hSifre') });
  var btn = h('button', { class: 'btn tehlike' }, t('hSilOnay'));
  var s = sayfaAc({ baslik: t('hSil'), icerik: h('div', null, h('p', { text: t('hSilMetin') }), sifre), altBar: btn });
  btn.addEventListener('click', function () {
    if (!sifre.value) { sifre.focus(); return; }
    btn.disabled = true;
    yzIste('/v1/hesapsil', { sifre: sifre.value }, 25000).then(function () {
      hesapTemizle(); s.kapat(); tost(t('hSilindi')); ciz();
    }).catch(function (e) { tost(hesapHataMetni(e)); btn.disabled = false; });
  });
}

/* "@" önekli kullanıcı adı girişi: yazarken sunucudan uygunluk sorar (350 ms bekleyerek) */
function kadiGirdisi(ilk, benimki) {
  var durum = ilk && ilk === benimki ? 'senin' : '';
  var i = h('input', { class: 'metin kadi-girdi', type: 'text', value: ilk || '', maxlength: '21', autocomplete: 'username', autocapitalize: 'none', spellcheck: 'false', 'aria-label': t('kadi'), placeholder: t('kadiYer') });
  var bilgi = h('small', { class: 'kadi-durum', 'aria-live': 'polite', text: t('kadiKural') });
  var dinleyen = null, zaman = null, son = 0;
  function goster(d, k) {
    durum = d; bilgi.className = 'kadi-durum ' + (d === 'bos' || d === 'senin' ? 'iyi' : d === 'bakiyor' || !d ? '' : 'kotu');
    bilgi.textContent = d === 'bos' ? t('kadiUygun', k) : d === 'senin' ? t('kadiSenin') : d === 'alinmis' ? t('kadiAlinmis') : d === 'ayrilmis' ? t('kadiAyrilmis') :
      d === 'gecersiz' ? t('kadiKural') : d === 'bakiyor' ? t('kadiBakiliyor') : t('kadiKural');
    if (dinleyen) dinleyen(d, k);
  }
  i.addEventListener('input', function () {
    var k = kadiNormal(i.value);
    if (i.value !== k && i.value.replace(/^@/, '') !== k) { var pos = k.length; i.value = k; try { i.setSelectionRange(pos, pos); } catch (e) { } }
    clearTimeout(zaman);
    if (!k) { goster('', k); return; }
    if (!kadiGecerli(k)) { goster('gecersiz', k); return; }
    if (benimki && k === benimki) { goster('senin', k); return; }
    goster('bakiyor', k);
    var no = ++son;
    zaman = setTimeout(function () {
      yzIste('/v1/kadi', { kadi: k }, 12000).then(function (v) {
        if (no !== son) return;
        goster(['bos', 'alinmis', 'ayrilmis', 'gecersiz', 'senin'].indexOf(v.durum) >= 0 ? v.durum : '', k);
      }).catch(function () { if (no === son) goster('', k); });
    }, 350);
  });
  var sar = h('label', { class: 'hesap-alan' }, h('span', { text: t('kadi') }), h('div', { class: 'kadi-kutu' }, h('i', { text: '@' }), i), bilgi);
  return { el: i, sar: sar, durum: function () { return durum; }, dinle: function (f) { dinleyen = f; } };
}

/* Profil düzenleme: görünen ad, kullanıcı adı, hakkımda */
function profilDuzenle(yenile) {
  var hb = hesapBilgi(); if (!hb) { girisIste(); return; }
  var ad = h('input', { class: 'metin', type: 'text', maxlength: '24', value: hb.ad, autocomplete: 'name', 'aria-label': t('hAd') });
  var kd = kadiGirdisi(hb.kadi, hb.kadi);
  var bio = h('textarea', { class: 'metin', rows: '3', maxlength: '150', 'aria-label': t('hakkimda'), placeholder: t('hakkimdaYer') });
  bio.value = hb.bio || '';
  var say = h('small', { class: 'sayac', text: bio.value.length + '/150' });
  bio.addEventListener('input', function () { say.textContent = bio.value.length + '/150'; });
  var av = avatarDoldur(h('button', { class: 'hesap-av buyuk benim', 'aria-label': t('avBaslik') }), benimAvatar(), hb.ad);
  var avYenile = function () { avatarDoldur(av, benimAvatar(), kirp(ad.value, 24) || hb.ad); };
  av.addEventListener('click', function () { avatarMenusu(avYenile); });
  ad.addEventListener('input', function () { if (!benimAvatar()) avYenile(); });
  // @admin: yalnız uygulama sahibi, yönetici koduyla alır
  var kodGirdi = h('input', { class: 'metin', type: 'password', maxlength: '24', autocomplete: 'off', 'aria-label': t('yoneticiKodu'), placeholder: 'XXXX-XXXX-XXXX-XXXX' });
  var kodSar = h('label', { class: 'hesap-alan gizli' }, h('span', { text: t('yoneticiKodu') }), kodGirdi, h('small', { class: 'kadi-durum', text: t('yoneticiKoduNot') }));
  kd.dinle(function (d, k) { kodSar.classList.toggle('gizli', !(k === 'admin' && d === 'ayrilmis')); });
  var btn = h('button', { class: 'btn ana' }, ikon('tik', 'k'), t('kaydet'));
  var s = sayfaAc({ baslik: t('profilDuzenle'), icerik: h('div', { class: 'profil-duzen' },
    h('div', { class: 'profil-ust' }, h('div', { class: 'av-sar' }, av, h('span', { class: 'av-kalem', 'aria-hidden': 'true' }, ikon('kamera', 'k'))),
      h('div', null, h('b', { text: hb.ad }), hb.kadi ? kadiEl(hb.kadi) : h('small', { text: t('kadiSecilmedi') }),
        h('button', { class: 'hesap-link', style: { padding: '4px 0 0', 'text-align': 'left' }, text: t('avDegistirKisa'), on: { click: function () { avatarMenusu(avYenile); } } }))),
    h('label', { class: 'hesap-alan' }, h('span', { text: t('hAd') }), ad),
    kd.sar, kodSar,
    h('label', { class: 'hesap-alan' }, h('span', null, t('hakkimda'), say), bio),
    h('p', { class: 'ayar-not', text: t('profilNot') })), altBar: btn });
  var gidiyor = false;
  btn.addEventListener('click', function () {
    if (gidiyor) return;
    var a = kirp(ad.value, 24), k = kadiNormal(kd.el.value), b = kirp(bio.value, 150);
    if (a.length < 2) { tost(t('hAdHata')); ad.focus(); return; }
    if (!kadiGecerli(k)) { tost(t('kadiGecersiz')); kd.el.focus(); return; }
    if (/(https?:\/\/|www\.|\b\d[\d\s().-]{8,}\d\b)/i.test(a + ' ' + b)) { tost(t('baglantiYok')); return; }
    var govde = { ad: a, kadi: k, bio: b };
    if (k === 'admin' && hb.kadi !== 'admin') {
      if (!kirp(kodGirdi.value, 24)) { tost(t('yoneticiKoduGerek')); kodGirdi.focus(); return; }
      govde.yoneticiKodu = kirp(kodGirdi.value, 24);
    } else if (kd.durum() === 'alinmis' || kd.durum() === 'ayrilmis') { tost(t(kd.durum() === 'alinmis' ? 'kadiAlinmis' : 'kadiAyrilmis')); kd.el.focus(); return; }
    var gonder = function () {
      gidiyor = true; btn.disabled = true;
      yzIste('/v1/profil', govde, 30000).then(function (v) {
        if (!v || !v.hesap) throw new Error('hata');
        hesapYaz(v.hesap);
        TOPLULUK.yuklendi = false;
        s.kapat(); tost(t('profilKaydedildi'));
        if (yenile) yenile(); ciz();
      }).catch(function (e) {
        if (e && e.message === 'denetim') tost(t('profilDenetim')); else tost(hesapHataMetni(e));
      }).then(function () { gidiyor = false; btn.disabled = false; });
    };
    // ayrılmış bir adı bırakmak geri alınamaz: önce sor
    if (hb.kadi && RESMI_AD[hb.kadi] && k !== hb.kadi) onayIste(t('resmiBirak', hb.kadi), gonder); else gonder();
  });
}
function onayIste(metin, evet) {
  var e = h('button', { class: 'btn tehlike' }, t('evetDevam'));
  var s = sayfaAc({ baslik: t('eminMisin'), icerik: h('p', { text: metin }), altBar: h('div', { class: 'sarili', style: { width: '100%', gap: '10px' } },
    h('button', { class: 'btn ikincil', style: { flex: '1' }, on: { click: function () { s.kapat(); } } }, t('vazgec')), e) });
  e.style.flex = '1';
  e.addEventListener('click', function () { s.kapat(); evet(); });
}

/* Yönetici (@admin) paneli: ayrılmış adları (@user…) seçtiği kişiye verir ya da geri alır */
function yoneticiPaneli() {
  var hb = hesapBilgi(); if (!hb || !hb.yonetici) return;
  var secili = 'user';
  var adlar = h('div', { class: 'cipler' });
  ['user', 'destek', 'kombinle', 'moderator'].forEach(function (a) {
    adlar.appendChild(h('button', { class: 'cip', 'data-ad': a, 'aria-pressed': a === secili ? 'true' : 'false', text: '@' + a, on: { click: function () {
      secili = a; $$('button', adlar).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-ad') === a ? 'true' : 'false'); });
    } } }));
  });
  var hedef = h('input', { class: 'metin', type: 'text', maxlength: '21', autocapitalize: 'none', spellcheck: 'false', placeholder: t('hedefKadiYer'), 'aria-label': t('hedefKadi') });
  var ata = h('button', { class: 'btn ana', style: { flex: '1' } }, t('adiVer'));
  var geri = h('button', { class: 'btn tehlike-cizgi', style: { flex: '1' } }, t('adiGeriAl'));
  var sonuc = h('p', { class: 'ayar-not yonetici-sonuc', 'aria-live': 'polite' });
  sayfaAc({ baslik: t('yoneticiPanel'), icerik: h('div', { class: 'profil-duzen' },
    h('p', { class: 'alt-yazi', text: t('yoneticiMetin') }),
    h('div', { class: 'hesap-alan' }, h('span', { text: t('ayrilmisAd') }), adlar),
    h('label', { class: 'hesap-alan' }, h('span', { text: t('hedefKadi') }), h('div', { class: 'kadi-kutu' }, h('i', { text: '@' }), hedef)),
    h('div', { class: 'sarili', style: { gap: '10px' } }, ata, geri), sonuc,
    h('span', { class: 'g-bolum-etk', style: { 'margin-top': '8px' }, text: t('rkYonetim') }),
    h('button', { class: 'satir', on: { click: reklamYonetimi } }, ikon('grafik'), h('span', { text: t('rkYonetimAc') }))) });
  var calis = function (govde, btn) {
    btn.disabled = true;
    yzIste('/v1/ata', govde, 20000).then(function (v) {
      sonuc.textContent = govde.geriAl ? t('adGeriAlindi', secili) : t('adVerildi', secili, kirp(v.sahip || '', 24));
      tost(sonuc.textContent); hedef.value = ''; TOPLULUK.yuklendi = false;
    }).catch(function (e) { tost(hesapHataMetni(e)); }).then(function () { btn.disabled = false; });
  };
  ata.addEventListener('click', function () {
    var k = kadiNormal(hedef.value);
    if (!kadiGecerli(k)) { tost(t('kadiGecersiz')); hedef.focus(); return; }
    onayIste(t('adVerSor', secili, k), function () { calis({ ad: secili, hedef: k }, ata); });
  });
  geri.addEventListener('click', function () { onayIste(t('adGeriSor', secili), function () { calis({ ad: secili, geriAl: true }, geri); }); });
}
