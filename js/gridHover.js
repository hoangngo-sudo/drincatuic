/**
 * Grid Hover Overlay Module
 * Handles directional animated hover interactions for image grid items
 * Inspired by Hakim El Hattab's website
 */
(function () {
  "use strict";

  /* Track the direction of mouse movement globally. Overlay elements offset
     based on this direction. */
  let pointerDirectionX = 0;
  let pointerDirectionY = 0;
  let lastMouseX = null;
  let lastMouseY = null;

  /* Apply a 2D translation to the given element using pixel offsets. */
  function translate(element, x, y) {
    element.style.transform = `translate(${x}px, ${y}px)`;
  }

  /* Return a throttled version of the given function. It fires at most once
     every limit milliseconds. */
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

    /* Track mouse movement direction globally. The directional hover offset
       effect uses this. */
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

      /* Reset the tracked direction on scroll. This avoids stale offsets
         after the page moves. */
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

    /* Set up hover or tap behavior for each grid item. The behavior depends
       on the input modality. */
    gridItems.forEach((item) => {
      /* Skip grid items that contain embedded video iframes. They handle
         interaction separately. */
      if (item.querySelector("iframe")) return;

      const img = item.querySelector("img");
      const infoOverlay = item.querySelector(".grid-item-info");
      
      if (!img || !infoOverlay) return;

      /* Select the text and icon elements. They get the directional offset
         animation. */
      const animatedElements = item.querySelectorAll(
        ".grid-item-info p, .grid-item-info .view-icon"
      );

      /* On mouse devices, apply a directional hover effect. Overlay elements
         offset opposite to the cursor movement.
         Gate behind the touch-device check. Mobile and tablet users don't
         get sticky hover states. */
      if (!isTouchDevice()) {
        item.addEventListener(
          "mouseenter",
          function () {
            /* Offset overlay elements opposite to the cursor's entry direction.
               This creates a parallax reveal effect. */
            animatedElements.forEach((el) => {
              el.classList.add("no-transition");
              translate(el, -20 * pointerDirectionX, -20 * pointerDirectionY);
            });

            /* After a single frame, animate all elements back to their origin
               position. They settle in without snapping. */
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
            /* Offset elements in the direction the cursor is leaving. This
               creates a trailing exit effect. */
            animatedElements.forEach((el) => {
              translate(el, 20 * pointerDirectionX, 20 * pointerDirectionY);
            });
          },
          false
        );
      }

      /* Forward clicks on the info overlay to the underlying image. The modal
         still opens. This runs on both mouse and touch devices. */
      infoOverlay.addEventListener("click", function (e) {
        img.click();
      });
    });

  }

  // Initialize when the DOM is ready.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGridHover);
  } else {
    initGridHover();
  }
})();

