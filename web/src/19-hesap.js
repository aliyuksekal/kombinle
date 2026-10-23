/* ---------- Hesap: kayıt, giriş, şifre sıfırlama, çıkış, hesap silme ----------
   Şifre yalnızca HTTPS ile Kombinle sunucusuna gider; sunucuda tuzlu ve gizli anahtarla özetlenir.
   Oturum belirteci telefonda (uygulamanın kendi deposunda) tutulur, sayfa yalnızca ad ve e-postayı bilir. */

function hesapBilgi() {
  var h = LS.al('hesap', null);
  if (!h || typeof h !== 'object' || typeof h.ad !== 'string' || typeof h.eposta !== 'string') return null;
  try { if (YEREL && typeof YEREL.oturumVar === 'function' && !YEREL.oturumVar()) { LS.sil('hesap'); return null; } } catch (e) { }
  return { ad: kirp(h.ad, 24), eposta: kirp(h.eposta, 254), kod: typeof h.kod === 'string' && /^[a-f0-9]{12}$/.test(h.kod) ? h.kod : '' };
}
function girisli() { return !!hesapBilgi(); }
function hesapKaydet(v) {
  if (!v || typeof v.oturum !== 'string' || !/^[a-f0-9]{64}$/.test(v.oturum) || !v.hesap) return false;
  try { if (YEREL && typeof YEREL.oturumAyarla === 'function') YEREL.oturumAyarla(v.oturum); } catch (e) { return false; }
  LS.yaz('hesap', { ad: kirp(v.hesap.ad, 24), eposta: kirp(v.hesap.eposta, 254), kod: typeof v.hesap.kod === 'string' ? v.hesap.kod : '' });
  LS.yaz('takma', kirp(v.hesap.ad, 24));
  TOPLULUK.yuklendi = false;
  return true;
}
function hesapTemizle() {
  try { if (YEREL && typeof YEREL.oturumAyarla === 'function') YEREL.oturumAyarla(''); } catch (e) { }
  LS.sil('hesap');
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
    kota: t('hKota'), baglanti: t('baglantiYok'), oturum: t('hOturumBitti') })[k] || t('tpHata');
}

/* Ayarlardaki "Hesap" kartının içeriği */
function hesapBolumu(yenile) {
  var kap = h('div', { class: 'hesap-bolum' });
  var hb = hesapBilgi();
  if (!yzKurulu()) { kap.appendChild(h('p', { class: 'ayar-not', text: t('hSunucuYok') })); return kap; }
  if (hb) {
    kap.appendChild(h('div', { class: 'hesap-kart' },
      h('span', { class: 'hesap-av', text: (hb.ad.charAt(0) || '?').toLocaleUpperCase('tr') }),
      h('div', null, h('b', { text: hb.ad }), h('small', { text: hb.eposta }))));
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
  var btn = h('button', { class: 'btn ana', style: { width: '100%', 'margin-top': '6px' } }, mod === 'kayit' ? t('hKayit') : mod === 'sifre' ? t('hSifreSifirla') : t('hGiris'));
  if (mod === 'kayit') kap.appendChild(ad.sar);
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
      if (sf.el.value.length < 8) { tost(t('hSifreKisa')); sf.el.focus(); return; }
      if (sf.el.value !== sf2.el.value) { tost(t('hSifreEslesmedi')); sf2.el.focus(); return; }
      yol = '/v1/kayit'; govde = { ad: a, eposta: e, sifre: sf.el.value };
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
