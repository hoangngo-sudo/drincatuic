/**
 * scrollNav: GSAP-driven navbar hide/show controller.
 *
 * Behavior:
 *   • Scroll DOWN past threshold → navbar slides up and hides
 *   • Scroll UP   past threshold → navbar slides down and shows
 *   • At page top (scrollY ≤ threshold) → always visible
 *   • Keyboard focus on a nav-link → always visible (a11y)
 *
 * Animation is driven externally by a ScrollTrigger onUpdate callback.
 * The navbar and hero-image rotation stay frame-synchronized.
 *
 * Returns a controller: { show(), hide(), forceShow(), isHidden }.
 * Returns null when .sticky-nav is not in the DOM.
 * Returns undefined when GSAP is not loaded.
 */

import gsap from "gsap";

export default function scrollNav() {
  const nav = document.querySelector(".sticky-nav");
  if (!nav) return null;

  /* Use GSAP quickTo tweeners when the GSAP library is available. They
     give efficient frame-synchronized animations. */
  if (gsap) {
    /* Set the initial centering transform with GSAP. CSS translateX will
       not conflict with the y-axis animations. */
    gsap.set(nav, { xPercent: -50, x: 0, y: 0, opacity: 1 });

    /* Create quickTo tweeners for y position and opacity. Their durations
       match. The navbar does not vanish before it slides out of view. */
    const tweenY       = gsap.quickTo(nav, "y",       { duration: 0.6, ease: "power2.out" });
    const tweenOpacity = gsap.quickTo(nav, "opacity",  { duration: 0.6, ease: "power2.out" });

    /* Calculate the y-offset needed to slide the navbar above the
       viewport. Include a 32-pixel buffer. */
    const hideY = -(nav.offsetHeight + 32);
    let hidden = false;

    function hide() {
      if (hidden) return;
      hidden = true;
      tweenY(hideY);
      tweenOpacity(0);
      nav.style.pointerEvents = "none";
    }

    function show() {
      if (!hidden) return;
      hidden = false;
      tweenY(0);
      tweenOpacity(1);
      nav.style.pointerEvents = "auto";
    }

    function forceShow() {
      hidden = false;
      tweenY(0);
      tweenOpacity(1);
      nav.style.pointerEvents = "auto";
    }

    /* Reveal the navbar whenever a navigation link receives keyboard focus.
       This keeps it accessible to keyboard users. */
    nav.addEventListener("focusin", forceShow);

    return { show, hide, forceShow, get isHidden() { return hidden; } };
  }

}
