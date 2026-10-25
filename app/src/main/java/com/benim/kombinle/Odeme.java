package com.benim.kombinle;

import android.app.Activity;
import android.content.SharedPreferences;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.ConsumeParams;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Google Play satın alma (Play Billing 8): aylık ve yıllık PRO aboneliği, jeton paketleri ve destek ürünleri. */
final class Odeme implements PurchasesUpdatedListener {

    static final String PRO = "kombinle_pro_aylik";
    static final String PRO_YIL = "kombinle_pro_yillik";
    /** abonelikler: sahiplik her açılışta Google Play'den yenilenir (iptal/iade düşer) */
    private static final Set<String> KALICI = new HashSet<>(Arrays.asList(PRO, PRO_YIL));
    /** tek seferlik kalıcı ürünler: "Sosyal paket" (A mı B mi anketi açma) */
    static final String SOSYAL = "kombinle_sosyal";
    private static final Set<String> TEK = new HashSet<>(Collections.singletonList(SOSYAL));
    private static final Map<String, Integer> JETON = new HashMap<>();
    static {
        JETON.put("jeton_50", 50);
        JETON.put("jeton_150", 150);
        JETON.put("jeton_400", 400);
    }
    /** "Gönderiyi öne çıkar" hakları (tüketilen ürün) */
    private static final Map<String, Integer> ONE_CIKAR = new HashMap<>();
    static {
        ONE_CIKAR.put("onecikar_1", 1);
        ONE_CIKAR.put("onecikar_5", 5);
        ONE_CIKAR.put("onecikar_15", 15);
    }
    private static final Set<String> TUKETILEN = new HashSet<>(Arrays.asList("destek_cay", "destek_yemek", "jeton_50", "jeton_150", "jeton_400",
            "onecikar_1", "onecikar_5", "onecikar_15"));

    private static boolean sahiplik(String id) {
        return KALICI.contains(id) || TEK.contains(id);
    }

    private static String tip(String id) {
        return KALICI.contains(id) ? BillingClient.ProductType.SUBS : BillingClient.ProductType.INAPP;
    }

    private final Activity act;
    private final Kopru kopru;
    private final SharedPreferences ayar;
    private final Set<String> sahip = Collections.synchronizedSet(new LinkedHashSet<>());
    private final Map<String, ProductDetails> bilgi = new HashMap<>();
    private BillingClient istemci;
    private String alIstek, alId;

    Odeme(Activity act, Kopru kopru) {
        this.act = act;
        this.kopru = kopru;
        this.ayar = act.getSharedPreferences("odeme", Activity.MODE_PRIVATE);
        try {
            JSONArray a = new JSONArray(ayar.getString("sahip", "[]"));
            for (int i = 0; i < a.length(); i++) if (sahiplik(a.getString(i))) sahip.add(a.getString(i));
        } catch (Exception ignored) {
        }
    }

    private static boolean tanimli(String id) {
        return KALICI.contains(id) || TEK.contains(id) || TUKETILEN.contains(id);
    }

    void baslat() {
        try {
            istemci = BillingClient.newBuilder(act)
                    .setListener(this)
                    .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
                    .enableAutoServiceReconnection()
                    .build();
            baglan(() -> yenile(null), null);
        } catch (Throwable t) {
            istemci = null;
        }
    }

    private void baglan(Runnable ok, Runnable hata) {
        if (istemci == null) {
            if (hata != null) hata.run();
            return;
        }
        if (istemci.isReady()) {
            ok.run();
            return;
        }
        istemci.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult r) {
                if (r.getResponseCode() == BillingClient.BillingResponseCode.OK) ok.run();
                else if (hata != null) hata.run();
            }

