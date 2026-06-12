/* =====================================================================
   CHECKOUT.JS — Checkout page interactions (presentational only)
   - Payment-method radio-card selection (visual state sync)
   - Shipping radio-card selection (visual state sync)
   - "Ship to different address" toggle reveals the 2nd address block
   - Coupon apply (cosmetic feedback)
   - Basic required-field VISUAL validation on submit (no real payment)
   All lookups are null-guarded so the file is safe to load anywhere.
   ===================================================================== */
(function () {
  "use strict";

  var form = document.querySelector("[data-checkout-form]");
  if (!form) return;

  /* -------------------------------------------------------------------
     1) RADIO CARDS — sync the .is-selected class for both the shipping
        and payment groups. CSS also handles this via :has(), but we set
        the class explicitly for browsers without :has() support and for
        clear, deterministic state.
     ------------------------------------------------------------------- */
  function syncRadioGroup(groupName) {
    var inputs = form.querySelectorAll('input[name="' + groupName + '"]');
    inputs.forEach(function (input) {
      var card = input.closest(".co-radio-card");
      if (!card) return;
      card.classList.toggle("is-selected", input.checked);
    });
  }

  ["shipping_method", "payment_method"].forEach(function (groupName) {
    var inputs = form.querySelectorAll('input[name="' + groupName + '"]');
    if (!inputs.length) return;
    inputs.forEach(function (input) {
      input.addEventListener("change", function () {
        syncRadioGroup(groupName);
      });
    });
    // Initial sync (reflect any pre-checked default)
    syncRadioGroup(groupName);
  });

  /* -------------------------------------------------------------------
     2) SHIP-TO-DIFFERENT-ADDRESS TOGGLE
        Reveals/hides the second address block and toggles `required`
        on its fields so validation stays consistent with what is shown.
     ------------------------------------------------------------------- */
  var shipToggle = form.querySelector("[data-ship-toggle]");
  var shipBlock = form.querySelector("[data-ship-block]");

  function applyShipBlock(isOn) {
    if (!shipBlock) return;
    shipBlock.hidden = !isOn;
    // Mirror required-state onto the revealed fields
    var fields = shipBlock.querySelectorAll("[data-required-when-shipping]");
    fields.forEach(function (field) {
      if (isOn) {
        field.setAttribute("required", "required");
      } else {
        field.removeAttribute("required");
        // Clear any error styling on hide
        var wrap = field.closest(".co-field");
        if (wrap) wrap.classList.remove("has-error");
      }
    });
  }

  if (shipToggle && shipBlock) {
    shipToggle.addEventListener("change", function () {
      applyShipBlock(shipToggle.checked);
    });
    // Initial state
    applyShipBlock(shipToggle.checked);
  }

  /* -------------------------------------------------------------------
     3) COUPON — cosmetic apply feedback (no real discount logic)
     ------------------------------------------------------------------- */
  var couponBtn = form.querySelector("[data-coupon-apply]");
  var couponInput = form.querySelector("[data-coupon-input]");
  var couponMsg = form.querySelector("[data-coupon-applied]");

  if (couponBtn && couponInput && couponMsg) {
    couponBtn.addEventListener("click", function () {
      var code = couponInput.value.trim();
      if (!code) {
        couponMsg.classList.remove("is-shown");
        return;
      }
      var label = couponMsg.querySelector("[data-coupon-code]");
      if (label) label.textContent = code.toUpperCase();
      couponMsg.classList.add("is-shown");
    });
  }

  /* -------------------------------------------------------------------
     4) REQUIRED-FIELD VISUAL VALIDATION ON SUBMIT (presentational)
        Marks empty required fields, the terms checkbox, and surfaces a
        summary banner. Focuses the first invalid control. Prevents the
        (fake) submit so nothing actually posts.
     ------------------------------------------------------------------- */
  var formError = form.querySelector("[data-form-error]");
  var termsCheck = form.querySelector("[data-terms]");
  var termsWrap = form.querySelector("[data-terms-wrap]");

  // Clear a field's error state as soon as the user corrects it
  form.querySelectorAll(".co-field [required], .co-field input, .co-field select, .co-field textarea")
    .forEach(function (field) {
      var evt = field.tagName === "SELECT" ? "change" : "input";
      field.addEventListener(evt, function () {
        var wrap = field.closest(".co-field");
        if (wrap && field.value.trim()) wrap.classList.remove("has-error");
      });
    });

  if (termsCheck && termsWrap) {
    termsCheck.addEventListener("change", function () {
      if (termsCheck.checked) termsWrap.classList.remove("has-error");
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault(); // presentational — never actually submits

    var firstInvalid = null;
    var invalidCount = 0;

    // Validate visible required fields (hidden ship block fields have no
    // `required` unless the toggle is on — handled in step 2).
    var required = form.querySelectorAll("[required]");
    required.forEach(function (field) {
      var wrap = field.closest(".co-field");
      var value = (field.value || "").trim();
      var ok = value.length > 0;

      // Light email shape check (presentational only)
      if (ok && field.type === "email") {
        ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      }

      if (wrap) wrap.classList.toggle("has-error", !ok);
      if (!ok) {
        invalidCount++;
        if (!firstInvalid) firstInvalid = field;
      }
    });

    // Terms checkbox
    if (termsCheck && !termsCheck.checked) {
      if (termsWrap) termsWrap.classList.add("has-error");
      invalidCount++;
      if (!firstInvalid) firstInvalid = termsCheck;
    }

    if (invalidCount > 0) {
      if (formError) {
        formError.classList.add("is-shown");
        var msg = formError.querySelector("[data-form-error-text]");
        if (msg) {
          msg.textContent =
            "Please complete the " +
            invalidCount +
            (invalidCount === 1 ? " highlighted field" : " highlighted fields") +
            " to place your order.";
        }
      }
      if (firstInvalid && typeof firstInvalid.focus === "function") {
        firstInvalid.focus();
        if (typeof firstInvalid.scrollIntoView === "function") {
          firstInvalid.scrollIntoView({ block: "center", behavior: "smooth" });
        }
      }
      return;
    }

    // All good (presentational success state)
    if (formError) formError.classList.remove("is-shown");
    var cta = form.querySelector("[data-place-order]");
    if (cta) {
      cta.disabled = true;
      cta.innerHTML =
        '<i class="fa-solid fa-circle-check" aria-hidden="true"></i> Order Placed';
    }
  });
})();
