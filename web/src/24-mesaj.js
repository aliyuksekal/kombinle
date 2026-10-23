/* =========================================================
   Mesajlaşma (DM), profil takip sekmeleri, telefon bildirimleri ve yönetici şikâyet paneli
   ========================================================= */

/* ---------- Mesajlaşma ---------- */
var DM = { okunmamis: 0, acik: null };
function dmDugmesi() {
  var b = h('button', { class: 'g-zil g-dm', 'aria-label': t('dmBaslik'), on: { click: function () { dmKutusu(); } } }, ikon('gonder', 'k'));
  if (DM.okunmamis > 0) b.appendChild(h('span', { class: 'zil-rozet', text: DM.okunmamis > 99 ? '99+' : String(DM.okunmamis) }));
  return b;
}
function dmRozetGuncelle() {
  $$('.g-dm').forEach(function (b) {
    var r = $('.zil-rozet', b);
    if (DM.okunmamis > 0) { if (!r) { r = h('span', { class: 'zil-rozet' }); b.appendChild(r); } r.textContent = DM.okunmamis > 99 ? '99+' : String(DM.okunmamis); }
    else if (r) r.remove();
  });
}
function dmKisiGecerli(k) { return k && typeof k === 'object' && typeof k.kod === 'string' && /^[a-f0-9]{12}$/.test(k.kod) && typeof k.takma === 'string'; }
function dmZaman(ms) {
  var d = new Date(ms), b = new Date();
  try {
    if (d.toDateString() === b.toDateString()) return d.toLocaleTimeString(({ tr: 'tr-TR', ru: 'ru-RU', uz: 'uz-UZ' })[A.dil] || 'en-GB', { hour: '2-digit', minute: '2-digit' });
  } catch (e) { }
  return zamanOnce(ms);
}
function dmHataMetni(e) {
  var k = e && e.message;
  if (k === 'izin') return t('dmIzin');
  if (k === 'engelledin') return t('dmEngelledin');
  if (k === 'istek_bekliyor') return t('dmIstekBekliyor');
  if (k === 'baglanti') return t('dmBaglanti');
  if (k === 'denetim') return t('dmDenetim');
  if (k === 'kota') return t('dmKota');
  if (k === 'yok') return t('kisiBulunamadi');
  return t('tpHata');
}
/* Gelen kutusu: sohbetler ve mesaj istekleri */
function dmKutusu() {
  if (!girisIste()) return;
  var sekme = 'sohbet';
  var seg = h('div', { class: 'g-haplar' });
  var liste = h('div', { class: 'tk-liste dm-liste' });
  var gov = h('div', null, seg, liste);
  var s = sayfaAc({ baslik: t('dmBaslik'), icerik: gov });
  var veri = [];
  function segCiz() {
    temizle(seg);
    var istek = veri.filter(function (x) { return x.durum === 'istek_gelen'; }).length;
    [['sohbet', t('dmSohbetler')], ['istek', t('dmIstekler') + (istek ? ' (' + istek + ')' : '')]].forEach(function (x) {
      seg.appendChild(h('button', { 'aria-pressed': sekme === x[0] ? 'true' : 'false', text: x[1], on: { click: function () { sekme = x[0]; segCiz(); ciz2(); } } }));
    });
  }
  function ciz2() {
    temizle(liste);
    var l = veri.filter(function (x) { return sekme === 'istek' ? x.durum === 'istek_gelen' : x.durum !== 'istek_gelen'; });
    if (!l.length) { liste.appendChild(h('div', { class: 'g-bos-not' }, ikon('gonder', 'k'), h('span', { text: sekme === 'istek' ? t('dmIstekYok') : t('dmBos') }))); return; }
    l.forEach(function (x) {
      var k = x.kisi, ad = kirp(k.takma, 24);
      var ek = h('small', { class: 'bn-metin' + (x.okunmamis ? ' dm-yeni' : '') },
        h('span', { text: (x.benden ? t('dmSen') + ': ' : '') + kirp(x.metin, 60) }), h('i', { text: ' • ' + dmZaman(x.son) }),
        x.durum === 'istek_giden' ? h('i', { class: 'dm-etiket', text: ' • ' + t('dmIstekGitti') }) : null);
      var satir = kisiSatiri({ kod: k.kod, takma: ad, kadi: k.kadi, av: k.av, benim: true }, function () { dmSohbet(k, function () { yukle(); }); }, ek);
      if (x.okunmamis) satir.appendChild(h('span', { class: 'dm-sayi', text: String(Math.min(99, x.okunmamis)) }));
      liste.appendChild(satir);
    });
  }
  function yukle() {
    if (s.kapandi) return;
    yzIste('/v1/dmliste', {}, 15000).then(function (v) {
      if (s.kapandi) return;
      veri = Array.isArray(v.liste) ? v.liste.filter(function (x) { return x && dmKisiGecerli(x.kisi) && sayiMi(x.son); }) : [];
      DM.okunmamis = veri.reduce(function (a, x) { return a + (x.okunmamis | 0); }, 0); dmRozetGuncelle();
      segCiz(); ciz2();
    }).catch(function (e) { temizle(liste); liste.appendChild(h('p', { class: 'alt-yazi', text: dmHataMetni(e) })); });
  }
  liste.appendChild(h('div', { class: 'g-yukleniyor' }, h('span', { class: 'yukleniyor' })));
  segCiz(); yukle();
  bildirimIzniIste();
}
/* Tek sohbet: mesaj balonları, birkaç saniyede bir yenilenir */
function dmSohbet(kisi, degisti) {
  if (!girisIste() || !dmKisiGecerli(kisi)) return;
  var ad = kirp(kisi.takma, 24);
  var mesajlar = [], durum = 'yok', engelledim = false, son = 0, yukleniyor = false;
  var akis = h('div', { class: 'dm-akis', 'aria-live': 'polite' });
  var ust = h('div', { class: 'dm-ust' });
  var girdi = h('textarea', { class: 'dm-girdi', rows: '1', maxlength: '1000', placeholder: t('dmYaz'), 'aria-label': t('dmYaz') });
  var gonder = h('button', { class: 'dm-gonder', 'aria-label': t('dmGonder') }, ikon('gonder', 'k'));
  var alt = h('div', { class: 'dm-alt' }, girdi, gonder);
  var s = sayfaAc({ baslik: ad, icerik: h('div', { class: 'dm-sayfa' }, ust, akis), altBar: alt, kapaninca: function () { clearInterval(zaman); DM.acik = null; if (degisti) degisti(); } });
  DM.acik = kisi.kod;
  /* başlık: profile git ve menü */
  var bas = $('.bas', s.sayfa);
  if (bas) bas.insertBefore(h('button', { class: 'ikon-btn', style: { 'margin-left': 'auto' }, 'aria-label': t('secenekler'), on: { click: menu } }, ikon('nokta')), bas.lastChild);
  function ustCiz() {
    temizle(ust);
    ust.appendChild(h('button', { class: 'dm-kisi', on: { click: function () { profilSayfasi(kisi.kod, kisi); } } },
      avatarDoldur(h('span', { class: 'g-avatar' }), kisiAvatar(kisi.kod, kisi.av, ad), ad), h('div', null, h('b', { text: ad }), kadiEl(kisi.kadi))));
    if (durum === 'istek_gelen') {
      ust.appendChild(h('div', { class: 'dm-istek' }, h('p', { text: t('dmIstekMetin', ad) }),
        h('div', { class: 'sarili', style: { gap: '8px' } },
          h('button', { class: 'btn ana kucuk', on: { click: kabul } }, t('dmKabul')),
          h('button', { class: 'btn ikincil kucuk', on: { click: silSor } }, t('sil')),
          h('button', { class: 'btn tehlike-cizgi kucuk', on: { click: engelSor } }, t('engelle')))));
    } else if (durum === 'istek_giden') ust.appendChild(h('p', { class: 'ayar-not', text: t('dmIstekGittiMetin', ad) }));
    if (engelledim) ust.appendChild(h('div', { class: 'dm-istek' }, h('p', { text: t('dmEngelliMetin') }),
      h('button', { class: 'btn ikincil kucuk', on: { click: function () { engelle(false); } } }, t('dmEngelKaldir'))));
    var kapali = durum === 'istek_gelen' || engelledim;
    girdi.disabled = kapali; gonder.disabled = kapali;
    alt.classList.toggle('kapali', kapali);
  }
  function balon(m) {
    var b = h('div', { class: 'dm-balon' + (m.ben ? ' ben' : '') }, h('span', { class: 'dm-metin', text: m.metin }),
      h('small', { text: dmZaman(m.zaman) + (m.ben && m.okundu ? ' • ' + t('dmGoruldu') : '') }));
    if (!m.ben) b.addEventListener('contextmenu', function (e) { e.preventDefault(); sikayetSor(m); });
    if (!m.ben) { var dokun = null; b.addEventListener('touchstart', function () { dokun = setTimeout(function () { sikayetSor(m); }, 650); }, { passive: true }); b.addEventListener('touchend', function () { clearTimeout(dokun); }); }
    return b;
  }
  function akisCiz(kaydir) {
    var altta = akis.scrollHeight - akis.scrollTop - akis.clientHeight < 80;
    temizle(akis);
    if (!mesajlar.length) akis.appendChild(h('p', { class: 'alt-yazi dm-bos', text: durum === 'yok' ? t('dmIlkMesaj', ad) : '' }));
    mesajlar.forEach(function (m) { akis.appendChild(balon(m)); });
    if (kaydir || altta) setTimeout(function () { akis.scrollTop = akis.scrollHeight; }, 0);
  }
  function yukle(ilk) {
    if (yukleniyor || s.kapandi) return;
    yukleniyor = true;
    yzIste('/v1/dmoku', { kod: kisi.kod }, 15000).then(function (v) {
      if (s.kapandi) return;
      if (dmKisiGecerli(v.kisi)) kisi = Object.assign({}, kisi, v.kisi);
      var yeni = Array.isArray(v.mesajlar) ? v.mesajlar.filter(function (m) { return m && typeof m.metin === 'string' && sayiMi(m.zaman); }) : [];
      var degisti2 = yeni.length !== mesajlar.length || (yeni.length && mesajlar.length && (yeni[yeni.length - 1].id !== mesajlar[mesajlar.length - 1].id || yeni[yeni.length - 1].okundu !== mesajlar[mesajlar.length - 1].okundu));
      var durumDegisti = durum !== v.durum || engelledim !== !!v.engelledim;
      mesajlar = yeni; durum = ['acik', 'istek_gelen', 'istek_giden', 'yok'].indexOf(v.durum) >= 0 ? v.durum : 'yok'; engelledim = !!v.engelledim;
      if (ilk || durumDegisti) ustCiz();
      if (ilk || degisti2) akisCiz(ilk);
    }).catch(function (e) { if (ilk) { temizle(akis); akis.appendChild(h('p', { class: 'alt-yazi', text: dmHataMetni(e) })); } }).then(function () { yukleniyor = false; });
  }
  function yolla() {
    var m = girdi.value.replace(/\s+$/, '').slice(0, 1000);
    if (!m.trim() || gonder.disabled) return;
    gonder.disabled = true;
    yzIste('/v1/dmyaz', { kod: kisi.kod, metin: m }, 30000).then(function (v) {
      if (v.mesaj && typeof v.mesaj.metin === 'string') { mesajlar.push(v.mesaj); girdi.value = ''; girdi.style.height = ''; }
      if (v.durum && v.durum !== durum) { durum = v.durum; ustCiz(); }
      akisCiz(true);
    }).catch(function (e) {
      var v = e && e.veri;
      if (e && e.message === 'denetim') { var nd = { cinsel: 'dnCinsel', taciz: 'dnTaciz', nefret: 'dnNefret', spam: 'dnSpam', kisisel_bilgi: 'dnKisisel' }[v && v.neden]; tost(t('dmDenetim') + (nd ? ' ' + t(nd) : '')); }
      else tost(dmHataMetni(e));
    }).then(function () { gonder.disabled = durum === 'istek_gelen' || engelledim; });
  }
  function kabul() { yzIste('/v1/dmkabul', { kod: kisi.kod }, 15000).then(function () { durum = 'acik'; ustCiz(); tost(t('dmKabulEdildi')); }).catch(function (e) { tost(dmHataMetni(e)); }); }
  function silSor() {
    onayla(t('dmSil'), t('dmSilSor', ad), t('sil'), true).then(function (evet) {
      if (!evet) return;
      yzIste('/v1/dmsil', { kod: kisi.kod }, 15000).then(function () { s.kapat(); tost(t('silindi')); }).catch(function (e) { tost(dmHataMetni(e)); });
    });
  }
  function engelle(e2) {
    yzIste('/v1/dmengel', { kod: kisi.kod, engel: e2 }, 15000).then(function () {
      if (e2) { s.kapat(); tost(t('dmEngellendi', ad)); } else { engelledim = false; ustCiz(); tost(t('dmEngelKalkti')); }
    }).catch(function (e) { tost(dmHataMetni(e)); });
  }
  function engelSor() { onayla(t('engelle'), t('dmEngelSor', ad), t('engelle'), true).then(function (evet) { if (evet) engelle(true); }); }
  function sikayetSor(m) {
    if (!m.id) return;
    onayla(t('sikayetEt'), t('dmSikayetSor'), t('sikayetEt'), true).then(function (evet) {
      if (!evet) return;
      yzIste('/v1/dmsikayet', { id: m.id }, 15000).then(function () { s.kapat(); tost(t('dmSikayetAlindi')); }).catch(function (e) { tost(dmHataMetni(e)); });
    });
  }
  function menu() {
    var g = h('div', { class: 'ayar-grup' });
    var ms = sayfaAc({ baslik: ad, icerik: g });
    g.appendChild(menuSatir('kisi', t('profiliGor'), '', function () { ms.kapat(); setTimeout(function () { profilSayfasi(kisi.kod, kisi); }, 300); }));
    g.appendChild(menuSatir('cop', t('dmSil'), '', function () { ms.kapat(); setTimeout(silSor, 300); }));
    g.appendChild(menuSatir('kapat', engelledim ? t('dmEngelKaldir') : t('engelle'), t('dmEngelAlt'), function () { ms.kapat(); setTimeout(function () { if (engelledim) engelle(false); else engelSor(); }, 300); }));
    g.appendChild(h('p', { class: 'ayar-not', text: t('dmSikayetNot') }));
  }
  girdi.addEventListener('input', function () { girdi.style.height = 'auto'; girdi.style.height = Math.min(120, girdi.scrollHeight) + 'px'; });
  girdi.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); yolla(); } });
  gonder.addEventListener('click', yolla);
  ustCiz(); yukle(true);
  var zaman = setInterval(function () { if (!document.hidden) yukle(false); }, 4000);
}

