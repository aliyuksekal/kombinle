/* ---------- Sesle söyleme ---------- */
var dinleyici = null;
var KONUSMA_DILI = { tr: 'tr-TR', en: 'en-US', ru: 'ru-RU', uz: 'uz-UZ' };
function sesliDinle(alan, btn, bitti) {
  var dil = KONUSMA_DILI[A.dil] || 'tr-TR';
  var yaz = function (m) {
    m = kirp(m, 300); if (!m) return;
    alan.value = kirp((alan.value ? alan.value.replace(/\s+$/, '') + ' ' : '') + m, 300);
    if (alan.id === 'istek') { S.istek = alan.value; try { akilliOrtam(); } catch (e) { } }
    if (bitti) bitti(alan.value);
  };
  if (dinleyici) { try { dinleyici.stop(); } catch (e) { } return; }
  if (YEREL) {
    btn.classList.add('dinliyor');
    yerelCagir('dinle', [dil], 120000).then(function (d) {
      btn.classList.remove('dinliyor');
      if (d.ok && typeof d.metin === 'string') yaz(d.metin);
      else if (d.yok) { alan.focus(); tost(t('mikKlavye')); }
    });
    return;
  }
  /* APK Atölyesi'nde ileride eklenebilecek ses köprüsü */
  if (window.ApkApp && typeof window.ApkApp.listen === 'function') {
    btn.classList.add('dinliyor');
    zamanAsimi(Promise.resolve(window.ApkApp.listen(dil)), 30000).then(function (m) { if (typeof m === 'string') yaz(m); })
      .catch(function () { tost(t('sesAnlasilmadi')); }).then(function () { btn.classList.remove('dinliyor'); });
    return;
  }
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { alan.focus(); tost(t('mikKlavye')); return; }
  try {
    var r = new SR(); dinleyici = r;
    r.lang = dil; r.interimResults = false; r.maxAlternatives = 1;
    r.onresult = function (e) { try { yaz(e.results[0][0].transcript); } catch (x) { } };
    r.onerror = function (e) { if (e && e.error === 'not-allowed') tost(t('mikIzin')); else if (e && e.error !== 'aborted' && e.error !== 'no-speech') { alan.focus(); tost(t('mikKlavye')); } };
    r.onend = function () { dinleyici = null; btn.classList.remove('dinliyor'); };
    btn.classList.add('dinliyor');
    r.start();
  } catch (e) { dinleyici = null; btn.classList.remove('dinliyor'); alan.focus(); tost(t('mikKlavye')); }
}

/* ---------- Hava yükleme ---------- */
var havaSayac = 0;
function havaYukle(zorla) {
  var no = ++havaSayac;
  if (S.hava.durum !== 'tamam' || zorla) { S.hava = { durum: 'yukleniyor' }; if (A.karsilandi) ciz(); }
  return konumBul().then(function (yer) {
    if (no !== havaSayac) return;
    if (!yer || yer.kapali) { S.hava = { durum: 'konumYok', kapali: !!(yer && yer.kapali) }; ciz(); return; }
    return havaGetir(yer.lat, yer.lon, !!zorla).then(function (kayit) {
      if (no !== havaSayac) return;
      S.hava = { durum: 'tamam', kayit: kayit, yer: yer };
      S.elleHava = null;
      ciz();
    });
  }).catch(function (e) {
    if (no !== havaSayac) return;
    S.hava = { durum: 'hata', hata: String(e && e.message || e) };
    ciz();
  });
}

/* ---------- Hata yakalama: uygulama asla beyaz ekranda kalmaz ---------- */
var hataSayisi = 0;
function hataYakala(e) {
  hataSayisi++;
  try { if (window.console) console.warn('[kombinle]', e && e.message ? e.message : e); } catch (x) { }
}
window.addEventListener('error', function (e) {
  hataYakala(e.error || e.message);
  if (!$('#uygulama') || !$('#uygulama').childNodes.length) hataEkrani($('#uygulama'));
});
window.addEventListener('unhandledrejection', function (e) { hataYakala(e.reason); try { e.preventDefault(); } catch (x) { } });

/* ---------- Başlat ---------- */
function baslat() {
  ayarYukle();
  S.pro = A.pro;
  temaUygula(temaSecimi());
  try {
    var mq = window.matchMedia && matchMedia('(prefers-color-scheme: dark)');
    if (mq && mq.addEventListener) mq.addEventListener('change', function () { if (temaSecimi() === 'oto') { temaUygula('oto'); ciz(); } });
  } catch (e) { }
  $('#dosyaSec').addEventListener('change', function (e) { var f = e.target.files; dosyalarSecildi(f); e.target.value = ''; });
  $('#yedekSec').addEventListener('change', function (e) { var f = e.target.files && e.target.files[0]; yedekSecildi(f); e.target.value = ''; });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible') return;
    var jn = jetonTeslimAl(); if (jn > 0) { tost(t('jetonYuklendi', jn)); if (A.karsilandi) ciz(); }
    if (!A.karsilandi) return;
    if (S.hava.durum === 'konumYok' && S.hava.kapali) havaYukle(true);
    else if (S.hava.kayit && Date.now() - S.hava.kayit.alindi > 60 * 60000) havaYukle(false);
  });
  ciz();
  dbAc().then(function () {
    if (DB_YOK) tost(t('depoYok'));
    return Depo.parcalar();
  }).then(function (l) {
    S.parcalar = (l || []).filter(function (p) { return p && idGecerli(p.id) && TUR[p.tur]; });
    S.parcalar.forEach(function (p) { if (!RENK[p.renk]) p.renk = 'siyah'; p.tarz = tarzTemizle(p.tarz); });
    ciz();
  }).catch(function (e) { hataYakala(e); ciz(); });
  if (A.karsilandi) havaYukle(false);
  proDurumuDenetle();
  setTimeout(function () { var n = jetonTeslimAl(); if (n > 0) tost(t('jetonYuklendi', n)); }, 3000);
  window.addEventListener('apkshortcut', function (e) { try { e.preventDefault(); } catch (x) { } });
  acilisKapat();
}
/* Açılış animasyonu en az ~2,7 sn görünür (dokununca hemen geçer), sonra yumuşakça kaybolur */
function acilisKapat() {
  var a = document.getElementById('acilis'); if (!a) return;
  var bitir = function () { if (a.classList.contains('bitti')) return; a.classList.add('bitti'); setTimeout(function () { try { a.remove(); } catch (e) { } }, 700); };
  a.addEventListener('click', bitir);
  var azalt = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gecen = (window.performance && performance.now) ? performance.now() : 0;
  setTimeout(bitir, Math.max(0, (azalt ? 900 : 2900) - gecen));
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', baslat); else baslat();
