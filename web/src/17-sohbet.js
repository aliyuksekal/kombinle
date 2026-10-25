/* ---------- AI Prenses: yazılı ve sesli stil sohbeti ----------
   Dolabı ve havayı bilerek cevap verir. İnternet/sunucu yoksa cihaz içi kısa önerilere döner.
   Sohbet yalnızca bu telefonda saklanır (son 40 mesaj). */

var SOHBET = { acik: false, mesgul: false };
function sohbetGecmisi() {
  var l = LS.al('sohbet', []);
  if (!Array.isArray(l)) return [];
  return l.filter(function (x) { return x && (x.r === 'k' || x.r === 'a') && typeof x.m === 'string'; }).slice(-40)
    .map(function (x) { return { r: x.r, m: satirKirp(x.m, 900), z: sayiMi(x.z) ? x.z : 0, p: Array.isArray(x.p) ? x.p.filter(function (i) { return typeof i === 'string'; }).slice(0, 6) : [] }; });
}
/* satır sonlarını koruyarak kırpar (cevaplardaki listeler alt alta görünsün) */
function satirKirp(m, n) { return String(m || '').split(/\s*\n\s*/).map(function (x) { return kirp(x, n); }).filter(Boolean).join('\n').slice(0, n); }
function sohbetKaydet(l) { LS.yaz('sohbet', l.slice(-40)); }
/* saate göre selam: sabah Günaydın, öğlen Selam, akşam İyi akşamlar */
var SELAM_SOZ = { tr: ['Günaydın', 'Selam', 'İyi akşamlar', 'Merhaba'], en: ['Good morning', 'Hi', 'Good evening', 'Hi'], ru: ['Доброе утро', 'Привет', 'Добрый вечер', 'Привет'], uz: ['Xayrli tong', 'Salom', 'Xayrli kech', 'Salom'], ko: ['좋은 아침이에요', '안녕하세요', '좋은 저녁이에요', '안녕하세요'] };
function selamSoz() {
  var l = SELAM_SOZ[A.dil] || SELAM_SOZ.tr, s = new Date().getHours();
  return s >= 5 && s < 11 ? l[0] : s >= 11 && s < 17 ? l[1] : s >= 17 ? l[2] : l[3];
}
/* yeni konuşma mı? (hiç cevap yoksa ya da son mesajın üstünden 3 saat geçtiyse selamla başlanır) */
var SOHBET_ARA = 3 * 3600000;
function sohbetYeniMi(gecmis) {
  var son = gecmis.length ? gecmis[gecmis.length - 1] : null;
  return !son || !sayiMi(son.z) || Date.now() - son.z > SOHBET_ARA || !gecmis.some(function (x) { return x.r === 'a'; });
}
function sesliYanitAcik() { return LS.al('sesliYanit', true) !== false; }
var SES = { sira: 0, calan: null, url: '' };
function sesliOku(metin) {
  if (!sesliYanitAcik()) return;
  /* emoji ve simgeler okunmasın; madde işaretleri ve satır sonları doğal duraklamaya döner */
  var m = String(metin || '').replace(/[^\p{L}\p{N}\p{P}\p{Zs}\n]/gu, ' ').replace(/^[ \t]*[-•*·][ \t]*/gm, '').replace(/\s*\n+\s*/g, '. ')
    .replace(/([.!?…:])\.(\s|$)/g, '$1$2').replace(/\s+([.,!?…])/g, '$1').replace(/\s+/g, ' ').trim();
  if (!m) return;
  var sira = ++SES.sira;
  /* Kombinle AI'nin doğal insan sesi; alınamazsa telefonun kendi sesi */
  var sesSinir = sahipMi() ? 200 : S.pro ? SES_GUNLUK.pro : SES_GUNLUK.ucretsiz;
  var sesHakki = gunlukSayac('ses') < sesSinir;
  if (!sesHakki && yzAcik() && LS.al('dogalSes', true) !== false && !SES.uyarildi) { SES.uyarildi = true; tost(S.pro ? t('dogalSesBitti') : t('dogalSesBittiUcretsiz', SES_GUNLUK.ucretsiz)); }
  if (sesHakki && yzAcik() && LS.al('dogalSes', true) !== false) {
    yzIste('/v1/ses', { metin: kirp(m, 700), dil: A.dil }, 30000).then(function (v) {
      if (!v || typeof v.ses !== 'string' || v.ses.length < 100) throw new Error('ses');
      gunlukArtir('ses');   // yalnız gerçekten alınan doğal ses hakkından düşer
      if (sira !== SES.sira) return;
      sesCal(v.ses, typeof v.tip === 'string' && /^audio\/[a-z0-9.+-]+$/.test(v.tip) ? v.tip : 'audio/wav', function () { if (sira === SES.sira) telefonSesi(m); });
    }).catch(function () { if (sira === SES.sira) telefonSesi(m); });
    return;
  }
  telefonSesi(m);
}
function sesCal(b64, tip, olmadi) {
  sesBirak();
  try {
    SES.url = URL.createObjectURL(dataUrlBlob('data:' + tip + ';base64,' + b64));
    var a = new Audio(SES.url); SES.calan = a;
    a.addEventListener('ended', sesBirak);
    var p = a.play();
    if (p && p.catch) p.catch(function () { sesBirak(); olmadi(); });
  } catch (e) { sesBirak(); olmadi(); }
}
function sesBirak() {
  try { if (SES.calan) SES.calan.pause(); } catch (e) { }
  SES.calan = null;
  if (SES.url) { try { URL.revokeObjectURL(SES.url); } catch (e) { } SES.url = ''; }
}
function telefonSesi(m) {
  var dil = KONUSMA_DILI[A.dil] || 'tr-TR';
  try {
    if (YEREL && typeof YEREL.konus === 'function') { YEREL.konus(m, dil); return; }
    if (window.speechSynthesis && window.SpeechSynthesisUtterance) {
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(m); u.lang = dil; u.rate = 0.95; speechSynthesis.speak(u);
    }
  } catch (e) { }
}
function sesiKes() {
  SES.sira++; sesBirak();
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
  if (var_(/merhaba|selam|gunaydin|aksamlar|hello|\bhi\b|morning|evening|privet|привет|добр|salom|xayrli|안녕|좋은 아침/)) return { m: selamSoz() + ' 👑 ' + t('fbSelam'), p: [] };
  if (var_(/renk|color|цвет|rang|색/)) return { m: t('fbRenk'), p: [] };
  if (var_(/ofis|toplanti|office|meeting|офис|работ|ish|출근|사무실|회의/)) return kombin() || { m: t('fbOfis'), p: [] };
  if (var_(/dugun|davet|nisan|wedding|party|свадь|празд|to'?y|bayram|결혼식|파티|행사/)) return { m: t('fbDavet'), p: [] };
  if (var_(/spor|rahat|gunluk|casual|comfort|повсед|удоб|kundalik|qulay|편한|캐주얼|일상/)) return kombin() || { m: t('fbRahat'), p: [] };
  if (var_(/kis|soguk|winter|cold|зим|холод|qish|sovuq|겨울|추워/)) return { m: t('fbKis'), p: [] };
  if (var_(/yaz|sicak|summer|hot|лет|жар|yoz|issiq|여름|더워/)) return { m: t('fbYaz'), p: [] };
  if (var_(/aksesuar|canta|kolye|kupe|accessor|bag|jewel|аксесс|сумк|aksessuar|sumka|액세서리|가방|목걸이|귀걸이/)) return { m: t('fbAks'), p: [] };
  if (var_(/ayakkabi|topuklu|shoe|heel|sneaker|обув|туфл|poyabzal|tufli|신발|구두|힐|스니커즈/)) return { m: t('fbAyk'), p: [] };
  if (var_(/kombin|giy|ne giy|outfit|wear|образ|надеть|obraz|kiy|코디|입을|입지|뭐 입/)) return kombin() || { m: t('fbDolapBos'), p: [] };
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
  gecmisEkle();
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
    var ilk = sohbetYeniMi(gecmis);
    var k = { r: 'k', m: m, p: [], z: Date.now() };
    gecmis.push(k); mesajEkle(k); sohbetKaydet(gecmis);
    onerileriGoster([]);
    SOHBET.mesgul = true; gonderBtn.disabled = true; yaziyor(true);
    var bitir = function (cevap, oneri) {
      yaziyor(false); SOHBET.mesgul = false; gonderBtn.disabled = false;
      if (kayit.kapandi) return;
      var a = { r: 'a', m: cevap.m, p: cevap.p || [], z: Date.now() };
      gecmis.push(a); mesajEkle(a); sohbetKaydet(gecmis);
      onerileriGoster(oneri && oneri.length ? oneri : []);
      sesliOku(a.m);
    };
    if (!yzAcik()) { setTimeout(function () { bitir(yerelPrenses(m)); }, 450); return; }
    /* günlük sohbet hakkı: ücretsiz 10, PRO 40 mesaj */
    var sinir = sahipMi() ? 400 : S.pro ? SOHBET_GUNLUK.pro : SOHBET_GUNLUK.ucretsiz;
    if (gunlukSayac('sohbet') >= sinir) {
      setTimeout(function () {
        var y = yerelPrenses(m);
        bitir({ m: (S.pro ? t('sohbetSinirPro', sinir) : t('sohbetSinir', sinir)) + '\n\n' + y.m, p: y.p });
        if (!S.pro) setTimeout(function () { magazaSayfasi(); }, 900);
      }, 300);
      return;
    }
    var hv = null; try { hv = aktifHava(); } catch (e) { hv = null; }
    yzIste('/v1/sohbet', {
      mesaj: m, dil: A.dil, tesettur: !!A.tesettur, kimin: A.kimin || 'kadin', ilk: ilk, saat: new Date().getHours(),
      gecmis: gecmis.slice(-11, -1).map(function (x) { return { r: x.r, m: kirp(x.m, 600) }; }),
      parcalar: yzParcaListesi(), hava: hv ? yzHava(hv) : null
    }, 45000).then(function (v) {
      var s = v.sonuc || {};
      var cevap = satirKirp(typeof s.yanit === 'string' ? s.yanit : '', 900);
      if (!cevap) throw new Error('bos');
      var var_ = Object.create(null); S.parcalar.forEach(function (p) { var_[p.id] = 1; });
      var ids = Array.isArray(s.parcalar) ? s.parcalar.filter(function (i) { return typeof i === 'string' && var_[i]; }).slice(0, 6) : [];
      gunlukArtir('sohbet');
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
      h('h2', { text: selamSoz() + ' 👑' }),
      h('p', { text: t('prensesTanitim') })));
    var l = t('sohbetOnerileri');
    onerileriGoster(Array.isArray(l) ? l : []);
  }
  if (gecmis.length) { gecmis.forEach(function (x) { mesajEkle(x, false); }); govde.scrollTop = govde.scrollHeight; var l2 = t('sohbetOnerileri'); onerileriGoster(Array.isArray(l2) ? l2 : []); }
  else hosgeldin();
  setTimeout(function () { try { girdi.focus({ preventScroll: true }); } catch (e) { } }, 350);
}
