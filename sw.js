// sw.js — Service Worker do sistema Casa da Impressora
// Fase 1: permite instalar como app e abrir offline (última versão salva em cache)
// Fase 4 (futura): quando você configurar o Firebase Cloud Messaging, o bloco
// "push" no final deste arquivo passa a mostrar as notificações reais.

const CACHE_NAME = 'cdi-cache-v1';
const ARQUIVOS_CACHE = [
  './sistema_casadaimpressora_v18_6_1.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ARQUIVOS_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(nomes.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Estratégia: tenta a rede primeiro (para pegar sempre a versão mais nova),
// se estiver offline, usa o que estiver salvo em cache.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((resp) => {
        const respClone = resp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, respClone));
        return resp;
      })
      .catch(() => caches.match(event.request))
  );
});

// ── FASE 4 (Firebase Cloud Messaging) — deixe pronto para quando for configurar ──
self.addEventListener('push', (event) => {
  let dados = { title: 'Casa da Impressora', body: 'Você tem uma nova notificação.' };
  try { dados = event.data.json(); } catch (e) {}
  event.waitUntil(
    self.registration.showNotification(dados.title, {
      body: dados.body,
      icon: 'icon-192.png',
      badge: 'icon-192.png',
      data: dados
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('./sistema_casadaimpressora_v18_6_1.html');
    })
  );
});
