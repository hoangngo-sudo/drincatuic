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
  const successMessage = document.querySelector("#successMessage");
  const successText = document.querySelector("#successText");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone");
  const acknowledgeCheckbox = document.getElementById("acknowledge");
  const willPayRadio = document.getElementById("will-pay");
  const alreadyPaidRadio = document.getElementById("already-paid");

  // Function to show success message with customized text
  const showSuccessMessage = (name) => {
    if (successMessage && successText) {
      // Set personalized message
      successText.textContent = `Thank you ${name}, you have been registered.`;

      // Show the success message
      successMessage.classList.add("active");

      // Scroll to the success message
      successMessage.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  // Function to hide success message
  const hideSuccessMessage = () => {
    if (successMessage) {
      successMessage.classList.remove("active");
    }
  };

  // Function to set button loading state
  const setButtonLoading = (isLoading) => {
    if (submitBtn) {
      if (isLoading) {
        submitBtn.classList.add("loading");
        submitBtn.value = "Registering...";
        submitBtn.disabled = true;
      } else {
        submitBtn.classList.remove("loading");
        submitBtn.value = "SUBMIT RSVP";
        submitBtn.disabled = false;
      }
    }
  };

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
  if (willPayRadio) {
    willPayRadio.addEventListener("change", () => resetErrorStyling("payment"));
  }

  if (alreadyPaidRadio) {
    alreadyPaidRadio.addEventListener("change", () =>
      resetErrorStyling("payment")
    );
  }

  // Add event listener to acknowledgement checkbox
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
  const addRegister = async () => {
    if (!nameInput || !emailInput || !phoneInput) return;

    // Set button to loading state
    setButtonLoading(true);

    const client = window.supabaseClient;
    if (!client) {
      setButtonLoading(false);
      alert("Registration is temporarily unavailable. Please try again later.");
      return;
    }

    // Map checkbox values to full descriptive sentences
    const serviceTextMap = {
      'praise': 'I want to participate in praise and worship',
      'bible': 'I want to facilitate group bible study',
      'prayer': 'I want to join the prayer team',
      'outdoor': 'I want to lead an outdoor activity'
    };

    let register = {
      name: nameInput.value,
      email: emailInput.value,
      phone: phoneInput.value,
      services: [],
      acknowledged: acknowledgeCheckbox ? acknowledgeCheckbox.checked : false,
      payment_status: willPayRadio && willPayRadio.checked ? "will-pay" : "already-paid",
    };

    // Collect service selections as full sentences
    const checkboxes = document.querySelectorAll('input[type="checkbox"][id]:checked');
    checkboxes.forEach((checkbox) => {
      if (checkbox.id !== "acknowledge") {
        // Map checkbox value to full sentence
        if (serviceTextMap[checkbox.value]) {
          register.services.push(serviceTextMap[checkbox.value]);
        }
      }
    });

    // Add custom "Other" service if provided
    const otherServiceInput = document.getElementById("other-service");
    if (otherServiceInput && otherServiceInput.value.trim()) {
      register.services.push(`Other: ${otherServiceInput.value.trim()}`);
    }

    // Insert into Supabase
    const { data, error } = await client
      .from("registrations")
      .insert([register]);

    if (error) {
      console.error("Error:", error);
      console.error("Error details:", error.message);
      setButtonLoading(false);
      alert("Registration failed. Please try again.");
    } else {
      showSuccessMessage(register.name);
      clearForm();
      setButtonLoading(false);
    }
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