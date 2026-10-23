/* ---------- AI Prenses: yazılı ve sesli stil sohbeti ----------
   Dolabı ve havayı bilerek cevap verir. İnternet/sunucu yoksa cihaz içi kısa önerilere döner.
   Sohbet yalnızca bu telefonda saklanır (son 40 mesaj). */

var SOHBET = { acik: false, mesgul: false };
function sohbetGecmisi() {
  var l = LS.al('sohbet', []);
  if (!Array.isArray(l)) return [];
  return l.filter(function (x) { return x && (x.r === 'k' || x.r === 'a') && typeof x.m === 'string'; }).slice(-40)
    .map(function (x) { return { r: x.r, m: kirp(x.m, 900), p: Array.isArray(x.p) ? x.p.filter(function (i) { return typeof i === 'string'; }).slice(0, 6) : [] }; });
}
function sohbetKaydet(l) { LS.yaz('sohbet', l.slice(-40)); }
function sesliYanitAcik() { return LS.al('sesliYanit', true) !== false; }
function sesliOku(metin) {
  if (!sesliYanitAcik()) return;
  /* emoji ve simgeler okunmasın */
  var m = String(metin || '').replace(/[^\p{L}\p{N}\p{P}\p{Zs}\n]/gu, ' ').replace(/\s+/g, ' ').trim();
  if (!m) return;
  var dil = KONUSMA_DILI[A.dil] || 'tr-TR';
  try {
    if (YEREL && typeof YEREL.konus === 'function') { YEREL.konus(m, dil); return; }
    if (window.speechSynthesis && window.SpeechSynthesisUtterance) {
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(m); u.lang = dil; u.pitch = 1.1; speechSynthesis.speak(u);
    }
  } catch (e) { }
}
function sesiKes() {
  try { if (YEREL && typeof YEREL.sus === 'function') YEREL.sus(); else if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) { }
}

