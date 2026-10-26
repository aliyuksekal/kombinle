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
/* saat (balon içinde) ve gün ayracı (Bugün / Dün / tarih) */
var DM_YEREL = function () { return ({ tr: 'tr-TR', ru: 'ru-RU', uz: 'uz-UZ', ko: 'ko-KR' })[A.dil] || 'en-GB'; };
function dmSaat(ms) { try { return new Date(ms).toLocaleTimeString(DM_YEREL(), { hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } }
function dmGun(ms) {
  var d = new Date(ms), b = new Date(), dun = new Date(Date.now() - 86400000);
  if (d.toDateString() === b.toDateString()) return t('bugun');
  if (d.toDateString() === dun.toDateString()) return t('dun');
  try { return d.toLocaleDateString(DM_YEREL(), { day: 'numeric', month: 'long', year: d.getFullYear() === b.getFullYear() ? undefined : 'numeric' }); } catch (e) { return d.toDateString(); }
}
/* gönderildi ✓, ulaştı ✓✓, okundu ✓✓ (vurgulu) */
function dmTik(m) {
  var cift = m.okundu || m.teslim;
  var el = h('span', { class: 'dm-tik' + (m.okundu ? ' okundu' : ''), 'aria-label': m.okundu ? t('dmGoruldu') : cift ? t('dmUlasti') : t('dmGonderildi') });
  el.innerHTML = cift ? '<svg viewBox="0 0 20 12" width="17" height="11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 6.5 4.5 10 11 2"/><path d="M7.5 9 8.5 10 15 2"/></svg>'
    : '<svg viewBox="0 0 14 12" width="13" height="11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 6.5 5 10 12 2"/></svg>';
  return el;
}
var DM_TEPKILER = ['❤️', '😂', '😮', '😢', '🙏', '👍'];
function dmZaman(ms) {
  var d = new Date(ms), b = new Date();
  try {
    if (d.toDateString() === b.toDateString()) return d.toLocaleTimeString(({ tr: 'tr-TR', ru: 'ru-RU', uz: 'uz-UZ', ko: 'ko-KR' })[A.dil] || 'en-GB', { hour: '2-digit', minute: '2-digit' });
  } catch (e) { }
  return zamanOnce(ms);
}
function dmHataMetni(e) {
  var k = e && e.message;
  if (k === 'izin') return t('dmIzin');
  if (k === 'engelledin') return t('dmEngelledin');
  if (k === 'istek_bekliyor') return t('dmIstekBekliyor');
  if (k === 'dm_kapali') return t('dmKapali');
  if (k === 'dm_kisitli') return t('dmKisitli');
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
  var s = sayfaAc({ tam: true, baslik: t('dmBaslik'), icerik: gov });
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
  var mesajlar = [], durum = 'yok', engelledim = false, son = 0, yukleniyor = false, imza = '', yaziyor = false, yanitlanan = null, sonYazPing = 0;
  var yanitCubuk = h('div', { class: 'dm-yanit-cubuk', hidden: true });
  var akis = h('div', { class: 'dm-akis', 'aria-live': 'polite' });
  var ust = h('div', { class: 'dm-ust' });
  var girdi = h('textarea', { class: 'dm-girdi', rows: '1', maxlength: '1000', placeholder: t('dmYaz'), 'aria-label': t('dmYaz') });
  var gonder = h('button', { class: 'dm-gonder', 'aria-label': t('dmGonder') }, ikon('gonder', 'k'));
  var alt = h('div', { class: 'dm-alt-kap' }, yanitCubuk, h('div', { class: 'dm-alt' }, girdi, gonder));
  var s = sayfaAc({ tam: true, dolu: true, baslik: ad, icerik: h('div', { class: 'dm-sayfa' }, ust, akis), altBar: alt, kapaninca: function () { clearInterval(zaman); DM.acik = null; if (degisti) degisti(); } });
  DM.acik = kisi.kod;
  /* başlık: profile git ve menü */
  var bas = $('.bas', s.sayfa);
  if (bas) bas.insertBefore(h('button', { class: 'ikon-btn', style: { 'margin-left': 'auto' }, 'aria-label': t('secenekler'), on: { click: menu } }, ikon('nokta')), bas.lastChild);
  function ustCiz() {
    temizle(ust);
    ust.appendChild(h('button', { class: 'dm-kisi', on: { click: function () { profilSayfasi(kisi.kod, kisi); } } },
      avatarDoldur(h('span', { class: 'g-avatar' }), kisiAvatar(kisi.kod, kisi.av, ad), ad), h('div', null, h('b', { text: ad }),
        yaziyor ? h('small', { class: 'dm-yaziyor', text: t('dmYaziyor') }) : kadiEl(kisi.kadi))));
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
  /* yanıtlanacak mesaj: giriş kutusunun üstünde alıntı çubuğu (WhatsApp'taki gibi) */
  function yanitAyarla(m) {
    yanitlanan = m || null;
    temizle(yanitCubuk);
    yanitCubuk.hidden = !m;
    if (!m) return;
    yanitCubuk.appendChild(h('div', { class: 'dm-alinti' }, h('b', { text: m.ben ? t('dmSen') : ad }), h('span', { text: kirp(m.metin, 120) })));
    yanitCubuk.appendChild(h('button', { class: 'ikon-btn', 'aria-label': t('kapat'), on: { click: function () { yanitAyarla(null); } } }, ikon('kapat', 'k')));
    setTimeout(function () { try { girdi.focus(); } catch (e) { } }, 50);
  }
  /* uzun basınca: tepki, yanıtla, kopyala, sil / şikâyet */
  function eylemler(m) {
    if (m.silindi) return;
    var g = h('div', { class: 'dm-eylem' });
    var ms = sayfaAc({ baslik: '', icerik: g });
    var tepkiler = h('div', { class: 'dm-tepki-sec' });
    DM_TEPKILER.forEach(function (e) {
      tepkiler.appendChild(h('button', { class: m.tepki && m.tepki.ben === e ? 'secili' : '', 'aria-label': e, text: e, on: { click: function () { ms.kapat(); tepkiVer(m, e); } } }));
    });
    g.appendChild(tepkiler);
    var liste = h('div', { class: 'ayar-grup' });
    liste.appendChild(menuSatir('gonder', t('dmYanitla'), '', function () { ms.kapat(); setTimeout(function () { yanitAyarla(m); }, 280); }));
    liste.appendChild(menuSatir('kalem', t('dmKopyala'), '', function () {
      ms.kapat();
      try { navigator.clipboard.writeText(m.metin).then(function () { tost(t('dmKopyalandi')); }, function () { }); } catch (e) { }
    }));
    if (m.ben && Date.now() - m.zaman < 2 * 3600000) liste.appendChild(menuSatir('cop', t('dmHerkestenSil'), t('dmHerkestenSilAlt'), function () { ms.kapat(); setTimeout(function () { mesajSil(m); }, 280); }));
    if (!m.ben) liste.appendChild(menuSatir('bayrak', t('sikayetEt'), '', function () { ms.kapat(); setTimeout(function () { sikayetSor(m); }, 280); }));
    g.appendChild(liste);
  }
  /* yoklama mesaj listesini yeniler: işlem her zaman güncel nesneye uygulanır */
  function guncel(m) { for (var i = 0; i < mesajlar.length; i++) if (mesajlar[i].id === m.id) return mesajlar[i]; return m; }
  function tepkiVer(m, e) {
    m = guncel(m);
    var eski = m.tepki ? m.tepki.ben : '';
    m.tepki = m.tepki || { ben: '', o: '' }; m.tepki.ben = eski === e ? '' : e; imza = ''; akisCiz(false);
    yzIste('/v1/dmtepki', { id: m.id, tepki: e }, 15000).then(function (v) { if (v.tepki) { guncel(m).tepki = v.tepki; imza = ''; akisCiz(false); } })
      .catch(function (er) { m.tepki.ben = eski; akisCiz(false); tost(dmHataMetni(er)); });
  }
  function mesajSil(m) {
    onayla(t('dmHerkestenSil'), t('dmHerkestenSilSor'), t('sil'), true).then(function (evet) {
      if (!evet) return;
      yzIste('/v1/dmmsil', { id: m.id }, 15000).then(function () { var g = guncel(m); g.silindi = 1; g.metin = ''; imza = ''; akisCiz(false); })
        .catch(function (er) { tost(er && er.message === 'sure' ? t('dmSilSure') : dmHataMetni(er)); });
    });
  }
  function balon(m) {
    var ic = [];
    if (m.yanit && !m.silindi) {
      ic.push(h('button', { class: 'dm-alinti', on: { click: function (e) { e.stopPropagation(); var y = akis.querySelector('[data-id="' + m.yanit.id + '"]'); if (y) { y.scrollIntoView({ block: 'center', behavior: 'smooth' }); y.classList.add('vurgula'); setTimeout(function () { y.classList.remove('vurgula'); }, 1200); } } } },
        h('b', { text: m.yanit.ben ? t('dmSen') : ad }), h('span', { text: kirp(m.yanit.metin, 120) || '…' })));
    }
    ic.push(m.silindi ? h('span', { class: 'dm-metin silindi', text: '🚫 ' + (m.ben ? t('dmSildin') : t('dmSilindiMesaj')) }) : h('span', { class: 'dm-metin', text: m.metin }));
    ic.push(h('small', { class: 'dm-alt-bilgi' }, h('span', { text: dmSaat(m.zaman) }), m.ben && !m.silindi ? dmTik(m) : null));
    var b = h('div', { class: 'dm-balon' + (m.ben ? ' ben' : '') + (m.silindi ? ' silik' : ''), 'data-id': m.id }, ic);
    var tp = m.tepki ? [m.tepki.o, m.tepki.ben].filter(Boolean) : [];
    if (tp.length && !m.silindi) b.appendChild(h('span', { class: 'dm-tepki', text: tp.join('') }));
    /* uzun bas: eylemler; sağa kaydır: yanıtla */
    b.addEventListener('contextmenu', function (e) { e.preventDefault(); eylemler(m); });
    var dokun = null, x0 = 0, y0 = 0, kaydi = false;
    b.addEventListener('touchstart', function (e) { var p = e.touches[0]; x0 = p.clientX; y0 = p.clientY; kaydi = false; dokun = setTimeout(function () { if (!kaydi) eylemler(m); }, 550); }, { passive: true });
    b.addEventListener('touchmove', function (e) {
      var p = e.touches[0], dx = p.clientX - x0, dy = Math.abs(p.clientY - y0);
      if (Math.abs(dx) > 8 || dy > 8) { kaydi = true; clearTimeout(dokun); }
      if (dx > 0 && dy < 30 && !m.silindi) b.style.transform = 'translateX(' + Math.min(70, dx) + 'px)';
    }, { passive: true });
    b.addEventListener('touchend', function (e) {
      clearTimeout(dokun);
      var p = e.changedTouches[0], dx = p.clientX - x0;
      b.style.transform = '';
      if (kaydi && dx > 60 && !m.silindi) yanitAyarla(m);
    });
    return b;
  }
  function akisCiz(kaydir) {
    var altta = akis.scrollHeight - akis.scrollTop - akis.clientHeight < 80;
    temizle(akis);
    if (!mesajlar.length) akis.appendChild(h('p', { class: 'alt-yazi dm-bos', text: durum === 'yok' ? t('dmIlkMesaj', ad) : '' }));
    var gun = '', onceki = null;
    mesajlar.forEach(function (m) {
      var g = dmGun(m.zaman);
      if (g !== gun) { gun = g; onceki = null; akis.appendChild(h('div', { class: 'dm-gun' }, h('span', { text: g }))); }
      var b = balon(m);
      if (onceki && onceki.ben === m.ben && m.zaman - onceki.zaman < 120000) b.classList.add('ardisik');   // art arda mesajlar gruplanır
      akis.appendChild(b); onceki = m;
    });
    if (yaziyor) akis.appendChild(h('div', { class: 'dm-balon dm-yaziyor-balon' }, h('i'), h('i'), h('i')));
    if (kaydir || altta) setTimeout(function () { akis.scrollTop = akis.scrollHeight; }, 0);
  }
  function mesajImzasi(l) { return l.map(function (m) { return m.id + (m.okundu ? 'o' : m.teslim ? 't' : '') + (m.silindi ? 's' : '') + (m.tepki ? m.tepki.ben + m.tepki.o : ''); }).join(',') + (yaziyor ? 'y' : ''); }
  function yukle(ilk) {
    if (yukleniyor || s.kapandi) return;
    yukleniyor = true;
    yzIste('/v1/dmoku', { kod: kisi.kod }, 15000).then(function (v) {
      if (s.kapandi) return;
      if (dmKisiGecerli(v.kisi)) kisi = Object.assign({}, kisi, v.kisi);
      var yeni = Array.isArray(v.mesajlar) ? v.mesajlar.filter(function (m) { return m && typeof m.metin === 'string' && sayiMi(m.zaman); }) : [];
      var yaziyorDegisti = yaziyor !== !!v.yaziyor; yaziyor = !!v.yaziyor;
      var yeniImza = mesajImzasi(yeni), degisti2 = yeniImza !== imza; imza = yeniImza;
      var durumDegisti = durum !== v.durum || engelledim !== !!v.engelledim || yaziyorDegisti;
      mesajlar = yeni; durum = ['acik', 'istek_gelen', 'istek_giden', 'yok'].indexOf(v.durum) >= 0 ? v.durum : 'yok'; engelledim = !!v.engelledim;
      if (ilk || durumDegisti) ustCiz();
      if (ilk || degisti2) akisCiz(ilk);
    }).catch(function (e) { if (ilk) { temizle(akis); akis.appendChild(h('p', { class: 'alt-yazi', text: dmHataMetni(e) })); } }).then(function () { yukleniyor = false; });
  }
  function yolla() {
    var m = girdi.value.replace(/\s+$/, '').slice(0, 1000);
    if (!m.trim() || gonder.disabled) return;
    gonder.disabled = true;
    var govde = { kod: kisi.kod, metin: m }; if (yanitlanan && yanitlanan.id) govde.yanit = yanitlanan.id;
    yzIste('/v1/dmyaz', govde, 30000).then(function (v) {
      if (v.mesaj && typeof v.mesaj.metin === 'string') { mesajlar.push(v.mesaj); girdi.value = ''; girdi.style.height = ''; yanitAyarla(null); imza = mesajImzasi(mesajlar); }
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
  girdi.addEventListener('input', function () {
    girdi.style.height = 'auto'; girdi.style.height = Math.min(120, girdi.scrollHeight) + 'px';
    /* "yazıyor…": en fazla 3 sn'de bir, yalnız açık sohbette */
    if (durum === 'acik' && girdi.value.trim() && Date.now() - sonYazPing > 3000) { sonYazPing = Date.now(); yzIste('/v1/dmyaziyor', { kod: kisi.kod }, 8000).catch(function () { }); }
  });
  girdi.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); yolla(); } });
  gonder.addEventListener('click', yolla);
  ustCiz(); yukle(true);
  var zaman = setInterval(function () { if (!document.hidden) yukle(false); }, 3000);
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
  else if (ne === 'sabah') setTimeout(sabahAc, 400);
}
window.addEventListener('kbac', function (e) { var d = e && e.detail; if (d && typeof d.ne === 'string') acilacakSayfa(d.ne); });

/* ---------- Yönetici: şikâyet inceleme ---------- */
function sikayetPaneli() {
  var hb = hesapBilgi(); if (!hb || !hb.yonetici) return;
  var gov = h('div', { class: 'profil-duzen' }, h('div', { class: 'g-yukleniyor' }, h('span', { class: 'yukleniyor' })));
  var s = sayfaAc({ tam: true, baslik: t('ykBaslik'), icerik: gov });
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
  bugun: 'Bugün', dun: 'Dün', dmYaziyor: 'yazıyor…', dmSen: 'Sen', dmYanitla: 'Yanıtla', dmKopyala: 'Kopyala', dmKopyalandi: 'Kopyalandı', dmHerkestenSil: 'Herkesten sil', dmHerkestenSilAlt: 'Gönderdikten sonra 2 saat içinde', dmHerkestenSilSor: 'Bu mesaj sohbetteki herkes için silinsin mi?', dmSilSure: 'Bu mesaj artık herkesten silinemez (2 saat geçti).', dmSildin: 'Bu mesajı sildin', dmSilindiMesaj: 'Bu mesaj silindi', dmUlasti: 'Ulaştı', dmGonderildi: 'Gönderildi',
  istekGonderildi: 'İstek gönderildi', istekGonderildiTost: 'Takip isteği gönderildi', istekGeriCekildi: 'Takip isteği geri çekildi', takipEngel: 'Bu kişiyi takip edemezsin.',
  takipIstekleri: 'Takip istekleri', istekOzet: function (ad, n) { return n > 0 ? ad + ' ve ' + n + ' kişi daha' : ad; }, istekYok: 'Bekleyen takip isteği yok.',
  istekAciklama: 'Onayladığın kişiler seni takip eder ve takipçilere özel paylaşımlarını görür.', istekOnayla: 'Onayla', istekSil: 'Sil', istekOnaylandi: 'Artık seni takip ediyor',
  bnKabulMetin: 'takip isteğini kabul etti', bnIstek: function (a) { return a + ' seni takip etmek istiyor'; }, bnKabul: function (a) { return a + ' takip isteğini kabul etti'; },
  istekOnayAyar: 'Takip isteklerini onayla', istekOnayAyarAlt: 'Açıkken seni takip etmek isteyenler önce senin onayını bekler. Kapatırsan herkes doğrudan takip edebilir.',
  hesapAcildi: 'Artık herkes seni doğrudan takip edebilir; bekleyen istekler onaylandı.', hesapGizlendi: 'Yeni takipçiler artık onayını bekleyecek.',
  proYillikBaslik: 'Kombinle PRO, yıllık', planYillik: 'Yıllık', planAylik: 'Aylık', yilBasi: '/yıl', proYilAlt: 'Yılda bir kez ödenir; aylık plana göre belirgin şekilde daha ucuz.', aboneNot: 'Abonelik seçtiğin dönemin sonunda (aylık ya da yıllık) otomatik yenilenir; Play Store > Abonelikler bölümünden istediğin an iptal edebilirsin. "Sınırsız" adil kullanım sınırlarıyla geçerlidir.',
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
  bugun: 'Today', dun: 'Yesterday', dmYaziyor: 'typing…', dmSen: 'You', dmYanitla: 'Reply', dmKopyala: 'Copy', dmKopyalandi: 'Copied', dmHerkestenSil: 'Delete for everyone', dmHerkestenSilAlt: 'Within 2 hours of sending', dmHerkestenSilSor: 'Delete this message for everyone in the chat?', dmSilSure: 'This message can no longer be deleted for everyone (2 hours passed).', dmSildin: 'You deleted this message', dmSilindiMesaj: 'This message was deleted', dmUlasti: 'Delivered', dmGonderildi: 'Sent',
  istekGonderildi: 'Requested', istekGonderildiTost: 'Follow request sent', istekGeriCekildi: 'Follow request withdrawn', takipEngel: "You can't follow this person.",
  takipIstekleri: 'Follow requests', istekOzet: function (ad, n) { return n > 0 ? ad + ' and ' + n + ' others' : ad; }, istekYok: 'No pending follow requests.',
  istekAciklama: 'People you approve can follow you and see your followers-only posts.', istekOnayla: 'Confirm', istekSil: 'Delete', istekOnaylandi: 'Now follows you',
  bnKabulMetin: 'accepted your follow request', bnIstek: function (a) { return a + ' wants to follow you'; }, bnKabul: function (a) { return a + ' accepted your follow request'; },
  istekOnayAyar: 'Approve follow requests', istekOnayAyarAlt: 'When on, people who want to follow you wait for your approval. Turn it off to let anyone follow you directly.',
  hesapAcildi: 'Anyone can now follow you directly; pending requests were approved.', hesapGizlendi: 'New followers will now wait for your approval.',
  proYillikBaslik: 'Kombinle PRO, yearly', planYillik: 'Yearly', planAylik: 'Monthly', yilBasi: '/yr', proYilAlt: 'Billed once a year; noticeably cheaper than monthly.', aboneNot: 'The subscription renews at the end of each period (monthly or yearly); cancel anytime in Play Store > Subscriptions. "Unlimited" is subject to fair-use limits.',
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
  bugun: 'Сегодня', dun: 'Вчера', dmYaziyor: 'печатает…', dmSen: 'Ты', dmYanitla: 'Ответить', dmKopyala: 'Копировать', dmKopyalandi: 'Скопировано', dmHerkestenSil: 'Удалить у всех', dmHerkestenSilAlt: 'В течение 2 часов после отправки', dmHerkestenSilSor: 'Удалить сообщение у всех в чате?', dmSilSure: 'Сообщение уже нельзя удалить у всех (прошло 2 часа).', dmSildin: 'Ты удалил(а) это сообщение', dmSilindiMesaj: 'Сообщение удалено', dmUlasti: 'Доставлено', dmGonderildi: 'Отправлено',
  istekGonderildi: 'Запрос отправлен', istekGonderildiTost: 'Запрос на подписку отправлен', istekGeriCekildi: 'Запрос отозван', takipEngel: 'Нельзя подписаться на этого человека.',
  takipIstekleri: 'Запросы на подписку', istekOzet: function (ad, n) { return n > 0 ? ad + ' и ещё ' + n : ad; }, istekYok: 'Нет запросов на подписку.',
  istekAciklama: 'Одобренные люди смогут подписаться и видеть публикации только для подписчиков.', istekOnayla: 'Подтвердить', istekSil: 'Удалить', istekOnaylandi: 'Теперь подписан(а) на тебя',
  bnKabulMetin: 'принял(а) твой запрос', bnIstek: function (a) { return a + ' хочет подписаться на тебя'; }, bnKabul: function (a) { return a + ' принял(а) твой запрос на подписку'; },
  istekOnayAyar: 'Подтверждать подписки', istekOnayAyarAlt: 'Если включено, желающие подписаться ждут твоего одобрения. Выключи, чтобы подписываться мог любой.',
  hesapAcildi: 'Теперь подписаться может любой; ожидающие запросы одобрены.', hesapGizlendi: 'Новые подписчики будут ждать одобрения.',
  proYillikBaslik: 'Kombinle PRO, на год', planYillik: 'Год', planAylik: 'Месяц', yilBasi: '/год', proYilAlt: 'Оплата раз в год; заметно дешевле помесячной.', aboneNot: 'Подписка продлевается в конце периода (месяц или год); отменить можно в Play Store > Подписки. «Безлимит» действует в рамках честного использования.',
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
  bugun: 'Bugun', dun: 'Kecha', dmYaziyor: 'yozmoqda…', dmSen: 'Siz', dmYanitla: 'Javob berish', dmKopyala: 'Nusxalash', dmKopyalandi: 'Nusxalandi', dmHerkestenSil: "Hammadan o'chirish", dmHerkestenSilAlt: "Yuborilgandan keyin 2 soat ichida", dmHerkestenSilSor: "Xabar suhbatdagi hamma uchun o'chirilsinmi?", dmSilSure: "Bu xabarni endi hammadan o'chirib bo'lmaydi (2 soat o'tdi).", dmSildin: "Bu xabarni o'chirdingiz", dmSilindiMesaj: "Bu xabar o'chirildi", dmUlasti: 'Yetkazildi', dmGonderildi: 'Yuborildi',
  istekGonderildi: "So'rov yuborildi", istekGonderildiTost: "Kuzatish so'rovi yuborildi", istekGeriCekildi: "So'rov bekor qilindi", takipEngel: "Bu odamni kuzata olmaysiz.",
  takipIstekleri: "Kuzatish so'rovlari", istekOzet: function (ad, n) { return n > 0 ? ad + ' va yana ' + n + ' kishi' : ad; }, istekYok: "Kutilayotgan so'rov yo'q.",
  istekAciklama: "Tasdiqlaganlaringiz sizni kuzatadi va faqat kuzatuvchilar uchun ulashishlarni ko'radi.", istekOnayla: 'Tasdiqlash', istekSil: "O'chirish", istekOnaylandi: 'Endi sizni kuzatmoqda',
  bnKabulMetin: "so'rovingizni qabul qildi", bnIstek: function (a) { return a + ' sizni kuzatmoqchi'; }, bnKabul: function (a) { return a + " kuzatish so'rovingizni qabul qildi"; },
  istekOnayAyar: "Kuzatish so'rovlarini tasdiqlash", istekOnayAyarAlt: "Yoqilganda kuzatmoqchi bo'lganlar tasdiqingizni kutadi. O'chirsangiz, hamma to'g'ridan-to'g'ri kuzata oladi.",
  hesapAcildi: "Endi hamma to'g'ridan-to'g'ri kuzata oladi; kutilayotgan so'rovlar tasdiqlandi.", hesapGizlendi: 'Yangi kuzatuvchilar endi tasdiqingizni kutadi.',
  proYillikBaslik: 'Kombinle PRO, yillik', planYillik: 'Yillik', planAylik: 'Oylik', yilBasi: '/yil', proYilAlt: "Yiliga bir marta to'lanadi; oylikdan sezilarli arzon.", aboneNot: "Obuna davr oxirida (oylik yoki yillik) avtomatik yangilanadi; Play Store > Obunalar bo'limida istalgan payt bekor qilish mumkin. «Cheksiz» adolatli foydalanish chegaralari bilan.",
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
