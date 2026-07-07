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

  /* Initialize the morph animation module by passing the modal's DOM element references so it can control them without querying the DOM on every open or close. */
  morph.init({ modal, modalImg, modalPolaroidFrame, modalContent, closeBtn });

  /**
   * Open the modal with a directional morph animation.
   * The image expands from the clicked thumbnail's position
   * to the center of the viewport.
   */
  const openModal = async (imgSrc, imgAlt, sourceEl) => {
    /* Pause the ScrollSmoother before the morph starts so the scroll position remains fixed during the animation. */
    const smoother = typeof ScrollSmoother !== "undefined" && ScrollSmoother.get();
    if (smoother) smoother.paused(true);

    const src = imgSrc;
    modalImg.style.opacity = "0";

    /* The morph.open function also sets body.style.overflow to "hidden" as an additional guard against native scroll during the animation. */
    await morph.open(src, imgAlt, sourceEl);
  };

  /**
   * Close the modal with a reverse morph animation:
   * the expanded image shrinks back into the original thumbnail.
   */
  const closeModal = async () => {
    /* The morph.close function already knows which thumbnail element was clicked because it stores that reference during the open phase, so we do not need to pass it again here. */
    await morph.close();

    /* Resume the ScrollSmoother after the reverse morph animation has finished. */
    const smoother = typeof ScrollSmoother !== "undefined" && ScrollSmoother.get();
    if (smoother) smoother.paused(false);

    document.body.style.overflow = "";

    /* Remove any wheel event prevention that was set during the modal open sequence, as the morph module handles its own cleanup. */
    if (modal.preventScrollHandler) {
      modal.removeEventListener("wheel", modal.preventScrollHandler);
    }
  };

  /* Attach click handlers to all grid images so that clicking any thumbnail opens the modal with its full-resolution version. */
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

  /* Close the modal when the Escape key is pressed while the modal is visible. */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("show")) {
      closeModal();
    }
  });

  /* Close the modal when clicking on the dark backdrop area outside the image content. */
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

}
