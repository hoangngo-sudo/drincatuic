function theme() {
  let themeButtons = document.querySelectorAll(".theme-btn");
  let darkmode = localStorage.getItem("darkmode");

  const toggleThemeMode = () => {
    const currDarkmode = localStorage.getItem("darkmode");
    if (currDarkmode !== "active") {
      enableDarkMode();
    } else {
      disableDarkMode();
    }
  };

  const enableDarkMode = () => {
    document.body.classList.add("dark-mode");
    localStorage.setItem("darkmode", "active");
  };

  const disableDarkMode = () => {
    document.body.classList.remove("dark-mode");
    localStorage.setItem("darkmode", "null");
  };

  // Change this condition to NOT apply dark mode on first load
  if (darkmode === "active") {
    enableDarkMode();
  } else {
    disableDarkMode();
  }

  // Add click event listener to all theme buttons
  if (themeButtons.length > 0) {
    themeButtons.forEach((button) => {
      button.addEventListener("click", toggleThemeMode);
    });
  }
}
document.addEventListener("DOMContentLoaded", theme);

// --------------------------------------------------//

function form() {
  const form = document.querySelector(".form");
  const submitBtn = document.querySelector(".btn");
  const modal = document.querySelector(".modal");
  const modalClose = document.querySelector(".modal-close");
  const modalMessage = document.querySelector(".modal-message");
  let modalTimeout;

  // Create a container for displaying registrations
  const registrationList = document.createElement("div");
  registrationList.className = "registration-list";

  // Add the registration list to the page
  if (form) {
    form.appendChild(registrationList);
  }

  // Function to show modal with customized message
  const showModal = (name) => {
    if (modal) {
      // Set personalized message
      if (modalMessage) {
        modalMessage.textContent = `Thank you, ${name}! Your registration has been received.`;
      }

      // Show the modal
      modal.classList.add("active");

      // Set timeout to automatically close modal after 10 seconds
      modalTimeout = setTimeout(() => {
        closeModal();
      }, 10000);
    }
  };

  // Function to close the modal
  const closeModal = () => {
    if (modal) {
      const modalContainer = modal.querySelector(".modal-container");
      if (modalContainer) {
        modalContainer.classList.remove("active");
      }

      // Delay removing the modal's active class to allow for container animation
      setTimeout(() => {
        modal.classList.remove("active");
      }, 300);

      // Clear any existing timeout
      if (modalTimeout) {
        clearTimeout(modalTimeout);
      }
    }
  };

  // Add event listener to the modal close button
  if (modalClose) {
    modalClose.addEventListener("click", closeModal);
  }

  // Function to reset error styling
  const resetErrorStyling = (type) => {
    if (type === "payment") {
      const willPayLabel = document.querySelector('label[for="will-pay"]');
      const alreadyPaidLabel = document.querySelector(
        'label[for="already-paid"]'
      );
      const paymentElements = Array.from(
        document.querySelectorAll(".question-div")
      ).find((element) => element.textContent.includes("Payment"));

      // Reset the label colors
      if (willPayLabel) {
        willPayLabel.style.color = "";
      }
      if (alreadyPaidLabel) {
        alreadyPaidLabel.style.color = "";
      }
    } else if (type === "acknowledge") {
      const acknowledgeLabel = document.querySelector(
        'label[for="acknowledge"]'
      );

      // Reset the label color
      if (acknowledgeLabel) {
        acknowledgeLabel.style.color = "";
      }
    } else if (type === "inputs") {
      const nameInput = document.getElementById("name");
      const emailInput = document.getElementById("email");
      const phoneInput = document.getElementById("phone");

      const inputs = [nameInput, emailInput, phoneInput];
      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        if (input) {
          const existingError =
            input.parentElement.querySelector(".error-message");
          if (existingError) {
            existingError.remove();
          }
        }
      }
    }
  };

  // Add event listeners to payment radio buttons
  const willPayRadio = document.getElementById("will-pay");
  const alreadyPaidRadio = document.getElementById("already-paid");

  if (willPayRadio) {
    willPayRadio.addEventListener("change", () => resetErrorStyling("payment"));
  }

  if (alreadyPaidRadio) {
    alreadyPaidRadio.addEventListener("change", () =>
      resetErrorStyling("payment")
    );
  }

  // Add event listener to acknowledgement checkbox
  const acknowledgeCheckbox = document.getElementById("acknowledge");
  if (acknowledgeCheckbox) {
    acknowledgeCheckbox.addEventListener("change", function () {
      if (this.checked) {
        resetErrorStyling("acknowledge");
      }
    });
  }

  // Form validation
  const validateForm = () => {
    let containsErrors = false;

    // Get the form inputs
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const phoneInput = document.getElementById("phone");
    const acknowledgeCheckbox = document.getElementById("acknowledge");
    const willPayRadio = document.getElementById("will-pay");
    const alreadyPaidRadio = document.getElementById("already-paid");
    const payment = document.querySelector(".question-div");
    const paymentElements = Array.from(
      document.querySelectorAll(".question-div")
    ).find((element) => element.textContent.includes("Payment"));

    // Create a person object to store the values
    let person = {
      name: "",
      email: "",
      phone: "",
      acknowledged: false,
      paymentSelected: false,
    };

    if (nameInput) {
      person.name = nameInput.value;
    }

    if (emailInput) {
      person.email = emailInput.value;
    }

    if (phoneInput) {
      person.phone = phoneInput.value;
    }

    if (acknowledgeCheckbox) {
      person.acknowledged = acknowledgeCheckbox.checked;
    }

    if (willPayRadio && willPayRadio.checked) {
      person.paymentSelected = true;
    }

    if (alreadyPaidRadio && alreadyPaidRadio.checked) {
      person.paymentSelected = true;
    }

    // Reset previous error styling
    resetErrorStyling("inputs");
    resetErrorStyling("acknowledge");
    resetErrorStyling("payment");

    // Validate name (required and min length 2)
    if (!person.name || person.name.trim().length < 2) {
      if (nameInput) {
        const errorMsg = document.createElement("span");
        errorMsg.className = "error-message";
        errorMsg.textContent = "Name must be at least 2 characters.";
        nameInput.parentElement.appendChild(errorMsg);
      }
      containsErrors = true;
    }

    // Validate email (required and valid format)
    const emailRegex = /^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.(com|edu)$/;
    if (!person.email || !emailRegex.test(person.email)) {
      if (emailInput) {
        // Add error message for email
        const errorMsg = document.createElement("span");
        errorMsg.className = "error-message";
        errorMsg.textContent =
          "Please use a valid email address with .com or .edu after @.";
        emailInput.parentElement.appendChild(errorMsg);
      }
      containsErrors = true;
    }

    // Validate phone (required and minimum length)
    if (!person.phone || person.phone.trim().length < 10) {
      if (phoneInput) {
        // Add error message for phone
        const errorMsg = document.createElement("span");
        errorMsg.className = "error-message";
        errorMsg.textContent = "Please enter a valid phone number.";
        phoneInput.parentElement.appendChild(errorMsg);
      }
      containsErrors = true;
    }

    // Validate acknowledge checkbox
    if (!person.acknowledged) {
      containsErrors = true;
      // Highlight the checkbox label
      const acknowledgeLabel = document.querySelector(
        'label[for="acknowledge"]'
      );
      if (acknowledgeLabel) {
        acknowledgeLabel.style.color = "red";
      }
    }

    if (!person.paymentSelected) {
      containsErrors = true;
      const willPayLabel = document.querySelector('label[for="will-pay"]');
      const alreadyPaidLabel = document.querySelector(
        'label[for="already-paid"]'
      );

      if (willPayLabel) {
        willPayLabel.style.color = "red";
      }

      if (alreadyPaidLabel) {
        alreadyPaidLabel.style.color = "red";
      }

      // Add error message for payment
      if (paymentElements) {
        const errorMsg = document.createElement("span");
        errorMsg.className = "error-message";
        paymentElements.appendChild(errorMsg);
      }
    }

    if (containsErrors) {
      return false;
    } else {
      return true;
    }
  };

  // Function to add register to the list
  const addRegister = () => {
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const phoneInput = document.getElementById("phone");

    if (!nameInput || !emailInput || !phoneInput) return;

    // Create a register object
    let register = {
      name: nameInput.value,
      email: emailInput.value,
      phone: phoneInput.value,
      services: [],
    };

    // Get selected services
    const checkboxes = document.querySelectorAll(
      'input[type="checkbox"]:checked'
    );
    checkboxes.forEach((checkbox) => {
      if (checkbox.id !== "acknowledge") {
        const label = document.querySelector(`label[for="${checkbox.id}"]`);
        if (label) {
          register.services.push(label.textContent);
        }
      }
    });

    // Get other service if provided
    const otherService = document.getElementById("other-service");
    if (otherService && otherService.value.trim()) {
      register.services.push(otherService.value);
    }

    // Create a new entry
    const entry = document.createElement("div");
    entry.className = "registration-entry";
    entry.innerHTML = `
      <div class="entry-header">
        <div class="tick">✅</div>
        <p><strong>${register.name}</strong> has joined the team!<br>
        Email: ${register.email}<br>
        Phone: ${register.phone}<br>
        ${
          register.services.length > 0
            ? `<i>Services: ${register.services.join(", ")}</i>`
            : ""
        }</p>
      </div>
    `;

    registrationList.appendChild(entry);

    // Show the modal with the person's name
    showModal(register.name);
  };

  // Clear form fields
  const clearForm = () => {
    const inputs = document.querySelectorAll('input:not([type="submit"])');
    inputs.forEach((input) => {
      if (input.type === "checkbox" || input.type === "radio") {
        input.checked = false;
      } else {
        input.value = "";
      }
    });

    const acknowledgeLabel = document.querySelector('label[for="acknowledge"]');
    if (acknowledgeLabel) {
      acknowledgeLabel.style.color = "";
    }
  };

  // Add event listener to the submit button
  if (submitBtn) {
    submitBtn.addEventListener("click", function (event) {
      event.preventDefault(); // Prevent form submission

      if (validateForm()) {
        addRegister();
        clearForm();
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", form);

// --------------------------------------------------//

function handleSidebar() {
  // Get the elements we need to work with
  const hamburger = document.querySelector(".hamburger");
  const menuSidebar = document.querySelector(".menu-sidebar");
  const overlay = document.querySelector(".overlay");
  const sidebarLinks = document.querySelectorAll(".sidebar-link");

  // Function to open the sidebar
  const openSidebar = () => {
    menuSidebar.classList.add("active");
    overlay.classList.add("active");
    overlay.style.visibility = "visible";
  };

  // Function to close the sidebar
  const closeSidebar = () => {
    menuSidebar.classList.remove("active");
    overlay.classList.remove("active");
    overlay.style.visibility = "hidden";
  };

  // Add click event to hamburger icon
  if (hamburger) {
    hamburger.addEventListener("click", () => {
      if (menuSidebar.classList.contains("active")) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });
  }

  // Close sidebar when clicking on the overlay
  if (overlay) {
    overlay.addEventListener("click", closeSidebar);
  }

  if (sidebarLinks.length > 0) {
    sidebarLinks.forEach((link) => {
      link.addEventListener("click", closeSidebar);
    });
  }
}

document.addEventListener("DOMContentLoaded", handleSidebar);

// --------------------------------------------------//
