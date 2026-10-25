/* ---------- Kimin için: kadın (varsayılan) / erkek / belirtmek istemiyorum ----------
   Kombinle kadınlar için tasarlandı; kimse dışlanmaz. Seçime göre tür listesi (etek, elbise… ya da takım, kravat…)
   ve stil asistanının adı/hitabı değişir ("AI Prenses" → "AI Stilist"). */
var KIMIN_SECENEK = [['kadin', 'kiminKadin'], ['erkek', 'kiminErkek'], ['notr', 'kiminNotr']];
var ASISTAN_AD = {
  tr: [/AI Prenses/g, 'AI Stilist'], en: [/AI Princess/g, 'AI Stylist'], ru: [/AI[- ]Принцесс[аыуе]/g, 'AI-Стилист'], uz: [/AI Malika/g, 'AI Stilist']
};
var DIL_ASLI = null;
/* asistan adını tüm metinlerde değiştirir (kadın seçiliyse asıl metinlere döner) */
function kiminUygula() {
  if (!DIL_ASLI) {
    DIL_ASLI = {};
    Object.keys(ASISTAN_AD).forEach(function (d) { if (DIL[d]) DIL_ASLI[d] = Object.assign({}, DIL[d]); });
  }
  var degistir = (A.kimin || 'kadin') !== 'kadin';
  Object.keys(DIL_ASLI).forEach(function (d) {
    var asil = DIL_ASLI[d], k = ASISTAN_AD[d];
    Object.keys(asil).forEach(function (a) {
      var v = asil[a];
      if (!degistir) { DIL[d][a] = v; return; }
      if (typeof v === 'string' && k[0].test(v)) { k[0].lastIndex = 0; DIL[d][a] = v.replace(k[0], k[1]); }
      else if (typeof v === 'function') DIL[d][a] = (function (f) { return function () { var r = f.apply(null, arguments); return typeof r === 'string' ? r.replace(k[0], k[1]) : r; }; })(v);
      k[0].lastIndex = 0;
    });
  });
}
function kiminSec(deger, sonra) {
  if (KIMIN_SECENEK.every(function (x) { return x[0] !== deger; })) return;
  A.kimin = deger;
  if (deger === 'erkek') A.tesettur = false;
  ayarKaydet(); kiminUygula(); S.sonuc = null;
  if (sonra) sonra();
}
function kiminSeg(sonra) {
  var seg = h('div', { class: 'seg kimin-seg', role: 'radiogroup', 'aria-label': t('kiminBaslik') });
  KIMIN_SECENEK.forEach(function (x) {
    seg.appendChild(h('button', { role: 'radio', 'aria-checked': (A.kimin || 'kadin') === x[0] ? 'true' : 'false', 'aria-pressed': (A.kimin || 'kadin') === x[0] ? 'true' : 'false', text: t(x[1]),
      on: { click: function () { kiminSec(x[0], sonra); } } }));
  });
  return seg;
}

/* ---------- Mesaj güvenliği: bana kimler yazabilir ---------- */
var DM_IZIN_SECENEK = [['herkes', 'dmIzinHerkes'], ['takip', 'dmIzinTakip'], ['kimse', 'dmIzinKimse']];
function dmIzinSatiri(baslangic) {
  var kap = h('div', { class: 'satir dm-izin-satir', style: { 'flex-wrap': 'wrap' } });
  var secili = baslangic || 'herkes';
  function ciz() {
    temizle(kap);
    kap.appendChild(h('span', { class: 'sol' }, ikon('gonder'), h('div', null, t('dmIzinBaslik'), h('small', { text: t('dmIzinAlt_' + secili) }))));
    var seg = h('div', { class: 'seg' });
    DM_IZIN_SECENEK.forEach(function (x) {
      seg.appendChild(h('button', { 'aria-pressed': secili === x[0] ? 'true' : 'false', text: t(x[1]), on: { click: function () {
        if (secili === x[0]) return;
        var eski = secili; secili = x[0]; ciz();
        yzIste('/v1/gizlilik', { dm: x[0] }, 15000).then(function (r) { secili = r.dm || x[0]; ciz(); tost(t('dmIzinKaydedildi')); })
          .catch(function () { secili = eski; ciz(); tost(t('tpHata')); });
      } } }));
    });
    kap.appendChild(seg);
  }
  ciz();
  return { el: kap, ayarla: function (v) { if (DM_IZIN_SECENEK.some(function (x) { return x[0] === v; })) { secili = v; ciz(); } } };
}

