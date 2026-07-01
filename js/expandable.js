function expandable() {
  const expandTriggers = document.querySelectorAll(".expand-trigger");
  expandTriggers.forEach((trigger) => {
    trigger.addEventListener("click", function () {
      // Get the parent element
      const parentItem = this.parentElement;
      parentItem.classList.toggle("active");
    });
  });
}

document.addEventListener("DOMContentLoaded", expandable);
