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
    yzIste('/v1/kisiler', { ara: ara, sayfa: sayfa }, 20000).then(function (v) {
      if (no !== istekNo) return;
      if (!ekle) temizle(liste);
      var l = Array.isArray(v.liste) ? v.liste : [];
      ozet.textContent = t('kuToplam', sayiYaz(v.toplam | 0));
      if (!l.length && !ekle) liste.appendChild(h('p', { class: 'alt-yazi', style: { padding: '12px' }, text: t('kuYok') }));
      l.forEach(function (x) {
        if (!x || typeof x.ad !== 'string') return;
        var pro = proYazi(sayiMi(x.pro) ? x.pro : 0);
        liste.appendChild(h('div', { class: 'satir', style: { cursor: 'default' } },
          h('span', { class: 'sol' }, ikon('kisi'), h('div', null, kirp(x.ad, 40) + (x.kadi ? ' · @' + kirp(x.kadi, 20) : ''),
            h('small', { text: kirp(x.eposta || '', 80) + ' · ' + t('kuKayit', new Date(x.zaman).toLocaleDateString(A.dil === 'tr' ? 'tr-TR' : undefined)) + (pro ? ' · ' + pro : '') })))));
      });
      daha.style.display = v.son ? 'none' : '';
      daha.disabled = false;
    }).catch(function (e) {
      if (no !== istekNo) return;
      if (!ekle) temizle(liste);
      liste.appendChild(h('p', { class: 'alt-yazi', style: { padding: '12px' }, text: hesapHataMetni(e) }));
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
    ozet, liste, daha) });
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
  kuBaslik: 'Kayıtlı kullanıcılar', kuAc: 'Tüm kullanıcıları gör ve ara', kuBolum: 'Kullanıcılar',
  kuMetin: 'Uygulamaya kayıt olan tüm hesaplar, en yeni üstte. Ad, kullanıcı adı ya da e-postayla arayabilirsin.',
  kuAra: 'Kişi ara', kuAraYer: 'Ad, @kullanıcı adı veya e-posta', kuToplam: function (n) { return 'Toplam ' + n + ' hesap'; },
  kuYok: 'Eşleşen kullanıcı yok.', kuKayit: function (d) { return 'Kayıt: ' + d; }, kuDaha: 'Daha fazla göster'
});
Object.assign(DIL.en, {
  kuBaslik: 'Registered users', kuAc: 'See and search all users', kuBolum: 'Users',
  kuMetin: 'Every account registered in the app, newest first. Search by name, username or email.',
  kuAra: 'Search people', kuAraYer: 'Name, @username or email', kuToplam: function (n) { return n + ' accounts in total'; },
  kuYok: 'No matching users.', kuKayit: function (d) { return 'Joined: ' + d; }, kuDaha: 'Show more'
});
Object.assign(DIL.ru, {
  kuBaslik: 'Зарегистрированные пользователи', kuAc: 'Все пользователи и поиск', kuBolum: 'Пользователи',
  kuMetin: 'Все аккаунты в приложении, новые сверху. Ищи по имени, нику или e-mail.',
  kuAra: 'Поиск людей', kuAraYer: 'Имя, @ник или e-mail', kuToplam: function (n) { return 'Всего аккаунтов: ' + n; },
  kuYok: 'Ничего не найдено.', kuKayit: function (d) { return 'Регистрация: ' + d; }, kuDaha: 'Показать ещё'
});
Object.assign(DIL.uz, {
  kuBaslik: "Ro'yxatdan o'tgan foydalanuvchilar", kuAc: "Barcha foydalanuvchilar va qidiruv", kuBolum: 'Foydalanuvchilar',
  kuMetin: "Ilovadagi barcha hisoblar, yangilari tepada. Ism, nom yoki e-pochta bilan qidiring.",
  kuAra: 'Odam qidirish', kuAraYer: 'Ism, @nom yoki e-pochta', kuToplam: function (n) { return 'Jami hisoblar: ' + n; },
  kuYok: 'Mos foydalanuvchi topilmadi.', kuKayit: function (d) { return "Ro'yxatdan o'tgan: " + d; }, kuDaha: "Yana ko'rsatish"
});
Object.assign(DIL.ko, {
  kuBaslik: '가입한 사용자', kuAc: '모든 사용자 보기와 검색', kuBolum: '사용자',
  kuMetin: '앱에 가입한 모든 계정이 최신순으로 표시돼요. 이름, 사용자 이름 또는 이메일로 검색하세요.',
  kuAra: '사람 검색', kuAraYer: '이름, @사용자 이름 또는 이메일', kuToplam: function (n) { return '총 ' + n + '개 계정'; },
  kuYok: '일치하는 사용자가 없어요.', kuKayit: function (d) { return '가입일: ' + d; }, kuDaha: '더 보기'
});
