package com.benim.kombinle;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Rect;

import org.json.JSONArray;
import org.json.JSONObject;
import org.tensorflow.lite.DataType;
import org.tensorflow.lite.Interpreter;
import org.tensorflow.lite.Tensor;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * Kombinle'nin kendi kıyafet tanıma modeli (telefonda, internetsiz).
 * Model ve sınıf bilgisi assets içinde: kombinle_model.tflite + kombinle_model.json
 * (egitim/kombinle_model_egitimi.ipynb üretir). Dosyalar yoksa model kapalıdır,
 * uygulama eskisi gibi çalışır.
 */
final class KombinleModeli {

    static final String MODEL = "kombinle_model.tflite";
    static final String BILGI = "kombinle_model.json";
    private static final int EN_FAZLA_MODEL = 64 * 1024 * 1024;

    private final Context ctx;
    private Interpreter yorum;
    private int girdi;
    private int zemin = Color.WHITE;
    private JSONArray siniflar, desenler, kollar, boylar;
    private int turCikis = -1, desenCikis = -1, kolCikis = -1, boyCikis = -1;
    private boolean denendi = false, hazir = false;

    KombinleModeli(Context ctx) {
        this.ctx = ctx.getApplicationContext();
    }

    /** Model dosyası APK'da var mı (yüklemeden bakar). */
    static boolean dosyaVar(Context c) {
        try (InputStream s = c.getAssets().open(MODEL); InputStream b = c.getAssets().open(BILGI)) {
            return true;
        } catch (IOException e) {
            return false;
        }
    }

    private byte[] oku(String ad, int sinir) throws IOException {
        try (InputStream s = ctx.getAssets().open(ad)) {
            ByteArrayOutputStream o = new ByteArrayOutputStream();
            byte[] tampon = new byte[64 * 1024];
            int n;
            while ((n = s.read(tampon)) > 0) {
                o.write(tampon, 0, n);
                if (o.size() > sinir) throw new IOException("buyuk");
            }
            return o.toByteArray();
        }
    }

    /** İlk kullanımda modeli yükler; bozuk ya da uyumsuzsa kapalı kalır. */
    synchronized boolean hazirla() {
        if (denendi) return hazir;
        denendi = true;
        try {
            JSONObject b = new JSONObject(new String(oku(BILGI, 256 * 1024), StandardCharsets.UTF_8));
            girdi = b.optInt("girdi", 224);
            siniflar = b.getJSONArray("siniflar");
            desenler = b.getJSONArray("desenler");
            /* 2. sürüm modelde isteğe bağlı çıkışlar: kol boyu, etek/elbise boyu */
            kollar = b.optJSONArray("kollar");
            boylar = b.optJSONArray("boylar");
            if (kollar != null && (kollar.length() < 2 || kollar.length() == siniflar.length() || kollar.length() == desenler.length())) kollar = null;
            if (boylar != null && (boylar.length() < 2 || boylar.length() == siniflar.length() || boylar.length() == desenler.length()
                    || (kollar != null && boylar.length() == kollar.length()))) boylar = null;
            String z = b.optString("zemin", "#ffffff");
            if (z.matches("#[0-9a-fA-F]{6}")) zemin = 0xFF000000 | Integer.parseInt(z.substring(1), 16);
            if (girdi < 32 || girdi > 640 || siniflar.length() < 2 || desenler.length() < 2 || siniflar.length() == desenler.length()) return false;

            byte[] m = oku(MODEL, EN_FAZLA_MODEL);
            ByteBuffer bb = ByteBuffer.allocateDirect(m.length).order(ByteOrder.nativeOrder());
            bb.put(m);
            bb.rewind();
            Interpreter.Options o = new Interpreter.Options();
            o.setNumThreads(Math.max(1, Math.min(4, Runtime.getRuntime().availableProcessors() / 2)));
            yorum = new Interpreter(bb, o);

            Tensor giris = yorum.getInputTensor(0);
            int[] gs = giris.shape();
            if (yorum.getInputTensorCount() != 1 || giris.dataType() != DataType.FLOAT32 || gs.length != 4
                    || gs[1] != girdi || gs[2] != girdi || gs[3] != 3) {
                kapat();
                return false;
            }
            /* çıkışlar boyutlarından tanınır: tür sayısı ≠ desen sayısı */
            for (int i = 0; i < yorum.getOutputTensorCount(); i++) {
                Tensor t = yorum.getOutputTensor(i);
                int[] s = t.shape();
                if (t.dataType() != DataType.FLOAT32 || s.length != 2) continue;
                if (s[1] == siniflar.length()) turCikis = i;
                else if (s[1] == desenler.length()) desenCikis = i;
                else if (kollar != null && s[1] == kollar.length()) kolCikis = i;
                else if (boylar != null && s[1] == boylar.length()) boyCikis = i;
            }
            if (turCikis < 0 || desenCikis < 0) {
                kapat();
                return false;
            }
            hazir = true;
        } catch (Throwable t) {
            kapat();
            hazir = false;
        }
        return hazir;
    }

