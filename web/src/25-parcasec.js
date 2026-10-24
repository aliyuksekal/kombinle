/* ---------- Boydan fotoğraftan parça seçme ----------
   Üzerinde çekilmiş (boydan, aynada) bir fotoğrafta Kombinle AI gördüğü parçaları kutularıyla bildirir.
   Kullanıcı hangilerini ekleyeceğini seçer; her parça fotoğrafın aslından (tam çözünürlükte) kesilip
   ayrı ayrı tanınır ve dolaba eklenir. Listede olmayan parça (ör. çorap) kategori seçilerek aratılır. */

var PS_KATEGORI = [['ust', 'psUst'], ['alt', 'psAlt'], ['tek', 'psElbise'], ['dis', 'psDis'], ['ayk', 'psAyk'], ['aks', 'psCanta'],
  ['aks', 'psSapka'], ['ic', 'psCorap'], ['aks', 'psGozluk'], ['aks', 'psTaki'], ['aks', 'psKemer'], ['aks', 'psEsarp']];

function parcaSecimiGerek(sonuc) {
  var an = sonuc && sonuc.analiz;
  if (!an || !(an.bulut || an.parcaModel) || !sonuc.kaynak || sonuc.kaynak._tek || !Array.isArray(an.parcalar)) return false;
  return an.parcalar.length >= 2 || (an.kisi && an.parcalar.length >= 1);
}

/* [ymin, xmin, ymax, xmax] (0–1000) kutusunu biraz pay bırakarak keser; en uzun kenar en fazla `enFazla` px */
function kutuKirp(kaynak, W, H, kutu, enFazla, pay) {
  var y0 = kutu[0] / 1000 * H, x0 = kutu[1] / 1000 * W, y1 = kutu[2] / 1000 * H, x1 = kutu[3] / 1000 * W;
  var p = Math.max(x1 - x0, y1 - y0) * (pay === undefined ? 0.07 : pay) + 4;
  x0 = Math.max(0, Math.floor(x0 - p)); y0 = Math.max(0, Math.floor(y0 - p));
  x1 = Math.min(W, Math.ceil(x1 + p)); y1 = Math.min(H, Math.ceil(y1 + p));
  var sw = Math.max(1, x1 - x0), sh = Math.max(1, y1 - y0);
  var o = Math.min(1, enFazla / Math.max(sw, sh));
  /* çok küçük parçalar (küpe, çorap) en az 320 px'e büyütülür: tanıma ve görünüm için */
  if (Math.max(sw, sh) * o < 320) o = 320 / Math.max(sw, sh);
  var c = document.createElement('canvas');
  c.width = Math.max(24, Math.round(sw * o)); c.height = Math.max(24, Math.round(sh * o));
  var x = c.getContext('2d');
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, c.width, c.height);
  x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
  x.drawImage(kaynak.kaynak || kaynak, x0, y0, sw, sh, 0, 0, c.width, c.height);
  return c;
}
function bmpKapat(b) { try { if (b && b.close) b.close(); if (b && b.kapat) b.kapat(); } catch (e) { } }

