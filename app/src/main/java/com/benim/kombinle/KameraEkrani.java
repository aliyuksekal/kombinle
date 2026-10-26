package com.benim.kombinle;

import android.Manifest;
import android.animation.ValueAnimator;
import android.annotation.SuppressLint;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.Outline;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.drawable.GradientDrawable;
import android.media.ExifInterface;
import android.media.MediaActionSound;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Size;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.HapticFeedbackConstants;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.OrientationEventListener;
import android.view.ScaleGestureDetector;
import android.view.Surface;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewOutlineProvider;
import android.view.WindowManager;
import android.view.animation.DecelerateInterpolator;
import android.widget.FrameLayout;
import android.widget.HorizontalScrollView;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.activity.ComponentActivity;
import androidx.camera.core.Camera;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.FocusMeteringAction;
import androidx.camera.core.ImageCapture;
import androidx.camera.core.ImageCaptureException;
import androidx.camera.core.MeteringPoint;
import androidx.camera.core.Preview;
import androidx.camera.core.ZoomState;
import androidx.camera.core.resolutionselector.AspectRatioStrategy;
import androidx.camera.core.resolutionselector.ResolutionSelector;
import androidx.camera.core.resolutionselector.ResolutionStrategy;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.view.PreviewView;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.google.common.util.concurrent.ListenableFuture;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.util.ArrayList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

/**
 * Kombinle kamerası (CameraX, telefonun kendi kamera donanımıyla).
 * Ekranda gördüğün 3:4 kare, çekilen fotoğrafın aynısıdır. Dokunarak odaklama, iki parmakla ya da
 * 0.5× / 1× / 2× düğmeleriyle yakınlaştırma, flaş (otomatik/açık/kapalı), zamanlayıcı, ızgara,
 * ses tuşuyla çekim, art arda çekim. Modlar ve metinler uygulamadan (seçili dilde) gelir.
 * Sonuç: önbellekteki JPEG dosyalarının yolları (en uzun kenar en fazla 2048 px, doğru yönde).
 */
public class KameraEkrani extends ComponentActivity {

    static final String SECENEK = "secenek";
    static final String SONUC_DOSYALAR = "dosyalar";
    static final String SONUC_GALERI = "galeri";
    static final String SONUC_HATA = "hata";
    private static final int IZIN = 41;
    private static final int EN_FAZLA = 10;
    private static final int EN_UZUN = 2048;

    private final Handler ui = new Handler(Looper.getMainLooper());
    private final ExecutorService isci = Executors.newSingleThreadExecutor();
    private final ArrayList<String> cekilenler = new ArrayList<>();

    private JSONObject etiket = new JSONObject();
    private final ArrayList<String> modlar = new ArrayList<>();
    private String mod = "kiyafet";
    private boolean tek = false, onKamera = false, izgaraAcik = true, cekiliyor = false;
    private int flas = ImageCapture.FLASH_MODE_AUTO, zamanlayici = 0, kalan = 0;

    private PreviewView vizor;
    private FrameLayout sahne;
    private Izgara izgara;
    private OdakHalkasi odak;
    private View flasPerde;
    private TextView sayac, ipucu, yakinYazi, bitti, adet;
    private ImageButton flasBtn, zamanBtn, izgaraBtn, cevirBtn;
    private ImageView galeri;
    private Deklansor deklansor;
    private LinearLayout modSira, yakinSira;

    private ProcessCameraProvider saglayici;
    private Camera kamera;
    private ImageCapture yakala;
    private OrientationEventListener yon;
    private MediaActionSound ses;
    private Runnable geriSay;

