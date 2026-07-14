/**
 * Preload full-resolution (data-src) gallery images before they enter the
 * viewport. The morph animation has the high-res version ready on tap.
 *
 * Uses IntersectionObserver with an 800px rootMargin (about one desktop
 * viewport-height of runway). On any realistic scroll speed the full-res
 * finishes loading before the user reaches the thumbnail. Combined with
 * the thumbnail-immediate-morph fallback in imageMorph.js, this gives
 * instant morph feedback every time without wasting bandwidth on images
 * the user never scrolls near.
 */

function setupViewportFullResPreload() {
  const preloaded = new Set();

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        const fullSrc = img.getAttribute("data-src");
        if (fullSrc && !preloaded.has(fullSrc)) {
          preloaded.add(fullSrc);
          const link = document.createElement("link");
          link.rel = "preload";
          link.as = "image";
          link.href = fullSrc;
          document.head.appendChild(link);
        }
        observer.unobserve(img);
      });
    },
    { rootMargin: "800px" }
  );

  document
    .querySelectorAll(".polaroid-grid img[data-src]")
    .forEach((img) => observer.observe(img));
}

document.addEventListener("DOMContentLoaded", setupViewportFullResPreload);