    /**
     * Fotoğrafı beyaz zeminle kareye tamamlayıp modele verir.
     * Dönüş: {siniflar:[{id,turlar,grup,p}] (en olası 3), desen:{ad:p}}
     */
    synchronized JSONObject tani(Bitmap bmp) throws Exception {
        if (!hazir || yorum == null) throw new IllegalStateException("model");
        Bitmap kare = Bitmap.createBitmap(girdi, girdi, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(kare);
        c.drawColor(zemin);
        float o = girdi / (float) Math.max(bmp.getWidth(), bmp.getHeight());
        int w = Math.max(1, Math.round(bmp.getWidth() * o)), h = Math.max(1, Math.round(bmp.getHeight() * o));
        int x = (girdi - w) / 2, y = (girdi - h) / 2;
        c.drawBitmap(bmp, null, new Rect(x, y, x + w, y + h), new Paint(Paint.FILTER_BITMAP_FLAG | Paint.ANTI_ALIAS_FLAG));

        int[] px = new int[girdi * girdi];
        kare.getPixels(px, 0, girdi, 0, 0, girdi, girdi);
        kare.recycle();
        ByteBuffer giris = ByteBuffer.allocateDirect(4 * px.length * 3).order(ByteOrder.nativeOrder());
        for (int p : px) {
            giris.putFloat((p >> 16) & 0xFF);
            giris.putFloat((p >> 8) & 0xFF);
            giris.putFloat(p & 0xFF);
        }
        giris.rewind();

        float[][] tur = new float[1][siniflar.length()];
        float[][] desen = new float[1][desenler.length()];
        Map<Integer, Object> cikis = new HashMap<>();
        cikis.put(turCikis, tur);
        cikis.put(desenCikis, desen);
        float[][] kol = kolCikis >= 0 ? new float[1][kollar.length()] : null;
        float[][] boy = boyCikis >= 0 ? new float[1][boylar.length()] : null;
        if (kol != null) cikis.put(kolCikis, kol);
        if (boy != null) cikis.put(boyCikis, boy);
        yorum.runForMultipleInputsOutputs(new Object[]{giris}, cikis);

        JSONArray enIyi = new JSONArray();
        boolean[] alindi = new boolean[tur[0].length];
        for (int k = 0; k < 3 && k < tur[0].length; k++) {
            int en = -1;
            for (int i = 0; i < tur[0].length; i++) if (!alindi[i] && (en < 0 || tur[0][i] > tur[0][en])) en = i;
            alindi[en] = true;
            JSONObject s = new JSONObject(siniflar.getJSONObject(en).toString());
            s.put("p", Math.round(tur[0][en] * 1000) / 1000.0);
            enIyi.put(s);
        }
        JSONObject d = new JSONObject();
        for (int i = 0; i < desen[0].length; i++) d.put(desenler.getString(i), Math.round(desen[0][i] * 1000) / 1000.0);
        JSONObject r = new JSONObject();
        r.put("siniflar", enIyi);
        r.put("desen", d);
        if (kol != null) r.put("kol", olasiliklar(kollar, kol[0]));
        if (boy != null) r.put("boy", olasiliklar(boylar, boy[0]));
        return r;
    }

    private static JSONObject olasiliklar(JSONArray adlar, float[] p) throws Exception {
        JSONObject o = new JSONObject();
        for (int i = 0; i < p.length && i < adlar.length(); i++) o.put(adlar.getString(i), Math.round(p[i] * 1000) / 1000.0);
        return o;
    }

    synchronized void kapat() {
        try {
            if (yorum != null) yorum.close();
        } catch (Throwable ignored) {
        }
        yorum = null;
        hazir = false;
    }
}