    private float dp(float v) {
        return TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics());
    }

    private String yazi(String k, String varsayilan) {
        String v = etiket.optString(k, "");
        return v.isEmpty() ? varsayilan : v;
    }

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        getOnBackPressedDispatcher().addCallback(this, new androidx.activity.OnBackPressedCallback(true) {
            @Override public void handleOnBackPressed() { kapatIste(); }
        });
        try {
            JSONObject o = new JSONObject(getIntent().getStringExtra(SECENEK) == null ? "{}" : getIntent().getStringExtra(SECENEK));
            etiket = o.optJSONObject("etiket") != null ? o.optJSONObject("etiket") : new JSONObject();
            tek = o.optBoolean("tek", false);
            JSONArray m = o.optJSONArray("modlar");
            if (m != null) for (int i = 0; i < m.length() && i < 5; i++) {
                String s = m.optString(i, "");
                if (s.matches("kiyafet|boydan|gonderi|selfie|urun")) modlar.add(s);
            }
            if (modlar.isEmpty()) modlar.add("kiyafet");
            mod = o.optString("mod", modlar.get(0));
            if (!modlar.contains(mod)) mod = modlar.get(0);
        } catch (Exception e) {
            modlar.clear();
            modlar.add("kiyafet");
        }
        izgaraAcik = getSharedPreferences("kamera", MODE_PRIVATE).getBoolean("izgara", true);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.BLACK);
        WindowInsetsControllerCompat w = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        w.setAppearanceLightStatusBars(false);
        w.setAppearanceLightNavigationBars(false);
        arayuzKur();
        try {
            ses = new MediaActionSound();
            ses.load(MediaActionSound.SHUTTER_CLICK);
        } catch (Throwable ignored) {
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) baslat();
        else requestPermissions(new String[]{Manifest.permission.CAMERA}, IZIN);
    }

    @Override
    public void onRequestPermissionsResult(int kod, String[] izinler, int[] sonuclar) {
        super.onRequestPermissionsResult(kod, izinler, sonuclar);
        if (kod != IZIN) return;
        if (sonuclar.length > 0 && sonuclar[0] == PackageManager.PERMISSION_GRANTED) baslat();
        else bitir(false, "izin");
    }

    /* ------------------------------------------------------------ arayüz */

    private ImageButton yuvarlakDugme(int simge, String aciklama) {
        ImageButton d = new ImageButton(this);
        d.setImageResource(simge);
        d.setContentDescription(aciklama);
        d.setScaleType(ImageView.ScaleType.CENTER);
        GradientDrawable z = new GradientDrawable();
        z.setShape(GradientDrawable.OVAL);
        z.setColor(0x33000000);
        d.setBackground(z);
        int p = (int) dp(10);
        d.setPadding(p, p, p, p);
        return d;
    }

    private GradientDrawable hap(int renk) {
        GradientDrawable g = new GradientDrawable();
        g.setCornerRadius(dp(999));
        g.setColor(renk);
        return g;
    }

    @SuppressLint("ClickableViewAccessibility")
    private void arayuzKur() {
        FrameLayout kok = new FrameLayout(this);
        kok.setBackgroundColor(Color.BLACK);
        setContentView(kok);

        // 3:4 sahne: vizör + ızgara + odak halkası + flaş perdesi + geri sayım
        sahne = new FrameLayout(this);
        sahne.setClipToOutline(true);
        sahne.setOutlineProvider(new ViewOutlineProvider() {
            @Override
            public void getOutline(View v, Outline o) {
                o.setRoundRect(0, 0, v.getWidth(), v.getHeight(), dp(18));
            }
        });
        vizor = new PreviewView(this);
        vizor.setScaleType(PreviewView.ScaleType.FILL_CENTER);
        vizor.setImplementationMode(PreviewView.ImplementationMode.COMPATIBLE);
        sahne.addView(vizor, new FrameLayout.LayoutParams(-1, -1));
        izgara = new Izgara(this);
        sahne.addView(izgara, new FrameLayout.LayoutParams(-1, -1));
        izgara.setVisibility(izgaraAcik ? View.VISIBLE : View.GONE);
        odak = new OdakHalkasi(this);
        sahne.addView(odak, new FrameLayout.LayoutParams((int) dp(76), (int) dp(76)));
        odak.setAlpha(0f);
        flasPerde = new View(this);
        flasPerde.setBackgroundColor(Color.WHITE);
        flasPerde.setAlpha(0f);
        sahne.addView(flasPerde, new FrameLayout.LayoutParams(-1, -1));
        sayac = new TextView(this);
        sayac.setTextColor(Color.WHITE);
        sayac.setTextSize(TypedValue.COMPLEX_UNIT_SP, 96);
        sayac.setShadowLayer(dp(8), 0, 0, 0x88000000);
        sayac.setGravity(Gravity.CENTER);
        sayac.setVisibility(View.GONE);
        sahne.addView(sayac, new FrameLayout.LayoutParams(-1, -1));
        yakinYazi = new TextView(this);
        yakinYazi.setTextColor(Color.WHITE);
        yakinYazi.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
        yakinYazi.setBackground(hap(0x99000000));
        yakinYazi.setPadding((int) dp(12), (int) dp(5), (int) dp(12), (int) dp(5));
        yakinYazi.setVisibility(View.GONE);
        FrameLayout.LayoutParams yl = new FrameLayout.LayoutParams(-2, -2, Gravity.CENTER_HORIZONTAL | Gravity.TOP);
        yl.topMargin = (int) dp(16);
        sahne.addView(yakinYazi, yl);
        kok.addView(sahne);

        // üst çubuk
        LinearLayout ust = new LinearLayout(this);
        ust.setOrientation(LinearLayout.HORIZONTAL);
        ust.setGravity(Gravity.CENTER_VERTICAL);
        int y = (int) dp(12);
        ust.setPadding(y, y, y, y);
        ImageButton kapat = yuvarlakDugme(R.drawable.ic_kam_kapat, yazi("kapat", "Kapat"));
        kapat.setOnClickListener(v -> kapatIste());
        ust.addView(kapat, new LinearLayout.LayoutParams((int) dp(44), (int) dp(44)));
        View bosluk = new View(this);
        ust.addView(bosluk, new LinearLayout.LayoutParams(0, 1, 1f));
        flasBtn = yuvarlakDugme(R.drawable.ic_kam_flas_oto, yazi("flas", "Flaş"));
        flasBtn.setOnClickListener(v -> flasDegis());
        zamanBtn = yuvarlakDugme(R.drawable.ic_kam_saat, yazi("zamanlayici", "Zamanlayıcı"));
        zamanBtn.setOnClickListener(v -> zamanDegis());
        izgaraBtn = yuvarlakDugme(R.drawable.ic_kam_izgara, yazi("izgara", "Izgara"));
        izgaraBtn.setOnClickListener(v -> izgaraDegis());
        for (ImageButton d : new ImageButton[]{flasBtn, zamanBtn, izgaraBtn}) {
            LinearLayout.LayoutParams p = new LinearLayout.LayoutParams((int) dp(44), (int) dp(44));
            p.leftMargin = (int) dp(10);
            ust.addView(d, p);
        }
        kok.addView(ust, new FrameLayout.LayoutParams(-1, -2, Gravity.TOP));

        ipucu = new TextView(this);
        ipucu.setTextColor(Color.WHITE);
        ipucu.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
        ipucu.setBackground(hap(0x8C000000));
        ipucu.setGravity(Gravity.CENTER);
        ipucu.setPadding((int) dp(14), (int) dp(7), (int) dp(14), (int) dp(7));
        ipucu.setMaxWidth((int) (getResources().getDisplayMetrics().widthPixels * 0.86f));
        kok.addView(ipucu, new FrameLayout.LayoutParams(-2, -2, Gravity.CENTER_HORIZONTAL | Gravity.TOP));

        // alt bölüm: yakınlaştırma, modlar, galeri - deklanşör - çevir
        LinearLayout alt = new LinearLayout(this);
        alt.setOrientation(LinearLayout.VERTICAL);
        alt.setGravity(Gravity.CENTER_HORIZONTAL);
        yakinSira = new LinearLayout(this);
        yakinSira.setOrientation(LinearLayout.HORIZONTAL);
        yakinSira.setGravity(Gravity.CENTER);
        yakinSira.setBackground(hap(0x55000000));
        yakinSira.setPadding((int) dp(4), (int) dp(4), (int) dp(4), (int) dp(4));
        LinearLayout.LayoutParams ysl = new LinearLayout.LayoutParams(-2, -2);
        ysl.bottomMargin = (int) dp(12);
        alt.addView(yakinSira, ysl);

        HorizontalScrollView modKaydir = new HorizontalScrollView(this);
        modKaydir.setHorizontalScrollBarEnabled(false);
        modSira = new LinearLayout(this);
        modSira.setOrientation(LinearLayout.HORIZONTAL);
        modSira.setGravity(Gravity.CENTER);
        modKaydir.addView(modSira);
        LinearLayout.LayoutParams ml = new LinearLayout.LayoutParams(-2, -2);
        ml.bottomMargin = (int) dp(14);
        alt.addView(modKaydir, ml);

        FrameLayout sira = new FrameLayout(this);
        galeri = new ImageView(this);
        galeri.setScaleType(ImageView.ScaleType.CENTER_CROP);
        galeri.setImageResource(R.drawable.ic_kam_galeri);
        galeri.setContentDescription(yazi("galeri", "Galeri"));
        GradientDrawable gz = new GradientDrawable();
        gz.setCornerRadius(dp(12));
        gz.setColor(0x33FFFFFF);
        gz.setStroke((int) dp(2), Color.WHITE);
        galeri.setBackground(gz);
        galeri.setClipToOutline(true);
        galeri.setOutlineProvider(new ViewOutlineProvider() {
            @Override
            public void getOutline(View v, Outline o) {
                o.setRoundRect(0, 0, v.getWidth(), v.getHeight(), dp(12));
            }
        });
        int gp = (int) dp(11);
        galeri.setPadding(gp, gp, gp, gp);
        galeri.setOnClickListener(v -> galeriDokun());
        FrameLayout.LayoutParams gl = new FrameLayout.LayoutParams((int) dp(50), (int) dp(50), Gravity.CENTER_VERTICAL | Gravity.START);
        gl.leftMargin = (int) dp(30);
        sira.addView(galeri, gl);
        adet = new TextView(this);
        adet.setTextColor(Color.BLACK);
        adet.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11);
        adet.setTypeface(adet.getTypeface(), android.graphics.Typeface.BOLD);
        adet.setGravity(Gravity.CENTER);
        adet.setBackground(hap(Color.WHITE));
        adet.setVisibility(View.GONE);
        FrameLayout.LayoutParams al = new FrameLayout.LayoutParams((int) dp(22), (int) dp(22), Gravity.CENTER_VERTICAL | Gravity.START);
        al.leftMargin = (int) dp(66);
        al.topMargin = -(int) dp(22);
        sira.addView(adet, al);

        deklansor = new Deklansor(this);
        deklansor.setContentDescription(yazi("cek", "Fotoğraf çek"));
        deklansor.setOnClickListener(v -> cekBas());
        sira.addView(deklansor, new FrameLayout.LayoutParams((int) dp(82), (int) dp(82), Gravity.CENTER));

        LinearLayout sag = new LinearLayout(this);
        sag.setOrientation(LinearLayout.VERTICAL);
        sag.setGravity(Gravity.CENTER);
        bitti = new TextView(this);
        bitti.setTextColor(Color.BLACK);
        bitti.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
        bitti.setTypeface(bitti.getTypeface(), android.graphics.Typeface.BOLD);
        bitti.setBackground(hap(Color.WHITE));
        bitti.setPadding((int) dp(16), (int) dp(9), (int) dp(16), (int) dp(9));
        bitti.setVisibility(View.GONE);
        bitti.setOnClickListener(v -> bitir(true, null));
        sag.addView(bitti, new LinearLayout.LayoutParams(-2, -2));
        cevirBtn = yuvarlakDugme(R.drawable.ic_kam_cevir, yazi("cevir", "Kamerayı çevir"));
        cevirBtn.setOnClickListener(v -> {
            onKamera = !onKamera;
            ValueAnimator a = ValueAnimator.ofFloat(0f, 180f);
            a.setDuration(320);
            a.addUpdateListener(an -> cevirBtn.setRotation((float) an.getAnimatedValue()));
            a.start();
            kameraBagla();
        });
        LinearLayout.LayoutParams cl = new LinearLayout.LayoutParams((int) dp(50), (int) dp(50));
        cl.topMargin = (int) dp(4);
        sag.addView(cevirBtn, cl);
        FrameLayout.LayoutParams sl = new FrameLayout.LayoutParams(-2, -2, Gravity.CENTER_VERTICAL | Gravity.END);
        sl.rightMargin = (int) dp(26);
        sira.addView(sag, sl);
        alt.addView(sira, new LinearLayout.LayoutParams(-1, (int) dp(96)));
        kok.addView(alt, new FrameLayout.LayoutParams(-1, -2, Gravity.BOTTOM));

        // sistem çubuklarına göre yerleşim: sahne üst çubuğun altında, 3:4
        ViewCompat.setOnApplyWindowInsetsListener(kok, (v, ic) -> {
            Insets s = ic.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            ust.setPadding(y, s.top + (int) dp(6), y, y);
            alt.setPadding(0, 0, 0, s.bottom + (int) dp(14));
            int gen = getResources().getDisplayMetrics().widthPixels;
            int boy = gen * 4 / 3;
            int ekranBoy = getResources().getDisplayMetrics().heightPixels;
            FrameLayout.LayoutParams sp = new FrameLayout.LayoutParams(gen, boy, Gravity.TOP);
            // yer varsa üst çubuğun altından, yoksa en üstten (çubuk sahnenin üstünde yüzer)
            int ustBoy = s.top + (int) dp(68);
            sp.topMargin = ekranBoy - boy - ustBoy >= dp(220) ? ustBoy : Math.max(0, s.top);
            sahne.setLayoutParams(sp);
            FrameLayout.LayoutParams ip = (FrameLayout.LayoutParams) ipucu.getLayoutParams();
            ip.topMargin = sp.topMargin + boy - (int) dp(54);
            ipucu.setLayoutParams(ip);
            return ic;
        });

        // dokunarak odaklama ve iki parmakla yakınlaştırma
        ScaleGestureDetector tutam = new ScaleGestureDetector(this, new ScaleGestureDetector.SimpleOnScaleGestureListener() {
            @Override
            public boolean onScale(ScaleGestureDetector d) {
                if (kamera == null) return true;
                ZoomState z = kamera.getCameraInfo().getZoomState().getValue();
                if (z == null) return true;
                float yeni = Math.max(z.getMinZoomRatio(), Math.min(z.getMaxZoomRatio(), z.getZoomRatio() * d.getScaleFactor()));
                kamera.getCameraControl().setZoomRatio(yeni);
                yakinGoster(yeni);
                return true;
            }
        });
        vizor.setOnTouchListener((v, e) -> {
            tutam.onTouchEvent(e);
            if (e.getActionMasked() == MotionEvent.ACTION_UP && !tutam.isInProgress() && e.getPointerCount() == 1) odakla(e.getX(), e.getY());
            return true;
        });

        modlariCiz();
        ustDugmeleriCiz();
    }

    private void modlariCiz() {
        modSira.removeAllViews();
        if (modlar.size() < 2) {
            if (!modlar.isEmpty()) {
                TextView t = new TextView(this);
                t.setText(yazi("mod_" + mod, mod));
                t.setTextColor(0xFFFFD54F);
                t.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
                t.setTypeface(t.getTypeface(), android.graphics.Typeface.BOLD);
                t.setLetterSpacing(0.08f);
                t.setAllCaps(true);
                modSira.addView(t);
            }
        } else {
            for (final String m : modlar) {
                TextView t = new TextView(this);
                t.setText(yazi("mod_" + m, m));
                t.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
                t.setLetterSpacing(0.08f);
                t.setAllCaps(true);
                boolean secili = m.equals(mod);
                t.setTextColor(secili ? 0xFFFFD54F : 0xB3FFFFFF);
                t.setTypeface(t.getTypeface(), secili ? android.graphics.Typeface.BOLD : android.graphics.Typeface.NORMAL);
                t.setPadding((int) dp(14), (int) dp(6), (int) dp(14), (int) dp(6));
                t.setOnClickListener(v -> modSec(m));
                modSira.addView(t);
            }
        }
        ipucu.setText(yazi("ipucu_" + mod, ""));
        ipucu.setVisibility(ipucu.getText().length() > 0 ? View.VISIBLE : View.GONE);
    }

    private void modSec(String m) {
        if (m.equals(mod) || cekiliyor) return;
        mod = m;
        dokunus();
        boolean onIster = "boydan".equals(m) || "selfie".equals(m);
        zamanlayici = "boydan".equals(m) ? 10 : 0;
        ustDugmeleriCiz();
        modlariCiz();
        if (onIster != onKamera) {
            onKamera = onIster;
            kameraBagla();
        }
    }

    private void ustDugmeleriCiz() {
        flasBtn.setImageResource(flas == ImageCapture.FLASH_MODE_ON ? R.drawable.ic_kam_flas : flas == ImageCapture.FLASH_MODE_OFF ? R.drawable.ic_kam_flas_yok : R.drawable.ic_kam_flas_oto);
        zamanBtn.setAlpha(zamanlayici > 0 ? 1f : 0.85f);
        GradientDrawable z = (GradientDrawable) zamanBtn.getBackground();
        z.setColor(zamanlayici > 0 ? 0xCCFFD54F : 0x33000000);
        zamanBtn.setContentDescription(yazi("zamanlayici", "Zamanlayıcı") + (zamanlayici > 0 ? " " + zamanlayici + "s" : ""));
        GradientDrawable g = (GradientDrawable) izgaraBtn.getBackground();
        g.setColor(izgaraAcik ? 0x66FFFFFF : 0x33000000);
    }

    private void flasDegis() {
        flas = flas == ImageCapture.FLASH_MODE_AUTO ? ImageCapture.FLASH_MODE_ON : flas == ImageCapture.FLASH_MODE_ON ? ImageCapture.FLASH_MODE_OFF : ImageCapture.FLASH_MODE_AUTO;
        if (yakala != null) yakala.setFlashMode(flas);
        dokunus();
        ustDugmeleriCiz();
        kisaYazi(flas == ImageCapture.FLASH_MODE_ON ? yazi("flasAcik", "Flaş açık") : flas == ImageCapture.FLASH_MODE_OFF ? yazi("flasKapali", "Flaş kapalı") : yazi("flasOto", "Flaş otomatik"));
    }

    private void zamanDegis() {
        zamanlayici = zamanlayici == 0 ? 3 : zamanlayici == 3 ? 10 : 0;
        dokunus();
        ustDugmeleriCiz();
        kisaYazi(zamanlayici == 0 ? yazi("zamanKapali", "Zamanlayıcı kapalı") : zamanlayici + " s");
    }

    private void izgaraDegis() {
        izgaraAcik = !izgaraAcik;
        izgara.setVisibility(izgaraAcik ? View.VISIBLE : View.GONE);
        getSharedPreferences("kamera", MODE_PRIVATE).edit().putBoolean("izgara", izgaraAcik).apply();
        dokunus();
        ustDugmeleriCiz();
    }

    private void kisaYazi(String s) {
        yakinYazi.setText(s);
        yakinYazi.setVisibility(View.VISIBLE);
        yakinYazi.setAlpha(1f);
        yakinYazi.removeCallbacks(yakinGizle);
        yakinYazi.postDelayed(yakinGizle, 1200);
    }

    private final Runnable yakinGizle = () -> yakinYazi.animate().alpha(0f).setDuration(250).withEndAction(() -> yakinYazi.setVisibility(View.GONE)).start();

    private void yakinGoster(float z) {
        kisaYazi(String.format(java.util.Locale.US, "%.1f×", z));
        yakinCipleri();
    }

    private void yakinCipleri() {
        yakinSira.removeAllViews();
        if (kamera == null) return;
        ZoomState z = kamera.getCameraInfo().getZoomState().getValue();
        if (z == null) return;
        ArrayList<Float> l = new ArrayList<>();
        if (z.getMinZoomRatio() < 0.95f) l.add(Math.max(0.5f, z.getMinZoomRatio()));
        l.add(1f);
        if (z.getMaxZoomRatio() >= 2f) l.add(2f);
        if (l.size() < 2) {
            yakinSira.setVisibility(View.GONE);
            return;
        }
        yakinSira.setVisibility(View.VISIBLE);
        float simdi = z.getZoomRatio();
        for (final float f : l) {
            TextView t = new TextView(this);
            boolean secili = Math.abs(simdi - f) < 0.15f || (f == 1f && simdi > 1.15f && simdi < 1.85f);
            t.setText(secili && Math.abs(simdi - f) >= 0.05f ? String.format(java.util.Locale.US, "%.1f×", simdi) : (f < 1f ? String.format(java.util.Locale.US, "%.1f", f) : String.format(java.util.Locale.US, "%d×", (int) f)));
            t.setTextColor(secili ? 0xFFFFD54F : Color.WHITE);
            t.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
            t.setTypeface(t.getTypeface(), android.graphics.Typeface.BOLD);
            t.setGravity(Gravity.CENTER);
            t.setBackground(hap(secili ? 0x99000000 : 0x00000000));
            LinearLayout.LayoutParams p = new LinearLayout.LayoutParams((int) dp(secili ? 42 : 34), (int) dp(secili ? 42 : 34));
            p.leftMargin = p.rightMargin = (int) dp(3);
            t.setOnClickListener(v -> {
                if (kamera != null) kamera.getCameraControl().setZoomRatio(f);
                dokunus();
                ui.postDelayed(this::yakinCipleri, 120);
            });
            yakinSira.addView(t, p);
        }
    }

    private void dokunus() {
        try {
            deklansor.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY);
        } catch (Throwable ignored) {
        }
    }

    /* ------------------------------------------------------------ kamera */

    private void baslat() {
        onKamera = "boydan".equals(mod) || "selfie".equals(mod);
        zamanlayici = "boydan".equals(mod) ? 10 : 0;
        ustDugmeleriCiz();
        final ListenableFuture<ProcessCameraProvider> f = ProcessCameraProvider.getInstance(this);
        f.addListener(() -> {
            try {
                saglayici = f.get();
                kameraBagla();
            } catch (Exception e) {
                bitir(false, "kamera");
            }
        }, ContextCompat.getMainExecutor(this));
        yon = new OrientationEventListener(this) {
            @Override
            public void onOrientationChanged(int a) {
                if (a == ORIENTATION_UNKNOWN || yakala == null) return;
                int r = a >= 45 && a < 135 ? Surface.ROTATION_270 : a >= 135 && a < 225 ? Surface.ROTATION_180 : a >= 225 && a < 315 ? Surface.ROTATION_90 : Surface.ROTATION_0;
                yakala.setTargetRotation(r);
            }
        };
        if (yon.canDetectOrientation()) yon.enable();
    }

    private void kameraBagla() {
        if (saglayici == null) return;
        CameraSelector secici = onKamera ? CameraSelector.DEFAULT_FRONT_CAMERA : CameraSelector.DEFAULT_BACK_CAMERA;
        try {
            if (!saglayici.hasCamera(secici)) {
                onKamera = !onKamera;
                secici = onKamera ? CameraSelector.DEFAULT_FRONT_CAMERA : CameraSelector.DEFAULT_BACK_CAMERA;
            }
        } catch (Exception ignored) {
        }
        ResolutionSelector cozunurluk = new ResolutionSelector.Builder()
                .setAspectRatioStrategy(AspectRatioStrategy.RATIO_4_3_FALLBACK_AUTO_STRATEGY)
                .setResolutionStrategy(new ResolutionStrategy(new Size(2048, 1536), ResolutionStrategy.FALLBACK_RULE_CLOSEST_HIGHER_THEN_LOWER))
                .build();
        Preview onizleme = new Preview.Builder()
                .setResolutionSelector(new ResolutionSelector.Builder().setAspectRatioStrategy(AspectRatioStrategy.RATIO_4_3_FALLBACK_AUTO_STRATEGY).build())
                .build();
        onizleme.setSurfaceProvider(vizor.getSurfaceProvider());
        yakala = new ImageCapture.Builder()
                .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
                .setFlashMode(flas)
                .setResolutionSelector(cozunurluk)
                .build();
        try {
            saglayici.unbindAll();
            kamera = saglayici.bindToLifecycle(this, secici, onizleme, yakala);
            boolean flasVar = kamera.getCameraInfo().hasFlashUnit();
            flasBtn.setVisibility(flasVar ? View.VISIBLE : View.GONE);
            kamera.getCameraInfo().getZoomState().observe(this, z -> yakinCipleri());
            deklansor.setEnabled(true);
        } catch (Exception e) {
            bitir(false, "kamera");
        }
    }

    private void odakla(float x, float y) {
        if (kamera == null) return;
        try {
            MeteringPoint p = vizor.getMeteringPointFactory().createPoint(x, y);
            kamera.getCameraControl().startFocusAndMetering(new FocusMeteringAction.Builder(p, FocusMeteringAction.FLAG_AF | FocusMeteringAction.FLAG_AE)
                    .setAutoCancelDuration(4, TimeUnit.SECONDS).build());
        } catch (Exception ignored) {
        }
        odak.setX(x - odak.getWidth() / 2f);
        odak.setY(y - odak.getHeight() / 2f);
        odak.animate().cancel();
        odak.setScaleX(1.5f);
        odak.setScaleY(1.5f);
        odak.setAlpha(1f);
        odak.animate().scaleX(1f).scaleY(1f).setDuration(260).setInterpolator(new DecelerateInterpolator())
                .withEndAction(() -> odak.animate().alpha(0f).setStartDelay(700).setDuration(300).start()).start();
        dokunus();
    }

    /* ------------------------------------------------------------ çekim */

    private void cekBas() {
        if (yakala == null || cekiliyor) return;
        if (geriSay != null) {    // geri sayım sürerken basmak iptal eder
            ui.removeCallbacks(geriSay);
            geriSay = null;
            sayac.setVisibility(View.GONE);
            deklansor.ilerleme(-1f);
            return;
        }
        if (cekilenler.size() >= EN_FAZLA) {
            kisaYazi(yazi("enFazla", "En fazla {n}").replace("{n}", String.valueOf(EN_FAZLA)));
            return;
        }
        if (zamanlayici <= 0) {
            cek();
            return;
        }
        kalan = zamanlayici;
        final long bas = System.currentTimeMillis();
        sayac.setVisibility(View.VISIBLE);
        geriSay = new Runnable() {
            @Override
            public void run() {
                long gecen = System.currentTimeMillis() - bas;
                int k = zamanlayici - (int) (gecen / 1000);
                deklansor.ilerleme(Math.min(1f, gecen / (zamanlayici * 1000f)));
                if (k <= 0) {
                    geriSay = null;
                    sayac.setVisibility(View.GONE);
                    deklansor.ilerleme(-1f);
                    cek();
                    return;
                }
                if (k != kalan || sayac.getText().length() == 0) {
                    kalan = k;
                    sayac.setText(String.valueOf(k));
                    sayac.setScaleX(1.4f);
                    sayac.setScaleY(1.4f);
                    sayac.setAlpha(0.4f);
                    sayac.animate().scaleX(1f).scaleY(1f).alpha(1f).setDuration(300).start();
                    dokunus();
                }
                ui.postDelayed(this, 50);
            }
        };
        sayac.setText("");
        ui.post(geriSay);
    }

    private void cek() {
        if (yakala == null || cekiliyor) return;
        cekiliyor = true;
        deklansor.setEnabled(false);
        deklansor.bas();
        flasPerde.setAlpha(0.85f);
        flasPerde.animate().alpha(0f).setDuration(260).start();
        try {
            if (ses != null) ses.play(MediaActionSound.SHUTTER_CLICK);
        } catch (Throwable ignored) {
        }
        dokunus();
        File klasor = new File(getCacheDir(), "kamera");
        //noinspection ResultOfMethodCallIgnored
        klasor.mkdirs();
        final File ham = new File(klasor, "ham_" + System.currentTimeMillis() + ".jpg");
        ImageCapture.OutputFileOptions o = new ImageCapture.OutputFileOptions.Builder(ham).build();
        yakala.takePicture(o, isci, new ImageCapture.OnImageSavedCallback() {
            @Override
            public void onImageSaved(ImageCapture.OutputFileResults r) {
                final File son = hazirla(ham);
                ui.post(() -> {
                    cekiliyor = false;
                    deklansor.setEnabled(true);
                    if (son == null) {
                        kisaYazi(yazi("hata", "Fotoğraf kaydedilemedi"));
                        return;
                    }
                    cekilenler.add(son.getAbsolutePath());
                    if (tek) {
                        bitir(true, null);
                        return;
                    }
                    galeriCiz(son);
                });
            }

            @Override
            public void onError(ImageCaptureException e) {
                ui.post(() -> {
                    cekiliyor = false;
                    deklansor.setEnabled(true);
                    kisaYazi(yazi("hata", "Fotoğraf çekilemedi"));
                });
            }
        });
    }

    /** EXIF yönüne göre döndürür, en uzun kenarı 2048 px'e indirir, JPEG %90 yazar. */
    private File hazirla(File ham) {
        try {
            BitmapFactory.Options o = new BitmapFactory.Options();
            o.inJustDecodeBounds = true;
            BitmapFactory.decodeFile(ham.getAbsolutePath(), o);
            int ornek = 1;
            while (Math.max(o.outWidth, o.outHeight) / (ornek * 2) >= EN_UZUN) ornek *= 2;
            o = new BitmapFactory.Options();
            o.inSampleSize = ornek;
            Bitmap b = BitmapFactory.decodeFile(ham.getAbsolutePath(), o);
            if (b == null) return null;
            int yonu = new ExifInterface(ham.getAbsolutePath()).getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL);
            Matrix m = new Matrix();
            if (yonu == ExifInterface.ORIENTATION_ROTATE_90) m.postRotate(90);
            else if (yonu == ExifInterface.ORIENTATION_ROTATE_180) m.postRotate(180);
            else if (yonu == ExifInterface.ORIENTATION_ROTATE_270) m.postRotate(270);
            else if (yonu == ExifInterface.ORIENTATION_FLIP_HORIZONTAL) m.postScale(-1, 1);
            float olcek = Math.min(1f, EN_UZUN / (float) Math.max(b.getWidth(), b.getHeight()));
            if (olcek < 1f) m.postScale(olcek, olcek);
            Bitmap d = Bitmap.createBitmap(b, 0, 0, b.getWidth(), b.getHeight(), m, true);
            if (d != b) b.recycle();
            File son = new File(ham.getParentFile(), "kare_" + System.currentTimeMillis() + "_" + cekilenler.size() + ".jpg");
            try (FileOutputStream f = new FileOutputStream(son)) {
                d.compress(Bitmap.CompressFormat.JPEG, 90, f);
            }
            d.recycle();
            //noinspection ResultOfMethodCallIgnored
            ham.delete();
            return son;
        } catch (Throwable t) {
            return null;
        }
    }

    private void galeriCiz(File son) {
        try {
            BitmapFactory.Options o = new BitmapFactory.Options();
            o.inSampleSize = 8;
            Bitmap k = BitmapFactory.decodeFile(son.getAbsolutePath(), o);
            if (k != null) {
                galeri.setPadding(0, 0, 0, 0);
                galeri.setImageBitmap(k);
                galeri.setScaleX(0.6f);
                galeri.setScaleY(0.6f);
                galeri.animate().scaleX(1f).scaleY(1f).setDuration(240).setInterpolator(new DecelerateInterpolator()).start();
            }
        } catch (Throwable ignored) {
        }
        int n = cekilenler.size();
        adet.setText(String.valueOf(n));
        adet.setVisibility(View.VISIBLE);
        bitti.setText(yazi("bitti", "Bitti ({n})").replace("{n}", String.valueOf(n)));
        bitti.setVisibility(View.VISIBLE);
        galeri.setContentDescription(yazi("cekilen", "{n}").replace("{n}", String.valueOf(n)));
    }

    private void galeriDokun() {
        if (!cekilenler.isEmpty()) {
            // son çekileni geri al
            String s = cekilenler.remove(cekilenler.size() - 1);
            //noinspection ResultOfMethodCallIgnored
            new File(s).delete();
            dokunus();
            kisaYazi(yazi("sonSilindi", "Son fotoğraf silindi"));
            if (cekilenler.isEmpty()) {
                galeri.setImageResource(R.drawable.ic_kam_galeri);
                int gp = (int) dp(11);
                galeri.setPadding(gp, gp, gp, gp);
                adet.setVisibility(View.GONE);
                bitti.setVisibility(View.GONE);
            } else galeriCiz(new File(cekilenler.get(cekilenler.size() - 1)));
            return;
        }
        Intent i = new Intent();
        i.putExtra(SONUC_GALERI, true);
        setResult(RESULT_OK, i);
        finish();
    }

    private void kapatIste() {
        if (cekilenler.isEmpty()) {
            bitir(false, null);
            return;
        }
        new android.app.AlertDialog.Builder(this, android.R.style.Theme_DeviceDefault_Dialog_Alert)
                .setTitle(yazi("kapatBaslik", "Kameradan çık"))
                .setMessage(yazi("kapatSor", "{n} fotoğraf atılacak.").replace("{n}", String.valueOf(cekilenler.size())))
                .setNegativeButton(yazi("vazgec", "Vazgeç"), null)
                .setPositiveButton(yazi("atKapat", "At ve çık"), (d, w) -> {
                    for (String s : cekilenler) //noinspection ResultOfMethodCallIgnored
                        new File(s).delete();
                    cekilenler.clear();
                    bitir(false, null);
                })
                .show();
    }


    @Override
    public boolean onKeyDown(int kod, KeyEvent e) {
        if (kod == KeyEvent.KEYCODE_VOLUME_DOWN || kod == KeyEvent.KEYCODE_VOLUME_UP || kod == KeyEvent.KEYCODE_CAMERA) {
            if (e.getRepeatCount() == 0) cekBas();
            return true;
        }
        return super.onKeyDown(kod, e);
    }

    private void bitir(boolean ok, String hata) {
        Intent i = new Intent();
        if (ok && !cekilenler.isEmpty()) {
            i.putExtra(SONUC_DOSYALAR, cekilenler.toArray(new String[0]));
            setResult(RESULT_OK, i);
        } else {
            if (hata != null) i.putExtra(SONUC_HATA, hata);
            setResult(RESULT_CANCELED, i);
        }
        finish();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (yon != null) yon.disable();
        if (geriSay != null) ui.removeCallbacks(geriSay);
        try {
            if (ses != null) ses.release();
        } catch (Throwable ignored) {
        }
        isci.shutdown();
    }

    /* ------------------------------------------------------------ çizimler */

    /** Deklanşör: beyaz halka + iç daire; basınca küçülür, zamanlayıcıda halka dolar. */
    static final class Deklansor extends View {
        private final Paint halka = new Paint(Paint.ANTI_ALIAS_FLAG), ic = new Paint(Paint.ANTI_ALIAS_FLAG), dolum = new Paint(Paint.ANTI_ALIAS_FLAG);
        private float basik = 0f, oran = -1f;

        Deklansor(android.content.Context c) {
            super(c);
            float d = c.getResources().getDisplayMetrics().density;
            halka.setStyle(Paint.Style.STROKE);
            halka.setStrokeWidth(4.5f * d);
            halka.setColor(Color.WHITE);
            ic.setColor(Color.WHITE);
            dolum.setStyle(Paint.Style.STROKE);
            dolum.setStrokeWidth(4.5f * d);
            dolum.setStrokeCap(Paint.Cap.ROUND);
            dolum.setColor(0xFFFFD54F);
            setClickable(true);
            setFocusable(true);
        }

        void ilerleme(float o) {
            oran = o;
            invalidate();
        }

        void bas() {
            ValueAnimator a = ValueAnimator.ofFloat(0f, 1f, 0f);
            a.setDuration(240);
            a.addUpdateListener(an -> {
                basik = (float) an.getAnimatedValue();
                invalidate();
            });
            a.start();
        }

        @Override
        public boolean onTouchEvent(MotionEvent e) {
            if (e.getActionMasked() == MotionEvent.ACTION_DOWN) {
                basik = 0.6f;
                invalidate();
            } else if (e.getActionMasked() == MotionEvent.ACTION_UP || e.getActionMasked() == MotionEvent.ACTION_CANCEL) {
                basik = 0f;
                invalidate();
            }
            return super.onTouchEvent(e);
        }

        @Override
        protected void onDraw(Canvas c) {
            float w = getWidth(), h = getHeight(), r = Math.min(w, h) / 2f - halka.getStrokeWidth();
            c.drawCircle(w / 2f, h / 2f, r, halka);
            ic.setAlpha(isEnabled() ? 255 : 140);
            c.drawCircle(w / 2f, h / 2f, r * (0.84f - 0.12f * basik), ic);
            if (oran >= 0f) {
                RectF k = new RectF(w / 2f - r, h / 2f - r, w / 2f + r, h / 2f + r);
                c.drawArc(k, -90f, 360f * oran, false, dolum);
            }
        }
    }

    /** Üçte bir kuralı ızgarası. */
    static final class Izgara extends View {
        private final Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);

        Izgara(android.content.Context c) {
            super(c);
            p.setColor(0x59FFFFFF);
            p.setStrokeWidth(c.getResources().getDisplayMetrics().density);
        }

        @Override
        protected void onDraw(Canvas c) {
            float w = getWidth(), h = getHeight();
            for (int i = 1; i < 3; i++) {
                c.drawLine(w * i / 3f, 0, w * i / 3f, h, p);
                c.drawLine(0, h * i / 3f, w, h * i / 3f, p);
            }
        }
    }

    /** Dokunulan yerde odak halkası. */
    static final class OdakHalkasi extends View {
        private final Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);

        OdakHalkasi(android.content.Context c) {
            super(c);
            p.setStyle(Paint.Style.STROKE);
            p.setStrokeWidth(1.8f * c.getResources().getDisplayMetrics().density);
            p.setColor(0xFFFFD54F);
        }

        @Override
        protected void onDraw(Canvas c) {
            float r = Math.min(getWidth(), getHeight()) / 2f - p.getStrokeWidth();
            c.drawCircle(getWidth() / 2f, getHeight() / 2f, r, p);
            c.drawCircle(getWidth() / 2f, getHeight() / 2f, r * 0.12f, p);
        }
    }
}