/* Cihaz içi kısa yanıtlar (internet yokken) */
function yerelPrenses(metin) {
  var m = katla(String(metin || '').toLocaleLowerCase('tr'));
  var dolap = S.parcalar.filter(function (p) { return !p.dinlen && TUR[p.tur]; });
  var bir = function (g) { var l = dolap.filter(function (p) { return TUR[p.tur].g === g; }); return l.length ? l[Math.floor(rastgele() * l.length)] : null; };
  var kombin = function () {
    var e = bir('tek'), u = bir('ust'), a = bir('alt'), ay = bir('ayk');
    var l = e ? [e] : u && a ? [u, a] : [];
    if (!l.length) return null;
    if (ay) l.push(ay);
    return { m: t('fbKombin', l.map(parcaAd).join(' + ')), p: l.map(function (p) { return p.id; }) };
  };
  var var_ = function (re) { return re.test(m); };
  if (var_(/merhaba|selam|hello|\bhi\b|privet|привет|salom/)) return { m: t('fbSelam'), p: [] };
  if (var_(/renk|color|цвет|rang/)) return { m: t('fbRenk'), p: [] };
  if (var_(/ofis|toplanti|office|meeting|офис|работ|ish/)) return kombin() || { m: t('fbOfis'), p: [] };
  if (var_(/dugun|davet|nisan|wedding|party|свадь|празд|to'?y|bayram/)) return { m: t('fbDavet'), p: [] };
  if (var_(/spor|rahat|gunluk|casual|comfort|повсед|удоб|kundalik|qulay/)) return kombin() || { m: t('fbRahat'), p: [] };
  if (var_(/kis|soguk|winter|cold|зим|холод|qish|sovuq/)) return { m: t('fbKis'), p: [] };
  if (var_(/yaz|sicak|summer|hot|лет|жар|yoz|issiq/)) return { m: t('fbYaz'), p: [] };
  if (var_(/aksesuar|canta|kolye|kupe|accessor|bag|jewel|аксесс|сумк|aksessuar|sumka/)) return { m: t('fbAks'), p: [] };
  if (var_(/ayakkabi|topuklu|shoe|heel|sneaker|обув|туфл|poyabzal|tufli/)) return { m: t('fbAyk'), p: [] };
  if (var_(/kombin|giy|ne giy|outfit|wear|образ|надеть|obraz|kiy/)) return kombin() || { m: t('fbDolapBos'), p: [] };
  return { m: t('fbVarsayilan'), p: [] };
}

function sohbetAc() {
  if (SOHBET.acik) return;
  SOHBET.acik = true;
  var gecmis = sohbetGecmisi();
  var govde = h('div', { class: 'sh-govde', role: 'log', 'aria-live': 'polite' });
  var oneriler = h('div', { class: 'sh-oneri' });
  var girdi = h('input', { class: 'sh-girdi', type: 'text', maxlength: '500', placeholder: t('sohbetYer'), 'aria-label': t('sohbetYer'), enterkeyhint: 'send' });
  var mik = h('button', { class: 'sh-mik', 'aria-label': t('sesleSoyle') }, ikon('mik', 'k'));
  var gonderBtn = h('button', { class: 'sh-gonder', 'aria-label': t('gonder') }, ikon('gonder', 'k'));
  var sesBtn = h('button', { class: 'sh-ust-btn', 'aria-label': t('sesliYanit'), 'aria-pressed': sesliYanitAcik() ? 'true' : 'false' }, ikon(sesliYanitAcik() ? 'hoparlor' : 'sessiz', 'k'));
  var temizBtn = h('button', { class: 'sh-ust-btn', 'aria-label': t('sohbetTemizle') }, ikon('cop', 'k'));
  var kapatBtn = h('button', { class: 'sh-ust-btn', 'aria-label': t('kapat') }, ikon('kapat', 'k'));
  var kok = h('div', { class: 'sohbet', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('prensesBaslik') },
    h('div', { class: 'sh-ust' },
      h('span', { class: 'sh-avatar' }, ikon('prenses')),
      h('div', { class: 'sh-bilgi' }, h('b', { text: t('prensesAd') }), h('small', { text: yzAcik() ? t('cevrimici') : t('cihazIci') })),
      h('div', { class: 'sh-ust-sag' }, sesBtn, temizBtn, kapatBtn)),
    govde, oneriler,
    h('div', { class: 'sh-alt' }, mik, girdi, gonderBtn),
    h('p', { class: 'ai-not sh-not', text: t('aiNot') }));
  document.body.appendChild(kok);
  requestAnimationFrame(function () { kok.classList.add('acik'); });

  /* geri tuşu sohbeti kapatsın */
  var kayit = { kapandi: false };
  YIGIN.push(kayit);
  try { history.pushState({ kb: YIGIN.length }, ''); } catch (e) { }
  function kapat(gecmistenMi) {
    if (kayit.kapandi) return;
    kayit.kapandi = true; SOHBET.acik = false;
    var i = YIGIN.indexOf(kayit); if (i >= 0) YIGIN.splice(i, 1);
    sesiKes();
    kok.classList.remove('acik');
    setTimeout(function () { kok.remove(); }, 260);
    if (!gecmistenMi) { geriKilit++; try { history.back(); } catch (e) { geriKilit--; } }
  }
  kayit.kapat = kapat;
  kapatBtn.addEventListener('click', function () { kapat(); });

  function mesajEkle(x, kaydirma) {
    var hos = $('.sh-hosgeldin', govde); if (hos) hos.remove();
    var b = h('div', { class: 'sh-mesaj ' + (x.r === 'k' ? 'kul' : 'bot') }, h('span', { text: x.m }));
    if (x.p && x.p.length) {
      var harita = Object.create(null); S.parcalar.forEach(function (p) { harita[p.id] = p; });
      var sira = h('div', { class: 'sh-parcalar' });
      x.p.forEach(function (id) {
        var p = harita[id]; if (!p) return;
        sira.appendChild(h('button', { class: 'sh-parca', 'aria-label': parcaAd(p), on: { click: function () { parcaDuzenle(p, null); } } }, resimEl(p.id, false, null, parcaAd(p)), h('small', { text: p.ad || turAd(p.tur) })));
      });
      if (sira.childNodes.length) b.appendChild(sira);
    }
    govde.appendChild(b);
    if (kaydirma !== false) govde.scrollTop = govde.scrollHeight;
  }
  function onerileriGoster(l) {
    temizle(oneriler);
    (l || []).slice(0, 4).forEach(function (o) {
      o = kirp(o, 60); if (!o) return;
      oneriler.appendChild(h('button', { text: o, on: { click: function () { girdi.value = o; gonder(); } } }));
    });
  }
  function yaziyor(goster) {
    var y = $('.sh-yaziyor', govde);
    if (goster && !y) { govde.appendChild(h('div', { class: 'sh-mesaj bot sh-yaziyor' }, h('i'), h('i'), h('i'))); govde.scrollTop = govde.scrollHeight; }
    if (!goster && y) y.remove();
  }
  function gonder() {
    var m = kirp(girdi.value, 500);
    if (!m || SOHBET.mesgul) return;
    girdi.value = '';
    sesiKes();
    var k = { r: 'k', m: m, p: [] };
    gecmis.push(k); mesajEkle(k); sohbetKaydet(gecmis);
    onerileriGoster([]);
    SOHBET.mesgul = true; gonderBtn.disabled = true; yaziyor(true);
    var bitir = function (cevap, oneri) {
      yaziyor(false); SOHBET.mesgul = false; gonderBtn.disabled = false;
      if (kayit.kapandi) return;
      var a = { r: 'a', m: cevap.m, p: cevap.p || [] };
      gecmis.push(a); mesajEkle(a); sohbetKaydet(gecmis);
      onerileriGoster(oneri && oneri.length ? oneri : []);
      sesliOku(a.m);
    };
    if (!yzAcik()) { setTimeout(function () { bitir(yerelPrenses(m)); }, 450); return; }
    var hv = null; try { hv = aktifHava(); } catch (e) { hv = null; }
    yzIste('/v1/sohbet', {
      mesaj: m, dil: A.dil, tesettur: !!A.tesettur,
      gecmis: gecmis.slice(-11, -1).map(function (x) { return { r: x.r, m: kirp(x.m, 600) }; }),
      parcalar: yzParcaListesi(), hava: hv ? yzHava(hv) : null
    }, 45000).then(function (v) {
      var s = v.sonuc || {};
      var cevap = kirp(typeof s.yanit === 'string' ? s.yanit.replace(/\s*\n\s*/g, '\n') : '', 900);
      if (!cevap) throw new Error('bos');
      var var_ = Object.create(null); S.parcalar.forEach(function (p) { var_[p.id] = 1; });
      var ids = Array.isArray(s.parcalar) ? s.parcalar.filter(function (i) { return typeof i === 'string' && var_[i]; }).slice(0, 6) : [];
      bitir({ m: cevap, p: ids }, Array.isArray(s.oneriler) ? s.oneriler : []);
    }).catch(function (e) {
      var y = yerelPrenses(m);
      if (e && e.message === 'kota') y.m = t('yzKota') + '\n\n' + y.m;
      bitir(y);
    });
  }
  gonderBtn.addEventListener('click', gonder);
  girdi.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); gonder(); } });
  mik.addEventListener('click', function () { sesliDinle(girdi, mik, function () { gonder(); }); });
  sesBtn.addEventListener('click', function () {
    var yeni = !sesliYanitAcik(); LS.yaz('sesliYanit', yeni);
    sesBtn.setAttribute('aria-pressed', yeni ? 'true' : 'false');
    temizle(sesBtn); sesBtn.appendChild(ikon(yeni ? 'hoparlor' : 'sessiz', 'k'));
    if (!yeni) sesiKes();
    tost(yeni ? t('sesliAcik') : t('sesliKapali'));
  });
  temizBtn.addEventListener('click', function () {
    onayla(t('sohbetTemizle'), t('sohbetTemizleSor'), t('sil'), true).then(function (evet) {
      if (!evet) return;
      gecmis = []; sohbetKaydet(gecmis); temizle(govde); hosgeldin();
    });
  });
  function hosgeldin() {
    govde.appendChild(h('div', { class: 'sh-hosgeldin' },
      h('span', { class: 'sh-tac' }, ikon('prenses')),
      h('h2', { text: t('prensesMerhaba') }),
      h('p', { text: t('prensesTanitim') })));
    var l = t('sohbetOnerileri');
    onerileriGoster(Array.isArray(l) ? l : []);
  }
  if (gecmis.length) { gecmis.forEach(function (x) { mesajEkle(x, false); }); govde.scrollTop = govde.scrollHeight; var l2 = t('sohbetOnerileri'); onerileriGoster(Array.isArray(l2) ? l2 : []); }
  else hosgeldin();
  setTimeout(function () { try { girdi.focus({ preventScroll: true }); } catch (e) { } }, 350);
}
