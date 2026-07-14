/**
 * Directional Image Morph Animation (GSAP)
 *
 * This module recreate directional popup pattern for opening and
 * closing images on the polaroid grid. When a thumbnail is clicked, a
 * fixed-position clone of the image animates from the thumbnail's screen
 * position to the center of the viewport, then swaps in the real modal
 * content. Closing the modal runs the animation in reverse, so the image
 * retraces its path and lands exactly back on the thumbnail.
 *
 * Opening uses ease-out-quint for a fast, responsive start with gentle
 * deceleration. Duration scales with travel distance so short trips
 * feel snappy (about 180 ms) on mobile and long trips have enough time
 * (about 400 ms) on desktop. The feel stays consistent across every
 * screen size.
 *
 * Per Apple Design, the morph starts immediately on
 * pointer-down using the already-loaded thumbnail as the clone source.
 * The full-resolution image loads in the background and swaps in
 * without a visible hiccup when ready. The user never waits for a
 * network request before seeing motion.
 *
 * If the user has expressed a preference for reduced motion, the modal
 * toggles instantly without any animation.
 */

const morph = (() => {
  /* These DOM references are passed in from modal.js during init(). */
  let modal = null;
  let modalImg = null;
  let modalPolaroidFrame = null;
  let modalContent = null;
  let closeBtn = null;

  /* This state persists across a single open-close cycle. */
  let isAnimating = false;
  let sourceRect = null;
  let sourceImgSrc = null;

  /* We keep a reference to the thumbnail that triggered the current
     open so the close animation retraces the same path even when
     the modal caller doesn't pass it again. */
  let closeSourceEl = null;

  /* The rotation angle (in degrees) of the polaroid card that was
     clicked. We capture it during open and apply it during close
     so the clone rotates back into the card's tilt instead of
     snapping flat at the last frame. */
  let sourceRotation = 0;

  /* The .polaroid-card element that was clicked. We store it so the
     close animation crossfades the clone into the real card and masks
     any sub-pixel mismatch when the two swap. */
  let sourceCardEl = null;

  /* The translateX and translateY values from the polaroid card's CSS
     transform. We extract them during open and apply them during close
     so the clone matches the card's full rotate()+translate() transform
     instead of just the rotation. Defaults to 0 for images that aren't
     inside a polaroid card. */
  let sourceTranslateX = 0;
  let sourceTranslateY = 0;

  let morphClone = null;
  let morphCloneImg = null;
  let resolveOpen = null;
  let resolveClose = null;

  /* These easing tokens follow Emil Kowalski's animation blueprint.
     ease-out-quint is faster than ease-out-quart on the initial response
     and still decelerates gently. It's close to Apple's critically
     damped spring feel. */
  const EASE_OUT_QUINT = "cubic-bezier(0.23, 1, 0.32, 1)";

  /* Open and close share the same easing so the motion is symmetric.
     Duration is computed per cycle based on travel distance (see
     computeMorphDuration). Short trips feel snappy and long trips
     have enough time across all screen sizes. */
  const OVERLAY_DUR = 0.3;

  const prefersReducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Decompose a 2D CSS transform matrix (from getComputedStyle) into
     its rotation angle in degrees. Returns 0 for the identity matrix.
     Non-polaroid images default to flat. */
  const getRotationAngle = (el) => {
    const m = new DOMMatrixReadOnly(window.getComputedStyle(el).transform);
    if (m.a === 1 && m.b === 0 && m.c === 0 && m.d === 1) return 0;
    return Math.atan2(m.b, m.a) * (180 / Math.PI);
  };

  /* Snapshot a DOMRect into a plain object. The values don't go stale
     when the browser repaints. */
  const freezeRect = (r) => ({
    left: r.left, top: r.top, width: r.width, height: r.height,
  });

  /* Capture layout-accurate dimensions from a live element, correcting
     for CSS rotation. getBoundingClientRect() returns the axis-aligned
     bounding box of a rotated element. That box is bigger than the
     element's true visual footprint. We use offsetWidth and
     offsetHeight (layout dimensions without transforms) for the size
     and adjust the position so the rotation centre stays anchored.
     This removes the 2-6 px double-compensation that causes jitter
     when the clone lands on the card. The mismatch is worst on small
     mobile screens. */
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

  /* Return a morph duration based on the Euclidean distance between
     two rectangles. Short trips feel snappy (floor 180 ms). Long
     trips get enough time to read as intentional (ceiling 400 ms).
     Distance is measured between the centres of the source and target
     rects and normalised against a typical desktop viewport diagonal
     (~1700 px). On mobile the same physical tap distance gives a
     shorter duration because the viewport is smaller. This keeps the
     feel tight on small screens.

     Apple Design §4 says response time maps to the spring's settle
     rate, not a fixed duration. Lower is snappier. This function
     turns physical distance into perceived response time. */
  const computeMorphDuration = (fromRect, toRect) => {
    const fromCX = fromRect.left + fromRect.width / 2;
    const fromCY = fromRect.top + fromRect.height / 2;
    const toCX = toRect.left + toRect.width / 2;
    const toCY = toRect.top + toRect.height / 2;
    const dist = Math.hypot(toCX - fromCX, toCY - fromCY);
    const viewportDiagonal = Math.hypot(window.innerWidth, window.innerHeight);
    const ratio = dist / (viewportDiagonal || 1);
    /* Map ratio 0-1 across the 0.18s-0.40s range.
       A centre-screen tap (ratio near 0) gets about 180 ms. Snappy.
       A corner-to-corner trip (ratio near 1) gets about 400 ms.
       Smooth. */
    return Math.min(0.4, Math.max(0.18, 0.18 + ratio * 0.22));
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
    /* Restore the polaroid card that a close animation may have hidden.
     The grid should never show a blank spot after an interrupted close.
     We also hide the clone element. Completion callbacks don't fire on
     interruption, so we clean up the clone here. */
    if (sourceCardEl) {
      gsap.set(sourceCardEl, { opacity: 1 });
    }
    gsap.killTweensOf(".morph-clone");
    gsap.killTweensOf(modal);
    if (morphClone) {
      morphClone.style.display = "none";
      morphClone.style.backgroundColor = "";
      morphClone.style.padding = "";
      morphClone.style.boxSizing = "";
    }
  };

  /*
   * Open phase
   *
   * We capture the source thumbnail's bounding rect, load the
   * full-resolution image into the modal, let the browser lay it out,
   * then animate a clone from the source position to the target
   * position. The backdrop fades in with a slight stagger so the
   * expanding clone looks like it's leading the transition.
   */

  const open = (imgSrc, imgAlt, sourceEl) =>
    new Promise((resolve) => {
      killTweens();
      if (resolveOpen) { resolveOpen(); resolveOpen = null; }
      if (resolveClose) { resolveClose(); resolveClose = null; }
      isAnimating = true;
      resolveOpen = resolve;

      /* When the source thumbnail lives inside a .polaroid-frame, use the frame's
         bounding rect instead of the bare <img> rect. On small screens the frame
         padding is large and a clone sized to the image rect would visibly shrink
         inside its own padding. That mismatch is the main source of jitter on
         mobile.
         freezeRectFromEl corrects for the card's CSS rotation. The clone lands
         on the exact visual footprint, not the axis-aligned bounding box. */
      const polaroidFrame = sourceEl.closest('.polaroid-frame');
      const sourceFrameEl = polaroidFrame || sourceEl;
      sourceRect = freezeRectFromEl(sourceFrameEl);
      sourceImgSrc = imgSrc;
      /* Store the frame element, not the image. The close animation retraces
         to the same frame-sized rect even after the user has scrolled. */
      closeSourceEl = polaroidFrame || sourceEl;

      /* Capture the polaroid card's full transform (rotation and translation).
         The close animation needs both. The CSS uses rotate() translate()
         order, so m.e = tx and m.f = ty directly from the matrix. No
         decomposition needed. */
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
        /* Use the polaroid frame's bounding rect as the morph target. The
           expanding clone lands exactly where the polaroid frame appears,
           so the framed look stays consistent through the transition. */
        const frame = modalPolaroidFrame || modalContent;
        const targetRect = frame.getBoundingClientRect();

        ensureClone();
        /* morphCloneImg.src is set by the caller (thumbnail or full-res).
           We don't overwrite it here. */
        morphCloneImg.alt = imgAlt || "Image";

        /* Make the morph clone look like the modal polaroid frame so the
           clone-to-real swap at the end is invisible. Without these styles
           the clone is a bare full-bleed image while the real frame has white
           padding and a shadow. The mismatch snaps visibly when onOpenComplete
           hides the clone and shows the frame.
           Padding comes from the live computed style so it stays in sync with
           responsive media queries on small screens.
           When modalPolaroidFrame is null, we fall back to empty padding and
           no shadow. */
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

        const morphDur = computeMorphDuration(sourceRect, targetRect);

        const tl = gsap.timeline({
          onComplete: onOpenComplete,
        });

        tl.to(morphClone, {
          left: targetRect.left,
          top: targetRect.top,
          width: targetRect.width,
          height: targetRect.height,
          duration: morphDur,
          ease: EASE_OUT_QUINT,
        }, 0);

        tl.to(modal, {
          backgroundColor: "rgba(0, 0, 0, 0.51)",
          backdropFilter: "blur(5px)",
          webkitBackdropFilter: "blur(5px)",
          duration: OVERLAY_DUR,
          ease: EASE_OUT_QUINT,
        }, 0.05);
      };

      /* Apple Design §1 (Response): respond on pointer-down, not after
         the full-res image finishes loading. Start the morph animation
         immediately. If the full-resolution image is already cached
         (preloaded), the clone uses it directly. Otherwise the clone
         starts with the already-loaded thumbnail src and swaps to the
         full-res version when it arrives. The user sees instant motion
         regardless of connection speed.

         modalImg.src was set above to start loading the full-res in the
         background. By the time the morph completes (180-400 ms) the
         full-res is almost always ready. If it isn't, onOpenComplete
         handles the swap without a visible hiccup. */

      /* The thumbnail src is already loaded. It's instant. */
      const thumbnailSrc = sourceEl.tagName === "IMG"
        ? (sourceEl.currentSrc || sourceEl.src)
        : imgSrc;

      const swapCloneToFullRes = () => {
        if (morphClone && morphClone.style.display !== "none") {
          morphCloneImg.src = imgSrc;
        }
      };

      if (modalImg.complete && modalImg.naturalWidth > 0) {
        /* Full-res is cached. Use it directly. No swap needed. */
        ensureClone();
        morphCloneImg.src = imgSrc;
        startMorph();
      } else {
        /* Full-res is still loading. Morph the thumbnail now, swap later. */
        ensureClone();
        morphCloneImg.src = thumbnailSrc;
        startMorph();
        modalImg.addEventListener("load", swapCloneToFullRes, { once: true });
        modalImg.addEventListener("error", swapCloneToFullRes, { once: true });
      }
    });

  const onOpenComplete = () => {
    modalContent.style.opacity = "1";
    closeBtn.style.opacity = "1";
    closeBtn.style.pointerEvents = "auto";
    modalImg.style.opacity = "1";
    if (morphClone) morphClone.style.display = "none";

    /* Clear the polaroid-frame-matching styles from the clone. It needs to
       be clean for the next open cycle. */
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
   * This is the reverse of the open animation. The clone starts at the
   * current modal image position and animates back to wherever the
   * thumbnail is on screen at this moment. We
   * use the same ease-out-quint curve and distance-aware duration as
   * the open so the motion feels the same in both directions.
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

      /* We prefer the element passed by the caller but fall back to the
         element stored during open (the .polaroid-frame wrapper when the
         source image lives inside one). This lets the clone retrace to
         the frame-sized rect on all screen sizes.
         freezeRectFromEl corrects for CSS rotation so the clone's
         dimensions match the card's visual footprint, not its axis-aligned
         bounding box. */
      let srcRect;
      const el = sourceEl || closeSourceEl;
      if (el) {
        srcRect = freezeRectFromEl(el);
      } else {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        srcRect = { left: cx, top: cy, width: 0, height: 0 };
      }

      /* Use the polaroid frame's bounding rect as the starting position for
         the close morph. The clone retraces from the framed image, not
         from the raw image bounds. */
      const closeFrame = modalPolaroidFrame || modalContent;
      const modalRect = closeFrame.getBoundingClientRect();

      ensureClone();
      morphCloneImg.src = sourceImgSrc || modalImg.src;
      morphCloneImg.alt = modalImg.alt || "";

      /* Style the clone to match the polaroid frame during the close
         animation. The visual stays consistent from the moment the modal
         content fades out.
         Padding and border-radius come from the live computed style so
         they match responsive media queries.
         When modalPolaroidFrame is null, skip the frame styling. */
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
        /* Use center origin. The rotation during the close tween pivots
           around the clone's visual center. */
        transformOrigin: "center center",
      });

      modalContent.style.opacity = "0";
      modalImg.style.opacity = "0";
      closeBtn.style.opacity = "0";
      closeBtn.style.pointerEvents = "none";

      /* Hide the real polaroid card behind the still-visible modal
         backdrop. The clone lands in its place and crossfades into it.
         The backdrop blur masks the disappearance at this stage and the
         crossfade at the end shows it without a snap. */
      if (sourceCardEl) {
        gsap.set(sourceCardEl, { opacity: 0 });
      }

      const tl = gsap.timeline({
        onComplete: onCloseComplete,
      });

      const morphDur = computeMorphDuration(modalRect, srcRect);

      tl.to(morphClone, {
        /* Subtract the card's CSS translate offset from left/top.
           freezeRectFromEl (via getBoundingClientRect) already includes it
           in the screen-space position. GSAP x/y adds it back as a
           transform, which matches the card's rotate()+translate() chain.
           The clone lands on the exact visual position. */
        left: srcRect.left - sourceTranslateX,
        top: srcRect.top - sourceTranslateY,
        width: srcRect.width,
        height: srcRect.height,
        rotation: sourceRotation,
        x: sourceTranslateX,
        y: sourceTranslateY,
        duration: morphDur,
        ease: EASE_OUT_QUINT,
      }, 0);

      tl.to(modal, {
        backgroundColor: "rgba(0, 0, 0, 0)",
        backdropFilter: "blur(0px)",
        webkitBackdropFilter: "blur(0px)",
        duration: OVERLAY_DUR,
        ease: EASE_OUT_QUINT,
      }, 0);

      /* Crossfade: the clone fades out while the real polaroid card fades
         in at the same time. Any sub-pixel positional mismatch between
         the two is blended away instead of snapping. The overlap starts
         80 ms before the position and rotation tween finishes. That gives
         a 150 ms crossfade window. Emil's rule: only animate transform
         and opacity, and keep them simple. */
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
      /* Clear the polaroid-frame-matching styles. The clone needs to be
         clean for the next cycle. */
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

    /* Restore the real polaroid card to full opacity. The crossfade tween
       may have been interrupted or never ran (for example, on the reduced
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
   * once on page load. This module references the modal's DOM nodes
   * without querying for them on every open or close.
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

