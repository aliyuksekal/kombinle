/* ---------- Tutunma: başlangıç görevleri, geri bildirim, Play puanı, hata raporları ----------
   Başlangıç görevleri ilk günlerde uygulamanın değerini adım adım gösterir; hepsi bitince 10 jeton hediye.
   Puanlama penceresi yalnız mutlu anlardan sonra (kombin favoriye eklendi, 5 puanlık geri bildirim) ve
   en erken kurulumdan 2 gün sonra, 60 günde en fazla bir kez istenir. */

function uygulamaSurumu() { try { return YEREL && YEREL.surum ? kirp(String(YEREL.surum()), 20) : String(SURUM); } catch (e) { return ''; } }

/* ---------- Başlangıç görevleri ---------- */
var BASLANGIC_ODUL = 10;
function baslangicGorevleri() {
  var gercek = S.parcalar.filter(function (p) { return !p.ornek; }).length;
  var bildirimAcik = true;
  try { bildirimAcik = !(YEREL && typeof YEREL.bildirimDurum === 'function') || !!YEREL.bildirimDurum(); } catch (e) { }
  var l = [
    { id: 'parca', ad: t('bgParca', Math.min(gercek, 3)), tamam: gercek >= 3, ac: ekleMenusu },
    { id: 'kombin', ad: t('bgKombin'), tamam: (LS.al('kombinSay', 0) | 0) >= 1 || gecmisAl().length > 0, ac: function () { S.sekme = 'bugun'; ciz(); var b = $('#onerBtn'); if (b) b.scrollIntoView({ behavior: 'smooth', block: 'center' }); } },
    { id: 'favori', ad: t('bgFavori'), tamam: gecmisAl().some(function (g) { return g.fav; }), ac: function () { var a = $('#sonucAlani'); if (a && a.firstChild) a.scrollIntoView({ behavior: 'smooth', block: 'start' }); else tost(t('bgFavoriIpucu')); } }
  ];
  if (YEREL && typeof YEREL.sabahAyarla === 'function') l.push({ id: 'sabah', ad: t('bgSabah'), tamam: sabahAyar().acik && bildirimAcik, ac: function () { var y = sabahAyar(); y.acik = true; sabahAyarYaz(y); bildirimIzniIste(); tost(t('sbKaydedildi', y.saat)); setTimeout(ciz, 600); } });
  if (widgetEklenebilir()) l.push({ id: 'widget', ad: t('bgWidget'), tamam: widgetVar(), ac: function () { widgetEkle(); setTimeout(ciz, 5000); } });
  if (yzKurulu()) l.push({ id: 'davet', ad: t('bgDavet'), tamam: !!LS.al('davetEtti', false), ac: function () { LS.yaz('davetEtti', true); davetEt(); setTimeout(ciz, 800); } });
  return l;
}
function baslangicKarti() {
  var d = LS.al('baslangic', null) || {};
  if (d.bitti || d.gizli) return null;
  if (!A.karsilandi) return null;
  var l = baslangicGorevleri(), biten = l.filter(function (x) { return x.tamam; }).length;
  if (biten === l.length) {
    if (!d.odul) { jetonEkle(BASLANGIC_ODUL); d.odul = true; tost(t('bgOdulVerildi', BASLANGIC_ODUL)); }
    d.bitti = true; LS.yaz('baslangic', d);
    return null;
  }
  var kart = h('div', { class: 'bg-kart' },
    h('div', { class: 'bg-bas' },
      h('div', null, h('b', { text: t('bgBaslik') }), h('small', { text: t('bgAlt', BASLANGIC_ODUL) })),
      h('span', { class: 'bg-sayac', text: biten + ' / ' + l.length }),
      h('button', { class: 'ikon-btn bg-gizle', 'aria-label': t('bgGizle'), on: { click: function () { d.gizli = true; LS.yaz('baslangic', d); kart.remove(); } } }, ikon('kapat', 'k'))),
    h('div', { class: 'hd-cubuk' }, h('i', { style: { width: Math.round(100 * biten / l.length) + '%' } })));
  l.forEach(function (x) {
    kart.appendChild(h('button', { class: 'bg-gorev' + (x.tamam ? ' tamam' : ''), disabled: x.tamam ? true : null, on: { click: x.ac } },
      h('span', { class: 'bg-isaret' }, x.tamam ? ikon('tik', 'k') : null), h('span', { text: x.ad }), x.tamam ? null : ikon('sag', 'k')));
  });
  return kart;
}

/* ---------- Play puanı ---------- */
function puanIsteUygunMu() {
  var d = LS.al('puan', null) || {};
  var ilk = LS.al('ilkAcilis', 0) | 0;
  if (!ilk) { LS.yaz('ilkAcilis', Date.now()); return false; }
  if (Date.now() - ilk < 2 * 86400000) return false;
  if (d.son && Date.now() - d.son < 60 * 86400000) return false;
  return !!(YEREL && typeof YEREL.puanIste === 'function');
}
function puanIste(zorla) {
  if (!zorla && !puanIsteUygunMu()) return;
  var d = LS.al('puan', null) || {};
  d.son = Date.now(); d.sayi = (d.sayi | 0) + 1; LS.yaz('puan', d);
  setTimeout(function () { yerelCagir('puanIste', [], 120000).catch(function () { }); }, 1200);
}

