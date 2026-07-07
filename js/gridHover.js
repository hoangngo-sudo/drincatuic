/**
 * Grid Hover Overlay Module
 * Handles directional animated hover interactions for image grid items
 * Inspired by Hakim El Hattab's website
 */
(function () {
  "use strict";

  // Track mouse movement direction globally
  let pointerDirectionX = 0;
  let pointerDirectionY = 0;
  let lastMouseX = null;
  let lastMouseY = null;

  // Utility function to translate elements
  function translate(element, x, y) {
    element.style.transform = `translate(${x}px, ${y}px)`;
  }

  // Throttle utility
  function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  // Detect touch device
  function isTouchDevice() {
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
  }

  function initGridHover() {
    const gridItems = document.querySelectorAll(
      ".image-grid .grid-item, .image-grid-span .grid-item, .polaroid-grid .grid-item"
    );

    // Track mouse movement for directional effect
    if (!isTouchDevice()) {
      document.addEventListener("mousemove", function (event) {
        if (lastMouseX !== null && lastMouseY !== null) {
          const deltaX = event.pageX - lastMouseX;
          const deltaY = event.pageY - lastMouseY;
          const maxDelta = Math.max(Math.abs(deltaX), Math.abs(deltaY));

          if (maxDelta > 0) {
            pointerDirectionX = deltaX / maxDelta;
            pointerDirectionY = deltaY / maxDelta;
          }
        }
        lastMouseX = event.pageX;
        lastMouseY = event.pageY;
      });

      // Reset direction on scroll
      document.addEventListener(
        "scroll",
        throttle(function () {
          lastMouseX = null;
          lastMouseY = null;
          pointerDirectionX = 0;
          pointerDirectionY = 0;
        }, 50)
      );
    }

    // Process each grid item
    gridItems.forEach((item) => {
      // Skip items that contain iframes (videos)
      if (item.querySelector("iframe")) return;

      const img = item.querySelector("img");
      const infoOverlay = item.querySelector(".grid-item-info");
      
      if (!img || !infoOverlay) return;

      // Get elements to animate directionally
      const animatedElements = item.querySelectorAll(
        ".grid-item-info p, .grid-item-info .view-icon"
      );

      if (isTouchDevice()) {
        // Touch device: one tap opens the high-res image directly
        // (bypasses the info overlay — no two-tap flow on mobile)
        item.addEventListener(
          "click",
          function (e) {
            e.stopPropagation();

            const modal = document.getElementById("imageModal");
            if (!modal) return;
            const modalImg = modal.querySelector(".modal-img");
            if (!modalImg) return;

            const fullSrc = img.getAttribute("data-src") || img.src;
            modalImg.src = fullSrc;
            modalImg.alt = img.alt || "Image";
            modalImg.onload = () => {
              modal.classList.add("show");
            };
            document.body.style.overflow = "hidden";
          },
          true
        );
      } else {
        // Mouse device: directional hover effect
        item.addEventListener(
          "mouseenter",
          function () {
            // Offset elements in opposite direction of cursor movement
            animatedElements.forEach((el) => {
              el.classList.add("no-transition");
              translate(el, -20 * pointerDirectionX, -20 * pointerDirectionY);
            });

            // Immediately after, animate back to origin
            setTimeout(() => {
              item.classList.add("hover");
              animatedElements.forEach((el) => {
                el.classList.remove("no-transition");
                translate(el, 0, 0);
              });
            }, 1);
          },
          false
        );

        item.addEventListener(
          "mouseleave",
          function () {
            item.classList.remove("hover");
            // Animate elements in the direction cursor is leaving
            animatedElements.forEach((el) => {
              translate(el, 20 * pointerDirectionX, 20 * pointerDirectionY);
            });
          },
          false
        );

        // Allow click to pass through to the image for modal
        infoOverlay.addEventListener("click", function (e) {
          // Trigger click on the underlying image
          img.click();
        });
      }
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGridHover);
  } else {
    initGridHover();
  }
})();

