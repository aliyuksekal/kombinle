/* ---------- Büyüme: kullanım ölçümü, WhatsApp anket bağlantısı, davet, sipariş ekran görüntüsü,
   2 dakikada dolabını doldur, sabah kombin bildirimi ve ana ekran widget'ı ----------
   Ölçüm kişisel veri içermez: günde bir "uygulama açıldı" ve özellik kullanım sayıları gider;
   sunucu telefon kimliğini tek yönlü özetler. */

var PLAY_ADRES = 'https://play.google.com/store/apps/details?id=com.benim.kombinle';

/* ---------- Kullanım ölçümü ---------- */
function olay(ad) {
  try {
    var o = LS.al('olaylar', {}) || {};
    if (typeof o !== 'object') o = {};
    o[ad] = Math.min(500, (o[ad] | 0) + 1);
    LS.yaz('olaylar', o);
  } catch (e) { }
}
var OLCUM_GIDIYOR = false;
function olcumGonder(zorla) {
  if (OLCUM_GIDIYOR || !yzKurulu()) return;
  var bugun = bugunAnahtar(new Date());
  var o = LS.al('olaylar', {}) || {};
  var toplam = Object.keys(o).reduce(function (t, k) { return t + (o[k] | 0); }, 0);
  var son = LS.al('olcumSon', '');
  if (son === bugun && !zorla && toplam < 15) return;
  if (son === bugun && !toplam) return;
  OLCUM_GIDIYOR = true;
  yzIste('/v1/merhaba', { olaylar: o }, 15000).then(function () {
    LS.yaz('olcumSon', bugun);
    var simdi = LS.al('olaylar', {}) || {};
    Object.keys(o).forEach(function (k) { simdi[k] = Math.max(0, (simdi[k] | 0) - (o[k] | 0)); if (!simdi[k]) delete simdi[k]; });
    LS.yaz('olaylar', simdi);
  }).catch(function () { }).then(function () { OLCUM_GIDIYOR = false; });
}
document.addEventListener('visibilitychange', function () { if (document.hidden) { olcumGonder(true); sabahHazirla(); } });

/* @admin: kullanım istatistikleri */
function olcumSayfasi() {
  var hb = hesapBilgi(); if (!hb || !hb.yonetici) return;
  var gov = h('div', { class: 'profil-duzen olcum' }, h('div', { class: 'g-yukleniyor' }, h('span', { class: 'yukleniyor' })));
  sayfaAc({ tam: true, baslik: t('olBaslik'), icerik: gov });
  yzIste('/v1/olcum', {}, 20000).then(function (v) {
    temizle(gov);
    var gunler = Array.isArray(v.gunler) ? v.gunler : [];
    var bugunA = gunler.length ? gunler[gunler.length - 1].aktif : 0;
    gov.appendChild(h('div', { class: 'ol-kutular' },
      h('div', { class: 'ol-kutu' }, h('small', { text: t('olToplam') }), h('b', { text: sayiYaz(v.toplam | 0) })),
      h('div', { class: 'ol-kutu' }, h('small', { text: t('olBugun') }), h('b', { text: sayiYaz(bugunA) })),
      h('div', { class: 'ol-kutu' }, h('small', { text: t('olHafta') }), h('b', { text: sayiYaz(v.haftaOrtalama | 0) }))));
    gov.appendChild(h('span', { class: 'g-bolum-etk', text: t('olDonus') }));
    var donus = h('div', { class: 'ol-kutular' });
    [['d1', 1, 40, 25], ['d7', 7, 20, 10], ['d30', 30, 12, 6]].forEach(function (x) {
      var d = v[x[0]] || {};
      var oran = sayiMi(d.oran) ? d.oran : null;
      var sinif = oran === null ? '' : oran >= x[2] ? ' iyi' : oran >= x[3] ? ' orta' : ' zayif';
      donus.appendChild(h('div', { class: 'ol-kutu' + sinif }, h('small', { text: t('olGun', x[1]) }), h('b', { text: oran === null ? '—' : '%' + oran }),
        h('i', { text: oran === null ? t('olVeriYok') : t('olGrup', d.donen | 0, d.grup | 0) })));
    });
    gov.appendChild(donus);
    gov.appendChild(h('p', { class: 'ayar-not', text: t('olDonusNot') }));
    gov.appendChild(h('span', { class: 'g-bolum-etk', text: t('olGrafik') }));
    var enCok = Math.max(1, Math.max.apply(null, gunler.map(function (g) { return g.aktif | 0; })));
    var grafik = h('div', { class: 'ol-grafik', role: 'img', 'aria-label': t('olGrafik') });
    gunler.forEach(function (g) {
      grafik.appendChild(h('span', { class: 'ol-sutun', title: g.gun + ': ' + g.aktif + ' / +' + g.yeni },
        h('i', { class: 'ol-aktif', style: { height: Math.round(100 * (g.aktif | 0) / enCok) + '%' } }),
        h('i', { class: 'ol-yeni', style: { height: Math.round(100 * (g.yeni | 0) / enCok) + '%' } })));
    });
    gov.appendChild(grafik);
    gov.appendChild(h('p', { class: 'ol-lejant' }, h('i', { class: 'ol-aktif' }), document.createTextNode(t('olAktif') + '  '), h('i', { class: 'ol-yeni' }), document.createTextNode(t('olYeni'))));
    gov.appendChild(h('span', { class: 'g-bolum-etk', text: t('olOlaylar') }));
    var l = Array.isArray(v.olaylar) ? v.olaylar : [];
    if (!l.length) gov.appendChild(h('p', { class: 'alt-yazi', text: t('olVeriYok') }));
    var ol = h('div', { class: 'ayar-grup' });
    l.forEach(function (x) { ol.appendChild(h('div', { class: 'satir' }, h('span', { text: t('olay_' + x.ad) !== 'olay_' + x.ad ? t('olay_' + x.ad) : x.ad }), h('b', { text: sayiYaz(x.n | 0) }))); });
    if (l.length) gov.appendChild(ol);
  }).catch(function (e) { temizle(gov); gov.appendChild(h('p', { class: 'alt-yazi', text: hesapHataMetni(e) })); });
}

