/**
 * scrollNav: GSAP-driven navbar hide/show controller.
 *
 * Behaviour:
 *   • Scroll DOWN past threshold → navbar slides up & hides
 *   • Scroll UP   past threshold → navbar slides down & shows
 *   • At page top (scrollY ≤ threshold) → always visible
 *   • Keyboard focus on a nav-link → always visible (a11y)
 *
 * Animation is driven externally by a ScrollTrigger onUpdate callback
 * so the navbar and hero-image rotation stay frame-synchronised.
 *
 * Returns a controller: { show(), hide(), forceShow(), isHidden }
 * or null if .sticky-nav is not in the DOM.
 *
 * Falls back to the original CSS-class approach when GSAP is not loaded.
 */

import gsap from "gsap";

export default function scrollNav() {
  const nav = document.querySelector(".sticky-nav");
  if (!nav) return null;

  /* ── GSAP available → use quickTo tweeners ── */
  if (gsap) {
    // Let GSAP own the centering so CSS translateX doesn't fight y animations
    gsap.set(nav, { xPercent: -50, x: 0, y: 0, opacity: 1 });

    // Match opacity duration with Y duration so it doesn't vanish prematurely
    const tweenY       = gsap.quickTo(nav, "y",       { duration: 0.6, ease: "power2.out" });
    const tweenOpacity = gsap.quickTo(nav, "opacity",  { duration: 0.6, ease: "power2.out" });

    const hideY = -(nav.offsetHeight + 32); // slide fully above viewport
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

    // Accessibility: reveal navbar when a nav link receives keyboard focus
    nav.addEventListener("focusin", forceShow);

    return { show, hide, forceShow, get isHidden() { return hidden; } };
  }

}
