import "../script.js";
import "../slider.js";
import "../imagePreloading.js";
import "../gridHover.js";
import "../modal.js";
import "../expandable.js";
import initGsapButtons from "../gsapButton.js";
import scrollNav from "../scrollNav.js";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import ScrollSmoother from "gsap/ScrollSmoother";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

document.addEventListener("DOMContentLoaded", () => {
  const scrollNavCtrl = scrollNav();
  const gsapBtnCtrl = initGsapButtons();

  let smoother;
  try {
    smoother = ScrollSmoother.create({
      smooth: 1.5,
      effects: true,
      /* Smooth touch scrolling is disabled. Native touch scroll runs on the
         compositor thread at hardware speed and a JavaScript
         requestAnimationFrame loop can't keep pace. That causes visible
         jitter. */
      smoothTouch: 0,
    });
  } catch (e) {
    console.warn("ScrollSmoother not available:", e.message);
  }

  if (smoother) {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (e) => {
        const id = link.getAttribute("href");
        const target = document.querySelector(id);
        if (!target) return;

        e.preventDefault();
        smoother.scrollTo(target, true, "top top");
        history.pushState(null, "", id);
      });
    });
  }

  let currentRotation = 0;
  const SPEED_MULTIPLIER = 0.1;
  const RESET_THRESHOLD = 40;
  const DECAY_RATE = 0.04;
  const NAV_VELOCITY_DEAD_ZONE = 100;

  const darkImg = document.querySelector(".bg-image.dark-bg");
  const lightImg = document.querySelector(".bg-image.light-bg");
  if (!darkImg || !lightImg) return;

  const rotateDark = gsap.quickTo(darkImg, "rotation", {
    duration: 0.8,
    ease: "power2.out",
  });
  const rotateLight = gsap.quickTo(lightImg, "rotation", {
    duration: 0.8,
    ease: "power2.out",
  });

  ScrollTrigger.create({
    onUpdate: (self) => {
      const velocity = self.getVelocity();
      const scrollY = self.scroll();

      if (scrollY <= RESET_THRESHOLD) {
        currentRotation += (0 - currentRotation) * DECAY_RATE;
        if (Math.abs(currentRotation) < 0.05) currentRotation = 0;
      } else {
        currentRotation += velocity * SPEED_MULTIPLIER * 0.016;
      }

      rotateDark(currentRotation);
      rotateLight(currentRotation);

      if (scrollNavCtrl) {
        if (scrollY <= RESET_THRESHOLD) {
          scrollNavCtrl.show();
        } else if (velocity > NAV_VELOCITY_DEAD_ZONE) {
          scrollNavCtrl.hide();
        } else if (velocity < -NAV_VELOCITY_DEAD_ZONE) {
          scrollNavCtrl.show();
        }
      }
    },
  });
});