/* ---------- Geri bildirim ---------- */
function geriBildirimSayfasi(ekran) {
  if (!yzKurulu()) { tost(t('yzKapali')); return; }
  var puan = 0;
  var yildizlar = h('div', { class: 'gb-yildiz', role: 'radiogroup', 'aria-label': t('gbPuan') });
  function yildizCiz() {
    temizle(yildizlar);
    [1, 2, 3, 4, 5].forEach(function (n) {
      yildizlar.appendChild(h('button', { role: 'radio', 'aria-checked': puan === n ? 'true' : 'false', 'aria-label': t('gbYildiz', n), class: n <= puan ? 'dolu' : '', text: '★',
        on: { click: function () { puan = n; yildizCiz(); } } }));
    });
  }
  yildizCiz();
  var metin = h('textarea', { class: 'metin gb-metin', maxlength: '1000', rows: '5', placeholder: t('gbYer'), 'aria-label': t('gbMetin') });
  var eposta = girisli() ? null : h('input', { class: 'metin', type: 'email', maxlength: '254', placeholder: t('gbEpostaYer'), 'aria-label': t('gbEposta') });
  var gonder = h('button', { class: 'btn ana' }, ikon('gonder', 'k'), t('gbGonder'));
  var s = sayfaAc({ baslik: t('gbBaslik'), icerik: h('div', { class: 'profil-duzen' },
    h('p', { class: 'alt-yazi', text: t('gbMetinAlt') }), h('span', { class: 'g-bolum-etk', text: t('gbPuan') }), yildizlar,
    h('label', { class: 'hesap-alan' }, h('span', { text: t('gbMetin') }), metin),
    eposta ? h('label', { class: 'hesap-alan' }, h('span', { text: t('gbEposta') }), eposta) : null,
    h('p', { class: 'ayar-not', text: t('gbNot') })), altBar: gonder });
  gonder.addEventListener('click', function () {
    var m = kirp(metin.value, 1000);
    if (m.length < 3 && !puan) { tost(t('gbBos')); metin.focus(); return; }
    gonder.disabled = true;
    yzIste('/v1/geribildir', { metin: m, puan: puan, surum: uygulamaSurumu(), dil: A.dil, ekran: ekran || S.sekme || '', eposta: eposta ? (eposta.value || '').trim() : '' }, 20000).then(function () {
      s.kapat(); tost(t('gbTesekkur'));
      if (puan >= 4) setTimeout(function () { puanIste(true); }, 600);
    }).catch(function (e) { tost(hesapHataMetni(e)); }).then(function () { gonder.disabled = false; });
  });
}

/* ---------- Hata raporları (yalnız hata metni ve yeri; kişisel veri yok) ---------- */
var HATA_KUYRUK = {}, HATA_GONDERILEN = 0, HATA_ZAMAN = null;
function hataKaydet(e) {
  try {
    var m = e && e.message ? String(e.name ? e.name + ': ' + e.message : e.message) : String(e || '');
    if (!m || /ResizeObserver loop|Script error\.?$/i.test(m)) return;
    var y = '';
    if (e && e.stack) { var sat = String(e.stack).split('\n').map(function (x) { return x.trim(); }).filter(function (x) { return /^at /.test(x); })[0] || ''; y = sat.replace(/^at /, '').replace(/\(?(file|https?):\/\/[^)]*\/([^/:)]+)(:\d+:\d+)?\)?/, '$2$3'); }
    var k = m.slice(0, 300) + '|' + y.slice(0, 200);
    HATA_KUYRUK[k] = (HATA_KUYRUK[k] || 0) + 1;
    if (!HATA_ZAMAN) HATA_ZAMAN = setTimeout(hataGonder, 15000);
  } catch (x) { }
}
function hataGonder() {
  HATA_ZAMAN = null;
  var anahtarlar = Object.keys(HATA_KUYRUK);
  if (!anahtarlar.length || HATA_GONDERILEN >= 5 || !yzKurulu()) { HATA_KUYRUK = {}; return; }
  HATA_GONDERILEN++;
  var liste = anahtarlar.slice(0, 10).map(function (k) { var p = k.split('|'); return { m: p[0], y: p.slice(1).join('|'), n: HATA_KUYRUK[k] }; });
  HATA_KUYRUK = {};
  yzIste('/v1/hata', { surum: uygulamaSurumu(), liste: liste }, 15000).catch(function () { });
}