Object.assign(DIL.tr, {
  geri: 'Geri', yeniPaylasim: 'Yeni kombin paylaş', ilkPaylasim: 'İlk kombinini paylaş',
  kiminBaslik: 'Kombinler kimin için?', kiminAlt: 'Tür listesi ve stil asistanının hitabı buna göre ayarlanır.',
  kiminKadin: 'Kadın', kiminErkek: 'Erkek', kiminNotr: 'Belirtmek istemiyorum',
  dmIzinBaslik: 'Bana kimler mesaj yazabilir', dmIzinHerkes: 'Herkes', dmIzinTakip: 'Takip ettiklerim', dmIzinKimse: 'Kimse',
  dmIzinAlt_herkes: 'Takip etmediklerin mesaj isteği gönderir; sen kabul etmeden sohbet açılmaz.',
  dmIzinAlt_takip: 'Yalnız takip ettiğin kişiler yazabilir.', dmIzinAlt_kimse: 'Kimse yeni mesaj gönderemez.',
  dmIzinKaydedildi: 'Mesaj ayarın kaydedildi.', dmKapali: 'Bu kişi şu an mesaj almıyor.',
  dmKisitli: 'Mesajların şikâyet edildiği için bir süre tanımadığın kişilere yazamazsın.'
});
Object.assign(DIL.en, {
  geri: 'Back', yeniPaylasim: 'Share a new outfit', ilkPaylasim: 'Share your first outfit',
  kiminBaslik: 'Who are the outfits for?', kiminAlt: 'The clothing types and how your stylist talks to you adjust to this.',
  kiminKadin: 'Woman', kiminErkek: 'Man', kiminNotr: 'Prefer not to say',
  dmIzinBaslik: 'Who can message me', dmIzinHerkes: 'Everyone', dmIzinTakip: 'People I follow', dmIzinKimse: 'No one',
  dmIzinAlt_herkes: "People you don't follow send a message request; the chat opens only if you accept.",
  dmIzinAlt_takip: 'Only people you follow can message you.', dmIzinAlt_kimse: 'No one can send you new messages.',
  dmIzinKaydedildi: 'Message setting saved.', dmKapali: "This person isn't accepting messages right now.",
  dmKisitli: "Your messages were reported, so you can't message people you don't know for a while."
});
Object.assign(DIL.ru, {
  geri: 'Назад', yeniPaylasim: 'Опубликовать образ', ilkPaylasim: 'Опубликуй первый образ',
  kiminBaslik: 'Для кого образы?', kiminAlt: 'От этого зависят типы одежды и то, как к тебе обращается стилист.',
  kiminKadin: 'Женщина', kiminErkek: 'Мужчина', kiminNotr: 'Не указывать',
  dmIzinBaslik: 'Кто может мне писать', dmIzinHerkes: 'Все', dmIzinTakip: 'Мои подписки', dmIzinKimse: 'Никто',
  dmIzinAlt_herkes: 'Те, на кого ты не подписана, отправляют запрос; чат откроется, только если ты примешь.',
  dmIzinAlt_takip: 'Писать могут только те, на кого ты подписана.', dmIzinAlt_kimse: 'Никто не может присылать новые сообщения.',
  dmIzinKaydedildi: 'Настройка сообщений сохранена.', dmKapali: 'Этот человек сейчас не принимает сообщения.',
  dmKisitli: 'На твои сообщения жаловались, поэтому какое-то время нельзя писать незнакомым.'
});
Object.assign(DIL.uz, {
  geri: 'Orqaga', yeniPaylasim: "Yangi obraz ulashish", ilkPaylasim: "Birinchi obrazingni ulash",
  kiminBaslik: 'Obrazlar kim uchun?', kiminAlt: "Kiyim turlari va stilistning murojaati shunga moslanadi.",
  kiminKadin: 'Ayol', kiminErkek: 'Erkak', kiminNotr: "Ko'rsatmayman",
  dmIzinBaslik: 'Menga kim yoza oladi', dmIzinHerkes: 'Hamma', dmIzinTakip: 'Men kuzatadiganlar', dmIzinKimse: 'Hech kim',
  dmIzinAlt_herkes: "Kuzatmaydiganlaring so'rov yuboradi; qabul qilmaguningcha suhbat ochilmaydi.",
  dmIzinAlt_takip: 'Faqat sen kuzatadigan odamlar yoza oladi.', dmIzinAlt_kimse: "Hech kim yangi xabar yubora olmaydi.",
  dmIzinKaydedildi: 'Xabar sozlamasi saqlandi.', dmKapali: "Bu odam hozir xabar qabul qilmaydi.",
  dmKisitli: "Xabarlaring ustidan shikoyat qilingani uchun bir muddat notanishlarga yoza olmaysan."
});
