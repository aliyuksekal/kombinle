/* ---------- Elle kırpma ----------
   Kıyafet fotoğrafında kırpma çerçevesi: içinden sürükleyince taşınır, köşelerden büyür/küçülür.
   Kırpma fotoğrafın aslından (yeni eklenen parçada tam çözünürlükte) yapılır; saydam (arka planı
   silinmiş) görüntüde saydamlık korunur. Ücretsizdir. */

function kirpKaynakCoz(k) {
  if (k instanceof HTMLCanvasElement) return Promise.resolve({ ciz: k, w: k.width, h: k.height, kapat: function () { } });
  return resimCoz(k).then(function (b) {
    return { ciz: b.kaynak || b, w: b.width, h: b.height, kapat: function () { bmpKapat(b); } };
  });
}

/* kaynak: Blob/File ya da tuval; saydam: sonuç saydam kalsın mı. Promise<tuval|null> */
function elleKirp(kaynak, saydam) {
  return kirpKaynakCoz(kaynak).then(function (src) {
    return new Promise(function (coz) {
      var bitti = false;
      var son = function (v) { if (bitti) return; bitti = true; src.kapat(); coz(v); };
      /* önizleme: en uzun kenar en fazla 900 px */
      var o = Math.min(1, 900 / Math.max(src.w, src.h));
      var on = document.createElement('canvas');
      on.width = Math.max(1, Math.round(src.w * o)); on.height = Math.max(1, Math.round(src.h * o));
      var ox = on.getContext('2d'); ox.imageSmoothingQuality = 'high'; ox.drawImage(src.ciz, 0, 0, on.width, on.height);
      on.className = 'kirp-resim';
      var kutu = h('div', { class: 'kirp-kutu' },
        h('i', { class: 'kirp-tut sol-ust', 'data-k': 'su' }), h('i', { class: 'kirp-tut sag-ust', 'data-k': 'sau' }),
        h('i', { class: 'kirp-tut sol-alt', 'data-k': 'sa' }), h('i', { class: 'kirp-tut sag-alt', 'data-k': 'saa' }));
      var alan = h('div', { class: 'kirp-alan' + (saydam ? ' saydam' : '') }, on, kutu);
      /* çerçeve oranları (0–1): başta kenarlardan %6 içeride */
      var r = { x: 0.06, y: 0.06, w: 0.88, h: 0.88 };
      function yerlestir() {
        kutu.style.left = (r.x * 100) + '%'; kutu.style.top = (r.y * 100) + '%';
        kutu.style.width = (r.w * 100) + '%'; kutu.style.height = (r.h * 100) + '%';
      }
      yerlestir();
      var surukle = null;
      function bas(e) {
        var t = e.target, k = t && t.getAttribute && t.getAttribute('data-k');
        if (!k && t !== kutu) return;
        e.preventDefault();
        var b = on.getBoundingClientRect();
        surukle = { k: k || 'tasi', x: e.clientX, y: e.clientY, r: { x: r.x, y: r.y, w: r.w, h: r.h }, bw: b.width, bh: b.height };
        try { alan.setPointerCapture(e.pointerId); } catch (er) { }
      }
      function kaydir(e) {
        if (!surukle) return;
        e.preventDefault();
        var dx = (e.clientX - surukle.x) / surukle.bw, dy = (e.clientY - surukle.y) / surukle.bh, s = surukle.r;
        var enAzW = Math.min(1, 44 / surukle.bw), enAzH = Math.min(1, 44 / surukle.bh);
        var x0 = s.x, y0 = s.y, x1 = s.x + s.w, y1 = s.y + s.h;
        if (surukle.k === 'tasi') {
          var nx = Math.max(0, Math.min(1 - s.w, s.x + dx)), ny = Math.max(0, Math.min(1 - s.h, s.y + dy));
          r = { x: nx, y: ny, w: s.w, h: s.h };
        } else {
          if (surukle.k === 'su' || surukle.k === 'sa') x0 = Math.max(0, Math.min(x1 - enAzW, s.x + dx));
          if (surukle.k === 'sau' || surukle.k === 'saa') x1 = Math.min(1, Math.max(x0 + enAzW, x1 + dx));
          if (surukle.k === 'su' || surukle.k === 'sau') y0 = Math.max(0, Math.min(y1 - enAzH, s.y + dy));
          if (surukle.k === 'sa' || surukle.k === 'saa') y1 = Math.min(1, Math.max(y0 + enAzH, y1 + dy));
          r = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
        }
        yerlestir();
      }
      function birak() { surukle = null; }
      alan.addEventListener('pointerdown', bas);
      alan.addEventListener('pointermove', kaydir);
      alan.addEventListener('pointerup', birak);
      alan.addEventListener('pointercancel', birak);
      var sifirla = h('button', { class: 'btn ikincil kucuk', on: { click: function () { r = { x: 0, y: 0, w: 1, h: 1 }; yerlestir(); } } }, t('kirpTamami'));
      var kirpBtn = h('button', { class: 'btn ana', on: { click: function () {
        var sx = Math.round(r.x * src.w), sy = Math.round(r.y * src.h);
        var sw = Math.max(8, Math.round(r.w * src.w)), sh = Math.max(8, Math.round(r.h * src.h));
        var c = document.createElement('canvas'); c.width = sw; c.height = sh;
        var x = c.getContext('2d');
        if (!saydam) { x.fillStyle = '#ffffff'; x.fillRect(0, 0, sw, sh); }
        x.imageSmoothingQuality = 'high';
        x.drawImage(src.ciz, sx, sy, sw, sh, 0, 0, sw, sh);
        son(c); s.kapat();
      } } }, ikon('tik', 'k'), t('kirpUygula'));
      var s = sayfaAc({
        baslik: t('kirpBaslik'),
        icerik: h('div', { class: 'kirp-sayfa' }, h('p', { class: 'alt-yazi', text: t('kirpAciklama') }), alan, h('div', { class: 'kirp-arac' }, sifirla)),
        altBar: [h('button', { class: 'btn ikincil', on: { click: function () { s.kapat(); } } }, t('vazgec')), kirpBtn],
        kapaninca: function () { son(null); }
      });
    });
  });
}

