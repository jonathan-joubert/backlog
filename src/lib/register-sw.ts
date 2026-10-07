// Single place that registers the offline service worker.
// Never registers in development, inside iframes, or on Lovable preview hosts.
export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  const host = window.location.hostname;
  let inIframe = false;
  try {
    inIframe = window.self !== window.top;
  } catch {
    inIframe = true;
  }
  const isPreviewHost =
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host === "lovableproject.com" ||
    host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" ||
    host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" ||
    host.endsWith(".beta.lovable.dev");
  const killSwitch = new URLSearchParams(window.location.search).get("sw") === "off";

  if (!import.meta.env.PROD || inIframe || isPreviewHost || killSwitch) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      regs
        .filter((r) => r.active?.scriptURL.endsWith("/sw.js") || r.installing?.scriptURL.endsWith("/sw.js"))
        .map((r) => r.unregister()),
    );
    return;
  }

  const { registerSW } = await import("virtual:pwa-register");
  registerSW({ immediate: true });
}
