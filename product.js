/* =====================================================================
   PRODUCT.JS — Single Product Page (PDP) interactions
   Lens B: Premium Editorial Gallery
   Loaded AFTER script.js. All selectors are scoped to PDP markup and
   guard with optional chaining so this is safe to include site-wide.
   ===================================================================== */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* -----------------------------------------------------------------
     1) GALLERY — thumbnail -> main swap, keyboard nav, hover zoom
     ----------------------------------------------------------------- */
  const stage = document.querySelector(".pdp-stage");
  const stageImg = document.querySelector(".pdp-stage-img");
  const thumbs = Array.from(document.querySelectorAll(".pdp-thumb"));

  function setActiveThumb(thumb) {
    if (!thumb || !stageImg) return;
    const fullSrc = thumb.dataset.full || thumb.querySelector("img")?.src;
    const altText = thumb.dataset.alt || thumb.querySelector("img")?.alt || "";
    if (!fullSrc) return;

    thumbs.forEach((t) => {
      const isCurrent = t === thumb;
      t.setAttribute("aria-current", String(isCurrent));
      t.tabIndex = isCurrent ? 0 : -1;
    });

    if (fullSrc === stageImg.getAttribute("src")) return;

    if (reduceMotion) {
      stageImg.src = fullSrc;
      stageImg.alt = altText;
    } else {
      stage?.classList.add("is-swapping");
      const swap = () => {
        stageImg.src = fullSrc;
        stageImg.alt = altText;
        // reveal on next frame so the opacity transition runs
        requestAnimationFrame(() => stage?.classList.remove("is-swapping"));
      };
      // If the image is already cached it loads instantly; otherwise wait.
      const probe = new Image();
      probe.onload = swap;
      probe.onerror = swap;
      probe.src = fullSrc;
    }
  }

  thumbs.forEach((thumb, index) => {
    thumb.addEventListener("click", () => setActiveThumb(thumb));
    thumb.addEventListener("keydown", (event) => {
      let target = null;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        target = thumbs[(index + 1) % thumbs.length];
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        target = thumbs[(index - 1 + thumbs.length) % thumbs.length];
      } else if (event.key === "Home") {
        target = thumbs[0];
      } else if (event.key === "End") {
        target = thumbs[thumbs.length - 1];
      } else {
        return;
      }
      event.preventDefault();
      target.focus();
      setActiveThumb(target);
    });
  });

  // Hover-zoom: move the transform-origin to follow the cursor.
  if (stage && stageImg && !reduceMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    stage.addEventListener("mouseenter", () => stage.classList.add("is-zooming"));
    stage.addEventListener("mouseleave", () => {
      stage.classList.remove("is-zooming");
      stageImg.style.transformOrigin = "center center";
    });
    stage.addEventListener("mousemove", (event) => {
      const rect = stage.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      stageImg.style.transformOrigin = `${x}% ${y}%`;
    });
  }

  /* -----------------------------------------------------------------
     2) COLOR + SIZE selection (radio-group semantics)
     ----------------------------------------------------------------- */
  function wireChoiceGroup(groupSelector, itemSelector, onSelect) {
    const group = document.querySelector(groupSelector);
    if (!group) return;
    const items = Array.from(group.querySelectorAll(itemSelector));

    function select(item) {
      items.forEach((i) => {
        const on = i === item;
        i.setAttribute("aria-checked", String(on));
        i.tabIndex = on ? 0 : -1;
      });
      onSelect?.(item);
    }

    group.addEventListener("click", (event) => {
      const item = event.target.closest(itemSelector);
      if (item) select(item);
    });

    group.addEventListener("keydown", (event) => {
      const index = items.indexOf(document.activeElement);
      if (index < 0) return;
      let next;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % items.length;
      else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + items.length) % items.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = items.length - 1;
      else return;
      event.preventDefault();
      items[next].focus();
      select(items[next]);
    });
  }

  wireChoiceGroup(".pdp-colors", ".pdp-color", (item) => {
    const out = document.querySelector(".pdp-color-value");
    if (out) out.textContent = item.dataset.colorName || item.getAttribute("aria-label") || "";
  });

  wireChoiceGroup(".pdp-sizes", ".pdp-size", (item) => {
    const out = document.querySelector(".pdp-size-value");
    if (out) out.textContent = item.dataset.size || item.textContent.trim();
  });

  /* -----------------------------------------------------------------
     3) QUANTITY stepper
     ----------------------------------------------------------------- */
  const qtyInput = document.querySelector(".pdp-qty-input");
  const qtyMinus = document.querySelector(".pdp-qty-minus");
  const qtyPlus = document.querySelector(".pdp-qty-plus");
  const QTY_MIN = 1;
  const QTY_MAX = 99;

  function clampQty(value) {
    const n = parseInt(value, 10);
    if (!Number.isFinite(n)) return QTY_MIN;
    return Math.min(QTY_MAX, Math.max(QTY_MIN, n));
  }

  function setQty(value) {
    if (!qtyInput) return;
    qtyInput.value = String(clampQty(value));
  }

  qtyMinus?.addEventListener("click", () => setQty(clampQty(qtyInput?.value) - 1));
  qtyPlus?.addEventListener("click", () => setQty(clampQty(qtyInput?.value) + 1));
  qtyInput?.addEventListener("change", () => setQty(qtyInput.value));
  qtyInput?.addEventListener("blur", () => setQty(qtyInput.value));

  /* -----------------------------------------------------------------
     4) ADD TO CART / BUY NOW / WISHLIST feedback (demo only)
     ----------------------------------------------------------------- */
  function flashButton(btn, addedHtml) {
    if (!btn || btn.dataset.busy) return;
    btn.dataset.busy = "1";
    const original = btn.innerHTML;
    btn.innerHTML = addedHtml;
    window.setTimeout(() => {
      btn.innerHTML = original;
      delete btn.dataset.busy;
    }, 1600);
  }

  document.querySelector(".pdp-add-cart")?.addEventListener("click", (e) => {
    flashButton(e.currentTarget, '<i class="fa-solid fa-check" aria-hidden="true"></i> Added To Cart');
  });

  document.querySelector(".pdp-stickybar-cta")?.addEventListener("click", (e) => {
    flashButton(e.currentTarget, '<i class="fa-solid fa-check" aria-hidden="true"></i> Added');
  });

  document.querySelector(".pdp-buynow")?.addEventListener("click", (e) => {
    flashButton(e.currentTarget, '<i class="fa-solid fa-bolt" aria-hidden="true"></i> Redirecting…');
  });

  document.querySelectorAll(".pdp-wishlist").forEach((wl) => {
    wl.addEventListener("click", () => {
      const pressed = wl.getAttribute("aria-pressed") === "true";
      wl.setAttribute("aria-pressed", String(!pressed));
      const icon = wl.querySelector("i");
      if (icon) icon.className = pressed ? "fa-regular fa-heart" : "fa-solid fa-heart";
    });
  });

  /* -----------------------------------------------------------------
     5) DETAIL TABS (WAI-ARIA tablist pattern)
     ----------------------------------------------------------------- */
  const tablist = document.querySelector(".pdp-tabnav");
  if (tablist) {
    const tabs = Array.from(tablist.querySelectorAll(".pdp-tab"));

    function selectTab(tab, setFocus) {
      tabs.forEach((t) => {
        const selected = t === tab;
        t.setAttribute("aria-selected", String(selected));
        t.tabIndex = selected ? 0 : -1;
        const panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !selected;
      });
      if (setFocus) tab.focus();
    }

    tabs.forEach((tab) => tab.addEventListener("click", () => selectTab(tab, false)));

    tablist.addEventListener("keydown", (event) => {
      const index = tabs.indexOf(document.activeElement);
      if (index < 0) return;
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      else return;
      event.preventDefault();
      selectTab(tabs[next], true);
    });

    // Jump to the Reviews tab from the rating link / review count.
    document.querySelectorAll('[data-pdp-jump="reviews"]').forEach((link) => {
      link.addEventListener("click", (event) => {
        const reviewsTab = tabs.find((t) => t.getAttribute("aria-controls") === "pdp-tab-reviews");
        if (reviewsTab) {
          event.preventDefault();
          selectTab(reviewsTab, false);
          document.getElementById("pdp-tab-reviews")?.scrollIntoView({
            behavior: reduceMotion ? "auto" : "smooth",
            block: "center",
          });
        }
      });
    });
  }

  /* -----------------------------------------------------------------
     6) SIZE-GUIDE dialog (native <dialog> with graceful fallback)
     ----------------------------------------------------------------- */
  const sizeGuideDialog = document.querySelector(".pdp-sizeguide-dialog");
  const sizeGuideOpeners = document.querySelectorAll(".pdp-sizeguide");
  const sizeGuideClose = document.querySelector(".pdp-sizeguide-close");

  sizeGuideOpeners.forEach((opener) => {
    opener.addEventListener("click", (event) => {
      event.preventDefault();
      if (sizeGuideDialog?.showModal) {
        sizeGuideDialog.showModal();
      } else if (sizeGuideDialog) {
        sizeGuideDialog.setAttribute("open", "");
      }
    });
  });

  sizeGuideClose?.addEventListener("click", () => {
    if (sizeGuideDialog?.close) sizeGuideDialog.close();
    else sizeGuideDialog?.removeAttribute("open");
  });

  // Click on backdrop closes the native dialog.
  sizeGuideDialog?.addEventListener("click", (event) => {
    if (event.target === sizeGuideDialog && sizeGuideDialog.close) {
      const rect = sizeGuideDialog.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      if (!inside) sizeGuideDialog.close();
    }
  });

  /* -----------------------------------------------------------------
     7) STICKY MOBILE ADD-TO-CART BAR
     Shows only after the primary buy row scrolls out of view.
     ----------------------------------------------------------------- */
  const stickyBar = document.querySelector(".pdp-stickybar");
  const buyRow = document.querySelector(".pdp-buy");

  if (stickyBar && buyRow && "IntersectionObserver" in window) {
    document.body.classList.add("pdp-has-stickybar");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Visible when the main buy row is NOT in the viewport.
          stickyBar.classList.toggle("is-visible", !entry.isIntersecting);
        });
      },
      { rootMargin: "0px 0px -40% 0px", threshold: 0 }
    );
    observer.observe(buyRow);
  }
})();
