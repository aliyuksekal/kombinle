import sys, os, re; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import ok, ozet
# Sayfanın çağırdığı her sunucu yolu Android köprüsünün izin listesinde ve sunucuda olmalı (yoksa telefonda "girdi" hatası verir)
KOK = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
kod = ''.join(open(os.path.join(KOK, 'web', 'src', f), encoding='utf-8').read() for f in os.listdir(os.path.join(KOK, 'web', 'src')) if f.endswith('.js'))
yollar = sorted(set(re.findall(r"yzIste\('/v1/([a-z]+)'", kod)) | set(re.findall(r"'/v1/([a-z]+)'", kod)) - {'resim', 'avatar', 'reklam', 'anketresim'} | {'avatar'})
java = open(os.path.join(KOK, 'app', 'src', 'main', 'java', 'com', 'benim', 'kombinle', 'Sunucu.java'), encoding='utf-8').read()
izinli = set(re.search(r'Pattern\.compile\("/v1/\(([^)]*)\)"\)', java).group(1).split('|'))
sunucu = open(os.path.join(KOK, 'server', 'src', 'index.js'), encoding='utf-8').read()
rotalar = set(re.findall(r"case '([a-z]+)':", sunucu))
for y in yollar:
    ok(y in izinli, '/v1/%s Android izin listesinde' % y)
    ok(y in rotalar, '/v1/%s sunucuda var' % y)
# Aynı adla iki genel değişken/işlev olmasın (sonradan tanımlanan öncekini sessizce ezer)
import collections
adlar = collections.Counter()
for f in sorted(os.listdir(os.path.join(KOK, 'web', 'src'))):
    if re.match(r'\d\d-.*\.js$', f):
        adlar.update(re.findall(r'^(?:var|function) ([A-Za-z_]\w*)', open(os.path.join(KOK, 'web', 'src', f), encoding='utf-8').read(), re.M))
cift = sorted(a for a, n in adlar.items() if n > 1 and a not in ('dataUrlBlob',))
ok(not cift, 'genel adlarda çakışma yok ' + str(cift))
ozet()