/* ---------- Profil: takipçi ve takip edilenler sekmeleri ---------- */
function takipListesiDoldur(kap, kod, tur, kapat) {
  temizle(kap); kap.appendChild(h('div', { class: 'g-yukleniyor pr-tam' }, h('span', { class: 'yukleniyor' })));
  yzIste('/v1/takipler', { kod: kod, tur: tur }, 15000).then(function (v) {
    temizle(kap);
    var eng = engelliler();
    var l = Array.isArray(v.liste) ? v.liste.filter(function (k) { return k && /^[a-f0-9]{12}$/.test(k.kod) && typeof k.takma === 'string' && eng.indexOf(k.kod) < 0; }) : [];
    if (!l.length) { kap.appendChild(h('div', { class: 'g-bos-not pr-tam' }, ikon('kisi', 'k'), h('span', { text: tur === 'takip' ? t('prTakipYok') : t('prTakipciYok') }))); return; }
    var liste = h('div', { class: 'tk-liste pr-tam' });
    l.forEach(function (k) { liste.appendChild(kisiSatiri(k, function () { if (kapat) kapat(); setTimeout(function () { profilSayfasi(k.kod, k); }, 250); })); });
    kap.appendChild(liste);
  }).catch(function () { temizle(kap); kap.appendChild(h('p', { class: 'alt-yazi pr-tam', text: t('tpHata') })); });
}

