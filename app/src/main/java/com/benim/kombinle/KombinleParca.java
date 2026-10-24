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
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Kombinle parça haritası: boydan fotoğrafta her pikselin hangi parçaya (üst, alt, ayakkabı…) ait olduğunu bulur
 * ve her parçanın kutusunu çıkarır (telefonda, internetsiz).
 * Dosyalar assets içinde: kombinle_parca.tflite + kombinle_parca.json (egitim/kombinle_parca_egitimi.ipynb üretir).
 * Dosyalar yoksa kapalıdır.
 */
final class KombinleParca {

    static final String MODEL = "kombinle_parca.tflite";
    static final String BILGI = "kombinle_parca.json";
    private static final int EN_FAZLA_MODEL = 32 * 1024 * 1024;
    private static final int EN_FAZLA_PARCA = 8;

    private final Context ctx;
    private Interpreter yorum;
    private int girdi, cikis, sinif;
    private int zemin = Color.WHITE;
    private String[] idler, gruplar;
    private float[] enAz;
    private boolean denendi = false, hazir = false;

    KombinleParca(Context ctx) {
        this.ctx = ctx.getApplicationContext();
    }

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

    synchronized boolean hazirla() {
        if (denendi) return hazir;
        denendi = true;
        try {
            if (!dosyaVar(ctx)) return false;
            JSONObject b = new JSONObject(new String(oku(BILGI, 128 * 1024), StandardCharsets.UTF_8));
            girdi = b.optInt("girdi", 320);
            cikis = b.optInt("cikis", 80);
            JSONArray s = b.getJSONArray("siniflar");
            sinif = s.length();
            String z = b.optString("zemin", "#ffffff");
            if (z.matches("#[0-9a-fA-F]{6}")) zemin = 0xFF000000 | Integer.parseInt(z.substring(1), 16);
            if (girdi < 64 || girdi > 640 || cikis < 8 || cikis > girdi || sinif < 2 || sinif > 64) return false;
            idler = new String[sinif];
            gruplar = new String[sinif];
            enAz = new float[sinif];
            for (int i = 0; i < sinif; i++) {
                JSONObject o = s.getJSONObject(i);
                idler[i] = o.optString("id", "");
                gruplar[i] = o.optString("grup", "");
                enAz[i] = (float) Math.max(0.001, Math.min(0.5, o.optDouble("en_az", 0.01)));
                if (!idler[i].matches("[a-z_]{1,24}")) return false;
            }

            byte[] m = oku(MODEL, EN_FAZLA_MODEL);
            ByteBuffer bb = ByteBuffer.allocateDirect(m.length).order(ByteOrder.nativeOrder());
            bb.put(m);
            bb.rewind();
            Interpreter.Options o = new Interpreter.Options();
            o.setNumThreads(Math.max(1, Math.min(4, Runtime.getRuntime().availableProcessors() / 2)));
            yorum = new Interpreter(bb, o);
            Tensor g = yorum.getInputTensor(0);
            int[] gs = g.shape();
            Tensor c = yorum.getOutputTensor(0);
            int[] cs = c.shape();
            if (yorum.getInputTensorCount() != 1 || g.dataType() != DataType.FLOAT32 || gs.length != 4 || gs[1] != girdi || gs[2] != girdi || gs[3] != 3
                    || yorum.getOutputTensorCount() != 1 || c.dataType() != DataType.FLOAT32 || cs.length != 4
                    || cs[1] != cikis || cs[2] != cikis || cs[3] != sinif) {
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
     * Dönüş: [{sinif, grup, kutu:[ymin,xmin,ymax,xmax] (0–1000, fotoğrafın aslına göre), alan (0–1), p}]
     * en büyük parçadan küçüğe.
     */
    synchronized JSONArray parcala(Bitmap bmp) throws Exception {
        if (!hazir || yorum == null) throw new IllegalStateException("parca");
        int W = bmp.getWidth(), H = bmp.getHeight();
        Bitmap kare = Bitmap.createBitmap(girdi, girdi, Bitmap.Config.ARGB_8888);
        Canvas cv = new Canvas(kare);
        cv.drawColor(zemin);
        float o = girdi / (float) Math.max(W, H);
        int w = Math.max(1, Math.round(W * o)), h = Math.max(1, Math.round(H * o));
        int ox = (girdi - w) / 2, oy = (girdi - h) / 2;
        cv.drawBitmap(bmp, null, new Rect(ox, oy, ox + w, oy + h), new Paint(Paint.FILTER_BITMAP_FLAG | Paint.ANTI_ALIAS_FLAG));
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
        float[][][][] harita = new float[1][cikis][cikis][sinif];
        yorum.run(giris, harita);

        /* her hücrenin en olası parçası; yalnız fotoğrafın kendisine düşen hücreler sayılır (beyaz dolgu değil) */
        float hucre = girdi / (float) cikis;
        int x0 = Math.max(0, (int) Math.floor(ox / hucre)), y0 = Math.max(0, (int) Math.floor(oy / hucre));
        int x1 = Math.min(cikis, (int) Math.ceil((ox + w) / hucre)), y1 = Math.min(cikis, (int) Math.ceil((oy + h) / hucre));
        int icerik = Math.max(1, (x1 - x0) * (y1 - y0));
        int[] etiket = new int[cikis * cikis];
        float[] guven = new float[cikis * cikis];
        for (int y = y0; y < y1; y++) for (int x = x0; x < x1; x++) {
            float[] v = harita[0][y][x];
            int en = 0;
            for (int k = 1; k < sinif; k++) if (v[k] > v[en]) en = k;
            etiket[y * cikis + x] = en;
            guven[y * cikis + x] = v[en];
        }

        List<JSONObject> sonuc = new ArrayList<>();
        int[] bilesen = new int[cikis * cikis];
        int[] kuyruk = new int[cikis * cikis];
        for (int k = 1; k < sinif; k++) {
            /* bağlı bölgeleri bul (4 komşuluk) */
            java.util.Arrays.fill(bilesen, 0);
            List<int[]> bolgeler = new ArrayList<>();   // {alan, ymin, xmin, ymax, xmax, guvenToplam*1000}
            List<Float> guvenler = new ArrayList<>();
            int no = 0;
            for (int y = y0; y < y1; y++) for (int x = x0; x < x1; x++) {
                int i = y * cikis + x;
                if (etiket[i] != k || bilesen[i] != 0) continue;
                no++;
                int bas = 0, son = 0, alan = 0, ymin = y, ymax = y, xmin = x, xmax = x;
                float gt = 0;
                kuyruk[son++] = i;
                bilesen[i] = no;
                while (bas < son) {
                    int j = kuyruk[bas++], jy = j / cikis, jx = j % cikis;
                    alan++;
                    gt += guven[j];
                    if (jy < ymin) ymin = jy;
                    if (jy > ymax) ymax = jy;
                    if (jx < xmin) xmin = jx;
                    if (jx > xmax) xmax = jx;
                    int[] komsu = {j - cikis, j + cikis, jx > x0 ? j - 1 : -1, jx < x1 - 1 ? j + 1 : -1};
                    for (int n : komsu) {
                        if (n < 0 || n >= etiket.length || bilesen[n] != 0 || etiket[n] != k) continue;
                        int ny = n / cikis;
                        if (ny < y0 || ny >= y1) continue;
                        bilesen[n] = no;
                        kuyruk[son++] = n;
                    }
                }
                bolgeler.add(new int[]{alan, ymin, xmin, ymax, xmax});
                guvenler.add(gt);
            }
            if (bolgeler.isEmpty()) continue;
            int enBuyuk = 0;
            for (int[] r : bolgeler) enBuyuk = Math.max(enBuyuk, r[0]);
            /* küçük kırıntılar atılır; iki ayakkabı gibi aynı parçanın büyük bölgeleri tek kutuda birleşir */
            int alan = 0, ymin = cikis, xmin = cikis, ymax = -1, xmax = -1;
            float gt = 0;
            for (int r = 0; r < bolgeler.size(); r++) {
                int[] b = bolgeler.get(r);
                if (b[0] < Math.max(2, enBuyuk * 0.25f)) continue;
                alan += b[0];
                gt += guvenler.get(r);
                ymin = Math.min(ymin, b[1]);
                xmin = Math.min(xmin, b[2]);
                ymax = Math.max(ymax, b[3]);
                xmax = Math.max(xmax, b[4]);
            }
            float oran = alan / (float) icerik, p = gt / Math.max(1, alan);
            if (alan == 0 || oran < enAz[k] || p < 0.45f) continue;
            /* hücre → fotoğrafın aslı (0–1000) */
            float fy0 = (ymin * hucre - oy) / o / H, fx0 = (xmin * hucre - ox) / o / W;
            float fy1 = ((ymax + 1) * hucre - oy) / o / H, fx1 = ((xmax + 1) * hucre - ox) / o / W;
            int[] kutu = {sinir(fy0), sinir(fx0), sinir(fy1), sinir(fx1)};
            if (kutu[2] - kutu[0] < 15 || kutu[3] - kutu[1] < 15) continue;
            JSONObject j = new JSONObject();
            j.put("sinif", idler[k]);
            j.put("grup", gruplar[k]);
            JSONArray ka = new JSONArray();
            for (int v : kutu) ka.put(v);
            j.put("kutu", ka);
            j.put("alan", Math.round(oran * 1000) / 1000.0);
            j.put("p", Math.round(p * 1000) / 1000.0);
            sonuc.add(j);
        }
        Collections.sort(sonuc, (a, b) -> Double.compare(b.optDouble("alan"), a.optDouble("alan")));
        JSONArray r = new JSONArray();
        for (int i = 0; i < sonuc.size() && i < EN_FAZLA_PARCA; i++) r.put(sonuc.get(i));
        return r;
    }

    private static int sinir(float v) {
        return Math.max(0, Math.min(1000, Math.round(v * 1000)));
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
