/* =========================================================
   34 - Keşfet'te kişi arama + geliştirici kayıt listesi
   Bu dosya web/src/ altına eklendiğinde build.py onu
   ([0-9][0-9]-*.js kalıbı) otomatik derler; başka bir
   değişiklik gerekmez.
   Sunucu tarafları: /v1/kisara ve /v1/kayitlar
   ========================================================= */

/* ---------- sözlük ---------- */
(function () {
  var SOZ = {
    tr: { kaBaslik: 'Kişi ara', kaYer: 'İsim veya @kullanıcı adı ara', kaBos: 'Aramak için en az 2 harf yaz', kaYok: 'Sonuç yok', glBaslik: 'Geliştirici', glKayitlar: 'Kayıtlı kullanıcılar', glDaha: 'Daha fazla yükle', glBos: 'Henüz kayıt yok' },
    en: { kaBaslik: 'Search people', kaYer: 'Search name or @username', kaBos: 'Type at least 2 characters', kaYok: 'No results', glBaslik: 'Developer', glKayitlar: 'Registered users', glDaha: 'Load more', glBos: 'No registrations yet' },
    ru: { kaBaslik: 'Поиск людей', kaYer: 'Имя или @имя пользователя', kaBos: 'Введи минимум 2 символа', kaYok: 'Никого не найдено', glBaslik: 'Разработчик', glKayitlar: 'Зарегистрированные', glDaha: 'Загрузить ещё', glBos: 'Пока нет регистраций' },
    uz: { kaBaslik: 'Odamlarni qidirish', kaYer: 'Ism yoki @foydalanuvchi', kaBos: 'Kamida 2 ta belgi yozing', kaYok: 'Hech kim topilmadi', glBaslik: 'Ishlab chiquvchi', glKayitlar: 'Ro‘yxatdan o‘tganlar', glDaha: 'Yana yuklash', glBos: 'Hozircha ro‘yxat yo‘q' },
    ko: { kaBaslik: '사람 검색', kaYer: '이름 또는 @사용자 이름 검색', kaBos: '2자 이상 입력하세요', kaYok: '결과 없음', glBaslik: '개발자', glKayitlar: '가입된 사용자', glDaha: '더 불러오기', glBos: '아직 가입자가 없어요' }
  };
  ['tr', 'en', 'ru', 'uz', 'ko'].forEach(function (d) { if (typeof DIL !== 'undefined' && DIL[d]) Object.assign(DIL[d], SOZ[d]); });
})();

/* ---------- Keşfet'teki arama çubuğu (akış düzenine dokunmaz) ---------- */
function kisiAraCubugu() {
  if (typeof yzKurulu === 'function' && !yzKurulu()) return null;
  return h('button', {
    class: 'g-girdi', style: { width: '100%', display: 'flex', gap: '8px', 'align-items': 'center', 'text-align': 'left' },
    'aria-label': t('kaBaslik'),
    on: { click: function () { kisiAraSayfasi(); } }
  }, ikon('kisi', 'k'), h('span', { text: t('kaYer') }));
}

function kisiAraSayfasi() {
  var sonuc = h('div', { class: 'tk-liste' });
  var durum = h('p', { class: 'alt-yazi', style: { 'text-align': 'center' } });
  var girdi = h('input', { class: 'g-girdi', type: 'search', maxlength: '30', placeholder: t('kaYer'), 'aria-label': t('kaBaslik'), 'data-odak': '1' });
  var sayac = null;
  var s = sayfaAc({ tam: true, baslik: t('kaBaslik'), icerik: h('div', null, girdi, durum, sonuc) });
  girdi.addEventListener('input', function () {
    clearTimeout(sayac);
    var q = kirp(girdi.value, 30);
    temizle(sonuc);
    if (q.replace(/\s/g, '').length < 2) { durum.textContent = t('kaBos'); return; }
    durum.textContent = '';
    sayac = setTimeout(function () {
      yzIste('/v1/kisara', { q: q }, 15000).then(function (v) {
        if (s.kapandi) return;
        temizle(sonuc);
        var l = Array.isArray(v.liste) ? v.liste.filter(function (k) { return k && /^[a-f0-9]{12}$/.test(k.kod) && typeof k.takma === 'string'; }) : [];
        if (!l.length) { durum.textContent = t('kaYok'); return; }
        l.forEach(function (k) {
          sonuc.appendChild(kisiSatiri(k, function () { s.kapat(); setTimeout(function () { profilSayfasi(k.kod, k); }, 250); }));
        });
      }).catch(function (e) { if (!s.kapandi) { temizle(sonuc); durum.textContent = hesapHataMetni(e); } });
    }, 300);
  });
  durum.textContent = t('kaBos');
}

/* ---------- Geliştirici: kayıt olan herkes (yalnız @admin) ---------- */
function gelistiriciSayfasi(imlec) {
  var liste = h('div', { class: 'tk-liste' });
  var durum = h('p', { class: 'alt-yazi', style: { 'text-align': 'center' } });
  function doldur(sonra) {
    yzIste('/v1/kayitlar', { sonra: sonra || 0 }, 20000).then(function (v) {
      durum.textContent = '';
      var l = (v && Array.isArray(v.liste)) ? v.liste : [];
      if (!sonra && !l.length) { durum.textContent = t('glBos'); return; }
      l.forEach(function (k) {
        var ac = k.kod ? function () { profilSayfasi(k.kod, { takma: k.takma, kadi: k.kadi, av: k.av || 0 }); } : null;
        liste.appendChild(h('div', { class: 'tk-satir' },
          h('button', { class: 'tk-ac', on: { click: ac } },
            avatarDoldur(h('span', { class: 'g-avatar' }), kisiAvatar(k.kod || '', k.av || 0, k.ad || '?'), k.ad || '?'),
            h('div', null,
              h('b', { text: kirp(k.ad || '?', 24) }),
              h('small', { text: (k.kadi ? k.kadi + ' • ' : '') + k.eposta + (k.kilit ? ' • 🔒' : '') + ' • ' + zamanOnce(k.zaman) })))));
      });
      if (v && !v.bitti) {
        liste.appendChild(h('button', { class: 'g-girdi', style: { width: '100%' }, text: t('glDaha'), on: { click: function () { this.disabled = true; doldur(v.sonra); } } }));
      }
    }).catch(function (e) { durum.textContent = hesapHataMetni(e); });
  }
  sayfaAc({ tam: true, baslik: t('glKayitlar'), icerik: h('div', null, liste, durum) });
  doldur(imlec);
}
