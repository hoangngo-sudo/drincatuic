/**
 * Directional Image Morph Animation (GSAP)
 *
 * This module recreates Jace's directional popup pattern for opening and
 * closing images on the polaroid grid. When a thumbnail is clicked, a
 * fixed-position clone of the image animates from the thumbnail's screen
 * position to the center of the viewport, then swaps in the real modal
 * content. Closing the modal runs the animation in reverse, so the image
 * retraces its path and lands exactly back on the thumbnail.
 *
 * Opening uses ease-out-quart for a responsive start and a gentle landing.
 * Closing mirrors the same curve so the journey feels symmetric in both
 * directions. If the user has expressed a preference for reduced motion,
 * the modal toggles instantly without any animation.
 */

const morph = (() => {
  /* DOM references passed in from modal.js during init(). */
  let modal = null;
  let modalImg = null;
  let modalPolaroidFrame = null;
  let modalContent = null;
  let closeBtn = null;

  /* Mutable state that persists across a single open-close cycle. */
  let isAnimating = false;
  let sourceRect = null;
  let sourceImgSrc = null;

  /* We keep a reference to the thumbnail element that triggered the
     current open, so the close animation can retrace the exact same
     path even if the modal.js caller doesn't pass it again. */
  let closeSourceEl = null;

  /* The rotation angle (in degrees) of the polaroid card that was
     clicked.  Captured during open and applied during close so the
     clone rotates back into the card's organic scattered tilt
     instead of snapping flat at the last frame. */
  let sourceRotation = 0;

  /* The .polaroid-card element that was clicked, stored so the close
     animation can crossfade the clone into the real card and mask any
     sub-pixel positional mismatch when the two swap visibility. */
  let sourceCardEl = null;

  /* The translateX and translateY values from the polaroid card's CSS
     transform, extracted during open and applied during close so the
     clone replicates the card's full rotate()+translate() transform
     instead of only the rotation.  Defaults to 0 for non-polaroid
     images. */
  let sourceTranslateX = 0;
  let sourceTranslateY = 0;

  let morphClone = null;
  let morphCloneImg = null;
  let resolveOpen = null;
  let resolveClose = null;

  /* These easing tokens follow Emil Kowalski's animation blueprint.
     ease-out-quart provides a fast, responsive start with a gentle
     deceleration, which works for both entering and exiting elements. */
  const EASE_OUT_QUART = "cubic-bezier(0.165, 0.84, 0.44, 1)";

  /* Open and close share the same duration so the motion is symmetric. */
  const MORPH_DUR = 0.35;
  const OVERLAY_DUR = 0.3;

  const prefersReducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Decompose a 2D CSS transform matrix (from getComputedStyle) into
     its rotation angle in degrees.  Returns 0 for the identity matrix
     so non-polaroid images default to flat. */
  const getRotationAngle = (el) => {
    const m = new DOMMatrixReadOnly(window.getComputedStyle(el).transform);
    if (m.a === 1 && m.b === 0 && m.c === 0 && m.d === 1) return 0;
    return Math.atan2(m.b, m.a) * (180 / Math.PI);
  };

  /* Snapshot a DOMRect into a plain object so the values do not go
     stale when the browser repaints. */
  const freezeRect = (r) => ({
    left: r.left, top: r.top, width: r.width, height: r.height,
  });

  /* Capture layout-accurate dimensions from a live element, correcting
     for CSS rotation.  getBoundingClientRect() returns the axis-aligned
     bounding box of a rotated element, which is larger than the
     element's true visual footprint.  We use offsetWidth / offsetHeight
     (layout dimensions without transforms) for the size and adjust the
     position so the rotation centre stays anchored.  This eliminates
     the 2–6 px double-compensation that causes visible jitter when the
     clone lands on the card — the mismatch is proportionally worse on
     small mobile screens. */
  const freezeRectFromEl = (el) => {
    const r = el.getBoundingClientRect();
    const ow = el.offsetWidth;
    const oh = el.offsetHeight;
    return {
      left: Math.round(r.left + (r.width - ow) / 2),
      top: Math.round(r.top + (r.height - oh) / 2),
      width: ow,
      height: oh,
    };
  };

  const ensureClone = () => {
    if (morphClone) return;
    morphClone = document.createElement("div");
    morphClone.className = "morph-clone";
    morphClone.setAttribute("aria-hidden", "true");
    morphCloneImg = document.createElement("img");
    morphCloneImg.className = "morph-clone-img";
    morphCloneImg.alt = "";
    morphClone.appendChild(morphCloneImg);
    document.body.appendChild(morphClone);
  };

  const destroyClone = () => {
    if (!morphClone) return;
    morphClone.remove();
    morphClone = null;
    morphCloneImg = null;
  };

  const killTweens = () => {
    gsap.killTweensOf(".morph-clone");
    gsap.killTweensOf(modal);
  };

  /*
   * Open phase
   *
   * We capture the source thumbnail's bounding rect, preload the
   * full-resolution image into the modal, wait for the browser to lay
   * it out, then animate a clone from the source position to the
   * target position. The backdrop fades in alongside with a slight
   * stagger so the expanding clone feels like it is leading the
   * transition.
   */

  const open = (imgSrc, imgAlt, sourceEl) =>
    new Promise((resolve) => {
      killTweens();
      if (resolveOpen) { resolveOpen(); resolveOpen = null; }
      if (resolveClose) { resolveClose(); resolveClose = null; }
      isAnimating = true;
      resolveOpen = resolve;

      /* When the source thumbnail lives inside a .polaroid-frame, use the frame's
         bounding rect rather than the naked <img> rect.  On small screens the frame
         adds proportionally large padding, and a clone sized to the image rect
         would visibly shrink inside its own padding — that mismatch is the
         primary source of jitter on mobile.
         freezeRectFromEl corrects for the card's CSS rotation so the clone lands
         on the exact visual footprint, not the axis-aligned bounding box. */
      const polaroidFrame = sourceEl.closest('.polaroid-frame');
      const sourceFrameEl = polaroidFrame || sourceEl;
      sourceRect = freezeRectFromEl(sourceFrameEl);
      sourceImgSrc = imgSrc;
      /* Store the frame element (not the image) so the close animation retraces
         to the same frame-sized rect even after the user has scrolled. */
      closeSourceEl = polaroidFrame || sourceEl;

      /* Capture the polaroid card's full transform (rotation + translation)
         so the close animation can replicate both.  The CSS uses
         rotate() translate() order, so m.e = tx and m.f = ty directly
         from the matrix — no decomposition needed. */
      if (polaroidFrame) {
        const card = polaroidFrame.closest('.polaroid-card');
        const m = new DOMMatrixReadOnly(window.getComputedStyle(card).transform);
        sourceRotation = Math.atan2(m.b, m.a) * (180 / Math.PI);
        sourceTranslateX = m.e;
        sourceTranslateY = m.f;
        sourceCardEl = card;
      } else {
        sourceRotation = 0;
        sourceTranslateX = 0;
        sourceTranslateY = 0;
        sourceCardEl = null;
      }

      if (prefersReducedMotion()) {
        modalImg.src = imgSrc;
        modalImg.alt = imgAlt || "Image";
        modal.classList.add("show");
        document.body.style.overflow = "hidden";
        onOpenComplete();
        return;
      }

      modalImg.src = imgSrc;
      modalImg.alt = imgAlt || "Image";

      modalContent.style.opacity = "0";
      closeBtn.style.opacity = "0";
      closeBtn.style.pointerEvents = "none";
      modal.style.backgroundColor = "rgba(0, 0, 0, 0)";
      modal.style.backdropFilter = "blur(0px)";
      modal.style.webkitBackdropFilter = "blur(0px)";
      modal.classList.add("show");
      modalImg.style.opacity = "0";
      document.body.style.overflow = "hidden";

      const startMorph = () => {
        /* Use the polaroid frame's bounding rect as the morph target so the expanding clone lands precisely where the polaroid frame appears, maintaining the same framed aesthetic throughout the transition. */
        const frame = modalPolaroidFrame || modalContent;
        const targetRect = frame.getBoundingClientRect();

        ensureClone();
        morphCloneImg.src = imgSrc;
        morphCloneImg.alt = imgAlt || "Image";

        /* Make the morph clone visually match the modal polaroid frame so the clone-to-real swap at the end of the animation is invisible.
           Without these styles the clone is a bare full-bleed image, while the real frame has white padding and a shadow —
           the mismatch causes a visible snap when onOpenComplete hides the clone and reveals the frame.
           Padding is read from the live computed style so it stays in sync with responsive media queries on small screens.
           Guard against null modalPolaroidFrame — fall back to empty padding and no shadow if the element is missing. */
        morphClone.style.display = "block";
        morphClone.style.opacity = "1";
        morphClone.style.boxSizing = "border-box";
        morphClone.style.backgroundColor = "var(--polaroid-frame-bg)";
        if (modalPolaroidFrame) {
          morphClone.style.padding = window.getComputedStyle(modalPolaroidFrame).paddingLeft;
          morphClone.style.borderRadius = window.getComputedStyle(modalPolaroidFrame).borderRadius;
          morphClone.style.boxShadow = window.getComputedStyle(modalPolaroidFrame).boxShadow;
        }

        gsap.set(morphClone, {
          left: sourceRect.left,
          top: sourceRect.top,
          width: sourceRect.width,
          height: sourceRect.height,
          scaleX: 1,
          scaleY: 1,
          transformOrigin: "left top",
        });

        const tl = gsap.timeline({
          onComplete: onOpenComplete,
        });

        tl.to(morphClone, {
          left: targetRect.left,
          top: targetRect.top,
          width: targetRect.width,
          height: targetRect.height,
          duration: MORPH_DUR,
          ease: EASE_OUT_QUART,
        }, 0);

        tl.to(modal, {
          backgroundColor: "rgba(0, 0, 0, 0.51)",
          backdropFilter: "blur(5px)",
          webkitBackdropFilter: "blur(5px)",
          duration: OVERLAY_DUR,
          ease: EASE_OUT_QUART,
        }, 0.05);
      };

      if (modalImg.complete && modalImg.naturalWidth > 0) {
        startMorph();
      } else {
        modalImg.addEventListener("load", startMorph, { once: true });
        modalImg.addEventListener("error", () => { startMorph(); }, { once: true });
      }
    });

  const onOpenComplete = () => {
    modalContent.style.opacity = "1";
    closeBtn.style.opacity = "1";
    closeBtn.style.pointerEvents = "auto";
    modalImg.style.opacity = "1";
    if (morphClone) morphClone.style.display = "none";

    /* Clear the polaroid-frame-matching styles from the clone so it is clean for the next open cycle. */
    if (morphClone) {
      morphClone.style.backgroundColor = "";
      morphClone.style.padding = "";
      morphClone.style.boxSizing = "";
    }

    modal.style.backgroundColor = "rgba(0, 0, 0, 0.51)";
    modal.style.backdropFilter = "blur(5px)";
    modal.style.webkitBackdropFilter = "blur(5px)";

    isAnimating = false;
    if (resolveOpen) { resolveOpen(); resolveOpen = null; }
  };

  /*
   * Close phase
   *
   * This is a clean reverse of the open animation. The clone starts
   * at the current modal image position and animates back to wherever
   * the thumbnail is on screen at this moment (it may have scrolled).
   * We use the same ease-out-quart curve as the open so the motion
   * feels identical in both directions.
   */

  const close = (sourceEl) =>
    new Promise((resolve) => {
      killTweens();
      if (resolveOpen) { resolveOpen(); resolveOpen = null; }
      if (resolveClose) { resolveClose(); resolveClose = null; }
      isAnimating = true;
      resolveClose = resolve;

      if (prefersReducedMotion()) {
        onCloseComplete();
        return;
      }

      if (!morphClone) {
        onCloseComplete();
        return;
      }

      /* We prefer the element passed by the caller, but fall back to
         the element stored during open (which is the .polaroid-frame
         wrapper when the source image lives inside one). This guarantees
         the clone retraces to the frame-sized rect on all screen sizes.
         freezeRectFromEl corrects for CSS rotation so the clone's
         dimensions match the card's true visual footprint, not its
         axis-aligned bounding box. */
      let srcRect;
      const el = sourceEl || closeSourceEl;
      if (el) {
        srcRect = freezeRectFromEl(el);
      } else {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        srcRect = { left: cx, top: cy, width: 0, height: 0 };
      }

      /* Use the polaroid frame's bounding rect as the starting position for the close morph so the clone retraces from the framed image rather than from the raw image bounds. */
      const closeFrame = modalPolaroidFrame || modalContent;
      const modalRect = closeFrame.getBoundingClientRect();

      ensureClone();
      morphCloneImg.src = sourceImgSrc || modalImg.src;
      morphCloneImg.alt = modalImg.alt || "";

      /* Style the clone to match the polaroid frame during the close animation so the visual is consistent from the moment the modal content fades out.
         Padding and border-radius are read from the live computed style so they match responsive media queries.
         Guard against null modalPolaroidFrame — skip frame styling if the element is missing. */
      morphClone.style.display = "block";
      morphClone.style.opacity = "1";
      morphClone.style.boxSizing = "border-box";
      morphClone.style.backgroundColor = "var(--polaroid-frame-bg)";
      if (modalPolaroidFrame) {
        morphClone.style.padding = window.getComputedStyle(modalPolaroidFrame).paddingLeft;
        morphClone.style.borderRadius = window.getComputedStyle(modalPolaroidFrame).borderRadius;
        morphClone.style.boxShadow = window.getComputedStyle(modalPolaroidFrame).boxShadow;
      }

      gsap.set(morphClone, {
        left: modalRect.left,
        top: modalRect.top,
        width: modalRect.width,
        height: modalRect.height,
        scaleX: 1,
        scaleY: 1,
        /* Use center origin so the rotation applied during the close tween
           pivots around the clone's visual center, matching how the polaroid
           cards rotate around their own center via CSS. */
        transformOrigin: "center center",
      });

      modalContent.style.opacity = "0";
      modalImg.style.opacity = "0";
      closeBtn.style.opacity = "0";
      closeBtn.style.pointerEvents = "none";

      /* Hide the real polaroid card behind the still-visible modal
         backdrop so the clone can land in its place and crossfade
         into it.  The backdrop blur masks the disappearance at this
         stage, and the crossfade at the end reveals it smoothly. */
      if (sourceCardEl) {
        gsap.set(sourceCardEl, { opacity: 0 });
      }

      const tl = gsap.timeline({
        onComplete: onCloseComplete,
      });

      tl.to(morphClone, {
        /* Subtract the card's CSS translate offset from left/top because
           freezeRectFromEl (via getBoundingClientRect) already includes it
           in the screen-space position.  GSAP x/y adds it back as a
           transform, matching the card's rotate()+translate() chain so the
           clone lands on the exact visual position. */
        left: srcRect.left - sourceTranslateX,
        top: srcRect.top - sourceTranslateY,
        width: srcRect.width,
        height: srcRect.height,
        rotation: sourceRotation,
        x: sourceTranslateX,
        y: sourceTranslateY,
        duration: MORPH_DUR,
        ease: EASE_OUT_QUART,
      }, 0);

      tl.to(modal, {
        backgroundColor: "rgba(0, 0, 0, 0)",
        backdropFilter: "blur(0px)",
        webkitBackdropFilter: "blur(0px)",
        duration: OVERLAY_DUR,
        ease: EASE_OUT_QUART,
      }, 0);

      /* Crossfade: the clone fades out while the real polaroid card fades
         in simultaneously, so any sub-pixel positional mismatch between
         the two is blended rather than snapping.  The overlap starts
         80 ms before the position + rotation tween finishes, giving a
         150 ms crossfade window.  Emil's rule: "Only animate transform
         and opacity, and keep them simple." */
      const CROSSFADE_DUR = 0.15;
      const CROSSFADE_OVERLAP = 0.08;

      tl.to(morphClone, {
        opacity: 0,
        duration: CROSSFADE_DUR,
        ease: "power2.out",
      }, `-=${CROSSFADE_OVERLAP}`);

      if (sourceCardEl) {
        tl.to(sourceCardEl, {
          opacity: 1,
          duration: CROSSFADE_DUR,
          ease: "power2.out",
        }, `-=${CROSSFADE_DUR}`);
      }
    });

  const onCloseComplete = () => {
    if (morphClone) {
      morphClone.style.display = "none";
      /* Clear the polaroid-frame-matching styles so the clone is clean for the next cycle. */
      morphClone.style.backgroundColor = "";
      morphClone.style.padding = "";
      morphClone.style.boxSizing = "";
    }
    modal.classList.remove("show");
    modalImg.src = "";
    modal.style.backgroundColor = "";
    modal.style.backdropFilter = "";
    modal.style.webkitBackdropFilter = "";
    modalContent.style.opacity = "";
    closeBtn.style.opacity = "";
    closeBtn.style.pointerEvents = "";
    modalImg.style.opacity = "";
    document.body.style.overflow = "";

    /* Restore the real polaroid card to full opacity in case the
       crossfade tween was interrupted or never ran (e.g. reduced
       motion path). */
    if (sourceCardEl) {
      gsap.set(sourceCardEl, { opacity: 1 });
    }

    isAnimating = false;
    sourceRect = null;
    sourceImgSrc = null;
    closeSourceEl = null;
    sourceRotation = 0;
    sourceTranslateX = 0;
    sourceTranslateY = 0;
    sourceCardEl = null;

    if (resolveClose) { resolveClose(); resolveClose = null; }

    requestAnimationFrame(() => requestAnimationFrame(destroyClone));
  };

  /*
   * Initialization
   *
   * modal.js calls init({ modal, modalImg, modalContent, closeBtn })
   * once on page load so this module can reference the modal's DOM
   * nodes without querying for them on every open or close.
  */

  const init = (options) => {
    modal = options.modal;
    modalImg = options.modalImg;
    modalPolaroidFrame = options.modalPolaroidFrame;
    modalContent = options.modalContent;
    closeBtn = options.closeBtn;
  };

  return { init, open, close, get isAnimating() { return isAnimating; } };
})();

export default morph;

