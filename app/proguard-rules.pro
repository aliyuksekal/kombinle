# Sayfadan çağrılan köprü yöntemleri adlarıyla kalmalı
-keepclassmembers class com.benim.kombinle.Kopru {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface
-keepattributes *Annotation*
