/* ---------- Kıyafet grupları ve türleri ----------
   s: varsayılan tarz (g=günlük, s=şık, r=resmi, p=spor)
   w: sıcak tutma katkısı, k: kapalılık (0 açık, 1 orta, 2 kapalı)
   su: yağmura dayanıklı varsayılan, ac: açık ayakkabı */
var GRUPLAR = [
  { id: 'ust', tr: 'Üst', en: 'Tops' },
  { id: 'alt', tr: 'Alt', en: 'Bottoms' },
  { id: 'tek', tr: 'Elbise', en: 'Dresses' },
  { id: 'dis', tr: 'Dış giyim', en: 'Outerwear' },
  { id: 'ayk', tr: 'Ayakkabı', en: 'Shoes' },
  { id: 'aks', tr: 'Aksesuar', en: 'Accessories' },
  { id: 'ic', tr: 'İç giyim', en: 'Underwear' }
];
var TURLER = [
  { id: 'tisort', g: 'ust', tr: 'Tişört', en: 'T-shirt', s: 'gp', w: 1, k: 1 },
  { id: 'bluz', g: 'ust', tr: 'Bluz', en: 'Blouse', s: 'gs', w: 1, k: 1 },
  { id: 'gomlek', g: 'ust', tr: 'Gömlek', en: 'Shirt', s: 'gsr', w: 1.5, k: 2 },
  { id: 'askili', g: 'ust', tr: 'Askılı / atlet', en: 'Tank top', s: 'gp', w: 0.3, k: 0 },
  { id: 'kazak', g: 'ust', tr: 'Kazak', en: 'Sweater', s: 'gs', w: 3, k: 2 },
  { id: 'sweat', g: 'ust', tr: 'Sweatshirt', en: 'Sweatshirt', s: 'gp', w: 2.5, k: 2 },
  { id: 'tunik', g: 'ust', tr: 'Tunik', en: 'Tunic', s: 'gs', w: 1.6, k: 2 },
  { id: 'kumas', g: 'alt', tr: 'Kumaş pantolon', en: 'Trousers', s: 'sr', w: 1, k: 2 },
  { id: 'kot', g: 'alt', tr: 'Kot pantolon', en: 'Jeans', s: 'g', w: 1.1, k: 2 },
  { id: 'etek', g: 'alt', tr: 'Etek', en: 'Skirt', s: 'gs', w: 0.5, k: 1 },
  { id: 'uzunetek', g: 'alt', tr: 'Uzun etek', en: 'Long skirt', s: 'gsr', w: 1, k: 2 },
  { id: 'sort', g: 'alt', tr: 'Şort', en: 'Shorts', s: 'gp', w: 0.1, k: 0 },
  { id: 'tayt', g: 'alt', tr: 'Tayt', en: 'Leggings', s: 'pg', w: 1, k: 2 },
  { id: 'esofman', g: 'alt', tr: 'Eşofman altı', en: 'Joggers', s: 'p', w: 1.2, k: 2 },
  { id: 'elbise', g: 'tek', tr: 'Elbise', en: 'Dress', s: 'gs', w: 1.3, k: 1 },
  { id: 'uzunelbise', g: 'tek', tr: 'Uzun elbise', en: 'Maxi dress', s: 'gsr', w: 2, k: 2 },
  { id: 'tulum', g: 'tek', tr: 'Tulum', en: 'Jumpsuit', s: 'gs', w: 2.1, k: 2 },
  { id: 'ferace', g: 'tek', tr: 'Ferace / abaya', en: 'Abaya', s: 'gsr', w: 3, k: 2 },
  { id: 'hirka', g: 'dis', tr: 'Hırka', en: 'Cardigan', s: 'g', w: 1.5, k: 2, kat: 1 },
  { id: 'yelek', g: 'dis', tr: 'Yelek', en: 'Vest', s: 'gs', w: 0.7, k: 1, kat: 1 },
  { id: 'blazer', g: 'dis', tr: 'Blazer ceket', en: 'Blazer', s: 'sr', w: 1.4, k: 2, kat: 1 },
  { id: 'ceket', g: 'dis', tr: 'Ceket', en: 'Jacket', s: 'gs', w: 2, k: 2 },
  { id: 'tren', g: 'dis', tr: 'Trençkot / pardösü', en: 'Trench coat', s: 'gsr', w: 2.5, k: 2, su: 1 },
  { id: 'yagmurluk', g: 'dis', tr: 'Yağmurluk', en: 'Raincoat', s: 'gp', w: 1.3, k: 2, su: 1 },
  { id: 'mont', g: 'dis', tr: 'Mont', en: 'Puffer / parka', s: 'gp', w: 4, k: 2, su: 1 },
  { id: 'kaban', g: 'dis', tr: 'Kaban', en: 'Wool coat', s: 'gsr', w: 4.5, k: 2 },
  { id: 'spor', g: 'ayk', tr: 'Spor ayakkabı', en: 'Sneakers', s: 'pg' },
  { id: 'babet', g: 'ayk', tr: 'Babet / loafer', en: 'Flats / loafers', s: 'gsr' },
  { id: 'topuklu', g: 'ayk', tr: 'Topuklu', en: 'Heels', s: 'sr' },
  { id: 'bot', g: 'ayk', tr: 'Bot / çizme', en: 'Boots', s: 'gs', su: 1 },
  { id: 'sandalet', g: 'ayk', tr: 'Sandalet', en: 'Sandals', s: 'gs', ac: 1 },
  { id: 'terlik', g: 'ayk', tr: 'Terlik', en: 'Slides', s: 'g', ac: 1 },
  { id: 'canta', g: 'aks', tr: 'Çanta', en: 'Bag', s: 'gspr' },
  { id: 'esarp', g: 'aks', tr: 'Eşarp / şal', en: 'Headscarf / shawl', s: 'gsr' },
  { id: 'atki', g: 'aks', tr: 'Atkı', en: 'Scarf', s: 'gs' },
  { id: 'bere', g: 'aks', tr: 'Bere / şapka', en: 'Hat / beanie', s: 'gp' },
  { id: 'eldiven', g: 'aks', tr: 'Eldiven', en: 'Gloves', s: 'gs' },
  { id: 'gozluk', g: 'aks', tr: 'Güneş gözlüğü', en: 'Sunglasses', s: 'gs' },
  { id: 'kemer', g: 'aks', tr: 'Kemer', en: 'Belt', s: 'gsr' },
  { id: 'taki', g: 'aks', tr: 'Takı', en: 'Jewelry', s: 'gsr' },
  { id: 'kulot', g: 'ic', tr: 'Külot', en: 'Briefs' },
  { id: 'sutyen', g: 'ic', tr: 'Sütyen', en: 'Bra' },
  { id: 'corap', g: 'ic', tr: 'Çorap', en: 'Socks' },
  { id: 'kulotlu', g: 'ic', tr: 'Külotlu çorap', en: 'Tights' }
];
var TUR = Object.create(null); TURLER.forEach(function (x) { TUR[x.id] = x; });
var TARZLAR = ['g', 's', 'r', 'p'];

