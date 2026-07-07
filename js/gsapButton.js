// gsapButton.js: Eased hover/tap animations for all interactive buttons
// Follows Emil's design principles:
//   - Hover: ease (fast start, slow end), 200ms, subtle scale
//   - Press: scale(0.97) per button press principle, 150ms
//   - No y-axis offsets — keep interaction simple
// .social-button excluded: footer icons use bespoke CSS :active press states.

const BUTTON_SELECTORS = [
  '.button', '.prev-btn', '.next-btn',
  '.expand-trigger', '.modal-close'
].join(', ');

// Hover enter/leave: ease-out for responsive feel, settles naturally
const EASE = "power2.out";
// Tap press: snappier ease for instant press feedback
const TAP_EASE = "power1.out";

const HOVER_STATE = { scale: 1.05 };
const TAP_STATE   = { scale: 0.97 };
const REST_STATE  = { scale: 1    };

const DURATION_HOVER = 0.2;
const DURATION_TAP   = 0.15;

export default function initGsapButtons() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return { destroy() {} };
  }

  // Only attach hover animations on devices with a true hover pointer (mouse/trackpad).
  // Touch-only devices fire phantom mouseenter on tap; gate them out here.
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

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
      gsap.to(el, { ...TAP_STATE, ease: TAP_EASE, duration: DURATION_TAP, overwrite: "auto" });
    };

    const onUp = () => {
      // Return to hover state if still hovering, otherwise rest
      const target = hovering ? HOVER_STATE : REST_STATE;
      gsap.to(el, { ...target, ease: EASE, duration: DURATION_HOVER, overwrite: "auto" });
    };

    // Touch: press-down on touchstart, eased return on touchend
    const isButton = el.classList.contains('button');
    const LETTER_SELECTOR = '.button__J, .button__e, .button__s, .button__u, .button__s2';

    const LETTER_SCATTER = {
      '.button__J':  { x: -72, y: -8, scale: 1.2, opacity: 1 },
      '.button__e':  { x: -48, y: -40, scale: 1.2, opacity: 1 },
      '.button__s':  { x: -19, y: 2, scale: 1.2, opacity: 1 },
      '.button__u':  { x: -8, y: -40, scale: 1.2, opacity: 1 },
      '.button__s2': { x: 8, y: -24, scale: 1.2, opacity: 1 },
    };

    const LETTER_REST = { x: 0, y: 0, scale: 1, opacity: 0 };

    const onTouchStart = () => {
      gsap.to(el, { ...TAP_STATE, ease: TAP_EASE, duration: DURATION_TAP, overwrite: "auto" });

      // Animate floating letter images on the RSVP button
      if (isButton) {
        el.querySelectorAll(LETTER_SELECTOR).forEach((img) => {
          const key = '.' + img.classList[0];
          const state = LETTER_SCATTER[key] || LETTER_REST;
          gsap.to(img, { ...state, ease: "back.out(3)", duration: 0.35, overwrite: "auto" });
        });
      }
    };

    const onTouchEnd = () => {
      gsap.to(el, { ...REST_STATE, ease: EASE, duration: DURATION_HOVER, overwrite: "auto" });

      // Return letter images to hidden rest state, then clear inline props
      // so CSS :hover can resume on desktop when switching from touch
      if (isButton) {
        el.querySelectorAll(LETTER_SELECTOR).forEach((img) => {
          gsap.to(img, {
            ...LETTER_REST,
            ease: EASE,
            duration: 0.2,
            overwrite: "auto",
            onComplete: () => gsap.set(img, { clearProps: "all" }),
          });
        });
      }
    };

    // Desktop (hover-capable devices only): prevents phantom hover on touch taps
    if (canHover) {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
      el.addEventListener("mousedown", onDown);
      el.addEventListener("mouseup", onUp);
    }

    // Touch
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    cleanups.push(() => {
      if (canHover) {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
        el.removeEventListener("mousedown", onDown);
        el.removeEventListener("mouseup", onUp);
      }
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
