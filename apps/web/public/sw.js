// Chegou.AI — Service Worker para Web Push Notifications (PWA / VAPID)
// ADR-003 & PRD: Notificações em tempo real para moradores e portaria

self.addEventListener("install", (event) => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener("push", (event) => {
  let data = {}

  if (event.data) {
    try {
      data = event.data.json()
    } catch (e) {
      data = {
        title: "📦 Sua encomenda chegou!",
        body: event.data.text() || "Você tem uma nova encomenda aguardando retirada na portaria.",
      }
    }
  } else {
    data = {
      title: "📦 Sua encomenda chegou!",
      body: "Uma nova encomenda foi recebida na portaria.",
    }
  }

  const title = data.title || "📦 Sua encomenda chegou!"
  const options = {
    body: data.body || "Apresente seu PIN na portaria para retirar sua entrega.",
    icon: data.icon || "/file.svg",
    badge: data.badge || "/file.svg",
    vibrate: [150, 50, 150, 50, 200],
    data: data.data || { url: "/morador" },
    tag: `package-notification-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || "/morador"

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("/morador") && "focus" in client) {
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})

