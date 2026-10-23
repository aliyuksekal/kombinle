# Kombinle fiyatlandırması (ABD doları tabanlı)

Ekim 2026. Kur: 1 USD ≈ 49,74 TL.

## Play Console'a girilecek fiyatlar

Varsayılan fiyat **USD** olarak girilir. Play, yerel para birimine (TL dahil) kendisi çevirir.
Play kurlar değişince fiyatları kendiliğinden güncellemez. Kur çok oynarsa ürünün fiyat sayfasındaki
**"Döviz kurlarını güncelle"** ile TL fiyatı tek dokunuşla yenilenir. Uygulama fiyatı her zaman Play'den
okur, kodda değişiklik gerekmez.

| Ürün kimliği | Tür | USD | Yaklaşık TL |
|---|---|---|---|
| `jeton_50` | Tüketilebilir | 1,99 $ | ~99 ₺ |
| `jeton_150` | Tüketilebilir | 4,99 $ | ~248 ₺ |
| `jeton_400` | Tüketilebilir | 9,99 $ | ~497 ₺ |
| `kombinle_pro_aylik` | Aylık abonelik | 9,99 $ | ~497 ₺ |

Türkiye'de fiyatlar KDV dahil görünür. KDV'yi Google tahsil edip öder.

## Kesintiler (Türkiye'deki bir kullanıcı)

1. **KDV:** %20, fiyatın içinde (fiyat / 1,20). Google ödüyor.
2. **Google hizmet bedeli:** Yılın ilk 1 milyon dolarında %15. Bunun için Play Console'da %15 programına kayıt gerekir. Abonelikler her zaman %15.
   - ABD, AB, Birleşik Krallık'ta 30 Haziran 2026'dan sonraki yeni kurulumlarda tek seferlik alımlarda %20 + %5 faturalama bedeli var. Abonelikte %10 + %5. Abonelik bu yüzden en kârlı ürün.
3. **Gelir vergisi (GVK mükerrer 20/B):** Özel banka hesabına gelen tutardan banka %15 stopaj keser ve vergi bu kadarla biter.
   - 2026 yıllık sınırı 5.300.000 TL. Sınır aşılırsa o yıl normal tarife uygulanır.
   - İstisna belgesi, özel hesap ve IBAN bildirimi gerekir.
   - Bağ-Kur primi ayrıca ödenir.
4. **Dijital hizmet vergisi:** 2026'da %5. Google'ın bunu geliştiriciye yansıttığı doğrulanamadı. Hesapta güvenlik payı olarak %5 düşüldü.

Türkiye'de elde kalan oran yaklaşık: fiyat ÷ 1,20 × 0,85 × 0,85 ≈ **fiyatın %60'ı** (dijital hizmet vergisi yansırsa %57).

| Ürün | Türkiye net | Jeton başı net | ABD net | AB net |
|---|---|---|---|---|
| 50 jeton | 1,20 $ | 0,024 $ | 1,27 $ | 1,05 $ |
| 150 jeton | 3,00 $ | 0,020 $ | 3,18 $ | 2,63 $ |
| 400 jeton | 6,01 $ | 0,015 $ | 6,37 $ | 5,26 $ |
| PRO aylık | 6,01 $ | – | 7,22 $ | 5,96 $ |

## Yapay zekâ maliyeti

Maliyeti düşürmek için işler iki modele bölündü:
- **Ana model** (Gemini 3 Flash; girdi 0,50 $, çıktı 3 $ / 1M token): kıyafet tanıma, kombin, analiz, renk analizi, bavul.
- **Hafif model** (Gemini 3.1 Flash-Lite; 0,25 $ / 1,50 $): AI Prenses sohbeti ve içerik denetimi. Bulunamazsa ana modele geçer.
- **Doğal ses** Gemini 3.8 Flash-Lite TTS ile (ses çıktısı 6 $ / 1M token, saniyede 25 token). 1 Ocak 2027'de fiyatı 12 $ olacak.

| İş | Yaklaşık maliyet |
|---|---|
| Akıllı kombin, analiz, bavul (1 jeton) | 0,009 – 0,012 $ |
| Kıyafet tanıma (ücretsiz, günde en fazla 40) | 0,006 – 0,010 $ |
| AI Prenses yazılı cevap | ~0,002 $ |
| Doğal sesli cevap (~35 sn) | ~0,005 $ (2027'den itibaren ~0,011 $) |

## Adil kullanım sınırları

| | Ücretsiz | PRO |
|---|---|---|
| Yapay zekâ işi | Jetonla (başlangıçta 15 jeton) | Günde 20 |
| AI Prenses mesajı | Günde 5 | Günde 40 |
| Doğal sesli cevap | Günde 3 (sonra telefonun sesi) | Günde 20 |
| Kıyafet tanıma | Günde 40 | Günde 40 |

Sunucu da bu sınırları ayrıca uygular: cihaz başına günlük doğal ses en fazla 25, tanıma 40.

## Sürdürülebilirlik

- **Jeton:** Her pakette jeton başına net gelir maliyetin üstünde. En dar durum AB'de 400'lük paket: net 0,013 $, maliyet 0,009–0,012 $.
- **PRO (9,99 $, Türkiye'de net 6,01 $), aylık maliyet:**
  - Ortalama kullanıcı (günde 4 iş, 8 mesaj, 6 sesli cevap): ~2,6 $ (2027'de ~3,6 $). Kâr ~3,4 $.
  - Yoğun kullanıcı (günde 10 iş, 20 mesaj, 15 ses): ~6,6 $. Yaklaşık başa baş.
  - Her gün tüm sınırları dolduran kullanıcı: ~12,8 $. Çok nadir; sınırlar bu kuyruğu keser.
- **Ücretsiz kullanıcı:** Aktif bir günde en fazla ~0,03 $ (5 mesaj, 3 ses), artı ilk gün dolabını kurarken tanıma. Bu, kullanıcı kazanma maliyetidir.
- **Takip edilecekler:**
  - 1 Ocak 2027'de doğal ses fiyatı ikiye katlanıyor. O zaman ses sınırları ya da PRO fiyatı yeniden gözden geçirilmeli.
  - `gemini-3-flash-preview` "eski model" olarak listeleniyor. Kapatılırsa yedek modele geçilir (daha pahalı); maliyet tablosu güncellenmeli.

Kaynaklar: Google Play hizmet bedelleri (support.google.com/googleplay/android-developer/answer/112622),
Play fiyatlandırma (…/answer/6334373), GVK mükerrer 20/B ve 318 Seri No.lu GVGT, EY Türkiye DHV 2026,
Gemini API fiyatları (ai.google.dev/gemini-api/docs/pricing).
