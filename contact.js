/* =====================================================================
   CONTACT.JS — presentational only
   1) Contact form: prevent default submit, run lightweight validation,
      show an inline success (or error) message. No network request.
   2) FAQ accordion: accessible expand/collapse with aria-expanded.
   Guarded so it is safe if markup is absent.
   ===================================================================== */
(function () {
  "use strict";

  /* ---------- 1. Contact form feedback ---------- */
  var form = document.querySelector(".contact-form");
  var status = document.getElementById("contact-form-status");

  if (form && status) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();

      // Lightweight, presentational validation feedback.
      var valid =
        typeof form.checkValidity === "function" ? form.checkValidity() : true;

      if (!valid) {
        status.textContent = "";
        var errIcon = document.createElement("i");
        errIcon.className =
          "fa-solid fa-circle-exclamation contact-status-icon";
        errIcon.setAttribute("aria-hidden", "true");
        status.appendChild(errIcon);
        status.appendChild(
          document.createTextNode(
            "Please complete the required fields and try again."
          )
        );
        status.classList.remove("is-success");
        status.classList.add("is-error");

        // Focus the first invalid control for accessibility.
        var firstInvalid = form.querySelector(":invalid");
        if (firstInvalid) {
          firstInvalid.focus();
        }
        return;
      }

      // Success: clear the form and show a confirmation message.
      var name = "";
      var nameField = form.querySelector("#cf-name");
      if (nameField && nameField.value) {
        name = nameField.value.trim().split(" ")[0];
      }

      form.reset();

      status.textContent = "";
      var okIcon = document.createElement("i");
      okIcon.className = "fa-solid fa-circle-check contact-status-icon";
      okIcon.setAttribute("aria-hidden", "true");
      status.appendChild(okIcon);
      status.appendChild(
        document.createTextNode(
          (name ? "Thanks, " + name + "! " : "Thank you! ") +
            "Your message has been sent — we'll reply within one business day."
        )
      );
      status.classList.remove("is-error");
      status.classList.add("is-success");
    });
  }

  /* ---------- 2. FAQ accordion ---------- */
  var triggers = document.querySelectorAll(".contact-acc-trigger");

  triggers.forEach(function (trigger) {
    trigger.addEventListener("click", function () {
      var panelId = trigger.getAttribute("aria-controls");
      var panel = panelId ? document.getElementById(panelId) : null;
      var item = trigger.closest(".contact-acc-item");
      var isOpen = trigger.getAttribute("aria-expanded") === "true";

      // Toggle current item (independent — multiple may stay open).
      trigger.setAttribute("aria-expanded", String(!isOpen));
      if (panel) {
        panel.hidden = isOpen;
      }
      if (item) {
        item.classList.toggle("is-open", !isOpen);
      }
    });
  });
})();