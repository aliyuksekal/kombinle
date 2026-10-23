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
| `kombinle_pro_aylik` | Aylık abonelik | 7,99 $ | ~397 ₺ |

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
| PRO aylık | 4,81 $ | – | 5,77 $ | 4,77 $ |

## Yapay zekâ maliyeti (Gemini 3 Flash: girdi 0,50 $ / 1M, çıktı 3 $ / 1M token)

| İş | Yaklaşık maliyet |
|---|---|
| Akıllı kombin, analiz, bavul (1 jeton) | 0,008 – 0,012 $ |
| Kıyafet tanıma (ücretsiz) | 0,006 – 0,010 $ |
| AI Prenses yazılı cevap | ~0,005 $ |
| Doğal ses (TTS) | ~0,009 $ (1 Ocak 2027'den itibaren ~0,018 $) |

Jeton başına net gelir en düşük 0,013 $ (AB, 400'lük paket). Bu yüzden hiçbir pakette zarar edilmez.

**PRO** ortalama kullanımda kâr eder: günde 3 iş ve 5 sesli mesaj ayda ~3 $ tutar.
Çok yoğun kullanıcılar adil kullanım sınırlarına takılır. Zarar riski, ücretsiz kullanıcıların doğal sesi
ve sohbeti çok kullanmasındadır (sınırlar: magaza notu, onaya sunuldu).

Kaynaklar: Google Play hizmet bedelleri (support.google.com/googleplay/android-developer/answer/112622),
Play fiyatlandırma (…/answer/6334373), GVK mükerrer 20/B ve 318 Seri No.lu GVGT, EY Türkiye DHV 2026,
Gemini API fiyatları (ai.google.dev/gemini-api/docs/pricing).
