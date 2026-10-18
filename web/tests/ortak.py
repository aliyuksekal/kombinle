import json, datetime, os, math
from playwright.sync_api import sync_playwright

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAYFA = 'file://' + os.path.join(KOK, 'dist', os.environ.get('KB_DOSYA', 'kombinle.html'))
EKRAN = os.path.join(KOK, 'tests', 'ekran')
os.makedirs(EKRAN, exist_ok=True)


def met_yanit(taban=12.0, yagmur=False, ruzgar=3.0, sembol=None):
    simdi = datetime.datetime.now(datetime.timezone.utc).replace(minute=0, second=0, microsecond=0) - datetime.timedelta(hours=3)
    ts = []
    for i in range(80):
        t = simdi + datetime.timedelta(hours=i)
        yerel = (t.hour + 3) % 24
        sic = taban + 4 * math.sin((yerel - 9) / 24 * 2 * math.pi)
        s = sembol or ('rain' if yagmur else ('clearsky_day' if 7 <= yerel <= 18 else 'clearsky_night'))
        ts.append({'time': t.strftime('%Y-%m-%dT%H:%M:%SZ'), 'data': {
            'instant': {'details': {'air_temperature': round(sic, 1), 'wind_speed': ruzgar, 'relative_humidity': 60}},
            'next_1_hours': {'summary': {'symbol_code': s}, 'details': {'precipitation_amount': 1.2 if 'rain' in s else 0}}}})
    return json.dumps({'type': 'Feature', 'properties': {'timeseries': ts}})


class Oturum:
    def __init__(self, pw, koyu=False, dil='tr-TR', hava=None, konum=True, genislik=390, yukseklik=844):
        self.tarayici = pw.chromium.launch(args=['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'])
        izin = ['geolocation'] if konum else []
        self.ctx = self.tarayici.new_context(viewport={'width': genislik, 'height': yukseklik}, device_scale_factor=2, has_touch=True,
                                             timezone_id='Europe/Istanbul', locale=dil, color_scheme='dark' if koyu else 'light', permissions=izin,
                                             geolocation={'latitude': 41.0082, 'longitude': 28.9784} if konum else None)
        self.hava = hava if hava is not None else met_yanit()
        self.istekler = []
        def rota(route):
            self.istekler.append(route.request.url)
            if self.hava == 'HATA':
                route.abort()
            else:
                route.fulfill(status=200, body=self.hava, headers={'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'})
        self.ctx.route('https://api.met.no/**', rota)
        self.dis_istek = []
        self.ctx.on('request', lambda r: self.dis_istek.append(r.url) if not r.url.startswith(('file:', 'data:', 'blob:')) else None)
        self.p = self.ctx.new_page()
        self.hatalar = []
        self.p.on('pageerror', lambda e: self.hatalar.append('pageerror: ' + str(e)))
        self.p.on('console', lambda m: self.hatalar.append('console.' + m.type + ': ' + m.text) if m.type in ('error', 'warning', 'info') else None)

    def ac(self):
        self.p.goto(SAYFA)
        self.p.wait_for_timeout(400)
        return self.p

    def ekran(self, ad, tam=False):
        self.p.screenshot(path=os.path.join(EKRAN, ad + '.png'), full_page=tam)

    def kapat(self):
        self.tarayici.close()


SONUC = {'gecti': 0, 'kaldi': []}


def ok(kosul, ad):
    if kosul:
        SONUC['gecti'] += 1
        print('  ✓', ad)
    else:
        SONUC['kaldi'].append(ad)
        print('  ✗', ad)


def ozet():
    print('\n%d geçti, %d kaldı' % (SONUC['gecti'], len(SONUC['kaldi'])))
    for k in SONUC['kaldi']:
        print('   KALDI:', k)
    return len(SONUC['kaldi']) == 0