/* ---------- @admin: geri bildirimler ve hatalar ---------- */
function geriBildirimYonetimi() {
  var hb = hesapBilgi(); if (!hb || !hb.yonetici) return;
  var gov = h('div', { class: 'profil-duzen' }, h('div', { class: 'g-yukleniyor' }, h('span', { class: 'yukleniyor' })));
  sayfaAc({ tam: true, baslik: t('gbYonetim'), icerik: gov });
  function yukle(govde) {
    yzIste('/v1/gbliste', govde || {}, 20000).then(function (v) {
      temizle(gov);
      gov.appendChild(h('div', { class: 'ol-kutular' },
        h('div', { class: 'ol-kutu' }, h('small', { text: t('gbToplam') }), h('b', { text: sayiYaz(v.toplam | 0) })),
        h('div', { class: 'ol-kutu' }, h('small', { text: t('gbOrtalama') }), h('b', { text: sayiMi(v.ortalama) ? '★ ' + v.ortalama : '—' }))));
      var l = Array.isArray(v.liste) ? v.liste : [];
      if (!l.length) gov.appendChild(h('div', { class: 'g-bos-not' }, h('span', { text: t('gbYok') })));
      l.forEach(function (x) {
        gov.appendChild(h('div', { class: 'rv-kart gb-kart' },
          h('div', { class: 'gb-ust' }, h('b', { text: x.puan ? '★'.repeat(x.puan) + '☆'.repeat(5 - x.puan) : t('gbPuansiz') }),
            h('small', { text: new Date(x.zaman).toLocaleString(A.dil === 'tr' ? 'tr-TR' : undefined) + (x.surum ? ' • ' + kirp(x.surum, 20) : '') + (x.ekran ? ' • ' + kirp(x.ekran, 40) : '') })),
          x.metin ? h('p', { class: 'rv-metin', text: kirp(x.metin, 1000) }) : null,
          (x.kim || x.eposta) ? h('small', { class: 'rv-ist', text: [kirp(x.kim, 60), kirp(x.eposta, 254)].filter(Boolean).join(' • ') }) : null,
          h('button', { class: 'g-btn-cizgi kucuk', text: t('sil'), on: { click: function () { yukle({ sil: x.id }); } } })));
      });
    }).catch(function (e) { temizle(gov); gov.appendChild(h('p', { class: 'alt-yazi', text: hesapHataMetni(e) })); });
  }
  yukle();
}
function hataYonetimi() {
  var hb = hesapBilgi(); if (!hb || !hb.yonetici) return;
  var gov = h('div', { class: 'profil-duzen' }, h('div', { class: 'g-yukleniyor' }, h('span', { class: 'yukleniyor' })));
  sayfaAc({ tam: true, baslik: t('hyBaslik'), icerik: gov });
  function yukle(govde) {
    yzIste('/v1/hataliste', govde || {}, 20000).then(function (v) {
      temizle(gov);
      gov.appendChild(h('p', { class: 'alt-yazi', text: t('hyMetin') }));
      var l = Array.isArray(v.liste) ? v.liste : [];
      if (!l.length) { gov.appendChild(h('div', { class: 'g-bos-not' }, ikon('tik', 'k'), h('span', { text: t('hyYok') }))); return; }
      l.forEach(function (x) {
        gov.appendChild(h('div', { class: 'rv-kart' }, h('b', { class: 'hy-mesaj', text: kirp(x.mesaj, 300) }),
          h('small', { class: 'rv-ist', text: (x.yer ? kirp(x.yer, 200) + ' • ' : '') + t('hySayi', x.sayi | 0) + ' • ' + kirp(x.surum || '', 20) + ' • ' + new Date(x.son).toLocaleString(A.dil === 'tr' ? 'tr-TR' : undefined) })));
      });
      gov.appendChild(h('button', { class: 'g-btn-cizgi', style: { width: '100%' }, text: t('hyTemizle'), on: { click: function () { yukle({ temizle: true }); } } }));
    }).catch(function (e) { temizle(gov); gov.appendChild(h('p', { class: 'alt-yazi', text: hesapHataMetni(e) })); });
  }
  yukle();
}

/* @admin: seçilen tarihten ÖNCE kayıt olan hesapları toplu siler (@admin ve kendi hesabın hariç) */
function topluSilKutusu() {
  var tarih = h('input', { class: 'metin', type: 'number', inputmode: 'numeric', min: '1', max: '3650', value: '1', 'aria-label': t('kuTopluTarih') });
  var sonuc = h('p', { class: 'alt-yazi', 'aria-live': 'polite' });
  var dugme = h('button', { class: 'g-btn-cizgi', style: { width: '100%' }, text: t('kuTopluSil') });
  function dongu(oncesi, toplam) {
    yzIste('/v1/yonsil', { oncesi: oncesi }, 60000).then(function (v) {
      toplam += v.silinen | 0;
      sonuc.textContent = t('kuTopluIlerle', toplam);
      if ((v.kalan | 0) > 0 && (v.silinen | 0) > 0) { dongu(oncesi, toplam); return; }
      dugme.disabled = false; tost(t('kuTopluBitti', toplam));
    }).catch(function (e) { dugme.disabled = false; sonuc.textContent = hesapHataMetni(e); });
  }
  dugme.addEventListener('click', function () {
    var gun = parseInt(tarih.value, 10);
    if (!(gun >= 1 && gun <= 3650)) { tost(t('kuTopluTarihYok')); tarih.focus(); return; }
    var oncesi = Date.now() - gun * 86400000;
    dugme.disabled = true; sonuc.textContent = '';
    yzIste('/v1/yonsil', { oncesi: oncesi, say: true }, 30000).then(function (v) {
      var n = v.sayi | 0;
      if (!n) { dugme.disabled = false; sonuc.textContent = t('kuTopluYok'); return; }
      dugme.disabled = false;
      onayIste(t('kuTopluSor', n, gun), function () { dugme.disabled = true; dongu(oncesi, 0); });
    }).catch(function (e) { dugme.disabled = false; sonuc.textContent = hesapHataMetni(e); });
  });
  return h('div', { class: 'profil-duzen', style: { 'margin-top': '18px' } },
    h('b', { text: t('kuTopluBaslik') }), h('p', { class: 'alt-yazi', text: t('kuTopluMetin') }), tarih, dugme, sonuc);
}

