function theme() {
  let themeButtons = document.querySelectorAll(".theme-btn");
  let darkmode = localStorage.getItem("darkmode");

  const toggleThemeMode = (e) => {
    if (e) e.preventDefault();

    /* Force the social card hover styles back to their rest state using inline
       !important declarations. No CSS cascade can keep the hover visible
       during the theme repaint. */
    const bg = document.querySelector('.header-link .social-button--background');
    const label = document.querySelector('.header-link .social-button--label');
    const suppress = (el) => {
      if (!el) return;
      el.style.setProperty('transition', 'none', 'important');
      el.style.setProperty('opacity', '0', 'important');
    };
    const restore = (el) => {
      if (!el) return;
      el.style.removeProperty('transition');
      el.style.removeProperty('opacity');
    };

    suppress(bg);
    suppress(label);
    /* When the label was suppressed, also reset its transform and color
       properties. This clears any hover state. */
    if (label) {
      label.style.setProperty('transform', 'translateY(4px)', 'important');
      label.style.setProperty('color', '', 'important');
    }

    /* Restore the suppressed social button styles after a brief timeout.
       The theme repaint finishes without visible flicker. */
    setTimeout(() => {
      restore(bg);
      restore(label);
      if (label) {
        label.style.removeProperty('transform');
        label.style.removeProperty('color');
      }
    }, 200);

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

  /* Only apply dark mode on page load when the user has previously opted
     into it. Don't apply it on the first visit. */
  if (darkmode === "active") {
    enableDarkMode();
  } else {
    disableDarkMode();
  }

  /* Attach a click event listener to each theme toggle button. Users
     switch between dark and light mode by clicking it. */
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
  /* Exit early if the form element is not present. This function only
     applies to the registration page. */
  if (!form) return;
  const submitBtn = document.querySelector(".btn");
  const successMessage = document.querySelector("#successMessage");
  const successText = document.querySelector("#successText");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone");
  const acknowledgeCheckbox = document.getElementById("acknowledge");
  const willPayRadio = document.getElementById("will-pay");
  const alreadyPaidRadio = document.getElementById("already-paid");

  /* Display a personalized success message with the registrant's name.
     Scroll it into view. */
  const showSuccessMessage = (name) => {
    if (successMessage && successText) {
      successText.textContent = `Thank you ${name}, you have been registered.`;
      successMessage.classList.add("active");
      successMessage.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  /* Remove the success message from view. Clear its active class. */
  const hideSuccessMessage = () => {
    if (successMessage) {
      successMessage.classList.remove("active");
    }
  };

  /* Toggle the submit button between its normal and loading states.
     Update the text and disabled attribute. */
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

  /* Clear error styling for a specific field type: payment radio labels,
     acknowledgement label, or text input error messages. */
  const resetErrorStyling = (type) => {
    if (type === "payment") {
      const willPayLabel = document.querySelector('label[for="will-pay"]');
      const alreadyPaidLabel = document.querySelector(
        'label[for="already-paid"]'
      );
      const paymentElements = Array.from(
        document.querySelectorAll(".question-div")
      ).find((element) => element.textContent.includes("Payment"));

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

  /* Clear payment error styling when the user interacts with the payment
     radio buttons. */
  if (willPayRadio) {
    willPayRadio.addEventListener("change", () => resetErrorStyling("payment"));
  }

  if (alreadyPaidRadio) {
    alreadyPaidRadio.addEventListener("change", () =>
      resetErrorStyling("payment")
    );
  }

  /* Clear the acknowledgement error styling when the user checks the
     checkbox. */
  if (acknowledgeCheckbox) {
    acknowledgeCheckbox.addEventListener("change", function () {
      if (this.checked) {
        resetErrorStyling("acknowledge");
      }
    });
  }

  /* Validate all form fields. Return true only when every field passes its
     validation check. */
  const validateForm = () => {
    let containsErrors = false;

    const paymentElements = Array.from(
      document.querySelectorAll(".question-div")
    ).find((element) => element.textContent.includes("Payment"));

    /* Collect all form field values into a person object. We use it for
       validation. */
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

    /* Clear any previous error styling before running the validation
       checks. */
    resetErrorStyling("inputs");
    resetErrorStyling("acknowledge");
    resetErrorStyling("payment");

    /* Validate that the name field is filled in and has at least two
       characters. */
    if (!person.name || person.name.trim().length < 2) {
      if (nameInput) {
        const errorMsg = document.createElement("span");
        errorMsg.className = "error-message";
        errorMsg.textContent = "Name must be at least 2 characters.";
        nameInput.parentElement.appendChild(errorMsg);
      }
      containsErrors = true;
    }

    /* Validate that the email field matches the required format with a .com
       or .edu domain. */
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

    /* Validate that the phone number field has at least ten characters. */

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

    /* Validate that the acknowledgement checkbox is checked. */
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

    /* Validate that the user has selected a payment option. Either will pay
       now or already paid. */
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

    return !containsErrors;
  };

  /* Submit the registration data to the Supabase backend. Only runs after
     validation passes. */
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

    /* Map the short checkbox values to full descriptive sentences for
       storage in the database. */
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

    /* Collect all checked service checkboxes and map their values to full
       descriptive sentences for the registration record. */
    const checkboxes = document.querySelectorAll('input[type="checkbox"][id]:checked');
    checkboxes.forEach((checkbox) => {
      if (checkbox.id !== "acknowledge") {
        // Map checkbox value to full sentence
        if (serviceTextMap[checkbox.value]) {
          register.services.push(serviceTextMap[checkbox.value]);
        }
      }
    });

    /* Include the custom "Other" service text if the user filled in that
       field. */
    const otherServiceInput = document.getElementById("other-service");
    if (otherServiceInput && otherServiceInput.value.trim()) {
      register.services.push(`Other: ${otherServiceInput.value.trim()}`);
    }

    /* Insert the registration record into the Supabase registrations table. */

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

  /* Reset all form fields to their default empty or unchecked state after
     a successful registration. */
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

  /* Attach a click handler to the submit button. It validates the form and
     submits the registration data. */
  if (submitBtn) {
    submitBtn.addEventListener("click", function (event) {
      /* Prevent the default form submission behavior. We handle it
         asynchronously with the Supabase client. */
      event.preventDefault();

      if (validateForm()) {
        addRegister();
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", form);

// --------------------------------------------------//

function handleSidebar() {
  /* Cache references to the hamburger toggle, sidebar panel, backdrop
     overlay, and sidebar links for reuse in event handlers. */
  const hamburger = document.querySelector(".hamburger");
  const menuSidebar = document.querySelector(".menu-sidebar");
  const overlay = document.querySelector(".overlay");
  const sidebarLinks = document.querySelectorAll(".sidebar-link");

  /* Slide the sidebar into view. Make the backdrop overlay visible. */

  const openSidebar = () => {
    menuSidebar.classList.add("active");
    overlay.classList.add("active");
    overlay.style.visibility = "visible";
    hamburger.style.zIndex = "999";
  };

  /* Slide the sidebar out of view. Hide the backdrop overlay. Restore
     the hamburger's original z-index. */
  const closeSidebar = () => {
    menuSidebar.classList.remove("active");
    overlay.classList.remove("active");
    overlay.style.visibility = "hidden";
    hamburger.style.zIndex = "";
  };

  /* Toggle the sidebar open or closed when the hamburger icon is clicked. */

  if (hamburger) {
    hamburger.addEventListener("click", () => {
      if (menuSidebar.classList.contains("active")) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });
  }

  /* Close the sidebar when the user clicks on the dark backdrop overlay
     outside the sidebar panel. */
  if (overlay) {
    overlay.addEventListener("click", closeSidebar);
  }

  if (sidebarLinks.length > 0) {
    sidebarLinks.forEach((link) => {
      /* Skip the theme toggle button. The sidebar stays open when
         switching themes. */
      if (link.classList.contains("theme-btn")) return;
      link.addEventListener("click", closeSidebar);
    });
  }
}

document.addEventListener("DOMContentLoaded", handleSidebar);