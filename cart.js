/* ============================================================
   Haya BD — Cart page (cart.js)
   Presentational cart logic: quantity steppers update line totals
   + subtotal live, remove item, coupon apply (HAYA10 = 10% off),
   recalc estimated total, empty-cart state toggle.
   No backend — all client-side, guarded with optional chaining.
   ============================================================ */
(function () {
  "use strict";

  var cart = document.querySelector("[data-cart]");
  if (!cart) return;

  /* ---- Config ---------------------------------------------------- */
  var SHIPPING_THRESHOLD = 2000; // free delivery over Tk 2,000
  var SHIPPING_FLAT = 80; // flat shipping below threshold
  var COUPONS = { HAYA10: 0.1 }; // code -> fractional discount

  var discountRate = 0; // currently applied coupon rate
  var appliedCode = ""; // currently applied coupon code

  /* ---- Element refs --------------------------------------------- */
  var listRegion = cart.querySelector("[data-cart-list]");
  var emptyState = cart.querySelector("[data-cart-empty]");
  var layout = cart.querySelector("[data-cart-layout]");

  var subtotalEl = cart.querySelector("[data-sum-subtotal]");
  var shippingEl = cart.querySelector("[data-sum-shipping]");
  var discountRow = cart.querySelector("[data-sum-discount-row]");
  var discountEl = cart.querySelector("[data-sum-discount]");
  var totalEl = cart.querySelector("[data-sum-total]");
  var countEls = cart.querySelectorAll("[data-cart-count]");

  var couponForm = cart.querySelector("[data-coupon-form]");
  var couponInput = cart.querySelector("[data-coupon-input]");
  var couponFeedback = cart.querySelector("[data-coupon-feedback]");
  var liveRegion = cart.querySelector("[data-cart-live]");

  /* ---- Helpers --------------------------------------------------- */
  function formatTk(n) {
    // Round to whole taka, group thousands with commas.
    var rounded = Math.round(n);
    return "Tk " + rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function announce(msg) {
    if (liveRegion) liveRegion.textContent = msg;
  }

  function getRows() {
    return Array.prototype.slice.call(cart.querySelectorAll("[data-cart-item]"));
  }

  /* ---- Per-row line total ---------------------------------------- */
  function updateLine(row) {
    if (!row) return 0;
    var price = parseFloat(row.getAttribute("data-price")) || 0;
    var input = row.querySelector("[data-qty-input]");
    var qty = parseInt(input && input.value, 10);
    if (!qty || qty < 1) qty = 1;
    if (qty > 99) qty = 99;
    if (input) input.value = qty;

    var lineTotal = price * qty;
    var lineEl = row.querySelector("[data-line-total]");
    if (lineEl) lineEl.textContent = formatTk(lineTotal);
    return lineTotal;
  }

  /* ---- Recalculate the whole cart -------------------------------- */
  function recalc() {
    var rows = getRows();
    var subtotal = 0;
    var units = 0;

    rows.forEach(function (row) {
      subtotal += updateLine(row);
      var input = row.querySelector("[data-qty-input]");
      units += parseInt(input && input.value, 10) || 0;
    });

    // Empty cart?
    if (rows.length === 0) {
      showEmpty();
      return;
    }

    // Round each component once, then derive the total from the rounded parts
    // so the displayed column always reconciles (Subtotal − Discount + Shipping = Total).
    var subtotalR = Math.round(subtotal);
    var discountR = Math.round(subtotal * discountRate);
    var afterDiscount = subtotalR - discountR;
    var shipping = afterDiscount >= SHIPPING_THRESHOLD || afterDiscount <= 0 ? 0 : SHIPPING_FLAT;
    var total = afterDiscount + shipping;

    if (subtotalEl) subtotalEl.textContent = formatTk(subtotalR);

    if (shippingEl) {
      shippingEl.textContent = shipping === 0 ? "Free" : formatTk(shipping);
      shippingEl.classList.toggle("is-free", shipping === 0);
    }

    if (discountRow) discountRow.hidden = discountRate === 0;
    if (discountEl) discountEl.textContent = "− " + formatTk(discountR); // minus sign

    if (totalEl) totalEl.textContent = formatTk(total);

    countEls.forEach(function (el) {
      el.textContent = String(units);
    });
  }

  /* ---- Empty state ----------------------------------------------- */
  function showEmpty() {
    if (layout) layout.hidden = true;
    if (emptyState) emptyState.hidden = false;
    countEls.forEach(function (el) {
      el.textContent = "0";
    });
    announce("Your cart is now empty.");
  }

  /* ---- Remove a line item ---------------------------------------- */
  function removeRow(row) {
    if (!row) return;
    var name = row.getAttribute("data-name") || "Item";
    row.parentNode && row.parentNode.removeChild(row);
    announce(name + " removed from your cart.");
    recalc();
  }

  /* ---- Coupon ---------------------------------------------------- */
  function setFeedback(msg, state) {
    if (!couponFeedback) return;
    couponFeedback.textContent = msg;
    couponFeedback.classList.remove("is-ok", "is-error");
    if (state) couponFeedback.classList.add(state);
  }

  function applyCoupon() {
    var raw = (couponInput && couponInput.value ? couponInput.value : "").trim().toUpperCase();

    if (!raw) {
      setFeedback("Please enter a promo code.", "is-error");
      return;
    }

    if (raw === appliedCode) {
      setFeedback("That code is already applied.", "is-error");
      return;
    }

    if (Object.prototype.hasOwnProperty.call(COUPONS, raw)) {
      discountRate = COUPONS[raw];
      appliedCode = raw;
      setFeedback("Code “" + raw + "” applied — " + Math.round(discountRate * 100) + "% off.", "is-ok");
      announce("Promo code " + raw + " applied. " + Math.round(discountRate * 100) + " percent off.");
    } else {
      discountRate = 0;
      appliedCode = "";
      setFeedback("“" + raw + "” is not a valid code.", "is-error");
      announce("Invalid promo code.");
    }
    recalc();
  }

  /* ---- Event wiring (delegated) ---------------------------------- */
  cart.addEventListener("click", function (e) {
    var stepBtn = e.target.closest && e.target.closest("[data-qty-step]");
    if (stepBtn) {
      var row = stepBtn.closest("[data-cart-item]");
      var input = row && row.querySelector("[data-qty-input]");
      if (input) {
        var dir = parseInt(stepBtn.getAttribute("data-qty-step"), 10) || 0;
        var val = (parseInt(input.value, 10) || 1) + dir;
        if (val < 1) val = 1;
        if (val > 99) val = 99;
        input.value = val;
        recalc();
      }
      return;
    }

    var removeBtn = e.target.closest && e.target.closest("[data-remove]");
    if (removeBtn) {
      removeRow(removeBtn.closest("[data-cart-item]"));
      return;
    }
  });

  // Typing / pasting directly into a qty input
  cart.addEventListener("input", function (e) {
    if (e.target && e.target.matches && e.target.matches("[data-qty-input]")) {
      recalc();
    }
  });

  // Sanitise on blur (empty -> 1)
  cart.addEventListener(
    "blur",
    function (e) {
      if (e.target && e.target.matches && e.target.matches("[data-qty-input]")) {
        if (!parseInt(e.target.value, 10)) e.target.value = 1;
        recalc();
      }
    },
    true
  );

  if (couponForm) {
    couponForm.addEventListener("submit", function (e) {
      e.preventDefault();
      applyCoupon();
    });
  }

  /* ---- Init ------------------------------------------------------ */
  recalc();
})();
