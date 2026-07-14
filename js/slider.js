function Slider() {
  const carousel = document.querySelector(".slides");
  const items = document.querySelectorAll(".slide");
  const dotsContainer = document.querySelector(".dots");
  const prevButton = document.querySelector(".prev-btn");
  const nextButton = document.querySelector(".next-btn");

  if (!carousel || items.length === 0 || !dotsContainer) return;

  let currentIndex = 0;

  /* Create and insert a dot indicator for each slide into the dots
     container. */
  items.forEach((_, index) => {
    let dot = document.createElement("span");
    dot.classList.add("dot");
    if (index === 0) dot.classList.add("active");
    dot.dataset.index = index;
    dotsContainer.appendChild(dot);
  });

  let dots = document.querySelectorAll(".dot");

  /* Set the first slide item as active by default on page load. */

  items[0].classList.add("active");

  /* Show the slide at the given index and update the dot indicators. */

  function showItem(index) {
    items.forEach((item, idx) => {
      item.classList.remove("active");
      dots[idx].classList.remove("active");
      if (idx === index) {
        item.classList.add("active");
        dots[idx].classList.add("active");
      }
    });
    currentIndex = index;
  }

  /* Navigate to the previous slide when the previous button is clicked. */

  if (prevButton) {
    prevButton.addEventListener("click", () => {
      let index = [...items].findIndex((item) =>
        item.classList.contains("active")
      );
      showItem((index - 1 + items.length) % items.length);
    });
  }

  /* Navigate to the next slide when the next button is clicked. */

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      let index = [...items].findIndex((item) =>
        item.classList.contains("active")
      );
      showItem((index + 1) % items.length);
    });
  }

  /* Jump to the slide when a dot indicator is clicked. */
  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      let index = parseInt(dot.dataset.index);
      showItem(index);
    });
  });
}

document.addEventListener("DOMContentLoaded", Slider);