/* ---------- Renk paleti ---------- */
var RENKLER = [
  ['siyah', '#1E1D21', 'Siyah', 'Black', 1], ['antrasit', '#3D3E44', 'Antrasit', 'Charcoal', 1],
  ['gri', '#8E8D93', 'Gri', 'Grey', 1], ['acikgri', '#C9C8CC', 'Açık gri', 'Light grey', 1],
  ['beyaz', '#F5F4F1', 'Beyaz', 'White', 1], ['krem', '#EEE4CF', 'Krem', 'Cream', 1],
  ['bej', '#D3BF9E', 'Bej', 'Beige', 1], ['taba', '#AE7A4B', 'Taba', 'Camel', 1],
  ['kahve', '#674430', 'Kahverengi', 'Brown', 1], ['lacivert', '#1F2A47', 'Lacivert', 'Navy', 1],
  ['kot', '#4B6C8C', 'Kot mavisi', 'Denim', 1], ['haki', '#7C7A4E', 'Haki', 'Khaki', 0],
  ['zeytin', '#55552C', 'Zeytin yeşili', 'Olive', 0], ['bordo', '#6C1F2F', 'Bordo', 'Burgundy', 0],
  ['kirmizi', '#C62A3B', 'Kırmızı', 'Red', 0], ['pembe', '#E58BA7', 'Pembe', 'Pink', 0],
  ['pudra', '#E7C3C2', 'Pudra', 'Blush', 0], ['fusya', '#C0307A', 'Fuşya', 'Fuchsia', 0],
  ['mor', '#69408E', 'Mor', 'Purple', 0], ['lila', '#B8A2D5', 'Lila', 'Lilac', 0],
  ['mavi', '#2F62AF', 'Mavi', 'Blue', 0], ['acikmavi', '#9CC2E5', 'Açık mavi', 'Light blue', 0],
  ['turkuaz', '#2BA5A5', 'Turkuaz', 'Teal', 0], ['yesil', '#2F7C4A', 'Yeşil', 'Green', 0],
  ['mint', '#A9DBC1', 'Mint', 'Mint', 0], ['sari', '#E7C23A', 'Sarı', 'Yellow', 0],
  ['hardal', '#C39A2B', 'Hardal', 'Mustard', 0], ['turuncu', '#DF742D', 'Turuncu', 'Orange', 0],
  ['somon', '#EF967B', 'Somon', 'Salmon', 0]
];
var RENK = Object.create(null); RENKLER.forEach(function (r) { RENK[r[0]] = { id: r[0], hex: r[1], tr: r[2], en: r[3], notr: !!r[4] }; });
var ACIK_RENKLER = { beyaz: 1, krem: 1, acikgri: 1, pudra: 1, bej: 1, acikmavi: 1, mint: 1 };
var KOYU_SADE = { siyah: 1, antrasit: 1, lacivert: 1, gri: 1, kahve: 1, bordo: 1 };