/* ---------- Paylaşım: WhatsApp'a ya da paylaşım menüsüne ---------- */
function metinPaylas(metin, hedef) {
  try { if (YEREL && typeof YEREL.metinPaylas === 'function') { YEREL.metinPaylas(metin, hedef || ''); return; } } catch (e) { }
  try { if (navigator.share) { navigator.share({ text: metin }).catch(function () { }); return; } } catch (e) { }
  try { navigator.clipboard.writeText(metin).then(function () { tost(t('kopyalandiPaylas')); }, function () { tost(metin); }); } catch (e) { tost(metin); }
}
/* WhatsApp anket bağlantısı: arkadaşlar uygulama olmadan tarayıcıda oy verir */
function anketPaylas(x) {
  if (!x || !/^[a-z0-9]{20}$/.test(x.id || '')) return;
  if (x.gorunurluk && x.gorunurluk !== 'herkes') { tost(t('akWpHerkes')); return; }
  var adres = sunucuAdres();
  if (!adres) { tost(t('yzKapali')); return; }
  olay('anket_paylas');
  metinPaylas(t('akWpMesaj', kirp(x.soru, 140) || t('akVarsayilan'), adres + '/a/' + x.id), 'whatsapp');
}
function davetEt() {
  olay('davet');
  metinPaylas(t('davetMesaj', PLAY_ADRES), 'whatsapp');
}

/* ---------- Sipariş / sepet ekran görüntüsünden gardıroba ekleme ---------- */
function siparisSec() {
  if (!yzAcik()) { tost(t('spYzGerek')); return; }
  var inp = h('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp', multiple: true, style: { display: 'none' } });
  document.body.appendChild(inp);
  inp.addEventListener('change', function () {
    var l = Array.prototype.slice.call(inp.files || [], 0, 10); inp.remove();
    if (!l.length) return;
    l.forEach(function (f) { f._siparis = true; });
    sirayaIsle(l, 0);
  });
  inp.click();
}
function siparisIsle(liste, i) {
  var f = liste[i];
  var bekleme = sayfaAc({ baslik: t('spOkunuyor'), kilitli: true,
    icerik: h('div', { style: { padding: '24px 0', display: 'flex', 'align-items': 'center', gap: '12px' } }, h('span', { class: 'yukleniyor' }), h('span', { text: liste.length > 1 ? t('fotoSira', i + 1, liste.length) : t('spOkunuyorAlt') })) });
  var buyuk = null;
  var devam = function () { setTimeout(function () { sirayaIsle(liste, i + 1); }, 350); };
  if (f.size > EN_BUYUK_DOSYA) { bekleme.kapat(); tost(t('dosyaBuyuk')); devam(); return; }
  resimCoz(f).then(function (bmp) {
    var c = tuvaleCiz(bmp, 1400); buyuk = tuvaleCiz(bmp, 1024); bmpKapat(bmp);
    var d = c.toDataURL('image/jpeg', 0.85);
    return yzIste('/v1/siparis', { resim: d.slice(d.indexOf(',') + 1), dil: A.dil }, 60000);
  }).then(function (v) {
    var urunler = Array.isArray(v.urunler) ? v.urunler.filter(function (u) { return u && kutuGecerli(u.kutu); }).slice(0, 12) : [];
    if (!urunler.length) { bekleme.kapat(); tost(v.alisveris === false ? t('spAlisverisDegil') : t('spBulunamadi')); devam(); return; }
    olay('siparis');
    return tuvaldenBlob(buyuk, 0.86).then(function (blob) {
      bekleme.kapat();
      var sonuc = { buyuk: blob, kaynak: f, analiz: { bulut: true, siparis: true, parcalar: urunler.map(function (u) { return { ad: kirp(u.ad, 40) || grupAd(u.kategori), kategori: u.kategori, kutu: kutuGecerli(u.kutu) }; }) } };
      setTimeout(function () { parcaSecici(sonuc, liste, i); }, 320);
    });
  }).catch(function (e) {
    bekleme.kapat();
    tost(yzHataMetni(e, t('spHata')));
    devam();
  });
}

/* ---------- 2 dakikada dolabını doldur ---------- */
function hizliDoldurKarti(say) {
  var adim = function (ik, baslik, alt, fn) {
    return h('button', { class: 'hd-adim', on: { click: fn } }, h('span', { class: 'hd-ikon' }, ikon(ik)), h('span', null, h('b', { text: baslik }), h('small', { text: alt })));
  };
  return h('div', { class: 'hd-kart' },
    h('div', { class: 'hd-bas' }, h('b', { text: t('hdBaslik') }), h('span', { class: 'hd-sayac', text: t('hdSayac', Math.min(say, 15)) })),
    h('div', { class: 'hd-cubuk' }, h('i', { style: { width: Math.round(100 * Math.min(say, 15) / 15) + '%' } })),
    adim('kamera', t('hdAyna'), t('hdAynaAlt'), function () { kameraAc({ mod: 'boydan', modlar: ['boydan', 'kiyafet'] }); }),
    adim('marka', t('hdSiparis'), t('hdSiparisAlt'), siparisSec),
    adim('galeri', t('hdGaleri'), t('hdGaleriAlt'), function () { $('#dosyaSec').click(); }));
}

