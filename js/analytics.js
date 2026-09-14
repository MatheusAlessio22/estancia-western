/**
 * Scripts de rastreamento (Google Analytics 4 e Meta Pixel), centralizados
 * num único arquivo para evitar duplicar os snippets em cada página HTML.
 * Carregado via <script src="/js/analytics.js"> no <head> de cada página.
 *
 * TODO: substituir os IDs fictícios abaixo pelos IDs reais antes de publicar.
 */

// ===== Google Analytics 4 =====
const GA4_MEASUREMENT_ID = "G-XXXXXXX"; // TODO: substituir pelo Measurement ID real do GA4

(function carregarGA4(id) {
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", id);
})(GA4_MEASUREMENT_ID);

// ===== Meta Pixel (Facebook) =====
const META_PIXEL_ID = "PIXEL_ID"; // TODO: substituir pelo ID real do Meta Pixel

!(function (f, b, e, v, n, t, s) {
  if (f.fbq) return;
  n = f.fbq = function () {
    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
  };
  if (!f._fbq) f._fbq = n;
  n.push = n;
  n.loaded = true;
  n.version = "2.0";
  n.queue = [];
  t = b.createElement(e);
  t.async = true;
  t.src = v;
  s = b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t, s);
})(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

window.fbq("init", META_PIXEL_ID);
window.fbq("track", "PageView");