            @Override
            public void onBillingServiceDisconnected() {
            }
        });
    }

    /** Google Play'den güncel sahiplik: iade edilen ürün burada düşer. */
    private void yenile(Runnable bitti) {
        // önce tek seferlik ürünler (bekleyen jetonlar tüketilir), sonra abonelikler
        istemci.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build(), (r, alimlar) -> {
            final boolean tekTamam = r.getResponseCode() == BillingClient.BillingResponseCode.OK;
            final Set<String> tekYeni = new HashSet<>();
            if (tekTamam && alimlar != null) for (Purchase p : alimlar) if (isle(p)) for (String s : p.getProducts()) if (TEK.contains(s)) tekYeni.add(s);
            istemci.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.SUBS).build(), (r2, abonelikler) -> {
                if (r2.getResponseCode() == BillingClient.BillingResponseCode.OK && abonelikler != null) {
                    Set<String> yeni = new HashSet<>();
                    for (Purchase p : abonelikler) if (isle(p)) yeni.addAll(p.getProducts());
                    synchronized (sahip) {
                        Set<String> eskiTek = new HashSet<>();
                        for (String s : sahip) if (TEK.contains(s)) eskiTek.add(s);
                        sahip.clear();
                        for (String s : yeni) if (KALICI.contains(s)) sahip.add(s);
                        sahip.addAll(tekTamam ? tekYeni : eskiTek);
                    }
                    kaydet();
                } else if (tekTamam) {
                    synchronized (sahip) {
                        sahip.removeIf(TEK::contains);
                        sahip.addAll(tekYeni);
                    }
                    kaydet();
                }
                if (bitti != null) bitti.run();
            });
        });
    }

    private boolean isle(Purchase p) {
        if (p.getPurchaseState() != Purchase.PurchaseState.PURCHASED) return false;
        boolean tuketilen = false;
        for (String id : p.getProducts()) if (TUKETILEN.contains(id)) tuketilen = true;
        if (tuketilen) {
            final List<String> urunler = new ArrayList<>(p.getProducts());
            final int adet = p.getQuantity() > 0 ? p.getQuantity() : 1;
            istemci.consumeAsync(ConsumeParams.newBuilder().setPurchaseToken(p.getPurchaseToken()).build(), (r, t) -> {
                // Jeton yalnızca Google Play tüketimi onayladıktan sonra deftere yazılır;
                // sayfa jetonTeslim() ile alır. Böylece uygulama kapalıyken biten alım da kaybolmaz.
                if (r.getResponseCode() != BillingClient.BillingResponseCode.OK) return;
                int toplam = 0, hak = 0;
                for (String id : urunler) {
                    Integer n = JETON.get(id);
                    if (n != null) toplam += n * adet;
                    Integer h = ONE_CIKAR.get(id);
                    if (h != null) hak += h * adet;
                }
                if (toplam > 0) jetonYaz(toplam);
                if (hak > 0) defterYaz("oneCikarBekleyen", hak);
            });
            return false;
        }
        if (!p.isAcknowledged()) {
            istemci.acknowledgePurchase(AcknowledgePurchaseParams.newBuilder().setPurchaseToken(p.getPurchaseToken()).build(), r -> { });
        }
        return true;
    }

    private synchronized void defterYaz(String ad, int n) {
        long v = Math.min(100_000L, (long) ayar.getInt(ad, 0) + n);
        ayar.edit().putInt(ad, (int) v).commit();
    }

    /** Teslim edilmemiş öne çıkarma haklarını verir ve sıfırlar. */
    synchronized int oneCikarTeslim() {
        int v = ayar.getInt("oneCikarBekleyen", 0);
        if (v > 0) ayar.edit().putInt("oneCikarBekleyen", 0).commit();
        return Math.max(0, v);
    }

    private synchronized void jetonYaz(int n) {
        long v = Math.min(10_000_000L, (long) ayar.getInt("jetonBekleyen", 0) + n);
        ayar.edit().putInt("jetonBekleyen", (int) v).commit();
    }

    /** Teslim edilmemiş jetonları verir ve sıfırlar (her jeton bir kez teslim edilir). */
    synchronized int jetonTeslim() {
        int v = ayar.getInt("jetonBekleyen", 0);
        if (v > 0) ayar.edit().putInt("jetonBekleyen", 0).commit();
        return Math.max(0, v);
    }

    private void kaydet() {
        JSONArray a = new JSONArray();
        synchronized (sahip) {
            for (String s : sahip) a.put(s);
        }
        ayar.edit().putString("sahip", a.toString()).apply();
    }

    String sahipJson() {
        JSONArray a = new JSONArray();
        synchronized (sahip) {
            for (String s : sahip) a.put(s);
        }
        return a.toString();
    }

    private JSONArray sahipDizi() {
        JSONArray a = new JSONArray();
        synchronized (sahip) {
            for (String s : sahip) a.put(s);
        }
        return a;
    }

    private void bilgiYukle(List<String> idler, Runnable bitti) {
        List<QueryProductDetailsParams.Product> l = new ArrayList<>();
        for (String id : idler) {
            l.add(QueryProductDetailsParams.Product.newBuilder().setProductId(id).setProductType(tip(id)).build());
        }
        // Play bir sorguda tek ürün türü ister: tek seferlik ve abonelikler ayrı sorgulanır
        final List<QueryProductDetailsParams.Product> inapp = new ArrayList<>(), subs = new ArrayList<>();
        for (int i = 0; i < l.size(); i++) (KALICI.contains(idler.get(i)) ? subs : inapp).add(l.get(i));
        sorguCalistir(inapp, () -> sorguCalistir(subs, bitti));
    }

    private void sorguCalistir(List<QueryProductDetailsParams.Product> l, Runnable bitti) {
        if (l.isEmpty()) {
            bitti.run();
            return;
        }
        istemci.queryProductDetailsAsync(QueryProductDetailsParams.newBuilder().setProductList(l).build(), (r, sonuc) -> {
            if (r.getResponseCode() == BillingClient.BillingResponseCode.OK && sonuc != null) {
                synchronized (bilgi) {
                    for (ProductDetails d : sonuc.getProductDetailsList()) bilgi.put(d.getProductId(), d);
                }
            }
            bitti.run();
        });
    }

    /** Aboneliğin temel planı (deneme/indirim teklifi olmayan) */
    private static ProductDetails.SubscriptionOfferDetails temelPlan(ProductDetails d) {
        List<ProductDetails.SubscriptionOfferDetails> l = d.getSubscriptionOfferDetails();
        if (l == null || l.isEmpty()) return null;
        for (ProductDetails.SubscriptionOfferDetails o : l) if (o.getOfferId() == null) return o;
        return l.get(0);
    }

    private static String fiyat(ProductDetails d) {
        if (d.getOneTimePurchaseOfferDetails() != null) return d.getOneTimePurchaseOfferDetails().getFormattedPrice();
        ProductDetails.SubscriptionOfferDetails o = temelPlan(d);
        if (o == null) return null;
        List<ProductDetails.PricingPhase> f = o.getPricingPhases().getPricingPhaseList();
        return f.isEmpty() ? null : f.get(f.size() - 1).getFormattedPrice();
    }

    void sorgula(String istek, String csv) {
        final List<String> idler = new ArrayList<>();
        if (csv != null) for (String s : csv.split("[,;\\s]+")) if (tanimli(s.trim())) idler.add(s.trim());
        baglan(() -> bilgiYukle(idler, () -> {
            try {
                JSONArray a = new JSONArray();
                synchronized (bilgi) {
                    for (String id : idler) {
                        ProductDetails d = bilgi.get(id);
                        String f = d == null ? null : fiyat(d);
                        if (f == null) continue;
                        JSONObject o = new JSONObject();
                        o.put("id", id);
                        o.put("price", f);
                        a.put(o);
                    }
                }
                kopru.gonder(istek, true, "products", a);
            } catch (Exception e) {
                kopru.gonder(istek, false, "hata", "bilgi");
            }
        }), () -> kopru.gonder(istek, false, "hata", "baglanti"));
    }

    void al(String istek, String id) {
        final String pid = id == null ? "" : id.trim();
        if (!tanimli(pid)) {
            kopru.gonder(istek, false, "hata", "urun");
            return;
        }
        if (sahip.contains(pid)) {
            kopru.gonder(istek, true, "owned", sahipDizi());
            return;
        }
        baglan(() -> bilgiYukle(Collections.singletonList(pid), () -> act.runOnUiThread(() -> {
            ProductDetails d;
            synchronized (bilgi) {
                d = bilgi.get(pid);
            }
            if (d == null) {
                kopru.gonder(istek, false, "hata", "playde-yok");
                return;
            }
            BillingFlowParams.ProductDetailsParams.Builder pb = BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(d);
            if (KALICI.contains(pid)) {
                ProductDetails.SubscriptionOfferDetails o = temelPlan(d);
                if (o == null) {
                    kopru.gonder(istek, false, "hata", "playde-yok");
                    return;
                }
                pb.setOfferToken(o.getOfferToken());
            }
            alIstek = istek;
            alId = pid;
            BillingResult r = istemci.launchBillingFlow(act, BillingFlowParams.newBuilder()
                    .setProductDetailsParamsList(Collections.singletonList(pb.build()))
                    .build());
            if (r.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                alIstek = null;
                kopru.gonder(istek, false, "hata", "acilmadi");
            }
        })), () -> kopru.gonder(istek, false, "hata", "baglanti"));
    }

    @Override
    public void onPurchasesUpdated(BillingResult r, List<Purchase> alimlar) {
        final String istek = alIstek, id = alId;
        alIstek = null;
        int kod = r.getResponseCode();
        boolean alindi = false;
        if (kod == BillingClient.BillingResponseCode.OK && alimlar != null) {
            for (Purchase p : alimlar) {
                boolean kalici = isle(p);
                if (p.getProducts().contains(id) && p.getPurchaseState() == Purchase.PurchaseState.PURCHASED) alindi = true;
                if (kalici) for (String s : p.getProducts()) if (sahiplik(s)) sahip.add(s);
            }
            kaydet();
        } else if (kod == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) {
            alindi = true;
            yenile(null);
        }
        if (istek == null) return;
        JSONObject o = new JSONObject();
        try {
            o.put("req", istek);
            o.put("ok", alindi);
            o.put("iptal", kod == BillingClient.BillingResponseCode.USER_CANCELED);
            o.put("owned", sahipDizi());
        } catch (Exception ignored) {
        }
        kopru.gonder(o);
    }

    void geriYukle(String istek) {
        baglan(() -> yenile(() -> kopru.gonder(istek, true, "owned", sahipDizi())),
                () -> kopru.gonder(istek, false, "hata", "baglanti"));
    }

    void kapat() {
        try {
            if (istemci != null) istemci.endConnection();
        } catch (Throwable ignored) {
        }
    }
}