function parcaSecici(sonuc, liste, i) {
  var an = sonuc.analiz;
  var ogeler = an.parcalar.map(function (x) { return { ad: x.ad || grupAd(x.kategori) || t('psParca'), kutu: x.kutu, secili: false }; });
  var onizleme = null, islemde = false, bitti = false;
  var izgara = h('div', { class: 'ps-izgara' });
  var digerAlan = h('div', { class: 'ps-diger', hidden: true });
  var ekleBtn = h('button', { class: 'btn ana', on: { click: seciliEkle } });
  var tamamBtn = h('button', { class: 'btn ikincil', on: { click: tamaminiEkle } }, t('psTamami'));
  var gov = h('div', null,
    h('p', { class: 'alt-yazi ps-not', text: an.kisi ? t('psAciklamaKisi') : t('psAciklama') }),
    izgara,
    h('button', { class: 'ps-diger-btn', on: { click: function () { digerAlan.hidden = !digerAlan.hidden; } } }, ikon('ara', 'k'), t('psListedeYok')),
    digerAlan);
  var s = sayfaAc({ baslik: t('psBaslik'), icerik: gov, altBar: [tamamBtn, ekleBtn], kapaninca: function () { if (!bitti) setTimeout(function () { sirayaIsle(liste, i + 1); }, 320); } });

  function ciz() {
    temizle(izgara);
    ogeler.forEach(function (o) {
      var resim = h('span', { class: 'ps-resim' });
      if (onizleme) {
        try { resim.appendChild(kutuKirp(onizleme, onizleme.width, onizleme.height, o.kutu, 240, 0.05)); } catch (e) { }
      }
      izgara.appendChild(h('button', { class: 'ps-kart', 'aria-pressed': o.secili ? 'true' : 'false', on: { click: function () { o.secili = !o.secili; ciz(); } } },
        resim, h('span', { class: 'ps-tik' }, ikon('tik', 'k')), h('b', { text: o.ad })));
    });
    var n = ogeler.filter(function (o) { return o.secili; }).length;
    temizle(ekleBtn);
    ekleBtn.appendChild(document.createTextNode(n ? t('psEkle', n) : t('psSec')));
    ekleBtn.disabled = !n || islemde;
    tamamBtn.disabled = islemde;
  }
  /* listede olmayan parça: kategori seçilir, Kombinle AI fotoğrafta onu arar */
  PS_KATEGORI.forEach(function (k) {
    var b = h('button', { class: 'cip', on: { click: function () { ara(b, t(k[1])); } } }, t(k[1]));
    digerAlan.appendChild(b);
  });
  function ara(b, ad) {
    if (b.disabled || !an._kaynakVeri) return;
    b.disabled = true;
    var eski = b.textContent; temizle(b); b.appendChild(h('span', { class: 'yukleniyor' })); b.appendChild(document.createTextNode(eski));
    yzTani(an._kaynakVeri, { hedef: ad }).then(function (sn) {
      var k = sn && sn.kiyafet !== false ? kutuGecerli(sn.kutu) : null;
      if (!k) { tost(t('psBulunamadi', ad)); return; }
      ogeler.push({ ad: kirp(sn.ad, 40) || ad, kutu: k, secili: true });
      digerAlan.hidden = true;
      ciz();
    }).catch(function (e) { tost(yzHataMetni(e, t('bulutHata'))); }).then(function () {
      if (kayitKapandi()) return;
      b.disabled = false; temizle(b); b.appendChild(document.createTextNode(eski));
    });
  }
  function kayitKapandi() { return s.kapandi; }
  function tamaminiEkle() {
    if (islemde) return;
    bitti = true; s.kapat();
    setTimeout(function () {
      parcaDuzenle(null, { sonuc: sonuc, sira: i + 1, toplam: liste.length, devam: function () { sirayaIsle(liste, i + 1); } });
    }, 320);
  }
  function seciliEkle() {
    var secilen = ogeler.filter(function (o) { return o.secili; });
    if (!secilen.length || islemde) return;
    islemde = true; ciz();
    temizle(ekleBtn); ekleBtn.appendChild(h('span', { class: 'yukleniyor' })); ekleBtn.appendChild(document.createTextNode(t('psKesiliyor')));
    var k = sonuc.kaynak;
    var cozum = k instanceof HTMLCanvasElement ? Promise.resolve(k) : resimCoz(k);
    cozum.then(function (bmp) {
      var parcalar = secilen.map(function (o) { var c = kutuKirp(bmp, bmp.width, bmp.height, o.kutu, 1600); c._tek = true; return c; });
      if (bmp !== k) bmpKapat(bmp);
      /* boydan fotoğrafın yerini kesilen parçalar alır (sayaç "1/2, 2/2" diye ilerler) */
      Array.prototype.splice.apply(liste, [i, 1].concat(parcalar));
      bitti = true; s.kapat();
      setTimeout(function () { sirayaIsle(liste, i); }, 320);
    }).catch(function () {
      islemde = false; ciz();
      tost(t('psKesilemedi'));
    });
  }
  ciz();
  /* küçük önizlemeler kaydedilecek görüntüden (1024 px) kesilir */
  resimCoz(sonuc.buyuk).then(function (bmp) {
    var c = tuvaleCiz(bmp, 1024); bmpKapat(bmp);
    onizleme = c; if (!s.kapandi) ciz();
  }).catch(function () { });
}