/* Kırpılan tuvalden kayda hazır büyük/küçük görüntüler (saydamsa WebP/PNG, değilse JPEG) */
function kirpikKaydet(c, saydam) {
  var buyuk = olcekle(c, 1024), kucuk = olcekle(c, 420);
  return saydam
    ? Promise.all([saydamBlob(buyuk, 0.9), saydamBlob(kucuk, 0.85)]).then(function (b) { return { buyuk: b[0], kucuk: b[1] }; })
    : Promise.all([tuvaldenBlob(buyuk, 0.88), tuvaldenBlob(kucuk, 0.82)]).then(function (b) { return { buyuk: b[0], kucuk: b[1] }; });
}

Object.assign(DIL.tr, {
  kirp: 'Kırp', kirpBaslik: 'Fotoğrafı kırp', kirpAciklama: 'Çerçeveyi sürükleyerek taşı, köşelerinden tutarak büyüt ya da küçült.',
  kirpUygula: 'Kırp', kirpTamami: 'Tamamını seç', kirpildi: 'Fotoğraf kırpıldı.', kirpOlmadi: 'Fotoğraf kırpılamadı, tekrar dene.'
});
Object.assign(DIL.en, {
  kirp: 'Crop', kirpBaslik: 'Crop photo', kirpAciklama: 'Drag the frame to move it; drag its corners to resize.',
  kirpUygula: 'Crop', kirpTamami: 'Select all', kirpildi: 'Photo cropped.', kirpOlmadi: 'Could not crop the photo, try again.'
});
Object.assign(DIL.ru, {
  kirp: 'Обрезать', kirpBaslik: 'Обрезать фото', kirpAciklama: 'Перетащи рамку, чтобы сдвинуть; тяни за углы, чтобы изменить размер.',
  kirpUygula: 'Обрезать', kirpTamami: 'Выбрать всё', kirpildi: 'Фото обрезано.', kirpOlmadi: 'Не удалось обрезать фото, попробуй ещё раз.'
});
Object.assign(DIL.uz, {
  kirp: 'Kesish', kirpBaslik: 'Rasmni kesish', kirpAciklama: "Ramkani surib siljiting, burchaklaridan tortib kattalashtiring yoki kichraytiring.",
  kirpUygula: 'Kesish', kirpTamami: 'Hammasini tanlash', kirpildi: 'Rasm kesildi.', kirpOlmadi: "Rasm kesilmadi, qayta urinib ko'ring."
});

/* ---------- Tepki emojisi ----------
   Kıyafet olmayan fotoğrafta 🫪 gösterilir. Telefonun emoji yazı tipi bu yeni emojiyi bilmiyorsa
   (kutu çıkacaksa) en yakın yedeklerden biri kullanılır. */
var TEPKI_ADAYLAR = ['🫪', '🫨', '😵‍💫', '😵'];
var tepkiSecim = null;
function emojiDestekli(e) {
  try {
    var c = document.createElement('canvas'); c.width = c.height = 40;
    var x = c.getContext('2d', { willReadFrequently: true });
    x.textBaseline = 'top'; x.font = '32px sans-serif'; x.fillText(e, 2, 2);
    var d = x.getImageData(0, 0, 40, 40).data, renkli = 0;
    for (var i = 0; i < d.length; i += 4) if (d[i + 3] > 60 && (Math.abs(d[i] - d[i + 1]) > 30 || Math.abs(d[i + 1] - d[i + 2]) > 30)) renkli++;
    return renkli > 20;   // renkli emoji çizildi; tanımayan yazı tipi gri/siyah kutu çizer
  } catch (er) { return false; }
}
function tepkiEmojisi() {
  if (tepkiSecim) return tepkiSecim;
  for (var i = 0; i < TEPKI_ADAYLAR.length; i++) if (emojiDestekli(TEPKI_ADAYLAR[i])) return (tepkiSecim = TEPKI_ADAYLAR[i]);
  return (tepkiSecim = TEPKI_ADAYLAR[0]);
}
function emojiTepki(e) {
  var el = h('div', { class: 'emoji-tepki', 'aria-hidden': 'true' }, h('span', { text: e }));
  document.body.appendChild(el);
  try { if (navigator.vibrate) navigator.vibrate(30); } catch (er) { }
  setTimeout(function () { el.classList.add('git'); }, 1700);
  setTimeout(function () { el.remove(); }, 2300);
}