/* ---------- Sabah kombin bildirimi ve widget ---------- */
function sabahAyar() {
  var s = LS.al('sabah', null) || {};
  return { acik: s.acik !== false, saat: /^([01]\d|2[0-3]):[0-5]\d$/.test(s.saat || '') ? s.saat : '07:30' };
}
function sabahAyarYaz(a) { LS.yaz('sabah', a); sabahHazirla(true); }
var SABAH_SON = 0;
function sabahHazirla(zorla) {
  if (!YEREL || typeof YEREL.sabahAyarla !== 'function') return;
  if (!zorla && Date.now() - SABAH_SON < 60000) return;
  SABAH_SON = Date.now();
  var ayar = sabahAyar();
  var temel = { acik: ayar.acik, saat: ayar.saat, havaSablon: t('sbHavaSablon'), yagmurEk: t('sbYagmurEk'), bosBaslik: t('sbBosBaslik'), bosMetin: t('sbBosMetin'),
    widgetBosBaslik: t('sbWidgetBosBaslik'), widgetBosMetin: t('sbWidgetBosMetin') };
  if (S.hava && S.hava.yer && sayiMi(S.hava.yer.lat)) { temel.lat = S.hava.yer.lat; temel.lon = S.hava.yer.lon; }
  var gonder = function (o) { try { YEREL.sabahAyarla(JSON.stringify(Object.assign(temel, o || {}))); } catch (e) { } };
  var gercek = S.parcalar.filter(function (p) { return !p.ornek; });
  if (!ayar.acik || gercek.length < 3 || !S.hava || S.hava.durum !== 'tamam' || !S.hava.kayit) { gonder({ tarih: '', resim: '' }); return; }
  var su = new Date(), parca = ayar.saat.split(':');
  var hedef = new Date(); hedef.setHours(+parca[0], +parca[1], 0, 0);
  // bildirim saati geçtiyse yarın için hazırlanır
  var gun = su.getTime() < hedef.getTime() ? 0 : 1;
  var hv = null;
  try { hv = gunOzeti(S.hava.kayit, gun, { bas: 8, son: 21 }); } catch (e) { hv = null; }
  if (!hv) { gonder({ tarih: '', resim: '' }); return; }
  var ortam = (function () { var g = new Date(su.getTime() + gun * 86400000).getDay(); return g === 0 || g === 6 ? 'gunluk' : (ORTAMLAR.is && LS.al('sabahOrtam', '') === 'is' ? 'is' : 'gunluk'); })();
  var c = baglamKur(ortam, hv, {});
  var sonuc;
  try { sonuc = kombinOner(oneriParcalari().filter(function (p) { return !p.ornek; }), c); } catch (e) { sonuc = null; }
  var k = sonuc && sonuc.kombinler && sonuc.kombinler[0];
  if (!k) { gonder({ tarih: '', resim: '' }); return; }
  var parcalar = kombinParcalari(k);
  var tarih = bugunAnahtar(new Date(su.getTime() + gun * 86400000));
  LS.yaz('sabahKombin', { tarih: tarih, p: parcalar.map(function (p) { return p.id; }) });
  var baslik = t('sbBaslik', Math.round(hv.min), Math.round(hv.max)) + (hv.yagmur ? t('sbYagmurEk') : '');
  var metin = t('sbMetin', parcalar.slice(0, 4).map(function (p) { return parcaAd(p); }).join(', '));
  kombinKolaji(k, {}).then(function (kol) {
    var resim = '';
    try { if (kol) { var cc = tuvaleCiz(kol, 640); var d = cc.toDataURL('image/jpeg', 0.84); resim = d.slice(d.indexOf(',') + 1); } } catch (e) { resim = ''; }
    gonder({ tarih: tarih, baslik: baslik, metin: metin, gunEtiket: gun ? t('sbYarin') : t('sbBugun'), resim: resim });
  }).catch(function () { gonder({ tarih: tarih, baslik: baslik, metin: metin, gunEtiket: gun ? t('sbYarin') : t('sbBugun') }); });
}
/* bildirime ya da widget'a dokununca: hazırlanan kombin açılır */
function sabahAc() {
  olay('sabah_dokun');
  tumSayfalariKapat();
  S.sekme = 'bugun'; ciz(); window.scrollTo(0, 0);
  var sk = LS.al('sabahKombin', null);
  if (!sk || !Array.isArray(sk.p) || sk.tarih < bugunAnahtar(new Date())) return;
  var k = kayittanKombin({ p: sk.p });
  if (!kombinParcalari(k).length) return;
  setTimeout(function () { onerilerSayfasi(sk.tarih === bugunAnahtar(new Date()) ? t('sbBugunKombin') : t('sbYarinKombin'), '', [k]); }, 350);
}
function widgetEklenebilir() { try { return !!(YEREL && typeof YEREL.widgetEklenebilir === 'function' && YEREL.widgetEklenebilir()); } catch (e) { return false; } }
function widgetVar() { try { return !!(YEREL && typeof YEREL.widgetVar === 'function' && YEREL.widgetVar()); } catch (e) { return false; } }
function widgetEkle() {
  olay('widget');
  try { YEREL.widgetEkle(); } catch (e) { }
  setTimeout(function () { sabahHazirla(true); }, 4000);
}
/* Ayarlar: sabah bildirimi anahtarı + saati, widget */
function sabahAyarSatirlari(satir) {
  if (!YEREL || typeof YEREL.sabahAyarla !== 'function') return null;
  var a = sabahAyar();
  var kap = h('div', null);
  var saatSec = h('select', { class: 'g-sira', style: { width: 'auto', flex: '0 0 auto' }, 'aria-label': t('sbSaat'), on: { change: function (e) { var y = sabahAyar(); y.saat = e.target.value; sabahAyarYaz(y); tost(t('sbKaydedildi', e.target.value)); } } });
  ['06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00'].forEach(function (s) { var o = h('option', { value: s, text: s }); if (s === a.saat) o.selected = true; saatSec.appendChild(o); });
  kap.appendChild(anahtarSatir(t('sbAyar'), t('sbAyarAlt'), a.acik, function (v) { var y = sabahAyar(); y.acik = v; sabahAyarYaz(y); if (v) { olay('sabah_ac'); bildirimIzniIste(); } }, 'gunes'));
  kap.appendChild(h('div', { class: 'satir' }, h('span', { class: 'sol' }, ikon('takvim'), h('div', null, t('sbSaat'), h('small', { text: t('sbSaatAlt') }))), saatSec));
  if (widgetEklenebilir()) kap.appendChild(satir('ev', t('sbWidget'), widgetVar() ? t('sbWidgetVar') : t('sbWidgetAlt'), widgetEkle));
  return kap;
}
/* ikinci kombin önerisinden sonra bir kez: "her sabah hazır olsun" */
function sabahIpucu() {
  if (!YEREL || typeof YEREL.sabahAyarla !== 'function' || LS.al('sabahIpucu', false)) return;
  var n = (LS.al('kombinSay', 0) | 0) + 1; LS.yaz('kombinSay', n);
  if (n < 2) return;
  LS.yaz('sabahIpucu', true);
  setTimeout(function () {
    var ek = widgetEklenebilir() && !widgetVar();
    onayla(t('sbIpucuBaslik'), t('sbIpucuMetin', sabahAyar().saat) + (ek ? ' ' + t('sbIpucuWidget') : ''), ek ? t('sbWidget') : t('tamam')).then(function (e) {
      if (e && ek) widgetEkle();
    });
  }, 1800);
}

