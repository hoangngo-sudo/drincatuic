// gsapButton.js — GSAP spring-physics hover/tap animations for all interactive buttons
// Uses global `gsap` from CDN (do NOT import gsap here — it's already on window)

const BUTTON_SELECTORS = [
  '.button', '.social-button', '.prev-btn', '.next-btn',
  '.expand-trigger', '.modal-close'
].join(', ');

// Spring config: stiffness 300, damping 15
// Mapped to GSAP elastic ease — amplitude 1, period 0.3 ≈ spring(300, 15)
const EASE = "elastic.out(1, 0.3)";

const HOVER_STATE = { scale: 1.05, y: -2 };
const TAP_STATE   = { scale: 0.9,  y: 1  };
const REST_STATE  = { scale: 1,    y: 0  };

const DURATION_HOVER = 0.6;
const DURATION_TAP   = 0.15;

export default function initGsapButtons() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return { destroy() {} };
  }

  const buttons = document.querySelectorAll(BUTTON_SELECTORS);
  const cleanups = [];

  buttons.forEach((el) => {
    // Track whether the pointer is currently over the element
    let hovering = false;

    const onEnter = () => {
      hovering = true;
      gsap.to(el, { ...HOVER_STATE, ease: EASE, duration: DURATION_HOVER, overwrite: "auto" });
    };

    const onLeave = () => {
      hovering = false;
      gsap.to(el, { ...REST_STATE, ease: EASE, duration: DURATION_HOVER, overwrite: "auto" });
    };

    const onDown = () => {
      gsap.to(el, { ...TAP_STATE, ease: EASE, duration: DURATION_TAP, overwrite: "auto" });
    };

    const onUp = () => {
      // Spring back to hover state if still hovering, otherwise rest
      const target = hovering ? HOVER_STATE : REST_STATE;
      gsap.to(el, { ...target, ease: EASE, duration: DURATION_HOVER, overwrite: "auto" });
    };

    // --- Touch: press-down on touchstart, spring back on touchend ---
    const onTouchStart = () => {
      gsap.to(el, { ...TAP_STATE, ease: EASE, duration: DURATION_TAP, overwrite: "auto" });
    };

    const onTouchEnd = () => {
      gsap.to(el, { ...REST_STATE, ease: EASE, duration: DURATION_HOVER, overwrite: "auto" });
    };

    // Desktop
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    el.addEventListener("mousedown", onDown);
    el.addEventListener("mouseup", onUp);

    // Mobile — passive so we never block scrolling or link navigation
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    cleanups.push(() => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
      el.removeEventListener("mousedown", onDown);
      el.removeEventListener("mouseup", onUp);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
      gsap.set(el, REST_STATE);
    });
  });

  return {
    destroy() {
      cleanups.forEach((fn) => fn());
    },
  };
}