/* ---------- @admin: kayıtlı kullanıcılar (liste + arama) ---------- */
function kullaniciYonetimi() {
  var hb = hesapBilgi(); if (!hb || !hb.yonetici) return;
  var sayfa = 0, ara = '', zamanlayici = 0, istekNo = 0;
  var arama = h('input', { class: 'metin', type: 'search', maxlength: '80', autocapitalize: 'none', autocomplete: 'off', spellcheck: 'false', placeholder: t('kuAraYer'), 'aria-label': t('kuAra') });
  var ozet = h('p', { class: 'alt-yazi', 'aria-live': 'polite' });
  var liste = h('div', { class: 'ayar-grup' });
  var daha = h('button', { class: 'g-btn-cizgi', style: { width: '100%', display: 'none' }, text: t('kuDaha') });
  var proYazi = function (pro) { return pro === -1 ? t('proSuresiz') : pro > 0 ? t('proBitis', tarihYaz(pro)) : ''; };
  function yukle(ekle) {
    var no = ++istekNo;
    if (!ekle) { temizle(liste); liste.appendChild(h('p', { class: 'alt-yazi', style: { padding: '12px' } }, h('span', { class: 'yukleniyor' }))); }
    daha.disabled = true;
    yzIste('/v1/hesaplar', { ara: ara, sayfa: sayfa }, 20000).then(function (v) {
      if (no !== istekNo) return;
      if (!ekle) temizle(liste);
      var l = Array.isArray(v.liste) ? v.liste : [];
      ozet.textContent = t('kuToplam', sayiYaz(v.toplam | 0));
      if (!l.length && !ekle) liste.appendChild(h('p', { class: 'alt-yazi', style: { padding: '12px' }, text: t('kuYok') }));
      l.forEach(function (x) {
        if (!x || typeof x.ad !== 'string') return;
        var pro = proYazi(sayiMi(x.pro) ? x.pro : 0);
        var sil = x.kadi === 'admin' || !/^[a-f0-9]{32}$/.test(x.id || '') ? null : h('button', { class: 'g-btn-cizgi kucuk', text: t('kuSil'), on: { click: function () {
          onayIste(t('kuSilSor', kirp(x.ad, 40)), function () {
            yzIste('/v1/yonsil', { id: x.id }, 30000).then(function () { tost(t('kuSilindi')); sayfa = 0; yukle(false); }).catch(function (e) { tost(hesapHataMetni(e)); });
          });
        } } });
        liste.appendChild(h('div', { class: 'satir', style: { cursor: 'default' } },
          h('span', { class: 'sol' }, ikon('kisi'), h('div', null, kirp(x.ad, 40) + (x.kadi ? ' · @' + kirp(x.kadi, 20) : ''),
            h('small', { text: kirp(x.eposta || '', 80) + ' · ' + t('kuKayit', new Date(x.zaman).toLocaleDateString(A.dil === 'tr' ? 'tr-TR' : undefined)) + (pro ? ' · ' + pro : '') }))), sil));
      });
      daha.style.display = v.son ? 'none' : '';
      daha.disabled = false;
    }).catch(function (e) {
      if (no !== istekNo) return;
      if (!ekle) temizle(liste);
      liste.appendChild(h('p', { class: 'alt-yazi', style: { padding: '12px' }, text: hesapHataMetni(e) + ' [' + kirp(String(e && e.message || '?'), 40) + ']' }));
      daha.disabled = false;
    });
  }
  arama.addEventListener('input', function () {
    clearTimeout(zamanlayici);
    zamanlayici = setTimeout(function () { ara = kirp(arama.value.trim(), 80); sayfa = 0; yukle(false); }, 350);
  });
  daha.addEventListener('click', function () { sayfa++; yukle(true); });
  sayfaAc({ tam: true, baslik: t('kuBaslik'), icerik: h('div', { class: 'profil-duzen' },
    h('p', { class: 'alt-yazi', text: t('kuMetin') }),
    h('label', { class: 'hesap-alan' }, h('span', { text: t('kuAra') }), arama),
    ozet, liste, daha, topluSilKutusu()) });
  yukle(false);
}