Object.assign(DIL.tr, {
  psBaslik: 'Hangi parçayı ekleyelim?', psParca: 'Parça',
  psAciklamaKisi: 'Fotoğrafta üzerindeki kıyafetleri gördüm. Dolabına eklemek istediklerini seç; her birini fotoğraftan kesip ayrı ayrı eklerim.',
  psAciklama: 'Fotoğrafta birden fazla parça gördüm. Eklemek istediklerini seç; her birini ayrı ayrı kesip eklerim.',
  psListedeYok: 'Aradığın parça listede yok mu?', psTamami: 'Fotoğrafın tamamı',
  psSec: 'Parça seç', psEkle: function (n) { return n === 1 ? 'Seçileni ekle' : n + ' parçayı ekle'; }, psKesiliyor: 'Kesiliyor…',
  psBulunamadi: function (x) { return 'Fotoğrafta "' + x + '" bulamadım.'; }, psKesilemedi: 'Fotoğraf kesilemedi, tekrar dene.',
  psUst: 'Üst (bluz, gömlek, tişört)', psAlt: 'Alt (pantolon, etek)', psElbise: 'Elbise / tulum', psDis: 'Ceket / mont', psAyk: 'Ayakkabı', psCanta: 'Çanta',
  psSapka: 'Şapka / bere', psCorap: 'Çorap', psGozluk: 'Gözlük', psTaki: 'Takı', psKemer: 'Kemer', psEsarp: 'Eşarp / şal'
});
Object.assign(DIL.en, {
  psBaslik: 'Which piece should I add?', psParca: 'Piece',
  psAciklamaKisi: 'I can see the clothes you are wearing. Pick the ones to add to your wardrobe; I will cut each one out and add it separately.',
  psAciklama: 'I can see several pieces in this photo. Pick the ones to add; I will cut each one out and add it separately.',
  psListedeYok: 'Is the piece you want missing?', psTamami: 'Whole photo',
  psSec: 'Pick a piece', psEkle: function (n) { return n === 1 ? 'Add selected' : 'Add ' + n + ' pieces'; }, psKesiliyor: 'Cutting…',
  psBulunamadi: function (x) { return 'I could not find "' + x + '" in the photo.'; }, psKesilemedi: 'Could not cut the photo, try again.',
  psUst: 'Top (blouse, shirt, tee)', psAlt: 'Bottom (trousers, skirt)', psElbise: 'Dress / jumpsuit', psDis: 'Jacket / coat', psAyk: 'Shoes', psCanta: 'Bag',
  psSapka: 'Hat / beanie', psCorap: 'Socks', psGozluk: 'Glasses', psTaki: 'Jewellery', psKemer: 'Belt', psEsarp: 'Scarf / shawl'
});
Object.assign(DIL.ru, {
  psBaslik: 'Какую вещь добавить?', psParca: 'Вещь',
  psAciklamaKisi: 'Я вижу одежду, которая на тебе. Выбери, что добавить в гардероб: я вырежу каждую вещь и добавлю отдельно.',
  psAciklama: 'На фото несколько вещей. Выбери, что добавить: я вырежу каждую и добавлю отдельно.',
  psListedeYok: 'Нужной вещи нет в списке?', psTamami: 'Всё фото',
  psSec: 'Выбери вещь', psEkle: function (n) { return n === 1 ? 'Добавить' : 'Добавить (' + n + ')'; }, psKesiliyor: 'Вырезаю…',
  psBulunamadi: function (x) { return 'Не нашла на фото: «' + x + '».'; }, psKesilemedi: 'Не удалось вырезать, попробуй ещё раз.',
  psUst: 'Верх (блузка, рубашка, футболка)', psAlt: 'Низ (брюки, юбка)', psElbise: 'Платье / комбинезон', psDis: 'Куртка / пальто', psAyk: 'Обувь', psCanta: 'Сумка',
  psSapka: 'Шляпа / шапка', psCorap: 'Носки', psGozluk: 'Очки', psTaki: 'Украшения', psKemer: 'Ремень', psEsarp: 'Платок / шаль'
});
Object.assign(DIL.uz, {
  psBaslik: "Qaysi kiyimni qo'shay?", psParca: 'Kiyim',
  psAciklamaKisi: "Ustingizdagi kiyimlarni ko'rdim. Garderobga qo'shmoqchi bo'lganlarini tanlang: har birini kesib, alohida qo'shaman.",
  psAciklama: "Rasmda bir nechta kiyim bor. Qo'shmoqchi bo'lganlarini tanlang: har birini kesib, alohida qo'shaman.",
  psListedeYok: "Kerakli kiyim ro'yxatda yo'qmi?", psTamami: 'Butun rasm',
  psSec: 'Kiyim tanlang', psEkle: function (n) { return n === 1 ? "Qo'shish" : n + " ta kiyimni qo'shish"; }, psKesiliyor: 'Kesilmoqda…',
  psBulunamadi: function (x) { return 'Rasmda "' + x + '" topilmadi.'; }, psKesilemedi: "Rasm kesilmadi, qayta urinib ko'ring.",
  psUst: "Ust (bluzka, ko'ylak, futbolka)", psAlt: 'Past (shim, yubka)', psElbise: "Ko'ylak / kombinezon", psDis: 'Kurtka / palto', psAyk: 'Poyabzal', psCanta: 'Sumka',
  psSapka: "Shlyapa / do'ppi", psCorap: 'Paypoq', psGozluk: "Ko'zoynak", psTaki: 'Taqinchoq', psKemer: 'Kamar', psEsarp: "Ro'mol / sharf"
});

