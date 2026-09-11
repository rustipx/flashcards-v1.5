const CACHE_NAME = 'flashcards-v1.5.4-core';

// ملفات أساسية: التطبيق لا يعمل offline بدونها إطلاقًا
const CRITICAL_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './version.json',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  // تفعيل السيرفيس ووركر الجديد فوراً دون الانتظار لإغلاق التبويبات القديمة
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      await Promise.all(
        CRITICAL_ASSETS.map(url =>
          cache.add(url).catch(err => {
            console.warn('[SW] فشل تخزين ملف أثناء التثبيت:', url, err);
          })
        )
      );
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] حذف كاش قديم:', key);
            return caches.delete(key);
          })
      )
    ).then(() => {
      // السيطرة الفورية على جميع الصفحات المفتوحة
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // استبعاد أي طلبات خارجية غير تابعة لنفس النطاق (مثل الخطوط أو صور GitHub الخارجية)
  if (url.origin !== self.location.origin) return;

  // فحص ملف الإصدار: دائماً من السيرفر مباشرة لاكتشاف أي تحديث بدقة وسرعة
  if (url.pathname.endsWith('version.json')) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request, { ignoreSearch: true }))
    );
    return;
  }

  // للملفات الأساسية (HTML و CSS و JS و JSON):
  // نعتمد استراتيجية Network-First:
  // 1. إذا كان متصلاً بالإنترنت: يجلب فوراً أحدث ملف من السيرفر (GitHub Pages) ويحدث الكاش.
  // 2. إذا كان غير متصل بالإنترنت (offline): يسترجع فوراً الملف المحفوظ في الكاش.
  // هذا يضمن 100% عدم حدوث مشكلة قراءة HTML جديد مع كاش CSS/JS قديم.
  const isCoreAsset = request.mode === 'navigate' ||
                      url.pathname.endsWith('.html') ||
                      url.pathname.endsWith('.css') ||
                      url.pathname.endsWith('.js') ||
                      url.pathname.endsWith('.json') ||
                      url.pathname === '/' ||
                      url.pathname.endsWith('/');

  if (isCoreAsset) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, copy);
              // نخزن أيضاً بالمسار النسبي النظيف بدون query params
              const cleanPath = url.pathname.split('/').pop() || './';
              cache.put(cleanPath, response.clone()).catch(() => {});
            });
          }
          return response;
        })
        .catch(async () => {
          // محاولة المطابقة مع تجاهل query strings (?v=1.5.3)
          const match = await caches.match(request, { ignoreSearch: true });
          if (match) return match;
          if (request.mode === 'navigate') {
            return (await caches.match('./index.html', { ignoreSearch: true })) || (await caches.match('./', { ignoreSearch: true }));
          }
          return match;
        })
    );
    return;
  }

  // لباقي الملفات (الأيقونات والصور الثابتة):
  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then(cached => {
      const network = fetch(request)
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);

      return cached || network;
    })
  );
});

// استقبال الأوامر من التطبيق (مثل skipWaiting للتحديث السلس)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// التعامل مع النقر على إشعار التذكير اليومي
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate('./#hafazniPage');
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('./#hafazniPage');
      }
    })
  );
});
