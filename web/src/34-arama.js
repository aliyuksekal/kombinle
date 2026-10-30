/* ---------- Keşfet: kişi arama ----------
   Keşfet'in üstündeki "Kişi ara" düğmesine basınca arama sayfası açılır; harf yazdıkça
   ada ya da @kullanıcı adına uyan kişiler sıralanır (en çok takipçisi olan üstte). */
(function () {
  var SOZ = {
    tr: { kaBaslik: 'Kişi ara', kaYer: 'İsim veya @kullanıcı adı', kaBos: 'Aramak için yazmaya başla', kaYok: 'Bu isimle kimse bulunamadı' },
    en: { kaBaslik: 'Search people', kaYer: 'Name or @username', kaBos: 'Start typing to search', kaYok: 'No one found with this name' },
    ru: { kaBaslik: 'Поиск людей', kaYer: 'Имя или @имя пользователя', kaBos: 'Начни вводить имя', kaYok: 'Никого не найдено' },
    uz: { kaBaslik: 'Odamlarni qidirish', kaYer: 'Ism yoki @foydalanuvchi nomi', kaBos: 'Qidirish uchun yozishni boshlang', kaYok: 'Bu nom bilan hech kim topilmadi' },
    ko: { kaBaslik: '사람 검색', kaYer: '이름 또는 @사용자 이름', kaBos: '검색어를 입력하세요', kaYok: '이 이름의 사용자가 없어요' }
  };
  Object.keys(SOZ).forEach(function (d) { if (DIL[d]) Object.assign(DIL[d], SOZ[d]); });
})();

/* Keşfet'te arama çubuğu görünümünde düğme */
function kisiAraCubugu() {
  if (!yzKurulu() || !girisli()) return null;
  return h('button', { class: 'ka-cubuk', type: 'button', 'aria-label': t('kaBaslik'), on: { click: function () { kisiAraSayfasi(); } } },
    ikon('ara', 'k'), h('span', { text: t('kaYer') }));
}

function kisiAraSayfasi() {
  var sonuc = h('div', { class: 'tk-liste ka-sonuc' });
  var durum = h('p', { class: 'alt-yazi ka-durum', text: t('kaBos') });
  var girdi = h('input', { class: 'g-girdi ka-girdi', type: 'search', maxlength: '24', placeholder: t('kaYer'), 'aria-label': t('kaBaslik'), 'data-odak': '1', autocomplete: 'off', autocapitalize: 'none', enterkeyhint: 'search' });
  var s = sayfaAc({ tam: true, baslik: t('kaBaslik'), icerik: h('div', { class: 'ka-sayfa' }, girdi, durum, sonuc) });
  var zaman = null, no = 0;
  function ara() {
    var q = kirp(girdi.value, 24).replace(/^@+/, '').trim();
    clearTimeout(zaman);
    var n = ++no;
    if (!q) { temizle(sonuc); durum.textContent = t('kaBos'); durum.hidden = false; return; }
    zaman = setTimeout(function () {
      if (!sonuc.firstChild) { durum.hidden = false; temizle(durum); durum.appendChild(h('span', { class: 'yukleniyor' })); }
      yzIste('/v1/kisiler', { ara: q, engelli: engelliler() }, 15000).then(function (v) {
        if (s.kapandi || n !== no) return;
        temizle(sonuc);
        var l = Array.isArray(v.liste) ? v.liste.filter(function (k) { return k && /^[a-f0-9]{12}$/.test(k.kod) && typeof k.takma === 'string'; }) : [];
        if (!l.length) { durum.hidden = false; durum.textContent = t('kaYok'); return; }
        durum.hidden = true;
        var hb = hesapBilgi();
        l.forEach(function (k) {
          var ad = kirp(k.takma, 24), benim = !!(hb && hb.kod === k.kod);
          var ek = h('small', { class: 'bn-metin', text: t('takipciSay', k.takipci | 0) + ' • ' + t('paylasimSay', k.paylasim | 0) });
          sonuc.appendChild(kisiSatiri({ kod: k.kod, takma: ad, kadi: k.kadi, av: k.av, takipte: k.takipte, istekte: k.istekte, benim: benim }, function () {
            if (benim) { s.kapat(); setTimeout(benimProfilim, 250); return; }
            profilSayfasi(k.kod, { takma: ad, kadi: k.kadi, bio: k.bio, av: k.av, takipte: k.takipte });
          }, ek));
        });
      }).catch(function (e) { if (!s.kapandi && n === no) { temizle(sonuc); durum.hidden = false; durum.textContent = hesapHataMetni(e); } });
    }, 250);
  }
  girdi.addEventListener('input', ara);
  setTimeout(function () { try { girdi.focus(); } catch (e) { } }, 350);
}