Object.assign(DIL.tr, {
  bgBaslik: 'Kombinle\'yi tanı', bgAlt: function (n) { return 'Hepsini bitirince ' + n + ' jeton hediye'; }, bgGizle: 'Gizle',
  bgParca: function (n) { return 'Dolabına 3 kıyafet ekle (' + n + '/3)'; }, bgKombin: 'İlk kombin önerini al', bgFavori: 'Beğendiğin bir kombini kaydet',
  bgFavoriIpucu: 'Önce bir kombin önerisi al, sonra "Gardıroba ekle"ye dokun.', bgSabah: 'Sabah kombin bildirimini aç', bgWidget: 'Ana ekrana widget ekle',
  bgDavet: 'Bir arkadaşını davet et', bgOdulVerildi: function (n) { return 'Tebrikler! ' + n + ' jeton hediye 🎁'; },
  gbBaslik: 'Görüş ve öneri', gbAyar: 'Görüş ve öneri gönder', gbAyarAlt: 'Ne eksik, ne hoşuna gitti? Hepsini okuyorum',
  gbMetinAlt: 'Kombinle\'yi seninle birlikte geliştiriyoruz. Bir hata gördüysen ya da bir fikrin varsa yaz.', gbPuan: 'Kombinle\'ye kaç puan verirsin?',
  gbYildiz: function (n) { return n + ' yıldız'; }, gbMetin: 'Mesajın', gbYer: 'ör. Sabah bildirimi geç geliyor; şu özellik olsa harika olurdu…',
  gbEposta: 'E-posta (isteğe bağlı, sana dönebilmem için)', gbEpostaYer: 'ornek@eposta.com', gbGonder: 'Gönder', gbBos: 'Bir puan seç ya da birkaç kelime yaz.',
  gbNot: 'Mesajınla birlikte yalnız uygulama sürümü ve dil gider.', gbTesekkur: 'Teşekkürler, mesajın ulaştı 💜',
  gbYonetim: 'Geri bildirimler', gbYonetimAc: 'Geri bildirimleri oku', gbToplam: 'Toplam', gbOrtalama: 'Ortalama puan', gbYok: 'Henüz geri bildirim yok.', gbPuansiz: 'Puansız',
  hyBaslik: 'Uygulama hataları', hyAc: 'Uygulama hatalarını gör', hyMetin: 'Kullanıcıların telefonunda oluşan sayfa hataları (aynı hata tek satırda sayılır). En son görülen en üstte.',
  hyYok: 'Kayıtlı hata yok.', hySayi: function (n) { return n + ' kez'; }, hyTemizle: 'Listeyi temizle', ykGeri: 'Geri bildirim ve hatalar'
});
Object.assign(DIL.en, {
  bgBaslik: 'Get to know Kombinle', bgAlt: function (n) { return 'Finish them all for ' + n + ' free credits'; }, bgGizle: 'Hide',
  bgParca: function (n) { return 'Add 3 items to your wardrobe (' + n + '/3)'; }, bgKombin: 'Get your first outfit idea', bgFavori: 'Save an outfit you like',
  bgFavoriIpucu: 'Get an outfit idea first, then tap "Add to wardrobe".', bgSabah: 'Turn on the morning outfit notification', bgWidget: 'Add the widget to your home screen',
  bgDavet: 'Invite a friend', bgOdulVerildi: function (n) { return 'Well done! ' + n + ' free credits 🎁'; },
  gbBaslik: 'Feedback', gbAyar: 'Send feedback', gbAyarAlt: "What's missing, what do you love? I read everything",
  gbMetinAlt: "We're building Kombinle together with you. If you saw a bug or have an idea, write it here.", gbPuan: 'How would you rate Kombinle?',
  gbYildiz: function (n) { return n + ' stars'; }, gbMetin: 'Your message', gbYer: 'e.g. The morning notification comes late; this feature would be great…',
  gbEposta: 'Email (optional, so I can reply)', gbEpostaYer: 'you@example.com', gbGonder: 'Send', gbBos: 'Pick a rating or write a few words.',
  gbNot: 'Only the app version and language are sent with your message.', gbTesekkur: 'Thank you, your message arrived 💜',
  gbYonetim: 'Feedback', gbYonetimAc: 'Read feedback', gbToplam: 'Total', gbOrtalama: 'Average rating', gbYok: 'No feedback yet.', gbPuansiz: 'No rating',
  hyBaslik: 'App errors', hyAc: 'See app errors', hyMetin: "Page errors from users' phones (the same error is counted on one line). Most recent first.",
  hyYok: 'No errors recorded.', hySayi: function (n) { return n + ' times'; }, hyTemizle: 'Clear the list', ykGeri: 'Feedback and errors'
});
Object.assign(DIL.ru, {
  bgBaslik: 'Знакомство с Kombinle', bgAlt: function (n) { return 'Выполни всё — ' + n + ' жетонов в подарок'; }, bgGizle: 'Скрыть',
  bgParca: function (n) { return 'Добавь 3 вещи в гардероб (' + n + '/3)'; }, bgKombin: 'Получи первый образ', bgFavori: 'Сохрани понравившийся образ',
  bgFavoriIpucu: 'Сначала получи образ, затем нажми «В гардероб».', bgSabah: 'Включи утреннее уведомление', bgWidget: 'Добавь виджет на экран', bgDavet: 'Пригласи подругу',
  bgOdulVerildi: function (n) { return 'Отлично! ' + n + ' жетонов в подарок 🎁'; },
  gbBaslik: 'Отзыв', gbAyar: 'Отправить отзыв', gbAyarAlt: 'Чего не хватает, что понравилось? Я читаю всё',
  gbMetinAlt: 'Мы развиваем Kombinle вместе с тобой. Нашла ошибку или есть идея — напиши.', gbPuan: 'Как ты оценишь Kombinle?',
  gbYildiz: function (n) { return 'звёзд: ' + n; }, gbMetin: 'Сообщение', gbYer: 'например: утреннее уведомление приходит поздно…',
  gbEposta: 'E-mail (необязательно)', gbEpostaYer: 'pochta@primer.com', gbGonder: 'Отправить', gbBos: 'Поставь оценку или напиши пару слов.',
  gbNot: 'Вместе с сообщением отправляются только версия и язык.', gbTesekkur: 'Спасибо, сообщение получено 💜'
});
Object.assign(DIL.uz, {
  bgBaslik: 'Kombinle bilan tanishing', bgAlt: function (n) { return 'Hammasini bajarsangiz ' + n + ' jeton sovg‘a'; }, bgGizle: 'Yashirish',
  bgParca: function (n) { return "Garderobga 3 ta kiyim qo'shing (" + n + '/3)'; }, bgKombin: 'Birinchi obraz taklifini oling', bgFavori: "Yoqqan obrazni saqlang",
  bgFavoriIpucu: "Avval obraz oling, so'ng «Garderobga qo'shish»ni bosing.", bgSabah: 'Ertalabki bildirishnomani yoqing', bgWidget: "Bosh ekranga vidjet qo'shing", bgDavet: "Do'stingizni taklif qiling",
  bgOdulVerildi: function (n) { return 'Barakalla! ' + n + ' jeton sovg‘a 🎁'; },
  gbBaslik: 'Fikr-mulohaza', gbAyar: 'Fikr yuborish', gbAyarAlt: "Nima yetishmaydi, nima yoqdi? Hammasini o'qiyman",
  gbMetinAlt: "Kombinle'ni siz bilan birga rivojlantiramiz. Xato yoki g'oya bo'lsa yozing.", gbPuan: 'Kombinle’ga qancha baho berasiz?',
  gbYildiz: function (n) { return n + ' yulduz'; }, gbMetin: 'Xabaringiz', gbYer: 'masalan: ertalabki bildirishnoma kech keladi…',
  gbEposta: 'E-pochta (ixtiyoriy)', gbEpostaYer: 'misol@pochta.com', gbGonder: 'Yuborish', gbBos: "Baho tanlang yoki bir necha so'z yozing.",
  gbNot: 'Xabar bilan faqat ilova versiyasi va til yuboriladi.', gbTesekkur: 'Rahmat, xabaringiz yetib keldi 💜'
});
Object.assign(DIL.ko, {
  bgBaslik: 'Kombinle 시작하기', bgAlt: function (n) { return '모두 끝내면 이용권 ' + n + '개 선물'; }, bgGizle: '숨기기',
  bgParca: function (n) { return '옷장에 옷 3벌 추가 (' + n + '/3)'; }, bgKombin: '첫 코디 추천 받기', bgFavori: '마음에 드는 코디 저장하기',
  bgFavoriIpucu: '먼저 코디 추천을 받고 "옷장에 추가"를 누르세요.', bgSabah: '아침 코디 알림 켜기', bgWidget: '홈 화면에 위젯 추가', bgDavet: '친구 초대하기',
  bgOdulVerildi: function (n) { return '잘했어요! 이용권 ' + n + '개 선물 🎁'; },
  gbBaslik: '의견 보내기', gbAyar: '의견 보내기', gbAyarAlt: '부족한 점, 좋은 점을 알려 주세요. 모두 읽어요',
  gbMetinAlt: 'Kombinle은 여러분과 함께 만들어 가요. 오류나 아이디어가 있으면 적어 주세요.', gbPuan: 'Kombinle에 몇 점을 주시겠어요?',
  gbYildiz: function (n) { return '별 ' + n + '개'; }, gbMetin: '메시지', gbYer: '예: 아침 알림이 늦게 와요…',
  gbEposta: '이메일(선택, 답장용)', gbEpostaYer: 'you@example.com', gbGonder: '보내기', gbBos: '별점을 고르거나 몇 마디 적어 주세요.',
  gbNot: '메시지와 함께 앱 버전과 언어만 전송돼요.', gbTesekkur: '고마워요, 메시지가 전달됐어요 💜'
});

