self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    await self.clients.claim();
    const openPages = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    await Promise.all(openPages.map((page) => page.navigate(page.url)));
  })());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith(fetch(event.request, { cache: "no-store" }));
});
