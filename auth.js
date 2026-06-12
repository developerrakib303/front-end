/* =====================================================================
   AUTH.JS — Login & Registration interactivity (presentational only)
   Loaded AFTER script.js. Scoped to the .auth markup and guarded, so it
   is safe to include site-wide.
   Responsibilities:
     1. Toggle Sign In / Register (segmented control + tablist,
        aria-selected, roving keyboard: arrows / Home / End).
     2. Password show/hide toggles.
     3. Presentational required-field validation on submit, with per-field
        error messages and a form-level success/error banner.
   ===================================================================== */
(function () {
  "use strict";

  var root = document.querySelector(".auth-shell");
  if (!root) return;

  var segment = root.querySelector(".auth-segment");
  var tabs = Array.prototype.slice.call(root.querySelectorAll(".auth-seg-btn"));
  var forms = Array.prototype.slice.call(root.querySelectorAll(".auth-form"));

  /* ---------- PANEL SWITCHING (Sign In <-> Register) ---------- */
  function activate(name, focusTab) {
    if (segment) segment.setAttribute("data-active", name);

    tabs.forEach(function (tab) {
      var selected = tab.getAttribute("data-auth-tab") === name;
      tab.setAttribute("aria-selected", selected ? "true" : "false");
      tab.setAttribute("tabindex", selected ? "0" : "-1");
      if (selected && focusTab) tab.focus();
    });

    forms.forEach(function (form) {
      var match = form.getAttribute("data-auth-panel") === name;
      form.hidden = !match;
    });

    // Clear lingering validation state when switching views.
    forms.forEach(clearForm);
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener("click", function () {
      activate(tab.getAttribute("data-auth-tab"), false);
    });

    // Roving keyboard navigation between the two tabs.
    tab.addEventListener("keydown", function (event) {
      var key = event.key;
      var next = null;
      if (key === "ArrowRight" || key === "ArrowDown") {
        next = tabs[(index + 1) % tabs.length];
      } else if (key === "ArrowLeft" || key === "ArrowUp") {
        next = tabs[(index - 1 + tabs.length) % tabs.length];
      } else if (key === "Home") {
        next = tabs[0];
      } else if (key === "End") {
        next = tabs[tabs.length - 1];
      }
      if (next) {
        event.preventDefault();
        activate(next.getAttribute("data-auth-tab"), true);
      }
    });
  });

  // "Create an account" / "Sign in" switch links beneath each form.
  root.querySelectorAll("[data-auth-switch]").forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      activate(link.getAttribute("data-auth-switch"), true);
    });
  });

  /* ---------- PASSWORD SHOW / HIDE ---------- */
  root.querySelectorAll(".auth-toggle-pw").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var wrap = btn.closest(".auth-input-wrap");
      var input = wrap && wrap.querySelector("input");
      if (!input) return;
      var show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.setAttribute("aria-pressed", show ? "true" : "false");
      btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
      var icon = btn.querySelector("i");
      if (icon) {
        icon.classList.toggle("fa-eye", !show);
        icon.classList.toggle("fa-eye-slash", show);
      }
    });
  });

  /* ---------- VALIDATION HELPERS (presentational only) ---------- */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setFieldError(field, message) {
    field.classList.add("has-error");
    field.classList.remove("is-valid");
    var err = field.querySelector(".auth-error");
    var input = field.querySelector("input");
    if (err && message) {
      var label = err.querySelector(".auth-error-text") || err;
      label.textContent = message;
    }
    if (input) input.setAttribute("aria-invalid", "true");
  }

  function setFieldValid(field) {
    field.classList.remove("has-error");
    field.classList.add("is-valid");
    var input = field.querySelector("input");
    if (input) input.removeAttribute("aria-invalid");
  }

  function clearField(field) {
    field.classList.remove("has-error", "is-valid");
    var input = field.querySelector("input");
    if (input) input.removeAttribute("aria-invalid");
  }

  function clearForm(form) {
    form.querySelectorAll(".auth-field, .auth-check-field").forEach(clearField);
    var status = form.querySelector(".auth-status");
    if (status) {
      status.className = "auth-status";
      status.textContent = "";
    }
  }

  function showStatus(form, type, message) {
    var status = form.querySelector(".auth-status");
    if (!status) return;
    status.className = "auth-status is-shown is-" + type;
    status.innerHTML =
      '<i class="fa-solid ' +
      (type === "success" ? "fa-circle-check" : "fa-circle-exclamation") +
      '" aria-hidden="true"></i><span></span>';
    status.querySelector("span").textContent = message;
  }

  function validateField(field) {
    var input = field.querySelector("input");
    if (!input) return true;

    var value = (input.value || "").trim();
    var type = input.getAttribute("data-validate") || input.type;
    var required = input.hasAttribute("required");

    if (required && !value) {
      setFieldError(field, "This field is required.");
      return false;
    }

    if (value && type === "email" && !EMAIL_RE.test(value)) {
      setFieldError(field, "Enter a valid email address.");
      return false;
    }

    if (value && type === "password" && value.length < 6) {
      setFieldError(field, "Use at least 6 characters.");
      return false;
    }

    if (type === "confirm") {
      var form = field.closest(".auth-form");
      var pwInput = form && form.querySelector('input[data-validate="password"]');
      if (pwInput && value !== pwInput.value) {
        setFieldError(field, "Passwords do not match.");
        return false;
      }
    }

    setFieldValid(field);
    return true;
  }

  /* ---------- SUBMIT HANDLING ---------- */
  forms.forEach(function (form) {
    // Live-clear an error once the user starts correcting a field (text inputs
    // live in .auth-field; the required terms checkbox lives in .auth-check-field).
    function liveClear(event) {
      var field = event.target.closest && event.target.closest(".auth-field");
      if (field && field.classList.contains("has-error")) {
        clearField(field);
        return;
      }
      var checkField = event.target.closest && event.target.closest(".auth-check-field");
      if (checkField && event.target.checked) {
        checkField.classList.remove("has-error");
      }
    }
    form.addEventListener("input", liveClear);
    form.addEventListener("change", liveClear);

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var fields = Array.prototype.slice.call(form.querySelectorAll(".auth-field"));
      var firstInvalid = null;
      var allValid = true;

      fields.forEach(function (field) {
        if (!validateField(field)) {
          allValid = false;
          if (!firstInvalid) firstInvalid = field;
        }
      });

      // Required checkboxes (e.g. terms agreement).
      var requiredChecks = Array.prototype.slice.call(
        form.querySelectorAll(".auth-check-field input[required]")
      );
      requiredChecks.forEach(function (cb) {
        var wrap = cb.closest(".auth-check-field");
        if (!cb.checked) {
          allValid = false;
          wrap.classList.add("has-error");
          if (!firstInvalid) firstInvalid = wrap;
        } else {
          wrap.classList.remove("has-error");
        }
      });

      if (!allValid) {
        showStatus(form, "error", "Please fix the highlighted fields and try again.");
        var focusTarget = firstInvalid && firstInvalid.querySelector("input");
        if (focusTarget) focusTarget.focus();
        return;
      }

      // Success (presentational — no real authentication in this demo).
      var isRegister = form.getAttribute("data-auth-panel") === "register";
      showStatus(
        form,
        "success",
        isRegister
          ? "Account created. Redirecting you to your dashboard…"
          : "Signed in successfully. Redirecting…"
      );

      var btn = form.querySelector(".auth-submit");
      if (btn) {
        btn.disabled = true;
        btn.style.opacity = "0.75";
      }
    });
  });

  // Reflect the initially-selected tab into panel visibility on load.
  var initial = (segment && segment.getAttribute("data-active")) || "signin";
  activate(initial, false);
})();