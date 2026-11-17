/* KDJ超卖共振选股工作台 Service Worker
 * - 应用壳（HTML/manifest/图标）缓存优先，断网可开
 * - 行情接口（腾讯 / 东财）直接走网络，永不缓存，保证数据新鲜
 * - localStorage 属于浏览器本地存储，SW 不介入，数据不出设备
 */
var CACHE = 'kdj-resonance-v1';
var SHELL = [
  './', './index.html', './manifest.json',
  './icon-192.png', './icon-512.png',
  './icon-maskable-192.png', './icon-maskable-512.png',
  './apple-touch-icon.png', './favicon-32.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(SHELL.map(function (u) {
        return c.add(u).catch(function (err) { console.warn('shell skip', u, err); });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('message', function (e) {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function isQuoteHost(host) {
  return host.indexOf('gtimg.cn') !== -1 ||
         host.indexOf('qq.com') !== -1 ||
         host.indexOf('eastmoney.com') !== -1 ||
         host.indexOf('sina.com') !== -1 ||
         host.indexOf('sinajs') !== -1 ||
         host.indexOf('10jqka') !== -1;
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url;
  try { url = new URL(req.url); } catch (err) { return; }

  // 行情接口：直连网络，不缓存
  if (isQuoteHost(url.hostname)) return;
  // 其它跨域资源不托管
  if (url.origin !== self.location.origin) return;

  // 导航请求：网络优先，断网回退缓存（保证拿到最新壳）
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (resp) {
        var copy = resp.clone();
        caches.open(CACHE).then(function (c) { c.put('./index.html', copy); }).catch(function(){});
        return resp;
      }).catch(function () {
        return caches.match('./index.html').then(function (r) {
          return r || caches.match('./');
        });
      })
    );
    return;
  }

  // 同源静态资源：缓存优先 + 后台更新
  e.respondWith(
    caches.match(req).then(function (cached) {
      var net = fetch(req).then(function (resp) {
        if (resp && resp.ok && resp.type === 'basic') {
          var copy = resp.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function(){});
        }
        return resp;
      }).catch(function () { return cached; });
      return cached || net;
    })
  );
});
