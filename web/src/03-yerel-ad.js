/* Kıyafet türü, renk, ortam, grup ve mevsim adlarının Rusça ve Özbekçe karşılıkları */
var AD_DIL = {
  ru: {
    tur: { tisort: 'Футболка', bluz: 'Блузка', gomlek: 'Рубашка', askili: 'Майка', kazak: 'Свитер', sweat: 'Свитшот', tunik: 'Туника', kumas: 'Брюки', kot: 'Джинсы', etek: 'Юбка', uzunetek: 'Длинная юбка',
      sort: 'Шорты', tayt: 'Леггинсы', esofman: 'Спортивные брюки', elbise: 'Платье', uzunelbise: 'Макси-платье', tulum: 'Комбинезон', ferace: 'Абайя', hirka: 'Кардиган', yelek: 'Жилет', blazer: 'Блейзер', ceket: 'Жакет',
      tren: 'Тренч', yagmurluk: 'Дождевик', mont: 'Пуховик / парка', kaban: 'Шерстяное пальто', spor: 'Кроссовки', babet: 'Балетки', loafer: 'Лоферы', topuklu: 'Туфли на каблуке', bot: 'Ботинки / сапоги', sandalet: 'Сандалии', terlik: 'Шлёпанцы',
      canta: 'Сумка', esarp: 'Платок / палантин', atki: 'Шарф', bere: 'Шапка / берет', eldiven: 'Перчатки', gozluk: 'Солнцезащитные очки', kemer: 'Ремень', kupe: 'Серьги', kolye: 'Колье', bileklik: 'Браслет / кольцо', saat: 'Часы', taki: 'Другие украшения',
      kulot: 'Трусики', sutyen: 'Бюстгальтер', corap: 'Носки', kulotlu: 'Колготки' },
    renk: { siyah: 'Чёрный', antrasit: 'Антрацит', gri: 'Серый', acikgri: 'Светло-серый', beyaz: 'Белый', krem: 'Кремовый', bej: 'Бежевый', taba: 'Карамельный', kahve: 'Коричневый', lacivert: 'Тёмно-синий', kot: 'Джинсовый', haki: 'Хаки',
      zeytin: 'Оливковый', bordo: 'Бордовый', kirmizi: 'Красный', pembe: 'Розовый', pudra: 'Пудровый', fusya: 'Фуксия', mor: 'Фиолетовый', lila: 'Сиреневый', mavi: 'Синий', acikmavi: 'Голубой', turkuaz: 'Бирюзовый', yesil: 'Зелёный',
      mint: 'Мятный', sari: 'Жёлтый', hardal: 'Горчичный', turuncu: 'Оранжевый', somon: 'Лососевый' },
    ortam: { is: 'Работа / встреча', davet: 'Праздник / свадьба', randevu: 'Свидание / ужин', pratik: 'Приют / хлопоты', spor: 'Тренировка', doga: 'Природа / поход', seyahat: 'Поездка', okul: 'Учёба', plaj: 'Пляж / бассейн', ev: 'Дома', taziye: 'Соболезнование', gunluk: 'Повседневно' },
    grup: { ust: 'Верх', alt: 'Низ', tek: 'Платья', dis: 'Верхняя одежда', ayk: 'Обувь', aks: 'Аксессуары', ic: 'Бельё' },
    mevsim: { i: 'Весна', y: 'Лето', s: 'Осень', k: 'Зима' }
  },
  uz: {
    tur: { tisort: 'Futbolka', bluz: 'Bluzka', gomlek: "Ko'ylak (erkakcha)", askili: 'Mayka', kazak: 'Sviter', sweat: 'Svitshot', tunik: 'Tunika', kumas: 'Shim', kot: 'Jinsi', etek: 'Yubka', uzunetek: 'Uzun yubka',
      sort: 'Shorti', tayt: 'Legginsi', esofman: 'Sport shim', elbise: "Ko'ylak", uzunelbise: "Uzun ko'ylak", tulum: 'Kombinezon', ferace: 'Abaya', hirka: 'Kardigan', yelek: 'Jilet', blazer: 'Blezer', ceket: 'Jaket',
      tren: 'Trench', yagmurluk: "Yomg'irpo'sh", mont: 'Kurtka / parka', kaban: 'Jun palto', spor: 'Krossovka', babet: 'Balet tufli', loafer: 'Lofer', topuklu: 'Poshnali tufli', bot: 'Etik / botinka', sandalet: 'Sandal', terlik: 'Shippak',
      canta: 'Sumka', esarp: "Ro'mol / shol", atki: 'Sharf', bere: 'Shapka / beret', eldiven: "Qo'lqop", gozluk: "Quyosh ko'zoynagi", kemer: 'Kamar', kupe: "Sirg'a", kolye: 'Marjon', bileklik: 'Bilaguzuk / uzuk', saat: 'Soat', taki: 'Boshqa taqinchoq',
      kulot: 'Ichki kiyim', sutyen: 'Byustgalter', corap: 'Paypoq', kulotlu: 'Kolgotki' },
    renk: { siyah: 'Qora', antrasit: "To'q kulrang", gri: 'Kulrang', acikgri: 'Och kulrang', beyaz: 'Oq', krem: 'Krem', bej: 'Bej', taba: 'Karamel', kahve: 'Jigarrang', lacivert: "To'q ko'k", kot: 'Jinsi rang', haki: 'Xaki',
      zeytin: 'Zaytun', bordo: "To'q qizil", kirmizi: 'Qizil', pembe: 'Pushti', pudra: 'Pudra', fusya: 'Fuksiya', mor: 'Binafsha', lila: 'Lila', mavi: "Ko'k", acikmavi: 'Havorang', turkuaz: 'Firuza', yesil: 'Yashil',
      mint: 'Yalpiz', sari: 'Sariq', hardal: 'Xantal', turuncu: "To'q sariq", somon: 'Losos' },
    ortam: { is: 'Ish / uchrashuv', davet: "Bayram / to'y", randevu: 'Uchrashuv / kechki ovqat', pratik: 'Boshpana / uy ishlari', spor: 'Mashg\'ulot', doga: 'Tabiat / sayohat', seyahat: 'Safar', okul: "O'qish", plaj: "Plyaj / hovuz", ev: 'Uyda', taziye: "Ta'ziya", gunluk: 'Kundalik' },
    grup: { ust: 'Ust', alt: 'Past', tek: "Ko'ylaklar", dis: 'Ustki kiyim', ayk: 'Poyabzal', aks: 'Aksessuarlar', ic: 'Ichki kiyim' },
    mevsim: { i: 'Bahor', y: 'Yoz', s: 'Kuz', k: 'Qish' }
  }
};
/* tr → Türkçe ad, en ve diğer diller → çeviri ya da İngilizce */
function yerelAd(tip, id, tr, en) {
  if (A.dil === 'tr') return tr;
  var d = AD_DIL[A.dil];
  if (d && d[tip] && d[tip][id]) return d[tip][id];
  return en || tr;
}
/* Rusça ve Özbekçe planlardan ortam tanıma (internetsiz) */
(function () {
  var ek = {
    is: 'работ офис встреч собеседован совещан презентац клиент ish ofis uchrashuv majlis suhbat taqdimot',
    davet: 'свадьб праздник вечеринк банкет торжеств юбилей to\'y toy bayram ziyofat tantana nikoh',
    randevu: 'свидан ужин ресторан романтич kechki restoran uchrashuvga',
    pratik: 'приют убор животн собак кошк ремонт boshpana tozalash hayvon itlar mushuk',
    spor: 'спорт трениров зал фитнес бег йог sport mashg yugur zal fitnes',
    doga: 'поход природ лес гор пикник tabiat tog o\'rmon piknik',
    seyahat: 'поездк путешеств самолёт самолет аэропорт отпуск safar sayohat samolyot aeroport',
    okul: 'школ университет учёб учеб лекци maktab universitet dars o\'qish',
    plaj: 'пляж мор бассейн plyaj dengiz hovuz',
    ev: 'дома домашн uyda uy',
    taziye: 'похорон соболезнован поминк ta\'ziya janoza',
    gunluk: 'прогулк кафе магазин шопинг каждый sayr kafe do\'kon xarid'
  };
  Object.keys(ek).forEach(function (id) { if (ORTAMLAR[id]) ORTAMLAR[id].k += ' ' + ek[id]; });
})();