Object.assign(DIL.tr, {
  gz7b: 'Kullanım ölçümü', gz7: 'Uygulamanın gelişmesi için günde bir kez "uygulama açıldı" bilgisi ve hangi özelliklerin kaç kez kullanıldığı (ör. 3 kombin önerisi) gönderilir. Telefon kimliğin tek yönlü özetlenir; adın, hesabın, fotoğrafların ya da konumun bu sayıma eklenmez.',
  olBaslik: 'Kullanım istatistikleri', olAc: 'Kullanım istatistikleri', olToplam: 'Toplam kullanıcı', olBugun: 'Bugün açan', olHafta: 'Son 7 gün ort.',
  olDonus: 'Geri dönüş (tutunma)', olGun: function (n) { return n + '. gün'; }, olGrup: function (d, g) { return d + ' / ' + g + ' kişi'; }, olVeriYok: 'Henüz yeterli veri yok',
  olDonusNot: 'İlk kez açanların 1, 7 ve 30 gün sonra yeniden açma oranı. 30. gün %10–15 üzerindeyse uygulama tutuyor demektir; altındaysa yeni özellik yerine ilk deneyimi iyileştir.',
  olGrafik: 'Son 30 gün', olAktif: 'Açan', olYeni: 'Yeni', olOlaylar: 'Son 7 günde en çok kullanılanlar',
  olay_kombin: 'Kombin önerisi', olay_parca_ekle: 'Kıyafet eklendi', olay_siparis: 'Sipariş ekran görüntüsü', olay_sohbet: 'Kombinle AI sohbet', olay_anket_ac: 'Anket açıldı',
  olay_anket_paylas: "Anket WhatsApp'ta paylaşıldı", olay_paylas: 'Gönderi paylaşıldı', olay_davet: 'Davet gönderildi', olay_sabah_ac: 'Sabah bildirimi açıldı', olay_sabah_dokun: 'Sabah bildirimine dokunuldu',
  olay_widget: 'Widget eklendi', olay_renk: 'Renk analizi', olay_alsam: 'Alsam mı?', olay_kamera: 'Kamera', olay_reklam_basvuru: 'Reklam başvurusu', olay_onecikar: 'Öne çıkarma', olay_kesfet: 'Keşfet açıldı',
  akWpPaylas: "WhatsApp'ta paylaş", akWpBaslik: 'Arkadaşlarına sor', akWpMetin: "Anket bağlantısını WhatsApp'ta paylaş: arkadaşların uygulama yüklemeden oy verebilir.",
  akWpMesaj: function (s, u) { return s + ' 🤔 Oyunu ver: ' + u; }, akWpHerkes: 'Yalnız herkese açık anketler bağlantıyla paylaşılabilir.', kopyalandiPaylas: 'Bağlantı kopyalandı, istediğin yere yapıştırabilirsin.',
  davetBaslik: 'Arkadaşını davet et', davetAlt: "WhatsApp'tan Kombinle'yi öner",
  davetMesaj: function (u) { return "Kombinle'yi denedin mi? Dolabındaki kıyafetlerle her sabah hava durumuna göre kombin öneriyor, kararsız kalınca arkadaşlarına sorabiliyorsun 👗✨ " + u; },
  kfBosBaslik: 'Keşfet arkadaşlarınla güzel', kfBosMetin: 'Arkadaşlarını davet et; kombinlerini paylaşın, birbirinize "A mı B mi?" diye sorun.',
  urlSiparis: 'Sipariş ekran görüntüsünden', urlSiparisAlt: 'Trendyol, Zara, H&M… sipariş ya da sepet ekranı',
  spOkunuyor: 'Ekran görüntüsü okunuyor', spOkunuyorAlt: 'Ürünleri buluyorum…', spBulunamadi: 'Bu ekran görüntüsünde kıyafet fotoğrafı bulamadım.',
  spAlisverisDegil: 'Bu bir alışveriş ekranı gibi görünmüyor. Sipariş, sepet ya da favori ekranının görüntüsünü seç.', spHata: 'Ekran görüntüsü okunamadı, tekrar dene.',
  spYzGerek: 'Bunun için Kombinle AI açık olmalı (Ayarlar).', psAciklamaSiparis: 'Ekran görüntüsünde bu ürünleri buldum. Dolabına eklemek istediklerini seç; her birini ayrı ayrı eklerim.',
  hdBaslik: '2 dakikada dolabını doldur', hdSayac: function (n) { return n + ' / 15'; },
  hdAyna: 'Aynada bir fotoğraf', hdAynaAlt: 'Üzerindeki her parçayı tek seferde ayırırım',
  hdSiparis: 'Sipariş ekran görüntüsü', hdSiparisAlt: 'Trendyol, Zara, H&M siparişlerinden ekle',
  hdGaleri: 'Galeriden toplu seç', hdGaleriAlt: 'Bir seferde 30 fotoğrafa kadar',
  sbAyar: 'Sabah kombin bildirimi', sbAyarAlt: 'Her sabah hava durumuna göre dolabından bir kombin', sbSaat: 'Bildirim saati', sbSaatAlt: 'Her gün bu saatte',
  sbKaydedildi: function (s) { return 'Sabah bildirimi her gün ' + s + "'da gelecek."; }, sbWidget: 'Ana ekrana widget ekle', sbWidgetAlt: 'Günün kombini ana ekranında', sbWidgetVar: 'Ana ekranında ekli',
  sbBaslik: function (a, b) { return 'Günaydın ☀️ Bugün ' + a + '–' + b + '°'; }, sbHavaSablon: 'Günaydın ☀️ Bugün {min}–{max}°', sbYagmurEk: ', yağmur bekleniyor',
  sbMetin: function (l) { return 'Önerin: ' + l; }, sbBosBaslik: 'Günaydın ☀️', sbBosMetin: 'Bugünün kombinine bakmak için dokun.',
  sbWidgetBosBaslik: 'Bugün ne giysem?', sbWidgetBosMetin: 'Kombin önerin için dokun', sbBugun: 'Bugün', sbYarin: 'Yarın',
  sbBugunKombin: 'Bugünün kombini', sbYarinKombin: 'Yarının kombini',
  sbIpucuBaslik: 'Her sabah hazır olsun', sbIpucuMetin: function (s) { return 'Her sabah ' + s + "'da hava durumuna göre bir kombin önerisi göndereceğim. Saatini Ayarlar'dan değiştirebilirsin."; },
  sbIpucuWidget: 'İstersen günün kombinini ana ekranında da göster.'
});
Object.assign(DIL.en, {
  gz7b: 'Usage counts', gz7: 'To improve the app, once a day an "app opened" signal and how many times features were used (e.g. 3 outfit suggestions) are sent. Your phone ID is one-way hashed; your name, account, photos or location are never part of these counts.',
  olBaslik: 'Usage statistics', olAc: 'Usage statistics', olToplam: 'Total users', olBugun: 'Opened today', olHafta: '7-day average',
  olDonus: 'Retention', olGun: function (n) { return 'Day ' + n; }, olGrup: function (d, g) { return d + ' / ' + g + ' people'; }, olVeriYok: 'Not enough data yet',
  olDonusNot: 'Share of new users who open the app again 1, 7 and 30 days later. Above 10–15% on day 30 means the app sticks; below that, improve the first experience before adding features.',
  olGrafik: 'Last 30 days', olAktif: 'Opened', olYeni: 'New', olOlaylar: 'Most used in the last 7 days',
  olay_kombin: 'Outfit suggestion', olay_parca_ekle: 'Item added', olay_siparis: 'Order screenshot', olay_sohbet: 'Kombinle AI chat', olay_anket_ac: 'Poll created',
  olay_anket_paylas: 'Poll shared on WhatsApp', olay_paylas: 'Post shared', olay_davet: 'Invite sent', olay_sabah_ac: 'Morning notification on', olay_sabah_dokun: 'Morning notification tapped',
  olay_widget: 'Widget added', olay_renk: 'Colour analysis', olay_alsam: 'Should I buy it?', olay_kamera: 'Camera', olay_reklam_basvuru: 'Ad request', olay_onecikar: 'Post boost', olay_kesfet: 'Explore opened',
  akWpPaylas: 'Share on WhatsApp', akWpBaslik: 'Ask your friends', akWpMetin: 'Share the poll link on WhatsApp: your friends can vote without installing the app.',
  akWpMesaj: function (s, u) { return s + ' 🤔 Cast your vote: ' + u; }, akWpHerkes: 'Only public polls can be shared with a link.', kopyalandiPaylas: 'Link copied; paste it anywhere.',
  davetBaslik: 'Invite a friend', davetAlt: 'Recommend Kombinle on WhatsApp',
  davetMesaj: function (u) { return 'Have you tried Kombinle? It suggests outfits from your own wardrobe every morning based on the weather, and you can ask friends when you can\'t decide 👗✨ ' + u; },
  kfBosBaslik: 'Explore is better with friends', kfBosMetin: 'Invite your friends: share outfits and ask each other "A or B?".',
  urlSiparis: 'From an order screenshot', urlSiparisAlt: 'An order or cart screen from any shop',
  spOkunuyor: 'Reading the screenshot', spOkunuyorAlt: 'Finding the products…', spBulunamadi: "I couldn't find clothing photos in this screenshot.",
  spAlisverisDegil: "This doesn't look like a shopping screen. Pick a screenshot of an order, cart or favourites.", spHata: "Couldn't read the screenshot, try again.",
  spYzGerek: 'Kombinle AI must be on for this (Settings).', psAciklamaSiparis: 'I found these products in the screenshot. Pick the ones to add; I will add each one separately.',
  hdBaslik: 'Fill your wardrobe in 2 minutes', hdSayac: function (n) { return n + ' / 15'; },
  hdAyna: 'One mirror photo', hdAynaAlt: 'I separate every piece you are wearing at once',
  hdSiparis: 'Order screenshot', hdSiparisAlt: 'Add items from your online orders',
  hdGaleri: 'Pick many from the gallery', hdGaleriAlt: 'Up to 30 photos at once',
  sbAyar: 'Morning outfit notification', sbAyarAlt: 'An outfit from your wardrobe every morning, matched to the weather', sbSaat: 'Notification time', sbSaatAlt: 'Every day at this time',
  sbKaydedildi: function (s) { return 'Your morning notification will arrive every day at ' + s + '.'; }, sbWidget: 'Add widget to home screen', sbWidgetAlt: 'Outfit of the day on your home screen', sbWidgetVar: 'On your home screen',
  sbBaslik: function (a, b) { return 'Good morning ☀️ Today ' + a + '–' + b + '°'; }, sbHavaSablon: 'Good morning ☀️ Today {min}–{max}°', sbYagmurEk: ', rain expected',
  sbMetin: function (l) { return 'Your outfit: ' + l; }, sbBosBaslik: 'Good morning ☀️', sbBosMetin: "Tap to see today's outfit.",
  sbWidgetBosBaslik: 'What should I wear today?', sbWidgetBosMetin: 'Tap for your outfit idea', sbBugun: 'Today', sbYarin: 'Tomorrow',
  sbBugunKombin: "Today's outfit", sbYarinKombin: "Tomorrow's outfit",
  sbIpucuBaslik: 'Ready every morning', sbIpucuMetin: function (s) { return "Every morning at " + s + " I'll send an outfit idea for the weather. You can change the time in Settings."; },
  sbIpucuWidget: 'You can also show the outfit of the day on your home screen.'
});
Object.assign(DIL.ru, {
  gz7b: 'Подсчёт использования', gz7: 'Раз в день отправляется сигнал «приложение открыто» и сколько раз использовались функции. ID телефона необратимо хешируется; имя, аккаунт, фото и местоположение не передаются.',
  olBaslik: 'Статистика использования', olAc: 'Статистика использования', olToplam: 'Всего пользователей', olBugun: 'Открыли сегодня', olHafta: 'Среднее за 7 дней',
  olDonus: 'Удержание', olGun: function (n) { return n + '-й день'; }, olGrup: function (d, g) { return d + ' / ' + g; }, olVeriYok: 'Пока мало данных',
  olDonusNot: 'Доля новых пользователей, вернувшихся через 1, 7 и 30 дней. Выше 10–15% на 30-й день — приложение «держит».',
  olGrafik: 'Последние 30 дней', olAktif: 'Открыли', olYeni: 'Новые', olOlaylar: 'Чаще всего за 7 дней',
  akWpPaylas: 'Поделиться в WhatsApp', akWpBaslik: 'Спроси подруг', akWpMetin: 'Поделись ссылкой в WhatsApp: голосовать можно без приложения.',
  akWpMesaj: function (s, u) { return s + ' 🤔 Проголосуй: ' + u; }, akWpHerkes: 'Ссылкой можно делиться только публичными опросами.', kopyalandiPaylas: 'Ссылка скопирована.',
  davetBaslik: 'Пригласить подругу', davetAlt: 'Посоветуй Kombinle в WhatsApp',
  davetMesaj: function (u) { return 'Пробовала Kombinle? Каждое утро подбирает образ из твоего гардероба по погоде, а если не можешь выбрать — спроси подруг 👗✨ ' + u; },
  kfBosBaslik: 'С подругами интереснее', kfBosMetin: 'Пригласи подруг: делитесь образами и спрашивайте друг друга «A или B?».',
  urlSiparis: 'Со скриншота заказа', urlSiparisAlt: 'Экран заказа или корзины любого магазина',
  spOkunuyor: 'Читаю скриншот', spOkunuyorAlt: 'Ищу товары…', spBulunamadi: 'На скриншоте не нашлось фото одежды.',
  spAlisverisDegil: 'Это не похоже на экран магазина. Выбери скриншот заказа, корзины или избранного.', spHata: 'Не удалось прочитать скриншот.',
  spYzGerek: 'Для этого нужен включённый Kombinle AI (Настройки).', psAciklamaSiparis: 'Я нашла эти товары на скриншоте. Выбери, что добавить.',
  hdBaslik: 'Заполни гардероб за 2 минуты', hdSayac: function (n) { return n + ' / 15'; },
  hdAyna: 'Одно фото в зеркале', hdAynaAlt: 'Разделю все вещи на тебе за раз', hdSiparis: 'Скриншот заказа', hdSiparisAlt: 'Добавь вещи из онлайн-заказов',
  hdGaleri: 'Выбрать много из галереи', hdGaleriAlt: 'До 30 фото за раз',
  sbAyar: 'Утреннее уведомление с образом', sbAyarAlt: 'Каждое утро образ из гардероба по погоде', sbSaat: 'Время уведомления', sbSaatAlt: 'Каждый день в это время',
  sbKaydedildi: function (s) { return 'Уведомление будет приходить каждый день в ' + s + '.'; }, sbWidget: 'Добавить виджет на экран', sbWidgetAlt: 'Образ дня на главном экране', sbWidgetVar: 'Уже на главном экране',
  sbBaslik: function (a, b) { return 'Доброе утро ☀️ Сегодня ' + a + '–' + b + '°'; }, sbHavaSablon: 'Доброе утро ☀️ Сегодня {min}–{max}°', sbYagmurEk: ', ожидается дождь',
  sbMetin: function (l) { return 'Твой образ: ' + l; }, sbBosBaslik: 'Доброе утро ☀️', sbBosMetin: 'Нажми, чтобы увидеть образ на сегодня.',
  sbWidgetBosBaslik: 'Что надеть сегодня?', sbWidgetBosMetin: 'Нажми для идеи образа', sbBugun: 'Сегодня', sbYarin: 'Завтра',
  sbBugunKombin: 'Образ на сегодня', sbYarinKombin: 'Образ на завтра',
  sbIpucuBaslik: 'Готово каждое утро', sbIpucuMetin: function (s) { return 'Каждое утро в ' + s + ' я пришлю образ по погоде. Время можно изменить в Настройках.'; },
  sbIpucuWidget: 'Можно показать образ дня и на главном экране.'
});
Object.assign(DIL.uz, {
  gz7b: 'Foydalanish hisobi', gz7: 'Kuniga bir marta «ilova ochildi» belgisi va funksiyalar necha marta ishlatilgani yuboriladi. Telefon identifikatori bir tomonlama xeshlanadi; ism, hisob, rasm va joylashuv yuborilmaydi.',
  olBaslik: 'Foydalanish statistikasi', olAc: 'Foydalanish statistikasi', olToplam: 'Jami foydalanuvchi', olBugun: 'Bugun ochganlar', olHafta: "7 kunlik o'rtacha",
  olDonus: 'Qaytish', olGun: function (n) { return n + '-kun'; }, olGrup: function (d, g) { return d + ' / ' + g; }, olVeriYok: "Hali ma'lumot yetarli emas",
  olDonusNot: "Yangi foydalanuvchilarning 1, 7 va 30 kundan keyin qayta ochish ulushi. 30-kunda 10–15% dan yuqori bo'lsa, ilova ushlaydi.",
  olGrafik: 'Oxirgi 30 kun', olAktif: 'Ochgan', olYeni: 'Yangi', olOlaylar: "7 kunda eng ko'p ishlatilgan",
  akWpPaylas: "WhatsApp'da ulashish", akWpBaslik: "Do'stlaringdan so'ra", akWpMetin: "Havolani WhatsApp'da ulash: do'stlaring ilovasiz ovoz bera oladi.",
  akWpMesaj: function (s, u) { return s + ' 🤔 Ovoz ber: ' + u; }, akWpHerkes: "Faqat ochiq so'rovnomalarni havola bilan ulashish mumkin.", kopyalandiPaylas: 'Havola nusxalandi.',
  davetBaslik: "Do'stingni taklif qil", davetAlt: "WhatsApp'da Kombinle'ni tavsiya qil",
  davetMesaj: function (u) { return "Kombinle'ni sinab ko'rdingmi? Har tong garderobingdagi kiyimlardan ob-havoga mos obraz taklif qiladi 👗✨ " + u; },
  kfBosBaslik: "Do'stlar bilan qiziqroq", kfBosMetin: "Do'stlaringni taklif qil: obrazlarni ulashinglar, bir-biringizdan «A mi B mi?» deb so'ranglar.",
  urlSiparis: 'Buyurtma skrinshotidan', urlSiparisAlt: "Istalgan do'kon buyurtma yoki savat ekrani",
  spOkunuyor: "Skrinshot o'qilmoqda", spOkunuyorAlt: 'Mahsulotlarni qidiryapman…', spBulunamadi: 'Skrinshotda kiyim surati topilmadi.',
  spAlisverisDegil: "Bu xarid ekraniga o'xshamaydi. Buyurtma, savat yoki sevimlilar skrinshotini tanlang.", spHata: "Skrinshot o'qilmadi.",
  spYzGerek: "Buning uchun Kombinle AI yoqilgan bo'lishi kerak (Sozlamalar).", psAciklamaSiparis: "Skrinshotda shu mahsulotlarni topdim. Qo'shmoqchi bo'lganlaringizni tanlang.",
  hdBaslik: "Garderobni 2 daqiqada to'ldir", hdSayac: function (n) { return n + ' / 15'; },
  hdAyna: 'Oynada bitta surat', hdAynaAlt: 'Ustingdagi hamma kiyimni birdan ajrataman', hdSiparis: 'Buyurtma skrinshoti', hdSiparisAlt: "Onlayn buyurtmalardan qo'sh",
  hdGaleri: 'Galereyadan ko‘p tanlash', hdGaleriAlt: '30 tagacha surat birdan',
  sbAyar: 'Ertalabki obraz bildirishnomasi', sbAyarAlt: 'Har tong ob-havoga mos obraz', sbSaat: 'Bildirishnoma vaqti', sbSaatAlt: 'Har kuni shu vaqtda',
  sbKaydedildi: function (s) { return 'Bildirishnoma har kuni ' + s + ' da keladi.'; }, sbWidget: "Bosh ekranga vidjet qo'shish", sbWidgetAlt: 'Kun obrazi bosh ekranda', sbWidgetVar: 'Bosh ekranda bor',
  sbBaslik: function (a, b) { return 'Xayrli tong ☀️ Bugun ' + a + '–' + b + '°'; }, sbHavaSablon: 'Xayrli tong ☀️ Bugun {min}–{max}°', sbYagmurEk: ', yomg‘ir kutilmoqda',
  sbMetin: function (l) { return 'Obrazing: ' + l; }, sbBosBaslik: 'Xayrli tong ☀️', sbBosMetin: "Bugungi obrazni ko'rish uchun bosing.",
  sbWidgetBosBaslik: 'Bugun nima kiysam?', sbWidgetBosMetin: 'Obraz taklifi uchun bosing', sbBugun: 'Bugun', sbYarin: 'Ertaga',
  sbBugunKombin: 'Bugungi obraz', sbYarinKombin: 'Ertangi obraz',
  sbIpucuBaslik: 'Har tong tayyor', sbIpucuMetin: function (s) { return 'Har tong ' + s + " da ob-havoga mos obraz yuboraman. Vaqtni Sozlamalarda o'zgartirish mumkin."; },
  sbIpucuWidget: "Kun obrazini bosh ekranda ham ko'rsatish mumkin."
});
Object.assign(DIL.ko, {
  gz7b: '사용량 집계', gz7: '하루에 한 번 "앱 열림"과 기능 사용 횟수만 보내요. 휴대폰 ID는 단방향으로 변환되며 이름, 계정, 사진, 위치는 포함되지 않아요.',
  olBaslik: '사용 통계', olAc: '사용 통계', olToplam: '전체 사용자', olBugun: '오늘 연 사람', olHafta: '7일 평균',
  olDonus: '재방문(리텐션)', olGun: function (n) { return n + '일차'; }, olGrup: function (d, g) { return d + ' / ' + g + '명'; }, olVeriYok: '아직 데이터가 부족해요',
  olDonusNot: '처음 연 사람이 1·7·30일 뒤 다시 연 비율이에요. 30일차가 10–15% 이상이면 자리를 잡은 거예요.',
  olGrafik: '최근 30일', olAktif: '연 사람', olYeni: '신규', olOlaylar: '최근 7일 가장 많이 쓴 기능',
  akWpPaylas: 'WhatsApp으로 공유', akWpBaslik: '친구에게 물어보기', akWpMetin: '투표 링크를 공유하면 친구들이 앱 없이도 투표할 수 있어요.',
  akWpMesaj: function (s, u) { return s + ' 🤔 투표해 줘: ' + u; }, akWpHerkes: '전체 공개 투표만 링크로 공유할 수 있어요.', kopyalandiPaylas: '링크를 복사했어요.',
  davetBaslik: '친구 초대하기', davetAlt: 'WhatsApp으로 Kombinle 추천하기',
  davetMesaj: function (u) { return 'Kombinle 써 봤어? 매일 아침 날씨에 맞춰 내 옷장 옷으로 코디를 추천해 주고, 고민될 땐 친구들에게 물어볼 수 있어 👗✨ ' + u; },
  kfBosBaslik: '탐색은 친구와 함께', kfBosMetin: '친구를 초대해서 코디를 공유하고 "A 아니면 B?"를 물어보세요.',
  urlSiparis: '주문 화면 캡처에서', urlSiparisAlt: '쇼핑몰의 주문·장바구니 화면',
  spOkunuyor: '캡처를 읽는 중', spOkunuyorAlt: '상품을 찾는 중…', spBulunamadi: '이 캡처에서 옷 사진을 찾지 못했어요.',
  spAlisverisDegil: '쇼핑 화면이 아닌 것 같아요. 주문, 장바구니, 찜 화면을 캡처해 주세요.', spHata: '캡처를 읽지 못했어요.',
  spYzGerek: '이 기능은 Kombinle AI가 켜져 있어야 해요(설정).', psAciklamaSiparis: '캡처에서 이 상품들을 찾았어요. 추가할 것을 고르세요.',
  hdBaslik: '2분 만에 옷장 채우기', hdSayac: function (n) { return n + ' / 15'; },
  hdAyna: '거울 사진 한 장', hdAynaAlt: '입은 옷을 한 번에 하나씩 나눠요', hdSiparis: '주문 화면 캡처', hdSiparisAlt: '온라인 주문에서 추가',
  hdGaleri: '갤러리에서 여러 장', hdGaleriAlt: '한 번에 최대 30장',
  sbAyar: '아침 코디 알림', sbAyarAlt: '매일 아침 날씨에 맞춘 내 옷장 코디', sbSaat: '알림 시간', sbSaatAlt: '매일 이 시간에',
  sbKaydedildi: function (s) { return '매일 ' + s + '에 아침 알림이 와요.'; }, sbWidget: '홈 화면에 위젯 추가', sbWidgetAlt: '홈 화면에 오늘의 코디', sbWidgetVar: '홈 화면에 있어요',
  sbBaslik: function (a, b) { return '좋은 아침이에요 ☀️ 오늘 ' + a + '–' + b + '°'; }, sbHavaSablon: '좋은 아침이에요 ☀️ 오늘 {min}–{max}°', sbYagmurEk: ', 비 예보',
  sbMetin: function (l) { return '추천 코디: ' + l; }, sbBosBaslik: '좋은 아침이에요 ☀️', sbBosMetin: '눌러서 오늘의 코디를 보세요.',
  sbWidgetBosBaslik: '오늘 뭐 입지?', sbWidgetBosMetin: '눌러서 코디 추천 받기', sbBugun: '오늘', sbYarin: '내일',
  sbBugunKombin: '오늘의 코디', sbYarinKombin: '내일의 코디',
  sbIpucuBaslik: '매일 아침 준비해 둘게요', sbIpucuMetin: function (s) { return '매일 아침 ' + s + '에 날씨에 맞는 코디를 보내 드릴게요. 시간은 설정에서 바꿀 수 있어요.'; },
  sbIpucuWidget: '오늘의 코디를 홈 화면에도 띄울 수 있어요.'
});
