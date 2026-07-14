function expandable() {
  const expandTriggers = document.querySelectorAll(".expand-trigger");
  expandTriggers.forEach((trigger) => {
    trigger.addEventListener("click", function () {
      /* Toggle the active class on the parent list item. This expands or
         collapses the content panel. */
      const parentItem = this.parentElement;
      parentItem.classList.toggle("active");
    });
  });
}

document.addEventListener("DOMContentLoaded", expandable);
