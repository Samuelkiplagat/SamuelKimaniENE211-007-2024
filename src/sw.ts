/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
clientsClaim();

interface ShowNotificationMessage {
  type: 'LEXIREAD_SHOW';
  title: string;
  body: string;
  vocabId: string;
}

interface SettingsMessage {
  type: 'LEXIREAD_SETTINGS';
  enabled: boolean;
  intervalHours: number;
}

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const data = event.data as ShowNotificationMessage | SettingsMessage | undefined;
  if (!data?.type) return;

  if (data.type === 'LEXIREAD_SHOW') {
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/icon.svg',
        tag: `lexiread-${data.vocabId}`,
        data: { vocabId: data.vocabId },
      }),
    );
  }
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const vocabId = (event.notification.data as { vocabId?: string } | undefined)
    ?.vocabId;

  event.waitUntil(
    (async () => {
      const windowClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      for (const client of windowClients) {
        client.postMessage({ type: 'LEXIREAD_INTERACT', vocabId });
        await client.focus();
        return;
      }
      await self.clients.openWindow('/');
    })(),
  );
});