Object.assign(DIL.tr, {
  kuSil: 'Sil', kuSilSor: function (a) { return a + ' hesabı ve tüm verileri kalıcı olarak silinecek. Bu geri alınamaz.'; }, kuSilindi: 'Hesap silindi', kuTopluBaslik: 'Eski hesapları toplu sil', kuTopluMetin: 'Seçtiğin tarihten önce kayıt olan tüm hesaplar ve verileri silinir. @admin ve kendi hesabın silinmez.', kuTopluTarih: 'Bu tarihten önce', kuTopluSil: 'Önceki hesapları sil', kuTopluTarihYok: 'Geçerli bir tarih seç.', kuTopluYok: 'Bu tarihten önce kayıtlı hesap yok.', kuTopluSor: function (n, d) { return d + ' tarihinden önce kayıt olan ' + n + ' hesap ve tüm verileri kalıcı olarak silinecek. Bu geri alınamaz.'; }, kuTopluIlerle: function (n) { return n + ' hesap silindi…'; }, kuTopluBitti: function (n) { return 'Bitti: ' + n + ' hesap silindi'; },
  kuBaslik: 'Kayıtlı kullanıcılar', kuAc: 'Tüm kullanıcıları gör ve ara', kuBolum: 'Kullanıcılar',
  kuMetin: 'Uygulamaya kayıt olan tüm hesaplar, en yeni üstte. Ad, kullanıcı adı ya da e-postayla arayabilirsin.',
  kuAra: 'Kişi ara', kuAraYer: 'Ad, @kullanıcı adı veya e-posta', kuToplam: function (n) { return 'Toplam ' + n + ' hesap'; },
  kuYok: 'Eşleşen kullanıcı yok.', kuKayit: function (d) { return 'Kayıt: ' + d; }, kuDaha: 'Daha fazla göster'
});
Object.assign(DIL.en, {
  kuSil: 'Delete', kuSilSor: function (a) { return a + ' and all their data will be permanently deleted. This cannot be undone.'; }, kuSilindi: 'Account deleted', kuTopluBaslik: 'Delete old accounts in bulk', kuTopluMetin: 'Every account registered before the chosen date, with its data, is deleted. @admin and your own account are kept.', kuTopluTarih: 'Before this date', kuTopluSil: 'Delete earlier accounts', kuTopluTarihYok: 'Pick a valid date.', kuTopluYok: 'No accounts before this date.', kuTopluSor: function (n, d) { return n + ' accounts registered before ' + d + ' and all their data will be permanently deleted. This cannot be undone.'; }, kuTopluIlerle: function (n) { return n + ' accounts deleted…'; }, kuTopluBitti: function (n) { return 'Done: ' + n + ' accounts deleted'; },
  kuBaslik: 'Registered users', kuAc: 'See and search all users', kuBolum: 'Users',
  kuMetin: 'Every account registered in the app, newest first. Search by name, username or email.',
  kuAra: 'Search people', kuAraYer: 'Name, @username or email', kuToplam: function (n) { return n + ' accounts in total'; },
  kuYok: 'No matching users.', kuKayit: function (d) { return 'Joined: ' + d; }, kuDaha: 'Show more'
});
Object.assign(DIL.ru, {
  kuSil: 'Удалить', kuSilSor: function (a) { return 'Аккаунт ' + a + ' и все его данные будут удалены навсегда. Это нельзя отменить.'; }, kuSilindi: 'Аккаунт удалён', kuTopluBaslik: 'Массовое удаление старых аккаунтов', kuTopluMetin: 'Все аккаунты, созданные до выбранной даты, и их данные удаляются. @admin и твой аккаунт остаются.', kuTopluTarih: 'До этой даты', kuTopluSil: 'Удалить прежние аккаунты', kuTopluTarihYok: 'Выбери корректную дату.', kuTopluYok: 'До этой даты аккаунтов нет.', kuTopluSor: function (n, d) { return 'Аккаунты до ' + d + ' (' + n + ') и все их данные будут удалены навсегда. Это нельзя отменить.'; }, kuTopluIlerle: function (n) { return 'Удалено аккаунтов: ' + n + '…'; }, kuTopluBitti: function (n) { return 'Готово: удалено аккаунтов — ' + n; },
  kuBaslik: 'Зарегистрированные пользователи', kuAc: 'Все пользователи и поиск', kuBolum: 'Пользователи',
  kuMetin: 'Все аккаунты в приложении, новые сверху. Ищи по имени, нику или e-mail.',
  kuAra: 'Поиск людей', kuAraYer: 'Имя, @ник или e-mail', kuToplam: function (n) { return 'Всего аккаунтов: ' + n; },
  kuYok: 'Ничего не найдено.', kuKayit: function (d) { return 'Регистрация: ' + d; }, kuDaha: 'Показать ещё'
});
Object.assign(DIL.uz, {
  kuSil: "O'chirish", kuSilSor: function (a) { return a + ' hisobi va barcha ma\'lumotlari butunlay o\'chiriladi. Buni qaytarib bo\'lmaydi.'; }, kuSilindi: "Hisob o'chirildi", kuTopluBaslik: "Eski hisoblarni birdan o'chirish", kuTopluMetin: "Tanlangan sanadan oldin ro'yxatdan o'tgan barcha hisoblar va ma'lumotlari o'chiriladi. @admin va o'z hisobingiz qoladi.", kuTopluTarih: 'Shu sanadan oldin', kuTopluSil: "Oldingi hisoblarni o'chirish", kuTopluTarihYok: 'To\'g\'ri sana tanlang.', kuTopluYok: 'Bu sanadan oldin hisob yo\'q.', kuTopluSor: function (n, d) { return d + ' sanasidan oldingi ' + n + ' hisob va barcha ma\'lumotlari butunlay o\'chiriladi. Buni qaytarib bo\'lmaydi.'; }, kuTopluIlerle: function (n) { return n + ' hisob o\'chirildi…'; }, kuTopluBitti: function (n) { return 'Tayyor: ' + n + ' hisob o\'chirildi'; },
  kuBaslik: "Ro'yxatdan o'tgan foydalanuvchilar", kuAc: "Barcha foydalanuvchilar va qidiruv", kuBolum: 'Foydalanuvchilar',
  kuMetin: "Ilovadagi barcha hisoblar, yangilari tepada. Ism, nom yoki e-pochta bilan qidiring.",
  kuAra: 'Odam qidirish', kuAraYer: 'Ism, @nom yoki e-pochta', kuToplam: function (n) { return 'Jami hisoblar: ' + n; },
  kuYok: 'Mos foydalanuvchi topilmadi.', kuKayit: function (d) { return "Ro'yxatdan o'tgan: " + d; }, kuDaha: "Yana ko'rsatish"
});
Object.assign(DIL.ko, {
  kuSil: '삭제', kuSilSor: function (a) { return a + ' 계정과 모든 데이터가 영구 삭제돼요. 되돌릴 수 없어요.'; }, kuSilindi: '계정을 삭제했어요', kuTopluBaslik: '이전 계정 일괄 삭제', kuTopluMetin: '선택한 날짜 이전에 가입한 모든 계정과 데이터가 삭제돼요. @admin과 내 계정은 유지돼요.', kuTopluTarih: '이 날짜 이전', kuTopluSil: '이전 계정 삭제', kuTopluTarihYok: '올바른 날짜를 선택하세요.', kuTopluYok: '이 날짜 이전 계정이 없어요.', kuTopluSor: function (n, d) { return d + ' 이전에 가입한 계정 ' + n + '개와 모든 데이터가 영구 삭제돼요. 되돌릴 수 없어요.'; }, kuTopluIlerle: function (n) { return n + '개 계정 삭제됨…'; }, kuTopluBitti: function (n) { return '완료: 계정 ' + n + '개 삭제됨'; },
  kuBaslik: '가입한 사용자', kuAc: '모든 사용자 보기와 검색', kuBolum: '사용자',
  kuMetin: '앱에 가입한 모든 계정이 최신순으로 표시돼요. 이름, 사용자 이름 또는 이메일로 검색하세요.',
  kuAra: '사람 검색', kuAraYer: '이름, @사용자 이름 또는 이메일', kuToplam: function (n) { return '총 ' + n + '개 계정'; },
  kuYok: '일치하는 사용자가 없어요.', kuKayit: function (d) { return '가입일: ' + d; }, kuDaha: '더 보기'
});

