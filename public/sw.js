/**
 * 인생의 회전목마 Service Worker.
 *
 * 두 가지 책임:
 *   1. 푸시 알림 수신·표시
 *   2. 알림 클릭 시 URL 이동
 *
 * 캐시는 다루지 않음 (PWA offline 캐싱은 Next.js + Vercel 이 알아서 처리).
 */

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "인생의 회전목마", body: event.data.text() };
  }

  const title = payload.title || "인생의 회전목마";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icons-pwa/icon-192.png",
    badge: "/icons-pwa/icon-192.png",
    image: payload.image || undefined,
    tag: payload.tag || "carousel-default",
    renotify: !!payload.renotify,
    data: {
      url: payload.url || "/today",
    },
    actions: payload.actions || [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl =
    (event.notification.data && event.notification.data.url) || "/today";

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      // 이미 열려있는 탭이 있으면 그 탭으로 focus + 이동
      for (const client of allClients) {
        if ("focus" in client) {
          try {
            await client.focus();
            if ("navigate" in client) {
              await client.navigate(targetUrl);
            }
            return;
          } catch {
            /* ignore */
          }
        }
      }
      // 없으면 새 탭 열기
      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl);
      }
    })(),
  );
});

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
