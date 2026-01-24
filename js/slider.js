function Slider() {
  const carousel = document.querySelector(".slides");
  const items = document.querySelectorAll(".slide");
  const dotsContainer = document.querySelector(".dots");
  const prevButton = document.querySelector(".prev-btn");
  const nextButton = document.querySelector(".next-btn");

  if (!carousel || items.length === 0 || !dotsContainer) return;

  let currentIndex = 0;

  // Insert dots into the DOM
  items.forEach((_, index) => {
    let dot = document.createElement("span");
    dot.classList.add("dot");
    if (index === 0) dot.classList.add("active");
    dot.dataset.index = index;
    dotsContainer.appendChild(dot);
  });

  let dots = document.querySelectorAll(".dot");

  // Set first item as active initially
  items[0].classList.add("active");

  // Function to show a specific item
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

  // Previous button click handler
  if (prevButton) {
    prevButton.addEventListener("click", () => {
      let index = [...items].findIndex((item) =>
        item.classList.contains("active")
      );
      showItem((index - 1 + items.length) % items.length);
    });
  }

  // Next button click handler
  if (nextButton) {
    nextButton.addEventListener("click", () => {
      let index = [...items].findIndex((item) =>
        item.classList.contains("active")
      );
      showItem((index + 1) % items.length);
    });
  }

  // Event listeners for dots
  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      let index = parseInt(dot.dataset.index);
      showItem(index);
    });
  });
}

document.addEventListener("DOMContentLoaded", Slider);