/* ---------- Telefon bildirimleri ---------- */
function bildirimIzniIste() {
  try { if (YEREL && typeof YEREL.bildirimIzni === 'function') YEREL.bildirimIzni(); } catch (e) { }
}
/* bildirime dokunarak açılınca ilgili sayfa */
function acilacakSayfa(ne) {
  if (ne === 'mesaj') setTimeout(dmKutusu, 400);
  else if (ne === 'bildirim') setTimeout(bildirimSayfasi, 400);
}
window.addEventListener('kbac', function (e) { var d = e && e.detail; if (d && typeof d.ne === 'string') acilacakSayfa(d.ne); });

/* ---------- Yönetici: şikâyet inceleme ---------- */
function sikayetPaneli() {
  var hb = hesapBilgi(); if (!hb || !hb.yonetici) return;
  var gov = h('div', { class: 'profil-duzen' }, h('div', { class: 'g-yukleniyor' }, h('span', { class: 'yukleniyor' })));
  var s = sayfaAc({ baslik: t('ykBaslik'), icerik: gov });
  function islem(govde, satir, mesaj) {
    return yzIste('/v1/yonetim', govde, 20000).then(function () { tost(mesaj); if (satir) satir.remove(); }).catch(function (e) { tost(hesapHataMetni(e)); });
  }
  function resimKutusu(tur, id) {
    var k = h('button', { class: 'yk-resim', 'aria-label': t('buyut') }, h('span', { class: 'yukleniyor' }));
    yzIste('/v1/yonetim', { islem: 'resim', tur: tur, id: id }, 20000).then(function (v) {
      if (!v || typeof v.b64 !== 'string' || !/^image\/(jpeg|png|webp)$/.test(v.tip)) throw new Error('resim');
      var src = 'data:' + v.tip + ';base64,' + v.b64;
      temizle(k); k.appendChild(h('img', { src: src, alt: '' }));
      k.addEventListener('click', function () { goruntuleyiciAc(src, ''); });
    }).catch(function () { temizle(k); k.appendChild(ikon('galeri', 'k')); });
    return k;
  }
  function bolum(baslik, l, ciz2) {
    gov.appendChild(h('span', { class: 'g-bolum-etk', text: baslik + ' (' + l.length + ')' }));
    if (!l.length) { gov.appendChild(h('p', { class: 'alt-yazi', text: t('ykBos') })); return; }
    l.forEach(function (x) { gov.appendChild(ciz2(x)); });
  }
  function yukle() {
    yzIste('/v1/yonetim', { islem: 'liste' }, 20000).then(function (v) {
      if (s.kapandi) return;
      temizle(gov);
      gov.appendChild(h('p', { class: 'alt-yazi', text: t('ykMetin') }));
      var dizi = function (x) { return Array.isArray(x) ? x.filter(function (y) { return y && typeof y === 'object'; }).slice(0, 100) : []; };
      bolum(t('ykPaylasim'), dizi(v.paylasimlar), function (x) {
        var satir = h('div', { class: 'yk-satir' });
        satir.appendChild(resimKutusu('paylasim', x.id));
        satir.appendChild(h('div', { class: 'yk-bilgi' }, h('b', { text: kirp(x.takma, 24) }), h('small', { text: kirp(x.aciklama || '', 120) }),
          h('small', { class: 'yk-sikayet', text: t('ykSikayet', x.sikayet | 0) + (x.nedenler ? ' • ' + String(x.nedenler).split(',').slice(0, 5).map(function (n) { return t('ykn_' + n); }).join(', ') : '') }),
          h('div', { class: 'sarili', style: { gap: '8px' } },
            h('button', { class: 'btn ikincil kucuk', on: { click: function () { islem({ islem: 'paylasimac', id: x.id }, satir, t('ykAcildi')); } } }, t('ykAc')),
            h('button', { class: 'btn tehlike-cizgi kucuk', on: { click: function () { islem({ islem: 'paylasimsil', id: x.id }, satir, t('silindi')); } } }, t('sil')))));
        return satir;
      });
      bolum(t('ykAnket'), dizi(v.anketler), function (x) {
        var satir = h('div', { class: 'yk-satir' });
        satir.appendChild(h('div', { class: 'yk-ikili' }, resimKutusu('anketa', x.id), resimKutusu('anketb', x.id)));
        satir.appendChild(h('div', { class: 'yk-bilgi' }, h('b', { text: kirp(x.takma, 24) }), h('small', { text: kirp(x.soru || '', 140) }), h('small', { class: 'yk-sikayet', text: t('ykSikayet', x.sikayet | 0) }),
          h('div', { class: 'sarili', style: { gap: '8px' } },
            h('button', { class: 'btn ikincil kucuk', on: { click: function () { islem({ islem: 'anketac', id: x.id }, satir, t('ykAcildi')); } } }, t('ykAc')),
            h('button', { class: 'btn tehlike-cizgi kucuk', on: { click: function () { islem({ islem: 'anketsil', id: x.id }, satir, t('silindi')); } } }, t('sil')))));
        return satir;
      });
      bolum(t('ykYorum'), dizi(v.yorumlar), function (x) {
        var satir = h('div', { class: 'yk-satir' });
        satir.appendChild(h('div', { class: 'yk-bilgi' }, h('b', { text: kirp(x.takma, 24) }), h('p', { class: 'yk-metin', text: kirp(x.metin || '', 300) }), h('small', { class: 'yk-sikayet', text: t('ykSikayet', x.sikayet | 0) }),
          h('div', { class: 'sarili', style: { gap: '8px' } },
            h('button', { class: 'btn ikincil kucuk', on: { click: function () { islem({ islem: 'yorumac', id: x.id }, satir, t('ykAcildi')); } } }, t('ykAc')),
            h('button', { class: 'btn tehlike-cizgi kucuk', on: { click: function () { islem({ islem: 'yorumsil', id: x.id }, satir, t('silindi')); } } }, t('sil')))));
        return satir;
      });
      bolum(t('ykMesaj'), dizi(v.mesajlar), function (x) {
        var satir = h('div', { class: 'yk-satir' });
        satir.appendChild(h('div', { class: 'yk-bilgi' }, h('b', { text: kirp(x.takma || '?', 24) }), h('p', { class: 'yk-metin', text: kirp(x.metin || '', 300) }), h('small', { class: 'yk-sikayet', text: t('ykSikayet', x.sayi | 0) }),
          h('div', { class: 'sarili', style: { gap: '8px' } },
            h('button', { class: 'btn ikincil kucuk', on: { click: function () { islem({ islem: 'dmyoksay', id: x.id }, satir, t('ykKapandi')); } } }, t('ykYoksay')),
            /^[a-f0-9]{12}$/.test(x.gonderen) ? h('button', { class: 'btn tehlike-cizgi kucuk', on: { click: function () {
              onayla(t('engelle'), t('ykEngelSor', kirp(x.takma || '?', 24)), t('engelle'), true).then(function (evet) {
                if (evet) islem({ islem: 'engelle', kod: x.gonderen }, null, t('engellendi')).then(function () { islem({ islem: 'dmyoksay', id: x.id }, satir, t('ykKapandi')); });
              });
            } } }, t('ykEngelle')) : null)));
        return satir;
      });
      bolum(t('ykEngelli'), dizi(v.engelliler), function (x) {
        var satir = h('div', { class: 'yk-satir' });
        satir.appendChild(h('div', { class: 'yk-bilgi' }, h('b', { text: kirp(x.takma || t('ykBilinmeyen'), 24) + (x.kadi ? ' · @' + kirp(x.kadi, 20) : '') }), h('small', { text: zamanOnce(x.zaman) }),
          /^[a-f0-9]{12}$/.test(x.kod) ? h('button', { class: 'btn ikincil kucuk', style: { 'align-self': 'flex-start' }, on: { click: function () { islem({ islem: 'engelkaldir', kod: x.kod }, satir, t('ykEngelKalkti')); } } }, t('ykEngelKaldir')) : null));
        return satir;
      });
    }).catch(function (e) { temizle(gov); gov.appendChild(h('p', { class: 'alt-yazi', text: hesapHataMetni(e) })); });
  }
  yukle();
}

