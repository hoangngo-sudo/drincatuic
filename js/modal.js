const modal = document.getElementById("imageModal");
if (modal) {
  const modalImg = modal.querySelector(".modal-img");
  const closeBtn = modal.querySelector(".modal-close");
  const gridImages = document.querySelectorAll(
    ".image-grid img, .image-grid-span img, .polaroid-grid img"
  );

  // Function to open modal with specific image
  const openModal = (imgSrc, imgAlt) => {
    modalImg.src = imgSrc;
    modalImg.alt = imgAlt || "Image";
    modalImg.onload = () => {
      modal.classList.add("show");
    };
    document.body.style.overflow = "hidden";
    const smoother = typeof ScrollSmoother !== "undefined" && ScrollSmoother.get();
    if (smoother) smoother.paused(true);

    const preventScroll = (e) => {
      e.preventDefault();
    };
    modal.addEventListener("wheel", preventScroll, { passive: false });
    // Store the function reference on the modal element for later removal
    modal.preventScrollHandler = preventScroll;
    
  };

  // Function to close modal
  const closeModal = () => {
    modal.classList.remove("show");
    setTimeout(() => {
      modalImg.src = "";
    }, 300);
    document.body.style.overflow = "";
    const smoother = typeof ScrollSmoother !== "undefined" && ScrollSmoother.get();
    if (smoother) smoother.paused(false);

    // Remove wheel event prevention
    if (modal.preventScrollHandler) {
      modal.removeEventListener("wheel", modal.preventScrollHandler);
    }
  };

  // Set up click handlers for grid images
  gridImages.forEach((img) => {
    img.addEventListener("click", function () {
      const fullSrc = this.getAttribute("data-src") || this.src;
      openModal(fullSrc, this.alt);
    });
  });

  // Close modal when clicking the close button
  if (closeBtn) {
    closeBtn.addEventListener("click", closeModal);
  }

  // Close modal with Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("show")) {
      closeModal();
    }
  });

}
