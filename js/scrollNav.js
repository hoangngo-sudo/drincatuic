/**
 * scrollNav – hide/show the desktop navbar based on scroll direction.
 *
 * Behaviour:
 *   • Scroll DOWN past threshold → navbar slides up & hides
 *   • Scroll UP   past threshold → navbar slides down & shows
 *   • At page top (scrollY ≤ threshold) → always visible
 *   • Keyboard focus on a nav-link → always visible (a11y)
 *
 * Performance:
 *   • passive listener — never blocks scrolling
 *   • requestAnimationFrame guard — max 1 update per frame
 *   • transform + opacity — GPU-composited, no layout/paint
 */

function scrollNav() {
  const nav = document.querySelector(".sticky-nav");
  if (!nav) return; // page may not contain the navbar

  let lastScrollY = window.scrollY;
  let ticking = false;
  const THRESHOLD = 5; // px – minimum delta before toggling

  const onScroll = () => {
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;

      if (currentScrollY <= THRESHOLD) {
        // Always show at the very top of the page
        nav.classList.remove("nav-hidden");
      } else if (delta > THRESHOLD) {
        // Scrolling down → hide
        nav.classList.add("nav-hidden");
      } else if (delta < -THRESHOLD) {
        // Scrolling up → show
        nav.classList.remove("nav-hidden");
      }
      // If |delta| ≤ THRESHOLD, keep current state (avoids flicker)

      lastScrollY = currentScrollY;
      ticking = false;
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });

  // Accessibility: reveal navbar when a nav link receives keyboard focus
  nav.addEventListener("focusin", () => {
    nav.classList.remove("nav-hidden");
  });
}

document.addEventListener("DOMContentLoaded", scrollNav);