/* ---------- Metinler ---------- */
Object.assign(DIL.tr, {
  proS7: function (n) { return 'Günde ' + n + ' cevap doğal insan sesiyle'; }, dogalSesBitti: 'Bugünkü doğal ses hakkın doldu; cevaplar telefonun sesiyle okunacak.', dogalSesBittiUcretsiz: function (n) { return 'Bugünkü ' + n + ' doğal sesli cevap hakkın doldu; telefonun sesiyle devam ediyorum. PRO ile günde 20.'; },
  dogalSes: 'Doğal ses', dogalSesAlt: 'Cevaplar Kombinle AI\'nin insan gibi doğal sesiyle okunur (internet gerekir). Kapalıysa telefonun kendi sesi kullanılır.',
  dmBaslik: 'Mesajlar', dmSohbetler: 'Sohbetler', dmIstekler: 'İstekler', dmBos: 'Henüz mesajın yok. Bir profilden "Mesaj" diyerek başlayabilirsin.', dmIstekYok: 'Mesaj isteğin yok.',
  dmSen: 'Sen', dmIstekGitti: 'istek gönderildi', dmYaz: 'Mesaj yaz…', dmGonder: 'Gönder', dmGoruldu: 'Görüldü', dmMesaj: 'Mesaj',
  dmIstekMetin: function (a) { return a + ' seni takip etmiyor ve sana mesaj göndermek istiyor. Kabul edersen yazışabilirsiniz; o, sen kabul edene kadar mesajlarını okuduğunu görmez.'; },
  dmIstekGittiMetin: function (a) { return a + ' seni takip etmediği için mesajın istek olarak gitti. Kabul ederse yazışabilirsiniz.'; },
  dmIlkMesaj: function (a) { return a + ' ile ilk mesajını yaz 💜'; }, dmKabul: 'Kabul et', dmKabulEdildi: 'İstek kabul edildi 💜',
  dmSil: 'Sohbeti sil', dmSilSor: function (a) { return a + ' ile sohbet senden silinsin mi? Yeni mesaj gelirse sohbet yeniden görünür.'; },
  dmEngelSor: function (a) { return a + ' sana bir daha mesaj gönderemesin mi?'; }, dmEngellendi: function (a) { return a + ' artık sana mesaj gönderemez.'; },
  dmEngelKaldir: 'Engeli kaldır', dmEngelKalkti: 'Engel kaldırıldı.', dmEngelAlt: 'Sana mesaj gönderemez', dmEngelliMetin: 'Bu kişiyi engelledin; sana mesaj gönderemez.',
  dmSikayetSor: 'Bu mesaj şikâyet edilsin mi? Gönderen engellenir ve mesaj incelenir.', dmSikayetAlindi: 'Şikâyetin alındı, kişi engellendi.', dmSikayetNot: 'Bir mesajı şikâyet etmek için üzerine basılı tut.',
  dmIzin: 'Bu kişiye mesaj gönderilemiyor.', dmEngelledin: 'Bu kişiyi engelledin. Mesaj göndermek için engeli kaldır.', dmIstekBekliyor: 'İsteğin kabul edilene kadar en fazla 3 mesaj gönderebilirsin.',
  dmBaglanti: 'Güvenliğin için mesajlarda bağlantı paylaşılamaz; tanımadığın birine ilk mesajda telefon ya da kullanıcı adı da yazılamaz.',
  dmDenetim: 'Bu mesaj gönderilemedi.', dmKota: 'Bugün çok mesaj gönderdin, yarın tekrar dene.', dnTaciz: '(rahatsız edici içerik)',
  prTakipcilerSekme: 'Takipçiler', prTakipSekme: 'Takip edilen', prTakipBenSekme: 'Takip edilen',
  ykBaslik: 'Şikâyet inceleme', ykAc2: 'Şikâyetleri incele', ykMetin: 'Şikâyetle otomatik gizlenen içerikler ve engellenen kişiler. Yanlışsa geri açabilir, gerçekten uygunsuzsa silebilirsin.',
  ykPaylasim: 'Gizlenen paylaşımlar', ykAnket: 'Gizlenen anketler', ykYorum: 'Gizlenen yorumlar', ykMesaj: 'Şikâyet edilen mesajlar', ykEngelli: 'Engellenen kişiler',
  ykBos: 'Bekleyen yok.', ykSikayet: function (n) { return n + ' şikâyet'; }, ykAc: 'Geri aç', ykAcildi: 'Geri açıldı.', ykYoksay: 'Yok say', ykKapandi: 'Kapatıldı.', ykEngelle: 'Gönderene engel',
  ykEngelSor: function (a) { return a + ' uygulamadan engellensin mi? Hiçbir şey paylaşamaz ve mesaj gönderemez.'; },
  ykEngelKaldir: 'Engeli kaldır', ykEngelKalkti: 'Engel kaldırıldı.', ykBilinmeyen: 'Profilsiz cihaz',
  ykn_uygunsuz: 'uygunsuz', ykn_hakaret: 'hakaret', ykn_spam: 'spam', ykn_kisisel: 'kişisel bilgi', ykn_diger: 'diğer',
  bnYeniTakip: function (a) { return a + ' seni takip etmeye başladı'; }, bnYeni: 'Yeni bir bildirimin var', bnYeniMesaj: function (a) { return a + ' sana mesaj gönderdi'; },
  hEpostaKod: 'E-postama kod gelsin', hKurtarmaYol: 'Kurtarma kodum var', hKodGonder: 'Kod gönder', hKodGitti: 'Kayıtlıysa e-postana 6 haneli bir kod gönderdik. Gelen kutunu ve gereksiz klasörünü kontrol et.',
  hEpostaKodu: 'E-postadaki 6 haneli kod', hEpostaYok: 'E-postayla sıfırlama şu an kapalı; kurtarma kodunu kullan.', hEpostaHatasi: 'E-posta şu an gönderilemedi, birazdan tekrar dene.'
});
Object.assign(DIL.en, {
  proS7: function (n) { return n + ' replies a day in a natural human voice'; }, dogalSesBitti: 'Today\'s natural voice limit is used up; replies will use the phone\'s voice.', dogalSesBittiUcretsiz: function (n) { return 'You used today\'s ' + n + ' natural voice replies; continuing with the phone\'s voice. PRO gives 20 a day.'; },
  dogalSes: 'Natural voice', dogalSesAlt: 'Replies are read in Kombinle AI\'s natural, human-like voice (needs internet). When off, the phone\'s own voice is used.',
  dmBaslik: 'Messages', dmSohbetler: 'Chats', dmIstekler: 'Requests', dmBos: 'No messages yet. Tap "Message" on a profile to start.', dmIstekYok: 'No message requests.',
  dmSen: 'You', dmIstekGitti: 'request sent', dmYaz: 'Write a message…', dmGonder: 'Send', dmGoruldu: 'Seen', dmMesaj: 'Message',
  dmIstekMetin: function (a) { return a + " doesn't follow you and wants to send you messages. Accept to chat; they won't see that you read their messages until you accept."; },
  dmIstekGittiMetin: function (a) { return a + " doesn't follow you, so your message was sent as a request. You can chat once they accept."; },
  dmIlkMesaj: function (a) { return 'Write your first message to ' + a + ' 💜'; }, dmKabul: 'Accept', dmKabulEdildi: 'Request accepted 💜',
  dmSil: 'Delete chat', dmSilSor: function (a) { return 'Delete your chat with ' + a + '? It reappears if a new message arrives.'; },
  dmEngelSor: function (a) { return 'Stop ' + a + ' from messaging you?'; }, dmEngellendi: function (a) { return a + " can't message you anymore."; },
  dmEngelKaldir: 'Unblock', dmEngelKalkti: 'Unblocked.', dmEngelAlt: "Can't message you", dmEngelliMetin: "You blocked this person; they can't message you.",
  dmSikayetSor: 'Report this message? The sender is blocked and the message is reviewed.', dmSikayetAlindi: 'Report received, the person is blocked.', dmSikayetNot: 'Press and hold a message to report it.',
  dmIzin: "You can't message this person.", dmEngelledin: 'You blocked this person. Unblock to send a message.', dmIstekBekliyor: 'You can send up to 3 messages until your request is accepted.',
  dmBaglanti: "For your safety, links can't be shared in messages, and a first message to a stranger can't include phone numbers or usernames.",
  dmDenetim: "This message couldn't be sent.", dmKota: 'You sent a lot of messages today, try again tomorrow.', dnTaciz: '(harassing content)',
  prTakipcilerSekme: 'Followers', prTakipSekme: 'Following', prTakipBenSekme: 'Following',
  ykBaslik: 'Report review', ykAc2: 'Review reports', ykMetin: 'Content hidden automatically by reports and blocked people. Restore it if it was a mistake, delete it if it really breaks the rules.',
  ykPaylasim: 'Hidden posts', ykAnket: 'Hidden polls', ykYorum: 'Hidden comments', ykMesaj: 'Reported messages', ykEngelli: 'Blocked people',
  ykBos: 'Nothing pending.', ykSikayet: function (n) { return n + ' report' + (n === 1 ? '' : 's'); }, ykAc: 'Restore', ykAcildi: 'Restored.', ykYoksay: 'Dismiss', ykKapandi: 'Closed.', ykEngelle: 'Block sender',
  ykEngelSor: function (a) { return 'Block ' + a + " from the app? They won't be able to share or send messages."; },
  ykEngelKaldir: 'Unblock', ykEngelKalkti: 'Unblocked.', ykBilinmeyen: 'Device without profile',
  ykn_uygunsuz: 'inappropriate', ykn_hakaret: 'insult', ykn_spam: 'spam', ykn_kisisel: 'personal info', ykn_diger: 'other',
  bnYeniTakip: function (a) { return a + ' started following you'; }, bnYeni: 'You have a new notification', bnYeniMesaj: function (a) { return a + ' sent you a message'; },
  hEpostaKod: 'Email me a code', hKurtarmaYol: 'I have a recovery code', hKodGonder: 'Send code', hKodGitti: "If the email is registered, we've sent a 6-digit code. Check your inbox and spam folder.",
  hEpostaKodu: '6-digit code from the email', hEpostaYok: 'Email reset is not available right now; use your recovery code.', hEpostaHatasi: "The email couldn't be sent right now, try again shortly."
});
Object.assign(DIL.ru, {
  proS7: function (n) { return n + ' ответов в день естественным голосом'; }, dogalSesBitti: 'Лимит естественного голоса на сегодня исчерпан; ответы озвучит телефон.', dogalSesBittiUcretsiz: function (n) { return 'Сегодняшние ' + n + ' ответа естественным голосом использованы; дальше — голос телефона. С PRO — 20 в день.'; },
  dogalSes: 'Естественный голос', dogalSesAlt: 'Ответы озвучиваются естественным голосом Kombinle AI (нужен интернет). Если выключено — голос телефона.',
  dmBaslik: 'Сообщения', dmSohbetler: 'Чаты', dmIstekler: 'Запросы', dmBos: 'Сообщений пока нет. Нажми «Сообщение» в профиле.', dmIstekYok: 'Запросов нет.',
  dmSen: 'Ты', dmIstekGitti: 'запрос отправлен', dmYaz: 'Напиши сообщение…', dmGonder: 'Отправить', dmGoruldu: 'Просмотрено', dmMesaj: 'Сообщение',
  dmIstekMetin: function (a) { return a + ' не подписан(а) на тебя и хочет написать. Прими запрос, чтобы переписываться.'; },
  dmIstekGittiMetin: function (a) { return a + ' не подписан(а) на тебя, поэтому сообщение ушло как запрос.'; },
  dmIlkMesaj: function (a) { return 'Напиши первое сообщение: ' + a + ' 💜'; }, dmKabul: 'Принять', dmKabulEdildi: 'Запрос принят 💜',
  dmSil: 'Удалить чат', dmSilSor: function (a) { return 'Удалить чат с ' + a + '? Он появится снова при новом сообщении.'; },
  dmEngelSor: function (a) { return 'Запретить ' + a + ' писать тебе?'; }, dmEngellendi: function (a) { return a + ' больше не сможет тебе писать.'; },
  dmEngelKaldir: 'Разблокировать', dmEngelKalkti: 'Разблокировано.', dmEngelAlt: 'Не сможет писать тебе', dmEngelliMetin: 'Ты заблокировала этого человека.',
  dmSikayetSor: 'Пожаловаться на сообщение? Отправитель будет заблокирован.', dmSikayetAlindi: 'Жалоба принята, человек заблокирован.', dmSikayetNot: 'Чтобы пожаловаться, удерживай сообщение.',
  dmIzin: 'Этому человеку нельзя написать.', dmEngelledin: 'Ты заблокировала этого человека.', dmIstekBekliyor: 'До принятия запроса можно отправить не больше 3 сообщений.',
  dmBaglanti: 'Ради безопасности ссылки в сообщениях запрещены; в первом сообщении незнакомцу нельзя писать телефон или имя пользователя.',
  dmDenetim: 'Сообщение не отправлено.', dmKota: 'Сегодня отправлено слишком много сообщений.', dnTaciz: '(оскорбительное содержание)',
  prTakipcilerSekme: 'Подписчики', prTakipSekme: 'Подписки', prTakipBenSekme: 'Мои подписки',
  hEpostaKod: 'Прислать код на почту', hKurtarmaYol: 'У меня есть код восстановления', hKodGonder: 'Отправить код', hKodGitti: 'Если почта зарегистрирована, мы отправили 6-значный код.',
  hEpostaKodu: '6-значный код из письма', hEpostaYok: 'Сброс по почте сейчас недоступен; используй код восстановления.', hEpostaHatasi: 'Письмо сейчас не отправлено, попробуй позже.',
  bnYeniTakip: function (a) { return a + ' подписался(-ась) на тебя'; }, bnYeni: 'У тебя новое уведомление', bnYeniMesaj: function (a) { return a + ' прислал(а) сообщение'; }
});
Object.assign(DIL.uz, {
  proS7: function (n) { return 'Kuniga ' + n + ' ta javob tabiiy ovozda'; }, dogalSesBitti: "Bugungi tabiiy ovoz limiti tugadi; javoblarni telefon ovozi o'qiydi.", dogalSesBittiUcretsiz: function (n) { return 'Bugungi ' + n + " ta tabiiy ovozli javob tugadi; telefon ovozida davom etaman. PRO bilan kuniga 20 ta."; },
  dogalSes: 'Tabiiy ovoz', dogalSesAlt: "Javoblar Kombinle AI ning tabiiy ovozida o'qiladi (internet kerak). O'chiq bo'lsa, telefon ovozi ishlatiladi.",
  dmBaslik: 'Xabarlar', dmSohbetler: 'Suhbatlar', dmIstekler: "So'rovlar", dmBos: "Hali xabar yo'q. Profilda «Xabar» ni bosing.", dmIstekYok: "So'rov yo'q.",
  dmSen: 'Siz', dmIstekGitti: "so'rov yuborildi", dmYaz: 'Xabar yozing…', dmGonder: 'Yuborish', dmGoruldu: "Ko'rildi", dmMesaj: 'Xabar',
  dmIstekMetin: function (a) { return a + " sizni kuzatmaydi va xabar yubormoqchi. Qabul qilsangiz yozishasiz."; },
  dmIstekGittiMetin: function (a) { return a + " sizni kuzatmagani uchun xabaringiz so'rov sifatida ketdi."; },
  dmIlkMesaj: function (a) { return a + " ga birinchi xabaringizni yozing 💜"; }, dmKabul: 'Qabul qilish', dmKabulEdildi: "So'rov qabul qilindi 💜",
  dmSil: "Suhbatni o'chirish", dmSilSor: function (a) { return a + " bilan suhbat o'chirilsinmi?"; },
  dmEngelSor: function (a) { return a + ' sizga yozolmasinmi?'; }, dmEngellendi: function (a) { return a + ' endi sizga yozolmaydi.'; },
  dmEngelKaldir: 'Blokdan chiqarish', dmEngelKalkti: 'Blokdan chiqarildi.', dmEngelAlt: 'Sizga yozolmaydi', dmEngelliMetin: 'Siz bu odamni bloklagansiz.',
  dmSikayetSor: "Bu xabar ustidan shikoyat qilinsinmi? Yuboruvchi bloklanadi.", dmSikayetAlindi: 'Shikoyat qabul qilindi.', dmSikayetNot: 'Shikoyat uchun xabarni bosib turing.',
  dmIzin: "Bu odamga xabar yuborib bo'lmaydi.", dmEngelledin: 'Siz bu odamni bloklagansiz.', dmIstekBekliyor: "So'rov qabul qilinguncha ko'pi bilan 3 ta xabar yuborish mumkin.",
  dmBaglanti: "Xavfsizlik uchun xabarlarda havola ulashib bo'lmaydi; notanish odamga birinchi xabarda telefon yoki nom yozib bo'lmaydi.",
  dmDenetim: 'Bu xabar yuborilmadi.', dmKota: "Bugun juda ko'p xabar yubordingiz.", dnTaciz: '(bezovta qiluvchi mazmun)',
  prTakipcilerSekme: 'Obunachilar', prTakipSekme: 'Obunalar', prTakipBenSekme: 'Obunalarim',
  hEpostaKod: 'E-pochtamga kod yuborilsin', hKurtarmaYol: 'Tiklash kodim bor', hKodGonder: 'Kod yuborish', hKodGitti: "Agar ro'yxatdan o'tgan bo'lsa, 6 xonali kod yubordik.",
  hEpostaKodu: 'Xatdagi 6 xonali kod', hEpostaYok: "E-pochta orqali tiklash hozir yopiq; tiklash kodidan foydalaning.", hEpostaHatasi: "Xat hozir yuborilmadi, keyinroq urinib ko'ring.",
  bnYeniTakip: function (a) { return a + ' sizni kuzata boshladi'; }, bnYeni: 'Yangi bildirishnoma', bnYeniMesaj: function (a) { return a + ' sizga xabar yubordi'; }
});