/* ---------- Şehirler (konum izni yoksa seçilir; ad gösterimi için en yakını bulunur) ---------- */
var SEHIRLER = 'Adana,37.00,35.32;Adıyaman,37.76,38.28;Afyonkarahisar,38.76,30.54;Ağrı,39.72,43.05;Amasya,40.65,35.83;Ankara,39.93,32.86;Antalya,36.89,30.71;Artvin,41.18,41.82;Aydın,37.85,27.85;Balıkesir,39.65,27.88;Bilecik,40.14,29.98;Bingöl,38.88,40.50;Bitlis,38.40,42.11;Bolu,40.73,31.61;Burdur,37.72,30.29;Bursa,40.19,29.06;Çanakkale,40.15,26.41;Çankırı,40.60,33.62;Çorum,40.55,34.95;Denizli,37.78,29.09;Diyarbakır,37.91,40.24;Edirne,41.68,26.56;Elazığ,38.68,39.22;Erzincan,39.75,39.49;Erzurum,39.90,41.27;Eskişehir,39.78,30.52;Gaziantep,37.07,37.38;Giresun,40.91,38.39;Gümüşhane,40.46,39.48;Hakkari,37.58,43.74;Hatay,36.20,36.16;Isparta,37.76,30.55;Mersin,36.81,34.64;İstanbul,41.01,28.98;İzmir,38.42,27.14;Kars,40.60,43.10;Kastamonu,41.38,33.78;Kayseri,38.73,35.49;Kırklareli,41.73,27.22;Kırşehir,39.15,34.17;Kocaeli,40.77,29.92;Konya,37.87,32.48;Kütahya,39.42,29.98;Malatya,38.35,38.31;Manisa,38.61,27.43;Kahramanmaraş,37.58,36.94;Mardin,37.31,40.74;Muğla,37.22,28.36;Muş,38.75,41.49;Nevşehir,38.62,34.71;Niğde,37.97,34.68;Ordu,40.98,37.88;Rize,41.02,40.52;Sakarya,40.78,30.40;Samsun,41.29,36.33;Siirt,37.93,41.94;Sinop,42.03,35.15;Sivas,39.75,37.02;Tekirdağ,40.98,27.51;Tokat,40.31,36.55;Trabzon,41.00,39.72;Tunceli,39.11,39.55;Şanlıurfa,37.16,38.80;Uşak,38.68,29.41;Van,38.49,43.38;Yozgat,39.82,34.81;Zonguldak,41.45,31.79;Aksaray,38.37,34.03;Bayburt,40.26,40.23;Karaman,37.18,33.22;Kırıkkale,39.85,33.51;Batman,37.88,41.13;Şırnak,37.52,42.46;Bartın,41.63,32.34;Ardahan,41.11,42.70;Iğdır,39.92,44.04;Yalova,40.66,29.27;Karabük,41.20,32.62;Kilis,36.72,37.12;Osmaniye,37.07,36.25;Düzce,40.84,31.16;Lefkoşa,35.19,33.38;Bakü,40.41,49.87;Tiflis,41.72,44.79;Taşkent,41.30,69.24;London,51.51,-0.13;Paris,48.86,2.35;Berlin,52.52,13.40;München,48.14,11.58;Frankfurt,50.11,8.68;Köln,50.94,6.96;Hamburg,53.55,9.99;Amsterdam,52.37,4.90;Brussels,50.85,4.35;Wien,48.21,16.37;Zürich,47.38,8.54;Roma,41.90,12.50;Milano,45.46,9.19;Madrid,40.42,-3.70;Barcelona,41.39,2.17;Athens,37.98,23.73;Sofia,42.70,23.32;Stockholm,59.33,18.07;København,55.68,12.57;Moscow,55.76,37.62;Dubai,25.20,55.27;Doha,25.29,51.53;Riyadh,24.71,46.68;Cairo,30.04,31.24;New York,40.71,-74.01;Los Angeles,34.05,-118.24;Toronto,43.65,-79.38;Sydney,-33.87,151.21;Tokyo,35.68,139.69;Seoul,37.57,126.98'
  .split(';').map(function (s) { var p = s.split(','); return { ad: p[0], lat: +p[1], lon: +p[2] }; });

