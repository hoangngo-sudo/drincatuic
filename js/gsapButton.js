/**
 * gsapButton.js: Eased hover and tap animations for all interactive buttons.
 *
 * Follows Emil's design principles:
 *   - Hover uses an ease-out curve (fast start, slow end) over 200ms with a subtle scale increase.
 *   - Press applies a scale(0.97) transform over 150ms per the button press principle.
 *   - No y-axis offsets are used to keep the interaction simple and predictable.
 *   - .social-button elements are excluded because footer icons use bespoke CSS :active press states.
 */

const BUTTON_SELECTORS = [
  '.button', '.prev-btn', '.next-btn',
  '.expand-trigger', '.modal-close'
].join(', ');

/* Use a power2-out easing curve for hover enter and leave so the response feels fast but settles naturally. */
const EASE = "power2.out";
/* Use a snappier power1-out easing for tap press so the feedback feels instantaneous. */
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

  /* Only attach hover animations on devices with a true hover pointer such as a mouse or trackpad.
     Touch-only devices fire phantom mouseenter events on tap, so we gate them out here to prevent sticky hover states. */
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const buttons = document.querySelectorAll(BUTTON_SELECTORS);
  const cleanups = [];

  buttons.forEach((el) => {
    /* Track whether the pointer is currently hovering over this button element. */
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
      /* Return to the hover scale if the pointer is still over the element, otherwise return to rest. */
      const target = hovering ? HOVER_STATE : REST_STATE;
      gsap.to(el, { ...target, ease: EASE, duration: DURATION_HOVER, overwrite: "auto" });
    };

    /* On touch devices, press down triggers an immediate scale on touchstart and a eased return on touchend. */
    const onTouchStart = () => {
      gsap.to(el, { ...TAP_STATE, ease: TAP_EASE, duration: DURATION_TAP, overwrite: "auto" });
    };

    const onTouchEnd = () => {
      gsap.to(el, { ...REST_STATE, ease: EASE, duration: DURATION_HOVER, overwrite: "auto" });
    };

    /* For the RSVP button, delay navigation until the letter-scatter animation completes. */
    const isRsvpBtn = el.classList.contains('button') && el.tagName === 'A' && el.getAttribute('href');
    const LETTER_SELECTOR = '.button__J, .button__e, .button__s, .button__u, .button__s2';
    /* Duration in seconds for the letter animation, following Emil's standard UI duration guidelines of 150 to 250 milliseconds. */
    const LETTER_ANIM_DURATION = 0.25;
    const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let navigating = false;

    const navigateTo = () => {
      window.location.href = el.getAttribute('href');
    };

    const triggerRsvpLetters = () => {
      if (navigating) return;
      navigating = true;

      /* Skip the letter animation when the user has requested reduced motion and navigate immediately. */
      if (REDUCED_MOTION) {
        navigateTo();
        return;
      }

      /* Scale up the button slightly to provide visual feedback before the letter animation. */
      gsap.to(el, { scale: 1.05, ease: "power2.out", duration: 0.2 });

      /* Clear any GSAP inline styles on the letter images so the CSS transitions can take over and animate them. */
      el.querySelectorAll(LETTER_SELECTOR).forEach((img) => {
        gsap.set(img, { clearProps: "all" });
      });
      /* Add the hover class to trigger the CSS letter scatter animation defined in the stylesheet. */
      el.classList.add('hover');

      /* Navigate to the target URL after the letter animation has had time to complete. */
      setTimeout(navigateTo, LETTER_ANIM_DURATION * 1000);
    };

    const onRsvpClick = (e) => {
      if (navigating) return;
      e.preventDefault();
      triggerRsvpLetters();
    };

    /* Attach a click interceptor on the RSVP button to trigger the letter animation before navigation. */
    if (isRsvpBtn) {
      el.addEventListener('click', onRsvpClick);
    }

    /* Attach mouse event listeners on hover-capable devices only to prevent phantom hover states triggered by touch taps. */
    if (canHover) {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
      el.addEventListener("mousedown", onDown);
      el.addEventListener("mouseup", onUp);
    }

    /* Attach touch event listeners for press-down feedback on all devices. */
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    cleanups.push(() => {
      if (isRsvpBtn) {
        el.removeEventListener('click', onRsvpClick);
        el.removeEventListener('touchstart', onRsvpTouchStart);
      }
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
