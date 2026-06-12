/* =====================================================================
   SHOP / PRODUCT ARCHIVE — page JS
   - Mobile filter drawer (mirrors the .mobile-drawer pattern from
     script.js: toggle .open, body scroll lock, Escape + backdrop close)
   - Presentational selection: size pills, color swatches, sort
   - Active-filter chips remove + clear all (presentational)
   Shared header/drawer/quick-view interactions stay in script.js.
   ===================================================================== */
(function () {
  "use strict";

  var body = document.body;

  /* ---- Mobile filter drawer ------------------------------------- */
  var filterDrawer = document.querySelector(".shop-sidebar");
  var filterOverlay = document.querySelector(".shop-drawer-overlay");
  var openButtons = document.querySelectorAll(".shop-filters-btn");
  var closeButtons = document.querySelectorAll(".shop-filter-close, .shop-apply-filters");

  function setFilterDrawer(open) {
    if (!filterDrawer) return;
    filterDrawer.classList.toggle("open", open);
    filterDrawer.setAttribute("aria-hidden", String(!open));
    if (filterOverlay) filterOverlay.classList.toggle("open", open);
    // reuse the shared scroll-lock class so behaviour matches the menu drawer
    body.classList.toggle("drawer-open", open);

    if (open) {
      window.setTimeout(function () {
        var firstClose = filterDrawer.querySelector(".shop-filter-close");
        if (firstClose) firstClose.focus();
      }, 120);
    } else if (openButtons.length) {
      // return focus to the toolbar trigger
      openButtons[0].focus();
    }
  }

  openButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      setFilterDrawer(true);
    });
  });

  closeButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      setFilterDrawer(false);
    });
  });

  // Backdrop click closes
  if (filterOverlay) {
    filterOverlay.addEventListener("click", function () {
      setFilterDrawer(false);
    });
  }

  // Escape closes (only when the drawer is actually open as a drawer)
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && filterDrawer && filterDrawer.classList.contains("open")) {
      setFilterDrawer(false);
    }
  });

  /* ---- Size pills (presentational toggle) ----------------------- */
  document.querySelectorAll(".shop-pill").forEach(function (pill) {
    pill.addEventListener("click", function () {
      var pressed = pill.getAttribute("aria-pressed") === "true";
      pill.setAttribute("aria-pressed", String(!pressed));
    });
  });

  /* ---- Color swatches (presentational toggle) ------------------- */
  document.querySelectorAll(".shop-color").forEach(function (sw) {
    sw.addEventListener("click", function () {
      var pressed = sw.getAttribute("aria-pressed") === "true";
      sw.setAttribute("aria-pressed", String(!pressed));
    });
  });

  /* ---- Price range slider (live readout, presentational) -------- */
  var range = document.querySelector(".shop-range input[type='range']");
  var rangeOut = document.querySelector(".shop-range-value strong");
  var maxInput = document.querySelector("#shop-price-max");

  function fmt(n) {
    return "Tk " + Number(n).toLocaleString("en-US");
  }

  function paintRange(el) {
    var min = Number(el.min) || 0;
    var max = Number(el.max) || 100;
    var val = Number(el.value);
    var pct = ((val - min) / (max - min)) * 100;
    el.style.background =
      "linear-gradient(90deg, var(--gold) 0%, var(--gold) " +
      pct +
      "%, var(--border) " +
      pct +
      "%, var(--border) 100%)";
  }

  if (range) {
    paintRange(range);
    range.addEventListener("input", function () {
      paintRange(range);
      if (rangeOut) rangeOut.textContent = fmt(range.value);
      if (maxInput) maxInput.value = range.value;
    });
  }

  // keep the slider in sync if the max number field changes
  if (maxInput && range) {
    maxInput.addEventListener("input", function () {
      var v = Number(maxInput.value);
      if (!Number.isNaN(v)) {
        range.value = Math.min(Math.max(v, Number(range.min)), Number(range.max));
        paintRange(range);
        if (rangeOut) rangeOut.textContent = fmt(range.value);
      }
    });
  }

  /* ---- Sort select (presentational; reorders visible cards) ----- */
  var sortSelect = document.querySelector(".shop-sort select");
  var grid = document.querySelector(".shop-grid");

  function priceOf(card) {
    var el = card.querySelector(".price-now");
    if (!el) return 0;
    var n = Number(el.textContent.replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }

  if (sortSelect && grid) {
    sortSelect.addEventListener("change", function () {
      var cards = Array.prototype.slice.call(grid.querySelectorAll(".product-card"));
      var mode = sortSelect.value;

      // remember original DOM order for "featured"/"newest"
      cards.forEach(function (c, i) {
        if (c.dataset.order === undefined) c.dataset.order = String(i);
      });

      cards.sort(function (a, b) {
        if (mode === "price-asc") return priceOf(a) - priceOf(b);
        if (mode === "price-desc") return priceOf(b) - priceOf(a);
        if (mode === "newest") return Number(b.dataset.order) - Number(a.dataset.order);
        return Number(a.dataset.order) - Number(b.dataset.order); // featured
      });

      cards.forEach(function (c) {
        grid.appendChild(c);
      });
    });
  }

  /* ---- Active-filter chips: remove + clear all (presentational) - */
  var chipBar = document.querySelector(".shop-active-filters");

  function syncClearVisibility() {
    if (!chipBar) return;
    var hasChips = chipBar.querySelectorAll(".shop-chip").length > 0;
    chipBar.hidden = !hasChips;
  }

  if (chipBar) {
    chipBar.addEventListener("click", function (event) {
      var removeBtn = event.target.closest(".shop-chip-x");
      if (removeBtn) {
        var chip = removeBtn.closest(".shop-chip");
        var key = chip ? chip.dataset.filterKey : null;

        // un-press the matching control, if any
        if (key) {
          var ctrl = document.querySelector('[data-filter-key="' + key + '"]');
          if (ctrl && ctrl !== chip) {
            if (ctrl.matches("input")) ctrl.checked = false;
            else ctrl.setAttribute("aria-pressed", "false");
          }
        }
        if (chip) chip.remove();
        syncClearVisibility();
        return;
      }

      if (event.target.closest(".shop-clear-all")) {
        chipBar.querySelectorAll(".shop-chip").forEach(function (c) {
          c.remove();
        });
        // reset all presentational controls
        document
          .querySelectorAll(".shop-pill, .shop-color")
          .forEach(function (el) {
            el.setAttribute("aria-pressed", "false");
          });
        document
          .querySelectorAll(".shop-cat-list input, .shop-avail-list input")
          .forEach(function (el) {
            el.checked = false;
          });
        syncClearVisibility();
      }
    });

    syncClearVisibility();
  }
})();
