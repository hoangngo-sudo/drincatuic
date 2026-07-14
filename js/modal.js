import morph from './imageMorph.js';

const modal = document.getElementById("imageModal");
if (modal) {
  const modalImg = modal.querySelector(".modal-img");
  const modalPolaroidFrame = modal.querySelector(".modal-polaroid-frame");
  const modalContent = modal.querySelector(".modal-content");
  const closeBtn = modal.querySelector(".modal-close");
  const gridImages = document.querySelectorAll(
    ".image-grid img, .image-grid-span img, .polaroid-grid img"
  );

  /* Initialize the morph animation module. We pass the modal's DOM element
     references so it controls them without querying the DOM on every open
     or close. */
  morph.init({ modal, modalImg, modalPolaroidFrame, modalContent, closeBtn });

  /**
   * Open the modal with a directional morph animation.
   * The image expands from the clicked thumbnail's position
   * to the center of the viewport.
   */
  const openModal = async (imgSrc, imgAlt, sourceEl) => {
    /* Pause the ScrollSmoother before the morph starts. The scroll position
       stays fixed during the animation. */
    const smoother = typeof ScrollSmoother !== "undefined" && ScrollSmoother.get();
    if (smoother) smoother.paused(true);

    const src = imgSrc;
    modalImg.style.opacity = "0";

    /* The morph.open function also sets body.style.overflow to "hidden".
       This is an extra guard against native scroll during the animation. */
    await morph.open(src, imgAlt, sourceEl);
  };

  /**
   * Close the modal with a reverse morph animation:
   * the expanded image shrinks back into the original thumbnail.
   */
  const closeModal = async () => {
    /* The morph.close function already knows which thumbnail was clicked.
       It stores that reference during the open phase. We don't need to
       pass it again here. */
    await morph.close();

    /* Resume the ScrollSmoother after the reverse morph animation finishes. */

    const smoother = typeof ScrollSmoother !== "undefined" && ScrollSmoother.get();
    if (smoother) smoother.paused(false);

    document.body.style.overflow = "";

    /* Remove any wheel event prevention that was set during the modal open
       sequence. The morph module handles its own cleanup. */
    if (modal.preventScrollHandler) {
      modal.removeEventListener("wheel", modal.preventScrollHandler);
    }
  };

  /* Attach click handlers to all grid images. Clicking any thumbnail opens
     the modal with its full-resolution version. */
  gridImages.forEach((img) => {
    img.addEventListener("click", function () {
      if (morph.isAnimating) return;
      const fullSrc = this.getAttribute("data-src") || this.src;
      const sourceEl = this;
      openModal(fullSrc, this.alt, sourceEl);
    });
  });

  /* Close the modal when the close button is clicked. */

  if (closeBtn) {
    closeBtn.addEventListener("click", closeModal);
  }

  /* Pressing Escape closes the modal. It only works after the morph
     animation has finished. This prevents an accidental double-close
     while the transition is still playing. */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("show") && !morph.isAnimating) {
      closeModal();
    }
  });

}
