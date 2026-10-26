/* ---------- Klavye açıkken yazılan alan görünür kalsın ----------
   Klavye açılınca sayfa kısalır; alttaki sabit menü klavyenin hemen üstüne oturup yorum kutusunu örtüyordu.
   Klavye açıkken alt menü gizlenir ve odaktaki yazı alanı ekranın görünen kısmına kaydırılır. */
var KLAVYE = { enYuksek: 0, acik: false };
function yaziAlaniMi(el) {
  if (!el || !el.tagName) return false;
  if (el.tagName === 'TEXTAREA' || el.isContentEditable) return true;
  return el.tagName === 'INPUT' && ['text', 'search', 'email', 'password', 'tel', 'url', 'number', ''].indexOf(el.type || '') >= 0;
}
function gorunurYukseklik() { return window.visualViewport ? window.visualViewport.height : window.innerHeight; }
function odaktakiniGoster() {
  var el = document.activeElement;
  if (!yaziAlaniMi(el)) return;
  /* yorum kutusunda öneri listesiyle birlikte formun tamamı görünsün */
  var hedef = el.closest('.g-yorum-form') || el;
  try {
    var r = hedef.getBoundingClientRect(), y = gorunurYukseklik();
    if (r.bottom > y - 12 || r.top < 70) hedef.scrollIntoView({ block: 'center', behavior: 'smooth' });
  } catch (e) { }
}
function klavyeDurumu() {
  var y = gorunurYukseklik();
  if (!KLAVYE.acik && y > KLAVYE.enYuksek) KLAVYE.enYuksek = y;
  var acik = yaziAlaniMi(document.activeElement) && y < KLAVYE.enYuksek - 120;
  if (acik !== KLAVYE.acik) {
    KLAVYE.acik = acik;
    document.documentElement.classList.toggle('klavye-acik', acik);
  }
  if (acik) { odaktakiniGoster(); setTimeout(odaktakiniGoster, 250); }
}
KLAVYE.enYuksek = gorunurYukseklik();
(window.visualViewport || window).addEventListener('resize', klavyeDurumu);
window.addEventListener('orientationchange', function () { KLAVYE.enYuksek = 0; setTimeout(function () { KLAVYE.enYuksek = gorunurYukseklik(); klavyeDurumu(); }, 400); });
document.addEventListener('focusin', function (e) {
  if (!yaziAlaniMi(e.target)) return;
  setTimeout(klavyeDurumu, 120); setTimeout(klavyeDurumu, 450);
});
document.addEventListener('focusout', function () { setTimeout(klavyeDurumu, 80); });
