/**
 * Preload full-resolution (data-src) gallery images before they enter
 * the viewport. The morph animation has the high-res version ready on
 * tap.
 *
 * Uses IntersectionObserver with an 800px rootMargin (about one desktop
 * viewport-height of runway). On any realistic scroll speed, the full-res
 * finishes loading before the user reaches the thumbnail. Combined with
 * the thumbnail-immediate-morph fallback in imageMorph.js, this gives
 * instant morph feedback every time. It does not waste bandwidth on
 * images the user never scrolls near.
 */

/* URL -> 'loading' | 'decoded'. Populated by the preloader so
   imageMorph.js can tell "file cached" (complete) apart from "bitmap
   ready to paint" (decoded). The JPEG decode is the expensive ~90ms step
   that must never run inside the morph animation. */
export const fullResDecodeState = new Map();

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

          /* Warm the decoder in the background. `<link rel="preload">`
             only fills the network cache. `decode()` also fills the
             bitmap cache. The first paint of this image never pays a
             ~90ms JPEG decode. Do NOT retain the Image object. The
             decoded bitmap lives in the renderer's decode cache. Memory
             stays bounded while the warming effect persists. */
          fullResDecodeState.set(fullSrc, "loading");
          const decoder = new Image();
          decoder.src = fullSrc;
          if (decoder.decode) {
            decoder.decode()
              .then(() => fullResDecodeState.set(fullSrc, "decoded"))
              .catch(() => { /* Image evicted or unsupported. Fall back to old path. */ });
          }
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