/* Kombinle parça haritası (telefonda) parça adları; kol / etek boyu ad ekleri */
Object.assign(DIL.tr, {
  pm_ust: 'Üst', pm_dis: 'Ceket / mont', pm_alt: 'Pantolon / şort', pm_etek: 'Etek', pm_elbise: 'Elbise / tulum', pm_ayakkabi: 'Ayakkabı',
  pm_canta: 'Çanta', pm_sapka: 'Şapka / bere', pm_gozluk: 'Gözlük', pm_atki: 'Atkı / eşarp', pm_kemer: 'Kemer', pm_corap: 'Çorap',
  kol_kolsuz: 'kolsuz', kol_kisa: 'kısa kollu', kol_uzun: 'uzun kollu', boy_mini: 'mini', boy_midi: 'midi', boy_maksi: 'maksi'
});
Object.assign(DIL.en, {
  pm_ust: 'Top', pm_dis: 'Jacket / coat', pm_alt: 'Trousers / shorts', pm_etek: 'Skirt', pm_elbise: 'Dress / jumpsuit', pm_ayakkabi: 'Shoes',
  pm_canta: 'Bag', pm_sapka: 'Hat', pm_gozluk: 'Glasses', pm_atki: 'Scarf', pm_kemer: 'Belt', pm_corap: 'Socks',
  kol_kolsuz: 'sleeveless', kol_kisa: 'short-sleeve', kol_uzun: 'long-sleeve', boy_mini: 'mini', boy_midi: 'midi', boy_maksi: 'maxi'
});
Object.assign(DIL.ru, {
  pm_ust: 'Верх', pm_dis: 'Куртка / пальто', pm_alt: 'Брюки / шорты', pm_etek: 'Юбка', pm_elbise: 'Платье / комбинезон', pm_ayakkabi: 'Обувь',
  pm_canta: 'Сумка', pm_sapka: 'Шляпа / шапка', pm_gozluk: 'Очки', pm_atki: 'Шарф / платок', pm_kemer: 'Ремень', pm_corap: 'Носки',
  kol_kolsuz: 'без рукавов', kol_kisa: 'с коротким рукавом', kol_uzun: 'с длинным рукавом', boy_mini: 'мини', boy_midi: 'миди', boy_maksi: 'макси'
});
Object.assign(DIL.uz, {
  pm_ust: 'Ust', pm_dis: 'Kurtka / palto', pm_alt: 'Shim / shorti', pm_etek: 'Yubka', pm_elbise: "Ko'ylak / kombinezon", pm_ayakkabi: 'Poyabzal',
  pm_canta: 'Sumka', pm_sapka: 'Shlyapa', pm_gozluk: "Ko'zoynak", pm_atki: "Sharf / ro'mol", pm_kemer: 'Kamar', pm_corap: 'Paypoq',
  kol_kolsuz: 'yengsiz', kol_kisa: 'kalta yengli', kol_uzun: 'uzun yengli', boy_mini: 'mini', boy_midi: 'midi', boy_maksi: 'maksi'
});
