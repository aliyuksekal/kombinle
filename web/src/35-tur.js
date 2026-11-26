/* ---------- İlk kullanım turu, uygulamayı puanla / paylaş ---------- */
/* Karşılamadan sonra alt menüdeki bölümleri tek tek vurgulayan, atlanabilen ipucu turu.
   Ayarlar'dan tekrar açılabilir. */
var TUR_ACIK = false;
function turAdimlari() {
  return [
    ['#altMenu [data-sekme="bugun"]', 'tr1b', 'tr1m'],
    ['#altMenu [data-sekme="dolap"]', 'tr2b', 'tr2m'],
    ['#altMenu .ai-orta', 'prensesBaslik', 'tr3m'],
    ['#altMenu [data-sekme="kesfet"]', 'tr4b', 'tr4m'],
    ['#altMenu [data-sekme="ayarlar"]', 'tr5b', 'tr5m']
  ];
}
function turBaslat(zorla) {
  if (TUR_ACIK || !A.karsilandi) return;
  if (!zorla && LS.al('turBitti', false)) return;
  /* otomatik testlerde kendiliğinden açılıp ekranı kapatmasın */
  if (!zorla && navigator.webdriver && !window.TUR_SINAMA) return;
  if (document.querySelector('.perde')) return;
  var adimlar = turAdimlari().filter(function (a) { var e = document.querySelector(a[0]); return e && e.getBoundingClientRect().width > 0; });
  if (!adimlar.length) return;
  TUR_ACIK = true;
  var i = 0;
  var katman = h('div', { class: 'tur', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('turBaslat') });
  var delik = h('div', { class: 'tur-delik' });
  var kutu = h('div', { class: 'tur-kutu' });
  katman.appendChild(delik); katman.appendChild(kutu);
  document.body.appendChild(katman);
  function bitir() { TUR_ACIK = false; LS.yaz('turBitti', true); window.removeEventListener('resize', yerlestir); if (katman.parentNode) katman.parentNode.removeChild(katman); }
  function yerlestir() {
    var a = adimlar[i], e = document.querySelector(a[0]);
    if (!e) { bitir(); return; }
    var r = e.getBoundingClientRect(), p = 6, son = i === adimlar.length - 1;
    delik.style.left = (r.left - p) + 'px'; delik.style.top = (r.top - p) + 'px';
    delik.style.width = (r.width + p * 2) + 'px'; delik.style.height = (r.height + p * 2) + 'px';
    temizle(kutu);
    kutu.appendChild(h('div', { class: 'tur-sayac', text: (i + 1) + ' / ' + adimlar.length }));
    kutu.appendChild(h('b', { class: 'tur-baslik', text: t(a[1]) }));
    kutu.appendChild(h('p', { text: t(a[2]) }));
    kutu.appendChild(h('div', { class: 'tur-dugmeler' },
      son ? h('span') : h('button', { class: 'btn ikincil', on: { click: bitir }, text: t('turGec') }),
      h('button', { class: 'btn ana', on: { click: function () { if (son) bitir(); else { i++; yerlestir(); } } }, text: t(son ? 'turTamam' : 'turSonraki') })));
    /* hedef alt menüde: kutu hedefin üstüne */
    kutu.style.bottom = (window.innerHeight - r.top + 14) + 'px';
  }
  window.addEventListener('resize', yerlestir);
  yerlestir();
}
function uygulamayiPuanla() {
  olay('puanla');
  try { if (YEREL && typeof YEREL.ac === 'function') { YEREL.ac(PLAY_ADRES); return; } } catch (e) { }
  try { window.open(PLAY_ADRES, '_blank', 'noopener,noreferrer'); } catch (e2) { }
}
/* karşılama bitince turu başlat */
(function () {
  var once = A.karsilandi;
  setInterval(function () {
    if (!once && A.karsilandi) { once = true; setTimeout(function () { turBaslat(false); }, 3200); }
  }, 500);
  if (once) setTimeout(function () { turBaslat(false); }, 1500);
})();
(function () {
  var st = document.createElement('style');
  st.textContent = '.tur{position:fixed;inset:0;z-index:9000}' +
    '.tur-delik{position:fixed;border-radius:18px;box-shadow:0 0 0 9999px rgba(0,0,0,.6);outline:2px solid var(--vurgu);transition:all .25s ease;pointer-events:none}' +
    '.tur-kutu{position:fixed;left:16px;right:16px;max-width:520px;margin:0 auto;background:var(--yuzey);color:var(--murekkep);border-radius:20px;padding:16px 18px 14px;box-shadow:0 12px 40px rgba(0,0,0,.35)}' +
    '.tur-kutu p{margin:6px 0 12px;line-height:1.45;color:var(--soluk)}.tur-baslik{font-size:1.1rem;display:block;margin-top:2px}' +
    '.tur-sayac{font-size:12px;color:var(--soluk2)}.tur-dugmeler{display:flex;justify-content:space-between;gap:8px}' +
    '@media (prefers-reduced-motion:reduce){.tur-delik{transition:none}}';
  document.head.appendChild(st);
})();
Object.assign(DIL.tr, {
  turBaslat: 'Uygulama turunu başlat', turBaslatAlt: 'Bölümleri ipuçlarıyla tekrar göster', turGec: 'Turu geç', turSonraki: 'Sonraki', turTamam: 'Anladım',
  tr1b: 'Bugün', tr1m: 'Hava durumuna ve gününe göre kombin önerisi burada. Nereye gideceğini yaz ya da söyle.',
  tr2b: 'Dolabım', tr2m: 'Kıyafetlerinin fotoğrafını çek ya da galeriden ekle; türünü ve rengini otomatik tanırım.',
  tr3b: 'Kombinle AI', tr3m: 'Stil asistanınla sohbet et: “Bu akşam yemeğe ne giyeyim?” diye sor.',
  tr4b: 'Keşfet', tr4m: 'Topluluğun kombinlerine bak, kendininkini paylaş, “A mı B mi?” diye sor.',
  tr5b: 'Ayarlar', tr5m: 'Tema, dil, konum, yedekleme; uygulamayı puanlama ve paylaşma burada. Bu turu da buradan açarsın.',
  puanlaBaslik: 'Uygulamayı puanla', puanlaAlt: 'Google Play’de yıldız ve yorum bırak',
  paylasBaslik: 'Uygulamayı paylaş', paylasAlt: 'WhatsApp ya da istediğin yerden öner'
});
Object.assign(DIL.en, {
  turBaslat: 'Start the app tour', turBaslatAlt: 'Show the sections again with tips', turGec: 'Skip tour', turSonraki: 'Next', turTamam: 'Got it',
  tr1b: 'Today', tr1m: 'Your outfit suggestion for the weather and your day. Type or say where you’re going.',
  tr2b: 'Wardrobe', tr2m: 'Snap your clothes or add them from the gallery; I recognise their type and colour automatically.',
  tr3b: 'Kombinle AI', tr3m: 'Chat with your style assistant: ask “What should I wear to dinner tonight?”',
  tr4b: 'Explore', tr4m: 'See the community’s outfits, share yours and ask “A or B?”.',
  tr5b: 'Settings', tr5m: 'Theme, language, location, backup, plus rating and sharing the app. You can reopen this tour here.',
  puanlaBaslik: 'Rate the app', puanlaAlt: 'Leave stars and a review on Google Play',
  paylasBaslik: 'Share the app', paylasAlt: 'Recommend it on WhatsApp or anywhere'
});
Object.assign(DIL.ru, {
  turBaslat: 'Экскурсия по приложению', turBaslatAlt: 'Снова показать разделы с подсказками', turGec: 'Пропустить', turSonraki: 'Далее', turTamam: 'Понятно',
  tr1b: 'Сегодня', tr1m: 'Образ по погоде и твоему дню. Напиши или скажи, куда идёшь.',
  tr2b: 'Гардероб', tr2m: 'Сфотографируй вещи или добавь из галереи — тип и цвет определятся сами.',
  tr3b: 'Kombinle AI', tr3m: 'Поговори со стилистом: спроси «Что надеть на ужин?»',
  tr4b: 'Лента', tr4m: 'Смотри образы сообщества, делись своими и спрашивай «A или B?».',
  tr5b: 'Настройки', tr5m: 'Тема, язык, место, резервная копия, оценка и рекомендация приложения. Здесь же можно снова открыть экскурсию.',
  puanlaBaslik: 'Оценить приложение', puanlaAlt: 'Оставь звёзды и отзыв в Google Play',
  paylasBaslik: 'Поделиться приложением', paylasAlt: 'Посоветуй в WhatsApp или где угодно'
});
Object.assign(DIL.uz, {
  turBaslat: 'Ilova bo‘ylab sayohat', turBaslatAlt: 'Bo‘limlarni maslahatlar bilan qayta ko‘rsatish', turGec: 'O‘tkazib yuborish', turSonraki: 'Keyingi', turTamam: 'Tushunarli',
  tr1b: 'Bugun', tr1m: 'Ob-havo va kuningga mos obraz shu yerda. Qayerga borishingni yoz yoki ayt.',
  tr2b: 'Garderob', tr2m: 'Kiyimlaringni suratga ol yoki galereyadan qo‘sh; turi va rangini o‘zim aniqlayman.',
  tr3b: 'Kombinle AI', tr3m: 'Stil yordamching bilan suhbatlash: “Kechki ovqatga nima kiyay?” deb so‘ra.',
  tr4b: 'Kashf et', tr4m: 'Hamjamiyat obrazlarini ko‘r, o‘zingnikini ulash, “A mi B mi?” deb so‘ra.',
  tr5b: 'Sozlamalar', tr5m: 'Mavzu, til, joylashuv, zaxira, ilovani baholash va ulashish shu yerda. Bu sayohatni ham shu yerdan ochasan.',
  puanlaBaslik: 'Ilovani baholash', puanlaAlt: 'Google Play’da yulduz va fikr qoldir',
  paylasBaslik: 'Ilovani ulashish', paylasAlt: 'WhatsApp yoki istalgan joyda tavsiya qil'
});
Object.assign(DIL.ko, {
  turBaslat: '앱 둘러보기 시작', turBaslatAlt: '팁과 함께 메뉴를 다시 보기', turGec: '건너뛰기', turSonraki: '다음', turTamam: '알겠어요',
  tr1b: '오늘', tr1m: '날씨와 일정에 맞는 코디 추천이 여기 있어요. 어디에 가는지 쓰거나 말해 주세요.',
  tr2b: '옷장', tr2m: '옷을 찍거나 갤러리에서 추가하세요. 종류와 색을 자동으로 알아봐요.',
  tr3b: 'Kombinle AI', tr3m: '스타일 도우미와 대화해 보세요: “오늘 저녁 모임에 뭘 입을까?”',
  tr4b: '탐색', tr4m: '커뮤니티 코디를 보고, 내 코디를 공유하고, “A 아니면 B?”를 물어보세요.',
  tr5b: '설정', tr5m: '테마, 언어, 위치, 백업, 앱 평가와 공유가 여기 있어요. 이 둘러보기도 여기서 다시 열 수 있어요.',
  puanlaBaslik: '앱 평가하기', puanlaAlt: 'Google Play에 별점과 리뷰 남기기',
  paylasBaslik: '앱 공유하기', paylasAlt: 'WhatsApp 등으로 추천하기'
});
