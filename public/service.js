// @ts-nocheck

self.addEventListener('push', async (event) => {
    if (event.data) {
        const eventData = await event.data.json();
        self.registration.showNotification(eventData.title, {
            body: eventData.body,
            icon: '/icon.png',
            timestamp: Date.now(),
            data: {
                url: eventData.url,
            },
        });
    }
});


self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    if (event.notification.data.url) {
        event.waitUntil(
            clients
                .openWindow(event.notification.data.url)
                .then((windowClient) => (windowClient ? windowClient.focus() : null))
        );
    }
});