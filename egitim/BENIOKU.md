# Kombinle modelleri

İki Colab defteri, telefonda internetsiz çalışan iki model eğitir. İkisi de isteğe bağlıdır: `app/src/main/assets/` içinde
model dosyası yoksa uygulama eskisi gibi çalışır (bulut tanıması).

| Defter | Model | Ne yapar | Süre (T4) |
|---|---|---|---|
| `kombinle_model_egitimi.ipynb` | `kombinle_model.tflite` + `.json` | Tek kıyafeti tanır: ~40 tür, desen, kol boyu, etek/elbise boyu, "kıyafet değil" | 3–4 saat |
| `kombinle_parca_egitimi.ipynb` | `kombinle_parca.tflite` + `.json` | Boydan fotoğrafta parçaların yerini bulur (üst, alt, ayakkabı, çanta…) | 1,5–2 saat |

## Kıyafet tanıma modeli (2. sürüm)

**Öğrendikleri**
- **Tür:** tişört, sweat, askılı, bluz/gömlek, tunik, kazak, hırka, blazer, ceket, yelek, kaban, trençkot, yağmurluk, mont,
  kot, tayt, eşofman, kumaş pantolon, şort, etek, uzun etek, elbise, uzun elbise, tulum, ayakkabı, **bot, sandalet, topuklu**,
  çanta, atkı, şapka/bere, gözlük, eldiven, saat, kemer, **küpe, kolye, bileklik**, külotlu çorap, çorap, **sütyen**.
  Yeterli örneği çıkmayan tür modele alınmaz (defter hangilerinin girdiğini yazar).
- **Kıyafet değil:** yemek, araba, hayvan, telefon gibi fotoğraflar. Uygulama 🫪 gösterir, buluta gitmez.
- **Desen:** düz, çizgili, kareli, çiçekli, puantiyeli, hayvan deseni, diğer.
- **Kol boyu:** kolsuz, kısa, truvakar, uzun. **Etek/elbise/kaban boyu:** mini, diz üstü, diz, midi, maksi.
  Uygulama bunları otomatik ada ekler ("Siyah uzun kollu bluz", "Bordo midi etek") ve tür sırasını düzeltir.
- Temel ağ: EfficientNetV2-B2 (260 px), 8 bit ağırlıkla ~10 MB.

**Öğrenemedikleri** (fotoğraftan güvenilir çıkmaz): marka, fiyat, kumaş, beden. Rengi uygulama fotoğraftan kendisi hesaplar.

## Parça haritası modeli

Boydan (üzerinde, aynada) çekilmiş fotoğrafta her pikselin hangi parçaya ait olduğunu bulur: üst, ceket/mont,
pantolon/şort, etek, elbise/tulum, ayakkabı, çanta, şapka, gözlük, atkı/eşarp, kemer, çorap. Telefon her parça için
kutuyu çıkarır; uygulama "hangilerini ekleyeyim?" diye sorar ve seçilen parçayı fotoğrafın aslından keser.
Temel ağ: MobileNetV3-Large + çözücü, çıkış 80×80, ~4 MB.

## Uygulamada nasıl çalışır?

- Parça haritası boydan fotoğrafta parçaları bulduysa ayırma telefonda yapılır, buluta gidilmez.
  Listede olmayan parça için "Listede yok" ile bulut aratılabilir.
- Kıyafet modeli eminse (%75 ve üstü) fotoğraf buluta gönderilmez: tanıma anında ve maliyetsiz olur.
- "Kıyafet değil" için %90 güven aranır; altında bulut karar verir.
- Emin değilse ya da fotoğraf takı olabilirken model başka bir şey dediyse bulut karar verir.
- Kullanıcı "Yapay zekâyla tekrar tanı" düğmesiyle her zaman buluta sorabilir.

## Eğitme

1. [colab.research.google.com](https://colab.research.google.com) → **Dosya → Not defteri aç → GitHub** sekmesi.
2. **Özel depoları dahil et** kutusunu işaretle, GitHub'a izin ver, `aliyuksekal/kombinle` → `egitim/` içindeki defteri seç.
3. **Çalışma zamanı → Çalışma zamanı türünü değiştir → T4 GPU**.
4. **Çalışma zamanı → Tümünü çalıştır**. İlk hücre Google Drive izni ister: izin ver.
   Eğitim her dönem sonunda Drive'daki `kombinle_egitim` klasörüne kaydedilir. Colab bağlantısı koparsa
   defteri yeniden açıp **Tümünü çalıştır** de: veri yeniden hazırlanır, eğitim kaldığı dönemden devam eder.
5. Son hücre GitHub anahtarı ister (nasıl alınacağı defterde yazıyor) ve iki dosyayı tek kayıtla repoya gönderir.
6. GitHub Actions yeni APK'yı ve AAB'yi derler.

İki defteri aynı oturumda arka arkaya çalıştırırsan Fashionpedia ikinci kez inmez.
Ücretsiz Colab'ın süre sınırına takılırsan iki defteri farklı günlerde çalıştırabilirsin.

**Sınama:** `egitim/` değişikliği main dışındaki bir dala gönderilince GitHub Actions ("Eğitim defterleri sınaması")
iki defteri sahte küçük veriyle baştan sona çalıştırır: veri hazırlama, eğitim, ölçüm ve telefon modeline dönüştürme.

## Veri ve lisans

- [Fashionpedia](https://fashionpedia.github.io/home/): etiketler CC BY 4.0. Fotoğrafların her birinin kendi lisansı vardır;
  defterler ticari kullanıma kapalı (NonCommercial) olanları eğitime almaz.
- [Open Images](https://storage.googleapis.com/openimages/web/index.html): etiketler CC BY 4.0, fotoğraflar CC BY 2.0.
  Ulaşılamazsa defter bu adımı atlar, model yalnız Fashionpedia ile eğitilir.
- DeepFashion2 (ticari kullanım yasak) ve YOLO (AGPL) bilerek kullanılmadı.

Atıf, model yüklüyken uygulamanın Ayarlar sayfasının altında görünür.

Fashionpedia fotoğrafları çoğunlukla üstünde giyilmiş kıyafetler; Kombinle'ye ise çoğu zaman askıda ya da yerde çekilmiş
tek parça fotoğraflar gelir. Bu fark yüzünden gerçek doğruluk defterin ölçtüğünden biraz düşük olabilir. Eşikler bu yüzden yüksek tutuldu.