Object.assign(DIL.tr, {
  kuTopluMetin: 'Kaç günden eski hesaplar silinsin? Son bu kadar gün içinde kayıt olanlar kalır. @admin ve kendi hesabın silinmez.',
  kuTopluTarih: 'Kaç günden eski hesaplar (gün sayısı)', kuTopluTarihYok: 'Gün sayısını 1 ile 3650 arasında yaz.',
  kuTopluYok: 'Silinecek eski hesap yok.', kuTopluSor: function (n, d) { return 'Son ' + d + ' gün içinde kayıt olanlar hariç ' + n + ' hesap ve tüm verileri kalıcı olarak silinecek. Bu geri alınamaz.'; }
});
Object.assign(DIL.en, {
  kuTopluMetin: 'Delete accounts older than how many days? Accounts registered within that many days are kept. @admin and your own account are kept.',
  kuTopluTarih: 'Older than (number of days)', kuTopluTarihYok: 'Enter a number of days from 1 to 3650.',
  kuTopluYok: 'No old accounts to delete.', kuTopluSor: function (n, d) { return n + ' accounts (except those registered in the last ' + d + ' days) and all their data will be permanently deleted. This cannot be undone.'; }
});
Object.assign(DIL.ru, {
  kuTopluMetin: 'Аккаунты старше скольких дней удалить? Зарегистрированные за это время остаются. @admin и твой аккаунт остаются.',
  kuTopluTarih: 'Старше (число дней)', kuTopluTarihYok: 'Введи число дней от 1 до 3650.',
  kuTopluYok: 'Старых аккаунтов для удаления нет.', kuTopluSor: function (n, d) { return 'Аккаунты (' + n + '), кроме созданных за последние ' + d + ' дн., и все их данные будут удалены навсегда. Это нельзя отменить.'; }
});
Object.assign(DIL.uz, {
  kuTopluMetin: "Necha kundan eski hisoblar o'chirilsin? Shu kun ichida ro'yxatdan o'tganlar qoladi. @admin va o'z hisobingiz qoladi.",
  kuTopluTarih: 'Kundan eski (kunlar soni)', kuTopluTarihYok: "Kunlar sonini 1 dan 3650 gacha yozing.",
  kuTopluYok: "O'chiriladigan eski hisob yo'q.", kuTopluSor: function (n, d) { return "So'nggi " + d + " kun ichida ro'yxatdan o'tganlardan tashqari " + n + " hisob va barcha ma'lumotlari butunlay o'chiriladi. Buni qaytarib bo'lmaydi."; }
});
Object.assign(DIL.ko, {
  kuTopluMetin: '며칠 이전 계정을 삭제할까요? 그 기간 안에 가입한 계정은 유지돼요. @admin과 내 계정은 유지돼요.',
  kuTopluTarih: '기준 일수(일 이전)', kuTopluTarihYok: '1에서 3650 사이의 일수를 입력하세요.',
  kuTopluYok: '삭제할 이전 계정이 없어요.', kuTopluSor: function (n, d) { return '최근 ' + d + '일 이내 가입자를 제외한 계정 ' + n + '개와 모든 데이터가 영구 삭제돼요. 되돌릴 수 없어요.'; }
});
