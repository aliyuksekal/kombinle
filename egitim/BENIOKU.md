# Kombinle modeli

`kombinle_model_egitimi.ipynb`, telefonda internetsiz çalışan kıyafet tanıma modelini eğitir.

**Model ne yapar?** Fotoğraftaki kıyafetin türünü (elbise, kot, etek, ceket, ayakkabı, çanta, gözlük, saat…) ve desenini (düz, çizgili, kareli, çiçekli, puantiyeli, hayvan deseni, diğer) bulur. Rengi uygulama kendisi hesaplar.

**Uygulamada nasıl çalışır?**
- Model eminse (%75 ve üstü) fotoğraf buluta gönderilmez: tanıma anında ve maliyetsiz olur.
- Emin değilse ya da fotoğraf takı olabilirse (modelde takı yok) bulut karar verir.
- Kullanıcı "Yapay zekâyla tekrar tanı" düğmesiyle her zaman buluta sorabilir.
- `app/src/main/assets/` içinde model yoksa uygulama eskisi gibi çalışır.

## Eğitme

1. [colab.research.google.com](https://colab.research.google.com) → **Dosya → Not defteri aç → GitHub** sekmesi.
2. **Özel depoları dahil et** kutusunu işaretle, GitHub'a izin ver, `aliyuksekal/kombinle` → `egitim/kombinle_model_egitimi.ipynb` dosyasını seç.
3. **Çalışma zamanı → Çalışma zamanı türünü değiştir → T4 GPU**.
4. **Çalışma zamanı → Tümünü çalıştır**. Yaklaşık 1–1,5 saat sürer.
5. Son hücre GitHub anahtarı ister (nasıl alınacağı defterde yazıyor) ve iki dosyayı tek kayıtla repoya gönderir:
   - `app/src/main/assets/kombinle_model.tflite`
   - `app/src/main/assets/kombinle_model.json` (sınıflar ve doğruluk ölçümleri)
6. GitHub Actions yeni APK'yı derler.

Yeniden eğitmek için defteri tekrar çalıştırman yeterli; yeni model eskisinin yerine geçer.

## Veri ve lisans

[Fashionpedia](https://fashionpedia.github.io/home/): etiketler CC BY 4.0. Fotoğrafların her birinin kendi lisansı vardır; defter ticari kullanıma kapalı (NonCommercial) olanları eğitime almaz. Atıf, model yüklüyken uygulamanın Ayarlar sayfasının altında görünür.

Fashionpedia fotoğrafları çoğunlukla üstünde giyilmiş kıyafetler; Kombinle'ye ise çoğu zaman askıda ya da yerde çekilmiş tek parça fotoğraflar gelir. Bu fark yüzünden gerçek doğruluk defterin ölçtüğünden biraz düşük olabilir. Eşik bu yüzden yüksek tutuldu.