function mesafeKm(a, b, c, d) {
  var R = 6371, r = Math.PI / 180, x = (c - a) * r, y = (d - b) * r;
  var q = Math.sin(x / 2) * Math.sin(x / 2) + Math.cos(a * r) * Math.cos(c * r) * Math.sin(y / 2) * Math.sin(y / 2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(q)));
}
function enYakinSehir(lat, lon) {
  var en = null, m = 1e9;
  SEHIRLER.forEach(function (s) { var k = mesafeKm(lat, lon, s.lat, s.lon); if (k < m) { m = k; en = s; } });
  return m <= 60 ? en.ad : '';
}

/* ---------- Ortam profilleri (yazılan cümleden çıkarılır) ----------
   f: hedef tarz, tercih/kac: tür puanları, kirli: kirlenebilir ortam,
   rahat: rahat ayakkabı, koyu: koyu/sade renk, ac: açık ayakkabıya izin */
var ORTAMLAR = {
  is: { tr: 'İş / toplantı', en: 'Work / meeting', f: 'r',
    k: 'toplantı toplanti iş ofis ofise mülakat mulakat sunum görüşme gorusme müşteri musteri işe mesai patron yönetim konferans seminer meeting office interview work presentation client conference',
    tercih: { gomlek: 2.5, kumas: 2.5, blazer: 3, babet: 2, topuklu: 1, kaban: 1, tren: 1.5, bluz: 1, uzunetek: 1, tunik: 1 },
    kac: { esofman: -9, tayt: -6, sort: -10, sweat: -6, terlik: -12, spor: -3, askili: -8, mont: -1, yagmurluk: -1 } },
  davet: { tr: 'Davet / düğün', en: 'Party / wedding', f: 's',
    k: 'düğün dugun nişan nisan kına kina davet gala parti mezuniyet balo kokteyl doğum dogum nikah wedding party gala prom cocktail birthday engagement',
    tercih: { elbise: 3, uzunelbise: 3.5, topuklu: 3, blazer: 1, bluz: 1.5, kaban: 1, tren: 0.5, taki: 1, uzunetek: 1.5 },
    kac: { esofman: -12, tayt: -8, sort: -6, sweat: -8, terlik: -12, spor: -6, kot: -2, mont: -2, yagmurluk: -3 } },
  randevu: { tr: 'Randevu / akşam yemeği', en: 'Date / dinner', f: 's',
    k: 'randevu buluşma bulusma yemeği yemegi yemek restoran restorana sevgili date dinner restaurant',
    tercih: { elbise: 2, bluz: 2, topuklu: 1.5, babet: 1, kot: 0.5, blazer: 1, uzunelbise: 1 },
    kac: { esofman: -10, tayt: -4, sweat: -4, terlik: -10, yagmurluk: -1 } },
  pratik: { tr: 'Barınak / temizlik', en: 'Shelter / chores', f: 'g', kirli: 1, rahat: 1,
    k: 'barınak barinak barınağa barinaga hayvan hayvanlar köpek kopek kedi bahçe bahce temizlik taşınma tasinma boya tamir çiftlik ciftlik tarla gönüllü gonullu ahır ahir mangal shelter animal animals dog cat garden cleaning moving farm volunteer',
    tercih: { kot: 2.5, esofman: 2, tayt: 1, sweat: 2, tisort: 1.5, spor: 3, bot: 2.5, mont: 1, yagmurluk: 1, hirka: 0.5 },
    kac: { topuklu: -14, sandalet: -10, terlik: -10, babet: -4, elbise: -5, uzunelbise: -6, etek: -5, uzunetek: -4, blazer: -6, kaban: -2, bluz: -2, gomlek: -1, kumas: -3, ferace: -3, tren: -2 } },
  spor: { tr: 'Spor', en: 'Workout', f: 'p', rahat: 1,
    k: 'spor koşu kosu fitness yoga pilates bisiklet antrenman jimnastik gym run running workout cycling training',
    tercih: { tayt: 3, esofman: 3, tisort: 2, sweat: 2, spor: 4, askili: 1, yagmurluk: 1, mont: 0.5 },
    kac: { topuklu: -14, babet: -8, sandalet: -8, terlik: -8, elbise: -10, uzunelbise: -10, etek: -8, uzunetek: -8, kumas: -8, blazer: -10, kaban: -8, gomlek: -6, bluz: -6, tren: -6, kot: -3, ferace: -6, tunik: -3 } },
  doga: { tr: 'Doğa / yürüyüş', en: 'Outdoors / hike', f: 'g', kirli: 1, rahat: 1,
    k: 'doğa doga kamp piknik orman dağ dag yürüyüş yuruyus trekking yayla göl gol camping picnic hike hiking forest mountain',
    tercih: { kot: 1.5, esofman: 1.5, tayt: 1.5, sweat: 1.5, tisort: 1.5, spor: 3.5, bot: 3, mont: 1, yagmurluk: 1.5, hirka: 1 },
    kac: { topuklu: -14, sandalet: -5, terlik: -8, babet: -6, elbise: -3, uzunelbise: -4, etek: -3, blazer: -8, kaban: -3, kumas: -4, gomlek: -1 } },
  seyahat: { tr: 'Seyahat', en: 'Travel', f: 'g', rahat: 1,
    k: 'seyahat yolculuk uçak ucak otobüs otobus tren yolculuğu tatil gezi havalimanı havalimani yola travel flight trip airport journey vacation',
    tercih: { kot: 1.5, tisort: 1, hirka: 2, sweat: 1, spor: 2.5, babet: 1, tayt: 1, mont: 0.5, tren: 1 },
    kac: { topuklu: -8, terlik: -4, sandalet: -1 } },
  okul: { tr: 'Okul / ders', en: 'School / class', f: 'g',
    k: 'okul ders üniversite universite kampüs kampus sınav sinav kurs fakülte fakulte kütüphane kutuphane school class university campus exam library course',
    tercih: { kot: 1.5, tisort: 1, sweat: 1, kazak: 1, spor: 1.5, hirka: 1 },
    kac: { topuklu: -4, terlik: -8, uzunelbise: -2 } },
  plaj: { tr: 'Plaj / havuz', en: 'Beach / pool', f: 'g', ac: 1,
    k: 'plaj deniz havuz sahil kumsal tekne beach pool seaside boat',
    tercih: { sandalet: 3, terlik: 2.5, sort: 2, elbise: 1.5, askili: 1.5, tisort: 1, gozluk: 2, bere: 1 },
    kac: { bot: -8, topuklu: -8, kaban: -12, mont: -12, kazak: -6, kumas: -4, blazer: -6, tren: -6 } },
  ev: { tr: 'Evde', en: 'At home', f: 'g', ac: 1, rahat: 1,
    k: 'evde evdeyim eve evden home',
    tercih: { esofman: 2, tayt: 1.5, tisort: 1.5, sweat: 1.5, hirka: 1.5, terlik: 3 },
    kac: { topuklu: -8, kaban: -10, mont: -10, tren: -8, blazer: -4, bot: -6 } },
  taziye: { tr: 'Taziye', en: 'Condolence', f: 'r', koyu: 1,
    k: 'cenaze taziye mevlit mevlüt mevlut yas başsağlığı bassagligi funeral condolence memorial',
    tercih: { kumas: 2, gomlek: 1.5, uzunetek: 2, uzunelbise: 1.5, kaban: 1, babet: 2, ferace: 1, tunik: 1 },
    kac: { sort: -12, askili: -10, esofman: -10, terlik: -12, spor: -4, sandalet: -6, tayt: -6, topuklu: -2 } },
  gunluk: { tr: 'Günlük', en: 'Everyday', f: 'g',
    k: 'alışveriş alisveris kahve arkadaş arkadas arkadaşlarla gezmek gezme market avm sinema çarşı carsi dışarı disari shopping coffee friends mall cinema errands',
    tercih: { kot: 1, tisort: 0.5, spor: 1, babet: 0.5, hirka: 0.5 },
    kac: { terlik: -6 } }
};
Object.setPrototypeOf(ORTAMLAR, null);
var ORTAM_SIRA = ['is', 'gunluk', 'davet', 'randevu', 'spor', 'pratik', 'doga', 'seyahat', 'okul', 'plaj', 'ev', 'taziye'];
