/* Kıyafet türü, renk, ortam, grup ve mevsim adlarının Rusça ve Özbekçe karşılıkları */
var AD_DIL = {
  ru: {
    tur: { polo: 'Поло', takim: 'Пиджак от костюма', kravat: 'Галстук / бабочка', tisort: 'Футболка', bluz: 'Блузка', gomlek: 'Рубашка', askili: 'Майка', kazak: 'Свитер', sweat: 'Свитшот', tunik: 'Туника', kumas: 'Брюки', kot: 'Джинсы', etek: 'Юбка', uzunetek: 'Длинная юбка',
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
    tur: { polo: 'Polo futbolka', takim: 'Kostyum pidjagi', kravat: "Galstuk / bo'yinbog'", tisort: 'Futbolka', bluz: 'Bluzka', gomlek: "Ko'ylak (erkakcha)", askili: 'Mayka', kazak: 'Sviter', sweat: 'Svitshot', tunik: 'Tunika', kumas: 'Shim', kot: 'Jinsi', etek: 'Yubka', uzunetek: 'Uzun yubka',
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
  },
  ko: {
    tur: { polo: '폴로 셔츠', takim: '정장 재킷', kravat: '넥타이 / 나비넥타이', tisort: '티셔츠', bluz: '블라우스', gomlek: '셔츠', askili: '민소매 / 나시', kazak: '스웨터', sweat: '맨투맨', tunik: '튜닉', kumas: '슬랙스', kot: '청바지',
      etek: '치마', uzunetek: '롱스커트', sort: '반바지', tayt: '레깅스', esofman: '트레이닝 바지', elbise: '원피스', uzunelbise: '맥시 원피스', tulum: '점프수트', ferace: '아바야', hirka: '카디건', yelek: '조끼',
      blazer: '블레이저', ceket: '재킷', tren: '트렌치코트', yagmurluk: '레인코트', mont: '패딩 / 파카', kaban: '울 코트', spor: '스니커즈', babet: '플랫슈즈', loafer: '로퍼', topuklu: '힐', bot: '부츠',
      sandalet: '샌들', terlik: '슬리퍼', canta: '가방', esarp: '스카프 / 숄', atki: '목도리', bere: '모자 / 비니', eldiven: '장갑', gozluk: '선글라스', kemer: '벨트', kupe: '귀걸이', kolye: '목걸이',
      bileklik: '팔찌 / 반지', saat: '시계', taki: '기타 주얼리', kulot: '팬티', sutyen: '브래지어', corap: '양말', kulotlu: '스타킹' },
    renk: { siyah: '검정', antrasit: '차콜', gri: '회색', acikgri: '연회색', beyaz: '흰색', krem: '크림', bej: '베이지', taba: '카멜', kahve: '갈색', lacivert: '네이비', kot: '데님', haki: '카키',
      zeytin: '올리브', bordo: '버건디', kirmizi: '빨강', pembe: '분홍', pudra: '파우더 핑크', fusya: '푸시아', mor: '보라', lila: '라일락', mavi: '파랑', acikmavi: '하늘색', turkuaz: '청록', yesil: '초록',
      mint: '민트', sari: '노랑', hardal: '머스터드', turuncu: '주황', somon: '연어색' },
    ortam: { is: '출근 / 회의', davet: '행사 / 결혼식', randevu: '데이트 / 저녁 식사', pratik: '봉사 / 집안일', spor: '운동', doga: '자연 / 등산', seyahat: '여행', okul: '학교', plaj: '해변 / 수영장', ev: '집', taziye: '조문', gunluk: '일상' },
    grup: { ust: '상의', alt: '하의', tek: '원피스', dis: '아우터', ayk: '신발', aks: '액세서리', ic: '속옷' },
    mevsim: { i: '봄', y: '여름', s: '가을', k: '겨울' }
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
    is: 'работ офис встреч собеседован совещан презентац клиент ish ofis uchrashuv majlis suhbat taqdimot 출근 회의 사무실 면접 발표',
    davet: 'свадьб праздник вечеринк банкет торжеств юбилей to\'y toy bayram ziyofat tantana nikoh 결혼식 파티 행사 돌잔치 축하',
    randevu: 'свидан ужин ресторан романтич kechki restoran uchrashuvga 데이트 저녁 레스토랑',
    pratik: 'приют убор животн собак кошк ремонт boshpana tozalash hayvon itlar mushuk 봉사 청소 이사',
    spor: 'спорт трениров зал фитнес бег йог sport mashg yugur zal fitnes 운동 헬스 요가 러닝',
    doga: 'поход природ лес гор пикник tabiat tog o\'rmon piknik 등산 캠핑 피크닉 산',
    seyahat: 'поездк путешеств самолёт самолет аэропорт отпуск safar sayohat samolyot aeroport 여행 공항 비행기 휴가',
    okul: 'школ университет учёб учеб лекци maktab universitet dars o\'qish 학교 대학 수업 강의',
    plaj: 'пляж мор бассейн plyaj dengiz hovuz 해변 바다 수영장',
    ev: 'дома домашн uyda uy 집에서',
    taziye: 'похорон соболезнован поминк ta\'ziya janoza 장례식 조문',
    gunluk: 'прогулк кафе магазин шопинг каждый sayr kafe do\'kon xarid 산책 카페 쇼핑'
  };
  Object.keys(ek).forEach(function (id) { if (ORTAMLAR[id]) ORTAMLAR[id].k += ' ' + ek[id]; });
})();
