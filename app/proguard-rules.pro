# Sayfadan çağrılan köprü yöntemleri adlarıyla kalmalı
-keepclassmembers class com.benim.kombinle.Kopru {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface
-keepattributes *Annotation*

# Kombinle modeli (LiteRT): yerel kod Java sınıflarını adıyla çağırır
-keep class org.tensorflow.lite.** { *; }
# GPU hızlandırıcı kullanılmıyor; isteğe bağlı sınıfları yoksa uyarma
-dontwarn org.tensorflow.lite.gpu.**
-dontwarn com.google.ai.edge.litert.**
