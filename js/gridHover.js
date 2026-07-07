/**
 * Grid Hover Overlay Module
 * Handles directional animated hover interactions for image grid items
 * Inspired by Hakim El Hattab's website
 */
(function () {
  "use strict";

  /* Track the direction of mouse movement globally so overlay elements can offset accordingly. */
  let pointerDirectionX = 0;
  let pointerDirectionY = 0;
  let lastMouseX = null;
  let lastMouseY = null;

  /* Apply a 2D translation transform to the given element using pixel offsets. */
  function translate(element, x, y) {
    element.style.transform = `translate(${x}px, ${y}px)`;
  }

  /* Return a throttled version of the given function that fires at most once per limit milliseconds. */
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

  /* Check whether the current device supports touch interactions. */
  function isTouchDevice() {
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
  }

  function initGridHover() {
    const gridItems = document.querySelectorAll(
      ".image-grid .grid-item, .image-grid-span .grid-item, .polaroid-grid .grid-item"
    );

    /* Track mouse movement direction globally for the directional hover offset effect. */
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

      /* Reset the tracked direction on scroll to avoid stale offsets after page movement. */
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

    /* Set up hover or tap behavior for each grid item based on input modality. */
    gridItems.forEach((item) => {
      /* Skip grid items that contain embedded video iframes, as they handle interaction separately. */
      if (item.querySelector("iframe")) return;

      const img = item.querySelector("img");
      const infoOverlay = item.querySelector(".grid-item-info");
      
      if (!img || !infoOverlay) return;

      /* Select the text and icon elements that will receive the directional offset animation. */
      const animatedElements = item.querySelectorAll(
        ".grid-item-info p, .grid-item-info .view-icon"
      );

      if (isTouchDevice()) {
        /* On touch devices, one tap opens the high-resolution image directly, bypassing the info overlay entirely. */
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
        /* On mouse devices, apply a directional hover effect that offsets overlay elements opposite to cursor movement. */
        item.addEventListener(
          "mouseenter",
          function () {
            /* Offset overlay elements in the opposite direction of the cursor's entry to create a parallax reveal effect. */
            animatedElements.forEach((el) => {
              el.classList.add("no-transition");
              translate(el, -20 * pointerDirectionX, -20 * pointerDirectionY);
            });

            /* After a single frame, animate all elements back to their origin position for a smooth settle. */
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
            /* Offset elements in the direction the cursor is leaving to create a trailing exit effect. */
            animatedElements.forEach((el) => {
              translate(el, 20 * pointerDirectionX, 20 * pointerDirectionY);
            });
          },
          false
        );

        /* Forward clicks on the info overlay to the underlying image so the modal still opens. */
        infoOverlay.addEventListener("click", function (e) {
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

