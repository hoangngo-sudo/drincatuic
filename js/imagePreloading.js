/**
 * Preload full-resolution (data-src) gallery images when they enter the viewport.
 * Uses IntersectionObserver — native loading="lazy" handles the thumbnail load;
 * this preloads the high-res version for instant modal display on click.
 */

function setupLazyFullResPreload() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const fullSrc = img.getAttribute("data-src");
          if (fullSrc) {
            const preloadLink = document.createElement("link");
            preloadLink.rel = "preload";
            preloadLink.as = "image";
            preloadLink.href = fullSrc;
            document.head.appendChild(preloadLink);
          }
          observer.unobserve(img);
        }
      });
    },
    { rootMargin: "200px" }
  );

  document.querySelectorAll(
    ".image-grid-span img, .polaroid-grid img"
  ).forEach((img) => {
    if (img.getAttribute("loading") === "lazy" && img.hasAttribute("data-src")) {
      observer.observe(img);
    }
  });
}

document.addEventListener("DOMContentLoaded", setupLazyFullResPreload);