/* ---------- Gezinti: kaydırarak sekme değiştirme, geri tuşu ve çıkış sorusu ---------- */

/* Telefonun geri tuşu (açık sayfa kalmadığında gelir): önce Ana Sayfa'ya döner, sonra çıkışı sorar */
var CIKIS_ACIK = false;
window.addEventListener('kbgeri', function () {
  try { if (YEREL && typeof YEREL.geriAlindi === 'function') YEREL.geriAlindi(); } catch (e) { }
  if (YIGIN.length) { var ust = YIGIN[YIGIN.length - 1]; if (ust && ust.kapat) ust.kapat(true); return; }
  if (S.sekme !== 'bugun') { sekmeyeGec('bugun'); return; }
  if (CIKIS_ACIK) return;
  CIKIS_ACIK = true;
  onayla(t('cikisBaslik'), t('cikisSor'), t('cikisEvet'), false).then(function (evet) {
    CIKIS_ACIK = false;
    if (evet && YEREL && typeof YEREL.cik === 'function') YEREL.cik();
  });
});

/* Ekranın ortasından yana kaydırınca sekme değişir (yatay kayan listeler ve açık sayfalar hariç) */
(function () {
  var bx = 0, by = 0, bt = 0, gecerli = false;
  var KAYAN = '.g-haplar,.g-kisi-sira,.cipler,.sh-parcalar,.tema-izgara,input,textarea,select,.sayfa,.sohbet,.goruntuleyici,.pencere';
  document.addEventListener('touchstart', function (e) {
    var d = e.touches && e.touches[0];
    gecerli = !!d && e.touches.length === 1 && !YIGIN.length && !SOHBET.acik && SEKMELER.indexOf(S.sekme) >= 0 &&
      !(e.target && e.target.closest && e.target.closest(KAYAN));
    /* kenardan başlayan hareket sistemin geri hareketidir */
    if (gecerli && (d.clientX < 24 || d.clientX > window.innerWidth - 24)) gecerli = false;
    if (gecerli) { bx = d.clientX; by = d.clientY; bt = Date.now(); }
  }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (!gecerli) return;
    gecerli = false;
    var d = e.changedTouches && e.changedTouches[0]; if (!d) return;
    var dx = d.clientX - bx, dy = d.clientY - by;
    if (Date.now() - bt > 700 || Math.abs(dx) < 80 || Math.abs(dy) > Math.abs(dx) * 0.6) return;
    var i = SEKMELER.indexOf(S.sekme), j = i + (dx < 0 ? 1 : -1);
    if (j < 0 || j >= SEKMELER.length) return;
    sekmeyeGec(SEKMELER[j]);
  }, { passive: true });
})();
