# Kombinle

Dolabındaki kıyafetlerden havaya ve gününe uygun kombin öneren Android uygulaması (matali).

- `web/` — uygulamanın arayüzü ve kombin motoru (tek HTML). `python3 web/build.py` ile derlenir, çıktı `app/src/main/assets/www/index.html` dosyasına kopyalanır.
- `app/` — Android kabuğu: güvenli WebView, Google ses tanıma, ML Kit görüntü etiketleme (cihaz içi), Play Billing, dosya kaydetme.
- `egitim/` — Kombinle'nin kendi kıyafet tanıma modelini eğiten Colab defteri. Model `app/src/main/assets/kombinle_model.tflite` olarak APK'ya girer; ayrıntı `egitim/BENIOKU.md`.
- Her `main` gönderiminde GitHub Actions imzalı APK derler; APK **Releases** sayfasına eklenir.

`imza/deneme.p12` yalnızca deneme sürümleri içindir. Play Store sürümü ayrı bir yükleme anahtarıyla imzalanmalı.
