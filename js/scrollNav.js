/**
 * scrollNav – GSAP-driven navbar hide/show controller.
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
    const tweenY       = gsap.quickTo(nav, "y",       { duration: 0.8, ease: "power2.out" });
    const tweenOpacity = gsap.quickTo(nav, "opacity",  { duration: 0.8, ease: "power2.out" });

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

  /* ── Fallback: no GSAP → original CSS-class approach ── */
  let lastScrollY = window.scrollY;
  let ticking = false;
  const THRESHOLD = 1;

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;
      if (currentScrollY <= THRESHOLD) {
        nav.classList.remove("nav-hidden");
      } else if (delta > THRESHOLD) {
        nav.classList.add("nav-hidden");
      } else if (delta < -THRESHOLD) {
        nav.classList.remove("nav-hidden");
      }
      lastScrollY = currentScrollY;
      ticking = false;
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  nav.addEventListener("focusin", () => nav.classList.remove("nav-hidden"));
  return null;
}
