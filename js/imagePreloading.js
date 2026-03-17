// Reference: https://stackoverflow.com/questions/10240110/how-do-you-cache-an-image-in-javascript

// Define the preloadImages function
function preloadImages(array, waitForOtherResources, timeout) {
  var loaded = false,
    list = preloadImages.list || [],
    imgs = array.slice(0),
    t = timeout || 15 * 1000,
    timer;

  if (!preloadImages.list) {
    preloadImages.list = [];
  }

  if (!waitForOtherResources || document.readyState === "complete") {
    loadNow();
  } else {
    window.addEventListener("load", function () {
      clearTimeout(timer);
      loadNow();
    });
    // In case window.addEventListener doesn't get called (sometimes some resource gets stuck)
    // then preload the images anyway after timeout
    timer = setTimeout(loadNow, t);
  }

  function loadNow() {
    if (!loaded) {
      loaded = true;
      for (var i = 0; i < imgs.length; i++) {
        var img = new Image();
        img.onload =
          img.onerror =
          img.onabort =
            function () {
              var index = list.indexOf(this);
              if (index !== -1) {
                // Remove image from the array once it's loaded
                // for memory consumption reasons
                list.splice(index, 1);
              }
            };
        list.push(img);
        img.src = imgs[i];
      }
    }
  }
}

// Preload high-resolution images for gallery
function preloadGalleryImages() {
  // First, preload the visible images (initial view)
  const gridImages = document.querySelectorAll(
    ".image-grid img, .image-grid-span img, .polaroid-grid img"
  );
  const priorityImages = [];
  const secondaryImages = [];
  const lazyImages = [];

  gridImages.forEach((img, index) => {
    const fullSrc = img.getAttribute("data-src");
    if (fullSrc) {
      if (index < 6) {
        // First 6 images are priority
        priorityImages.push(fullSrc);
      } else if (index < 12) {
        // Next 6 are secondary
        secondaryImages.push(fullSrc);
      } else {
        // Rest are lazy loaded
        lazyImages.push(fullSrc);
      }
    }
  });

  // Preload priority images immediately
  if (priorityImages.length > 0) {
    preloadImages(priorityImages, false);
  }

  // Preload secondary images after a small delay
  if (secondaryImages.length > 0) {
    setTimeout(() => {
      preloadImages(secondaryImages, false);
    }, 2000);
  }

  // Preload remaining images after user has had time to interact
  if (lazyImages.length > 0) {
    setTimeout(() => {
      preloadImages(lazyImages, true);
    }, 5000);
  }
}

// Preload slider images
function preloadSliderImages() {
  const sliderImages = document.querySelectorAll(".slider .slide");
  const sliderSrcs = Array.from(sliderImages).map((img) => img.src);

  if (sliderSrcs.length > 0) {
    preloadImages(sliderSrcs, true);
  }
}

// Initialize preloading
setTimeout(preloadGalleryImages, 500); // Short delay to prioritize critical resources
setTimeout(preloadSliderImages, 2000); // Delay slider preload

document.addEventListener("DOMContentLoaded", () => {
  preloadGalleryImages();

  // Add lazy load functionality to images that come into view
  const lazyImageOptions = {
    root: null,
    rootMargin: "200px",
    threshold: 0.1,
  };

  const lazyImageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const fullSrc = img.getAttribute("data-src");

        if (fullSrc) {
          // Preload the full resolution image
          preloadImages([fullSrc], false);
        }

        lazyImageObserver.unobserve(img);
      }
    });
  }, lazyImageOptions);

  // Observe all grid images for lazy loading their full-res versions
  const gridImages = document.querySelectorAll(
    ".image-grid img, .image-grid-span img, .polaroid-grid img"
  );
  gridImages.forEach((img) => {
    if (img.getAttribute("loading") === "lazy") {
      lazyImageObserver.observe(img);
    }
  });
});